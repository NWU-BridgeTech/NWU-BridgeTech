using System.Security.Claims;
using BridgeTech.Api.Common.Filters;
using BridgeTech.Api.DTOs.Admin;
using BridgeTech.Api.Services.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Route("api/admin/administrators")]
[Authorize(Roles = AdminRoleCatalog.ManagementRoles)]
[AdminManagementExceptionFilter]
// Backs the admin Administrators page: list, add, edit and deactivate staff accounts.
public class AdministratorsController(IAdministratorService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<AdministratorListResponse>> List(
        [FromQuery] AdministratorListQuery query,
        CancellationToken cancellationToken) =>
        Ok(await service.ListAsync(CurrentUserId(), query, cancellationToken));

    [HttpGet("roles")]
    public ActionResult<IReadOnlyList<AdminRoleResponse>> GetRoles() => Ok(service.GetRoles());

    [HttpGet("{administratorId:guid}")]
    public async Task<ActionResult<AdministratorResponse>> Get(
        Guid administratorId,
        CancellationToken cancellationToken) =>
        Ok(await service.GetAsync(CurrentUserId(), administratorId, cancellationToken));

    [HttpPost]
    public async Task<ActionResult<CreateAdministratorResponse>> Create(
        SaveAdministratorRequest request,
        CancellationToken cancellationToken)
    {
        var created = await service.CreateAsync(CurrentUserId(), request, cancellationToken);
        return CreatedAtAction(nameof(Get), new { administratorId = created.Id }, created);
    }

    [HttpPut("{administratorId:guid}")]
    public async Task<ActionResult<AdministratorResponse>> Update(
        Guid administratorId,
        SaveAdministratorRequest request,
        CancellationToken cancellationToken) =>
        Ok(await service.UpdateAsync(CurrentUserId(), administratorId, request, cancellationToken));

    [HttpPost("{administratorId:guid}/resend-invitation")]
    public async Task<ActionResult<InvitationResponse>> ResendInvitation(
        Guid administratorId,
        CancellationToken cancellationToken) =>
        Ok(await service.ResendInvitationAsync(CurrentUserId(), administratorId, cancellationToken));

    private Guid CurrentUserId() =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            ? id
            : throw new UnauthorizedAccessException("User id claim missing or invalid.");
}
