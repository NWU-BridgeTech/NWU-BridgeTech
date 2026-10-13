using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using BridgeTech.Api.Common.Options;
using BridgeTech.Api.Data;
using BridgeTech.Api.DTOs.GitHub;
using BridgeTech.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace BridgeTech.Api.Services.GitHub;

public sealed class LearningInsightsService : ILearningInsightsService
{
    private readonly AppDbContext db;
    private readonly IHttpClientFactory httpClientFactory;
    private readonly IOptions<OpenAIOptions> openAiOptions;
    private readonly ILogger<LearningInsightsService> logger;
    private readonly string systemPromptTemplate;

    public LearningInsightsService(
        AppDbContext db,
        IHttpClientFactory httpClientFactory,
        IOptions<OpenAIOptions> openAiOptions,
        ILogger<LearningInsightsService> logger,
        IWebHostEnvironment environment)
    {
        this.db = db;
        this.httpClientFactory = httpClientFactory;
        this.openAiOptions = openAiOptions;
        this.logger = logger;
        var promptPath = Path.Combine(environment.ContentRootPath, "Prompts", "blui-system-prompt.md");
        if (!File.Exists(promptPath))
            throw new InvalidOperationException($"Blui system prompt was not found at '{promptPath}'.");
        systemPromptTemplate = File.ReadAllText(promptPath);
    }

    public async Task<LearningInsightsResponse> GetAsync(
        Guid userId,
        bool generateAnalysis = false,
        CancellationToken ct = default)
    {
        var user = await db.Users.AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => new { x.GithubRepository, x.GithubAccessToken })
            .SingleOrDefaultAsync(ct)
            ?? throw new InvalidOperationException("User account was not found.");

