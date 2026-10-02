# Common/Extensions

WHAT THIS IS: "Extension methods" let us add new methods onto existing types without editing them directly.

WHY: Program.cs is where the app starts up and registers all its services - if we register every single Service individually there, it becomes a huge messy file. Instead, we write an extension method like AddApplicationServices() here, and Program.cs just calls that one line. Keeps startup code organized and readable.
