namespace BridgeTech.Api.DTOs.Admin;

public sealed class AdminDashboardResponse
{
    public IReadOnlyList<AdminDashboardMetricResponse> LearningOverview { get; init; } = [];
    public IReadOnlyList<AdminDashboardAttentionResponse> NeedsAttention { get; init; } = [];
    public IReadOnlyList<AdminDashboardActivityResponse> RecentActivity { get; init; } = [];
    public AdminDashboardPlatformStatusResponse PlatformStatus { get; init; } = new();
}

public sealed class AdminDashboardPlatformStatusResponse
{
    public string State { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Details { get; init; } = string.Empty;
}

public sealed class AdminDashboardMetricResponse
{
    public string Key { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
    public decimal? Value { get; init; }
    public string Unit { get; init; } = "count";
    public string Description { get; init; } = string.Empty;
    public IReadOnlyList<decimal?> Trend { get; init; } = [];
}

public sealed class AdminDashboardAttentionResponse
{
    public string Key { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
    public int Count { get; init; }
    public string Note { get; init; } = string.Empty;
    public IReadOnlyList<AdminDashboardAttentionItemResponse> Items { get; init; } = [];
}

public sealed class AdminDashboardAttentionItemResponse
{
    public string Title { get; init; } = string.Empty;
    public string Detail { get; init; } = string.Empty;
}

public sealed class AdminDashboardActivityResponse
{
    public Guid Id { get; init; }
    public string Actor { get; init; } = string.Empty;
    public string Action { get; init; } = string.Empty;
    public string Subject { get; init; } = string.Empty;
    public DateTimeOffset OccurredAt { get; init; }
}