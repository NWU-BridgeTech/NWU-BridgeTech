namespace BridgeTech.Api.DTOs.GitHub;

public sealed class LearningInsightsResponse
{
    public string? Repository { get; set; }
    public LearningStatistics Statistics { get; set; } = new();
    public string? Analysis { get; set; }
    public DateTimeOffset GeneratedAt { get; set; }
}

public sealed class LearningStatistics
{
    public int EnrolledModules { get; set; }
    public int CompletedModules { get; set; }
    public int LessonsCompleted { get; set; }
    public int LessonsAvailable { get; set; }
    public int LessonsProgressPercentage { get; set; }
    public int QuizAttempts { get; set; }
    public int QuizPasses { get; set; }
    public int AverageQuizScore { get; set; }
    public int ExercisesCompleted { get; set; }
    public int ExercisesAvailable { get; set; }
    public int ExerciseProgressPercentage { get; set; }
    public int BadgesEarned { get; set; }
    public int CertificatesEarned { get; set; }
    public int RepositoryCommitsLast30Days { get; set; }
    public int RepositoryOpenIssues { get; set; }
    public int RepositoryStars { get; set; }
}

public sealed class LearningChatRequest
{
    public string Message { get; set; } = string.Empty;
    public List<LearningChatMessage> History { get; set; } = [];
}

public sealed class LearningChatMessage
{
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}

public sealed class LearningChatResponse
{
    public string Message { get; set; } = string.Empty;
}

public sealed class LearningChatHistoryResponse
{
    public List<LearningChatHistoryItem> Messages { get; set; } = [];
}

public sealed class LearningChatHistoryItem
{
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}
