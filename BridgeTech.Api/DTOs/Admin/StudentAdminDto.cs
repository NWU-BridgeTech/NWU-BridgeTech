namespace BridgeTech.Api.DTOs.Admin;

public class StudentAdminDto
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public int ModuleId { get; set; }
    public string ModuleTitle { get; set; } = null!;
    public int Progress { get; set; }
    public string LastActive { get; set; } = null!;
    public string Status { get; set; } = null!;
    public int? QuizScore { get; set; }
    public int CompletedPracticals { get; set; }
    public bool GithubConnected { get; set; }
    public string? Note { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
