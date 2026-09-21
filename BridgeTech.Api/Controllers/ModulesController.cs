using BridgeTech.Api.Services.Modules;
using Microsoft.AspNetCore.Mvc;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Route("api/modules")]
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
}