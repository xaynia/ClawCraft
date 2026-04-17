# ClawCraft

An AI-assisted 3D art pipeline that turns natural language into rendered Blender scenes through an iterative feedback loop.

Describe a scene in Discord. An AI agent interprets your prompt, writes Blender Python code, builds the scene, renders it, and posts the image back. You evaluate, give feedback, and the loop repeats — each iteration refining the result. Every render is automatically logged with the prompt, commands executed, timing, outcome classification, and a process observation.

The project investigates what an AI-mediated creative workflow enables and limits compared to traditional 3D modeling. The art is the output. The workflow insight is the contribution.

Production ran from March 26 to April 16. Seven scenes delivered: `fridge_portal`, `shelf_artifacts`, `garden_growing_voxels`, `clouds_balcony`, `bedroom_cloud_sky`, `hallway_renderdist`, and `toy_shelf_scene`. 289 renders total across all scenes, logged with full metadata. See [JOURNAL.md](JOURNAL.md) for the iteration-by-iteration story and [CONCEPT-ART.md](CONCEPT-ART.md) for the DALL-E scene concept art that preceded each build.

## Demo Videos

- [All 289 Renders](https://youtu.be/S8gcj9-rnKI) -- every render the pipeline produced, in order
- [Garden Voxels Build](https://youtu.be/o8-dEm6hjeY) -- 6x sped-up recording with synced terminal panel showing live tool calls
- [4 New Scenes Build](https://youtu.be/NinDCYD1III) -- 22x sped-up recording of clouds_balcony, bedroom_cloud_sky, hallway_renderdist, and toy_shelf_scene with synced tool-call panel
- [ClawHub (Notion)](https://sulfuric-muskmelon-53a.notion.site/ClawHub-32f366192ab580269bc9d49f3827e498) -- project hub with daily logs, scene tracker, workflow findings, bugs database

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

See [Iteration Log](JOURNAL.md) for the visual record of how each scene evolved through the feedback loop.

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

## Findings

A few things that came out of running this pipeline for two weeks:

- **Explicit html-canvas mesh topology prompts beat spatial descriptions.** When the agent tried to build pixel-art 3D sprites from reference images using natural-language spatial descriptions, it failed for 40+ iterations on a single sword. The fix was an intermediate constrained representation: plan the mesh as a 2D html-canvas grid, get human approval on the grid, then project the approved cells deterministically into Blender. The sword landed on the next try. ClawBot (the agent) named this pattern "representation engineering" himself, unprompted, after it worked. He then generalized it: *"any task where you can introduce an intermediate constrained spec: iconography, logos, decals, low-poly silhouettes, UI-to-3D panels, layout blocking, texture masks."* The methodology was articulated by the AI, not imposed on it.
- **AI cannot infer parent-child hierarchy from spatial description.** Telling the agent "the handle is on the door" does not produce the right parenting. It produces objects that look right until animated, then fall apart. The fix was a hard rule in `workspace/SOUL.md`: for fridge-type objects, body is root, door is child of body, handle is child of door, written out explicitly. Spatial language is not topology.
- **AI self-limits based on tool surface assumptions.** Early on, the agent treated its listed tool catalog as the full capability envelope and would say "I can't do that" for anything outside it. It was wrong. Given `bpy.execute`-style code access, the agent can reach much further than its tool list. It just does not know to try until prompted.
- **Agents extend their own toolset at runtime.** Once prompted to try, the agent discovered BlenderKit operators by introspecting `bpy.ops` and `bpy.context.preferences.addons` in the running Blender session. Not from docs, not from its tool list. Guardrails on code-running agents have to account for what the agent can discover, not just what you handed it.
- **AI can self-reflect on why a workflow succeeded and log lessons unprompted.** The agent fills a `workflow_observation` field in `render_log.json` for every render, and on one occasion wrote a new rule into `workspace/lessons-learned.md` without being asked. Self-observation of process, not just output.
- **Three-system collaboration.** The real loop was not "user prompts agent." It was agent + user + a separate debugging AI (Claude Code) working the infrastructure layer while the creative loop ran. When the container dropped the plugin or the Blender socket went quiet, the creative agent could not self-heal. The debugging AI fixed the pipeline so the creative AI could keep working. Two concrete examples: (1) The pipeline was broken for a full week in March because a plugin tool named `canvas` was silently name-colliding with an OpenClaw built-in, which stopped the gateway from loading any Blender tools. Neither the user nor ClawBot could have caught it from inside the Discord loop. Claude Code found it by reading the gateway plugin-loader source, renamed the tool to `html-canvas`, and every render in the following week worked. (2) The BlenderKit story is more serendipitous. ClawBot said he could not apply BlenderKit materials because BlenderKit was not in his official tool list. Then, while doing something else, he *accidentally ran a BlenderKit operator anyway* via `bpy.ops` introspection. The user spotted it in the Discord output and asked, "wait, you just did that, didn't you?" ClawBot realized he had been wrong about his own limits and started using BlenderKit deliberately. Once he did, downloads started failing intermittently. Claude Code traced the errors to a missing `avatar512` field in BlenderKit's upstream `UserProfile` Python class (BlenderKit's user profile schema expects several picture sizes, and one was absent in this version, which crashed the auth step before the material download could run). Claude Code patched the class in place and the operator became reliable. So: ClawBot accidentally proved his own self-imposed limit was wrong, the user caught the accident, and Claude Code fixed the upstream bug that stood in the way once ClawBot actually tried. No single system could have solved it alone.
- **Cross-session learning via file persistence and startup script.** The agent has no memory between Discord sessions, but the container runs a startup script on every boot that reinstalls dependencies, clears the jiti cache, fixes plugin file ownership, and deploys workspace files. The agent then reads `workspace/SOUL.md` and `workspace/lessons-learned.md` at the start of each chat. Mistakes get codified into rules by the human, and the rules survive context resets and container rebuilds.
- **Cost is an AI systems design problem.** One retry spiral (Mar 12) burned 11.1M tokens before it was caught. Switching the main model to Codex through a flat-rate sub removed the cost ceiling anxiety but did not fix the root cause (no circuit breaker in OpenClaw core). A separate scare a few weeks later came from a different AI (Claude Code) extrapolating its own per-image tokenization rate onto the Codex pipeline. The estimate was way off: Claude applied its own ~196k-tokens-per-image rate to ClawBot, which runs on Codex (a different tokenizer, and covered by the flat-rate sub anyway, so no surprise bill was coming). But the scare still produced four real findings. First, **images in an agent's context window get re-tokenized on every message.** They are part of the conversation history, so they get resent and re-read every turn. A 196k-token screenshot is not a one-time cost; it is a 196k-token tax on every subsequent message in that session, compounding into seven-figure token counts very quickly. That multiplication is what made the numbers look catastrophic. Second, multi-agent systems carry cross-tokenizer assumption risk: one AI cannot reliably estimate another AI's token economics by applying its own rates. Third, even a wrong cost number can drive a correct architectural fix: the conclusion ("render to file, never load images into agent context") was right even though the dollar figure that motivated it was wrong. Fourth, context bloat is a real problem regardless of billing, because screenshots push conversation history out of the agent's working memory and degrade performance even when they are free.
- **Showing failure then fix is more valuable than showing success alone.** The render log classifies every output as success, partial, failure, or happy accident. The partials and failures are the data. A clean gallery of finished renders hides the workflow that made them possible; the iteration history is where the method lives.

## Security Considerations

- The OpenClaw gateway runs inside Docker for process isolation.
- The Blender MCP addon runs on the host machine (not containerized) and opens an unauthenticated TCP socket on port 9876 that accepts arbitrary Python execution. Bind it to localhost only and do not leave it running when not in use.
- All API keys are externalized via `.env` and never committed to this repository.
- Review [OpenClaw's security documentation](https://docs.openclaw.ai/gateway/security) and relevant advisories before deploying.

## Built With

- [OpenClaw](https://openclaw.ai) — Self-hosted AI agent gateway
- [Blender](https://www.blender.org/) 5.1 — 3D rendering (EEVEE)
- [BlenderMCP](https://github.com/ahujasid/blender-mcp) — Blender addon for socket-based control
