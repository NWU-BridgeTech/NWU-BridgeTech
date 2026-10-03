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
            .Where(l => l.ModuleId == moduleId && l.Status == ContentStatus.Published)
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
            .FirstOrDefaultAsync(l => l.LessonId == lessonId && l.Status == ContentStatus.Published, cancellationToken);

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
            .FirstOrDefaultAsync(l => l.LessonId == lessonId && l.Status == ContentStatus.Published, cancellationToken);

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
            .CountAsync(l => l.ModuleId == lesson.ModuleId && l.Status == ContentStatus.Published, cancellationToken);

        // Count completed lessons already in the DB, then add 1 if this lesson
        // wasn't already marked complete (its row isn't persisted yet at this point).
        var completedInDb = await context.LessonProgress
            .Include(p => p.Lesson)
            .CountAsync(p => p.UserId == userId
                && p.Completed
                && p.Lesson.ModuleId == lesson.ModuleId && p.Lesson.Status == ContentStatus.Published
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

    // ---------- Admin: create, list and update lessons ----------

    public async Task<AdminLessonResponse> CreateAsync(
        Guid moduleId, CreateLessonRequest request, CancellationToken cancellationToken)
    {
        var module = await context.Modules.AsNoTracking()
            .FirstOrDefaultAsync(m => m.ModuleId == moduleId, cancellationToken)
            ?? throw new InvalidOperationException("Module not found.");

        var status = Enum.Parse<ContentStatus>(request.Status);
        EnsureCanPublish(status, request.Content, module.Status);

        // Place the lesson after the module's existing lessons unless an order was given.
        var orderIndex = request.OrderIndex
            ?? await NextOrderIndexAsync(moduleId, cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var lesson = new Lesson
        {
            LessonId = Guid.NewGuid(),
            ModuleId = moduleId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            Content = request.Content,
            OrderIndex = orderIndex,
            DurationMinutes = request.DurationMinutes,
            Status = status,
            CreatedAt = now,
            UpdatedAt = now
        };

        context.Lessons.Add(lesson);

        var videoUrl = string.IsNullOrWhiteSpace(request.VideoUrl) ? null : request.VideoUrl;
        if (videoUrl is not null)
        {
            context.VideoSummaries.Add(new VideoSummary
            {
                VideoId = Guid.NewGuid(),
                LessonId = lesson.LessonId,
                VideoUrl = videoUrl,
                GeneratedAt = now
            });
        }

        await context.SaveChangesAsync(cancellationToken);
        return ToAdminResponse(lesson, module.Title, videoUrl);
    }

    public async Task<IReadOnlyList<AdminLessonResponse>> GetAllForAdminAsync(CancellationToken cancellationToken)
    {
        var rows = await context.Lessons.AsNoTracking()
            .OrderBy(l => l.Module.OrderIndex)
            .ThenBy(l => l.OrderIndex)
            .Select(l => new
            {
                Lesson = l,
                ModuleTitle = l.Module.Title,
                VideoUrl = l.VideoSummaries.Select(v => v.VideoUrl).FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        return rows.Select(r => ToAdminResponse(r.Lesson, r.ModuleTitle, r.VideoUrl)).ToList();
    }

    public async Task<AdminLessonResponse?> UpdateAsync(
        Guid lessonId, UpdateLessonRequest request, CancellationToken cancellationToken)
    {
        var lesson = await context.Lessons
            .FirstOrDefaultAsync(l => l.LessonId == lessonId, cancellationToken);
        if (lesson is null) return null;

        // Moving the lesson to another module places it at the end of that module.
        if (request.ModuleId.HasValue && request.ModuleId.Value != lesson.ModuleId)
        {
            var moduleExists = await context.Modules
                .AnyAsync(m => m.ModuleId == request.ModuleId.Value, cancellationToken);
            if (!moduleExists) throw new InvalidOperationException("Module not found.");

            lesson.ModuleId = request.ModuleId.Value;
            lesson.OrderIndex = await NextOrderIndexAsync(lesson.ModuleId, cancellationToken);
        }

        if (request.Title is not null) lesson.Title = request.Title.Trim();
        if (request.Description is not null) lesson.Description = request.Description.Trim();
        if (request.Content is not null) lesson.Content = request.Content;
        if (request.OrderIndex.HasValue) lesson.OrderIndex = request.OrderIndex.Value;
        if (request.DurationMinutes.HasValue) lesson.DurationMinutes = request.DurationMinutes.Value;
        if (request.Status is not null) lesson.Status = Enum.Parse<ContentStatus>(request.Status);

        var module = await context.Modules.AsNoTracking()
            .Where(m => m.ModuleId == lesson.ModuleId)
            .Select(m => new { m.Title, m.Status })
            .FirstAsync(cancellationToken);

        // Check the lesson as it will be saved, after all the changes above.
        EnsureCanPublish(lesson.Status, lesson.Content, module.Status);

        if (!string.IsNullOrWhiteSpace(request.VideoUrl))
        {
            var video = await context.VideoSummaries
                .FirstOrDefaultAsync(v => v.LessonId == lessonId, cancellationToken);
            if (video is null)
            {
                context.VideoSummaries.Add(new VideoSummary
                {
                    VideoId = Guid.NewGuid(),
                    LessonId = lessonId,
                    VideoUrl = request.VideoUrl,
                    GeneratedAt = DateTimeOffset.UtcNow
                });
            }
            else
            {
                video.VideoUrl = request.VideoUrl;
            }
        }

        lesson.UpdatedAt = DateTimeOffset.UtcNow;
        await context.SaveChangesAsync(cancellationToken);

        var videoUrl = await context.VideoSummaries.AsNoTracking()
            .Where(v => v.LessonId == lessonId)
            .Select(v => v.VideoUrl)
            .FirstOrDefaultAsync(cancellationToken);

        return ToAdminResponse(lesson, module.Title, videoUrl);
    }

    // A lesson can only be published when it has content and its module is published.
    private static void EnsureCanPublish(ContentStatus status, string? content, ContentStatus moduleStatus)
    {
        if (status != ContentStatus.Published) return;

        if (string.IsNullOrWhiteSpace(content) || moduleStatus != ContentStatus.Published)
            throw new InvalidOperationException(
                "Add lesson content and choose a published module before publishing.");
    }

    private async Task<short> NextOrderIndexAsync(Guid moduleId, CancellationToken cancellationToken)
    {
        var max = await context.Lessons
            .Where(l => l.ModuleId == moduleId)
            .MaxAsync(l => (short?)l.OrderIndex, cancellationToken);
        return (short)((max ?? 0) + 1);
    }

    private static AdminLessonResponse ToAdminResponse(Lesson l, string moduleTitle, string? videoUrl) => new()
    {
        LessonId = l.LessonId,
        ModuleId = l.ModuleId,
        ModuleTitle = moduleTitle,
        Title = l.Title,
        Description = l.Description,
        Content = l.Content,
        OrderIndex = l.OrderIndex,
        DurationMinutes = l.DurationMinutes,
        Status = l.Status.ToString(),
        VideoUrl = videoUrl,
        CreatedAt = l.CreatedAt,
        UpdatedAt = l.UpdatedAt
    };

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
            .Where(l => l.LessonId == lessonId && l.Status == ContentStatus.Published)
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
            .Where(l => l.ModuleId == moduleId && l.Status == ContentStatus.Published)
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