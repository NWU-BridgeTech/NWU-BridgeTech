namespace BridgeTech.Api.DTOs.Users;

/// <summary>Represents the authenticated user's appearance and profile-picture preferences.</summary>
public sealed record UserPreferenceResponse(
    string Theme,
    string? ProfilePictureUrl);

/// <summary>Updates the authenticated user's appearance preferences.</summary>
public sealed record UpdateUserPreferenceRequest
{
    /// <summary>Controls whether the interface follows the system, light, or dark appearance.</summary>
    public required string Theme { get; init; }
}
