using BridgeTech.Api.Data;
using BridgeTech.Api.Domain.Entities;
using BridgeTech.Api.Domain.Enums;
using BridgeTech.Api.DTOs.Lessons;
using Microsoft.EntityFrameworkCore;
using BridgeTech.Api.Common.Exceptions;
using BridgeTech.Api.Services.Certificates;
using BridgeTech.Api.Services.Badges;

namespace BridgeTech.Api.Services.Lessons;

public class LessonService(
    AppDbContext context,
    ICertificateService certificateService,
    IBadgeService badgeService) : ILessonService
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

        var stubs = await GetLessonStubsAsync(lesson.ModuleId, userId, cancellationToken);
        if (stubs.FindIndex(s => s.LessonId == lessonId) > CurrentIndex(stubs))
            throw new UnauthorizedAccessException("Complete the previous lessons first.");

        if (!await HasPassedLessonQuizAsync(lessonId, userId, cancellationToken))
            throw new QuizNotPassedException();

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

        await badgeService.AwardForLessonCompletionAsync(
            userId, lessonId, cancellationToken);

        if (enrollment.Status == EnrollmentStatus.Completed)
        {
            await certificateService.IssueForCompletionAsync(
                userId, lesson.ModuleId, cancellationToken);
        }

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

    private sealed record LessonStub(Guid LessonId, bool Completed);

    public async Task<LessonViewResponse?> GetCurrentForModuleAsync(
        Guid moduleId, Guid userId, CancellationToken ct)
    {
        await EnsureEnrolledAsync(moduleId, userId, ct);
        var stubs = await GetLessonStubsAsync(moduleId, userId, ct);
        if (stubs.Count == 0) return null;

        // First incomplete lesson, or the last one if the whole course is done
        var current = stubs.FirstOrDefault(s => !s.Completed) ?? stubs[^1];
        return await BuildViewAsync(current.LessonId, moduleId, userId, stubs, ct);
    }

    public async Task<LessonViewResponse?> GetViewAsync(
        Guid lessonId, Guid userId, CancellationToken ct)
    {
        var moduleId = await context.Lessons.AsNoTracking()
            .Where(l => l.LessonId == lessonId)
            .Select(l => (Guid?)l.ModuleId)
            .FirstOrDefaultAsync(ct);
        if (moduleId is null) return null;

        await EnsureEnrolledAsync(moduleId.Value, userId, ct);
        var stubs = await GetLessonStubsAsync(moduleId.Value, userId, ct);
        return await BuildViewAsync(lessonId, moduleId.Value, userId, stubs, ct);
    }

    private async Task EnsureEnrolledAsync(Guid moduleId, Guid userId, CancellationToken ct)
    {
        var enrolled = await context.Enrollments
            .AnyAsync(e => e.ModuleId == moduleId && e.UserId == userId, ct);
        if (!enrolled)
            throw new UnauthorizedAccessException("You are not enrolled in this module.");
    }

    private async Task<List<LessonStub>> GetLessonStubsAsync(
        Guid moduleId, Guid userId, CancellationToken ct) =>
        await context.Lessons.AsNoTracking()
            .Where(l => l.ModuleId == moduleId)
            .OrderBy(l => l.OrderIndex)
            .Select(l => new LessonStub(
                l.LessonId,
                context.LessonProgress.Any(p =>
                    p.LessonId == l.LessonId && p.UserId == userId && p.Completed)))
            .ToListAsync(ct);

    private static int CurrentIndex(List<LessonStub> stubs)
    {
        var i = stubs.FindIndex(s => !s.Completed);
        return i == -1 ? stubs.Count - 1 : i;
    }

    private async Task<bool> HasPassedLessonQuizAsync(Guid lessonId, Guid userId, CancellationToken ct)
    {
        var quiz = await context.Quizzes.AsNoTracking()
            .Where(q => q.LessonId == lessonId)
            .Select(q => new { q.QuizId, q.PassingScore })
            .FirstOrDefaultAsync(ct);

        if (quiz is null) return true; // no quiz linked, so nothing to gate on

        return await context.QuizAttempts.AnyAsync(a =>
            a.UserId == userId && a.QuizId == quiz.QuizId &&
            a.CompletedAt != null && a.Score >= quiz.PassingScore, ct);
    }

    private async Task<LessonViewResponse> BuildViewAsync(
        Guid lessonId, Guid moduleId, Guid userId, List<LessonStub> stubs, CancellationToken ct)
    {
        var index = stubs.FindIndex(s => s.LessonId == lessonId);

        // Block skipping ahead by editing the URL
        if (index > CurrentIndex(stubs))
            throw new UnauthorizedAccessException("Complete the previous lessons first.");

        var lesson = await context.Lessons.AsNoTracking()
            .Include(l => l.VideoSummaries)
            .FirstAsync(l => l.LessonId == lessonId, ct);

        var moduleTitle = await context.Modules.AsNoTracking()
            .Where(m => m.ModuleId == moduleId)
            .Select(m => m.Title)
            .FirstAsync(ct);

        var quiz = await context.Quizzes.AsNoTracking()
            .Where(q => q.LessonId == lessonId)
            .Select(q => new { q.QuizId, q.Title, q.PassingScore })
            .FirstOrDefaultAsync(ct);

        LessonQuizInfo? quizInfo = null;
        if (quiz is not null)
        {
            var best = await context.QuizAttempts
                .Where(a => a.UserId == userId && a.QuizId == quiz.QuizId && a.CompletedAt != null)
                .MaxAsync(a => (short?)a.Score, ct);

            quizInfo = new LessonQuizInfo
            {
                QuizId = quiz.QuizId,
                Title = quiz.Title,
                PassingScore = quiz.PassingScore,
                BestScore = best,
                Passed = best >= quiz.PassingScore
            };
        }

        var video = lesson.VideoSummaries.FirstOrDefault();

        return new LessonViewResponse
        {
            LessonId = lesson.LessonId,
            ModuleId = moduleId,
            ModuleTitle = moduleTitle,
            Title = lesson.Title,
            Content = lesson.Content,
            LessonNumber = index + 1,
            LessonTotal = stubs.Count,
            VideoUrl = video?.VideoUrl,
            AiSummary = video?.AiSummary,
            Completed = stubs[index].Completed,
            CanComplete = quizInfo is null || quizInfo.Passed,
            PreviousLessonId = index > 0 ? stubs[index - 1].LessonId : null,
            NextLessonId = index < stubs.Count - 1 ? stubs[index + 1].LessonId : null,
            Quiz = quizInfo
        };
    }
}