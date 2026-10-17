using System.Security.Claims;
using BridgeTech.Api.Domain.Enums;
using BridgeTech.Api.DTOs.SupportTickets;
using BridgeTech.Api.Services.Admin;
using BridgeTech.Api.Services.SupportTickets;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Authorize]
public class SupportTicketsController(ISupportTicketService service) : ControllerBase
{
    [HttpPost("api/support-tickets")]
    public async Task<ActionResult<SupportTicketCreatedResponse>> Create(
        CreateSupportTicketRequest request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            return Unauthorized();

        if (!TryParseDefined<SupportTicketCategory>(request.Category, out var category))
            return BadRequest(new { code = "INVALID_CATEGORY", message = "Choose a valid category." });

        var description = request.Description.Trim();
        if (description.Length == 0)
            return BadRequest(new { code = "DESCRIPTION_REQUIRED", message = "Describe the problem before submitting." });

        var id = await service.CreateAsync(userId, category, description, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, new SupportTicketCreatedResponse { Id = id });
    }

    [HttpGet("api/admin/support-tickets")]
    [Authorize(Roles = AdminRoleCatalog.ManagementRoles)]
    public async Task<ActionResult<IReadOnlyList<SupportTicketResponse>>> List(CancellationToken cancellationToken) =>
        Ok(await service.ListAsync(cancellationToken));

    [HttpPatch("api/admin/support-tickets/{supportTicketId:guid}")]
    [Authorize(Roles = AdminRoleCatalog.ManagementRoles)]
    public async Task<IActionResult> UpdateStatus(
        Guid supportTicketId,
        UpdateSupportTicketStatusRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryParseDefined<SupportTicketStatus>(request.Status, out var status))
            return BadRequest(new { code = "INVALID_STATUS", message = "Choose a valid status." });

        return await service.UpdateStatusAsync(supportTicketId, status, cancellationToken)
            ? NoContent()
            : NotFound(new { code = "TICKET_NOT_FOUND", message = "That support ticket no longer exists." });
    }

    private static bool TryParseDefined<TEnum>(string value, out TEnum result) where TEnum : struct, Enum
    {
        var name = Enum.GetNames<TEnum>()
            .FirstOrDefault(n => string.Equals(n, value?.Trim(), StringComparison.OrdinalIgnoreCase));
        result = name is null ? default : Enum.Parse<TEnum>(name);
        return name is not null;
    }
}
