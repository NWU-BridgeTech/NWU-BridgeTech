using BridgeTech.Api.DTOs.GitHub;

namespace BridgeTech.Api.Services.GitHub;

public interface IGitHubService
{
    string CreateAuthorizationUrl(Guid userId);
    Task<string> ConnectUserAsync(string state, string code, CancellationToken cancellationToken = default);
    Task<string?> GetUsernameAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<string?> GetRepositoryAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<GitHubRepositoryResponse>> GetRepositoriesAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<string?> LinkRepositoryAsync(Guid userId, string fullName, CancellationToken cancellationToken = default);
}
