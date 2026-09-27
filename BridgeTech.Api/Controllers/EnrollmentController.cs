using System.Security.Claims;
using BridgeTech.Api.DTOs.Enrollments;
using BridgeTech.Api.Services.Enrollments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class EnrollmentsController(IEnrollmentService service) : ControllerBase
{
    [HttpGet("user/enrollments")]
    public async Task<IActionResult> GetMyEnrollments(CancellationToken cancellationToken)
    {
        return Ok(await service.GetMyEnrollmentsAsync(GetUserId(), cancellationToken));
    }

    [HttpPost("modules/{moduleId:guid}/enroll")]
    public async Task<IActionResult> Enroll(Guid moduleId, CancellationToken cancellationToken)
    {
        var result = await service.EnrollAsync(GetUserId(), moduleId, cancellationToken);
        return CreatedAtAction(nameof(GetMyEnrollments), null, result);
    }

    private Guid GetUserId()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(idClaim, out var id)
            ? id
            : throw new UnauthorizedAccessException("User id claim missing or invalid.");
    }
}