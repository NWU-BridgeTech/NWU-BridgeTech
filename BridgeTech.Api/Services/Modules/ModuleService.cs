using BridgeTech.Api.Data;
using BridgeTech.Api.Domain.Entities;
using BridgeTech.Api.Domain.Enums;
using BridgeTech.Api.DTOs.Modules;
using Microsoft.EntityFrameworkCore;

namespace BridgeTech.Api.Services.Modules;

public sealed class ModuleService(AppDbContext db) : IModuleService
{
    public async Task<IReadOnlyList<ModuleListItemResponse>> GetAllAsync(CancellationToken ct = default) =>
        await db.Modules.AsNoTracking().Where(x => x.Status == ContentStatus.Published).OrderBy(x => x.OrderIndex)
            .Select(x => new ModuleListItemResponse { ModuleId = x.ModuleId, Title = x.Title, OrderIndex = x.OrderIndex, UpdatedAt = x.UpdatedAt })
            .ToListAsync(ct);

    // Admin list: every module (drafts included) with its lesson and student counts.
    public async Task<IReadOnlyList<ModuleResponse>> GetAllForAdminAsync(CancellationToken ct = default)
    {
        var rows = await db.Modules.AsNoTracking()
            .OrderBy(m => m.OrderIndex)
            .Select(m => new
            {
                Module = m,
                LessonCount = m.Lessons.Count,
                StudentCount = m.Enrollments.Count
            })
            .ToListAsync(ct);

        return rows.Select(r => ToResponse(r.Module, r.LessonCount, r.StudentCount)).ToList();
    }

    public async Task<ModuleResponse?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var row = await db.Modules.AsNoTracking()
            .Where(m => m.ModuleId == id)
            .Select(m => new
            {
                Module = m,
                LessonCount = m.Lessons.Count,
                StudentCount = m.Enrollments.Count
            })
            .SingleOrDefaultAsync(ct);

        return row is null ? null : ToResponse(row.Module, row.LessonCount, row.StudentCount);
    }

    public async Task<ModuleResponse> CreateAsync(CreateModuleRequest r, CancellationToken ct = default)
    {
        var status = Enum.Parse<ContentStatus>(r.Status);

        // A brand-new module has no lessons yet, so it cannot be published straight away.
        if (status == ContentStatus.Published)
            throw new InvalidOperationException("Add lessons to this module before publishing it.");

        // Place the new module after the existing ones unless an order was given.
        var orderIndex = r.OrderIndex
            ?? (short)((await db.Modules.MaxAsync(m => (short?)m.OrderIndex, ct) ?? -1) + 1);

        var now = DateTimeOffset.UtcNow;
        var entity = new Module
        {
            ModuleId = Guid.NewGuid(),
            Title = r.Title.Trim(),
            Description = r.Description?.Trim(),
            OrderIndex = orderIndex,
            Level = Enum.Parse<ModuleLevel>(r.Level),
            Status = status,
            CreatedAt = now,
            UpdatedAt = now
        };

        db.Modules.Add(entity);
        await db.SaveChangesAsync(ct);
        return ToResponse(entity, 0, 0);
    }

    public async Task<ModuleResponse?> UpdateAsync(Guid id, UpdateModuleRequest r, CancellationToken ct = default)
    {
        var e = await db.Modules.SingleOrDefaultAsync(x => x.ModuleId == id, ct);
        if (e is null) return null;

        var lessonCount = await db.Lessons.CountAsync(l => l.ModuleId == id, ct);

        if (r.Status is not null)
        {
            var status = Enum.Parse<ContentStatus>(r.Status);

            // A module needs at least one lesson before students can see it.
            if (status == ContentStatus.Published && lessonCount == 0)
                throw new InvalidOperationException("Add lessons to this module before publishing it.");

            e.Status = status;
        }

        if (r.Title is not null) e.Title = r.Title.Trim();
        if (r.Description is not null) e.Description = r.Description.Trim();
        if (r.OrderIndex.HasValue) e.OrderIndex = r.OrderIndex.Value;
        if (r.Level is not null) e.Level = Enum.Parse<ModuleLevel>(r.Level);

        e.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);

        var studentCount = await db.Enrollments.CountAsync(x => x.ModuleId == id, ct);
        return ToResponse(e, lessonCount, studentCount);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var e = await db.Modules.FindAsync([id], ct); if (e is null) return false;
        db.Modules.Remove(e); await db.SaveChangesAsync(ct); return true;
    }

    private static ModuleResponse ToResponse(Module x, int lessonCount, int studentCount) => new()
    {
        ModuleId = x.ModuleId,
        Title = x.Title,
        Description = x.Description,
        OrderIndex = x.OrderIndex,
        Level = x.Level.ToString(),
        Status = x.Status.ToString(),
        LessonCount = lessonCount,
        StudentCount = studentCount,
        CreatedAt = x.CreatedAt,
        UpdatedAt = x.UpdatedAt
    };

    public async Task<IEnumerable<ModuleListItemResponse>> GetAvailableForUserAsync(
    Guid userId, CancellationToken cancellationToken)
{
    var enrolledModuleIds = await db.Enrollments
        .Where(e => e.UserId == userId)
        .Select(e => e.ModuleId)
        .ToListAsync(cancellationToken);

    var modules = await db.Modules
        .AsNoTracking()
        .Where(m => !enrolledModuleIds.Contains(m.ModuleId) && m.Status == ContentStatus.Published)
        .OrderBy(m => m.OrderIndex)
        .ToListAsync(cancellationToken);

    var results = new List<ModuleListItemResponse>();

    foreach (var m in modules)
    {
        var lessonTitles = await db.Lessons
            .Where(l => l.ModuleId == m.ModuleId && l.Status == ContentStatus.Published)
            .OrderBy(l => l.OrderIndex)
            .Select(l => l.Title)
            .ToListAsync(cancellationToken);

        results.Add(new ModuleListItemResponse
        {
            ModuleId = m.ModuleId,
            Title = m.Title,
            Description = m.Description,
            LessonCount = lessonTitles.Count,
            LessonTitles = lessonTitles,
            OrderIndex = m.OrderIndex,
            UpdatedAt = m.UpdatedAt
        });
    }

    return results;
}
}