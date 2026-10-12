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
        using var response = await client.PostAsJsonAsync(options.Endpoint, new
        {
            model = options.Model,
            temperature = 0.3,
            messages
        }, ct);
        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning("{Provider} learning chat failed with status {StatusCode}.", options.Provider, response.StatusCode);
            db.LearningChatMessages.Add(new Domain.Entities.LearningChatMessage
            {
                UserId = userId,
                Role = "assistant",
                Content = "I’m temporarily unavailable. Please try again shortly."
            });
            await db.SaveChangesAsync(ct);
            return new LearningChatResponse { Message = "I’m temporarily unavailable. Please try again shortly." };
        }

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(ct));
        var content = document.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
        var responseMessage = content ?? "I couldn’t generate a response.";
        db.LearningChatMessages.Add(new Domain.Entities.LearningChatMessage
        {
            UserId = userId,
            Role = "assistant",
            Content = responseMessage
        });
        await db.SaveChangesAsync(ct);
        return new LearningChatResponse { Message = responseMessage };
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
        response.EnsureSuccessStatusCode();
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
