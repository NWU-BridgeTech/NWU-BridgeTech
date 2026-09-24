using BridgeTech.Api.Data;
using BridgeTech.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BridgeTech.Api.Services.Notifications;

public sealed class NotificationService(AppDbContext context) : INotificationService
{
    public async Task NotifyAsync(Guid userId, string type, string title, string? message, Guid? relatedEntityId = null, CancellationToken cancellationToken = default)
    {
        context.Notifications.Add(new Notification { UserId = userId, Type = type, Title = title, Message = message, RelatedEntityId = relatedEntityId });
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Notification>> GetAsync(Guid userId, bool unreadOnly, CancellationToken cancellationToken = default) =>
        await context.Notifications.AsNoTracking().Where(n => n.UserId == userId && (!unreadOnly || !n.IsRead)).OrderByDescending(n => n.CreatedAt).Take(100).ToListAsync(cancellationToken);

    public async Task MarkReadAsync(Guid userId, Guid notificationId, CancellationToken cancellationToken = default)
    {
        await context.Notifications.Where(n => n.Id == notificationId && n.UserId == userId).ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true), cancellationToken);
    }

    public async Task MarkAllReadAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        await context.Notifications.Where(n => n.UserId == userId && !n.IsRead).ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true), cancellationToken);
    }
}