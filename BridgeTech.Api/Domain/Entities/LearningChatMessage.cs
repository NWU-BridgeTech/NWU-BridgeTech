namespace BridgeTech.Api.Domain.Entities;

public class LearningChatMessage
{
    public Guid LearningChatMessageId { get; set; }
    public Guid UserId { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }

    public User User { get; set; } = null!;
}
