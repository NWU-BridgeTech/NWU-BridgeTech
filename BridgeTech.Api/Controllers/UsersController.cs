using BridgeTech.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using BridgeTech.Api.Services.Notifications;
using BridgeTech.Api.DTOs.Auth;
using BridgeTech.Api.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
// Provides safe, read-only user profiles for administrative and learning views.
public class UsersController(
    AppDbContext dbContext,
    INotificationService notificationService,
    IPasswordHasher<User> passwordHasher) : ControllerBase
{
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
            candidate.AccountSetupRequired,
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
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId)) return Unauthorized();

        var user = await dbContext.Users.SingleOrDefaultAsync(
            candidate => candidate.UserId == userId,
            cancellationToken);
        if (user is null) return NotFound();

        var email = request.Email.Trim();
        var emailInUse = await dbContext.Users.AnyAsync(
            candidate => candidate.UserId != userId && candidate.Email == email,
            cancellationToken);
        if (emailInUse) return Conflict(new { message = "Email is already in use." });

        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();
        user.Email = email;
        user.PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim();
        user.Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim();
        user.University = string.IsNullOrWhiteSpace(request.University) ? null : request.University.Trim();
        user.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("me/password")]
    public async Task<IActionResult> ChangePassword(
        ChangePasswordRequest request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId)) return Unauthorized();

        var user = await dbContext.Users.SingleOrDefaultAsync(
            candidate => candidate.UserId == userId,
            cancellationToken);
        if (user is null) return NotFound();

        var passwordResult = passwordHasher.VerifyHashedPassword(
            user,
            user.PasswordHash,
            request.CurrentPassword);
        if (passwordResult == PasswordVerificationResult.Failed)
            return BadRequest(new { message = "Current password is incorrect." });

        user.PasswordHash = passwordHasher.HashPassword(user, request.NewPassword);
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpPost("me/setup/complete")]
    public async Task<IActionResult> CompleteAccountSetup(CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId)) return Unauthorized();

        var user = await dbContext.Users.SingleOrDefaultAsync(candidate => candidate.UserId == userId, cancellationToken);
        if (user is null) return NotFound();

        user.AccountSetupRequired = false;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        await notificationService.NotifyAsync(
            user.UserId,
            "account_setup_completed",
            "Account setup complete",
            "Your BridgeTech workspace is ready.",
            cancellationToken: cancellationToken);
        return NoContent();
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