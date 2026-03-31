#!/usr/bin/env bash
# ClawBot Environment Verification & Auto-Fix
# Run AFTER docker-post-start.sh completes.
# Checks every tool, skill, and dependency ClawBot needs.
# Updates TOOLS.md to reflect actual available capabilities.
# Exit code 0 = all good, 1 = issues remain.
set -euo pipefail

CONTAINER="${1:-openclaw-openclaw-gateway-1}"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
ISSUES=0

ok()   { echo -e "  ${GREEN}[OK]${NC} $1"; }
warn() { echo -e "  ${YELLOW}[WARN]${NC} $1"; ISSUES=$((ISSUES+1)); }
fail() { echo -e "  ${RED}[FAIL]${NC} $1"; ISSUES=$((ISSUES+1)); }

echo "============================================"
echo "  ClawBot Environment Verification"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"
echo ""

# ── 1. Container running? ──
echo "==> Container"
if docker ps --filter "name=$CONTAINER" --format '{{.Names}}' | grep -q "$CONTAINER"; then
  ok "Container $CONTAINER is running"
else
  fail "Container $CONTAINER is NOT running"
  echo "Run: cd ~/src/openclaw && docker compose up -d && bash docker-post-start.sh"
  exit 1
fi

# ── 2. Plugin loading ──
echo ""
echo "==> Plugin Loading"
PLUGIN_OUTPUT=$(docker exec "$CONTAINER" node /app/dist/index.js plugins list 2>&1)

# Check for tool name conflicts
if echo "$PLUGIN_OUTPUT" | grep -q "tool name conflict"; then
  CONFLICT=$(echo "$PLUGIN_OUTPUT" | grep "tool name conflict")
  fail "Tool name conflict detected: $CONFLICT"
  echo "       Fix: rename the conflicting tool in the plugin source"
else
  ok "No tool name conflicts"
fi

# Check plugin count
LOADED=$(echo "$PLUGIN_OUTPUT" | grep -o '[0-9]*/[0-9]* loaded' | cut -d'/' -f1)
if [ -n "$LOADED" ] && [ "$LOADED" -ge 5 ]; then
  ok "Plugins loaded: $LOADED"
else
  fail "Only $LOADED plugins loaded (expected 6+). Check if plugins.allow is set in openclaw.json"
fi

# Check blender plugin specifically
if echo "$PLUGIN_OUTPUT" | grep -q "blender.*loaded"; then
  ok "Blender plugin: loaded"
else
  fail "Blender plugin: NOT loaded"
fi

