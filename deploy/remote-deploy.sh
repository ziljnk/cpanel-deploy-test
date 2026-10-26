#!/usr/bin/env bash
# Runs ON the cPanel server, piped in over SSH by .github/workflows/deploy.yml:
#   ssh user@host bash -s -- <commit sha> <break: true|false> < deploy/remote-deploy.sh
# Builds the commit in a fresh release folder, switches `current` to it,
# restarts only this app, health-checks it, and rolls back if the check fails.
# It never deletes old releases (cleanup is a separate, approved step).
set -Eeuo pipefail

SHA="${1:?usage: remote-deploy.sh <commit sha> [true|false]}"
BREAK="${2:-false}"
APP_ROOT="$HOME/deploy-test"
NODE_BIN="$HOME/nodevenv/deploy-test/22/bin"
REPO_URL="https://github.com/ziljnk/cpanel-deploy-test.git"
HOST="deploy-test.linhouse.com.vn"
SHORT="${SHA:0:7}"

export PATH="$NODE_BIN:$PATH"
log() { echo "[$(date '+%H:%M:%S')] $*"; }

cd "$APP_ROOT"
mkdir -p releases shared/uploads tmp

# One deploy at a time (also blocks a manual run while the workflow is running).
LOCK="$APP_ROOT/.deploy.lock"
if ! mkdir "$LOCK" 2>/dev/null; then
  log "Another deploy is running (lock $LOCK exists). Stopping."
  exit 1
fi
trap 'rmdir "$LOCK" 2>/dev/null || true' EXIT

PREV="$(readlink -f "$APP_ROOT/current" 2>/dev/null || true)"
[ -d "$PREV" ] || PREV=""
REL="$APP_ROOT/releases/$(date +%Y%m%d-%H%M%S)-$SHORT"

log "Node $(node -v), npm $(npm -v), glibc $(ldd --version | head -1 | awk '{print $NF}')"
log "Previous release: ${PREV:-none}"
log "New release: $REL"

git init -q "$REL"
git -C "$REL" fetch -q --depth 1 "$REPO_URL" "$SHA"
git -C "$REL" checkout -q FETCH_HEAD

if [ -n "$PREV" ] && [ -d "$PREV/.next/cache" ]; then
  mkdir -p "$REL/.next" && cp -a "$PREV/.next/cache" "$REL/.next/" && log "Reused build cache from previous release"
fi

cd "$REL"
log "npm ci"
npm ci --no-audit --no-fund
log "npm run build"
NEXT_PUBLIC_COMMIT="$SHA" GIT_COMMIT="$SHA" APP_MODE=test npm run build

printf 'GIT_COMMIT=%s\nNEXT_PUBLIC_COMMIT=%s\n' "$SHA" "$SHA" > "$REL/.env.production.local"
if [ "$BREAK" = "true" ]; then
  echo "MOCK_BREAK=health" >> "$REL/.env.production.local"
  log "This release is deliberately broken (MOCK_BREAK=health) to test rollback"
fi

cp "$REL/deploy/app.js" "$APP_ROOT/app.js"

switch_to() {
  ln -sfn "$1" "$APP_ROOT/current.new"
  mv -Tf "$APP_ROOT/current.new" "$APP_ROOT/current"
  log "current -> $1"
}

restart() {
  touch "$APP_ROOT/tmp/restart.txt"
  local pattern="^lsnode:${APP_ROOT}/?( |\$)"
  local pids
  pids="$(pgrep -u "$(id -un)" -f "$pattern" || true)"
  local n
  n="$(printf '%s' "$pids" | grep -c . || true)"
  if [ "$n" = "1" ]; then
    kill "$pids" && log "Stopped old process $pids; the next request starts the new release"
  elif [ "$n" = "0" ]; then
    log "No running process for this app"
  else
    log "WARNING: $n processes matched '$pattern', not killing any: $pids"
  fi
}

# Health check from the server itself, straight to LiteSpeed (skips Cloudflare).
# Passes only if /api/health answers 200 with this release's commit.
check_health() {
  local want="$1" body code
  for i in $(seq 1 12); do
    for scheme in https http; do
      local port=443; [ "$scheme" = http ] && port=80
      body="$(curl -sk --max-time 30 --resolve "$HOST:$port:127.0.0.1" -w '\n%{http_code}' "$scheme://$HOST/api/health?t=$(date +%s)" || true)"
      code="$(printf '%s' "$body" | tail -n1)"
      if [ "$code" = "200" ] && printf '%s' "$body" | grep -q "$want"; then
        log "Health OK ($scheme): $(printf '%s' "$body" | head -n1)"
        return 0
      fi
    done
    log "Health attempt $i: HTTP $code $(printf '%s' "$body" | head -n1 | cut -c1-200)"
    sleep 10
  done
  return 1
}

switch_to "$REL"
restart
if check_health "$SHORT"; then
  log "Deploy of $SHORT succeeded"
  exit 0
fi

log "Health check failed for $SHORT"
if [ -z "$PREV" ]; then
  log "No previous release to roll back to"
  exit 1
fi
log "Rolling back to $PREV"
switch_to "$PREV"
restart
PREV_SHA="$(git -C "$PREV" rev-parse --short=7 HEAD)"
if check_health "$PREV_SHA"; then
  log "Rollback to $PREV_SHA succeeded; the failed release stays in $REL for inspection"
else
  log "Rollback health check ALSO failed. Check $APP_ROOT/stderr.log"
fi
exit 1
