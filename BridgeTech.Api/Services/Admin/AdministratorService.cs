using System.Security.Cryptography;
using BridgeTech.Api.Common.Exceptions;
using BridgeTech.Api.Data;
using BridgeTech.Api.Domain.Entities;
using BridgeTech.Api.Domain.Enums;
using BridgeTech.Api.DTOs.Admin;
using BridgeTech.Api.Services.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace BridgeTech.Api.Services.Admin;

// Manages the staff accounts (administrators, content managers, reviewers) behind the
// Administrators page. Staff are ordinary rows in "users" with a non-student role.
//
// Rules enforced here, regardless of what the frontend sends:
//  - the caller is re-checked against the database (a stale JWT can't act as an admin);
//  - super administrator accounts can't be created, edited or deactivated through this API;
//  - nobody can change their own role or status (no self-lockout or self-promotion);
//  - email addresses are unique, case-insensitively.
public class AdministratorService(
    AppDbContext context,
    IPasswordHasher<User> passwordHasher,
    IEmailService emailService,
    IConfiguration configuration,
    ILogger<AdministratorService> logger) : IAdministratorService
{
    private sealed record Actor(Guid UserId, UserRole Role);

    public IReadOnlyList<AdminRoleResponse> GetRoles() =>
        AdminRoleCatalog.Assignable
            .Select(r => new AdminRoleResponse { Name = r.Name, Description = r.Description })
            .ToList();

    public async Task<AdministratorListResponse> ListAsync(Guid actingUserId, AdministratorListQuery query, CancellationToken cancellationToken)
    {
        await RequireActorAsync(actingUserId, cancellationToken);

        var staff = context.Users.AsNoTracking().Where(u => u.Role != UserRole.Student);
        var filtered = staff;

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var pattern = LikePattern.Contains(query.Search);
            filtered = filtered.Where(u =>
                EF.Functions.ILike(u.FirstName + " " + u.LastName, pattern) ||
                EF.Functions.ILike(u.Email, pattern));
        }

        if (!string.IsNullOrWhiteSpace(query.Role))
        {
            if (!AdminRoleCatalog.TryParseAny(query.Role, out var role))
            {
                throw AdminManagementException.BadRequest("INVALID_ROLE", "Role must be Administrator, Content manager, Reviewer or Super administrator.");
            }
            filtered = filtered.Where(u => u.Role == role);
        }

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            var isActive = ParseStatus(query.Status);
            filtered = filtered.Where(u => u.IsActive == isActive);
        }

        var total = await staff.CountAsync(cancellationToken);
        var active = await staff.CountAsync(u => u.IsActive, cancellationToken);
        var filteredCount = await filtered.CountAsync(cancellationToken);

        var rows = await filtered
            .OrderBy(u => u.FirstName).ThenBy(u => u.LastName).ThenBy(u => u.Email)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(u => new AdministratorRow(u.UserId, u.FirstName, u.LastName, u.Email, u.Role, u.IsActive, u.LastLoginAt))
            .ToListAsync(cancellationToken);

        var now = DateTimeOffset.UtcNow;

        return new AdministratorListResponse
        {
            Items = rows.Select(r => ToResponse(r, actingUserId, now)).ToList(),
            Page = query.Page,
            PageSize = query.PageSize,
            FilteredCount = filteredCount,
            TotalAdministrators = total,
            ActiveCount = active,
            InactiveCount = total - active
        };
    }

    public async Task<AdministratorResponse> GetAsync(Guid actingUserId, Guid administratorId, CancellationToken cancellationToken)
    {
        await RequireActorAsync(actingUserId, cancellationToken);

        var row = await context.Users.AsNoTracking()
            .Where(u => u.UserId == administratorId && u.Role != UserRole.Student)
            .Select(u => new AdministratorRow(u.UserId, u.FirstName, u.LastName, u.Email, u.Role, u.IsActive, u.LastLoginAt))
            .SingleOrDefaultAsync(cancellationToken)
            ?? throw NotFound();

        return ToResponse(row, actingUserId, DateTimeOffset.UtcNow);
    }

    public async Task<CreateAdministratorResponse> CreateAsync(Guid actingUserId, SaveAdministratorRequest request, CancellationToken cancellationToken)
    {
        await RequireActorAsync(actingUserId, cancellationToken);

        var role = ParseAssignableRole(request.Role);
        var isActive = ParseStatus(request.Status);
        var (firstName, lastName) = SplitName(request.Name);
        var email = NormaliseEmail(request.Email);

        await EnsureEmailAvailableAsync(email, Guid.Empty, cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var user = new User
        {
            UserId = Guid.NewGuid(),
            Username = await GenerateUsernameAsync(email, cancellationToken),
            FirstName = firstName,
            LastName = lastName,
            Email = email,
            Role = role,
            IsActive = isActive,
            // The administrator vouches for the address; the invitation email proves the owner can read it.
            EmailVerified = true,
            AccountSetupRequired = false,
            CreatedAt = now,
            UpdatedAt = now
        };
        // Nobody knows this password. The invitee sets their own through "Forgot password".
        user.PasswordHash = passwordHasher.HashPassword(user, Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)));

        context.Users.Add(user);
        await SaveAsync(cancellationToken);

        logger.LogInformation("Administrator {ActorId} created {Role} account {UserId} (active: {IsActive}).", actingUserId, role, user.UserId, isActive);

        var response = new CreateAdministratorResponse();
        Fill(response, new AdministratorRow(user.UserId, user.FirstName, user.LastName, user.Email, user.Role, user.IsActive, null), actingUserId, now);

        if (!isActive)
        {
            response.InvitationMessage = "Account created as inactive, so no invitation was sent.";
            return response;
        }

        try
        {
            await SendInvitationAsync(user, cancellationToken);
            response.InvitationSent = true;
            response.InvitationMessage = $"Invitation sent to {user.Email}.";
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            logger.LogWarning(exception, "Account {UserId} was created but the invitation email failed.", user.UserId);
            response.InvitationMessage = "Account created, but the invitation email could not be sent. Use \"resend invitation\" once email is working.";
        }

        return response;
    }

    public async Task<AdministratorResponse> UpdateAsync(Guid actingUserId, Guid administratorId, SaveAdministratorRequest request, CancellationToken cancellationToken)
    {
        await RequireActorAsync(actingUserId, cancellationToken);

        var user = await context.Users.SingleOrDefaultAsync(u => u.UserId == administratorId && u.Role != UserRole.Student, cancellationToken)
            ?? throw NotFound();

        RejectIfSuperAdmin(user);

        var role = ParseAssignableRole(request.Role);
        var isActive = ParseStatus(request.Status);
        var (firstName, lastName) = SplitName(request.Name);
        var email = NormaliseEmail(request.Email);

        if (user.UserId == actingUserId && (role != user.Role || isActive != user.IsActive))
        {
            throw AdminManagementException.Forbidden("SELF_MODIFICATION", "You can't change your own role or status. Ask another administrator to do it.");
        }

        if (!string.Equals(email, user.Email, StringComparison.OrdinalIgnoreCase))
        {
            await EnsureEmailAvailableAsync(email, user.UserId, cancellationToken);
        }

        var previousRole = user.Role;
        var previousActive = user.IsActive;

        user.FirstName = firstName;
        user.LastName = lastName;
        user.Email = email;
        user.Role = role;
        user.IsActive = isActive;
        user.UpdatedAt = DateTimeOffset.UtcNow;

        await SaveAsync(cancellationToken);

        logger.LogInformation(
            "Administrator {ActorId} updated {UserId}: role {PreviousRole} -> {Role}, active {PreviousActive} -> {IsActive}.",
            actingUserId, user.UserId, previousRole, role, previousActive, isActive);

        return ToResponse(
            new AdministratorRow(user.UserId, user.FirstName, user.LastName, user.Email, user.Role, user.IsActive, user.LastLoginAt),
            actingUserId,
            DateTimeOffset.UtcNow);
    }

    public async Task<InvitationResponse> ResendInvitationAsync(Guid actingUserId, Guid administratorId, CancellationToken cancellationToken)
    {
        await RequireActorAsync(actingUserId, cancellationToken);

        var user = await context.Users.AsNoTracking()
            .SingleOrDefaultAsync(u => u.UserId == administratorId && u.Role != UserRole.Student, cancellationToken)
            ?? throw NotFound();

        RejectIfSuperAdmin(user);

        if (!user.IsActive)
        {
            throw AdminManagementException.Conflict("ACCOUNT_INACTIVE", "Activate this account before sending an invitation.");
        }

        if (user.LastLoginAt is not null)
        {
            throw AdminManagementException.Conflict("ALREADY_SIGNED_IN", "This person has already signed in, so there's nothing to resend.");
        }

        try
        {
            await SendInvitationAsync(user, cancellationToken);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            logger.LogWarning(exception, "Resending the invitation to {UserId} failed.", user.UserId);
            throw AdminManagementException.BadGateway("EMAIL_FAILED", "The invitation email could not be sent. Check the email configuration and try again.");
        }

        return new InvitationResponse { Sent = true, Message = $"Invitation sent to {user.Email}." };
    }

    // ---------- helpers ----------

    private async Task<Actor> RequireActorAsync(Guid actingUserId, CancellationToken cancellationToken)
    {
        var actor = await context.Users.AsNoTracking()
            .Where(u => u.UserId == actingUserId)
            .Select(u => new { u.UserId, u.Role, u.IsActive })
            .SingleOrDefaultAsync(cancellationToken);

        if (actor is null || !actor.IsActive || actor.Role is not (UserRole.Admin or UserRole.SuperAdmin))
        {
            throw AdminManagementException.Forbidden("INSUFFICIENT_ROLE", "Only active administrators can manage the administrator team.");
        }

        return new Actor(actor.UserId, actor.Role);
    }

    private static void RejectIfSuperAdmin(User user)
    {
        if (user.Role == UserRole.SuperAdmin)
        {
            throw AdminManagementException.Forbidden("SUPERADMIN_PROTECTED", "Super administrator accounts can't be changed from this page.");
        }
    }

    private static AdminManagementException NotFound() =>
        AdminManagementException.NotFound("ADMIN_NOT_FOUND", "Administrator not found.");

    private static UserRole ParseAssignableRole(string? name)
    {
        if (!AdminRoleCatalog.TryParseAssignable(name, out var role))
        {
            throw AdminManagementException.BadRequest("INVALID_ROLE", "Role must be Administrator, Content manager or Reviewer.");
        }
        return role;
    }

    private static bool ParseStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status) || string.Equals(status.Trim(), "Active", StringComparison.OrdinalIgnoreCase)) return true;
        if (string.Equals(status.Trim(), "Inactive", StringComparison.OrdinalIgnoreCase)) return false;
        throw AdminManagementException.BadRequest("INVALID_STATUS", "Status must be Active or Inactive.");
    }

    // "Mary Ann Smith" -> first "Mary", last "Ann Smith". The full name round-trips unchanged.
    private static (string First, string Last) SplitName(string name)
    {
        var parts = name.Split((char[]?)null, 2, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (parts.Length == 0)
        {
            throw AdminManagementException.BadRequest("INVALID_NAME", "Enter a name.");
        }
        return (parts[0], parts.Length > 1 ? parts[1] : string.Empty);
    }

    private static string NormaliseEmail(string email) => email.Trim().ToLowerInvariant();

    private async Task EnsureEmailAvailableAsync(string email, Guid exceptUserId, CancellationToken cancellationToken)
    {
        var taken =
            await context.Users.AnyAsync(u => u.UserId != exceptUserId && u.Email.ToLower() == email, cancellationToken) ||
            await context.PendingRegistrations.AnyAsync(p => p.Email.ToLower() == email, cancellationToken);

        if (taken)
        {
            throw AdminManagementException.Conflict("EMAIL_IN_USE", "An account with this email address already exists.");
        }
    }

    private async Task<string> GenerateUsernameAsync(string email, CancellationToken cancellationToken)
    {
        var local = email.Split('@')[0];
        var cleaned = new string(local.Where(c => c is (>= 'a' and <= 'z') or (>= '0' and <= '9') or '.' or '_' or '-').ToArray());
        if (cleaned.Length < 3) cleaned += "user";
        var baseName = cleaned.Length > 40 ? cleaned[..40] : cleaned;

        var candidate = baseName;
        var suffix = 1;
        while (await context.Users.AnyAsync(u => u.Username == candidate, cancellationToken) ||
               await context.PendingRegistrations.AnyAsync(p => p.Username == candidate, cancellationToken))
        {
            candidate = $"{baseName}{suffix++}";
        }
        return candidate;
    }

    // Two requests can pass the availability check together; the unique index is the final guard.
    private async Task SaveAsync(CancellationToken cancellationToken)
    {
        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            throw AdminManagementException.Conflict("EMAIL_IN_USE", "An account with this email address or username already exists.");
        }
    }

    private Task SendInvitationAsync(User user, CancellationToken cancellationToken)
    {
        var baseUrl = (configuration["Frontend:BaseUrl"] ?? "http://localhost:5173").TrimEnd('/');
        return emailService.SendAdministratorInvitationAsync(
            user.Email,
            user.FirstName,
            AdminRoleCatalog.LabelFor(user.Role),
            $"{baseUrl}/forgot-password",
            $"{baseUrl}/login",
            cancellationToken);
    }

    private sealed record AdministratorRow(Guid UserId, string FirstName, string LastName, string Email, UserRole Role, bool IsActive, DateTimeOffset? LastLoginAt);

    private static AdministratorResponse ToResponse(AdministratorRow row, Guid actingUserId, DateTimeOffset now)
    {
        var response = new AdministratorResponse();
        Fill(response, row, actingUserId, now);
        return response;
    }

    private static void Fill(AdministratorResponse target, AdministratorRow row, Guid actingUserId, DateTimeOffset now)
    {
        target.Id = row.UserId;
        target.Name = $"{row.FirstName} {row.LastName}".Trim();
        target.Email = row.Email;
        target.Role = AdminRoleCatalog.LabelFor(row.Role);
        target.Status = row.IsActive ? "Active" : "Inactive";
        target.LastActiveAt = row.LastLoginAt;
        target.LastActive = ActivityFormatter.Describe(row.LastLoginAt, now);
        target.Editable = row.Role != UserRole.SuperAdmin;
        target.IsCurrentUser = row.UserId == actingUserId;
    }
}
