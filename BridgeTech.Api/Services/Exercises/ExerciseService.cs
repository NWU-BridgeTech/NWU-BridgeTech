using BridgeTech.Api.Data;
using BridgeTech.Api.Domain.Entities;
using BridgeTech.Api.DTOs.Exercises;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using BridgeTech.Api.Services.Notifications;
using Npgsql;

namespace BridgeTech.Api.Services.Exercises;

public sealed class ExerciseService(AppDbContext db, INotificationService notificationService) : IExerciseService
{
    public async Task<IReadOnlyList<ExerciseListItemResponse>> GetAllAsync(CancellationToken ct = default) =>
        await db.Exercises.AsNoTracking().OrderBy(x => x.CreatedAt)
            .Select(x => new ExerciseListItemResponse { ExerciseId = x.ExerciseId, ModuleId = x.ModuleId, Title = x.Title, VerificationType = x.VerificationType, CreatedAt = x.CreatedAt }).ToListAsync(ct);

    public async Task<ExerciseResponse?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await db.Exercises.AsNoTracking().Where(x => x.ExerciseId == id)
            .Select(x => new ExerciseResponse { ExerciseId = x.ExerciseId, ModuleId = x.ModuleId, Title = x.Title, Description = x.Description, VerificationType = x.VerificationType, VerificationCriteria = x.VerificationCriteria == null ? null : x.VerificationCriteria.RootElement, CreatedAt = x.CreatedAt, ProgressPercentage = 0 }).SingleOrDefaultAsync(ct);

    public async Task<ExerciseResponse> CreateAsync(CreateExerciseRequest r, CancellationToken ct = default)
    {
        var e = new Exercise { ExerciseId = Guid.NewGuid(), ModuleId = r.ModuleId!.Value, Title = r.Title, Description = r.Description, VerificationType = r.VerificationType, VerificationCriteria = r.VerificationCriteria.HasValue ? JsonDocument.Parse(r.VerificationCriteria.Value.GetRawText()) : null, CreatedAt = DateTimeOffset.UtcNow };
        db.Exercises.Add(e); await db.SaveChangesAsync(ct); return ToResponse(e);
    }

    public async Task<ExerciseResponse?> UpdateAsync(Guid id, UpdateExerciseRequest r, CancellationToken ct = default)
    {
        var e = await db.Exercises.SingleOrDefaultAsync(x => x.ExerciseId == id, ct); if (e is null) return null;
        if (r.Title is not null) e.Title = r.Title; if (r.Description is not null) e.Description = r.Description;
        if (r.VerificationType.HasValue) e.VerificationType = r.VerificationType.Value;
        if (r.VerificationCriteria.HasValue) e.VerificationCriteria = JsonDocument.Parse(r.VerificationCriteria.Value.GetRawText());
        await db.SaveChangesAsync(ct); return ToResponse(e);
    }
    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct = default) { var e = await db.Exercises.FindAsync([id], ct); if (e is null) return false; db.Exercises.Remove(e); await db.SaveChangesAsync(ct); return true; }
    public async Task<ExerciseSubmission?> CreateSubmissionAsync(Guid id, Guid userId, string url, CancellationToken ct = default)
    {
        if (!await db.Exercises.AnyAsync(x => x.ExerciseId == id, ct)) return null;
        var s = new ExerciseSubmission { SubmissionId = Guid.NewGuid(), ExerciseId = id, UserId = userId, GithubRepoUrl = url, SubmittedAt = DateTimeOffset.UtcNow };
        db.ExerciseSubmissions.Add(s);
        await db.SaveChangesAsync(ct);
        await notificationService.NotifyAsync(
            userId,
            "exercise_submitted",
            "Exercise submitted",
            "Your GitHub repository submission has been received.",
            id,
            ct);
        return s;
    }
    public Task<ExerciseSubmission?> GetSubmissionAsync(Guid id, CancellationToken ct = default) => db.ExerciseSubmissions.AsNoTracking().SingleOrDefaultAsync(x => x.SubmissionId == id, ct);
    private static ExerciseResponse ToResponse(Exercise x) => new() { ExerciseId = x.ExerciseId, ModuleId = x.ModuleId, Title = x.Title, Description = x.Description, VerificationType = x.VerificationType, VerificationCriteria = x.VerificationCriteria?.RootElement, CreatedAt = x.CreatedAt, ProgressPercentage = 0 };

    
    public async Task<IReadOnlyList<ExerciseResponse>> GetMyExercisesAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        var rows = await db.Exercises
            .AsNoTracking()
            .Where(x => db.Enrollments.Any(en =>
                en.UserId == userId &&
                en.ModuleId == x.ModuleId))
            .OrderBy(x => x.Module.OrderIndex)
            .ThenBy(x => x.CreatedAt)
            .Select(x => new
            {
                x.ExerciseId,
                x.ModuleId,
                ModuleTitle = x.Module.Title,
                x.Title,
                x.Description,
                x.Outcomes,
                x.VerificationType,
                x.CreatedAt,

                CompletedAt = db.ExerciseCompletions
                    .Where(c =>
                        c.UserId == userId &&
                        c.ExerciseId == x.ExerciseId)
                    .Select(c => (DateTimeOffset?)c.CompletedAt)
                    .FirstOrDefault()
            })
            .ToListAsync(ct);

        return rows.Select(x => new ExerciseResponse
        {
            ExerciseId = x.ExerciseId,
            ModuleId = x.ModuleId,
            ModuleTitle = x.ModuleTitle,
            Title = x.Title,
            Description = x.Description,
            Outcomes = x.Outcomes,
            VerificationType = x.VerificationType,
            CreatedAt = x.CreatedAt,

            Completed = x.CompletedAt.HasValue,
            CompletedAt = x.CompletedAt,

            ProgressPercentage =
                x.CompletedAt.HasValue ? 100 : 0
        }).ToList();
    }

    
public async Task<ExerciseCompletion?> MarkCompletedAsync(
    Guid userId,
    Guid exerciseId,
    CancellationToken ct = default)
{
    // Confirm that the student is enrolled
    // in the module containing this exercise.
    var enrolled = await db.Exercises
        .AsNoTracking()
        .AnyAsync(x =>
            x.ExerciseId == exerciseId &&
            db.Enrollments.Any(e =>
                e.UserId == userId &&
                e.ModuleId == x.ModuleId),
            ct);

    if (!enrolled)
        return null;

    // Check whether the student already completed it.
    var existing = await db.ExerciseCompletions
        .AsNoTracking()
        .SingleOrDefaultAsync(x =>
            x.UserId == userId &&
            x.ExerciseId == exerciseId,
            ct);

    if (existing is not null)
        return existing;

    // Create a new completion record.
    var completion = new ExerciseCompletion
    {
        CompletionId = Guid.NewGuid(),
        UserId = userId,
        ExerciseId = exerciseId,
        CompletedAt = DateTimeOffset.UtcNow
    };

    db.ExerciseCompletions.Add(completion);

    try
    {
        await db.SaveChangesAsync(ct);
        return completion;
    }
    catch (DbUpdateException ex) when (
        ex.InnerException is PostgresException pg &&
        pg.SqlState == PostgresErrorCodes.UniqueViolation)
    {
        // Handle simultaneous completion requests.
        db.Entry(completion).State = EntityState.Detached;

        return await db.ExerciseCompletions
            .AsNoTracking()
            .SingleAsync(x =>
                x.UserId == userId &&
                x.ExerciseId == exerciseId,
                ct);
    }
}


}
