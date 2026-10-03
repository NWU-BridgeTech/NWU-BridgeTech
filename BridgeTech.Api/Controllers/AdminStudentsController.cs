using BridgeTech.Api.Common.Filters;
using BridgeTech.Api.DTOs.Admin;
using BridgeTech.Api.Services.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Route("api/admin/students")]
[Authorize(Roles = AdminRoleCatalog.StudentViewerRoles)]
[AdminManagementExceptionFilter]
// Read-only student monitoring for the admin Students page.
public class AdminStudentsController(IAdminStudentService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<StudentListResponse>> List(
        [FromQuery] StudentListQuery query,
        CancellationToken cancellationToken) =>
        Ok(await service.ListAsync(query, cancellationToken));

    [HttpGet("{studentId:guid}")]
    public async Task<ActionResult<StudentDetailResponse>> Get(
        Guid studentId,
        CancellationToken cancellationToken) =>
        Ok(await service.GetAsync(studentId, cancellationToken));
}
