using BridgeTech.Api.Services.Modules;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Route("api/modules")]
[Authorize]
// Handles HTTP requests for learning modules. Database access remains in the
// injected context so the controller does not create connections manually.
public class ModulesController(IModuleService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetModules(
        CancellationToken cancellationToken)
    {
        // AsNoTracking is appropriate for a read-only endpoint because EF Core
        // does not need to monitor entities that will not be updated here.
        return Ok(await service.GetAllAsync(cancellationToken));
    }

    [HttpGet("available")]
    public async Task<IActionResult> GetAvailableModules(CancellationToken cancellationToken)
    {
        return Ok(await service.GetAvailableForUserAsync(GetUserId(), cancellationToken));
    }

    private Guid GetUserId()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(idClaim, out var id)
            ? id
            : throw new UnauthorizedAccessException("User id claim missing or invalid.");
    }
}