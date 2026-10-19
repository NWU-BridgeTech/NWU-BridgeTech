using System.ComponentModel.DataAnnotations;

namespace BridgeTech.Api.DTOs.Users;

public class CreateStaffUserRequest
{
    [Required, StringLength(50, MinimumLength = 2)]
    public string FirstName { get; set; } = string.Empty;

    [Required, StringLength(50, MinimumLength = 2)]
    public string LastName { get; set; } = string.Empty;

    [Required, EmailAddress, StringLength(254)]
    public string Email { get; set; } = string.Empty;

    [Required, StringLength(20)]
    public string Role { get; set; } = string.Empty;
}