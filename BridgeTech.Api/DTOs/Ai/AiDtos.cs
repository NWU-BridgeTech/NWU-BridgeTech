namespace BridgeTech.Api.DTOs.Ai;

public sealed class AiSummaryResponse
{
    public Guid VideoId { get; set; }
    public Guid LessonId { get; set; }
    public string VideoUrl { get; set; } = string.Empty;
    public string? Transcript { get; set; }
    public string? AiSummary { get; set; }
    public DateTimeOffset GeneratedAt { get; set; }
}
