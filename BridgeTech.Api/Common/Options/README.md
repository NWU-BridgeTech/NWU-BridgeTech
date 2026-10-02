# Common/Options

WHAT THIS IS: Strongly-typed C# classes that match sections of our appsettings.json config file - e.g. JwtOptions, ClaudeApiOptions, GitHubApiOptions.

WHY: Instead of reading config values as loose strings scattered everywhere (config["Jwt:Secret"]), we bind them once into a typed class and inject that - so the compiler catches typos and mistakes, and it's clear exactly what settings exist.

Inject these using IOptions<T> in a Service's constructor, rather than reading IConfiguration directly.
