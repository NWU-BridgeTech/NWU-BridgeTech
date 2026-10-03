using BridgeTech.Api.Data;
using BridgeTech.Api.Domain.Enums;
using BridgeTech.Api.DTOs.Admin;
using Microsoft.EntityFrameworkCore;

namespace BridgeTech.Api.Services.AdminDashboard;

public sealed class AdminDashboardService(AppDbContext db) : IAdminDashboardService
{
    private const int RecentItemLimit = 5;
    private const int SupportProgressThreshold = 25;
    private const int SupportEnrollmentAgeDays = 14;

    public async Task<AdminDashboardResponse> GetDashboardAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        var monthStart = new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, TimeSpan.Zero);
        var trendStart = new DateTimeOffset(now.UtcDateTime.Date.AddDays(-6), TimeSpan.Zero);
        var dataStart = monthStart < trendStart ? monthStart : trendStart;
        var activityStart = now.AddDays(-30);
        var trendDays = Enumerable.Range(0, 7)
            .Select(offset => DateOnly.FromDateTime(trendStart.UtcDateTime).AddDays(offset))
            .ToArray();

        var lessonActivity = await db.LessonProgress.AsNoTracking()
            .Where(x => x.Completed && x.CompletedAt >= activityStart && x.User.Role == UserRole.Student)
            .Select(x => new ActivityStamp { UserId = x.UserId, OccurredAt = x.CompletedAt!.Value })
            .ToListAsync(cancellationToken);
        var quizActivity = await db.QuizAttempts.AsNoTracking()
            .Where(x => x.CompletedAt >= activityStart && x.User.Role == UserRole.Student)
            .Select(x => new ActivityStamp { UserId = x.UserId, OccurredAt = x.CompletedAt!.Value })
            .ToListAsync(cancellationToken);
        var submissionActivity = await db.ExerciseSubmissions.AsNoTracking()
            .Where(x => x.SubmittedAt >= activityStart && x.User.Role == UserRole.Student)
            .Select(x => new ActivityStamp { UserId = x.UserId, OccurredAt = x.SubmittedAt })
            .ToListAsync(cancellationToken);
        var enrollmentActivity = await db.Enrollments.AsNoTracking()
            .Where(x => x.EnrolledAt >= activityStart && x.User.Role == UserRole.Student)
            .Select(x => new ActivityStamp { UserId = x.UserId, OccurredAt = x.EnrolledAt })
            .ToListAsync(cancellationToken);

        var activityStamps = lessonActivity
            .Concat(quizActivity)
            .Concat(submissionActivity)
            .Concat(enrollmentActivity)
            .ToList();
        var dailyActiveLearners = activityStamps
            .Where(x => x.OccurredAt >= trendStart)
            .GroupBy(x => UtcDate(x.OccurredAt))
            .ToDictionary(group => group.Key, group => group.Select(x => x.UserId).Distinct().Count());

        var completionDates = await db.Enrollments.AsNoTracking()
            .Where(x => x.Status == EnrollmentStatus.Completed
                && x.CompletedAt >= dataStart
                && x.User.Role == UserRole.Student)
            .Select(x => x.CompletedAt!.Value)
            .ToListAsync(cancellationToken);

        var quizScores = await db.QuizAttempts.AsNoTracking()
            .Where(x => x.CompletedAt >= dataStart
                && x.Score != null
                && x.User.Role == UserRole.Student)
            .Select(x => new ScoreStamp { OccurredAt = x.CompletedAt!.Value, Score = x.Score!.Value })
            .ToListAsync(cancellationToken);

        var submissions = await db.ExerciseSubmissions.AsNoTracking()
            .Where(x => x.SubmittedAt >= dataStart && x.User.Role == UserRole.Student)
            .Select(x => new SubmissionStamp { SubmittedAt = x.SubmittedAt, Status = x.Status })
            .ToListAsync(cancellationToken);

        var monthCompletions = completionDates.Count(x => x >= monthStart);
        var monthScores = quizScores.Where(x => x.OccurredAt >= monthStart).ToList();
        var monthSubmissions = submissions.Where(x => x.SubmittedAt >= monthStart).ToList();
        var averageQuizScore = monthScores.Count == 0
            ? (decimal?)null
            : monthScores.Average(x => (decimal)x.Score);
        var practicalVerificationRate = monthSubmissions.Count == 0
            ? (decimal?)null
            : monthSubmissions.Count(x => x.Status == SubmissionStatus.Verified) * 100m / monthSubmissions.Count;

        var learningOverview = new[]
        {
            new AdminDashboardMetricResponse
            {
                Key = "active-students",
                Label = "Active students",
                Value = activityStamps.Select(x => x.UserId).Distinct().Count(),
                Unit = "count",
                Description = "Unique learners with tracked activity in the last 30 days",
                Trend = BuildCountTrend(trendDays, dailyActiveLearners)
            },
            new AdminDashboardMetricResponse
            {
                Key = "course-completions",
                Label = "Course completions",
                Value = monthCompletions,
                Unit = "count",
                Description = "Enrollments completed this month",
                Trend = BuildCountTrend(trendDays, CountByDay(completionDates))
            },
            new AdminDashboardMetricResponse
            {
                Key = "average-quiz-score",
                Label = "Average quiz score",
                Value = averageQuizScore,
                Unit = "percent",
                Description = "Mean score from completed quizzes this month",
                Trend = BuildAverageTrend(trendDays, quizScores)
            },
            new AdminDashboardMetricResponse
            {
                Key = "practical-verification-rate",
                Label = "Practical verification rate",
                Value = practicalVerificationRate,
                Unit = "percent",
                Description = "Submissions verified this month",
                Trend = BuildVerificationTrend(trendDays, submissions)
            }
        };

        var pendingSubmissions = db.ExerciseSubmissions.AsNoTracking()
            .Where(x => x.Status == SubmissionStatus.Pending && x.User.Role == UserRole.Student);
        var pendingSubmissionCount = await pendingSubmissions.CountAsync(cancellationToken);
        var pendingSubmissionItems = await pendingSubmissions
            .OrderBy(x => x.SubmittedAt)
            .Take(RecentItemLimit)
            .Select(x => new AdminDashboardAttentionItemResponse
            {
                Title = x.User.FirstName + " " + x.User.LastName,
                Detail = x.Exercise.Title
            })
            .ToListAsync(cancellationToken);

        var supportCandidates = await db.Enrollments.AsNoTracking()
            .Where(x => x.User.Role == UserRole.Student
                && x.Status == EnrollmentStatus.Active
                && x.ProgressPercent < SupportProgressThreshold
                && x.EnrolledAt <= now.AddDays(-SupportEnrollmentAgeDays))
            .Select(x => new SupportCandidate
            {
                UserId = x.UserId,
                Name = x.User.FirstName + " " + x.User.LastName,
                ModuleTitle = x.Module.Title,
                ProgressPercent = x.ProgressPercent,
                EnrolledAt = x.EnrolledAt
            })
            .ToListAsync(cancellationToken);
        var learnersNeedingSupport = supportCandidates
            .GroupBy(x => x.UserId)
            .Select(group => group.OrderBy(x => x.ProgressPercent).ThenBy(x => x.EnrolledAt).First())
            .OrderBy(x => x.ProgressPercent)
            .ThenBy(x => x.EnrolledAt)
            .ToList();

        var incompleteModules = await db.Modules.AsNoTracking()
            .Where(x => !x.Lessons.Any()
                || x.Lessons.Any(lesson => lesson.Content == null || lesson.Content.Trim() == ""))
            .OrderBy(x => x.Title)
            .Select(x => new IncompleteModule
            {
                Title = x.Title,
                LessonCount = x.Lessons.Count(),
                MissingContentCount = x.Lessons.Count(lesson => lesson.Content == null || lesson.Content.Trim() == "")
            })
            .ToListAsync(cancellationToken);

        var needsAttention = new[]
        {
            new AdminDashboardAttentionResponse
            {
                Key = "submissions",
                Label = "Submissions to review",
                Count = pendingSubmissionCount,
                Note = "Exercise submissions awaiting verification",
                Items = pendingSubmissionItems
            },
            new AdminDashboardAttentionResponse
            {
                Key = "support",
                Label = "Learners to check in",
                Count = learnersNeedingSupport.Count,
                Note = "Active enrollments under 25% after 14 days",
                Items = learnersNeedingSupport.Take(RecentItemLimit)
                    .Select(x => new AdminDashboardAttentionItemResponse
                    {
                        Title = x.Name,
                        Detail = $"{x.ModuleTitle} · {x.ProgressPercent}% complete"
                    })
                    .ToList()
            },
            new AdminDashboardAttentionResponse
            {
                Key = "content",
                Label = "Incomplete lesson content",
                Count = incompleteModules.Count,
                Note = "Modules with no lessons or lessons missing content",
                Items = incompleteModules.Take(RecentItemLimit)
                    .Select(x => new AdminDashboardAttentionItemResponse
                    {
                        Title = x.Title,
                        Detail = x.LessonCount == 0
                            ? "No lessons added"
                            : $"{x.MissingContentCount} of {x.LessonCount} lessons missing content"
                    })
                    .ToList()
            }
        };

        var recentActivity = new List<AdminDashboardActivityResponse>();
        recentActivity.AddRange(await db.ExerciseSubmissions.AsNoTracking()
            .Where(x => x.User.Role == UserRole.Student)
            .OrderByDescending(x => x.SubmittedAt)
            .Take(RecentItemLimit)
            .Select(x => new AdminDashboardActivityResponse
            {
                Id = x.SubmissionId,
                Actor = x.User.FirstName + " " + x.User.LastName,
                Action = "submitted",
                Subject = x.Exercise.Title,
                OccurredAt = x.SubmittedAt
            })
            .ToListAsync(cancellationToken));
        recentActivity.AddRange(await db.QuizAttempts.AsNoTracking()
            .Where(x => x.CompletedAt != null && x.User.Role == UserRole.Student)
            .OrderByDescending(x => x.CompletedAt)
            .Take(RecentItemLimit)
            .Select(x => new AdminDashboardActivityResponse
            {
                Id = x.AttemptId,
                Actor = x.User.FirstName + " " + x.User.LastName,
                Action = "completed a quiz",
                Subject = x.Quiz.Title,
                OccurredAt = x.CompletedAt!.Value
            })
            .ToListAsync(cancellationToken));
        recentActivity.AddRange(await db.LessonProgress.AsNoTracking()
            .Where(x => x.Completed && x.CompletedAt != null && x.User.Role == UserRole.Student)
            .OrderByDescending(x => x.CompletedAt)
            .Take(RecentItemLimit)
            .Select(x => new AdminDashboardActivityResponse
            {
                Id = x.ProgressId,
                Actor = x.User.FirstName + " " + x.User.LastName,
                Action = "completed a lesson",
                Subject = x.Lesson.Title,
                OccurredAt = x.CompletedAt!.Value
            })
            .ToListAsync(cancellationToken));
        recentActivity.AddRange(await db.Enrollments.AsNoTracking()
            .Where(x => x.User.Role == UserRole.Student)
            .OrderByDescending(x => x.EnrolledAt)
            .Take(RecentItemLimit)
            .Select(x => new AdminDashboardActivityResponse
            {
                Id = x.EnrollmentId,
                Actor = x.User.FirstName + " " + x.User.LastName,
                Action = "enrolled in",
                Subject = x.Module.Title,
                OccurredAt = x.EnrolledAt
            })
            .ToListAsync(cancellationToken));

        return new AdminDashboardResponse
        {
            LearningOverview = learningOverview,
            NeedsAttention = needsAttention,
            RecentActivity = recentActivity
                .OrderByDescending(x => x.OccurredAt)
                .Take(RecentItemLimit)
                .ToList(),
            PlatformStatus = new AdminDashboardPlatformStatusResponse
            {
                State = "operational",
                Title = "Live dashboard data",
                Details = "The API and database responded successfully."
            }
        };
    }

    private static DateOnly UtcDate(DateTimeOffset timestamp) =>
        DateOnly.FromDateTime(timestamp.UtcDateTime);

    private static IReadOnlyList<decimal?> BuildCountTrend(
        IReadOnlyList<DateOnly> days,
        IReadOnlyDictionary<DateOnly, int> dailyCounts) =>
        days.Select(day => dailyCounts.TryGetValue(day, out var count) ? (decimal?)count : 0m).ToList();

    private static IReadOnlyDictionary<DateOnly, int> CountByDay(IEnumerable<DateTimeOffset> timestamps) =>
        timestamps.GroupBy(UtcDate).ToDictionary(group => group.Key, group => group.Count());

    private static IReadOnlyList<decimal?> BuildAverageTrend(
        IReadOnlyList<DateOnly> days,
        IEnumerable<ScoreStamp> scores)
    {
        var dailyAverages = scores
            .GroupBy(x => UtcDate(x.OccurredAt))
            .ToDictionary(group => group.Key, group => group.Average(x => (decimal)x.Score));
        return days.Select(day => dailyAverages.TryGetValue(day, out var average) ? average : (decimal?)null).ToList();
    }

    private static IReadOnlyList<decimal?> BuildVerificationTrend(
        IReadOnlyList<DateOnly> days,
        IEnumerable<SubmissionStamp> submissions)
    {
        var dailyRates = submissions
            .GroupBy(x => UtcDate(x.SubmittedAt))
            .ToDictionary(
                group => group.Key,
                group => group.Count(x => x.Status == SubmissionStatus.Verified) * 100m / group.Count());
        return days.Select(day => dailyRates.TryGetValue(day, out var rate) ? rate : (decimal?)null).ToList();
    }

    private sealed class ActivityStamp
    {
        public Guid UserId { get; init; }
        public DateTimeOffset OccurredAt { get; init; }
    }

    private sealed class ScoreStamp
    {
        public DateTimeOffset OccurredAt { get; init; }
        public short Score { get; init; }
    }

    private sealed class SubmissionStamp
    {
        public DateTimeOffset SubmittedAt { get; init; }
        public SubmissionStatus Status { get; init; }
    }

    private sealed class SupportCandidate
    {
        public Guid UserId { get; init; }
        public string Name { get; init; } = string.Empty;
        public string ModuleTitle { get; init; } = string.Empty;
        public short ProgressPercent { get; init; }
        public DateTimeOffset EnrolledAt { get; init; }
    }

    private sealed class IncompleteModule
    {
        public string Title { get; init; } = string.Empty;
        public int LessonCount { get; init; }
        public int MissingContentCount { get; init; }
    }
}