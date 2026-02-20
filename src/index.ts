import "dotenv/config";
import express, { Request, Response } from "express";
import path from "path";

import { enhanceCode } from "./enhanceCode";
import { loadFunctionLinks, resolveLanguage } from "./functionLinks";
import { logGenerateResponse } from "./logging";
import { requestOpenRouterCode } from "./openRouter";

const app = express();
const allowedOrigins = new Set([
  "https://parametric-design.fh-potsdam.de",
  "http://parametric-design.fh-potsdam.de",
]);
const allowLocalhostCors = ["1", "true", "yes", "on"].includes(
  (process.env.ALLOW_LOCALHOST_CORS || "").toLowerCase(),
);

function isLocalTestOrigin(origin: string): boolean {
  try {
    const { protocol, hostname } = new URL(origin);
    const isHttp = protocol === "http:" || protocol === "https:";
    const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";
    return isHttp && isLocalHost;
  } catch {
    return false;
  }
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.has(origin) || (allowLocalhostCors && isLocalTestOrigin(origin)))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));
app.use("/docs", express.static(path.join(process.cwd(), "docs-api")));

const PORT = process.env.PORT || 3000;

/**
 * Handle code-generation requests and return highlighted HTML plus link data.
 * @param req - Express request with question/language payload.
 * @param res - Express response used to send JSON.
 * @returns Promise resolving to an Express response.
 */
async function handleGenerate(req: Request, res: Response) {
  const question: unknown = req.body?.question;
  const language = resolveLanguage(req.body?.language);

  if (typeof question !== "string" || !question.trim()) {
    return res.status(400).json({ error: "Question is required" });
  }

  try {
    const code = await requestOpenRouterCode(question);
    const functionLinks = loadFunctionLinks(language);
    const html = enhanceCode(code, functionLinks, language);
    const responsePayload = { html: html.code, raw: code, functionCalls: html.functions };

    try {
      await logGenerateResponse(responsePayload, question);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to write generate log", error);
    }

    return res.json(responsePayload);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: "Failed to generate code" });
  }
}

/**
 * Handle code-linkification requests and return highlighted HTML plus link data.
 * @param req - Express request with code/language payload.
 * @param res - Express response used to send JSON.
 * @returns Promise resolving to an Express response.
 */
async function handleLinkify(req: Request, res: Response) {
  const code: unknown = req.body?.code;
  const language = resolveLanguage(req.body?.language);

  if (typeof code !== "string" || !code.trim()) {
    return res.status(400).json({ error: "Code is required" });
  }

  try {
    const functionLinks = loadFunctionLinks(language);
    const html = enhanceCode(code, functionLinks, language);
    return res.json({ html: html.code, raw: code, functionCalls: html.functions });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: "Failed to linkify code" });
  }
}

app.post("/api/generate", handleGenerate);
app.post("/api/linkify", handleLinkify);
app.get("/api/ping", (_req: Request, res: Response) => res.type("text").send("pong"));

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is listening on port ${PORT}`);
  });
}

export { handleGenerate, handleLinkify };
export default app;
