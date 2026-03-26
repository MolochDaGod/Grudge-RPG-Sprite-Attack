#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
# Grudge PvP Server — VPS Deploy Worker
# ═══════════════════════════════════════════════════════════
# Usage:
#   ./script/deploy-pvp.sh deploy   — Pull, build, and deploy
#   ./script/deploy-pvp.sh restart  — Restart existing container
#   ./script/deploy-pvp.sh logs     — Tail live logs
#   ./script/deploy-pvp.sh status   — Show container status
#   ./script/deploy-pvp.sh health   — Check HTTPS health
#   ./script/deploy-pvp.sh stop     — Stop the server
#   ./script/deploy-pvp.sh shell    — SSH into VPS
#
# Requires: SSH access to grudge-vps (see ~/.ssh/config)
# ═══════════════════════════════════════════════════════════
set -euo pipefail

VPS="grudge-vps"
CONTAINER="grudge-pvp"
IMAGE="grudge-pvp:latest"
REPO_DIR="/opt/grudge-pvp/repo"
DOMAIN="pvp.grudge-studio.com"
PORT=5000

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[pvp-worker]${NC} $1"; }
ok()   { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
err()  { echo -e "${RED}✗${NC} $1"; }

cmd_deploy() {
  log "Pulling latest code..."
  ssh "$VPS" "cd $REPO_DIR && git pull"

  log "Building Docker image..."
  ssh "$VPS" "cd $REPO_DIR && docker build -t $IMAGE ."

  log "Stopping old container..."
  ssh "$VPS" "docker rm -f $CONTAINER 2>/dev/null || true"

  log "Starting new container..."
  ssh "$VPS" "docker run -d \
    --name $CONTAINER \
    --restart unless-stopped \
    --network coolify \
    -e NODE_ENV=production \
    -e PORT=$PORT \
    -l 'traefik.enable=true' \
    -l 'traefik.docker.network=coolify' \
    -l 'traefik.http.routers.$CONTAINER.rule=Host(\`$DOMAIN\`)' \
    -l 'traefik.http.routers.$CONTAINER.entrypoints=http,https' \
    -l 'traefik.http.routers.$CONTAINER.tls.certresolver=letsencrypt' \
    -l 'traefik.http.services.$CONTAINER.loadbalancer.server.port=$PORT' \
    $IMAGE"

  sleep 3
  cmd_health
  ok "Deploy complete"
}

cmd_restart() {
  log "Restarting $CONTAINER..."
  ssh "$VPS" "docker restart $CONTAINER"
  sleep 3
  cmd_health
}

cmd_logs() {
  log "Tailing logs (Ctrl+C to stop)..."
  ssh "$VPS" "docker logs -f --tail 50 $CONTAINER"
}

cmd_status() {
  log "Container status:"
  ssh "$VPS" "docker ps --filter name=$CONTAINER --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
}

cmd_health() {
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/roster" 2>/dev/null || echo "000")
  if [ "$code" = "200" ]; then
    ok "https://$DOMAIN — HTTP $code"
  elif [ "$code" = "000" ]; then
    err "https://$DOMAIN — unreachable (DNS or TLS issue)"
  else
    warn "https://$DOMAIN — HTTP $code"
  fi
}

cmd_stop() {
  log "Stopping $CONTAINER..."
  ssh "$VPS" "docker stop $CONTAINER"
  ok "Stopped"
}

cmd_shell() {
  ssh "$VPS"
}

case "${1:-help}" in
  deploy)  cmd_deploy ;;
  restart) cmd_restart ;;
  logs)    cmd_logs ;;
  status)  cmd_status ;;
  health)  cmd_health ;;
  stop)    cmd_stop ;;
  shell)   cmd_shell ;;
  *)
    echo "Grudge PvP Server — VPS Deploy Worker"
    echo ""
    echo "Usage: $0 {deploy|restart|logs|status|health|stop|shell}"
    echo ""
    echo "  deploy   Pull, build, and deploy latest code"
    echo "  restart  Restart existing container"
    echo "  logs     Tail live container logs"
    echo "  status   Show container status"
    echo "  health   Check HTTPS health"
    echo "  stop     Stop the server"
    echo "  shell    SSH into VPS"
    ;;
esac
