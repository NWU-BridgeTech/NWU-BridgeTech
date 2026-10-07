using BridgeTech.Api.Common.Exceptions;
using BridgeTech.Api.Data;
using BridgeTech.Api.Domain.Enums;
using BridgeTech.Api.DTOs.Admin;
using Microsoft.EntityFrameworkCore;

namespace BridgeTech.Api.Services.Admin;

// Read-only student monitoring for the admin area. Per-student aggregates are computed in a
// handful of grouped queries; status is derived from them (see StudentStatusRules), so search,
// module and status filters are applied in memory over the full student set. That is fine for
// thousands of students; if the platform grows far beyond that, push the filters into SQL.
public class AdminStudentService(AppDbContext context) : IAdminStudentService
{
    public async Task<StudentListResponse> ListAsync(StudentListQuery query, CancellationToken cancellationToken)
    {
        StudentStatus? statusFilter = null;
        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            if (!StudentStatusExtensions.TryParse(query.Status, out var parsed))
            {
                throw AdminManagementException.BadRequest("INVALID_STATUS", "Status must be Active, Needs support or Inactive.");
            }
            statusFilter = parsed;
        }

        var now = DateTimeOffset.UtcNow;
        var all = await LoadSnapshotsAsync(null, now, cancellationToken);

        IEnumerable<StudentSnapshot> filtered = all;

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            filtered = filtered.Where(s =>
                s.FullName.Contains(term, StringComparison.OrdinalIgnoreCase) ||
                s.Email.Contains(term, StringComparison.OrdinalIgnoreCase));
        }

        if (query.ModuleId is { } moduleId)
        {
            filtered = filtered.Where(s => s.CurrentEnrollment?.ModuleId == moduleId);
        }

        if (statusFilter is { } status)
        {
            filtered = filtered.Where(s => s.Status == status);
        }

        var matches = filtered.ToList();

        return new StudentListResponse
        {
            Items = matches
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .Select(s => ToResponse(s, now))
                .ToList(),
            Page = query.Page,
            PageSize = query.PageSize,
            FilteredCount = matches.Count,
            TotalStudents = all.Count,
            ActiveCount = all.Count(s => s.Status == StudentStatus.Active),
            NeedsSupportCount = all.Count(s => s.Status == StudentStatus.NeedsSupport),
            InactiveCount = all.Count(s => s.Status == StudentStatus.Inactive)
        };
    }

    public async Task<StudentDetailResponse> GetAsync(Guid studentId, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var snapshot = (await LoadSnapshotsAsync(studentId, now, cancellationToken)).SingleOrDefault()
            ?? throw AdminManagementException.NotFound("STUDENT_NOT_FOUND", "Student not found.");

        var detail = new StudentDetailResponse
        {
            Username = snapshot.Username,
            GithubUsername = snapshot.GithubUsername,
            JoinedAt = snapshot.CreatedAt,
            QuizAttemptsCompleted = snapshot.CompletedQuizAttempts,
            CertificatesEarned = snapshot.CertificatesEarned,
            Enrollments = snapshot.Enrollments
                .OrderByDescending(e => e.EnrolledAt)
                .Select(e => new StudentEnrollmentResponse
                {
                    ModuleId = e.ModuleId,
                    ModuleTitle = e.ModuleTitle,
                    Status = e.Status.ToString(),
                    Progress = e.ProgressPercent,
                    EnrolledAt = e.EnrolledAt,
                    CompletedAt = e.CompletedAt
                })
                .ToList()
        };
        Fill(detail, snapshot, now);
        return detail;
    }

    private static StudentResponse ToResponse(StudentSnapshot snapshot, DateTimeOffset now)
    {
        var response = new StudentResponse();
        Fill(response, snapshot, now);
        return response;
    }

    private static void Fill(StudentResponse target, StudentSnapshot snapshot, DateTimeOffset now)
    {
        target.Id = snapshot.UserId;
        target.Name = snapshot.FullName;
        target.Email = snapshot.Email;
        target.ModuleId = snapshot.CurrentEnrollment?.ModuleId;
        target.ModuleTitle = snapshot.CurrentEnrollment?.ModuleTitle;
        target.Progress = snapshot.CurrentEnrollment?.ProgressPercent ?? 0;
        target.LastActiveAt = snapshot.LastActiveAt;
        target.LastActive = ActivityFormatter.Describe(snapshot.LastActiveAt, now);
        target.Status = snapshot.Status.ToLabel();
        target.Note = snapshot.Note;
        target.QuizScore = snapshot.AverageQuizScore is { } average ? (int)Math.Round(average) : null;
        target.CompletedPracticals = snapshot.VerifiedPracticals;
        target.GithubConnected = snapshot.GithubConnected;
    }

    // Loads every student (or just one) together with the aggregates the status rules need.
    private async Task<List<StudentSnapshot>> LoadSnapshotsAsync(Guid? onlyStudentId, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var users = context.Users.AsNoTracking().Where(u => u.Role == UserRole.Student);
        var attempts = context.QuizAttempts.AsNoTracking().Where(a => a.User.Role == UserRole.Student);
        var submissions = context.ExerciseSubmissions.AsNoTracking().Where(s => s.User.Role == UserRole.Student);
        var progress = context.LessonProgress.AsNoTracking().Where(p => p.Completed && p.CompletedAt != null && p.User.Role == UserRole.Student);
        var enrollments = context.Enrollments.AsNoTracking().Where(e => e.User.Role == UserRole.Student);
        var certificates = context.Certificates.AsNoTracking().Where(c => c.User.Role == UserRole.Student);

        if (onlyStudentId is { } id)
        {
            users = users.Where(u => u.UserId == id);
            attempts = attempts.Where(a => a.UserId == id);
            submissions = submissions.Where(s => s.UserId == id);
            progress = progress.Where(p => p.UserId == id);
            enrollments = enrollments.Where(e => e.UserId == id);
            certificates = certificates.Where(c => c.UserId == id);
        }

        var userRows = await users
            .OrderBy(u => u.FirstName).ThenBy(u => u.LastName).ThenBy(u => u.Email)
            .Select(u => new
            {
                u.UserId,
                u.FirstName,
                u.LastName,
                u.Username,
                u.Email,
                u.IsActive,
                u.CreatedAt,
                u.LastLoginAt,
                u.GithubUsername,
                GithubConnected = u.GithubAccessToken != null
            })
            .ToListAsync(cancellationToken);

        var quizRows = await attempts
            .GroupBy(a => a.UserId)
            .Select(g => new
            {
                UserId = g.Key,
                Completed = g.Count(a => a.CompletedAt != null),
                Average = g.Average(a => a.CompletedAt != null ? (double?)a.Score : null),
                LastAt = g.Max(a => a.StartedAt)
            })
            .ToListAsync(cancellationToken);

        var submissionRows = await submissions
            .GroupBy(s => s.UserId)
            .Select(g => new
            {
                UserId = g.Key,
                Verified = g.Where(s => s.Status == SubmissionStatus.Verified).Select(s => s.ExerciseId).Distinct().Count(),
                Failed = g.Count(s => s.Status == SubmissionStatus.Failed),
                LastAt = g.Max(s => s.SubmittedAt)
            })
            .ToListAsync(cancellationToken);

        var progressRows = await progress
            .GroupBy(p => new { p.UserId, p.Lesson.ModuleId })
            .Select(g => new { g.Key.UserId, g.Key.ModuleId, LastAt = g.Max(p => p.CompletedAt) })
            .ToListAsync(cancellationToken);

        var enrollmentRows = await enrollments
            .Select(e => new
            {
                e.UserId,
                e.ModuleId,
                ModuleTitle = e.Module.Title,
                e.Status,
                e.ProgressPercent,
                e.EnrolledAt,
                e.CompletedAt
            })
            .ToListAsync(cancellationToken);

        var certificateRows = await certificates
            .GroupBy(c => c.UserId)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var quizByUser = quizRows.ToDictionary(r => r.UserId);
        var submissionsByUser = submissionRows.ToDictionary(r => r.UserId);
        var certificatesByUser = certificateRows.ToDictionary(r => r.UserId, r => r.Count);
        var progressByUserModule = progressRows.ToDictionary(r => (r.UserId, r.ModuleId), r => r.LastAt);
        var lastProgressByUser = progressRows
            .GroupBy(r => r.UserId)
            .ToDictionary(g => g.Key, g => g.Max(r => r.LastAt));
        var enrollmentsByUser = enrollmentRows.ToLookup(r => r.UserId);

        var snapshots = new List<StudentSnapshot>(userRows.Count);

        foreach (var row in userRows)
        {
            var snapshot = new StudentSnapshot
            {
                UserId = row.UserId,
                FirstName = row.FirstName,
                LastName = row.LastName,
                Username = row.Username,
                Email = row.Email,
                IsActive = row.IsActive,
                CreatedAt = row.CreatedAt,
                GithubConnected = row.GithubConnected,
                GithubUsername = row.GithubUsername
            };

            foreach (var e in enrollmentsByUser[row.UserId])
            {
                progressByUserModule.TryGetValue((row.UserId, e.ModuleId), out var lastProgress);
                snapshot.Enrollments.Add(new StudentEnrollmentSnapshot(
                    e.ModuleId, e.ModuleTitle, e.Status, e.ProgressPercent, e.EnrolledAt, e.CompletedAt, lastProgress));
            }

            // "Current module": the active enrolment the student touched most recently,
            // falling back to the latest enrolment of any status.
            snapshot.CurrentEnrollment = snapshot.Enrollments
                .Where(e => e.Status == EnrollmentStatus.Active)
                .OrderByDescending(e => e.LastProgressAt ?? e.EnrolledAt)
                .FirstOrDefault()
                ?? snapshot.Enrollments
                    .OrderByDescending(e => e.CompletedAt ?? e.EnrolledAt)
                    .FirstOrDefault();

            DateTimeOffset? lastActive = row.LastLoginAt;

            if (quizByUser.TryGetValue(row.UserId, out var quiz))
            {
                snapshot.CompletedQuizAttempts = quiz.Completed;
                snapshot.AverageQuizScore = quiz.Average;
                lastActive = Latest(lastActive, quiz.LastAt);
            }

            if (submissionsByUser.TryGetValue(row.UserId, out var submission))
            {
                snapshot.VerifiedPracticals = submission.Verified;
                snapshot.FailedPracticals = submission.Failed;
                lastActive = Latest(lastActive, submission.LastAt);
            }

            if (lastProgressByUser.TryGetValue(row.UserId, out var lessonAt))
            {
                lastActive = Latest(lastActive, lessonAt);
            }

            foreach (var enrolment in snapshot.Enrollments)
            {
                lastActive = Latest(lastActive, enrolment.EnrolledAt);
            }

            snapshot.LastActiveAt = lastActive;
            snapshot.CertificatesEarned = certificatesByUser.GetValueOrDefault(row.UserId);

            StudentStatusRules.Apply(snapshot, now);
            snapshots.Add(snapshot);
        }

        return snapshots;
    }

    private static DateTimeOffset? Latest(DateTimeOffset? current, DateTimeOffset? candidate) =>
        candidate is null ? current : current is null || candidate > current ? candidate : current;
}