# ── 3. Blender socket ──
echo ""
echo "==> Blender Socket (host.docker.internal:9876)"
SOCKET_TEST=$(docker exec "$CONTAINER" node -e "
const n=require('net');const s=new n.Socket();
s.setTimeout(3000);
s.connect(9876,'host.docker.internal',()=>{console.log('CONNECTED');s.destroy()});
s.on('error',e=>console.log('REFUSED'));
s.on('timeout',()=>{console.log('TIMEOUT');s.destroy()});
" 2>&1)
if [ "$SOCKET_TEST" = "CONNECTED" ]; then
  ok "Blender addon server: reachable"
else
  warn "Blender addon server: $SOCKET_TEST"
  echo "       Start it: Blender sidebar N > BlenderMCP > Start Server"
fi

# ── 4. Runtime deps ──
echo ""
echo "==> Runtime Dependencies"
check_cmd() {
  local name="$1" cmd="$2"
  if docker exec "$CONTAINER" bash -c "$cmd" >/dev/null 2>&1; then
    ok "$name"
  else
    fail "$name — run docker-post-start.sh to install"
  fi
}

check_cmd "gh CLI" "command -v gh"
check_cmd "ffmpeg" "command -v ffmpeg"
check_cmd "asciinema" "command -v asciinema"
check_cmd "matplotlib" "python3 -c 'import matplotlib'"
check_cmd "pillow" "python3 -c 'import PIL'"
check_cmd "plotly" "python3 -c 'import plotly'"
check_cmd "yt-dlp" "command -v yt-dlp"
check_cmd "render-html.mjs" "[ -f /app/render-html.mjs ]"

# Chromium (needed for html-canvas and slidev)
CHROMIUM_PATH=$(docker exec "$CONTAINER" bash -c '
  base="/home/node/.cache/ms-playwright"
  if [ -d "$base" ]; then
    dirs=$(ls -d "$base"/chromium-* 2>/dev/null | head -1)
    if [ -n "$dirs" ] && [ -f "$dirs/chrome-linux/chrome" ]; then
      echo "FOUND"
    else
      echo "MISSING"
    fi
  else
    echo "MISSING"
  fi
' 2>&1)
if [ "$CHROMIUM_PATH" = "FOUND" ]; then
  ok "Chromium (Playwright)"
else
  fail "Chromium (Playwright) — html-canvas and slidev will not work"
fi

# Slidev
SLIDEV_CHECK=$(docker exec "$CONTAINER" bash -c 'npx slidev --version 2>/dev/null && echo "FOUND" || echo "MISSING"' 2>&1)
if echo "$SLIDEV_CHECK" | grep -q "FOUND"; then
  ok "Slidev"
else
  fail "Slidev — slidev tool will not work"
fi

# ── 5. Plugin file ownership ──
echo ""
echo "==> Plugin File Ownership"
OWNER=$(docker exec "$CONTAINER" stat -c '%U' /home/node/.openclaw/extensions/blender/src/blender-tool.ts 2>/dev/null || echo "unknown")
if [ "$OWNER" = "node" ]; then
  ok "Plugin files owned by node"
else
  fail "Plugin files owned by '$OWNER' (should be node)"
  echo "       Fix: docker exec -u root $CONTAINER chown -R node:node /home/node/.openclaw/extensions/blender/"
fi

# ── 6. Environment variables ──
echo ""
echo "==> Environment Variables"
check_env() {
  local name="$1"
  if docker exec "$CONTAINER" bash -c "[ -n \"\$$name\" ]" 2>/dev/null; then
    ok "$name"
  else
    fail "$name — missing from container env. Check ~/src/openclaw/.env"
  fi
}

check_env "NOTION_TOKEN"
check_env "NOTION_RENDERS_DB"
check_env "NOTION_SCENES_DB"
check_env "OPENAI_API_KEY"

# ── 7. Workspace files ──
echo ""
echo "==> Workspace Files"
check_file() {
  local name="$1" path="$2"
  if docker exec "$CONTAINER" [ -f "$path" ] 2>/dev/null; then
    ok "$name"
  else
    fail "$name missing at $path"
  fi
}

check_file "SOUL.md" "/home/node/.openclaw/workspace/SOUL.md"
check_file "TOOLS.md" "/home/node/.openclaw/workspace/TOOLS.md"
check_file "render_log.json" "/home/node/.openclaw/workspace/render_log.json"
check_file "prompt_queue.md" "/home/node/.openclaw/workspace/prompt_queue.md"
check_file "milestones.md" "/home/node/.openclaw/workspace/milestones.md"
check_file "workflow_notes.md" "/home/node/.openclaw/workspace/workflow_notes.md"

# ── 8. Tool name consistency ──
echo ""
echo "==> Tool Name Consistency (TOOLS.md vs actual)"
# Check TOOLS.md doesn't reference old "canvas" tool name
if docker exec "$CONTAINER" grep -q "the canvas tool" /home/node/.openclaw/workspace/TOOLS.md 2>/dev/null; then
  fail "TOOLS.md references old 'canvas' tool — should be 'html-canvas'"
else
  ok "TOOLS.md: no stale 'canvas' tool references"
fi

if docker exec "$CONTAINER" grep -q "^- canvas:" /home/node/.openclaw/workspace/SOUL.md 2>/dev/null; then
  fail "SOUL.md references old 'canvas' tool — should be 'html-canvas'"
else
  ok "SOUL.md: no stale 'canvas' tool references"
fi

# ── 9. Discord channel ──
echo ""
echo "==> Discord"
DISCORD_OK=$(docker exec "$CONTAINER" cat /home/node/.openclaw/openclaw.json 2>/dev/null | python3 -c "
import sys,json
d=json.load(sys.stdin)
ch=d.get('channels',{}).get('discord',{})
if ch.get('enabled') and ch.get('token'):
    print('OK')
else:
    print('MISSING')
" 2>/dev/null || echo "ERROR")
if [ "$DISCORD_OK" = "OK" ]; then
  ok "Discord channel: enabled with token"
else
  fail "Discord channel: not configured"
fi

# ── 10. Model config ──
echo ""
echo "==> Model Configuration"
MODEL_INFO=$(docker exec "$CONTAINER" cat /home/node/.openclaw/openclaw.json 2>/dev/null | python3 -c "
import sys,json
d=json.load(sys.stdin)
agents=d.get('agents',{}).get('defaults',{})
primary=agents.get('model',{}).get('primary','NONE')
models=list(agents.get('models',{}).keys())
fallbacks=agents.get('model',{}).get('fallbacks','none')
print(f'primary={primary}')
print(f'models={models}')
print(f'fallbacks={fallbacks}')
" 2>/dev/null)
echo "$MODEL_INFO" | while read -r line; do
  ok "$line"
done

# Check plugins.allow is NOT set
ALLOW_SET=$(docker exec "$CONTAINER" cat /home/node/.openclaw/openclaw.json 2>/dev/null | python3 -c "
import sys,json
d=json.load(sys.stdin)
allow=d.get('plugins',{}).get('allow')
print('SET' if allow else 'EMPTY')
" 2>/dev/null)
if [ "$ALLOW_SET" = "EMPTY" ]; then
  ok "plugins.allow: not set (correct — setting it blocks stock plugins)"
else
  fail "plugins.allow is SET — this blocks stock plugins! Remove it from openclaw.json"
fi

# ── 11. Session staleness ──
echo ""
echo "==> ClawBot Session"
SESSIONS_CONTENT=$(docker exec "$CONTAINER" cat /home/node/.openclaw/sessions.json 2>/dev/null || echo "ERROR")
if [ "$SESSIONS_CONTENT" = "{}" ] || [ "$SESSIONS_CONTENT" = "" ]; then
  ok "Sessions clean (ClawBot will reload workspace files on next message)"
else
  SESSION_COUNT=$(echo "$SESSIONS_CONTENT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d))" 2>/dev/null || echo "?")
  warn "ClawBot has $SESSION_COUNT cached session(s). If you changed SOUL.md or TOOLS.md, nuke them:"
  echo "       docker exec $CONTAINER sh -c 'echo \"{}\" > /home/node/.openclaw/sessions.json'"
fi

# ── Summary ──
echo ""
echo "============================================"
if [ $ISSUES -eq 0 ]; then
  echo -e "  ${GREEN}ALL CHECKS PASSED${NC} — ClawBot is ready"
else
  echo -e "  ${RED}$ISSUES ISSUE(S) FOUND${NC} — fix the above before using ClawBot"
fi
echo "============================================"

# Machine-readable summary for Claude Code
echo "VERIFY_RESULT: $([ $ISSUES -eq 0 ] && echo ALL_PASS || echo ISSUES=$ISSUES)"

exit $( [ $ISSUES -eq 0 ] && echo 0 || echo 1 )
