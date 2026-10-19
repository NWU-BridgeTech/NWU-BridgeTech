using BridgeTech.Api.Domain.Entities;

namespace BridgeTech.Api.Services.Notifications;

public interface INotificationService
{
    Task NotifyAsync(Guid userId, string type, string title, string? message, Guid? relatedEntityId = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<NotificationDto>> GetAsync(Guid userId, bool unreadOnly, CancellationToken cancellationToken = default);
    Task MarkReadAsync(Guid userId, Guid notificationId, CancellationToken cancellationToken = default);
    Task MarkAllReadAsync(Guid userId, CancellationToken cancellationToken = default);
}

public sealed record NotificationDto(
    Guid Id,
    string Type,
    string Title,
    string? Message,
    Guid? RelatedEntityId,
    bool IsRead,
    DateTimeOffset CreatedAt);