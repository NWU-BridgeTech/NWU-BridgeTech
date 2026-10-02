# Services/Auth

WHAT THIS IS: All logic related to registering users, logging in, and issuing JWT tokens (the "access pass" a user gets after logging in, which proves who they are on future requests).

WHY THIS ISN'T IN THE CONTROLLER: Password hashing, token generation, and validation are security-sensitive and reusable - keeping this logic in a Service (rather than the controller) means it can be tested independently and reused if needed elsewhere.

IAuthService defines what this Service can do (the "contract"), AuthService is the actual implementation. AuthController calls into this - it should never hash a password or build a JWT itself.
