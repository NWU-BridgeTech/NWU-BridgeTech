using BridgeTech.Api.Domain.Enums;

namespace BridgeTech.Api.Services.Admin;

public sealed record AdminRoleDefinition(string Name, string Description, UserRole Role);

// Single source of truth for the role names shown on the Administrators page and
// how they map onto the UserRole enum stored in the database.
public static class AdminRoleCatalog
{
    // Used in [Authorize(Roles = ...)] so they must be compile-time constants.
    public const string ManagementRoles = nameof(UserRole.Admin) + "," + nameof(UserRole.SuperAdmin);
    public const string StudentViewerRoles = nameof(UserRole.Admin) + "," + nameof(UserRole.SuperAdmin) + "," + nameof(UserRole.Reviewer);

    public const string SuperAdministratorName = "Super administrator";

    // Roles that can be handed out from the Administrators page. SuperAdmin is deliberately
    // not assignable: it can only be granted directly in the database.
    public static readonly IReadOnlyList<AdminRoleDefinition> Assignable =
    [
        new("Administrator", "Manage learning content, students and administrator settings.", UserRole.Admin),
        new("Content manager", "Manage modules, lessons, assessments and practical exercises.", UserRole.Instructor),
        new("Reviewer", "Review student submissions and identify learners needing support.", UserRole.Reviewer)
    ];

    public static string LabelFor(UserRole role) => role switch
    {
        UserRole.Admin => "Administrator",
        UserRole.Instructor => "Content manager",
        UserRole.Reviewer => "Reviewer",
        UserRole.SuperAdmin => SuperAdministratorName,
        _ => "Student"
    };

    public static bool TryParseAssignable(string? name, out UserRole role)
    {
        var match = Assignable.FirstOrDefault(r => string.Equals(r.Name, name?.Trim(), StringComparison.OrdinalIgnoreCase));
        role = match?.Role ?? default;
        return match is not null;
    }

    // Filters may also target the (read-only) super administrator role.
    public static bool TryParseAny(string? name, out UserRole role)
    {
        if (string.Equals(name?.Trim(), SuperAdministratorName, StringComparison.OrdinalIgnoreCase))
        {
            role = UserRole.SuperAdmin;
            return true;
        }
        return TryParseAssignable(name, out role);
    }
}
