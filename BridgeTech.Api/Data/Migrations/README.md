# Data/Migrations

WHAT THIS IS: A "migration" is a record of a change to the database structure (e.g. "add Certificates table"). EF Core generates these files automatically - they are NOT meant to be hand-written or edited.

HOW IT WORKS: When you change an Entity or its Configuration, you run a command to generate a migration file describing that change. Then you run another command to actually apply it to the database.

To create one: dotnet ef migrations add <DescriptiveName>
To apply it to the database: dotnet ef database update

IMPORTANT - TEAM COORDINATION: If two people generate migrations at the same time based on different versions of the code, you'll get conflicting migration files that are painful to merge. Before generating a migration: pull the latest code, rebuild, THEN generate. Let the team know in Discord when you've added one.
