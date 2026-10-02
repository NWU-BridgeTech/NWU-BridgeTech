# Common/Exceptions

WHAT THIS IS: Custom error types we throw in our code when something goes wrong in a specific, known way - e.g. NotFoundException, ValidationException, UnauthorizedException.

WHY: Instead of every Service handling errors differently (some returning null, some returning error strings, some throwing generic exceptions), we throw one of these custom exceptions, and Common/Middleware catches them all in ONE place and converts them into a proper, consistent HTTP error response. This means controllers don't need try/catch blocks everywhere.
