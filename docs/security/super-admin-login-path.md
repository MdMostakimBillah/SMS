# Super Admin Login Path — Security Model & Rotation Procedure

Status: living documentation. Last reviewed: Phase 15 security hardening.

## 1. What the custom login path is (and is not)

- `VITE_LOGIN_PATH` is a **frontend build-time configuration value** (root
  `.env` for development, `.env.production` for the Vercel build). It is
  consumed through a single constant, `LOGIN_PATH` in
  `src/lib/constants.ts`, which also derives `LOGIN_ROUTE` — the one route
  every login redirect resolves to.
- **Its value is visible to browser users.** `VITE_*` variables are baked
  into the JavaScript bundle by design (confirmed by bundle scan). The
  configured path must never be considered a secret, and never behaves as
  one.
- **The custom login URL is an obscurity layer and a UI entry point only.**
  It decides which URL shows the login form. It is not, and must never be
  described as, an authentication or authorization control.
- **The API authenticates independently.** The login endpoint is always
  `POST /api/auth/login`, regardless of the frontend route. The server has
  zero coupling to the path (verified: no reference to `LOGIN_PATH` or
  `VITE_LOGIN_PATH` exists anywhere under `apps/api/src/`). Do not
  introduce server-side authorization logic based on the frontend route
  prefix.
- All genuine boundaries remain server-side: Argon2id password
  verification, database-backed sessions in HttpOnly cookies, per-request
  role/`isActive` checks (`requireAuth`/`requireRole`), CSRF double-submit
  protection, login rate limiting (10/min per IP), and the login Origin
  policy (`apps/api/src/middleware/origin.ts`).
- **Changing this path replaces nothing.** It does not substitute for
  authentication, MFA, RBAC, session validation, or rate limiting.

## 2. Configuration rules

- **Never put private server secrets in `VITE_*` variables** — they are
  browser-visible by definition. Server secrets (JWT secret, database
  credentials, TOTP encryption keys) live only in `apps/api/.env` and are
  read server-side.
- There is **no public or unauthenticated endpoint** that changes the
  login path, and none may ever be added. Path changes go through the
  controlled build configuration below.
- There is **no bootstrap endpoint** for privileged accounts. The first
  Super Admin exists only through the server-side seed command
  (`apps/api/prisma/seed.ts`), which reads `SUPER_ADMIN_EMAIL` /
  `SUPER_ADMIN_PASSWORD` from the server environment, enforces a minimum
  password length, hashes with Argon2id, and never logs plaintext.
- The frontend derives the route from one constant (`LOGIN_ROUTE`), and
  `App.tsx`, `ProtectedRoute.getLoginRedirect`, and `getLogoutRedirect`
  all resolve to it. A stale or mismatched configuration can therefore
  never lock anyone out of the API: the worst case is that the login form
  404s into the SPA fallback page (`try_files … /index.html` in
  `nginx.conf`) while every API endpoint keeps enforcing correctly.
  Reaching the API directly (e.g. `curl` to `/api/auth/login`) always
  works regardless of the configured path.

## 3. Manual path-rotation procedure

Rotation is a controlled configuration change — it is never performed by
any endpoint or at runtime.

1. **Validate the candidate route.** An absolute path prefix starting
   with `/`, at least 6 characters after the slash, using only letters
   (upper or lower case), digits, hyphens and underscores — e.g. matching
   `^/[A-Za-z0-9_-]{6,}$` — with no trailing slash and no duplicate
   separators (`//`). Mixed-case prefixes are fine: React Router matches
   paths case-insensitively by default, and every redirect derives from the
   same `LOGIN_ROUTE` constant, so registration and redirects always stay
   consistent. Check for collisions with existing routes: `/api`,
   `/health`, `/i`, `/super-admin`, `/register`, `/dashboard`, and any
   other top-level route in `src/App.tsx`.
2. **Update the configuration through approved channels only.** Write the
   new value into the local `.env` (development) and the Vercel project's
   environment configuration for the production build. Never paste values
   into logs, chat, tickets, or commit messages.
3. **Deploy only under separate deployment authorization.** A path change
   is a frontend rebuild (`npm run build` → local nginx serves the new
   `dist/`; production → Vercel deploy). No API change, restart, or
   migration is involved.
4. **Verify:**
   - The new path loads the login form; an old path falls into the 404
     SPA page.
   - Login at the new path creates a session and lands on the dashboard.
   - `/api/auth/me` responds correctly with the session cookie.
   - Logout revokes the session and redirects to the new login route.
   - Institution login routes (`/i/:slug`, `/i/:slug/login`) and the
     public `/register` entry are unaffected.
   - The Super Admin can still reach the login page (step 1's note: the
     new value is known to the administrator before the old build is
     replaced).
5. **Rollback** is the same procedure with the previous known-good value:
   restore it in `.env` / Vercel and rebuild/redeploy. The API never
   changed during rotation, so rollback carries no authentication risk.

## 4. Related tests

- `src/App.test.tsx` — the login form mounts on `LOGIN_ROUTE`, and only
  there.
- `src/components/ProtectedRoute.test.tsx` — every login redirect
  resolves to `LOGIN_ROUTE`.
- `src/lib/navUtils.test.ts` — logout redirects use server-role only;
  legacy localStorage identity cannot influence them.
- `apps/api/src/auth.test.ts` — server-side login/session/CSRF/rate-limit
  behavior, the login Origin policy, and Super Admin endpoint
  authorization, all independent of the frontend path.
