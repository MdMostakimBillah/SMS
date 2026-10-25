# EduTech Production-Readiness Report — 2026-10-14

**Overall verdict: 🔴 NO-GO for production.**
Planning and read-only verification only: no deploy, no commit, no push, no
production connection, no migration, no visibility change. Production work
requires separate explicit authorization after this report is reviewed.

Evidence base: live read-only inspection this day (git, gh API, staging stack
`edutech-api:staging-957f8a0` at `127.0.0.1:3002`, staging DB aggregates), the
2026-10-14 staging E2E verification (`docs/verification/staging-e2e-2026-10-14.md`),
the backup dry-run plan (`docs/backup/dry-run-plan.md`), and prior G-gate audit records.

---

## 1. Go/No-Go checklist

| Area | Status | Evidence |
|---|---|---|
| Approved release commit | 🔴 **NO-GO** | No release commit exists: HEAD `ac82e60` (owner 404 work); all production-bound phases (audit wiring, notices migration, R2 media, docs) are uncommitted — 13 modified + 14 untracked files |
| Passing tests | 🟢 PASS | Backend **103/103** on isolated `edutech_test` (ephemeral, 2026-10-14); frontend **271/272** (sole failure = pre-existing owner-side in-flight 404 test); `tsc` FE + API clean |
| Tenant isolation | 🟢 PASS | 14 isolation tests (uniform-404, `?schoolId` spoof, SA audited) + live staging matrix T3–T6: zero leaks, byte-identical 404s, cross-tenant writes blocked, targets intact |
| Server-side RBAC | 🟢 PASS | 15 RBAC tests + live T7: teacher/student/school_admin all 403 on `/api/auth/accounts`; media write-role matrix unit-verified |
| Session/CSRF protections | 🟢 PASS | session(9)+hardened(9)+login-origin(8) tests green; double-submit CSRF middleware mounted on all `/api` (app.ts:43); live logins + CSRF-protected writes succeeded only for authorized roles |
| Secret management (current tree) | 🟢 PASS | Only `.env.example` templates tracked; **every example value hash-verified as a placeholder** (differs from all live env values); `.gitignore` covers `.env`, `.env.production`, `staging.env`, `backups/`; server secrets env-only, R2 design keeps keys server-side (zero AWS refs in client tree) |
| Secrets in Git — history | 🟡 **FINDING H-1** | `.env.production` was committed in `02b605d` and removed in `bd12cc9`; it contained `VITE_LOGIN_PATH` (value not reproduced) which remains recoverable from **public** history. Rewrite is forbidden → owner acceptance or path rotation required |
| PostgreSQL migration plan | 🔴 **NO-GO** | Only 2 migrations exist (`0_init`, `add_sessions`); ~8 tables plus every new model (Notice, MediaObject) were applied via `db push` — `prisma migrate deploy` alone cannot reproduce the schema. A baseline migration + reviewed restore-recovery procedure is required |
| R2 private access | 🔴 **BLOCKED** | Buckets never created; no `R2_*` credentials exist anywhere. Design (private objects, tenant-scoped keys, presigned ≤5 min, uniform-404 matrix) unit-verified; live verification impossible. "No unauthorized public storage" holds trivially — no cloud storage exists; nginx serves only static FE + `/api` proxy + `/health` (no aliases) |
| Encrypted backup verification | 🟡 **PARTIAL** | Rehearsal PASS: AES-256 GPG, `SHA256SUMS`+manifest, **downloaded-copy checksum verify OK**. But no operational pipeline exists (no automation, no scheduler, no alerting); staging app DB user cannot `pg_dump` (finding B-1) — container-superuser path validated |
| Successful isolated restore | 🟢 PASS (rehearsal) | Globals-first restore into disposable container: 0 errors, 3 roles recreated, **row counts identical to source**, ≈0 s at current scale. Ownership/who-runs-it when needed: **not documented** |
| Monitoring | 🔴 **NO-GO** | None configured: only 2 docker healthchecks (postgres, redis). No uptime/error tracking, no disk/backlog/WAL alerts, no backup-failure alerting (alert channel undecided in backup plan §8) |
| Rollback | 🟡 **PARTIAL** | Staging: image-pin lever exists (`edutech-api:staging-957f8a0`, G5 guard) → revert by repointing pin. Production: no production compose/runbook exists at all; DB rollback = rehearsed restore procedure only |
| Cost limits | 🔴 **NO-GO** | No approved budget. Proposal exists (backup plan §6: ~92 MB steady state, alert at 7 GB of R2 free tier; media projection well inside 10 GB) — **awaiting owner GO** |
| No production data in staging | 🟢 PASS | Staging is a separate compose stack with its own DB, credentials, JWT, and email domain; aggregates: 5 users / 1 email domain / 2 schools / 3 teachers / 0 students — synthetic scale, no production pattern (content inspection avoided per PII discipline) |
| No secrets tracked in Git (current) | 🟢 PASS | `git ls-files` secret-shape scan: only 2 `.env.example` templates; no keys/certs; `setup.sh` prints a generated bootstrap password once to the local operator by design |
| DB migrations have reviewed recovery plan | 🔴 **NO-GO** | Restore mechanics rehearsed (this report §1), but no written production recovery plan tied to the migration flow, and migration history is push-based (see migration row) |
| Backup retention + restore ownership documented | 🔴 **NO-GO** | Retention: proposal only, unapproved. Restore ownership: not assigned to any role/person |
| Repo visibility explicit owner decision | 🔴 **UNRESOLVED** | Confirmed **PUBLIC** (`gh`, `isPrivate=false`, branch `main`). No record of an explicit owner decision to keep it public |
| G10b-0 + required gates PASS evidence | 🔴 **NO-GO** | G1–G10a PASS per prior audit records; **G10b-0 has no PASS evidence** (external-disk backup unmet; local sha256-verified backup + rehearsed restore only; AR-1 cloud-substitution unanswered, as are AR-2/3/4 cutover items) |

