# DTOs

WHAT THIS STANDS FOR: Data Transfer Object. These are the classes that define exactly what shape of data the API accepts in a request and sends back in a response.

WHY THIS IS SEPARATE FROM ENTITIES: Our database Entities (see Domain/Entities) might have fields we never want to expose to the frontend (like a password hash), or fields that need combining/reshaping before sending. DTOs are the "public shape" of our data - Entities are the "internal shape." Controllers should only ever accept and return DTOs, never Entities directly.

Organized by feature: Auth, Modules, Quizzes, Exercises, Certificates.

RULES:
- Name clearly by purpose, e.g. CreateModuleRequest, ModuleResponse, QuizSubmissionRequest.
- Add validation attributes here ([Required], [MaxLength(100)], etc) - this is where we check that incoming data is valid before it reaches our business logic.
