using BridgeTech.Api.Domain.Enums;

namespace BridgeTech.Api.Domain.Entities;

// A lesson belongs to one module and may contain AI-generated video summaries.
public class Lesson
{
    public Guid LessonId { get; set; }
    public Guid ModuleId { get; set; }
    public string Title { get; set; } = null!;

    // Short summary shown in the admin lesson list.
    public string? Description { get; set; }

    public string? Content { get; set; }
    public short OrderIndex { get; set; }

    // Estimated time to complete the lesson, in minutes.
    public short DurationMinutes { get; set; }

    // Draft lessons stay hidden from students until an admin publishes them.
    public ContentStatus Status { get; set; } = ContentStatus.Draft;

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public Module Module { get; set; } = null!;
    public ICollection<VideoSummary> VideoSummaries { get; set; } = new List<VideoSummary>();
}