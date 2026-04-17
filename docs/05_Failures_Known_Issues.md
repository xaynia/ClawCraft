# Failures and Known Issues

Running log of everything that broke during ClawCraft production, how it was fixed, and what state the fix is in as of the project's final delivery date (April 16, 2026).

The matching Mar-31 PDF in this folder (`05_Failures_Known_Issues.pdf`) is kept as a historical snapshot. This markdown file is the current truth.

---

## Summary

18 failure modes hit production during ClawCraft. Most were fixed at the root. A few were mitigated rather than fixed, and one core issue (no circuit breaker in OpenClaw) is still open upstream. See the per-item status in the table below.

The most important thing this document shows is not the list of failures but the pattern: most hard failures were infrastructure, not AI reasoning. The AI-reasoning failures that did happen were worked around by building scaffolding (SOUL.md rules, lessons-learned.md, the html-canvas representation layer), not by replacing the model.

---

## Infrastructure and Pipeline

### 1. Canvas tool name collision blocked all plugin tools
**What broke:** The custom Blender plugin registered a tool named `canvas`, which silently collided with an OpenClaw built-in of the same name. The gateway agent could not load any of the plugin's Blender tools at all. Every render attempt for about a week failed from this one cause, and neither the user nor the Discord agent could see the actual error from inside the Discord loop.

**Fix:** Renamed the tool to `html-canvas` in `src/canvas-tool.ts`. Updated `TOOLS.md` and `SOUL.md` references so ClawBot would call the new name.

**Status:** Fixed. Also see item 2.

### 2. html-canvas missing from TRUSTED_TOOL_RESULT_MEDIA
**What broke:** After renaming `canvas` to `html-canvas`, the new name was not in the `TRUSTED_TOOL_RESULT_MEDIA` list in the compiled OpenClaw Docker image. Tool output could not reach Discord as uploadable media.

**Fix:** Patched `src/agents/pi-embedded-subscribe.tools.ts` in OpenClaw core to add `"blender"`, `"html-canvas"`, and `"slidev"` to the trusted list. This is a custom security-relevant trust boundary change and should be treated as a security modification, not a feature.

**Status:** Fixed.

### 3. Notion environment variables written to the wrong `.env` file
**What broke:** `NOTION_TOKEN` and database IDs were written to `~/.openclaw/.env` instead of `~/src/openclaw/.env`. The container could not pick them up because Docker Compose reads the repo-side `.env`, not the user's home-directory one.

**Fix:** Moved variables to `~/src/openclaw/.env`. Verified with `docker exec` that the values were visible inside the container.

**Status:** Fixed.

### 4. Container dependencies get wiped on every rebuild
**What broke:** Every container recreate cleared `gh`, `ffmpeg`, `matplotlib`, `pillow`, `yt-dlp`, `Slidev`, and the Notion client. ClawBot would silently lose tool access until the user noticed.

**Fix:** Wrote `docker-post-start.sh` as an idempotent script that reinstalls all dependencies, clears the `jiti` cache at `/tmp/jiti/`, fixes plugin file ownership with `chown -R node:node`, deploys `render-html.mjs`, ensures log files exist, and verifies tools are reachable. Runs after every container start.

**Status:** Fixed.

### 5. Plugin file ownership drift (uid 501 vs 1000) and stale jiti cache
**What broke:** When the user edited plugin TypeScript files on the Mac host, they were owned by uid 501. Inside the container the process runs as `node` (uid 1000), which could not read some of the edited files. In parallel, the jiti transpiler cache at `/tmp/jiti/` would hold stale compiled code even after source edits, so the container ran old code silently.

**Fix:** Both issues handled in `docker-post-start.sh`: `chown -R node:node` for the plugin directory and `rm -rf /tmp/jiti/*` to force re-transpile.

**Status:** Fixed.

### 6. Container running as root (security)
**What broke:** Early container runs executed as root inside Docker, which is both a security issue and a permissions footgun with volume mounts.

**Fix:** Container now runs as `node` user. Verified after every rebuild with `docker exec openclaw-openclaw-gateway-1 whoami`.

**Status:** Fixed.

### 7. Gateway binding (loopback vs lan)
**What broke:** Early testing had the gateway bound to `lan`, which exposed it to the local network. Any device on Wi-Fi could in principle reach the gateway.

**Fix:** `GATEWAY_BIND=loopback` in `.env`. Verified after every rebuild with `grep GATEWAY_BIND ~/src/openclaw/.env`.

**Status:** Fixed.

### 8. host.docker.internal NAT friction for Blender socket
**What broke:** The Blender MCP addon runs on the host machine on port 9876, outside the container. The container had to reach it via `host.docker.internal`, which is not automatic on all Docker configurations.

