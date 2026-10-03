# Controllers

WHAT THIS IS: The entry point for every API request. When the frontend calls an endpoint like GET /api/modules, this is the file that receives that HTTP request.

WHY IT EXISTS SEPARATELY: We keep controllers "thin" on purpose - they should NOT contain business logic (like checking rules, talking to the database, etc). Their only job is: receive the request, call a Service to do the actual work, and return the result. This makes the code easier to test and means multiple people aren't fighting over the same file for different reasons.

One controller per resource: AuthController, UsersController, ModulesController, QuizzesController, ExercisesController, CertificatesController, AiSummariesController, AdminStudentsController, AdministratorsController (see docs/admin-students-administrators.md).

RULES:
- No business logic here. If you're writing an if-statement that checks a business rule, it belongs in a Service, not here.
- Inject the Service INTERFACE (e.g. IModuleService), not the concrete class - this is called "dependency injection" and it's what lets us swap implementations or write tests later.
- Return DTOs (see DTOs folder), never return a Domain entity directly.
- Use proper HTTP status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Server Error.
