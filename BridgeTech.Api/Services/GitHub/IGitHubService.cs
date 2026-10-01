namespace BridgeTech.Api.Services.GitHub;

public interface IGitHubService
{
    string CreateAuthorizationUrl(Guid userId);
    Task<string> ConnectUserAsync(string state, string code, CancellationToken cancellationToken = default);
    Task<string?> GetUsernameAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<string?> GetLinkedRepositoryAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<GitHubRepositoryResponse>> GetRepositoriesAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<GitHubRepositoryResponse> LinkRepositoryAsync(Guid userId, string fullName, CancellationToken cancellationToken = default);
}

public sealed record GitHubRepositoryResponse(string FullName, string HtmlUrl, bool IsPrivate);
