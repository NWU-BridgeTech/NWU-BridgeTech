using System.ComponentModel.DataAnnotations;

namespace BridgeTech.Api.DTOs.SupportTickets;

public class CreateSupportTicketRequest
{
    [Required]
    [StringLength(30)]
    public string Category { get; set; } = string.Empty;

    [Required]
    [StringLength(2000)]
    public string Description { get; set; } = string.Empty;
}

public class UpdateSupportTicketStatusRequest
{
    [Required]
    [StringLength(20)]
    public string Status { get; set; } = string.Empty;
}

public class SupportTicketCreatedResponse
{
    public Guid Id { get; set; }
}

public class SupportTicketResponse
{
    public Guid Id { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentEmail { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
}