**Fix:** Documented the required Docker setting and verified that ClawBot's plugin can open a TCP socket from inside the container to `host.docker.internal:9876` during `clawbot-verify.sh`.

**Status:** Fixed. Still requires Docker Desktop or an equivalent that supports the hostname.

### 9. Blender socket drops silently, no health check
**What broke:** The Blender MCP addon sometimes dropped its socket without raising. ClawBot would continue sending commands that were silently failing.

**Fix:** `clawbot-verify.sh` probes port 9876 and tests tool reachability at the start of every session. Not a real auto-reconnect but the detection is fast enough that the user can restart the addon before burning tokens on failed calls.

**Status:** Mitigated. Not a true fix because there is still no auto-reconnect.

### 10. `sessions.json` goes stale after workspace file changes or model switch
**What broke:** When workspace files (`SOUL.md`, `lessons-learned.md`) or the model config changed, ClawBot's cached sessions kept using the old state until they expired.

**Fix:** Nuke pattern: `docker exec openclaw-openclaw-gateway-1 sh -c 'echo "{}" > /home/node/.openclaw/sessions.json'` after any workspace change. Documented as a procedure.

**Status:** Fixed as procedure.

### 11. DiscordMessageListener timeout causing delivery failures
**What broke:** Under load, the Discord listener's event loop would slow, and the delivery queue pipeline degraded. The `@mention` path still worked but the general message path did not.

**Fix:** Reduced listener timeout and added explicit queue monitoring. Documented the `@mention` path as the reliable alternative.

**Status:** Fixed.

### 12. Agent falls back to embedded mode when plugin fails to load
**What broke:** If the plugin file ownership or jiti cache problems above caused the plugin to fail silently, OpenClaw would fall back to embedded mode and ClawBot would report tools as unavailable without a clear reason.

**Fix:** Upstream fix is plugin-ownership and jiti-cache handling in `docker-post-start.sh`. Verification step in `clawbot-verify.sh` logs the mode so the user can see fallbacks.

**Status:** Fixed.

---

## Cost and Rate-Limit Failures

### 13. Retry spiral burned ~$5 and 11.1M tokens in one session (Mar 12)
**What broke:** One failure cascaded into 232 API requests, ~11.1M tokens, ~$5.09. OpenClaw has no retry limit or circuit breaker. Image tokens from viewport screenshots were counted in the Codex request stream and each retry re-sent the image context, which inflated the token counts.

**Fix:** Switched the main model to `openai-codex/gpt-5.3-codex` through the $20/month ChatGPT subscription, which is flat-rate on text tokens and removes the per-token cost ceiling anxiety. Added user-side awareness of DALL-E calls (which still bill per image on `gpt-image-1`). Stopped feeding viewport screenshots back into the agent context.

**Status:** Mitigated, not fixed at the root. OpenClaw core still has no circuit breaker and `gpt-image-1` still bills per image. Tracked in Notion Bugs & Issues as Open.

### 14. Viewport screenshot context scare (Apr 6)
**What broke:** While debugging in Claude Code (on the host, not inside OpenClaw), `/context` showed `get_viewport_screenshot` consuming 392k tokens from just 2 screenshots, about 39% of Claude's 1M context window. Claude then estimated ClawBot had burned about 42M tokens (~$126 to $630) on screenshots over the previous month. Panic happened.

**Reality check:** The estimate was wrong. Claude had applied its own ~196k-tokens-per-image rate to ClawBot, but ClawBot runs on Codex which uses a different image tokenizer (orders of magnitude lower per image). The user also confirmed in the Discord conversation with ClawBot that OpenClaw is OAuth-linked to her $20/month ChatGPT subscription, so text tokens are covered by the flat-rate plan and there was no surprise bill coming.

**But the scare still produced useful findings:**
1. Images in an agent's context window get re-tokenized on every message, because they are part of the conversation history that gets resent. A 196k-token screenshot is not a one-time cost, it is a 196k-token tax on every subsequent message in that session. That multiplication is what made the numbers look catastrophic.
2. Multi-agent systems carry cross-tokenizer assumption risk. One AI cannot reliably estimate another AI's token economics by applying its own rates.
3. Even a wrong cost number can drive a correct architectural fix. The conclusion ("render to file, never load images into agent context") was right even though the dollar figure that motivated it was wrong.
4. Context bloat is a real problem regardless of billing, because screenshots push conversation history out of the agent's working memory.

**Fix:** Render to file via `bpy.ops.render.opengl(write_still=True)`, never load images into context. Use `get_object_info` / `get_scene_info` for data queries instead of visual checks. Added as a "Context Cost Awareness" section in `workspace/lessons-learned.md` for ClawBot and also applied to the user's Claude Code workflow.

**Status:** Fixed. Tracked in the Notion Bugs & Issues database.

---

## Reasoning and Behavior Failures

