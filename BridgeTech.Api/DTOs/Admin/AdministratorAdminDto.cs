namespace BridgeTech.Api.DTOs.Admin;

public class AdministratorAdminDto
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Role { get; set; } = null!;
    public string Status { get; set; } = null!;
    public string LastActive { get; set; } = null!;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
