#!/usr/bin/env bash
# Post-start setup for ClawBot Docker container.
# Run after `docker compose up -d` to install runtime deps.
# Idempotent — safe to run multiple times.
set -euo pipefail

CONTAINER="${1:-openclaw-openclaw-gateway-1}"

echo "==> Saving previous session logs..."
mkdir -p ~/clawcraft_logs
docker logs "$CONTAINER" > ~/clawcraft_logs/openclaw_$(date +%Y%m%d_%H%M%S).log 2>&1 || true
echo "  Saved to ~/clawcraft_logs/"

echo "==> Installing system packages (gh, ffmpeg, python3-pip)..."
docker exec -u root "$CONTAINER" bash -c '
  if command -v gh >/dev/null 2>&1 && command -v ffmpeg >/dev/null 2>&1; then
    echo "  System packages already installed, skipping."
  else
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
      | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg 2>/dev/null
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
      > /etc/apt/sources.list.d/github-cli.list
    apt-get update -qq
    apt-get install -y -qq gh ffmpeg python3-pip asciinema
    echo "  Done."
  fi
'

echo "==> Installing Python packages (matplotlib, pillow, yt-dlp, nano-pdf)..."
docker exec -u root "$CONTAINER" bash -c '
  if python3 -c "import matplotlib" 2>/dev/null; then
    echo "  Python packages already installed, skipping."
  else
    python3 -m pip install --break-system-packages \
      matplotlib pillow yt-dlp nano-pdf plotly 2>&1 | tail -1
    echo "  Done."
  fi
'

echo "==> Fixing plugin ownership..."
docker exec -u root "$CONTAINER" bash -c '
  if [ -d /home/node/.openclaw/extensions/blender ]; then
    chown -R node:node /home/node/.openclaw/extensions/blender/
    echo "  Blender plugin ownership fixed."
  else
    echo "  No blender plugin found, skipping."
  fi
'

echo "==> Deploying render-html.mjs (HTML canvas screenshot script)..."
docker exec "$CONTAINER" bash -c '
  if [ -f /app/render-html.mjs ]; then
    echo "  render-html.mjs already present, skipping."
  else
    cat > /app/render-html.mjs << '"'"'RENDEREOF'"'"'
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const RENDER_DIR = path.join(process.env.HOME || "/home/node", ".openclaw", "media", "renders");
const BROWSER_PATH = (() => {
  const base = "/home/node/.cache/ms-playwright";
  try {
    const dirs = fs.readdirSync(base).filter(d => d.startsWith("chromium-"));
    if (dirs.length > 0) return path.join(base, dirs[0], "chrome-linux/chrome");
  } catch {}
  return "chromium";
})();

const input = process.argv[2] || "-";
const outputArg = process.argv[3];

let html;
if (input === "-") {
  html = fs.readFileSync("/dev/stdin", "utf8");
} else {
  html = fs.readFileSync(input, "utf8");
}

fs.mkdirSync(RENDER_DIR, { recursive: true });
const outputPath = outputArg || path.join(RENDER_DIR, `canvas-${crypto.randomUUID()}.png`);

