# Teaching Parametric Design Backend

An Express + TypeScript API that forwards code-generation prompts to the OpenRouter API, enforces a JavaScript-only context, and returns HTML-highlighted snippets with quick reference links.

## Setup

1. Copy `.env.example` to `.env` and provide your OpenRouter credentials.
2. Install dependencies (requires Node.js 18+ for the built-in `fetch` API):

```bash
npm install
```

## Scripts

- `npm run dev` — start the API in watch mode via `ts-node`.
- `npm run build` — compile TypeScript to `dist/`.
- `npm start` — run the compiled server from `dist/`.
- `npm test` — run the Vitest suite (uses JSDOM for HTML validation).

## API

`POST /api/generate`

Request body:

```json
{
  "question": "How do I animate a div on click?"
}
```

Behavior:
- Wraps the question with a system prompt that demands **only JavaScript code** (no Markdown).
- Sends the request to OpenRouter using the configured model.
- Highlights the returned JavaScript with `highlight.js` and converts selected function names into links to MDN.

Response body:

```json
{
  "html": "<pre><code class=\"hljs language-javascript\">…</code></pre>",
  "raw": "const sketch = ...",
  "functionCalls": ["createCanvas", "background", "console.log"]
}
```

## OpenAPI

See the OpenAPI 3.0 specification in `openapi.yaml`.

## Swagger UI

Build the static Swagger UI bundle into `docs-api/`:

```bash
npm run docs:api
```

When the server is running, visit `http://localhost:3000/docs/` to view the docs.

## Environment Variables

- `PORT` — API port (default: `3000`).
- `OPENROUTER_API_KEY` — required OpenRouter token.
- `OPENROUTER_MODEL` — model slug (default: `openai/gpt-4o-mini`).
- `OPENROUTER_SITE_URL` — value forwarded to OpenRouter `HTTP-Referer` header.
- `OPENROUTER_APP_TITLE` — value forwarded to OpenRouter `X-Title` header.

## Notes

- The service expects the OpenRouter API key to be present at runtime. Without it, requests will fail.
- Function references such as `fetch`, `console.log`, `document.querySelector`, and `addEventListener` are automatically linked to MDN in the generated HTML.
