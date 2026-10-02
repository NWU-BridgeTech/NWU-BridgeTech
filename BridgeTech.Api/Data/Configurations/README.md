# Data/Configurations

WHAT THIS IS: This is where we tell EF Core (our database library) exactly how each Entity maps to a real database table - column types, which fields are required, relationships between tables, etc.

WHY IT'S SEPARATE FROM ENTITIES: Instead of cluttering our Entity classes with database-specific annotations, we use a pattern called "Fluent API" - one config class per entity, implementing IEntityTypeConfiguration<T>. This keeps Domain/Entities readable as plain data models, and keeps all the database wiring together in one place.

Example: UserConfiguration.cs would define that User.Email must be unique, User.Role is stored as its enum value, etc.

Every entity needs a matching configuration file here, and it needs to be registered in AppDbContext's OnModelCreating method (usually done automatically via ApplyConfigurationsFromAssembly, ask if you're not sure how).
