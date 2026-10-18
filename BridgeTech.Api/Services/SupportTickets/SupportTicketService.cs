using BridgeTech.Api.Data;
using BridgeTech.Api.Domain.Entities;
using BridgeTech.Api.Domain.Enums;
using BridgeTech.Api.DTOs.SupportTickets;
using Microsoft.EntityFrameworkCore;

namespace BridgeTech.Api.Services.SupportTickets;

public sealed class SupportTicketService(AppDbContext db) : ISupportTicketService
{
    public async Task<Guid> CreateAsync(
        Guid userId,
        SupportTicketCategory category,
        string description,
        CancellationToken cancellationToken = default)
    {
        var ticket = new SupportTicket
        {
            UserId = userId,
            Category = category,
            Description = description,
            Status = SupportTicketStatus.Open
        };

        db.SupportTickets.Add(ticket);
        await db.SaveChangesAsync(cancellationToken);
        return ticket.SupportTicketId;
    }

    public async Task<IReadOnlyList<SupportTicketResponse>> ListAsync(CancellationToken cancellationToken = default)
    {
        var tickets = await db.SupportTickets
            .AsNoTracking()
            .OrderBy(x => x.Status)
            .ThenByDescending(x => x.CreatedAt)
            .Select(x => new
            {
                x.SupportTicketId,
                x.User.FirstName,
                x.User.LastName,
                x.User.Email,
                x.Category,
                x.Description,
                x.Status,
                x.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return tickets
            .Select(x => new SupportTicketResponse
            {
                Id = x.SupportTicketId,
                StudentName = $"{x.FirstName} {x.LastName}".Trim(),
                StudentEmail = x.Email,
                Category = x.Category.ToString(),
                Description = x.Description,
                Status = x.Status.ToString(),
                CreatedAt = x.CreatedAt
            })
            .ToList();
    }

    public async Task<bool> UpdateStatusAsync(
        Guid supportTicketId,
        SupportTicketStatus status,
        CancellationToken cancellationToken = default)
    {
        var updated = await db.SupportTickets
            .Where(x => x.SupportTicketId == supportTicketId)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.Status, status), cancellationToken);

        return updated > 0;
    }
}
