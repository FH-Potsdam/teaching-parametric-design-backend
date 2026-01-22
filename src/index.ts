import "dotenv/config";
import express, { Request, Response } from "express";
import path from "path";

import { enhanceCode } from "./enhanceCode";
import { loadFunctionLinks, resolveLanguage } from "./functionLinks";
import { requestOpenRouterCode } from "./openRouter";

const app = express();
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
    return res.json({ html: html.code, raw: code, functionCalls: html.functions });
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
