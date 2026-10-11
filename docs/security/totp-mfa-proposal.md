# TOTP MFA for the Super Admin Account — Design & Implementation Proposal

Status: **proposal only**. Nothing in this document is implemented. The
Prisma schema is unchanged, no migration exists, and no MFA dependency has
been added. Database migration execution requires separate explicit
authorization.

## 0. Scope and constraints

- Applies to `super_admin` accounts only (the highest-privilege role).
  School-level roles keep password login for compatibility.
- RFC 6238 TOTP with 30-second steps, 6-digit codes, ±1 window.
- **No default MFA secret, no hardcoded bypass code, and no public
  recovery endpoint may ever exist.**

## 1. Library vs custom implementation — recommendation

**Recommendation: a custom, dependency-free implementation (~60 lines) built
on Node's built-in `crypto` (HMAC-SHA1), not a new dependency.**

Rationale:
- TOTP is a small, fully specified algorithm (RFC 4226/6238): HMAC over a
  base32 secret and a time counter, truncated to 6 digits. The primitives
  (`crypto.createHmac`, `crypto.timingSafeEqual`, `crypto.randomBytes`)
  are already available and audited.
- The popular alternative (`otplib`, ~30 deps) adds supply-chain surface to
  an application that has deliberately minimized dependencies for a
  security-critical build.
- The custom implementation will be covered by RFC test vectors (RFC 6238
  Appendix B) plus the project's own test suite, and kept in a single,
  thoroughly commented module (`apps/api/src/lib/totp.ts`).

If the team prefers ecosystem code, `otplib` is the acceptable reviewed
alternative — decide at authorization time.

## 2. Threat model (what MFA adds here)

- Stolen/leaked/ phished Super Admin password → second factor blocks
  account takeover.
- Credential stuffing / reuse across sites → blocked without the device.
- Offline DB dump → Argon2id protects the password; the TOTP secret is
  stored AES-256-GCM-encrypted with a dedicated server-side key, so a DB
  leak alone still yields no usable second factor.
- **Out of scope for TOTP:** real-time phishing proxies that relay both
  factors (mitigate later with WebAuthn/passkeys), and full server
  compromise (nothing survives that).

## 3. Schema changes (proposed — NOT authorized, NOT created)

On `User` (or a separate `UserMfa` 1:1 table — a separate table is
preferred so the change is purely additive):

| Column | Type | Notes |
|---|---|---|
| `mfa_totp_enabled` | boolean, default false | enrollment complete flag |
| `mfa_totp_secret_enc` | bytes, nullable | AES-256-GCM ciphertext (iv+tag+ciphertext) |
| `mfa_totp_pending_secret_enc` | bytes, nullable | set at enrollment start, cleared on confirm |
| `mfa_totp_last_used_step` | bigint, nullable | replay prevention |
| `mfa_enrolled_at` | timestamp, nullable | audit |

Backup codes live in a new table `UserMfaBackupCode` (`id`, `userId`,
`codeHash` Argon2id, `usedAt` nullable) — hashed like passwords, single-use.

**Migration plan** (to be executed only under separate authorization):
1. Additive migration only (`prisma migrate dev` → generated SQL reviewed);
   no destructive change, no backfill needed (all rows default to
   "MFA disabled").
2. Rollback: `prisma migrate resolve` + drop the additive
   tables/columns — safe because no behavior depends on them until an
   admin explicitly enrolls.
3. No existing login path changes: users without `mfa_totp_enabled` log
   in exactly as today.

## 4. Key management and encryption at rest

- New server-side env var `MFA_TOTPEncryptionKey` (32 bytes, base64) —
  server-only, never a `VITE_*` variable, never logged, never committed.
  Startup fails fast if MFA is enabled but the key is missing/short.