## 2. Exact unresolved blockers (must clear before any GO)

1. **B-1 — No release commit.** Commit (or explicitly define) the release contents; until then there is no artifact to deploy.
2. **B-2 — Audit evidence gap on deployed stack.** The audit emitter is uncommitted; deployed staging produced 0 audit lines for privileged cross-tenant actions. Fixed by deploying the committed code (after B-1) and re-running verification item 4.
3. **B-3 — Migration baseline missing.** Author a baseline migration covering the full current schema (push-era drift) + written production restore-recovery plan; validate `migrate deploy` on an empty database equals `db push` output.
4. **B-4 — R2 storage unbuilt.** Create private `edutech-media`/`edutech-backups` + least-privilege tokens; provision `R2_*` + `BACKUP_GPG_PASSPHRASE`; then run live media/R2 authorization tests (verification T9).
5. **B-5 — No operational backup pipeline.** Implement per approved dry-run plan; resolve app-user dump privileges (container superuser or dedicated backup role); approve retention (§6 proposal); assign restore ownership.
6. **B-6 — G10b-0 / AR-1…AR-4 unanswered.** Owner decisions required; G10b-0 PASS evidence must be produced (external or approved-substitute backup + a real restore drill).
7. **B-7 — No monitoring/alerting.** Define at minimum: uptime probe, error tracking, DB disk/backlog, backup-failure alert channel.
8. **B-8 — No production deployment mechanism.** No production compose file, runbook, or cutover procedure exists; must be written and reviewed before any production touch.
9. **B-9 — Cost limits unapproved.** GO on storage budget + low-storage threshold (dry-run plan §6).
10. **B-10 — Repo visibility decision undocumented.** Explicit owner decision required (keep public vs make private) — this report changes nothing.
11. **B-11 — History finding H-1.** `VITE_LOGIN_PATH` value recoverable from public history (`02b605d`): accept as documented risk or rotate the path; history rewrite is out of policy.
12. **B-12 — Verification re-run after deploy.** The 2026-10-14 E2E gate stands BLOCKED (audit FAIL + 4 BLOCKED items); full re-run on the deployed release is required post-B-1/B-4.

## 3. What is already production-grade

Tenant isolation and RBAC (unit + live-proven), session/CSRF hardening, secret
hygiene in the current tree, uniform-error surfaces, the G5 staging image-pin
guard, backup encryption/checksum/download-verify/restore mechanics, media
retention-policy mechanics, and 103/103 backend + 271/272 frontend test health.

## 4. Safety record for this report

Read-only throughout: git/gh inspection, staging aggregates (counts only),
container log greps (audit lines), no writes to any database, no deploys, no
commits/pushes, no visibility change, no production contact. This file is the
only new artifact (uncommitted working tree, per gate rules).
