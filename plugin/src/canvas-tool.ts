import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const RENDER_DIR = path.join(process.env.HOME || "/home/node", ".openclaw", "media", "renders");

const toolParameters = {
  type: "object" as const,
  properties: {
    html: {
      type: "string" as const,
      description: "Full HTML document to render as a PNG screenshot (include <html>, <body>, inline CSS/JS)",
    },
    width: {
      type: "number" as const,
      description: "Viewport width in pixels (default: 1280)",
    },
    height: {
      type: "number" as const,
      description: "Viewport height in pixels (default: 720)",
    },
  },
  required: ["html"] as const,
};

// oxlint-disable-next-line typescript/no-explicit-any
export function createCanvasTool(_api: any) {
  return {
    name: "html-canvas",
    label: "HTML Canvas",
    description: [
      "Render HTML to a PNG image using headless Chromium. Use for:",
      "• Infographics and dashboards",
      "• Styled tables, cards, and layouts",
      "• Diagrams and flowcharts",
      "• Any rich visual that HTML/CSS can produce",
      "Pass a full HTML document string and get back a Discord-ready image.",
    ].join("\n"),

    parameters: toolParameters,

    async execute(_id: string, params: Record<string, unknown>) {
      const html = typeof params.html === "string" ? params.html : "";
      if (!html.trim()) {
        throw new Error("html is required");
      }

      fs.mkdirSync(RENDER_DIR, { recursive: true });

      // Write HTML to temp file
      const htmlFile = path.join(RENDER_DIR, `tmp-${crypto.randomUUID()}.html`);
      const pngFile = path.join(RENDER_DIR, `canvas-${crypto.randomUUID()}.png`);
      fs.writeFileSync(htmlFile, html);

      try {
        execFileSync("node", ["/app/render-html.mjs", htmlFile, pngFile], {
          timeout: 30_000,
          stdio: "pipe",
        });
      } finally {
        // Clean up temp HTML
        try { fs.unlinkSync(htmlFile); } catch { /* ignore */ }
      }

      if (!fs.existsSync(pngFile)) {
        throw new Error("Chromium render failed — no output PNG produced");
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `Rendered HTML canvas (${pngFile})\nMEDIA:${pngFile}`,
          },
        ],
      };
    },
  };
}
