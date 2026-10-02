# Common/Middleware

WHAT THIS IS: "Middleware" is code that runs on EVERY request as it passes through the API pipeline, before/after it reaches a controller.

WHAT'S HERE: ExceptionHandlingMiddleware - catches any exception thrown anywhere in the app (including the custom ones from Common/Exceptions) and turns it into a clean JSON error response instead of crashing or leaking a stack trace to the frontend.

Registered once in Program.cs via app.UseMiddleware<ExceptionHandlingMiddleware>().
