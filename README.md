# Teaching Parametric Design Backend

An Express + TypeScript API that forwards code-generation prompts to an OpenAI-compatible API, enforces a JavaScript-only context, and returns HTML-highlighted snippets with quick reference links.

## Setup

1. Copy `.env.example` to `.env` and provide your API credentials.
2. Install dependencies (requires Node.js 18+ for the built-in `fetch` API):

```bash
npm install
```

## Scripts

- `npm run dev` — start the API in watch mode via `ts-node`.
- `npm run build` — compile TypeScript to `dist/`.
- `npm start` — run the compiled server from `dist/`.
- `npm test` — run the Vitest suite (uses JSDOM for HTML validation).
- `npm run docs` — generate TypeDoc output in `docs/code/`.
- `npm run docs:api` — build the Swagger UI bundle into `docs/api/`.
- `npm run logs:decrypt` — decrypt encrypted logs from `logs/` into `logs-decrypted/`.

## API

`POST /api/generate`

Request body:

```json
{
  "question": "How do I animate a div on click?",
  "language": "en"
}
```

Behavior:
- Supports `language: "en" | "de"` (defaults to English) for localized links.
- Wraps the question with a system prompt that demands **only JavaScript code** (no Markdown).
- Sends the request to `https://api.deutschlandgpt.de/v1` using the configured model.
- Highlights the returned JavaScript with `highlight.js` and converts selected function names into links.

Response body:

```json
{
  "html": "<pre><code class=\"hljs language-javascript\">…</code></pre>",
  "raw": "const sketch = ...",
  "functionCalls": [
    {
      "name": "createCanvas",
      "url": "https://parametric-design.fh-potsdam.de/en/2d/02_1-drawing/#canvas",
      "thumbnail": "/images/thumbnails/en_2d_drawing_canvas.png"
    },
    {
      "name": "max",
      "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/max",
      "thumbnail": null
    }
  ]
}
```

`POST /api/linkify`

Request body:

```json
{
  "code": "const el = document.querySelector('.box');",
  "language": "en"
}
```

Behavior:
- Skips model generation and linkifies the provided code directly.
- Returns highlighted HTML plus the extracted function link metadata.

Response body: same shape as `/api/generate`.

`GET /api/ping`

Returns `pong` as a quick health check.

## OpenAPI

See the OpenAPI 3.0 specification in `openapi.yaml`.

## Logging

The `/api/generate` endpoint writes an AES-256-GCM encrypted log entry to `logs/` that includes the user question, the generated response payload, and a timestamp. The log does not include any user-identifying information or client metadata. Encrypted files are stored with the `.json.enc` extension and require `LOG_ENCRYPTION_KEY` to decrypt.

Decrypt all encrypted logs with the default directories:

```bash
npm run logs:decrypt
```

Decrypt from a custom input and output directory:

```bash
node scripts/decryptLogs.js ./logs ./logs-decrypted
```

## Swagger UI

Build the static Swagger UI bundle into `docs/api/`:

```bash
npm run docs:api
```

When the server is running, visit `http://localhost:3000/docs/` to view the docs (ensure the server is pointing at the Swagger output directory).

## Code Docs

Generate the TypeDoc documentation into `docs/code/`:

```bash
npm run docs
```

## Environment Variables

- `PORT` — API port (default: `3000`).
- `OPENAI_API_KEY` — required API token for the OpenAI-compatible endpoint.
- `OPENAI_MODEL` — model slug (default: `gpt-4o-mini`).
- `LOG_ENCRYPTION_KEY` — required 256-bit encryption key for logs (`base64`-encoded 32-byte value or 64-char hex).
- `OPENAI_BASE_URL` — URL to cloud endpoint for llm interface (does not need to be OpenAI, e.g. Open Router, etc.)

## Notes

- The service expects `OPENAI_API_KEY` to be present at runtime. Without it, requests will fail.
- Function references are linked against MDN, p5.js, and Parametric Design references (localized when available).
