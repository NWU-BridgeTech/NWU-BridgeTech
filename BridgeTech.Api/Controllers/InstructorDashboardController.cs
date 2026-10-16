using System.Security.Claims;
using BridgeTech.Api.Services.InstructorDashboard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Route("api/instructor/dashboard")]
[Authorize(Roles = "Instructor")]
public sealed class InstructorDashboardController(IInstructorDashboardService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetDashboard(CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdClaim, out var instructorId))
        {
            throw new UnauthorizedAccessException("User id claim missing or invalid.");
        }

        return Ok(await service.GetDashboardAsync(instructorId, cancellationToken));
    }
}
