using BridgeTech.Api.DTOs.Admin;

namespace BridgeTech.Api.Services.Admin;

public interface IAdministratorService
{
    IReadOnlyList<AdminRoleResponse> GetRoles();
    Task<AdministratorListResponse> ListAsync(Guid actingUserId, AdministratorListQuery query, CancellationToken cancellationToken);
    Task<AdministratorResponse> GetAsync(Guid actingUserId, Guid administratorId, CancellationToken cancellationToken);
    Task<CreateAdministratorResponse> CreateAsync(Guid actingUserId, SaveAdministratorRequest request, CancellationToken cancellationToken);
    Task<AdministratorResponse> UpdateAsync(Guid actingUserId, Guid administratorId, SaveAdministratorRequest request, CancellationToken cancellationToken);
    Task<InvitationResponse> ResendInvitationAsync(Guid actingUserId, Guid administratorId, CancellationToken cancellationToken);
}
