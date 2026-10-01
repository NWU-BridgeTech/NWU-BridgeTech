using BridgeTech.Api.Data;
using BridgeTech.Api.Domain.Entities;
using BridgeTech.Api.Domain.Enums;
using BridgeTech.Api.DTOs.Enrollments;
using Microsoft.EntityFrameworkCore;
using BridgeTech.Api.Services.Notifications;

namespace BridgeTech.Api.Services.Enrollments;

public class EnrollmentService(AppDbContext context, INotificationService notificationService) : IEnrollmentService
{
    public async Task<IEnumerable<EnrollmentResponse>> GetMyEnrollmentsAsync(
        Guid userId, CancellationToken cancellationToken)
    {
        var enrollments = await context.Enrollments
            .AsNoTracking()
            .Include(e => e.Module)
            .Where(e => e.UserId == userId)
            .OrderBy(e => e.EnrolledAt)
            .ToListAsync(cancellationToken);

        var results = new List<EnrollmentResponse>();

        foreach (var e in enrollments)
        {
            var lessonsTotal = await context.Lessons
                .CountAsync(l => l.ModuleId == e.ModuleId, cancellationToken);

            var completedLessonIds = await context.LessonProgress
                .Include(p => p.Lesson)
                .Where(p => p.UserId == userId && p.Completed && p.Lesson.ModuleId == e.ModuleId)
                .Select(p => p.LessonId)
                .ToListAsync(cancellationToken);

            var nextLesson = await context.Lessons
                .Where(l => l.ModuleId == e.ModuleId && !completedLessonIds.Contains(l.LessonId))
                .OrderBy(l => l.OrderIndex)
                .Select(l => new { l.LessonId, l.Title })
                .FirstOrDefaultAsync(cancellationToken);

            results.Add(new EnrollmentResponse
            {
                EnrollmentId = e.EnrollmentId,
                ModuleId = e.ModuleId,
                ModuleTitle = e.Module.Title,
                Status = e.Status,
                ProgressPercent = e.ProgressPercent,
                EnrolledAt = e.EnrolledAt,
                CompletedAt = e.CompletedAt,
                LessonsDone = completedLessonIds.Count,
                LessonsTotal = lessonsTotal,
                NextLessonId = nextLesson?.LessonId,
                NextLessonTitle = nextLesson?.Title
            });
        }

        return results;
    }

    public async Task<EnrollmentResponse> EnrollAsync(
        Guid userId, Guid moduleId, CancellationToken cancellationToken)
    {
        var moduleExists = await context.Modules
            .AnyAsync(m => m.ModuleId == moduleId, cancellationToken);

        if (!moduleExists)
        {
            throw new InvalidOperationException("Module not found.");
        }

        var alreadyEnrolled = await context.Enrollments
            .AnyAsync(e => e.UserId == userId && e.ModuleId == moduleId, cancellationToken);

        if (alreadyEnrolled)
        {
            throw new InvalidOperationException("Already enrolled in this module.");
        }

        var enrollment = new Enrollment
        {
            EnrollmentId = Guid.NewGuid(),
            UserId = userId,
            ModuleId = moduleId,
            Status = EnrollmentStatus.Active,
            ProgressPercent = 0,
            EnrolledAt = DateTimeOffset.UtcNow
        };

        context.Enrollments.Add(enrollment);
        await context.SaveChangesAsync(cancellationToken);

        var module = await context.Modules.FirstAsync(m => m.ModuleId == moduleId, cancellationToken);
        var lessonsTotal = await context.Lessons.CountAsync(l => l.ModuleId == moduleId, cancellationToken);
        var firstLesson = await context.Lessons
            .Where(l => l.ModuleId == moduleId)
            .OrderBy(l => l.OrderIndex)
            .Select(l => new { l.LessonId, l.Title })
            .FirstOrDefaultAsync(cancellationToken);

        await notificationService.NotifyAsync(
            userId,
            "course_enrolled",
            "Course enrolled",
            $"You are now enrolled in {module.Title}.",
            moduleId,
            cancellationToken);

        return new EnrollmentResponse
        {
            EnrollmentId = enrollment.EnrollmentId,
            ModuleId = moduleId,
            ModuleTitle = module.Title,
            Status = enrollment.Status,
            ProgressPercent = 0,
            EnrolledAt = enrollment.EnrolledAt,
            LessonsDone = 0,
            LessonsTotal = lessonsTotal,
            NextLessonId = firstLesson?.LessonId,
            NextLessonTitle = firstLesson?.Title
        };
    }

    public async Task<bool> UnenrollAsync(Guid userId, Guid moduleId, CancellationToken cancellationToken)
    {
        var enrollment = await context.Enrollments
            .FirstOrDefaultAsync(e => e.UserId == userId && e.ModuleId == moduleId, cancellationToken);

        if (enrollment is null)
        {
            return false;
        }

        var moduleTitle = await context.Modules
            .Where(module => module.ModuleId == moduleId)
            .Select(module => module.Title)
            .SingleOrDefaultAsync(cancellationToken);

        var progressToRemove = await context.LessonProgress
            .Include(p => p.Lesson)
            .Where(p => p.UserId == userId && p.Lesson.ModuleId == moduleId)
            .ToListAsync(cancellationToken);

        context.LessonProgress.RemoveRange(progressToRemove);
        context.Enrollments.Remove(enrollment);

        await context.SaveChangesAsync(cancellationToken);
        await notificationService.NotifyAsync(
            userId,
            "course_unenrolled",
            "Course de-registered",
            moduleTitle is null
                ? "You have been removed from a course."
                : $"You have been de-registered from {moduleTitle}.",
            moduleId,
            cancellationToken);
        return true;
    }
}