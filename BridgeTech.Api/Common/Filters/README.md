# Common/Filters

WHAT THIS IS: Filters run around a controller action. AdminManagementExceptionFilterAttribute turns the AdminManagementException thrown by the admin services into a clean `{ code, message }` JSON response with the right HTTP status.

HOW TO USE IT: put `[AdminManagementExceptionFilter]` on a controller. Throw `AdminManagementException.Conflict(...)`, `.Forbidden(...)`, etc. from the service.
