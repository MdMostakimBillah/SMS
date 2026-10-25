# PostgreSQL Backup Pipeline to Cloudflare R2 — Dry-Run Plan

Status: **DRY-RUN ONLY — no pipeline code written, no backups taken, no objects uploaded.**
Date: 2026-10-14 · Scope: automated logical backups of the **isolated staging** database.
Out of scope this phase: WAL archiving/PITR (evaluated separately in §7), production database,
any change to G10b-0 acceptance criteria.

---

## 1. Prerequisite verification (the five required checks)

| # | Required verification | Result | Evidence (observed, read-only) |
|---|---|---|---|
| 1 | Database target is isolated staging, not production | **PASS** | `staging.env` DB URLs resolve to a docker-internal host, database `edutech_staging`, container `edutech-staging-postgres-1` on the isolated staging compose network. No production database configuration exists anywhere in this repository; production is never contacted. |
| 2 | Backup destination bucket is private | **BLOCKED** | Bucket `edutech-backups` was *documented only* in the R2 media phase — it has not been created, and **no R2 credentials exist** (staging.env contains only DB/JWT/CORS/Vite keys). Privacy cannot be verified for a bucket that does not exist. Prerequisite: owner creates the bucket + a dedicated least-privilege token. |
| 3 | Encryption key management and recovery procedure documented | **PASS (this document)** | Key management: §4. Recovery procedure: §5. The passphrase itself is a pending secret (§8), never stored in Git or the bucket. |
| 4 | Retention and storage budget approved | **NOT APPROVED** | The instruction specifies the *shape* (daily/weekly/monthly) but no counts or budget. Concrete proposal in §6 awaits an explicit owner GO. |
| 5 | The original backup remains untouched | **PASS** | `~/edutech-backups/prod-20261012-184523/` verified present and intact: `edutech-prod.dump` (22,137 B), `edutech-prod-globals.sql` (669 B), `MANIFEST.txt`, `SHA256SUMS`. Only `ls`/`cat` (hash + filename display) were run against it. It is excluded from every cleanup rule below. |

**Additional gate:** the instruction conditions implementation on explicit approval of the
backup destination and of G10b-0. G10b-0's external-disk backup is still unmet and the
cloud-storage substitution question (**AR-1**) remains unanswered. This plan does **not**
change G10b-0's criteria; a cloud-substitution decision is an owner-level approval (§8, item 1).

**STOP decision:** checks 2 and 4 fail and the G10b-0/AR-1 confirmation is missing, so per
"stop on any missing prerequisite" only this plan + documentation are delivered now.

## 2. Verified environment facts (read-only)

- Source: staging PostgreSQL 16.14 in `edutech-staging-postgres-1`, database `edutech_staging`, **8.2 MB**.
- `pg_dump`/`psql` 16.14 available inside the container (server-version match → custom format `-Fc`).
- Host tooling: `gpg` ✓, `openssl` ✓, `gzip` ✓, `sha256sum` ✓, `age` ✗ (not needed if GPG chosen).
- `wal_level = replica`, but `archive_mode = off` → WAL archiving would require config + restart (§7).
- No CI workflows exist (`.github/workflows` absent) → automation must be host cron/systemd, a
  compose sidecar, or a new GitHub Actions workflow (owner decision, §8 item 6).
- Precedent: the existing G7.5 backup already uses custom-format dump + separate
  globals export + `SHA256SUMS` + `MANIFEST.txt` (and honestly records “RESTORE NOT YET TESTED”).

## 3. Pipeline design (steps 1–10 — designed, not implemented)

1. **Consistent backup:** `pg_dump -Fc` of `edutech_staging` (single-command snapshot) +
   `pg_dumpall --globals-only` for roles.
2. **Roles/privileges documentation:** global roles/privileges are exported **separately**
   (`*-globals.sql`), matching the existing precedent; per-database grants are re-created by the
   dump’s DDL. Both artifacts are part of every backup set.
3. **Encrypt before upload:** `gpg --symmetric --cipher-algo AES256`, passphrase from the runner
   environment only (§4). Ciphertext only ever leaves the host.
4. **Least-privilege upload:** S3 API to `edutech-backups` with a dedicated R2 token scoped
   **Object Read & Write on that bucket only** (separate from the media token).
5. **Checksums + manifest:** `SHA256SUMS` (sha256 of the ciphertext, so verification needs no
   key) + `MANIFEST.txt` with the field set of the existing precedent (created, git HEAD, pg
   version, database, table count, byte sizes) plus a *restore-tested* flag.
6. **Verify the uploaded copy:** download to a fresh `mktemp -d` (mode 700) and run
   `sha256sum -c`. **Success is claimed only when the downloaded copy matches** — upload
   completion alone is explicitly *not* success. Temp dir is removed after verification.
7. **Retention:** server-side R2 lifecycle rules per §6 proposal (approval required). Cleanup
   only ever targets the `edutech-backups/` prefix — never `edutech-media`, never
   `~/edutech-backups/`.
8. **Alerting:** notify on dump failure, encryption failure, upload failure, checksum mismatch,
   restore-test failure, and low storage (proposed threshold §6). Delivery channel is a pending
   prerequisite (§8 item 5); until it exists, failures at minimum write a dated status marker
   readable by the ops runbook.
