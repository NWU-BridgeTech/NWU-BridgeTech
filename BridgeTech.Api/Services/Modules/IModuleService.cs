using BridgeTech.Api.DTOs.Modules;

namespace BridgeTech.Api.Services.Modules;

public interface IModuleService
{
    Task<IReadOnlyList<ModuleListItemResponse>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ModuleResponse?> GetByIdAsync(Guid moduleId, CancellationToken cancellationToken = default);
    Task<ModuleResponse> CreateAsync(CreateModuleRequest request, CancellationToken cancellationToken = default);
    Task<ModuleResponse?> UpdateAsync(Guid moduleId, UpdateModuleRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid moduleId, CancellationToken cancellationToken = default);
}
