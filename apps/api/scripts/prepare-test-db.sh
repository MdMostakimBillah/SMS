#!/usr/bin/env bash
# Creates (if needed) and syncs the isolated test database.
# Never touches the development database.
set -euo pipefail
cd "$(dirname "$0")/.."

set -a
source .env
set +a

TEST_URL="${TEST_DATABASE_URL:-postgresql://edutech:${DB_PASSWORD:-changeme}@localhost:5432/edutech_test}"
DB_NAME="edutech_test"

echo "[test-db] Ensuring database ${DB_NAME} exists..."
docker exec edutech-postgres-1 psql -U edutech -d postgres -tc \
  "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 ||
  docker exec edutech-postgres-1 psql -U edutech -d postgres -c "CREATE DATABASE ${DB_NAME}"

echo "[test-db] Pushing schema to ${DB_NAME}..."
DIRECT_URL="$TEST_URL" DATABASE_URL="$TEST_URL" npx prisma db push --skip-generate --accept-data-loss
echo "[test-db] Ready."