### 15. Spatial reasoning: rooms built from separate planes, wrong origins, wrong parenting
**What broke:** Early fridge_portal builds had rooms constructed from five separate plane meshes with visible gaps between them, object origins that were not at geometry centers (so positioning and parenting produced objects offset wildly from where the user asked), and parent-child relationships in the wrong order (handle was parent, body was child).

**Fix:** Hard rules written directly into `workspace/SOUL.md` so ClawBot reads them at the start of every session:
- Build rooms as a single hollow cube with the open face deleted, never as separate planes.
- Set origins to geometry center on every object before positioning or parenting.
- Query existing object coordinates before placing new objects.
- Fridge-type objects: body is root, door is child of body, handle is child of door.
See `workspace/lessons-learned.md` for the full list.

**Status:** Fixed. Rule persistence across sessions via file loading works reliably.

### 16. AI self-limits based on tool surface assumptions (BlenderKit)
**What broke:** ClawBot treated his listed MCP tool catalog as the full capability envelope. When asked to apply BlenderKit materials, he said he could not because BlenderKit was not in his tool list, even though he has `blender.execute` access to the entire `bpy` Python API and could discover BlenderKit operators by introspection.

**The serendipitous fix:** While doing something else, ClawBot accidentally ran a BlenderKit operator through `bpy.ops` and the user spotted it in the Discord output. Once asked directly ("wait, you just did that, didn't you?"), ClawBot realized his self-imposed limit was wrong and started using BlenderKit deliberately.

**Downstream bug:** BlenderKit calls then started failing intermittently. Claude Code traced the errors to a missing `avatar512` field in BlenderKit's upstream `UserProfile` Python class, which is BlenderKit's user profile picture schema. The field was absent in the installed version and crashed the auth step before the material download could run. Claude Code patched the class in place.

**Status:** Fixed. Three-system collaboration: ClawBot discovered the operator, the user caught the serendipity and refused to accept "it doesn't work" as permanent, Claude Code fixed the upstream Python bug. Documented in Notion Workflow Findings and in `workspace/lessons-learned.md` under "Blender Operator Discovery / Addon Surface."

### 17. Direct image-to-3D fails: sword saga
**What broke:** Building a pixel-art Minecraft diamond sword directly from reference images using natural-language spatial descriptions took 40+ failed iterations. Every iteration produced topology errors (wrong cell count, misaligned rows, z-fighting from duplicated adjacent faces) that were easy to describe visually but hard to correct visually.

**Fix (the representation engineering breakthrough):** Add an intermediate step. Plan the mesh as a 2D `html-canvas` grid first. Show the grid to the user, get explicit approval of the cell layout, then project the approved cells deterministically into Blender as a single subdivided plane with face deletions and per-face material assignments. The sword landed on the next try. ClawBot named this pattern "representation engineering" himself, unprompted, and generalized it to layouts, logos, decals, and texture masks.

**Status:** Fixed. Pattern now codified in `workspace/lessons-learned.md` under "Pixel-Grid Sword Editing" and referenced as the reliable pipeline: reference → approved 2D grid spec → Blender cell projection.

### 18. Destructive editing: wiped user-edited objects and compositor trees
**What broke:** Early in iteration, ClawBot would sometimes replace or delete user-edited objects and compositor node trees when adding new content, losing hours of refinement work.

**Fix:** "Non-Destructive Editing Principle" rule in `workspace/SOUL.md` and `workspace/lessons-learned.md`:
- Never wipe existing compositor nodes when adding new ones. Add to and integrate with the existing node tree.
- Scene-wide: prefer additive edits over replacement or deletion.
- Before destructive changes (deleting objects, clearing trees), check for integration options first and ask if unsure.
Plus the Scene Preservation rule: before clearing any scene, save a `.blend` copy to the renders directory with format `{scene_id}_{month}{day}.blend` and verify the file exists before proceeding.

**Status:** Fixed.

---

## Scoped Out (Not Failures)

The original scope included six scenes. Three scenes were delivered by the April 9 presentation (`fridge_portal`, `shelf_artifacts`, `garden_growing_voxels`). Four more were built on April 16 during the final production push (`clouds_balcony`, `bedroom_cloud_sky`, `hallway_renderdist`, `toy_shelf_scene`), bringing the total to seven delivered scenes across 289 renders.

---

## Cross-References

- Full Notion audit page (tabular summary of this document, in the project workspace)
- Notion Bugs & Issues database (open/closed tracking)
- Notion Workflow Findings database (process observations)
- `JOURNAL.md` for the iteration-by-iteration story
- `workspace/lessons-learned.md` for the rules that came out of these failures
- `workspace/SOUL.md` for the rules that get loaded into ClawBot on every session
- `docs/05_Failures_Known_Issues.pdf` (this document's Mar-31 snapshot predecessor)
