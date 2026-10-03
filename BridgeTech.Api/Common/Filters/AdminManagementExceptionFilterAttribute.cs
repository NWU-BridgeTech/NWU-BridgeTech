using BridgeTech.Api.Common.Exceptions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace BridgeTech.Api.Common.Filters;

// Maps AdminManagementException to the same { code, message } JSON shape AuthController uses.
// Apply it to the admin controllers only; other exceptions keep their default handling.
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class AdminManagementExceptionFilterAttribute : ExceptionFilterAttribute
{
    public override void OnException(ExceptionContext context)
    {
        if (context.Exception is not AdminManagementException exception) return;

        context.Result = new ObjectResult(new { code = exception.Code, message = exception.Message })
        {
            StatusCode = exception.StatusCode
        };
        context.ExceptionHandled = true;
    }
}
