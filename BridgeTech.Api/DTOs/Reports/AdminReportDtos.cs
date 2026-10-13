
namespace BridgeTech.Api.DTOs.Reports;

// A summary card displayed at the top of a report.
public sealed class ReportMetricDto
{
    public string Label { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}

// Defines one column in the report table.
public sealed class ReportColumnDto
{
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
}

// Represents one data point on the graph.
public sealed class ReportChartPointDto
{
    public string Label { get; set; } = string.Empty;
    public double Value { get; set; }
}

// The complete response shared by all four report types.
public sealed class AdminReportResponse
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    public string ChartTitle { get; set; } = string.Empty;
    public string ChartUnit { get; set; } = string.Empty;
    public string ChartType { get; set; } = "bar";

    public DateTimeOffset GeneratedAt { get; set; }
        = DateTimeOffset.UtcNow;

    public List<ReportMetricDto> Metrics { get; set; } = [];

    public List<ReportColumnDto> Columns { get; set; } = [];

    public List<Dictionary<string, string>> Rows { get; set; } = [];

    public List<ReportChartPointDto> Chart { get; set; } = [];
}
