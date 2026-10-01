using BridgeTech.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
// Provides safe, read-only user profiles for administrative and learning views.
public class UsersController(AppDbContext dbContext) : ControllerBase
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
            candidate.GithubUsername,
            candidate.Role,
            candidate.EmailVerified,
            UnreadNotificationCount = candidate.Notifications.Count(notification => !notification.IsRead),
            EnrolledModules = candidate.Enrollments.Select(enrollment => new { enrollment.ModuleId, enrollment.ProgressPercent, ModuleTitle = enrollment.Module.Title }).ToList(),
            CertificatesEarned = candidate.Certificates.Count()
        }).SingleOrDefaultAsync(cancellationToken);
        return user is null ? NotFound() : Ok(user);
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