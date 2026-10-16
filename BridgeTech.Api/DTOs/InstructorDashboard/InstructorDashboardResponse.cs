namespace BridgeTech.Api.DTOs.InstructorDashboard;

public sealed class InstructorDashboardResponse
{
    public IReadOnlyList<InstructorCourseResponse> Courses { get; init; } = [];
    public int StudentsEnrolled { get; init; }
    public int ModulesCreated { get; init; }
    public int SubmissionsToReview { get; init; }
    public int AverageCompletion { get; init; }
    public int StudentsOnTrack { get; init; }
    public decimal? AverageQuizScore { get; init; }
    public DateTimeOffset UpdatedAt { get; init; }
}

public sealed class InstructorCourseResponse
{
    public Guid ModuleId { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public int StudentCount { get; init; }
    public int CompletionPercentage { get; init; }
    public int LessonCount { get; init; }
}
