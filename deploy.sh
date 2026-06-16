#!/usr/bin/env bash
# Production deploy for the EC2 box. Pulls latest code, rebuilds the app images,
# applies any new DB migrations, and restarts nginx so it re-resolves the
# recreated web container (avoids the stale-upstream 502).
#
# Usage (from the repo root on the server):
#   ./deploy.sh
#
# Notes:
#   - .env is NOT in git; edit it on the server directly when env vars change.
#   - prisma migrate deploy only applies migrations already committed to the
#     repo, and is a no-op when the DB is already up to date. It needs
#     DATABASE_URL on the Supabase *session* pooler (port 5432) to take the
#     advisory lock without hanging.
set -euo pipefail

COMPOSE="docker compose -f docker-compose.prod.yml"
# Use sudo for docker unless we're already root.
if [ "$(id -u)" -ne 0 ]; then
  SUDO="sudo"
else
  SUDO=""
fi

cd "$(dirname "$0")"

echo "==> Pulling latest code"
git pull --ff-only

echo "==> Building and starting app containers"
$SUDO $COMPOSE up -d --build

echo "==> Applying database migrations (no-op if up to date)"
$SUDO $COMPOSE exec -T web npx prisma migrate deploy

echo "==> Restarting nginx (re-resolve web upstream)"
$SUDO $COMPOSE restart nginx

echo "==> Pruning dangling images to reclaim disk"
$SUDO docker image prune -f >/dev/null

echo "==> Deployed. Current status:"
$SUDO $COMPOSE ps
