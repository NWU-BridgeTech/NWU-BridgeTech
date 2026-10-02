namespace BridgeTech.Api.Domain.Entities;

// Stores transcript and summary content generated for a lesson video.
public class VideoSummary
{
    public Guid VideoId { get; set; }
    public Guid LessonId { get; set; }
    public string VideoUrl { get; set; } = null!;
    public string? Transcript { get; set; }
    public string? AiSummary { get; set; }
    public DateTimeOffset GeneratedAt { get; set; }

    public Lesson Lesson { get; set; } = null!;
}