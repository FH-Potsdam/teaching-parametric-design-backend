import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
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

const LOG_ENCRYPTION_ALGORITHM = "aes-256-gcm";
const LOG_ENCRYPTION_KEY_ENV = "LOG_ENCRYPTION_KEY";
const LOG_ENCRYPTION_IV_BYTES = 12;
const LOG_ENCRYPTION_KEY_BYTES = 32;

export type EncryptedGenerateLogPayload = {
  version: 1;
  algorithm: typeof LOG_ENCRYPTION_ALGORITHM;
  iv: string;
  authTag: string;
  ciphertext: string;
};

function getLogEncryptionKey(): Buffer {
  const rawKey = process.env[LOG_ENCRYPTION_KEY_ENV];
  if (!rawKey?.trim()) {
    throw new Error(`${LOG_ENCRYPTION_KEY_ENV} is required to write encrypted logs`);
  }

  const trimmedKey = rawKey.trim();
  const isHexKey = /^[0-9a-fA-F]{64}$/.test(trimmedKey);
  const isBase64Key =
    /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(trimmedKey);

  if (!isHexKey && !isBase64Key) {
    throw new Error(
      `${LOG_ENCRYPTION_KEY_ENV} must be 64-char hex or base64-encoded 32-byte value`,
    );
  }

  const key = isHexKey ? Buffer.from(trimmedKey, "hex") : Buffer.from(trimmedKey, "base64");
  if (key.length !== LOG_ENCRYPTION_KEY_BYTES) {
    throw new Error(
      `${LOG_ENCRYPTION_KEY_ENV} must decode to exactly ${LOG_ENCRYPTION_KEY_BYTES} bytes`,
    );
  }

  return key;
}

function encryptGenerateLogPayload(
  payload: GenerateLogPayload,
  key: Buffer,
): EncryptedGenerateLogPayload {
  const iv = randomBytes(LOG_ENCRYPTION_IV_BYTES);
  const cipher = createCipheriv(LOG_ENCRYPTION_ALGORITHM, key, iv);
  const plaintext = JSON.stringify(payload);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);

  return {
    version: 1,
    algorithm: LOG_ENCRYPTION_ALGORITHM,
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };
}

export function decryptGenerateLogPayload(
  payload: EncryptedGenerateLogPayload,
  key: Buffer,
): GenerateLogPayload {
  if (payload.algorithm !== LOG_ENCRYPTION_ALGORITHM) {
    throw new Error(`Unsupported log algorithm: ${payload.algorithm}`);
  }

  const decipher = createDecipheriv(
    LOG_ENCRYPTION_ALGORITHM,
    key,
    Buffer.from(payload.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "base64")),
    decipher.final(),
  ]);

  return JSON.parse(plaintext.toString("utf8")) as GenerateLogPayload;
}

/**
 * Persist the generate endpoint response payload to a timestamped encrypted log file.
 * @param payload - JSON payload returned by /api/generate.
 * @param messages - Full message array used for generation.
 * @returns Promise resolving after the log file is written.
 */
export async function logGenerateResponse(
  payload: GenerateResponsePayload,
  messages: RequestCodeMessage[]
): Promise<void> {
  const encryptionKey = getLogEncryptionKey();
  const timestamp = new Date().toISOString();
  const logsDir = path.join(process.cwd(), "logs");
  await fs.mkdir(logsDir, { recursive: true });

  const safeTimestamp = timestamp.replace(/[:.]/g, "-");
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const filePath = path.join(logsDir, `${safeTimestamp}-${randomSuffix}.json.enc`);
  const logPayload: GenerateLogPayload = { ...payload, messages, timestamp };
  const encryptedLogPayload = encryptGenerateLogPayload(logPayload, encryptionKey);

  await fs.writeFile(filePath, JSON.stringify(encryptedLogPayload, null, 2), "utf8");
}
