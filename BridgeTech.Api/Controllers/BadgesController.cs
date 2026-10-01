using System.Security.Claims;
using BridgeTech.Api.Services.Badges;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Route("api/badges")]
[Authorize]
public class BadgesController(IBadgeService service) : ControllerBase
{
    [HttpGet("user/{userId:guid}")]
    public async Task<IActionResult> GetUserBadges(Guid userId, CancellationToken cancellationToken)
    {
        if (!User.IsInRole("Admin") && userId != CurrentUserId()) return Forbid();
        return Ok(await service.GetByUserAsync(userId, cancellationToken));
    }

    private Guid CurrentUserId() => Guid.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
