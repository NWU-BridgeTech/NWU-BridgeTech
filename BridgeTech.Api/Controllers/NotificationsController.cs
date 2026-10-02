using System.Security.Claims;
using BridgeTech.Api.Services.Notifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BridgeTech.Api.Controllers;

[ApiController, Authorize, Route("api/notifications")]
public class NotificationsController(INotificationService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] bool unreadOnly = false) => Ok(await service.GetAsync(UserId(), unreadOnly));

    [HttpPost("{id:guid}/read")]
    public async Task<IActionResult> Read(Guid id) { await service.MarkReadAsync(UserId(), id); return NoContent(); }

    [HttpPost("read-all")]
    public async Task<IActionResult> ReadAll() { await service.MarkAllReadAsync(UserId()); return NoContent(); }

    private Guid UserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}