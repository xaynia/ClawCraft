import { sendCommand, type BlenderResponse } from "./blender-socket.js";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const RENDER_B64_MARKER = "__CLAWCRAFT_RENDER_B64__:";
const RENDER_DIR = path.join(process.env.HOME || "/home/node", ".openclaw", "media", "renders");
const LOG_PATH = path.join(process.env.HOME || "/home/node", ".openclaw", "workspace", "render_log.json");

// Notion integration (env vars set in container .env)
const NOTION_TOKEN = process.env.NOTION_TOKEN || "";
const NOTION_RENDERS_DB = process.env.NOTION_RENDERS_DB || "";
const NOTION_SCENES_DB = process.env.NOTION_SCENES_DB || "";

type PluginCfg = {
  host?: string;
  port?: number;
};

type RenderLogEntry = {
  id: string;
  timestamp: string;
  scene_id: string;
  iteration: number;
  user_prompt: string;
  refined_from: string | null;
  refinement_notes: string | null;
  blender_commands: string[];
  model_used: string;
  render_success: boolean;
  error_message: string | null;
  render_time_seconds: number;
  token_count: number | null;
  estimated_cost_usd: number;
  output_image: string;
  outcome_type: string;
  workflow_observation: string | null;
  quality_rating: number | null;
  notes: string | null;
};

function readLog(): RenderLogEntry[] {
  try {
    const data = fs.readFileSync(LOG_PATH, "utf-8");
    return JSON.parse(data) as RenderLogEntry[];
  } catch {
    return [];
  }
}

function writeLog(entries: RenderLogEntry[]): void {
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.writeFileSync(LOG_PATH, JSON.stringify(entries, null, 2));
}

function getNextIteration(log: RenderLogEntry[], sceneId: string): number {
  const sceneEntries = log.filter((e) => e.scene_id === sceneId);
  if (sceneEntries.length === 0) return 1;
  return Math.max(...sceneEntries.map((e) => e.iteration)) + 1;
}

function getLastRenderId(log: RenderLogEntry[], sceneId: string): string | null {
  const sceneEntries = log.filter((e) => e.scene_id === sceneId);
  if (sceneEntries.length === 0) return null;
  return sceneEntries[sceneEntries.length - 1]!.id;
}

// ── Notion helpers ──

