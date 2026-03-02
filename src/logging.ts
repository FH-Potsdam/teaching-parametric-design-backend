import fs from "fs/promises";
import path from "path";

import type { FunctionArray } from "./regex";
import type { RequestCodeMessage } from "./requestCode";

type GenerateResponsePayload = {
  html: string;
  raw: string;
  functionCalls: FunctionArray;
};

type GenerateLogPayload = GenerateResponsePayload & {
  messages: RequestCodeMessage[];
  timestamp: string;
};

/**
 * Persist the generate endpoint response payload to a timestamped log file.
 * @param payload - JSON payload returned by /api/generate.
 * @param messages - Full message array used for generation.
 * @returns Promise resolving after the log file is written.
 */
export async function logGenerateResponse(
  payload: GenerateResponsePayload,
  messages: RequestCodeMessage[]
): Promise<void> {
  const timestamp = new Date().toISOString();
  const logsDir = path.join(process.cwd(), "logs");
  await fs.mkdir(logsDir, { recursive: true });

  const safeTimestamp = timestamp.replace(/[:.]/g, "-");
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const filePath = path.join(logsDir, `${safeTimestamp}-${randomSuffix}.json`);
  const logPayload: GenerateLogPayload = { ...payload, messages, timestamp };

  await fs.writeFile(filePath, JSON.stringify(logPayload, null, 2), "utf8");
}
