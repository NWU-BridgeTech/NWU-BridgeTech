using BridgeTech.Api.Services.AdminDashboard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Route("api/admin/dashboard")]
[Authorize(Roles = "Admin,SuperAdmin")]
public sealed class AdminDashboardController(IAdminDashboardService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetDashboard(CancellationToken cancellationToken)
    {
        var dashboard = await service.GetDashboardAsync(cancellationToken);
        return Ok(dashboard);
    }
}