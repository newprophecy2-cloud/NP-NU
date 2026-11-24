# Authentication & Security Architecture

- **Password Hashing:** `crypto.scrypt` with per-user random 16-byte salt and constant-time `crypto.timingSafeEqual` verification.
- **Sessions:** 32-byte random `base64url` token stored as an HMAC-SHA256 hash in `user_sessions`, delivered via `HttpOnly`, `SameSite=Lax` cookies (`Secure=true` in production).
- **CSRF Protection:** Cookie-authenticated mutating requests (`POST/PATCH/PUT/DELETE`) validate `Origin` against `APP_URL`.
- **Ownership & RBAC:** Every student draft/profile/notification query filters by `user_id = request.authUser.id` (preventing IDOR). All `/api/v1/admin/*` routes enforce `requireRole(['admin', 'reviewer'])`.
- **Credential Hygiene:** Fastify Pino logger redacts `authorization`, `cookie`, and `body.password`. NU applicant portal passwords and payment PINs are never collected.
