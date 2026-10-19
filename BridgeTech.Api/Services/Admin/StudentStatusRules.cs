using BridgeTech.Api.Domain.Enums;

namespace BridgeTech.Api.Services.Admin;

public enum StudentStatus
{
    Active,
    NeedsSupport,
    Inactive
}

public static class StudentStatusExtensions
{
    // The strings the Students page already filters and styles on.
    public static string ToLabel(this StudentStatus status) => status switch
    {
        StudentStatus.NeedsSupport => "Needs support",
        StudentStatus.Inactive => "Inactive",
        _ => "Active"
    };

    public static bool TryParse(string? value, out StudentStatus status)
    {
        var normalised = (value ?? string.Empty).Replace(" ", "").Replace("-", "").Replace("_", "");
        foreach (var candidate in Enum.GetValues<StudentStatus>())
        {
            if (string.Equals(candidate.ToString(), normalised, StringComparison.OrdinalIgnoreCase))
            {
                status = candidate;
                return true;
            }
        }
        status = default;
        return false;
    }
}

// Everything the status calculation needs about one student.
public sealed class StudentSnapshot
{
    public Guid UserId { get; init; }
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string Username { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public bool IsActive { get; init; }
    public DateTimeOffset CreatedAt { get; init; }
    public bool GithubConnected { get; init; }
    public string? GithubUsername { get; init; }
    public DateTimeOffset? LastActiveAt { get; set; }
    public int CompletedQuizAttempts { get; set; }
    public double? AverageQuizScore { get; set; }
    public int VerifiedPracticals { get; set; }
    public int FailedPracticals { get; set; }
    public int CertificatesEarned { get; set; }
    public List<StudentEnrollmentSnapshot> Enrollments { get; } = [];
    public StudentEnrollmentSnapshot? CurrentEnrollment { get; set; }
    public StudentStatus Status { get; set; }
    public string Note { get; set; } = string.Empty;

    public string FullName => $"{FirstName} {LastName}".Trim();
}

public sealed record StudentEnrollmentSnapshot(
    Guid ModuleId,
    string ModuleTitle,
    EnrollmentStatus Status,
    short ProgressPercent,
    DateTimeOffset EnrolledAt,
    DateTimeOffset? CompletedAt,
    DateTimeOffset? LastProgressAt);

// The rules that decide a student's status. Tweak the thresholds here; nothing else depends on them.
public static class StudentStatusRules
{
    public const int InactiveAfterDays = 14;
    public const double LowAverageQuizScore = 50;
    public const int MinQuizAttemptsForAverage = 2;
    public const int FailedPracticalsThreshold = 3;
    public const int StalledEnrollmentDays = 7;

    public static void Apply(StudentSnapshot student, DateTimeOffset now)
    {
        var lastSeen = student.LastActiveAt ?? student.CreatedAt;
        var idleDays = (int)(now - lastSeen).TotalDays;

        if (!student.IsActive)
        {
            student.Status = StudentStatus.Inactive;
            student.Note = "This account has been deactivated.";
            return;
        }

        if (idleDays >= InactiveAfterDays)
        {
            student.Status = StudentStatus.Inactive;
            student.Note = student.LastActiveAt is null
                ? $"No activity since joining {idleDays} days ago."
                : $"No activity for {idleDays} days.";
            return;
        }

        var reasons = new List<string>();

        if (student.AverageQuizScore is { } average
            && student.CompletedQuizAttempts >= MinQuizAttemptsForAverage
            && average < LowAverageQuizScore)
        {
            reasons.Add($"Average quiz score is {Math.Round(average)}% across {student.CompletedQuizAttempts} attempts.");
        }

        if (student.FailedPracticals >= FailedPracticalsThreshold
            && student.FailedPracticals > student.VerifiedPracticals)
        {
            reasons.Add($"{student.FailedPracticals} practical submissions have failed verification.");
        }

        if (student.CurrentEnrollment is { Status: EnrollmentStatus.Active, ProgressPercent: 0 } stalled
            && (now - stalled.EnrolledAt).TotalDays >= StalledEnrollmentDays)
        {
            reasons.Add($"No lessons completed since enrolling in {stalled.ModuleTitle} {(int)(now - stalled.EnrolledAt).TotalDays} days ago.");
        }

        if (reasons.Count > 0)
        {
            student.Status = StudentStatus.NeedsSupport;
            student.Note = string.Join(" ", reasons);
            return;
        }

        student.Status = StudentStatus.Active;
        student.Note = student.Enrollments.Count == 0
            ? "Not enrolled in a module yet."
            : "No concerns flagged.";
    }
}
