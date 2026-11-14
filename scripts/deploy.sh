#!/usr/bin/env bash
# Deploy to our own server (pm2 + Caddy on 127.0.0.1:3000).
#   scripts/deploy.sh            build a new release on the server and switch to it
#   scripts/deploy.sh rollback   switch back to the release before the current one
#
# .env.deploy (not in git):  SERVER=user@host  URL=https://your.domain
# On the server once: mkdir -p /srv/fourcast/shared && put the real .env in /srv/fourcast/shared/.env
# Caddy: your.domain { reverse_proxy 127.0.0.1:3000 }
#
# NOTE: written before the server existed. Run it once by hand and fix what the server needs.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -f .env.deploy ]; then . ./.env.deploy; fi
: "${SERVER:?Set SERVER=user@host in .env.deploy}"
: "${URL:?Set URL=https://your.domain in .env.deploy}"
APP_DIR="${APP_DIR:-/srv/fourcast}"
APP_NAME="${APP_NAME:-fourcast}"
PORT="${PORT:-3000}"
KEEP="${KEEP:-5}"

check() {
  local code=""
  for _ in $(seq 1 20); do
    code=$(curl -s -o /dev/null -w '%{http_code}' "$URL/api/health" || true)
    if [ "$code" = "200" ]; then echo "OK: $URL/api/health answers 200"; return 0; fi
    sleep 3
  done
  echo "FAIL: $URL/api/health answered ${code:-nothing}. Try: scripts/deploy.sh rollback"
  return 1
}

if [ "${1:-}" = "rollback" ]; then
  ssh "$SERVER" bash -s -- "$APP_DIR" "$APP_NAME" <<'REMOTE'
set -euo pipefail
APP_DIR=$1; APP_NAME=$2
cd "$APP_DIR"
exec 9>deploy.lock
flock -n 9 || { echo "Another deploy is running."; exit 1; }
cur=$(readlink current)
prev=$(ls -1d releases/* | sort | awk -v c="$cur" '$0 == c { print p; exit } { p = $0 }')
[ -n "$prev" ] || { echo "No earlier release to roll back to."; exit 1; }
ln -sfn "$prev" current.tmp && mv -Tf current.tmp current
pm2 reload "$APP_NAME" --update-env
echo "Rolled back to $prev"
REMOTE
  check
  exit
fi

[ -z "$(git status --porcelain)" ] || { echo "Commit or stash your changes first."; exit 1; }
REV=$(git rev-parse --short HEAD)
REL="releases/$(date +%Y%m%d-%H%M%S)-$REV"

echo "Uploading $REV..."
git archive --format=tar HEAD | ssh "$SERVER" "mkdir -p '$APP_DIR/incoming' && cat > '$APP_DIR/incoming/$REV.tar'"

ssh "$SERVER" bash -s -- "$APP_DIR" "$APP_NAME" "$REL" "$REV" "$PORT" "$KEEP" <<'REMOTE'
set -euo pipefail
APP_DIR=$1; APP_NAME=$2; REL=$3; REV=$4; PORT=$5; KEEP=$6
cd "$APP_DIR"
exec 9>deploy.lock
flock -n 9 || { echo "Another deploy is running."; exit 1; }

mkdir -p "$REL"
tar -x -C "$REL" -f "incoming/$REV.tar" && rm -f "incoming/$REV.tar"
cp shared/.env "$REL/.env"

if ! (cd "$REL" && npm ci && npm run build); then
  rm -rf "$REL"
  echo "Build failed. The current release is untouched."
  exit 1
fi

ln -sfn "$REL" current.tmp && mv -Tf current.tmp current
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  pm2 reload "$APP_NAME" --update-env
else
  pm2 start npm --name "$APP_NAME" --cwd "$APP_DIR/current" -- start -- -H 127.0.0.1 -p "$PORT"
fi
pm2 save
ls -1d releases/* | sort | head -n "-$KEEP" | xargs -r rm -rf
echo "Live: $REL"
REMOTE

check
