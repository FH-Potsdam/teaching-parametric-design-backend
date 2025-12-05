import express, { Request, Response } from "express";
import hljs from "highlight.js";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

if (!OPENROUTER_API_KEY) {
  // eslint-disable-next-line no-console
  console.warn("OPENROUTER_API_KEY is not set. Requests to OpenRouter will fail.");
}

const BASE_CONTEXT = `You are a JavaScript coding assistant. Always respond with ONLY plain JavaScript code that can run in a modern browser. Never include Markdown, explanations, prose, or additional commentary—just the code itself. The code must be safe to embed inside an HTML <script> tag.`;

const FUNCTION_LINKS: Record<string, string> = {
  fetch: "https://developer.mozilla.org/en-US/docs/Web/API/fetch",
  "console.log": "https://developer.mozilla.org/en-US/docs/Web/API/console/log",
  "document.querySelector": "https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector",
  "addEventListener": "https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener"
};

app.post("/api/generate", async (req: Request, res: Response) => {
  const question: unknown = req.body?.question;
  const additionalLinks = parseFunctionLinks(req.body?.functionLinks);

  if (typeof question !== "string" || !question.trim()) {
    return res.status(400).json({ error: "Question is required" });
  }

  if (additionalLinks instanceof Error) {
    return res.status(400).json({ error: additionalLinks.message });
  }

  try {
    const code = await requestOpenRouterCode(question);
    const { html, links } = enhanceCode(code, additionalLinks);
    return res.json({ html, links });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: "Failed to generate code" });
  }
});

async function requestOpenRouterCode(question: string): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY ?? ""}`,
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost",
      "X-Title": process.env.OPENROUTER_APP_TITLE || "Teaching Parametric Design Backend"
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: BASE_CONTEXT },
        { role: "user", content: question }
      ]
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`OpenRouter request failed: ${response.status} ${response.statusText} - ${details}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No content returned from OpenRouter");
  }

  return content.trim();
}

function enhanceCode(
  code: string,
  additionalLinks: Record<string, string> = {}
): { html: string; links: Array<{ function: string; url: string }> } {
  const highlighted = highlightJavaScript(code);
  return linkifyFunctions(highlighted, { ...FUNCTION_LINKS, ...additionalLinks });
}

function highlightJavaScript(code: string): string {
  const { value } = hljs.highlight(code, { language: "javascript" });
  return `<pre><code class="hljs language-javascript">${value}</code></pre>`;
}

function linkifyFunctions(
  html: string,
  functionLinks: Record<string, string>
): { html: string; links: Array<{ function: string; url: string }> } {
  const appliedLinks: Array<{ function: string; url: string }> = [];

  const linkedHtml = Object.entries(functionLinks).reduce((output, [fn, url]) => {
    const escaped = fn.replace(/[-/\^$*+?.()|[\]{}]/g, "\$&");
    const regex = new RegExp(`(\b${escaped}\b)`, "g");
    let used = false;

    const replaced = output.replace(regex, (_match, reference) => {
      used = true;
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${reference}</a>`;
    });

    if (used) {
      appliedLinks.push({ function: fn, url });
    }

    return replaced;
  }, html);

  return { html: linkedHtml, links: appliedLinks };
}

function parseFunctionLinks(input: unknown): Record<string, string> | Error {
  if (input === undefined) {
    return {};
  }

  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return new Error("functionLinks must be an object mapping function names to URLs");
  }

  return Object.entries(input as Record<string, unknown>).reduce<Record<string, string>>((links, [fn, url]) => {
    if (typeof url === "string" && url.trim()) {
      links[fn] = url.trim();
    }
    return links;
  }, {});
}

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is listening on port ${PORT}`);
  });
}

export { enhanceCode, highlightJavaScript, linkifyFunctions, FUNCTION_LINKS, parseFunctionLinks };
export default app;
