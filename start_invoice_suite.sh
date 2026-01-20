#!/usr/bin/env bash
set -euo pipefail

ROOT="/workspaces/test"
SERVER_PORT="5000"
CLIENT_PORT="5173"

log() { printf "[%s] %s\n" "$(date '+%H:%M:%S')" "$*"; }

log "Starting invoice stack..."

# Backend
(
  cd "$ROOT/server"
  npm install >/dev/null 2>&1 || true
  npm run server >/tmp/invoice-server.log 2>&1 &
  echo $! > /tmp/invoice-server.pid
  log "Server starting on port ${SERVER_PORT} (pid $(cat /tmp/invoice-server.pid))"
)

# Frontend
(
  cd "$ROOT/client"
  npm install >/dev/null 2>&1 || true
  npm run dev -- --host --port "${CLIENT_PORT}" >/tmp/invoice-client.log 2>&1 &
  echo $! > /tmp/invoice-client.pid
  log "Client starting on port ${CLIENT_PORT} (pid $(cat /tmp/invoice-client.pid))"
)

sleep 2
log "Opening browser at http://localhost:${CLIENT_PORT}"
xdg-open "http://localhost:${CLIENT_PORT}" >/dev/null 2>&1 &

log "Done. Logs: /tmp/invoice-server.log, /tmp/invoice-client.log"
