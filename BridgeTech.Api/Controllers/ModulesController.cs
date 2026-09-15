using BridgeTech.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Route("api/modules")]
// Handles HTTP requests for learning modules. Database access remains in the
// injected context so the controller does not create connections manually.
public class ModulesController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetModules(
        CancellationToken cancellationToken)
    {
        // AsNoTracking is appropriate for a read-only endpoint because EF Core
        // does not need to monitor entities that will not be updated here.
        var modules = await dbContext.Modules
            .AsNoTracking()
            // The order matches the module order_index column in PostgreSQL.
            .OrderBy(module => module.OrderIndex)
            .ToListAsync(cancellationToken);

        return Ok(modules);
    }
}