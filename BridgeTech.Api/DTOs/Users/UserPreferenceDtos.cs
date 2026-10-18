namespace BridgeTech.Api.DTOs.Users;

/// <summary>Represents the authenticated user's appearance and notification preferences.</summary>
public sealed record UserPreferenceResponse(
    string Theme,
    string? ProfilePictureUrl,
    bool NotifyNewSubmissions = true,
    bool NotifyQuizCompletions = true,
    bool NotifyPlatformUpdates = true);

/// <summary>Updates the authenticated user's appearance preferences.</summary>
public sealed record UpdateUserPreferenceRequest
{
    /// <summary>Controls whether the interface follows the system, light, or dark appearance.</summary>
    public required string Theme { get; init; }

    public bool? NotifyNewSubmissions { get; init; }
    public bool? NotifyQuizCompletions { get; init; }
    public bool? NotifyPlatformUpdates { get; init; }
}
