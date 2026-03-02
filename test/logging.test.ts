import fs from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { logGenerateResponse } from "../src/logging";
import { BASE_CONTEXT } from "../src/requestCode";

describe("logGenerateResponse", () => {
  const cwdSpy = vi.spyOn(process, "cwd");
  let tempDir: string | null = null;

  afterEach(async () => {
    cwdSpy.mockReset();
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
      tempDir = null;
    }
  });

  it("writes the response payload with a timestamp into logs", async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "tpd-logs-"));
    cwdSpy.mockReturnValue(tempDir);

    const payload = {
      html: "<pre>hi</pre>",
      raw: "console.log(1);",
      functionCalls: [{ name: "setup", url: "https://example.com", thumbnail: null }]
    };
    const messages = [
      { role: "system" as const, content: BASE_CONTEXT },
      { role: "user" as const, content: "Draw a circle." },
      {
        role: "user" as const,
        content:
          "The question is about the attached current code. Use this code as context when responding.\n\nCurrent code:\nfunction draw() { background(0); }"
      }
    ];

    await logGenerateResponse(payload, messages);

    const logDir = path.join(tempDir, "logs");
    const entries = await fs.readdir(logDir);
    expect(entries).toHaveLength(1);

    const logContents = await fs.readFile(path.join(logDir, entries[0]), "utf8");
    const parsed = JSON.parse(logContents) as typeof payload & {
      messages: Array<{ role: "system" | "user"; content: string }>;
      timestamp: string;
    };

    expect(parsed).toMatchObject(payload);
    expect(parsed.messages).toEqual(messages);
    expect(typeof parsed.timestamp).toBe("string");
    expect(parsed.timestamp.length).toBeGreaterThan(0);
  });
});
