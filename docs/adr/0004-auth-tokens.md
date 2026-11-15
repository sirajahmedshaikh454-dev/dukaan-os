# ADR-0004: Phone + password login, short access token, rotating refresh cookie

**Context.** Shopkeepers know their phone number; many have no email. The web app is a
single-page app, so any token JavaScript can read can be stolen by a bad script (XSS).

**Decision.**

- Login is a Pakistani mobile number + password. Numbers are stored as `+923XXXXXXXXX`.
- Passwords are hashed with Node's built-in `scrypt` and a random salt per user.
- The **access token** is a JWT (HS256, 15 minutes) holding the user id and `tenantId`.
  The web app keeps it in memory only.
- The **refresh token** is a random string in an `httpOnly`, `SameSite=Strict` cookie scoped
  to `/api/auth`. Only its SHA-256 hash is stored. Each refresh deletes the old token and
  issues a new one (rotation), so a token works exactly once.
- Signup and login are rate-limited (30 tries per 15 minutes per IP).

**Why.** Page scripts cannot read the refresh cookie, and other sites cannot send it. A leaked
database holds no usable tokens or passwords. `scrypt` needs no extra library.

**Known limits.** No SMS check that the phone belongs to the user (OTP can be added later).
The rate limit lives in memory, so it resets when the API restarts and is per-process.
