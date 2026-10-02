# Services/Exercises

WHAT THIS IS: Business logic for hands-on coding exercises, including verifying a student actually completed one via GitHub (e.g. checking they made a specific commit or PR).

IExerciseService / ExerciseService handles the exercise data itself (creating exercises, tracking submissions). GitHubVerificationService is a separate class specifically for calling the GitHub API to check completion - kept separate because it deals with an external API and might need its own error handling/retry logic.
