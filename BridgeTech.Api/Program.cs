using System.Security.Claims;
using System.Text;
using BridgeTech.Api.Data;
using BridgeTech.Api.Services.Admin;
using BridgeTech.Api.Services.Auth;
using BridgeTech.Api.Services.Ai;
using BridgeTech.Api.Services.Certificates;
using BridgeTech.Api.Services.Exercises;
using BridgeTech.Api.Services.Modules;
using BridgeTech.Api.Services.Quizzes;
using BridgeTech.Api.Services.Notifications;
using BridgeTech.Api.Services.GitHub;
using BridgeTech.Api.Common.Options;
using BridgeTech.Api.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using BridgeTech.Api.Services.Enrollments;
using BridgeTech.Api.Services.Lessons;
using BridgeTech.Api.Services.Badges;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<GitHubApiOptions>(builder.Configuration.GetSection("GitHub"));
builder.Services.AddDataProtection();
builder.Services.AddHttpClient();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
        .UseSnakeCaseNamingConvention());

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAiService, AiService>();
builder.Services.AddScoped<ICertificateService, CertificateService>();
builder.Services.AddSingleton<ICertificateRenderer, CertificateRenderer>();
builder.Services.AddScoped<IExerciseService, ExerciseService>();
builder.Services.AddScoped<IModuleService, ModuleService>();
builder.Services.AddScoped<IQuizService, QuizService>();
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddHttpClient<IEmailService, BrevoEmailService>(client =>
{
    client.BaseAddress = new Uri("https://api.brevo.com/");
});
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IGitHubService, GitHubService>();
builder.Services.AddScoped<IEnrollmentService, EnrollmentService>();
builder.Services.AddScoped<ILessonService, LessonService>();
builder.Services.AddScoped<IAdminStudentService, AdminStudentService>();
builder.Services.AddScoped<IAdministratorService, AdministratorService>();
builder.Services.AddScoped<IBadgeService, BadgeService>();

builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("auth", limiterOptions =>
    {
        limiterOptions.PermitLimit = 10;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueLimit = 0;
        limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    });
    options.AddFixedWindowLimiter("verification", limiterOptions =>
    {
        limiterOptions.PermitLimit = 5;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueLimit = 0;
        limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    });
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.Headers.RetryAfter = "60";
        await context.HttpContext.Response.WriteAsJsonAsync(
            new { code = "RATE_LIMITED", message = "Too many requests. Try again later." },
            cancellationToken);
    };
});

string jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("JWT key is not configured.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)),

            ValidateIssuer = false,
            ValidateAudience = false,

            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        // Access tokens live for up to an hour, so re-check the account on every request.
        // Without this, deactivating or demoting someone would not take effect until their
        // token expires. One primary-key lookup per authenticated request.
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                if (!Guid.TryParse(context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
                {
                    return;
                }

                var db = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
                var account = await db.Users.AsNoTracking()
                    .Where(u => u.UserId == userId)
                    .Select(u => new { u.IsActive, u.Role })
                    .SingleOrDefaultAsync(context.HttpContext.RequestAborted);

                if (account is null || !account.IsActive)
                {
                    context.Fail("The account is deactivated or no longer exists.");
                    return;
                }

                // A token minted before a role change must not keep the old privileges.
                var roleClaim = context.Principal?.FindFirstValue(ClaimTypes.Role);
                if (roleClaim is not null && !string.Equals(roleClaim, account.Role.ToString(), StringComparison.Ordinal))
                {
                    context.Fail("The account role has changed. Sign in again.");
                }
            }
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("Frontend");
app.UseRateLimiter();
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    await next();
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();