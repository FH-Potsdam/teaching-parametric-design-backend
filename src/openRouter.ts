import type { OpenRouter as OpenRouterClient } from "@openrouter/sdk";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
const OPENROUTER_APP_TITLE =
  process.env.OPENROUTER_APP_TITLE || "Teaching Parametric Design Backend";

if (!OPENROUTER_API_KEY) {
  // eslint-disable-next-line no-console
  console.warn("OPENROUTER_API_KEY is not set. Requests to OpenRouter will fail.");
}

let openRouterPromise: Promise<OpenRouterClient> | null = null;
const dynamicImport = new Function(
  "specifier",
  "return import(specifier)"
) as (specifier: string) => Promise<{ OpenRouter: new (options: unknown) => OpenRouterClient }>;

const BASE_CONTEXT = `You are a JavaScript code generator.

SCOPE DISCIPLINE (MANDATORY):
- Implement ONLY what the user explicitly asked for.
- Do NOT add extra features, UI, controls, debug helpers, export shortcuts, or “nice to have” options unless requested.
- If the user request is underspecified, choose the simplest reasonable default and do not add alternatives.
- Prefer minimal code changes over adding new functions or global state.
- Do not include any event handlers (mousePressed/keyPressed/etc.) unless explicitly requested.
- Do not include saving/exporting unless explicitly requested.
- Do not include audio unless explicitly requested.
- Implement the minimal solution that satisfies the request. No extras.

Return ONLY valid JSON matching the provided JSON Schema.

Inside the "code" field:
- Output pure executable JavaScript.
- Use p5.js, p5.js-svg, and p5.sound.
- The output MUST be a complete JavaScript program and MUST include the following boilerplate functions exactly once:

function preload(){
  // preload assets
}

function setup() {
  // width, height of output
  createCanvas(400, 400);
}

function draw() {
  // background color 0 = black
  background(0);
}

- You may extend these functions.
- Output ONLY valid, executable JavaScript.
- You may change canvas size if neccessary
- DO ADD JavaScript comments (// or /* */) inside the code to explain the logic.
- Do NOT use Markdown or explanations outside the code.
- Do NOT use code fences.
- Do NOT add headers, summaries, or trailing text.
- The code output will be parsed and executed directly in a JavaScript runtime with p5.js, p5.js-svg, and p5.sound available.

If the user requests something else than code, return {"code": ""}
If you cannot comply, return {"code": ""}.`.trim();

export { BASE_CONTEXT };

const p5SketchSchema = {
  name: "p5_sketch",
  strict: true,
  schema: {
    type: "object",
    strict: true,
    additionalProperties: false,
    required: ["code"],
    properties: {
      code: {
        type: "string",
        description:
          "Pure JavaScript p5.js sketch code. No markdown. Must include preload, setup, draw boilerplate. JS comments allowed."
      }
    }
  }
};

export { p5SketchSchema };

/**
 * Request a p5.js sketch from OpenRouter and return the raw JavaScript code.
 * @param question - User prompt describing the sketch.
 * @param currentCode - Existing code related to the user question.
 * @returns Raw JavaScript code from the model response.
 */
export async function requestOpenRouterCode(
  question: string,
  currentCode?: string,
): Promise<string> {
  const openRouter = await getOpenRouter();
  const messages: Array<{ role: "system" | "user"; content: string }> = [
    { role: "system", content: BASE_CONTEXT },
    { role: "user", content: question }
  ];

  if (typeof currentCode === "string" && currentCode.trim()) {
    messages.push({
      role: "user",
      content:
        "The question is about the attached current code. Use this code as context when responding.\n\nCurrent code:\n" +
        currentCode
    });
  }

  const response = await openRouter.chat.send({
    model: OPENROUTER_MODEL,
    temperature: 0,
    messages,
    responseFormat: {
      type: "json_schema",
      jsonSchema: p5SketchSchema
    }
  });

  const content = extractTextContent(response.choices?.[0]?.message?.content);
  if (!content) {
    throw new Error("No content returned from OpenRouter");
  }

  const parsed = extractCodeFromJson(content);
  if (!parsed) {
    throw new Error("No code returned from OpenRouter");
  }

  return parsed.trim();
}

/**
 * Lazily create a cached OpenRouter client with environment configuration.
 * @returns Cached OpenRouter client instance.
 */
async function getOpenRouter(): Promise<OpenRouterClient> {
  if (!openRouterPromise) {
    // conflict between vitest and typescript export
    if (process.env.NODE_ENV === "test") {
      openRouterPromise = import("@openrouter/sdk").then(({ OpenRouter }) => {
        return new OpenRouter({
          apiKey: OPENROUTER_API_KEY,
          xTitle: OPENROUTER_APP_TITLE
        });
      });
    } else {
      openRouterPromise = dynamicImport("@openrouter/sdk").then(({ OpenRouter }) => {
        return new OpenRouter({
          apiKey: OPENROUTER_API_KEY,
          xTitle: OPENROUTER_APP_TITLE
        });
      });
    }
  }

  return openRouterPromise;
}

export { getOpenRouter };

/**
 * Pull the "code" field from a JSON response string.
 * @param content - JSON string from OpenRouter.
 * @returns Extracted code or null when missing/invalid.
 */
function extractCodeFromJson(content: string): string | null {
  try {
    const parsed = JSON.parse(content) as { code?: unknown };
    return typeof parsed.code === "string" ? parsed.code : null;
  } catch {
    return null;
  }
}

export { extractCodeFromJson };

/**
 * Normalize OpenRouter message content into a single text string.
 * @param content - Response content in string or typed parts.
 * @returns Concatenated text or null when unavailable.
 */
function extractTextContent(
  content: string | Array<{ type?: string; text?: string }> | null | undefined
): string | null {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    const text = content
      .filter((item) => item?.type === "text" && typeof item.text === "string")
      .map((item) => item.text)
      .join("");
    return text || null;
  }

  return null;
}

export { extractTextContent };
