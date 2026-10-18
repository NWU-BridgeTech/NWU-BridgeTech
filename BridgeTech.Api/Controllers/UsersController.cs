using BridgeTech.Api.Data;
using BridgeTech.Api.DTOs.Auth;
using BridgeTech.Api.DTOs.Users;
using BridgeTech.Api.Domain.Entities;
using BridgeTech.Api.Domain.Enums;
using BridgeTech.Api.Services.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Security.Cryptography;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
// Provides self-service profile settings and safe user profiles for other views.
public class UsersController(
    AppDbContext dbContext,
    IPasswordHasher<User> passwordHasher,
    IEmailService emailService,
    IAuthService authService,
    IConfiguration configuration,
    ILogger<UsersController> logger) : ControllerBase
{
    [HttpGet("staff")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> GetStaff(CancellationToken cancellationToken)
    {
        var isSuperAdmin = User.IsInRole(nameof(UserRole.SuperAdmin));
        var staffQuery = dbContext.Users
            .AsNoTracking()
            .Where(user => isSuperAdmin
                ? user.Role != UserRole.Student
                : user.Role == UserRole.Instructor)
            .OrderBy(user => user.LastName)
            .ThenBy(user => user.FirstName)
            .Select(user => new
            {
                user.UserId,
                user.Username,
                user.FirstName,
                user.LastName,
                user.Email,
                Role = user.Role.ToString(),
                user.AccountSetupRequired
            })
            .ToListAsync(cancellationToken);

        return Ok(await staffQuery);
    }

    [HttpPost("staff")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> CreateStaff(
        CreateStaffUserRequest request,
        CancellationToken cancellationToken)
    {
        var role = request.Role.Trim() switch
        {
            "Instructor" => UserRole.Instructor,
            "Admin" => UserRole.Admin,
            "SuperAdmin" => UserRole.SuperAdmin,
            _ => (UserRole?)null
        };

        if (role is null)
        {
            return BadRequest(new { message = "Choose a valid staff role." });
        }

        if (!User.IsInRole(nameof(UserRole.SuperAdmin)) && role != UserRole.Instructor)
        {
            return Forbid();
        }

        if (role == UserRole.SuperAdmin && !User.IsInRole(nameof(UserRole.SuperAdmin)))
        {
            return Forbid();
        }

        var email = request.Email.Trim().ToLowerInvariant();
        if (await dbContext.Users.AnyAsync(
                user => user.Email.ToLower() == email,
                cancellationToken))
        {
            return Conflict(new { message = "An account with this email already exists." });
        }

        var emailName = email.Split('@')[0];
        var usernameBase = new string(emailName
            .ToLowerInvariant()
            .Where(char.IsLetterOrDigit)
            .ToArray());
        if (usernameBase.Length < 3)
        {
            usernameBase = new string($"{request.FirstName}{request.LastName}"
                .ToLowerInvariant()
                .Where(char.IsLetterOrDigit)
                .ToArray());
        }
        usernameBase = usernameBase[..Math.Min(usernameBase.Length, 40)];
        if (usernameBase.Length < 3)
        {
            usernameBase = $"staff{Guid.NewGuid():N}"[..15];
        }

        var username = usernameBase;
        var suffix = 1;
        while (await dbContext.Users.AnyAsync(
                   user => user.Username.ToLower() == username.ToLower(),
                   cancellationToken))
        {
            var suffixText = (suffix++).ToString();
            username = $"{usernameBase[..Math.Min(usernameBase.Length, 50 - suffixText.Length)]}{suffixText}";
        }

        var now = DateTimeOffset.UtcNow;
        var user = new User
        {
            UserId = Guid.NewGuid(),
            Username = username,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = email,
            PasswordHash = string.Empty,
            Role = role.Value,
            CreatedAt = now,
            UpdatedAt = now,
            EmailVerified = false,
            AccountSetupRequired = true
        };
        var initialPassword = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
        user.PasswordHash = passwordHasher.HashPassword(user, initialPassword);

        dbContext.Users.Add(user);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            return Conflict(new { message = "An account with this email or username already exists." });
        }

        var invitationSent = await SendStaffInvitationAsync(user, cancellationToken);

        return CreatedAtAction(nameof(GetUser), new { userId = user.UserId }, new
        {
            user.UserId,
            user.Username,
            user.FirstName,
            user.LastName,
            user.Email,
            Role = user.Role.ToString(),
            user.AccountSetupRequired,
            InvitationSent = invitationSent
        });
    }

    [HttpPost("staff/{userId:guid}/invitation")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> ResendStaffInvitation(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(
            candidate => candidate.UserId == userId && candidate.Role != UserRole.Student,
            cancellationToken);
        if (user is null) return NotFound();
        if (!user.AccountSetupRequired)
        {
            return Conflict(new { message = "This team account is already active." });
        }

        var invitationSent = await SendStaffInvitationAsync(user, cancellationToken);
        return Ok(new { invitationSent });
    }

    private async Task<bool> SendStaffInvitationAsync(
        User user,
        CancellationToken cancellationToken)
    {
        var invitationToken = await authService.CreateStaffInvitationTokenAsync(
            user.UserId,
            cancellationToken);
        var frontendUrl = configuration["FrontendUrl"]
            ?? configuration["GitHub:FrontendUrl"]
            ?? "http://localhost:5173";
        var invitationUrl =
            $"{frontendUrl.TrimEnd('/')}/accept-invitation?token={Uri.EscapeDataString(invitationToken)}";

        try
        {
            await emailService.SendStaffInvitationAsync(
                user.Email,
                user.FirstName,
                invitationUrl,
                cancellationToken);
            return true;
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            logger.LogError(exception, "Staff invitation could not be sent to {Email}.", user.Email);
            return false;
        }
    }

    [HttpGet("me"), Authorize]
    public async Task<IActionResult> GetCurrentUser(CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId)) return Unauthorized();
        var user = await dbContext.Users.AsNoTracking().Where(candidate => candidate.UserId == userId).Select(candidate => new
        {
            candidate.UserId,
            candidate.Username,
            candidate.FirstName,
            candidate.LastName,
            candidate.Email,
            candidate.PhoneNumber,
            candidate.Address,
            candidate.University,
            candidate.GithubUsername,
            candidate.Role,
            candidate.EmailVerified,
            UnreadNotificationCount = candidate.Notifications.Count(notification => !notification.IsRead),
            EnrolledModules = candidate.Enrollments.Select(enrollment => new { enrollment.ModuleId, enrollment.ProgressPercent, ModuleTitle = enrollment.Module.Title }).ToList(),
            CertificatesEarned = candidate.Certificates.Count()
        }).SingleOrDefaultAsync(cancellationToken);
        return user is null ? NotFound() : Ok(user);
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateCurrentUser(
        UpdateProfileRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        var user = await dbContext.Users
            .SingleOrDefaultAsync(candidate => candidate.UserId == userId, cancellationToken);
        if (user is null) return NotFound();
        if (!string.Equals(user.Email, request.Email.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Email address changes are not available in account settings." });
        }

        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();
        user.PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber)
            ? null
            : request.PhoneNumber.Trim();
        user.Address = string.IsNullOrWhiteSpace(request.Address)
            ? null
            : request.Address.Trim();
        user.University = string.IsNullOrWhiteSpace(request.University)
            ? null
            : request.University.Trim();
        user.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Profile updated successfully." });
    }

    [HttpPost("me/password")]
    public async Task<IActionResult> ChangeCurrentUserPassword(
        ChangePasswordRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        var user = await dbContext.Users
            .SingleOrDefaultAsync(candidate => candidate.UserId == userId, cancellationToken);
        if (user is null) return NotFound();

        var verificationResult = passwordHasher.VerifyHashedPassword(
            user,
            user.PasswordHash,
            request.CurrentPassword);
        if (verificationResult == PasswordVerificationResult.Failed)
        {
            return BadRequest(new { message = "Current password is incorrect." });
        }

        user.PasswordHash = passwordHasher.HashPassword(user, request.NewPassword);
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Password changed successfully." });
    }

    [HttpGet("me/preferences")]
    public async Task<IActionResult> GetPreferences(CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        var preference = await dbContext.UserPreferences
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.UserId == userId, cancellationToken);

        return Ok(ToPreferenceResponse(preference));
    }

    [HttpPut("me/preferences")]
    public async Task<IActionResult> UpdatePreferences(
        UpdateUserPreferenceRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        var theme = request.Theme.Trim().ToLowerInvariant();
        if (theme is not ("system" or "light" or "dark"))
        {
            return BadRequest(new { message = "Theme must be system, light, or dark." });
        }

        var preference = await dbContext.UserPreferences
            .SingleOrDefaultAsync(item => item.UserId == userId, cancellationToken);
        if (preference is null)
        {
            preference = new UserPreference { UserId = userId };
            dbContext.UserPreferences.Add(preference);
        }

        preference.Theme = theme;
        if (request.NotifyNewSubmissions.HasValue)
            preference.NotifyNewSubmissions = request.NotifyNewSubmissions.Value;
        if (request.NotifyQuizCompletions.HasValue)
            preference.NotifyQuizCompletions = request.NotifyQuizCompletions.Value;
        if (request.NotifyPlatformUpdates.HasValue)
            preference.NotifyPlatformUpdates = request.NotifyPlatformUpdates.Value;
        preference.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(ToPreferenceResponse(preference));
    }

    [HttpPut("me/preferences/profile-picture")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<IActionResult> UploadProfilePicture(
        IFormFile file,
        CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        if (file.Length is <= 0 or > 5 * 1024 * 1024)
        {
            return BadRequest(new { message = "Profile pictures must be between 1 byte and 5 MB." });
        }

        var contentType = file.ContentType.ToLowerInvariant();
        if (contentType is not ("image/jpeg" or "image/png" or "image/webp"))
        {
            return BadRequest(new { message = "Profile pictures must be JPEG, PNG, or WebP images." });
        }

        await using var stream = new MemoryStream();
        await file.CopyToAsync(stream, cancellationToken);

        var preference = await dbContext.UserPreferences
            .SingleOrDefaultAsync(item => item.UserId == userId, cancellationToken);
        if (preference is null)
        {
            preference = new UserPreference { UserId = userId };
            dbContext.UserPreferences.Add(preference);
        }

        preference.ProfilePicture = stream.ToArray();
        preference.ProfilePictureContentType = contentType;
        preference.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(ToPreferenceResponse(preference));
    }

    [HttpDelete("me/preferences/profile-picture")]
    public async Task<IActionResult> DeleteProfilePicture(CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        var preference = await dbContext.UserPreferences
            .SingleOrDefaultAsync(item => item.UserId == userId, cancellationToken);
        if (preference is not null)
        {
            preference.ProfilePicture = null;
            preference.ProfilePictureContentType = null;
            preference.UpdatedAt = DateTimeOffset.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return Ok(ToPreferenceResponse(preference));
    }

    private bool TryGetUserId(out Guid userId) =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out userId);

    private static UserPreferenceResponse ToPreferenceResponse(UserPreference? preference)
    {
        var pictureUrl = preference?.ProfilePicture is { Length: > 0 } picture &&
                         preference.ProfilePictureContentType is { Length: > 0 } contentType
            ? $"data:{contentType};base64,{Convert.ToBase64String(picture)}"
            : null;
        return new UserPreferenceResponse(
            preference?.Theme ?? "light",
            pictureUrl,
            preference?.NotifyNewSubmissions ?? true,
            preference?.NotifyQuizCompletions ?? true,
            preference?.NotifyPlatformUpdates ?? true);
    }

    [HttpGet]
    // Password hashes are deliberately excluded from the public projection.
    public async Task<IActionResult> GetUsers(CancellationToken cancellationToken)
    {
        var users = await dbContext.Users
            .AsNoTracking()
            .OrderBy(user => user.Username)
            .Select(user => new
            {
                user.UserId,
                user.Username,
                user.FirstName,
                user.LastName,
                user.Email,
                user.GithubUsername,
                user.Role
            })
            .ToListAsync(cancellationToken);

        return Ok(users);
    }

    [HttpGet("{userId:guid}")]
    // Returns one safe profile or 404 when the user does not exist.
    public async Task<IActionResult> GetUser(Guid userId, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users
            .AsNoTracking()
            .Where(candidate => candidate.UserId == userId)
            .Select(candidate => new
            {
                candidate.UserId,
                candidate.Username,
                candidate.FirstName,
                candidate.LastName,
                candidate.Email,
                candidate.GithubUsername,
                candidate.Role,
                candidate.CreatedAt,
                candidate.UpdatedAt
            })
            .SingleOrDefaultAsync(cancellationToken);

        return user is null ? NotFound() : Ok(user);
    }
}