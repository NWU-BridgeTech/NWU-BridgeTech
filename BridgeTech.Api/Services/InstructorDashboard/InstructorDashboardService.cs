using BridgeTech.Api.Data;
using BridgeTech.Api.Domain.Enums;
using BridgeTech.Api.DTOs.InstructorDashboard;
using Microsoft.EntityFrameworkCore;

namespace BridgeTech.Api.Services.InstructorDashboard;

public sealed class InstructorDashboardService(AppDbContext db) : IInstructorDashboardService
{
    private const int OnTrackProgressThreshold = 25;
    private const int OnTrackEnrollmentAgeDays = 14;

    public async Task<InstructorDashboardResponse> GetDashboardAsync(
        Guid instructorId,
        CancellationToken cancellationToken = default)
    {
        var moduleIds = await db.StaffActivities.AsNoTracking()
            .Where(activity => activity.UserId == instructorId
                && activity.ActivityType == "ModuleCreated"
                && activity.ModuleId != null)
            .Select(activity => activity.ModuleId!.Value)
            .Distinct()
            .ToListAsync(cancellationToken);

        var courses = await db.Modules.AsNoTracking()
            .Where(module => moduleIds.Contains(module.ModuleId))
            .OrderBy(module => module.Title)
            .Select(module => new
            {
                module.ModuleId,
                module.Title,
                Status = module.Status.ToString(),
                LessonCount = module.Lessons.Count,
                StudentCount = module.Enrollments.Count(enrollment =>
                    enrollment.User.Role == UserRole.Student
                    && enrollment.Status != EnrollmentStatus.Dropped),
                CompletedStudentCount = module.Enrollments.Count(enrollment =>
                    enrollment.User.Role == UserRole.Student
                    && enrollment.Status == EnrollmentStatus.Completed)
            })
            .ToListAsync(cancellationToken);
        var existingModuleIds = courses.Select(module => module.ModuleId).ToList();

        var now = DateTimeOffset.UtcNow;
        if (existingModuleIds.Count == 0)
        {
            return new InstructorDashboardResponse { UpdatedAt = now };
        }

        var enrollments = await db.Enrollments.AsNoTracking()
            .Where(enrollment => existingModuleIds.Contains(enrollment.ModuleId)
                && enrollment.Status == EnrollmentStatus.Active
                && enrollment.User.Role == UserRole.Student)
            .Select(enrollment => new
            {
                enrollment.UserId,
                enrollment.ProgressPercent,
                enrollment.EnrolledAt
            })
            .ToListAsync(cancellationToken);

        var studentGroups = enrollments.GroupBy(enrollment => enrollment.UserId);
        var studentsOnTrack = studentGroups.Count(group => group.All(enrollment =>
            enrollment.ProgressPercent >= OnTrackProgressThreshold
            || enrollment.EnrolledAt > now.AddDays(-OnTrackEnrollmentAgeDays)));

        var averageQuizScore = await db.QuizAttempts.AsNoTracking()
            .Where(attempt => existingModuleIds.Contains(attempt.Quiz.ModuleId)
                && attempt.User.Role == UserRole.Student
                && attempt.CompletedAt != null
                && attempt.Score != null)
            .AverageAsync(attempt => (decimal?)attempt.Score, cancellationToken);

        var submissionsToReview = await db.ExerciseSubmissions.AsNoTracking()
            .CountAsync(submission => existingModuleIds.Contains(submission.Exercise.ModuleId)
                && submission.User.Role == UserRole.Student
                && submission.Status == SubmissionStatus.Pending,
                cancellationToken);

        return new InstructorDashboardResponse
        {
            Courses = courses.Select(course => new InstructorCourseResponse
            {
                ModuleId = course.ModuleId,
                Title = course.Title,
                Status = course.Status,
                StudentCount = course.StudentCount,
                CompletionPercentage = course.StudentCount == 0
                    ? 0
                    : (int)Math.Round(
                        course.CompletedStudentCount * 100m / course.StudentCount),
                LessonCount = course.LessonCount
            }).ToList(),
            StudentsEnrolled = studentGroups.Count(),
            ModulesCreated = existingModuleIds.Count,
            SubmissionsToReview = submissionsToReview,
            AverageCompletion = enrollments.Count == 0
                ? 0
                : (int)Math.Round(enrollments.Average(enrollment => (decimal)enrollment.ProgressPercent)),
            StudentsOnTrack = studentsOnTrack,
            AverageQuizScore = averageQuizScore is null
                ? null
                : Math.Round(averageQuizScore.Value, 1),
            UpdatedAt = now
        };
    }
}
