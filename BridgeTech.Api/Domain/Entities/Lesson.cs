namespace BridgeTech.Api.Domain.Entities;

// A lesson belongs to one module and may contain AI-generated video summaries.
public class Lesson
{
    public Guid LessonId { get; set; }
    public Guid ModuleId { get; set; }
    public string Title { get; set; } = null!;
    public string? Content { get; set; }
    public short OrderIndex { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public Module Module { get; set; } = null!;
    public ICollection<VideoSummary> VideoSummaries { get; set; } = new List<VideoSummary>();
}