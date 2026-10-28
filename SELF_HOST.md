# Self-Hosting EduTech (Mode B)

Run the full EduTech stack on your own VPS with `docker compose up`. This is the
self-hosted deployment mode — the institution's own Postgres, Redis, API, and
frontend, validated by the signed-license system.

## Requirements

- A Linux VPS with Docker + the Docker Compose plugin
- Ports 80 (and 443 if you terminate TLS yourself)

## Quick start

```bash
# 1. Configure
cp .env.selfhost.example .env
$EDITOR .env                      # set DB_PASSWORD, JWT_SECRET, super-admin creds

# 2. (Optional) enable licensing — see "Licensing" below
#    set LICENSE_SECRET in .env and issue a key for your institution

# 3. Launch
docker compose -f docker-compose.selfhost.yml up -d --build
```

The app is served on `http://<your-server-ip>/`. Log in with the super-admin
credentials from `.env`, then create your institution and users.

### Behind HTTPS (recommended)

The bundled nginx serves plain HTTP. For production, put a TLS terminator in
front — e.g. Caddy with automatic Let's Encrypt:

```
yourdomain.com {
    reverse_proxy localhost:80
}
```

Then set `COOKIE_SECURE=true` in `.env` and re-run.

## Licensing

The license system is **optional**. If `LICENSE_SECRET` is empty, licensing is
inert and the app runs unrestricted.

To enforce licenses:

1. **Pick a secret** — one shared secret used to sign keys (server) and verify
   them (frontend build). Generate a random string and keep it private.
   ```
   openssl rand -hex 32
   ```
   Set it as `LICENSE_SECRET` in `.env`.

2. **Issue a license key** for an institution slug:
   ```
   cd apps/api
   LICENSE_SECRET=<your-secret> npx tsx scripts/sign-license.ts \
     --slug=demo-school --plan=pro --days=365 --features=classes,exams
   ```
   Copy the printed `v1.…` key.

3. **Activate** it in the app: Settings → Institution → License → paste the key
   → Activate License.

### Enforcement

- **Valid** — normal operation.
- **Grace** — expired but within a 7-day grace period; the app still works and
  shows a countdown warning.
- **Expired** — past grace, the app flips to **read-only**. All saves are
  blocked (localStorage + the Local Data Vault files) until a valid key is
  activated. Data is never deleted — only writes are refused.

The frontend re-validates the key's signature + expiry locally on every start,
and (when `VITE_LICENSE_HEARTBEAT_URL` is set, which the compose file does) also
checks in with the API heartbeat hourly. A self-hosted instance whose API is
down is not locked out — enforcement falls back to the local signature check.

## Upgrading

```bash
git pull
docker compose -f docker-compose.selfhost.yml up -d --build
```

## Backups

Postgres data lives in the `pgdata` volume. Back it up with:
```bash
docker compose -f docker-compose.selfhost.yml exec postgres \
  pg_dump -U edutech edutech > backup.sql
```
You can also enable the in-app Telegram auto-backup (Settings → Backup &
Storage) for daily snapshots.
