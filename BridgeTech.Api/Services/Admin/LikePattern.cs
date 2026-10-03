namespace BridgeTech.Api.Services.Admin;

public static class LikePattern
{
    // Builds a "%term%" pattern for ILIKE, escaping the characters PostgreSQL treats as wildcards.
    public static string Contains(string term)
    {
        var escaped = term.Trim()
            .Replace("\\", "\\\\")
            .Replace("%", "\\%")
            .Replace("_", "\\_");
        return $"%{escaped}%";
    }
}
