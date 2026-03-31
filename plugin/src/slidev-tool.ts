import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";

const RENDER_DIR = path.join(process.env.HOME || "/home/node", ".openclaw", "media", "renders");
const WORKSPACE = "/home/node/slidev-workspace";

const toolParameters = {
  type: "object" as const,
  properties: {
    markdown: {
      type: "string" as const,
      description: [
        "Slidev Markdown content. Separate slides with ---. First slide should have frontmatter.",
        "Supports: Mermaid diagrams, KaTeX math, Shiki code highlighting, emojis.",
        "Example:",
        "---",
        "theme: default",
        "---",
        "",
        "# Title",
        "",
        "---",
        "",
        "## Slide 2",
        "- Point one",
        "- Point two",
      ].join("\n"),
    },
  },
  required: ["markdown"] as const,
};

// oxlint-disable-next-line typescript/no-explicit-any
export function createSlidevTool(_api: any) {
  return {
    name: "slidev",
    label: "Slidev Presentations",
    description: [
      "Generate presentation slides from Markdown using Slidev. Returns each slide as a PNG image.",
      "Supports Mermaid diagrams, KaTeX math, code highlighting, themes, and emojis.",
      "Only use when explicitly asked to create a slide deck or presentation.",
      "For single visuals/infographics, use the canvas tool instead.",
    ].join("\n"),

    parameters: toolParameters,

    async execute(_id: string, params: Record<string, unknown>) {
      const markdown = typeof params.markdown === "string" ? params.markdown : "";
      if (!markdown.trim()) {
        throw new Error("markdown content is required");
      }

      fs.mkdirSync(RENDER_DIR, { recursive: true });
      fs.mkdirSync(WORKSPACE, { recursive: true });

      // Write slides
      const slidesPath = path.join(WORKSPACE, "slides.md");
      fs.writeFileSync(slidesPath, markdown);

      // Build static HTML
      const distDir = path.join(WORKSPACE, "dist");
      try {
        execSync(`npx slidev build ${slidesPath} --out ${distDir}`, {
          cwd: WORKSPACE,
          timeout: 60_000,
          stdio: "pipe",
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error("Slidev build failed: " + msg);
      }

      // Count slides by splitting on ---
      const slideCount = markdown.split(/\n---\n/).length;

      // Screenshot each slide via HTTP server + Playwright
      const sessionId = crypto.randomUUID().slice(0, 8);
      const screenshotScript = `
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const DIST = ${JSON.stringify(distDir)};
const DIR = ${JSON.stringify(RENDER_DIR)};
const SESSION = ${JSON.stringify(sessionId)};
const SLIDE_COUNT = ${slideCount};

const mimeTypes = {
  ".html": "text/html", ".js": "application/javascript",
  ".css": "text/css", ".json": "application/json",
  ".png": "image/png", ".svg": "image/svg+xml",
  ".woff2": "font/woff2", ".woff": "font/woff"
};

const server = http.createServer((req, res) => {
  let fp = path.join(DIST, req.url === "/" ? "index.html" : req.url.split("?")[0]);
  if (!fs.existsSync(fp) && !path.extname(fp)) fp = path.join(DIST, "index.html");
  try {
    const data = fs.readFileSync(fp);
    res.writeHead(200, { "Content-Type": mimeTypes[path.extname(fp)] || "application/octet-stream" });
    res.end(data);
  } catch { res.writeHead(404); res.end(); }
});

server.listen(4444, async () => {
  const bp = fs.readdirSync("/home/node/.cache/ms-playwright").filter(d => d.startsWith("chromium-"))[0];
  const exe = path.join("/home/node/.cache/ms-playwright", bp, "chrome-linux/chrome");
  const browser = await chromium.launch({ executablePath: exe, args: ["--no-sandbox", "--disable-gpu"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  const paths = [];
  for (let i = 1; i <= SLIDE_COUNT; i++) {
    await page.goto("http://localhost:4444/" + i, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(3000);
    const out = path.join(DIR, "slidev-" + SESSION + "-" + i + ".png");
    await page.screenshot({ path: out });
    paths.push(out);
  }
  await browser.close();
  server.close();
  console.log(JSON.stringify(paths));
});
`;

      let output: string;
      try {
        output = execSync(`node -e ${JSON.stringify(screenshotScript)}`, {
          cwd: "/app",
          timeout: 120_000,
          stdio: "pipe",
        }).toString().trim();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error("Slidev screenshot failed: " + msg);
      }

      let paths: string[];
      try {
        paths = JSON.parse(output) as string[];
      } catch {
        throw new Error("Failed to parse screenshot output: " + output);
      }

      const mediaLines = paths.map((p, i) => `Slide ${i + 1}\nMEDIA:${p}`).join("\n");

      return {
        content: [
          {
            type: "text" as const,
            text: `Generated ${paths.length} slides\n${mediaLines}`,
          },
        ],
      };
    },
  };
}
