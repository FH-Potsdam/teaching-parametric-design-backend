import fs from "fs/promises";
import path from "path";

import type { FunctionArray } from "./regex";

type GenerateResponsePayload = {
  html: string;
  raw: string;
  functionCalls: FunctionArray;
};

export async function logGenerateResponse(payload: GenerateResponsePayload): Promise<void> {
  const timestamp = new Date().toISOString();
  const logsDir = path.join(process.cwd(), "logs");
  await fs.mkdir(logsDir, { recursive: true });

  const safeTimestamp = timestamp.replace(/[:.]/g, "-");
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const filePath = path.join(logsDir, `${safeTimestamp}-${randomSuffix}.json`);
  const logPayload = { ...payload, timestamp };

  await fs.writeFile(filePath, JSON.stringify(logPayload, null, 2), "utf8");
}
