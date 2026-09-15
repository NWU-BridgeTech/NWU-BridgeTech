using BridgeTech.Api.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql.EntityFrameworkCore.PostgreSQL;

var builder = WebApplication.CreateBuilder(args);

// Register the EF Core context with dependency injection. The connection string
// is loaded from User Secrets in Development and is never stored in source code.
// Npgsql is the PostgreSQL provider used by the application.

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
        .UseSnakeCaseNamingConvention());

// Discover controller classes and expose their attribute-based HTTP routes.
builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    // OpenAPI is enabled during local development to make the API easy to inspect.
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

// Map [Route] and [Http...] attributes from every controller to endpoint routes.
app.MapControllers();

app.Run();
