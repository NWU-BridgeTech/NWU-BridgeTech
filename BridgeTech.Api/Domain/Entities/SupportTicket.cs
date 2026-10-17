using BridgeTech.Api.Domain.Enums;

namespace BridgeTech.Api.Domain.Entities;

public class SupportTicket
{
    public Guid SupportTicketId { get; set; }
    public Guid UserId { get; set; }
    public SupportTicketCategory Category { get; set; }
    public string Description { get; set; } = null!;
    public SupportTicketStatus Status { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public User User { get; set; } = null!;
}
