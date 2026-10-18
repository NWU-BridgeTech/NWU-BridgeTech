namespace BridgeTech.Api.Domain.Entities;

public class UserPreference
{
    public Guid UserId { get; set; }
    public string Theme { get; set; } = "light";
    public bool NotifyNewSubmissions { get; set; } = true;
    public bool NotifyQuizCompletions { get; set; } = true;
    public bool NotifyPlatformUpdates { get; set; } = true;
    public byte[]? ProfilePicture { get; set; }
    public string? ProfilePictureContentType { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public User User { get; set; } = null!;
}
