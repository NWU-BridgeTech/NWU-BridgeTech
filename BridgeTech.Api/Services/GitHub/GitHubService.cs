using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Serialization;
using BridgeTech.Api.Common.Options;
using BridgeTech.Api.Data;
using BridgeTech.Api.Services.Notifications;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace BridgeTech.Api.Services.GitHub;

public sealed class GitHubService : IGitHubService
{
    private readonly AppDbContext _dbContext;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly GitHubApiOptions _options;
    private readonly IDataProtector _stateProtector;
    private readonly INotificationService _notificationService;

    public GitHubService(
        AppDbContext dbContext,
        IHttpClientFactory httpClientFactory,
        IOptions<GitHubApiOptions> options,
        IDataProtectionProvider dataProtectionProvider,
        INotificationService notificationService)
    {
        _dbContext = dbContext;
        _httpClientFactory = httpClientFactory;
        _options = options.Value;
        _stateProtector = dataProtectionProvider.CreateProtector("BridgeTech.GitHubOAuthState");
        _notificationService = notificationService;
    }

    public string CreateAuthorizationUrl(Guid userId)
    {
        EnsureConfigured();
        var payload = JsonSerializer.Serialize(new OAuthState(userId, DateTimeOffset.UtcNow.AddMinutes(10)));
        var state = Uri.EscapeDataString(_stateProtector.Protect(payload));
        var callbackUrl = Uri.EscapeDataString(_options.CallbackUrl);

        return $"https://github.com/login/oauth/authorize?client_id={Uri.EscapeDataString(_options.ClientId)}&redirect_uri={callbackUrl}&scope=read:user%20public_repo&state={state}";
    }

