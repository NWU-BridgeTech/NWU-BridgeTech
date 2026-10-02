# Domain/Enums

WHAT THIS IS: C# enums - fixed lists of named values, used instead of typing raw strings everywhere.

WHY: If UserRole was just a string field, someone could type "admin", another person "Admin", another "ADMIN" - and now our code has to handle all three. An enum makes this impossible: the value can only be one of a fixed, known set, and the compiler checks it for you.

Current: UserRole (Student, Instructor, Admin), ExerciseStatus (NotStarted, InProgress, Submitted, Verified).

Add a new enum here any time a field should only ever be one of a small fixed set of options.
