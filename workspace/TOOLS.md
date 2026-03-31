## IMPORTANT: Environment Rules

**Do NOT use the `openclaw` CLI from bash/shell.** It is not on PATH and has no permissions in this container. This is by design, not a bug. Do not try to fix it, diagnose it, or work around it.

**Use your registered tools for everything:**
- Discord messages: use the `message` tool (discord skill)
- 3D rendering: use the `blender` tool
- Concept art: use the `openai-image-gen` skill
- Charts/graphs: use matplotlib via Python exec, or the `html-canvas` tool
- Presentations: use the `slidev` tool
- PDF editing: use the `nano-pdf` skill

**Do NOT reference or run old workspace scripts.** The bash scripts from the prior demo project (clawbot_weather_updates.sh, schedule_clawbot_updates.py, api_analysis.py, etc.) have been archived to archive_demo_scripts/. They are obsolete and broken. Do not suggest running them.

**Tool names (correct):**
- `blender` (NOT "blender-mcp" or "mcp")
- `html-canvas` (NOT "canvas" — that name conflicts with an internal tool)
- `slidev` (NOT "slides" or "presentation")

---

# TOOLS.md — ClawCraft Environment Notes

## Blender Rendering
- Engine: BLENDER_EEVEE_NEXT (never Cycles for headless renders)
- Resolution: 1920x1080
- Output path: ~/.openclaw/media/renders/ (allowed media root for Discord uploads)
- Blender addon socket: host.docker.internal:9876
- Use the blender tool with action render for renders (not execute)
- Use execute to set up scenes, then render to capture

## Render Naming Convention
Format: {scene_id}_{iteration:03d}.png
Examples: fridge_portal_001.png, shelf_artifacts_002.png, bathtub_overflow_001.png

## Prompt Queue
See prompt_queue.md for pre-planned scenes. When user says "run next prompt", check which scene has not been attempted yet and start with that one.

## Logging
All renders auto-log to render_log.json (includes outcome_type and workflow_observation).
User commands: /log-note {id} "note text", /rate {id} {1-5}, /session-summary
Bot command: /render-report — generates Slidev deck with stats and posts to Discord.
Bot behavior: after every render, always ask user for evaluation feedback. Never just post and go silent.
Workflow notes: Personal observations go in workflow_notes.md — bot can append to it if asked.

## Scene IDs
- fridge_portal
- shelf_artifacts
- bathtub_overflow
- window_gameworld
- dining_dungeon
- hallway_renderdist

## Graphs and Charts
- Python3 with matplotlib and pillow are installed.
- Save all images to ~/.openclaw/media/renders/
- After saving, include MEDIA:/home/node/.openclaw/media/renders/<filename>.png in response

## HTML Canvas (Headless)
- Chromium is installed. Use the html-canvas tool — pass full HTML as the html parameter.
- CDN libraries available: Mermaid, KaTeX, Shiki, Iconify, D3.js, Chart.js
- For simple data charts, matplotlib is lighter and faster.

## Slidev Presentations
- Use the slidev tool ONLY when explicitly asked for a presentation or slide deck.
- Write Slidev Markdown: separate slides with ---, first slide has frontmatter.
- Supports Mermaid diagrams, KaTeX math, code blocks, emojis in slides.
- Each slide returned as separate PNG to Discord.

## Slidev Theme
- Preferred theme: light-icons (clean, icon-rich)
- Set in frontmatter: theme: light-icons
- Supports light/dark layouts, icon placeholders, centered/intro slides

## Rich HTML Libraries (use with html-canvas tool)
All load via CDN in HTML:
- Mermaid: diagrams, flowcharts, sequence diagrams, gantt, ERD, mindmaps
- KaTeX: math/LaTeX equations
- Shiki: syntax-highlighted code blocks
- Iconify: 10k+ icons (Material, FontAwesome, etc.)
- D3.js: advanced data visualizations
- Chart.js: bar, line, pie, radar charts

## Asciinema
- Record terminal sessions as .cast files: asciinema rec output.cast
- Replay: asciinema play output.cast
- Useful for recording demo workflows and pipeline walkthroughs

## Plotly (Python)
- Interactive-quality charts via Python: import plotly.graph_objects as go
- Export to PNG: fig.write_image("~/.openclaw/media/renders/chart.png")
- Richer than matplotlib for 3D plots, heatmaps, animations
- Also available as JS CDN in html-canvas tool HTML

## Slidev Addons
- slidev-addon-python-runner: run Python code blocks live in slides
- Plotly.js available for interactive-style chart rendering in slides