    public async Task<string> ConnectUserAsync(string state, string code, CancellationToken cancellationToken = default)
    {
        EnsureConfigured();
        var oauthState = ReadState(state);
        using var client = _httpClientFactory.CreateClient();

        using var tokenRequest = new HttpRequestMessage(HttpMethod.Post, "https://github.com/login/oauth/access_token")
        {
            Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["client_id"] = _options.ClientId,
                ["client_secret"] = _options.ClientSecret,
                ["code"] = code,
                ["redirect_uri"] = _options.CallbackUrl
            })
        };
        tokenRequest.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        using var tokenResponse = await client.SendAsync(tokenRequest, cancellationToken);
        tokenResponse.EnsureSuccessStatusCode();
        var token = await tokenResponse.Content.ReadFromJsonAsync<AccessTokenResponse>(cancellationToken)
            ?? throw new InvalidOperationException("GitHub did not return an access token.");
        if (string.IsNullOrWhiteSpace(token.AccessToken))
            throw new InvalidOperationException("GitHub did not return an access token.");

        using var userRequest = new HttpRequestMessage(HttpMethod.Get, "https://api.github.com/user");
        userRequest.Headers.UserAgent.ParseAdd("BridgeTech/1.0");
        userRequest.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github+json"));
        userRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token.AccessToken);
        using var userResponse = await client.SendAsync(userRequest, cancellationToken);
        userResponse.EnsureSuccessStatusCode();
        var githubUser = await userResponse.Content.ReadFromJsonAsync<GitHubUserResponse>(cancellationToken)
            ?? throw new InvalidOperationException("GitHub did not return a user.");
        if (string.IsNullOrWhiteSpace(githubUser.Login))
            throw new InvalidOperationException("GitHub did not return a username.");

        var user = await _dbContext.Users.FirstOrDefaultAsync(x => x.UserId == oauthState.UserId, cancellationToken)
            ?? throw new InvalidOperationException("User account was not found.");
        var usernameTaken = await _dbContext.Users.AnyAsync(
            x => x.UserId != user.UserId && x.GithubUsername != null && x.GithubUsername.ToLower() == githubUser.Login.ToLower(),
            cancellationToken);
        if (usernameTaken)
            throw new InvalidOperationException("That GitHub account is already connected to another BridgeTech account.");

        user.GithubUsername = githubUser.Login;
        user.GithubAccessToken = _stateProtector.Protect(token.AccessToken);
        user.GithubRepository = null;
        user.AccountSetupRequired = false;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _notificationService.NotifyAsync(
            user.UserId,
            "github_connected",
            "GitHub account connected",
            $"Your GitHub account @{githubUser.Login} is now connected to BridgeTech.",
            cancellationToken: cancellationToken);
        return githubUser.Login;
    }

    public Task<string?> GetUsernameAsync(Guid userId, CancellationToken cancellationToken = default) =>
        _dbContext.Users
            .Where(x => x.UserId == userId)
            .Select(x => x.GithubUsername)
            .SingleOrDefaultAsync(cancellationToken);

    public Task<string?> GetLinkedRepositoryAsync(Guid userId, CancellationToken cancellationToken = default) =>
        _dbContext.Users
            .Where(x => x.UserId == userId)
            .Select(x => x.GithubRepository)
            .SingleOrDefaultAsync(cancellationToken);

    public async Task<IReadOnlyList<GitHubRepositoryResponse>> GetRepositoriesAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var client = await CreateGitHubClientAsync(userId, cancellationToken);
        using var response = await client.GetAsync("https://api.github.com/user/repos?visibility=public&affiliation=owner,collaborator&sort=updated&per_page=100", cancellationToken);
        response.EnsureSuccessStatusCode();
        var repositories = await response.Content.ReadFromJsonAsync<List<GitHubRepositoryApiResponse>>(cancellationToken)
            ?? new List<GitHubRepositoryApiResponse>();
        return repositories.Where(x => !string.IsNullOrWhiteSpace(x.FullName))
            .Select(x => new GitHubRepositoryResponse(x.FullName, x.HtmlUrl, x.IsPrivate))
            .ToList();
    }

    public async Task<GitHubRepositoryResponse> LinkRepositoryAsync(Guid userId, string fullName, CancellationToken cancellationToken = default)
    {
        var repositories = await GetRepositoriesAsync(userId, cancellationToken);
        var repository = repositories.SingleOrDefault(x => string.Equals(x.FullName, fullName.Trim(), StringComparison.OrdinalIgnoreCase));
        if (repository is null) throw new InvalidOperationException("Choose a public repository belonging to your connected GitHub account.");

        var user = await _dbContext.Users.SingleAsync(x => x.UserId == userId, cancellationToken);
        user.GithubRepository = repository.FullName;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _notificationService.NotifyAsync(userId, "github_repository_linked", "Repository linked", $"{repository.FullName} is now linked to your BridgeTech practical work.", cancellationToken: cancellationToken);
        return repository;
    }

    private async Task<HttpClient> CreateGitHubClientAsync(Guid userId, CancellationToken cancellationToken)
    {
        var encryptedToken = await _dbContext.Users.Where(x => x.UserId == userId).Select(x => x.GithubAccessToken).SingleOrDefaultAsync(cancellationToken);
        if (string.IsNullOrWhiteSpace(encryptedToken)) throw new InvalidOperationException("Connect your GitHub account first.");
        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.UserAgent.ParseAdd("BridgeTech/1.0");
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github+json"));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _stateProtector.Unprotect(encryptedToken));
        return client;
    }

    private OAuthState ReadState(string state)
    {
        try
        {
            var payload = _stateProtector.Unprotect(Uri.UnescapeDataString(state));
            var oauthState = JsonSerializer.Deserialize<OAuthState>(payload);
            if (oauthState is null || oauthState.ExpiresAt <= DateTimeOffset.UtcNow)
                throw new InvalidOperationException("The GitHub connection request expired.");
            return oauthState;
        }
        catch (InvalidOperationException)
        {
            throw;
        }
        catch (Exception exception) when (exception is CryptographicException or JsonException or UriFormatException)
        {
            throw new InvalidOperationException("The GitHub connection request is invalid.");
        }
    }

    private void EnsureConfigured()
    {
        if (string.IsNullOrWhiteSpace(_options.ClientId) ||
            string.IsNullOrWhiteSpace(_options.ClientSecret) ||
            string.IsNullOrWhiteSpace(_options.CallbackUrl))
            throw new InvalidOperationException("GitHub OAuth is not configured.");
    }

    private sealed record OAuthState(Guid UserId, DateTimeOffset ExpiresAt);
    private sealed record AccessTokenResponse([property: JsonPropertyName("access_token")] string AccessToken);
    private sealed record GitHubUserResponse(string Login);
    private sealed record GitHubRepositoryApiResponse(
        [property: JsonPropertyName("full_name")] string FullName,
        [property: JsonPropertyName("html_url")] string HtmlUrl,
        [property: JsonPropertyName("private")] bool IsPrivate);
}
