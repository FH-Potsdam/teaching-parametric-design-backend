import fs from "fs/promises";
import path from "path";

import type { FunctionArray } from "./regex";

type GenerateResponsePayload = {
  html: string;
  raw: string;
  functionCalls: FunctionArray;
};

type GenerateLogPayload = GenerateResponsePayload & {
  question: string;
  timestamp: string;
};

/**
 * Persist the generate endpoint response payload to a timestamped log file.
 * @param payload - JSON payload returned by /api/generate.
 * @param question - User question sent to /api/generate.
 * @returns Promise resolving after the log file is written.
 */
export async function logGenerateResponse(
  payload: GenerateResponsePayload,
  question: string
): Promise<void> {
  const timestamp = new Date().toISOString();
  const logsDir = path.join(process.cwd(), "logs");
  await fs.mkdir(logsDir, { recursive: true });

  const safeTimestamp = timestamp.replace(/[:.]/g, "-");
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const filePath = path.join(logsDir, `${safeTimestamp}-${randomSuffix}.json`);
  const logPayload: GenerateLogPayload = { ...payload, question, timestamp };

  await fs.writeFile(filePath, JSON.stringify(logPayload, null, 2), "utf8");
}
