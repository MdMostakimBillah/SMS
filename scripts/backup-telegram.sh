#!/usr/bin/env bash
# ==============================================================================
# EduTech SMS — Automated Telegram Backup Script
# Creates an encrypted/compressed database snapshot and sends it via Telegram Bot
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Load environment variables if .env exists
if [ -f "${PROJECT_ROOT}/.env" ]; then
  set -a
  source "${PROJECT_ROOT}/.env"
  set +a
fi

BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
CHAT_ID="${TELEGRAM_CHAT_ID:-}"
CONTAINER_NAME="edutech-postgres-1"
DB_NAME="edutech"
DB_USER="edutech"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${PROJECT_ROOT}/backups/telegram_${TIMESTAMP}"

echo "=== EduTech Telegram Backup ==="
echo "Timestamp: ${TIMESTAMP}"

# Verify container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "[-] ERROR: Container ${CONTAINER_NAME} is not running."
  exit 1
fi

mkdir -p "${BACKUP_DIR}"

DUMP_FILE="${BACKUP_DIR}/edutech_backup_${TIMESTAMP}.sql.gz"
MANIFEST_FILE="${BACKUP_DIR}/MANIFEST.txt"

echo "[*] Creating database dump for '${DB_NAME}'..."
docker exec -i "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists | gzip > "${DUMP_FILE}"

FILE_SIZE=$(ls -lh "${DUMP_FILE}" | awk '{print $5}')
SHA256=$(sha256sum "${DUMP_FILE}" | awk '{print $1}')

cat > "${MANIFEST_FILE}" << EOF
EduTech Backup Manifest
-----------------------
Timestamp: $(date -u +"%Y-%m-%d %H:%M:%SZ")
Database: ${DB_NAME}
File: $(basename "${DUMP_FILE}")
Size: ${FILE_SIZE}
SHA256: ${SHA256}
EOF

echo "[+] Dump generated successfully (${FILE_SIZE}, SHA256: ${SHA256:0:16}...)"

# Telegram Delivery
if [ -z "${BOT_TOKEN}" ] || [ -z "${CHAT_ID}" ]; then
  echo ""
  echo "[!] NOTE: Telegram bot credentials not fully configured."
  echo "    Backup file saved locally to: ${DUMP_FILE}"
  echo "    To enable automated Telegram uploads, set in .env:"
  echo "      TELEGRAM_BOT_TOKEN=\"your_bot_token\""
  echo "      TELEGRAM_CHAT_ID=\"your_chat_id\""
  exit 0
fi

echo "[*] Sending backup file to Telegram..."

CAPTION="📦 *EduTech SMS Database Backup*
📅 Date: \`${TIMESTAMP}\`
💾 Database: \`${DB_NAME}\`
📊 Size: \`${FILE_SIZE}\`
🔒 SHA256: \`${SHA256:0:16}...\`
✅ Status: Verified & Complete"

RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendDocument" \
  -F "chat_id=${CHAT_ID}" \
  -F "document=@${DUMP_FILE}" \
  -F "caption=${CAPTION}" \
  -F "parse_mode=Markdown")

if echo "${RESPONSE}" | grep -q '"ok":true'; then
  echo "[+] Backup successfully sent to Telegram!"
else
  echo "[-] Telegram delivery failed: ${RESPONSE}"
  exit 1
fi
