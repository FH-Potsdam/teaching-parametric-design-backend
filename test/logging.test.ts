import fs from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  decryptGenerateLogPayload,
  type EncryptedGenerateLogPayload,
  logGenerateResponse,
} from "../src/logging";
import { BASE_CONTEXT } from "../src/requestCode";

describe("logGenerateResponse", () => {
  const cwdSpy = vi.spyOn(process, "cwd");
  const originalEncryptionKey = process.env.LOG_ENCRYPTION_KEY;
  let tempDir: string | null = null;

  afterEach(async () => {
    cwdSpy.mockReset();
    if (originalEncryptionKey === undefined) {
      delete process.env.LOG_ENCRYPTION_KEY;
    } else {
      process.env.LOG_ENCRYPTION_KEY = originalEncryptionKey;
    }
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
      tempDir = null;
    }
  });

  it("writes an AES-256 encrypted response payload into logs", async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "tpd-logs-"));
    cwdSpy.mockReturnValue(tempDir);
    const encryptionKey = Buffer.alloc(32, 7);
    process.env.LOG_ENCRYPTION_KEY = encryptionKey.toString("base64");

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
    expect(entries[0].endsWith(".json.enc")).toBe(true);

    const logContents = await fs.readFile(path.join(logDir, entries[0]), "utf8");
    expect(logContents).not.toContain("console.log(1);");

    const parsedEncrypted = JSON.parse(logContents) as EncryptedGenerateLogPayload;
    expect(parsedEncrypted.algorithm).toBe("aes-256-gcm");
    expect(parsedEncrypted.version).toBe(1);
    expect(parsedEncrypted.iv.length).toBeGreaterThan(0);
    expect(parsedEncrypted.authTag.length).toBeGreaterThan(0);
    expect(parsedEncrypted.ciphertext.length).toBeGreaterThan(0);

    const parsed = decryptGenerateLogPayload(parsedEncrypted, encryptionKey);

    expect(parsed).toMatchObject(payload);
    expect(parsed.messages).toEqual(messages);
    expect(typeof parsed.timestamp).toBe("string");
    expect(parsed.timestamp.length).toBeGreaterThan(0);
  });

  it("throws if no encryption key is configured", async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "tpd-logs-"));
    cwdSpy.mockReturnValue(tempDir);
    delete process.env.LOG_ENCRYPTION_KEY;

    const payload = {
      html: "<pre>hi</pre>",
      raw: "console.log(1);",
      functionCalls: [{ name: "setup", url: "https://example.com", thumbnail: null }]
    };
    const messages = [{ role: "system" as const, content: BASE_CONTEXT }];

    await expect(logGenerateResponse(payload, messages)).rejects.toThrow("LOG_ENCRYPTION_KEY");
  });
});
