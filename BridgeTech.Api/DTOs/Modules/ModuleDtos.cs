using System.ComponentModel.DataAnnotations;

namespace BridgeTech.Api.DTOs.Modules;

public class ModuleResponse
{
    public Guid ModuleId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public short OrderIndex { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public class CreateModuleRequest
{
    [Required]
    [StringLength(200, MinimumLength = 3)]
    public string Title { get; set; } = string.Empty;

    [StringLength(2000)]
    public string? Description { get; set; }

    [Range(0, short.MaxValue)]
    public short OrderIndex { get; set; }
}

public class UpdateModuleRequest
{
    [StringLength(200, MinimumLength = 3)]
    public string? Title { get; set; }

    [StringLength(2000)]
    public string? Description { get; set; }

    [Range(0, short.MaxValue)]
    public short? OrderIndex { get; set; }
}

public class ModuleListItemResponse
{
    public Guid ModuleId { get; set; }
    public string Title { get; set; } = string.Empty;
    public short OrderIndex { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
