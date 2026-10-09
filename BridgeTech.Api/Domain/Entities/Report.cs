namespace BridgeTech.Api.Domain.Entities;

public class Report
{
    public Guid ReportId { get; set; }
    public Guid GeneratedByUserId { get; set; }
    public string ReportType { get; set; } = null!;
    public int RowCount { get; set; }
    public string DataJson { get; set; } = null!;
    public DateTimeOffset GeneratedAt { get; set; }

    public User GeneratedByUser { get; set; } = null!;
}
