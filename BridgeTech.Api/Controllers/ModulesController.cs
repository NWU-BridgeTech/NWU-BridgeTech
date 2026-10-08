using BridgeTech.Api.DTOs.Modules;
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

    // Admin: every module (drafts included) with lesson and student counts.
    [HttpGet("admin")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> GetModulesForAdmin(CancellationToken cancellationToken)
    {
        return Ok(await service.GetAllForAdminAsync(cancellationToken));
    }

    // Admin: one module's full details.
    [HttpGet("{moduleId:guid}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> GetModule(Guid moduleId, CancellationToken cancellationToken)
    {
        var module = await service.GetByIdAsync(moduleId, cancellationToken);
        return module is null ? NotFound() : Ok(module);
    }

    // Admin: create a new module.
    [HttpPost]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> CreateModule(
        [FromBody] CreateModuleRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var module = await service.CreateAsync(request, cancellationToken);
            return CreatedAtAction(nameof(GetModule), new { moduleId = module.ModuleId }, module);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // Admin: update an existing module. Only the fields that are sent are changed.
    [HttpPut("{moduleId:guid}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> UpdateModule(
        Guid moduleId, [FromBody] UpdateModuleRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var module = await service.UpdateAsync(moduleId, request, cancellationToken);
            return module is null ? NotFound() : Ok(module);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private Guid GetUserId()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(idClaim, out var id)
            ? id
            : throw new UnauthorizedAccessException("User id claim missing or invalid.");
    }
}