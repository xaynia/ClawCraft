# ClawCraft

An AI-assisted 3D art pipeline that turns natural language into rendered Blender scenes through an iterative feedback loop.

Describe a scene in Discord. An AI agent interprets your prompt, writes Blender Python code, builds the scene, renders it, and posts the image back. You evaluate, give feedback, and the loop repeats — each iteration refining the result. Every render is automatically logged with the prompt, commands executed, timing, outcome classification, and a process observation.

The project investigates what an AI-mediated creative workflow enables and limits compared to traditional 3D modeling. The art is the output. The workflow insight is the contribution.

## The Art

The aesthetic explores childhood game worlds leaking into mundane domestic spaces:

- A fridge that opens onto a blocky voxel landscape extending to the horizon
- Kitchen shelves holding low-poly game artifacts next to coffee mugs
- A hallway where objects degrade from photorealistic to N64-era low-poly with distance
- A bathtub overflowing with flat-shaded water that turns realistic as it hits the tile floor

The contrast between rendering styles is the point. Realistic PBR lighting falls on impossible geometry. Both successes and productive failures are part of the work.

## Architecture

```
Discord (@ClawBot)
    |
    v
OpenClaw Gateway (Docker, self-hosted agent framework)
    |
    v
LLM (generates Blender Python via bpy API)
    |
    v
Custom Plugin (TypeScript) --- TCP socket ---> Blender MCP Addon (port 9876)
    |
    v
Blender 5.1 (headless EEVEE render, 1920x1080)
    |
    v
PNG saved to shared volume
    |
    v
MEDIA: directive posts image to Discord
    |
    v
"What's working? What's not?" ---> feedback ---> next iteration
```

No MCP intermediary needed. The custom plugin talks directly to the Blender addon socket. Every render auto-logs to a local JSON file and a Notion database with full metadata.

## How It Works

The plugin registers three tools:

**blender** — The core tool. Query scenes, execute arbitrary Blender Python, render with auto-logging. Each render captures: scene ID, iteration number, prompt, refinement notes, every command executed, render time, outcome type (success/partial/failure/happy_accident), and a workflow observation about the process itself.

**html-canvas** — HTML-to-image via headless Chromium. Pass any HTML, get a PNG. Supports Mermaid diagrams, KaTeX math, D3.js, Chart.js, Shiki code highlighting, Iconify icons — all loaded via CDN at zero install weight.

**slidev** — Markdown-to-presentation. Writes a Slidev deck, builds it, screenshots each slide, posts to Discord. Used to generate presentations directly from render log data.

## Data Collection

The render logging system produces quantitative data without manual bookkeeping:

- `render_log.json` — structured entry per render with full metadata
- Notion Renders database — mirrors the log with scene relations, searchable
- `workflow_notes.md` — free-form process observations
- File naming: `{scene_id}_{iteration:003}.png`

## Repository Contents

```
plugin/           Custom OpenClaw Blender plugin (TypeScript)
workspace/        Bot configuration — personality, tool reference, scene queue, milestones, render log, lessons learned
renders/          Blender render outputs from iterative feedback loops
docs/             Project documentation and reference PDFs
```

## Setup

This repo contains the plugin source code, workspace configurations, and render outputs. To run the full pipeline you also need:

- Docker with OpenClaw gateway configured
- A `.env` file with required API keys (see `.env.example` for the structure)
- Blender 5.1 with the [BlenderMCP](https://github.com/ahujasid/blender-mcp) addon running on port 9876

Refer to the docs/ folder for detailed infrastructure and setup documentation.

## ML Tasks

- **Text-to-3D via code generation** — LLM translates natural language scene descriptions into Blender Python
- **Text-to-image** — DALL-E concept art for scene planning before committing to 3D
- **Iterative conditional generation** — the prompt refinement feedback loop itself

## Security Considerations

- The OpenClaw gateway runs inside Docker for process isolation.
- The Blender MCP addon runs on the host machine (not containerized) and opens an unauthenticated TCP socket on port 9876 that accepts arbitrary Python execution. Bind it to localhost only and do not leave it running when not in use.
- All API keys are externalized via `.env` and never committed to this repository.
- Review [OpenClaw's security documentation](https://docs.openclaw.ai/gateway/security) and relevant advisories before deploying.

## Built With

- [OpenClaw](https://openclaw.ai) — Self-hosted AI agent gateway
- [Blender](https://www.blender.org/) 5.1 — 3D rendering (EEVEE)
- [BlenderMCP](https://github.com/ahujasid/blender-mcp) — Blender addon for socket-based control
