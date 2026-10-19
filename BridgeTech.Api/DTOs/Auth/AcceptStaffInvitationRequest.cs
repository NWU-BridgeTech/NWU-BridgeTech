using System.ComponentModel.DataAnnotations;

namespace BridgeTech.Api.DTOs.Auth;

public class AcceptStaffInvitationRequest
{
    [Required]
    public string Token { get; set; } = string.Empty;

    [Required, StringLength(128, MinimumLength = 8)]
    public string NewPassword { get; set; } = string.Empty;
}