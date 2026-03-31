import net from "node:net";

export type BlenderResponse = {
  status: "success" | "error";
  result?: Record<string, unknown>;
  message?: string;
};

/**
 * Send a single JSON command to the Blender MCP addon socket and return the
 * parsed response.  Each call opens a fresh TCP connection (the addon's
 * protocol is one-command-per-connection when driven from outside its own
 * persistent client loop, but it also works with a kept-alive socket).
 */
export function sendCommand(
  host: string,
  port: number,
  command: Record<string, unknown>,
  timeoutMs = 120_000,
): Promise<BlenderResponse> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);
    const chunks: Buffer[] = [];
    let settled = false;

    const settle = (fn: () => void) => {
      if (!settled) {
        settled = true;
        fn();
      }
    };

    socket.connect(port, host, () => {
      socket.write(JSON.stringify(command));
    });

    socket.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
      try {
        const text = Buffer.concat(chunks).toString("utf-8");
        const parsed = JSON.parse(text) as BlenderResponse;
        socket.destroy();
        settle(() => resolve(parsed));
      } catch {
        // incomplete JSON — wait for more chunks
      }
    });

    socket.on("timeout", () => {
      socket.destroy();
      settle(() => reject(new Error("Blender socket timed out")));
    });

    socket.on("error", (err: Error) => {
      settle(() =>
        reject(
          new Error(
            `Blender socket error (${host}:${port}): ${err.message}`,
          ),
        ),
      );
    });

    socket.on("close", () => {
      if (!settled && chunks.length > 0) {
        try {
          const text = Buffer.concat(chunks).toString("utf-8");
          settle(() => resolve(JSON.parse(text) as BlenderResponse));
        } catch {
          settle(() => reject(new Error("Incomplete JSON from Blender")));
        }
      } else if (!settled) {
        settle(() => reject(new Error("Blender socket closed without response")));
      }
    });
  });
}
