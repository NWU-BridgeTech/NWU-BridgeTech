using BridgeTech.Api.Data;
using BridgeTech.Api.Domain.Entities;
using BridgeTech.Api.Domain.Enums;
using BridgeTech.Api.DTOs.Lessons;
using Microsoft.EntityFrameworkCore;

namespace BridgeTech.Api.Services.Lessons;

public class LessonService(AppDbContext context) : ILessonService
{
    public async Task<IEnumerable<LessonListItemResponse>> GetLessonsForModuleAsync(
        Guid moduleId, Guid userId, CancellationToken cancellationToken)
    {
        var isEnrolled = await context.Enrollments
            .AnyAsync(e => e.ModuleId == moduleId && e.UserId == userId, cancellationToken);

        if (!isEnrolled)
        {
            throw new UnauthorizedAccessException("You are not enrolled in this module.");
        }

        return await context.Lessons
            .AsNoTracking()
            .Where(l => l.ModuleId == moduleId) 
            .OrderBy(l => l.OrderIndex)
            .Select(l => new LessonListItemResponse
            {
                LessonId = l.LessonId,
                Title = l.Title,
                OrderIndex = l.OrderIndex,
                Completed = context.LessonProgress
                    .Any(p => p.LessonId == l.LessonId && p.UserId == userId && p.Completed)
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<LessonResponse?> GetByIdAsync(
        Guid lessonId, Guid userId, CancellationToken cancellationToken)
    {
        var lesson = await context.Lessons
            .AsNoTracking()
            .Include(l => l.VideoSummaries)
            .FirstOrDefaultAsync(l => l.LessonId == lessonId, cancellationToken);

        if (lesson is null)
        {
            return null;
        }

        var isEnrolled = await context.Enrollments
            .AnyAsync(e => e.ModuleId == lesson.ModuleId && e.UserId == userId, cancellationToken);

        if (!isEnrolled)
        {
            throw new UnauthorizedAccessException("You are not enrolled in this module.");
        }

        var video = lesson.VideoSummaries.FirstOrDefault();

        var completed = await context.LessonProgress
            .AnyAsync(p => p.LessonId == lessonId && p.UserId == userId && p.Completed, cancellationToken);

        return new LessonResponse
        {
            LessonId = lesson.LessonId,
            ModuleId = lesson.ModuleId,
            Title = lesson.Title,
            Content = lesson.Content,
            OrderIndex = lesson.OrderIndex,
            CreatedAt = lesson.CreatedAt,
            UpdatedAt = lesson.UpdatedAt,
            VideoUrl = video?.VideoUrl,
            AiSummary = video?.AiSummary,
            Completed = completed
        };
    }

    public async Task<LessonProgressResponse?> MarkCompleteAsync(
        Guid lessonId, Guid userId, CancellationToken cancellationToken)
    {
        var lesson = await context.Lessons
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.LessonId == lessonId, cancellationToken);

        if (lesson is null)
        {
            return null;
        }

        var enrollment = await context.Enrollments
            .FirstOrDefaultAsync(e => e.ModuleId == lesson.ModuleId && e.UserId == userId, cancellationToken);

        if (enrollment is null)
        {
            throw new UnauthorizedAccessException("You are not enrolled in this module.");
        }

        var progress = await context.LessonProgress
            .FirstOrDefaultAsync(p => p.LessonId == lessonId && p.UserId == userId, cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var wasAlreadyCompleted = progress?.Completed ?? false;

        if (progress is null)
        {
            progress = new LessonProgress
            {
                ProgressId = Guid.NewGuid(),
                UserId = userId,
                LessonId = lessonId,
                Completed = true,
                CompletedAt = now
            };
            context.LessonProgress.Add(progress);
        }
        else
        {
            progress.Completed = true;
            progress.CompletedAt = now;
        }

        var totalLessons = await context.Lessons
            .CountAsync(l => l.ModuleId == lesson.ModuleId, cancellationToken);

        // Count completed lessons already in the DB, then add 1 if this lesson
        // wasn't already marked complete (its row isn't persisted yet at this point).
        var completedInDb = await context.LessonProgress
            .Include(p => p.Lesson)
            .CountAsync(p => p.UserId == userId
                && p.Completed
                && p.Lesson.ModuleId == lesson.ModuleId
                && p.LessonId != lessonId, cancellationToken);

        var completedCount = completedInDb + 1; // +1 for this lesson, always now completed

        enrollment.ProgressPercent = totalLessons > 0
            ? (short)Math.Round((double)completedCount / totalLessons * 100)
            : (short)0;

        if (enrollment.ProgressPercent >= 100 && enrollment.Status != EnrollmentStatus.Completed)
        {
            enrollment.Status = EnrollmentStatus.Completed;
            enrollment.CompletedAt = now;
        }

        await context.SaveChangesAsync(cancellationToken);

        return new LessonProgressResponse
        {
            LessonId = lessonId,
            Completed = true,
            CompletedAt = now,
            ModuleProgressPercent = enrollment.ProgressPercent,
            ModuleStatus = enrollment.Status.ToString()
        };
    }

    public async Task<LessonResponse> CreateAsync(
        Guid moduleId, CreateLessonRequest request, CancellationToken cancellationToken)
    {
        var moduleExists = await context.Modules.AnyAsync(m => m.ModuleId == moduleId, cancellationToken);
        if (!moduleExists)
        {
            throw new InvalidOperationException("Module not found.");
        }

        var lesson = new Lesson
        {
            LessonId = Guid.NewGuid(),
            ModuleId = moduleId,
            Title = request.Title,
            Content = request.Content,
            OrderIndex = request.OrderIndex,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        context.Lessons.Add(lesson);

        if (!string.IsNullOrWhiteSpace(request.VideoUrl))
        {
            context.VideoSummaries.Add(new VideoSummary
            {
                VideoId = Guid.NewGuid(),
                LessonId = lesson.LessonId,
                VideoUrl = request.VideoUrl,
                GeneratedAt = DateTimeOffset.UtcNow
            });
        }

        await context.SaveChangesAsync(cancellationToken);

        return new LessonResponse
        {
            LessonId = lesson.LessonId,
            ModuleId = lesson.ModuleId,
            Title = lesson.Title,
            Content = lesson.Content,
            OrderIndex = lesson.OrderIndex,
            CreatedAt = lesson.CreatedAt,
            UpdatedAt = lesson.UpdatedAt,
            VideoUrl = request.VideoUrl,
            Completed = false
        };
    }
}