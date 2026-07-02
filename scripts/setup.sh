#!/bin/bash
# EduTech Production Setup Script
set -e

echo "=== EduTech Production Setup ==="

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "Docker is required. Install: https://docs.docker.com/get-docker/"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || COMPOSE_CMD="docker compose" || { echo "Docker Compose is required."; exit 1; }
COMPOSE_CMD="${COMPOSE_CMD:-docker-compose}"

# Generate secrets if not set
if [ ! -f .env ]; then
    JWT_SECRET=$(openssl rand -hex 32)
    DB_PASSWORD=$(openssl rand -hex 16)
    FACE_KEY=$(openssl rand -base64 32)
    cat > .env << EOF
JWT_SECRET=${JWT_SECRET}
DB_PASSWORD=${DB_PASSWORD}
FACE_ENCRYPTION_KEY=${FACE_KEY}
CORS_ORIGIN=http://localhost:5173
EOF
    echo "[OK] Created .env with generated secrets"
fi

echo ""
echo "Starting services..."
${COMPOSE_CMD} up -d --build

echo ""
echo "Waiting for PostgreSQL..."
sleep 5

echo ""
echo "Running Prisma migrations..."
${COMPOSE_CMD} exec api npx prisma migrate dev --name init || true

echo ""
echo "=== Setup Complete ==="
echo "Frontend: http://localhost"
echo "API:      http://localhost:3001"
echo "Face:     http://localhost:8001"
echo ""
echo "Run: ${COMPOSE_CMD} logs -f"
