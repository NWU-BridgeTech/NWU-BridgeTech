using BridgeTech.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BridgeTech.Api.Data;

// AppDbContext is the EF Core gateway between the API and PostgreSQL. Each DbSet
// represents a database table and allows controllers/services to query it with LINQ.
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // These DbSets expose the tables used by the learning platform.
    public DbSet<User> Users => Set<User>();
    public DbSet<PendingRegistration> PendingRegistrations => Set<PendingRegistration>();
    public DbSet<Module> Modules => Set<Module>();
    public DbSet<Lesson> Lessons => Set<Lesson>();
    public DbSet<VideoSummary> VideoSummaries => Set<VideoSummary>();
    public DbSet<Quiz> Quizzes => Set<Quiz>();
    public DbSet<QuizQuestion> QuizQuestions => Set<QuizQuestion>();
    public DbSet<QuizOption> QuizOptions => Set<QuizOption>();
    public DbSet<QuizAttempt> QuizAttempts => Set<QuizAttempt>();
    public DbSet<QuizAnswer> QuizAnswers => Set<QuizAnswer>();
    public DbSet<Exercise> Exercises => Set<Exercise>();
    public DbSet<ExerciseSubmission> ExerciseSubmissions => Set<ExerciseSubmission>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();
    public DbSet<Certificate> Certificates => Set<Certificate>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // The supplied SQL schema uses PostgreSQL's public schema.
        modelBuilder.HasDefaultSchema("public");

        // Apply every IEntityTypeConfiguration<T> in this assembly. This keeps
        // table names, constraints, indexes, and relationships out of the entities.
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}