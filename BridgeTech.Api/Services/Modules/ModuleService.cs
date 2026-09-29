using BridgeTech.Api.Data;
using BridgeTech.Api.Domain.Entities;
using BridgeTech.Api.DTOs.Modules;
using Microsoft.EntityFrameworkCore;

namespace BridgeTech.Api.Services.Modules;

public sealed class ModuleService(AppDbContext db) : IModuleService
{
    public async Task<IReadOnlyList<ModuleListItemResponse>> GetAllAsync(CancellationToken ct = default) =>
        await db.Modules.AsNoTracking().OrderBy(x => x.OrderIndex)
            .Select(x => new ModuleListItemResponse { ModuleId = x.ModuleId, Title = x.Title, OrderIndex = x.OrderIndex, UpdatedAt = x.UpdatedAt })
            .ToListAsync(ct);

    public async Task<ModuleResponse?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await db.Modules.AsNoTracking().Where(x => x.ModuleId == id)
            .Select(x => new ModuleResponse { ModuleId = x.ModuleId, Title = x.Title, Description = x.Description, OrderIndex = x.OrderIndex, CreatedAt = x.CreatedAt, UpdatedAt = x.UpdatedAt })
            .SingleOrDefaultAsync(ct);

    public async Task<ModuleResponse> CreateAsync(CreateModuleRequest r, CancellationToken ct = default)
    {
        var now = DateTimeOffset.UtcNow;
        var entity = new Module { ModuleId = Guid.NewGuid(), Title = r.Title, Description = r.Description, OrderIndex = r.OrderIndex, CreatedAt = now, UpdatedAt = now };
        db.Modules.Add(entity); await db.SaveChangesAsync(ct);
        return ToResponse(entity);
    }

    public async Task<ModuleResponse?> UpdateAsync(Guid id, UpdateModuleRequest r, CancellationToken ct = default)
    {
        var e = await db.Modules.SingleOrDefaultAsync(x => x.ModuleId == id, ct);
        if (e is null) return null;
        if (r.Title is not null) e.Title = r.Title;
        if (r.Description is not null) e.Description = r.Description;
        if (r.OrderIndex.HasValue) e.OrderIndex = r.OrderIndex.Value;
        e.UpdatedAt = DateTimeOffset.UtcNow; await db.SaveChangesAsync(ct);
        return ToResponse(e);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var e = await db.Modules.FindAsync([id], ct); if (e is null) return false;
        db.Modules.Remove(e); await db.SaveChangesAsync(ct); return true;
    }

    private static ModuleResponse ToResponse(Module x) => new() { ModuleId = x.ModuleId, Title = x.Title, Description = x.Description, OrderIndex = x.OrderIndex, CreatedAt = x.CreatedAt, UpdatedAt = x.UpdatedAt };
}
