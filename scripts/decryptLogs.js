require("dotenv/config");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const LOG_ENCRYPTION_KEY_ENV = "LOG_ENCRYPTION_KEY";
const LOG_ENCRYPTION_ALGORITHM = "aes-256-gcm";
const LOG_ENCRYPTION_KEY_BYTES = 32;

function resolveEncryptionKey() {
  const rawKey = process.env[LOG_ENCRYPTION_KEY_ENV];
  if (!rawKey || !rawKey.trim()) {
    throw new Error(`${LOG_ENCRYPTION_KEY_ENV} is required`);
  }

  const trimmed = rawKey.trim();
  const isHex = /^[0-9a-fA-F]{64}$/.test(trimmed);
  const isBase64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(trimmed);
  if (!isHex && !isBase64) {
    throw new Error(`${LOG_ENCRYPTION_KEY_ENV} must be 64-char hex or base64-encoded 32-byte value`);
  }

  const key = Buffer.from(trimmed, isHex ? "hex" : "base64");
  if (key.length !== LOG_ENCRYPTION_KEY_BYTES) {
    throw new Error(`${LOG_ENCRYPTION_KEY_ENV} must decode to exactly ${LOG_ENCRYPTION_KEY_BYTES} bytes`);
  }

  return key;
}

function decryptPayload(payload, key) {
  if (!payload || payload.algorithm !== LOG_ENCRYPTION_ALGORITHM) {
    throw new Error(`Unsupported or missing algorithm: ${payload?.algorithm}`);
  }

  const decipher = crypto.createDecipheriv(
    LOG_ENCRYPTION_ALGORITHM,
    key,
    Buffer.from(payload.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "base64")),
    decipher.final(),
  ]);

  return JSON.parse(plaintext.toString("utf8"));
}

function isEncryptedLog(filename) {
  return filename.endsWith(".json.enc") || filename.endsWith(".enc");
}

function getOutputName(filename) {
  if (filename.endsWith(".json.enc")) {
    return filename.slice(0, -4);
  }
  if (filename.endsWith(".enc")) {
    return `${filename.slice(0, -4)}.json`;
  }
  return `${filename}.json`;
}

function listEncryptedFilesRecursively(rootDir, relativeDir = "") {
  const currentDir = path.join(rootDir, relativeDir);
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listEncryptedFilesRecursively(rootDir, relativePath));
      continue;
    }
    if (entry.isFile() && isEncryptedLog(entry.name)) {
      files.push(relativePath);
    }
  }

  return files;
}

function run() {
  const inputDir = path.resolve(process.cwd(), process.argv[2] || "logs");
  const outputDir = path.resolve(process.cwd(), process.argv[3] || "logs-decrypted");
  const key = resolveEncryptionKey();

  if (!fs.existsSync(inputDir)) {
    throw new Error(`Input directory does not exist: ${inputDir}`);
  }

  fs.mkdirSync(outputDir, { recursive: true });
  const files = listEncryptedFilesRecursively(inputDir);

  if (files.length === 0) {
    // eslint-disable-next-line no-console
    console.log(`No encrypted log files found in ${inputDir}`);
    return;
  }

  let successCount = 0;
  let failureCount = 0;

  for (const file of files) {
    const sourcePath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, getOutputName(file));
    try {
      const raw = fs.readFileSync(sourcePath, "utf8");
      const encryptedPayload = JSON.parse(raw);
      const decryptedPayload = decryptPayload(encryptedPayload, key);
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, `${JSON.stringify(decryptedPayload, null, 2)}\n`, "utf8");
      successCount += 1;
      // eslint-disable-next-line no-console
      console.log(`Decrypted: ${file} -> ${path.relative(outputDir, outputPath)}`);
    } catch (error) {
      failureCount += 1;
      // eslint-disable-next-line no-console
      console.error(`Failed: ${file}`);
      // eslint-disable-next-line no-console
      console.error(error instanceof Error ? error.message : String(error));
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Done. Success: ${successCount}, Failed: ${failureCount}, Output: ${outputDir}`);

  if (failureCount > 0) {
    process.exitCode = 1;
  }
}

try {
  run();
} catch (error) {
  // eslint-disable-next-line no-console
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
