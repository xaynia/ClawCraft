import { createBlenderTool } from "./src/blender-tool.js";
import { createCanvasTool } from "./src/canvas-tool.js";
import { createSlidevTool } from "./src/slidev-tool.js";

// OpenClaw plugin entry point — registers Blender 3D, HTML Canvas, and Slidev tools.
// Loaded by jiti at runtime; no build step needed.

// oxlint-disable-next-line typescript/no-explicit-any
export default function register(api: any) {
  api.registerTool(createBlenderTool(api));
  api.registerTool(createCanvasTool(api));
  api.registerTool(createSlidevTool(api));
}
