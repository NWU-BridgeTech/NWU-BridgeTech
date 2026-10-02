# Domain/Entities

WHAT THIS IS: These are our C# classes that represent the actual data - a User, a Module, a Quiz, etc. Each one roughly maps to a table in the PostgreSQL database.

WHY IT'S SEPARATE FROM DTOs: Entities represent our INTERNAL database shape. DTOs (see DTOs folder) represent what we send/receive over the API. These are kept separate on purpose - if we let the database structure leak directly to the frontend, changing the database later becomes painful and risky. This separation is called the "Entity vs DTO pattern" and it's standard practice.

Current entities: User, Module, Quiz, QuizQuestion, Exercise, ExerciseSubmission, Certificate, VideoSummary.

RULES:
- Plain C# classes only - just properties (and "navigation properties" linking to other entities, e.g. a Module has a List<Quiz>).
- No EF Core attributes here like [Key] or [Required] - that configuration goes in Data/Configurations instead, using a separate approach called "Fluent API." This keeps entities clean and readable.
- No methods with logic on these classes. If you're tempted to write a method like CalculateGrade() on the Quiz entity, put that logic in a Service instead.
- New entity? Also add a matching config file in Data/Configurations, and register it in AppDbContext.
