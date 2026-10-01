namespace BridgeTech.Api.DTOs.Admin;

/// <summary>
/// Request to update an administrator's role and status.
/// </summary>
public class UpdateAdministratorRequest
{
    /// <summary>
    /// Admin role: "Administrator", "Content Manager", "Reviewer"
    /// </summary>
    public string? Role { get; set; }
    
    /// <summary>
    /// Admin status: "Active" or "Inactive"
    /// </summary>
    public string? Status { get; set; }
}
