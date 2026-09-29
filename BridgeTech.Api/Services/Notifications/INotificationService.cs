using BridgeTech.Api.Domain.Entities;

namespace BridgeTech.Api.Services.Notifications;

public interface INotificationService
{
    Task NotifyAsync(Guid userId, string type, string title, string? message, Guid? relatedEntityId = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Notification>> GetAsync(Guid userId, bool unreadOnly, CancellationToken cancellationToken = default);
    Task MarkReadAsync(Guid userId, Guid notificationId, CancellationToken cancellationToken = default);
    Task MarkAllReadAsync(Guid userId, CancellationToken cancellationToken = default);
}