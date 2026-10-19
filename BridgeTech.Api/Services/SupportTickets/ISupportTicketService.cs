using BridgeTech.Api.Domain.Enums;
using BridgeTech.Api.DTOs.SupportTickets;

namespace BridgeTech.Api.Services.SupportTickets;

public interface ISupportTicketService
{
    Task<Guid> CreateAsync(Guid userId, SupportTicketCategory category, string description, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SupportTicketResponse>> ListAsync(CancellationToken cancellationToken = default);
    Task<bool> UpdateStatusAsync(Guid supportTicketId, SupportTicketStatus status, CancellationToken cancellationToken = default);
}