9. **Restore verification:** restore into a **new** database (`edutech_restore_verify`) inside
   the staging container — created if absent; no existing database is ever dropped, reset, or
   recreated. Verify schema/table counts and per-table row counts against the manifest, then a
   connection-level smoke test. Dropping the verify database afterwards requires a separate gate.
10. **RTO/RPO documentation:** see §9. Manifest honesty rule: an artifact is marked
    `RESTORE TESTED` only after step 9 passes.

## 4. Encryption key management

- Algorithm: AES256 via `gpg --symmetric` (gpg verified available on the host).
- Passphrase: ≥ 24 random characters generated in the owner’s password vault; provisioned to
  the backup runner as env `BACKUP_GPG_PASSPHRASE`.
- **Never** in Git, never in any `.env` committed or sent to a client, never inside the bucket,
  never echoed to logs. This document contains the *name* only.
- Rotation: generate a new passphrase in the vault; re-encrypt retained artifacts with the new
  one before retiring the old; keep old passphrases in vault history until the artifacts that
  need them age out of retention.

## 5. Recovery procedure

1. Download artifact + `SHA256SUMS` from `edutech-backups` (token with Object Read).
2. `sha256sum -c SHA256SUMS` — stop on mismatch (treat as corruption; fetch again / fall back
   to older artifact or the local original).
3. Decrypt: `gpg --decrypt <artifact>.gpg > restore.dump` (prompts for the vault passphrase).
4. Inspect: `pg_restore -l restore.dump` (no database writes yet).
5. Restore into a scratch database: `createdb <target>` then `pg_restore -d <target>` — against
   **staging** by default; production restore is a separately gated event.
6. Apply globals: `psql -f *-globals.sql` for roles, then verify row counts against the manifest.
7. Fallback path (no R2 access): the untouched local original
   `~/edutech-backups/prod-20261012-184523/` with its own `SHA256SUMS` verification.

## 6. Retention & storage budget — PROPOSAL (approval required)

- Schedule: keep **7 daily, 4 weekly, 12 monthly** (23 artifacts max), implemented as R2
  lifecycle rules on the `edutech-backups/` prefix.
- Budget: staging dump ≈ 8.2 MB source → low-single-digit MB encrypted; steady state
  ≈ 23 × ~4 MB ≈ **~92 MB** — far below the R2 10 GB free tier (years of headroom at this size).
- Low-storage alert threshold proposal: **7 GB** (70 % of free tier).
- These numbers are proposals only; nothing is applied until explicitly approved.

## 7. WAL archiving / PITR — separate evaluation (no implementation)

- **What logical backups give:** point-in-time = dump schedule only. Daily → **RPO up to 24 h**.
- **PITR option:** WAL-G (S3-compatible; works with R2 custom endpoint) continuously archiving
  encrypted WAL segments → **RPO in minutes**.
- **Required changes:** `archive_mode=on` + `archive_command` (currently off; requires a config
  change **and a staging Postgres restart**), a WAL-G binary inside the database container
  (image change → compose edit → staging-image guard applies), credentials injected into the
  container, WAL retention lifecycle rules, archive-failure monitoring, and rehearsed restores.
- **Cost:** monetary cost is negligible at this scale (R2 charges storage + Class A writes, no
  egress; WAL volume for an 8 MB database is small — order of 10–100 MB/day). The real cost is
  **complexity: medium-high** — image/config management, restart planning, restore tooling that
  is only proven during incidents, and the discipline of periodic restore drills.
- **Recommendation:** ship the dump pipeline (steps 1–10) as phase 1; treat WAL-G/PITR as its
  own later phase with its own approval, including the staging restart window.

## 8. Prerequisites to unblock implementation (owner actions)

1. Explicit statement covering **G10b-0 / AR-1**: whether the R2 `edutech-backups` bucket is
   accepted as the backup destination for G10b-0 purposes (criteria themselves unchanged).
2. Create the private bucket `edutech-backups` + an R2 API token (Object Read & Write, that
   bucket only); provision env `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
   `R2_BACKUPS_BUCKET` (names only; server/runner side).
3. Provision `BACKUP_GPG_PASSPHRASE` from the password vault.
4. GO on the §6 retention schedule + budget/threshold.
5. Alert channel decision (host mail, webhook URL, or an ops-status file surfaced in the app).
6. Automation host decision: host cron/systemd timer, compose sidecar, or GitHub Actions
   (note: the repository is public — workflow file visible, secrets only in Actions secrets).
7. Confirmation of the restore-verify database name/limits (`edutech_restore_verify` proposed;
   no existing database is ever dropped or reset).

## 9. Recovery time & data-loss window (documented now)

- **RPO (logical, daily):** up to 24 hours of staging changes.
- **RTO:** download + decrypt + restore of an 8 MB database ≈ **under 15 minutes** end-to-end
  (must be re-measured by the first real restore drill in step 9).
- **Data-loss window** narrows to minutes only if/when the separate WAL/PITR phase (§7) is
  approved. This pipeline is **not** point-in-time recovery and must not be described as such.
