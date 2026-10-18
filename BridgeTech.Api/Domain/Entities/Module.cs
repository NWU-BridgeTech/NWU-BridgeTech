using BridgeTech.Api.Domain.Enums;

namespace BridgeTech.Api.Domain.Entities;

// A top-level learning unit containing lessons, quizzes, and exercises.
public class Module
{
    public Guid ModuleId { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public short OrderIndex { get; set; }

    // Difficulty level shown on the admin Modules page.
    public ModuleLevel Level { get; set; } = ModuleLevel.Beginner;

    // Draft modules stay hidden from students until an admin publishes them.
    public ContentStatus Status { get; set; } = ContentStatus.Draft;

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    // These collections represent the module's dependent learning content.
    public ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
    public ICollection<Quiz> Quizzes { get; set; } = new List<Quiz>();
    public ICollection<Exercise> Exercises { get; set; } = new List<Exercise>();
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public ICollection<Certificate> Certificates { get; set; } = new List<Certificate>();
}