const browser = await chromium.launch({
  executablePath: BROWSER_PATH,
  args: ["--no-sandbox", "--disable-gpu"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.setContent(html, { waitUntil: "networkidle" });
await page.screenshot({ path: outputPath, fullPage: false });
await browser.close();

console.log("MEDIA:" + outputPath);
RENDEREOF
    echo "  Deployed."
  fi
'

echo "==> Installing Slidev..."
docker exec -u root "$CONTAINER" bash -c '
  if command -v slidev >/dev/null 2>&1 || [ -f /usr/local/lib/node_modules/@slidev/cli/bin/slidev.mjs ]; then
    echo "  Slidev already installed, skipping."
  else
    npm install -g @slidev/cli @slidev/theme-default slidev-theme-light-icons slidev-addon-python-runner plotly.js-dist-min 2>&1 | tail -1
    chmod -R 777 /usr/local/lib/node_modules/@slidev/ /usr/local/lib/node_modules/slidev-theme-light-icons/ /usr/local/lib/node_modules/slidev-addon-python-runner/ 2>/dev/null
    echo "  Done."
  fi
'

echo "==> Installing @notionhq/client..."
docker exec -u root "$CONTAINER" bash -c '
  if node -e "require(\"@notionhq/client\")" 2>/dev/null; then
    echo "  @notionhq/client already installed, skipping."
  else
    npm install -g @notionhq/client 2>&1 | tail -1
    echo "  Done."
  fi
'

echo "==> Clearing jiti cache for plugin..."
docker exec "$CONTAINER" bash -c '
  rm -f /tmp/jiti/blender-index.*.cjs /tmp/jiti/src-blender-*.cjs /tmp/jiti/src-canvas-*.cjs /tmp/jiti/src-slidev-*.cjs 2>/dev/null
  echo "  Cache cleared."
'

echo "==> Ensuring TOOLS.md has rendering instructions..."
docker exec "$CONTAINER" bash -c '
  if grep -q "HTML Canvas" /home/node/.openclaw/workspace/TOOLS.md 2>/dev/null; then
    echo "  TOOLS.md already has rendering instructions, skipping."
  else
    cat >> /home/node/.openclaw/workspace/TOOLS.md << '"'"'TOOLSEOF'"'"'

### Blender 3D

- Use the `blender` tool with action `render` to render scenes and send images to Discord.
- Use action `execute` to set up scenes (add objects, materials, lights), then `render` to capture.
- Do NOT render via `execute` — always use the `render` action so images upload to Discord properly.

### Graphs & Charts

- Python3 with matplotlib and pillow are installed.
- To create charts/graphs, use the `exec` tool to run a Python script.
- Save all images to `~/.openclaw/media/renders/` so they can be uploaded to Discord.
- After saving, include `MEDIA:/home/node/.openclaw/media/renders/<filename>.png` in your response.

### HTML Canvas (Headless)

- Chromium is installed. You can render any HTML to a PNG screenshot.
- Use the `canvas` tool — pass full HTML as the `html` parameter.
- For simple data charts (line/bar/scatter), matplotlib is lighter and faster.
- Use HTML canvas for rich visuals: dashboards, infographics, styled tables, diagrams.

### Canvas (Node-based)

- The original canvas tool requires a connected node/browser. Not available in Docker.
- Use the HTML Canvas tool (above) or matplotlib instead.
TOOLSEOF
    echo "  TOOLS.md updated."
  fi
'

echo "==> Ensuring ClawCraft log files exist..."
docker exec "$CONTAINER" bash -c '
  WS=/home/node/.openclaw/workspace
  [ -f "$WS/render_log.json" ] || echo "[]" > "$WS/render_log.json"
  [ -f "$WS/hand_built_log.json" ] || echo "[]" > "$WS/hand_built_log.json"
  [ -f "$WS/workflow_notes.md" ] || printf "# Workflow Notes\n\nPersonal observations about the AI-assisted 3D art process.\n\n---\n\n" > "$WS/workflow_notes.md"
  echo "  Log files ready."
'

echo "==> Verifying..."
docker exec "$CONTAINER" bash -c '
  echo "  gh:         $(gh --version 2>&1 | head -1)"
  echo "  ffmpeg:     $(ffmpeg -version 2>&1 | head -1)"
  echo "  yt-dlp:     $(yt-dlp --version 2>&1)"
  echo "  nano-pdf:   $(nano-pdf --help 2>&1 | head -1)"
  echo "  matplotlib: $(python3 -c "import matplotlib; print(matplotlib.__version__)" 2>&1)"
  echo "  pypdf:      $(python3 -c "import pypdf; print(pypdf.__version__)" 2>&1)"
  echo "  canvas:     $([ -f /app/render-html.mjs ] && echo "render-html.mjs ready" || echo "missing")"
  echo "  slidev:     $(npx slidev --version 2>/dev/null || echo "not installed")"
  echo "  blender:    $(node -e "const n=require(\"net\");const s=new n.Socket();s.setTimeout(3000);s.connect(9876,\"host.docker.internal\",()=>{console.log(\"connected\");s.destroy()});s.on(\"error\",e=>console.log(\"not running\"))" 2>&1)"
  echo "  plugin:     $([ -f /home/node/.openclaw/extensions/blender/src/slidev-tool.ts ] && echo "blender+canvas+slidev" || echo "incomplete")"
  echo "  render_log: $([ -f /home/node/.openclaw/workspace/render_log.json ] && echo "ready" || echo "missing")"
'

echo ""
echo "==> All done. Bot is ready."