- Secret generation: `crypto.randomBytes(32)` server-side; the plaintext
  secret exists only in the enrollment response (shown once as an
  otpauth:// URI + QR via a small reviewed QR renderer) and never in logs.
- Encryption: AES-256-GCM, unique 12-byte IV per record, key version
  prefix (`v1:`) in the ciphertext blob to support rotation.
- **Key rotation:** a new `MFA_TOTP_ENCRYPTION_KEY_V2` can be introduced;
  a server-side re-encryption pass (admin-triggered CLI command, not an
  endpoint) rewrites `v1:` blobs. Users are never interrupted: TOTP
  secrets decrypt transparently by version prefix.

## 5. Enrollment, verification, disable, recovery flows

**Enrollment (authenticated super_admin only):**
1. `POST /api/auth/mfa/totp/setup` — requires a valid session,
   `requireRole('super_admin')`, and **`currentPassword` re-entry**.
   Generates the secret, stores it as *pending*, returns otpauth URI + QR.
   Rate-limited (10/min per session).
2. `POST /api/auth/mfa/totp/confirm` — user submits a code from their
   app; server verifies against the *pending* secret (±1 window); on
   success promotes it to active (`mfa_totp_enabled = true`), clears
   pending, stamps `mfa_enrolled_at`, and returns **10 one-time backup
   codes** (generated with `randomBytes`, shown once, stored Argon2id-
   hashed).

**Login with MFA:**
1. `POST /api/auth/login` (unchanged) verifies email/password +
   Origin + rate limit. If `mfa_totp_enabled`, **no session is issued
   yet**: a short-lived (5 min), single-use, HttpOnly *MFA challenge
   cookie* bound to the user id is set, and the response asks for the
   second factor (`{ mfaRequired: true }`).
2. `POST /api/auth/mfa/login` — verifies TOTP code (±1 window) or a
   backup code against the challenge. Only then is the real session
   issued (existing `issueSession`). Wrong codes return a generic 403.
   Per-challenge attempt cap (5) plus per-IP limiter.

**Replay prevention (atomic compare-and-set):** TOTP acceptance is a
single conditional database update, never read-then-write. For the step
actually presented, run
`updateMany({ where: { id, mfa_totp_last_used_step: { lt: presentedStep } }, data: { mfa_totp_last_used_step: presentedStep } })`
and accept the code **only when exactly one record was updated**
(`count === 1`). `count === 0` means the step was already consumed — a
replay, or a concurrent duplicate of the same code — and the request is
rejected. The stored step also rejects codes from an already-used
previous window (any step ≤ stored). The HMAC computation itself happens
outside the database; the conditional update is the single authoritative
acceptance decision. Plain read-then-write logic ("check the stored step,
then update it in a separate statement") is **insufficient**: two
concurrent requests carrying the same code can both observe the old value
and both proceed. Only the atomic conditional update closes this race.

**Disable / reset:**
- `DELETE /api/auth/mfa/totp` — authenticated super_admin +
  `currentPassword` + **a valid current TOTP code** (or a backup code).
  Never disable via email link or without possession proof.
- Lost-device reset is deliberately **not self-service**: it is a
  server-side seed/CLI action (`npm run mfa:reset -- --email …`) performed
  by the operator with control of the server environment, mirroring the
  existing bootstrap trust model. There is no public recovery endpoint.

**Backup codes:** presented to `POST /api/auth/mfa/login` like TOTP codes.
Consumption is atomic: `updateMany({ where: { id, codeHash, usedAt: null }, data: { usedAt: now } })`,
and the code is accepted **only when exactly one record was updated** —
concurrent or repeated presentation of the same code fails the
conditional update and is rejected. Codes are Argon2id-hashed and never
stored/transmitted in plaintext after first display.

## 6. Rate limiting and brute force

- Existing login limiter (10/min/IP) stays on `/login`.
- New limiter on `/mfa/login`: 5 attempts per challenge, 10/min per IP.
- Codes are compared with `timingSafeEqual` against the expected value.
- Failure responses are generic ("Invalid code") — no oracle for
  correct-format-but-wrong vs malformed.

## 7. Session behavior around MFA state changes

- Enrollment/confirmation/disable operate on the caller's existing
  session; none of them revoke it, but **disabling or resetting revokes
  every other session** of the account (same `updateMany` pattern the
  password change already uses).
- The MFA challenge is not a session: it grants nothing except the right
  to submit a second factor, expires in 5 minutes, is single-use, and is
  destroyed on completion or failure cap.

## 8. Avoiding lockout of the only Super Admin

- MFA is opt-in per account; nothing changes for accounts that never
  enroll, so no migration can lock anyone out.
- Backup codes are issued at enrollment and must be acknowledged in the
  UI ("I have stored these") before the flow completes.
- The operator retains the server-environment reset path (CLI), which is
  the same trust level as the original account bootstrap.
- **No bypass code exists** — a bypass would be the weakest link; the
  escape hatch is the operator's CLI reset instead.

## 9. Required tests (when implemented)

- RFC 6238 Appendix B test vectors pass for the TOTP module.
- Correct code → session issued; wrong code → generic 403, no session.
- Expired/out-of-window code rejected; same code replayed in the next
  window rejected (`mfa_totp_last_used_step`).
- **Concurrency/atomicity:** parallel requests with the same TOTP code —
  exactly one succeeds (the conditional `updateMany` count decides);
  parallel requests with the same backup code — exactly one succeeds;
  `count === 0` conditional-update outcomes are unit-tested as
  replay/duplicate; enrollment or confirm failures roll back cleanly.
- Backup code works once, then is rejected; multiple backup codes work
  independently.
- Login for a non-enrolled user is completely unchanged (regression).
- Setup/confirm/disable require a super_admin session + `currentPassword`;
  `school_admin` and anonymous → 401/403 (matrix like the Phase 15 tests).
- Challenge cannot be answered without a prior successful password step;
  challenge expiry and attempt cap enforced.
- Tenant isolation, CSRF, session, and Origin suites stay green unchanged.

## 10. Deployment sequence (when authorized)

1. Authorize + generate `MFA_TOTP_ENCRYPTION_KEY` (operator, server-side
   only; add to `apps/api/.env` — never printed).
2. Apply the additive migration; rebuild/redeploy API only (`--no-deps
   api`). Frontend is untouched until the enrollment UI ships.
3. Enroll the Super Admin, store backup codes in a password manager.
4. Ship the enrollment UI + login second-factor step (separate frontend
   deploy), then verify the §9 matrix live.
5. Rollback path: remove the MFA login branch behind a config flag
   (`MFA_REQUIRED=false` keeps passwords working) without touching data.

## 11. Operational risks

- Lost authenticator + lost backup codes = operator CLI reset required
  (accepted; matches bootstrap trust).
- Server clock drift breaks TOTP — the API host must run NTP (verify
  `timedatectl` during deployment).
- Encrypted secrets are unrecoverable if the encryption key is lost
  (accepted: users re-enroll via CLI reset).
- QR rendering introduces a client-side dependency; keep it small and
  reviewed, or render the otpauth URI as text + copy button only.
