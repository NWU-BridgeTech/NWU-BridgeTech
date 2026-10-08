namespace BridgeTech.Api.Services.Admin;

public static class ActivityFormatter
{
    // Produces the short labels the admin tables display ("Today", "3 days ago", ...).
    // Calendar days are compared in UTC; clients that need local time use the ISO timestamp.
    public static string Describe(DateTimeOffset? at, DateTimeOffset now)
    {
        if (at is null) return "Not yet active";

        var days = (now.UtcDateTime.Date - at.Value.UtcDateTime.Date).Days;
        return days switch
        {
            <= 0 => "Today",
            1 => "Yesterday",
            < 14 => $"{days} days ago",
            < 60 => $"{days / 7} weeks ago",
            _ => $"{days / 30} months ago"
        };
    }
}