        var enrolledModuleIds = await db.Enrollments.AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => x.ModuleId)
            .ToListAsync(ct);
        var enrolledModules = enrolledModuleIds.Count;
        var completedModules = await db.Enrollments.AsNoTracking()
            .CountAsync(x => x.UserId == userId && x.Status == EnrollmentStatus.Completed, ct);
        var lessonsAvailable = await db.Lessons.AsNoTracking()
            .CountAsync(x => enrolledModuleIds.Contains(x.ModuleId) && x.Status == ContentStatus.Published, ct);
        var lessonsCompleted = await db.LessonProgress.AsNoTracking()
            .CountAsync(x => x.UserId == userId && x.Completed
                && x.Lesson.Status == ContentStatus.Published
                && enrolledModuleIds.Contains(x.Lesson.ModuleId), ct);
        var attempts = await db.QuizAttempts.AsNoTracking()
            .Where(x => x.UserId == userId && x.CompletedAt != null)
            .Select(x => new { x.Score, x.Passed })
            .ToListAsync(ct);
        var exercisesAvailable = await db.Exercises.AsNoTracking()
            .CountAsync(x => enrolledModuleIds.Contains(x.ModuleId), ct);
        var exercisesCompleted = await db.ExerciseCompletions.AsNoTracking()
            .CountAsync(x => x.UserId == userId && enrolledModuleIds.Contains(x.Exercise.ModuleId), ct);
        var statistics = new LearningStatistics
        {
            EnrolledModules = enrolledModules,
            CompletedModules = completedModules,
            LessonsAvailable = lessonsAvailable,
            LessonsCompleted = lessonsCompleted,
            LessonsProgressPercentage = Percentage(lessonsCompleted, lessonsAvailable),
            QuizAttempts = attempts.Count,
            QuizPasses = attempts.Count(x => x.Passed == true),
            AverageQuizScore = attempts.Count == 0 ? 0 : (int)Math.Round(attempts.Average(x => x.Score ?? 0)),
            ExercisesAvailable = exercisesAvailable,
            ExercisesCompleted = exercisesCompleted,
            ExerciseProgressPercentage = Percentage(exercisesCompleted, exercisesAvailable),
            BadgesEarned = await db.Badges.CountAsync(x => x.UserId == userId, ct),
            CertificatesEarned = await db.Certificates.CountAsync(x => x.UserId == userId, ct)
        };

        if (!string.IsNullOrWhiteSpace(user.GithubRepository))
        {
            try
            {
                var repository = await GetRepositoryAsync(user.GithubRepository, user.GithubAccessToken, ct);
                statistics.RepositoryOpenIssues = repository.OpenIssues;
                statistics.RepositoryStars = repository.Stars;
                statistics.RepositoryCommitsLast30Days = await GetRecentCommitCountAsync(user.GithubRepository, user.GithubAccessToken, ct);
            }
            catch (HttpRequestException exception)
            {
                logger.LogWarning(exception, "Unable to load GitHub metrics for {Repository}.", user.GithubRepository);
            }
        }

        return new LearningInsightsResponse
        {
            Repository = user.GithubRepository,
            Statistics = statistics,
            Analysis = generateAnalysis ? await GenerateAnalysisAsync(statistics, ct) : null,
            GeneratedAt = DateTimeOffset.UtcNow
        };
    }

    public async Task<LearningChatResponse> ChatAsync(
        Guid userId,
        LearningChatRequest request,
        CancellationToken ct = default)
    {
        var message = request.Message?.Trim();
        if (string.IsNullOrWhiteSpace(message))
            throw new ArgumentException("A message is required.", nameof(request));
        if (message.Length > 2000)
            throw new ArgumentException("Messages must be 2,000 characters or fewer.", nameof(request));

        var insights = await GetAsync(userId, ct: ct);
        var options = openAiOptions.Value;
        if (string.IsNullOrWhiteSpace(options.ApiKey))
        {
            const string unavailableMessage = "AI chat is not configured yet. Your measurable learning statistics are still available.";
            db.LearningChatMessages.AddRange(
                new Domain.Entities.LearningChatMessage { UserId = userId, Role = "user", Content = message },
                new Domain.Entities.LearningChatMessage { UserId = userId, Role = "assistant", Content = unavailableMessage });
            await db.SaveChangesAsync(ct);
            return new LearningChatResponse { Message = unavailableMessage };
        }

        var studentContext = JsonSerializer.Serialize(insights.Statistics);
        var systemPrompt = systemPromptTemplate.Replace("{{STUDENT_CONTEXT}}", studentContext, StringComparison.Ordinal);
        var messages = new List<object>
        {
            new
            {
                role = "system",
                content = systemPrompt
            }
        };
        if (request.Regenerate)
        {
            messages.Add(new
            {
                role = "system",
                content = "Regeneration requested: correct the previous response rather than repeating it. If the request calls for a detailed walkthrough, return exactly one valid blui-diagram JSON block with 6 to 14 nodes, at least two connected steps, and valid JSON. Do not explain the correction outside the response."
            });
        }

        var storedHistory = await db.LearningChatMessages.AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .Take(10)
            .OrderBy(x => x.CreatedAt)
            .ToListAsync(ct);

        foreach (var historyMessage in storedHistory)
        {
            messages.Add(new { role = historyMessage.Role, content = historyMessage.Content[..Math.Min(historyMessage.Content.Length, 4000)] });
        }

        messages.Add(new { role = "user", content = message });
        db.LearningChatMessages.Add(new Domain.Entities.LearningChatMessage
        {
            UserId = userId,
            Role = "user",
            Content = message
        });
        using var client = httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", options.ApiKey);
        var detailedDiagramRequest = IsDetailedDiagramRequest(message);
        var responseMessage = await SendChatRequestAsync(client, options, messages, ct);
        if (detailedDiagramRequest && !ContainsValidRichDiagram(responseMessage))
        {
            messages.Add(new
            {
                role = "assistant",
                content = responseMessage
            });
            messages.Add(new
            {
                role = "system",
                content = "The previous answer did not contain a valid rich diagram. Rewrite it now. Return exactly one blui-diagram fenced block containing valid JSON only, with 6 to 14 nodes, at least two edges, descriptive titles and summaries, and no plain-text simulation steps outside the block."
            });
            responseMessage = await SendChatRequestAsync(client, options, messages, ct);
            if (!ContainsValidRichDiagram(responseMessage))
            {
                responseMessage = CreateFallbackArchitectureDiagram();
            }
        }
        if (string.IsNullOrWhiteSpace(responseMessage))
        {
            responseMessage = "I couldn’t generate a response.";
        }

        db.LearningChatMessages.Add(new Domain.Entities.LearningChatMessage
        {
            UserId = userId,
            Role = "assistant",
            Content = responseMessage
        });
        await db.SaveChangesAsync(ct);
        return new LearningChatResponse { Message = responseMessage };
    }

    private async Task<string> SendChatRequestAsync(
        HttpClient client,
        OpenAIOptions options,
        List<object> messages,
        CancellationToken ct)
    {
        using var response = await client.PostAsJsonAsync(options.Endpoint, new
        {
            model = options.Model,
            temperature = 0.3,
            messages
        }, ct);
        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning("{Provider} learning chat failed with status {StatusCode}.", options.Provider, response.StatusCode);
            return "I’m temporarily unavailable. Please try again shortly.";
        }

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(ct));
        return document.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString()
            ?? string.Empty;
    }

    private static bool IsDetailedDiagramRequest(string message)
    {
        var normalized = message.ToLowerInvariant();
        return normalized.Contains("detailed walkthrough")
            || normalized.Contains("end-to-end")
            || normalized.Contains("architecture")
            || normalized.Contains("authentication lifecycle")
            || normalized.Contains("step-by-step");
    }

    private static bool ContainsValidRichDiagram(string response)
    {
        var start = response.IndexOf("```blui-diagram", StringComparison.OrdinalIgnoreCase);
        if (start < 0) return false;
        start = response.IndexOf('{', start);
        var end = response.IndexOf("```", start, StringComparison.Ordinal);
        if (start < 0 || end <= start) return false;
        try
        {
            using var document = JsonDocument.Parse(response[start..end]);
            var root = document.RootElement;
            return root.TryGetProperty("nodes", out var nodes)
                && nodes.ValueKind == JsonValueKind.Array
                && nodes.GetArrayLength() >= 2
                && root.TryGetProperty("edges", out var edges)
                && edges.ValueKind == JsonValueKind.Array
                && edges.GetArrayLength() > 0;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static string CreateFallbackArchitectureDiagram()
    {
        var diagram = new
        {
            title = "AWS file upload flow",
            description = "How a file moves from the browser through validation and storage.",
            direction = "TB",
            groups = new[]
            {
                new { id = "client", label = "Client" },
                new { id = "edge", label = "API edge" },
                new { id = "services", label = "Services" },
                new { id = "storage", label = "Storage" }
            },
            nodes = new[]
            {
                new { id = "browser", icon = "browser", title = "Select file", summary = "User chooses a file in the browser.", details = "The browser checks the file name and size before uploading. It sends the file with the user's authenticated request.", group = "client", step = 1, kind = "start" },
                new { id = "gateway", icon = "aws-api-gateway", title = "Receive upload", summary = "API Gateway accepts the request.", details = "The gateway applies routing and request limits. Valid requests continue to the upload function.", group = "edge", step = 2, kind = "process" },
                new { id = "auth", icon = "aws-cognito", title = "Verify identity", summary = "The upload request is authenticated.", details = "The service checks the user's identity and permissions. Unauthenticated requests are rejected before storage access.", group = "services", step = 3, kind = "decision" },
                new { id = "function", icon = "aws-lambda", title = "Validate upload", summary = "Lambda checks file rules.", details = "The function validates the content type, size, and destination key. Invalid files receive a clear client error.", group = "services", step = 4, kind = "process" },
                new { id = "scan", icon = "aws-lambda", title = "Scan content", summary = "The file is checked for threats.", details = "A scanning step inspects the upload before it becomes available. Unsafe content is quarantined instead of being published.", group = "services", step = 5, kind = "process" },
                new { id = "bucket", icon = "aws-s3", title = "Store object", summary = "S3 stores the approved file.", details = "The object is written to a private bucket using a generated key. Access remains controlled by the application.", group = "storage", step = 6, kind = "data" },
                new { id = "record", icon = "aws-dynamodb", title = "Save metadata", summary = "Metadata records the upload.", details = "The database stores the owner, object key, size, and upload time. This lets the application list the user's files.", group = "storage", step = 7, kind = "data" },
                new { id = "response", icon = "server", title = "Return response", summary = "The API confirms the upload.", details = "The service returns a safe JSON response with the file identifier. The browser displays the completed upload.", group = "client", step = 8, kind = "end" }
            },
            edges = new[]
            {
                new { from = "browser", to = "gateway", label = "Multipart upload" },
                new { from = "gateway", to = "auth", label = "Forward request" },
                new { from = "auth", to = "function", label = "Valid identity" },
                new { from = "auth", to = "browser", label = "Reject: 401" },
                new { from = "function", to = "scan", label = "Approved file" },
                new { from = "scan", to = "bucket", label = "Safe content" },
                new { from = "scan", to = "browser", label = "Reject unsafe file" },
                new { from = "bucket", to = "record", label = "Object key" },
                new { from = "record", to = "response", label = "Metadata saved" },
                new { from = "response", to = "browser", label = "201 JSON response" }
            }
        };
        return $"Here is a reliable AWS upload flow:\\n\\n```blui-diagram\\n{JsonSerializer.Serialize(diagram)}\\n```";
    }

    public async Task<LearningChatHistoryResponse> GetChatHistoryAsync(Guid userId, CancellationToken ct = default)
    {
        return new LearningChatHistoryResponse
        {
            Messages = await db.LearningChatMessages.AsNoTracking()
                .Where(x => x.UserId == userId)
                .OrderBy(x => x.CreatedAt)
                .Select(x => new LearningChatHistoryItem { Role = x.Role, Content = x.Content })
                .ToListAsync(ct)
        };
    }

    public async Task ClearChatHistoryAsync(Guid userId, CancellationToken ct = default)
    {
        await db.LearningChatMessages.Where(x => x.UserId == userId).ExecuteDeleteAsync(ct);
    }

    private async Task<string> GenerateAnalysisAsync(LearningStatistics statistics, CancellationToken ct)
    {
        var options = openAiOptions.Value;
        if (string.IsNullOrWhiteSpace(options.ApiKey))
            return "AI analysis is not configured. Your measurable learning statistics are available above.";

        var prompt = $"Analyze this student's learning activity. Use only the supplied facts, do not invent achievements. Give concise sections: Strengths, Risks or gaps, Recommended next steps. Facts: {JsonSerializer.Serialize(statistics)}";
        using var client = httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", options.ApiKey);
        using var response = await client.PostAsJsonAsync(options.Endpoint, new
        {
            model = options.Model,
            temperature = 0.2,
            messages = new[]
            {
                new { role = "system", content = "You are Blui, a learning assistant for a software engineering education platform. Format comparisons as standard Markdown tables with a header and separator row. Never use ASCII tables made from plus signs, dashes, and pipes. For diagrams, use Mermaid and make them specific and instructional: use descriptive visible labels of 2-6 words, never single-letter labels such as A, B, P, or G; use rectangles for actions/services, rounded nodes for people or start/end points, diamonds for decisions; include meaningful arrow labels when useful." },
                new { role = "user", content = prompt }
            }
        }, ct);
        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning("{Provider} learning analysis failed with status {StatusCode}.", options.Provider, response.StatusCode);
            return "AI analysis is temporarily unavailable. Your measurable learning statistics are still available above.";
        }

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(ct));
        return document.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString()
            ?? "AI analysis was empty.";
    }

    private async Task<RepositorySnapshot> GetRepositoryAsync(string fullName, string? token, CancellationToken ct)
    {
        using var client = CreateGitHubClient(token);
        using var response = await client.GetAsync($"https://api.github.com/repos/{fullName}", ct);
        if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized &&
            !string.IsNullOrWhiteSpace(token))
        {
            logger.LogWarning(
                "The saved GitHub token was unauthorized for {Repository}. Retrying public repository metrics.",
                fullName);
            using var publicClient = CreateGitHubClient(null);
            using var publicResponse = await publicClient.GetAsync($"https://api.github.com/repos/{fullName}", ct);
            publicResponse.EnsureSuccessStatusCode();
            return await ReadRepositorySnapshotAsync(publicResponse, ct);
        }
        response.EnsureSuccessStatusCode();
        return await ReadRepositorySnapshotAsync(response, ct);
    }

    private static async Task<RepositorySnapshot> ReadRepositorySnapshotAsync(
        HttpResponseMessage response,
        CancellationToken ct)
    {
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(ct));
        var root = document.RootElement;
        return new RepositorySnapshot(
            root.GetProperty("stargazers_count").GetInt32(),
            root.GetProperty("open_issues_count").GetInt32());
    }

    private async Task<int> GetRecentCommitCountAsync(string fullName, string? token, CancellationToken ct)
    {
        using var client = CreateGitHubClient(token);
        var since = Uri.EscapeDataString(DateTimeOffset.UtcNow.AddDays(-30).ToString("O"));
        using var response = await client.GetAsync($"https://api.github.com/repos/{fullName}/commits?since={since}&per_page=100", ct);
        if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized &&
            !string.IsNullOrWhiteSpace(token))
        {
            logger.LogWarning(
                "The saved GitHub token was unauthorized for {Repository} commits. Retrying public commits.",
                fullName);
            using var publicClient = CreateGitHubClient(null);
            using var publicResponse = await publicClient.GetAsync(
                $"https://api.github.com/repos/{fullName}/commits?since={since}&per_page=100",
                ct);
            publicResponse.EnsureSuccessStatusCode();
            using var publicDocument = JsonDocument.Parse(await publicResponse.Content.ReadAsStringAsync(ct));
            return publicDocument.RootElement.GetArrayLength();
        }
        response.EnsureSuccessStatusCode();
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(ct));
        return document.RootElement.GetArrayLength();
    }

    private HttpClient CreateGitHubClient(string? token)
    {
        var client = httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.UserAgent.ParseAdd("BridgeTech/1.0");
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github+json"));
        if (!string.IsNullOrWhiteSpace(token))
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    private static int Percentage(int completed, int total) =>
        total == 0 ? 0 : (int)Math.Round(completed * 100d / total);

    private sealed record RepositorySnapshot(int Stars, int OpenIssues);
}
