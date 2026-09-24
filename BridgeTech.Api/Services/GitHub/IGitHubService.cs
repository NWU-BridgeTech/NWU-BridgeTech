namespace BridgeTech.Api.Services.GitHub;

public interface IGitHubService
{
    string CreateAuthorizationUrl(Guid userId);
    Task<string> ConnectUserAsync(string state, string code, CancellationToken cancellationToken = default);
    Task<string?> GetUsernameAsync(Guid userId, CancellationToken cancellationToken = default);
}