async function notionPost(endpoint: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch(`https://api.notion.com/v1${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${NOTION_TOKEN}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json() as Promise<Record<string, unknown>>;
}

async function notionPatch(pageId: string, properties: Record<string, unknown>): Promise<void> {
  await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${NOTION_TOKEN}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
    body: JSON.stringify({ properties }),
  });
}

async function findScenePageId(sceneName: string): Promise<string | null> {
  if (!NOTION_SCENES_DB) return null;
  const data = await notionPost(`/databases/${NOTION_SCENES_DB}/query`, {
    filter: { property: "Name", title: { equals: sceneName } },
  });
  // oxlint-disable-next-line typescript/no-explicit-any
  const results = (data as any).results;
  return results?.length > 0 ? results[0].id : null;
}

async function pushRenderToNotion(entry: RenderLogEntry): Promise<void> {
  if (!NOTION_TOKEN || !NOTION_RENDERS_DB) return;
  const scenePageId = await findScenePageId(entry.scene_id);
  const properties: Record<string, unknown> = {
    Name: { title: [{ text: { content: entry.id } }] },
    Iteration: { number: entry.iteration },
    Outcome: { select: { name: entry.outcome_type } },
    "Render Time": { number: entry.render_time_seconds },
    Prompt: { rich_text: entry.user_prompt ? [{ text: { content: entry.user_prompt.slice(0, 2000) } }] : [] },
    "Workflow Observation": { rich_text: entry.workflow_observation ? [{ text: { content: entry.workflow_observation.slice(0, 2000) } }] : [] },
    Date: { date: { start: entry.timestamp } },
  };
  if (scenePageId) {
    properties.Scene = { relation: [{ id: scenePageId }] };
  }
  await notionPost("/pages", { parent: { database_id: NOTION_RENDERS_DB }, properties });

  // Update scene iteration count + status
  if (scenePageId) {
    await notionPatch(scenePageId, {
      Iterations: { number: entry.iteration },
      Status: { select: { name: "In Progress" } },
    });
  }
}

const toolParameters = {
  type: "object" as const,
  properties: {
    action: {
      type: "string" as const,
      description:
        'Action: "scene_info", "object_info", "execute", "render", "log_note", or "rate"',
    },
    name: {
      type: "string" as const,
      description: "Object name (for object_info)",
    },
    code: {
      type: "string" as const,
      description: "Python code to execute in Blender (for execute)",
    },
    engine: {
      type: "string" as const,
      description: 'Render engine: "BLENDER_EEVEE" (default) or "BLENDER_EEVEE_NEXT"',
    },
    width: {
      type: "number" as const,
      description: "Render width in pixels (default: 1920)",
    },
    height: {
      type: "number" as const,
      description: "Render height in pixels (default: 1080)",
    },
    samples: {
      type: "number" as const,
      description: "Cycles render samples (default: 128, ignored for Eevee)",
    },
    scene_id: {
      type: "string" as const,
      description: "Scene identifier for logging (e.g. fridge_portal, shelf_artifacts). Required for render.",
    },
    user_prompt: {
      type: "string" as const,
      description: "The user's original prompt/request that triggered this render.",
    },
    refinement_notes: {
      type: "string" as const,
      description: "Why this iteration exists — what changed from the previous attempt and why.",
    },
    outcome_type: {
      type: "string" as const,
      description: 'Render outcome: "success" (as intended), "partial" (rendered but not what was wanted), "failure" (error/crash), or "happy_accident" (failure that produced something interesting). Auto-set to success/failure based on render result, but you can override.',
    },
    workflow_observation: {
      type: "string" as const,
      description: "One sentence about the PROCESS, not the image. How did the workflow perform? E.g. 'User prompt was vague about scale, I had to make assumptions' or 'User converging through small targeted changes rather than restarting.' Critical for the final report.",
    },
    render_id: {
      type: "string" as const,
      description: "Render ID for log_note or rate actions (e.g. render_001).",
    },
    note: {
      type: "string" as const,
      description: "Note text for log_note action.",
    },
    rating: {
      type: "number" as const,
      description: "Quality rating 1-5 for rate action.",
    },
  },
  required: ["action"] as const,
};

// oxlint-disable-next-line typescript/no-explicit-any
export function createBlenderTool(api: any) {
  const cfg = (api.pluginConfig ?? {}) as PluginCfg;
  const host = cfg.host ?? "host.docker.internal";
  const port = cfg.port ?? 9876;

  return {
    name: "blender",
    label: "Blender 3D",
    description: [
      "Control Blender 3D through MCP socket. Available actions:",
      "• scene_info  — list objects, materials, and scene metadata",
      "• object_info — detailed info for a named object",
      "• execute     — run Blender Python code (bpy is pre-imported)",
      "• render      — render the current scene (requires scene_id, user_prompt; include workflow_observation)",
      "• log_note    — add a note to a render log entry (requires render_id, note)",
      "• rate        — set quality rating on a render (requires render_id, rating 1-5)",
      "",
      "After every render, ALWAYS ask the user what is working and what is not. Never just post and go silent.",
    ].join("\n"),

    parameters: toolParameters,

    async execute(_id: string, params: Record<string, unknown>) {
      const action = typeof params.action === "string" ? params.action.trim() : "";
      if (!action) {
        throw new Error("action is required");
      }

      switch (action) {
        case "scene_info":
          return handleSceneInfo(host, port);
        case "object_info":
          return handleObjectInfo(host, port, params);
        case "execute":
          return handleExecute(host, port, params);
        case "render":
          return handleRender(host, port, params);
        case "log_note":
          return handleLogNote(params);
        case "rate":
          return handleRate(params);
        default:
          throw new Error(
            `Unknown action "${action}". Use: scene_info, object_info, execute, render, log_note, rate`,
          );
      }
    },
  };
}

function assertSuccess(res: BlenderResponse): void {
  if (res.status === "error") {
    throw new Error(res.message ?? "Blender returned an error");
  }
}

async function handleSceneInfo(host: string, port: number) {
  const res = await sendCommand(host, port, { type: "get_scene_info" });
  assertSuccess(res);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(res.result, null, 2) }],
  };
}

async function handleObjectInfo(host: string, port: number, params: Record<string, unknown>) {
  const name = typeof params.name === "string" ? params.name.trim() : "";
  if (!name) throw new Error("name is required for object_info");
  const res = await sendCommand(host, port, { type: "get_object_info", params: { name } });
  assertSuccess(res);
  return { content: [{ type: "text" as const, text: JSON.stringify(res.result, null, 2) }] };
}

async function handleExecute(host: string, port: number, params: Record<string, unknown>) {
  const code = typeof params.code === "string" ? params.code : "";
  if (!code.trim()) throw new Error("code is required for execute action");
  const res = await sendCommand(host, port, { type: "execute_code", params: { code } }, 180_000);
  assertSuccess(res);
  return { content: [{ type: "text" as const, text: JSON.stringify(res.result, null, 2) }] };
}

async function handleRender(host: string, port: number, params: Record<string, unknown>) {
  const engine = typeof params.engine === "string" ? params.engine.trim() : "BLENDER_EEVEE";
  const width = typeof params.width === "number" && params.width > 0 ? Math.trunc(params.width) : 1920;
  const height = typeof params.height === "number" && params.height > 0 ? Math.trunc(params.height) : 1080;
  const samples = typeof params.samples === "number" && params.samples > 0 ? Math.trunc(params.samples) : 128;
  const sceneId = typeof params.scene_id === "string" ? params.scene_id.trim() : "untagged";
  const userPrompt = typeof params.user_prompt === "string" ? params.user_prompt : "";
  const refinementNotes = typeof params.refinement_notes === "string" ? params.refinement_notes : null;
  const outcomeTypeParam = typeof params.outcome_type === "string" ? params.outcome_type.trim() : null;
  const workflowObs = typeof params.workflow_observation === "string" ? params.workflow_observation : null;

  const cyclesBlock = engine === "CYCLES"
    ? `scene.cycles.samples = ${samples}\nscene.cycles.use_denoising = True` : "";

  const renderCode = `
import bpy, base64, os, tempfile

scene = bpy.context.scene
scene.render.engine = "${engine}"
scene.render.resolution_x = ${width}
scene.render.resolution_y = ${height}
scene.render.resolution_percentage = 100
${cyclesBlock}

tmpfile = tempfile.mktemp(suffix='.png')
scene.render.filepath = tmpfile
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'

bpy.ops.render.render(write_still=True)

with open(tmpfile, 'rb') as f:
    b64 = base64.b64encode(f.read()).decode()
os.unlink(tmpfile)
print('${RENDER_B64_MARKER}' + b64)
`.trim();

  const startTime = Date.now();
  let renderSuccess = true;
  let errorMessage: string | null = null;
  let b64 = "";

  try {
    const res = await sendCommand(host, port, { type: "execute_code", params: { code: renderCode } }, 300_000);
    assertSuccess(res);
    const output = typeof (res.result as Record<string, unknown>)?.result === "string"
      ? ((res.result as Record<string, unknown>).result as string) : "";
    const markerIdx = output.indexOf(RENDER_B64_MARKER);
    if (markerIdx === -1) throw new Error("Render completed but no image data returned. Blender stdout:\n" + output);
    b64 = output.slice(markerIdx + RENDER_B64_MARKER.length).trim();
  } catch (err) {
    renderSuccess = false;
    errorMessage = err instanceof Error ? err.message : String(err);
  }

  const renderTimeSeconds = Math.round((Date.now() - startTime) / 1000);
  const log = readLog();
  const iteration = getNextIteration(log, sceneId);
  const paddedIteration = String(iteration).padStart(3, "0");
  const fileName = `${sceneId}_${paddedIteration}.png`;

  fs.mkdirSync(RENDER_DIR, { recursive: true });
  const filePath = path.join(RENDER_DIR, fileName);
  if (renderSuccess && b64) fs.writeFileSync(filePath, Buffer.from(b64, "base64"));

  const renderId = `render_${String(log.length + 1).padStart(3, "0")}`;
  const refinedFrom = getLastRenderId(log, sceneId);

  // Determine outcome_type: use param if provided, else auto-detect
  const outcomeType = outcomeTypeParam ?? (renderSuccess ? "success" : "failure");

  const entry: RenderLogEntry = {
    id: renderId,
    timestamp: new Date().toISOString(),
    scene_id: sceneId,
    iteration,
    user_prompt: userPrompt,
    refined_from: iteration > 1 ? refinedFrom : null,
    refinement_notes: iteration > 1 ? (refinementNotes ?? null) : null,
    blender_commands: [renderCode],
    model_used: "openai-codex/gpt-5.3-codex",
    render_success: renderSuccess,
    error_message: errorMessage,
    render_time_seconds: renderTimeSeconds,
    token_count: null,
    estimated_cost_usd: 0.0,
    output_image: fileName,
    outcome_type: outcomeType,
    workflow_observation: workflowObs,
    quality_rating: null,
    notes: null,
  };

  log.push(entry);
  writeLog(log);

  // Push to Notion (best-effort, non-blocking)
  pushRenderToNotion(entry).catch((err) =>
    console.error("[notion] push failed:", err instanceof Error ? err.message : err),
  );

  if (!renderSuccess) throw new Error(`Render failed (logged as ${renderId}): ${errorMessage}`);

  return {
    content: [{
      type: "text" as const,
      text: `Rendered ${width}x${height} with ${engine} [${renderId}, ${sceneId} iter ${iteration}]\nMEDIA:${filePath}`,
    }],
  };
}

function handleLogNote(params: Record<string, unknown>) {
  const renderId = typeof params.render_id === "string" ? params.render_id.trim() : "";
  const note = typeof params.note === "string" ? params.note.trim() : "";
  if (!renderId || !note) throw new Error("render_id and note are required for log_note");
  const log = readLog();
  const entry = log.find((e) => e.id === renderId);
  if (!entry) throw new Error(`Render ${renderId} not found in log`);
  entry.notes = entry.notes ? `${entry.notes}\n${note}` : note;
  writeLog(log);
  return { content: [{ type: "text" as const, text: `Note added to ${renderId}.` }] };
}

function handleRate(params: Record<string, unknown>) {
  const renderId = typeof params.render_id === "string" ? params.render_id.trim() : "";
  const rating = typeof params.rating === "number" ? params.rating : 0;
  if (!renderId || rating < 1 || rating > 5) throw new Error("render_id and rating (1-5) are required for rate");
  const log = readLog();
  const entry = log.find((e) => e.id === renderId);
  if (!entry) throw new Error(`Render ${renderId} not found in log`);
  entry.quality_rating = Math.trunc(rating);
  writeLog(log);
  return { content: [{ type: "text" as const, text: `${renderId} rated ${Math.trunc(rating)}/5.` }] };
}
