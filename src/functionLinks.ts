import fs from "fs";
import path from "path";

export type MozillaEntry = { name: string; url: string, root: boolean };
export type P5Entry = { name: string; url: string, root: boolean };
export type ParametricEntry = { name: string; root: boolean; url: string | Record<string, string> };
export type LanguageCode = "en" | "de";

export const DEFAULT_LANGUAGE: LanguageCode = "en";
export type FunctionLinks = Record<string, { url: string; root: boolean }>;

/**
 * Build the function link map from bundled JSON sources.
 * @param language - Language code for URLs.
 * @returns Map of function names to link metadata.
 */
export function loadFunctionLinks(language: LanguageCode = "en"): FunctionLinks {
  const functionLinks: FunctionLinks = {};
  const mdnBaseTemplate = "https://developer.mozilla.org/[LANGLANG]/docs/Web/";
  const p5Base = "https://p5js.org/";
  const parametricBaseTemplate = "https://parametric-design.fh-potsdam.de/[LANG]/";
  const mdnBase = applyLanguagePlaceholders(mdnBaseTemplate, language);
  const parametricBase = applyLanguagePlaceholders(parametricBaseTemplate, language);

  const parametricEntries = readJsonFile<ParametricEntry[]>("data/parametric.json");
  const p5Entries = readJsonFile<P5Entry[]>("data/p5js.json");
  const mozillaEntries = readJsonFile<MozillaEntry[]>("data/mozilla.json");

  for (const entry of parametricEntries) {
    const resolved = resolveParametricUrl(entry.url, language);
    if (!resolved) {
      continue;
    }
    functionLinks[("root" in entry && entry.root === false) ? "." + entry.name : entry.name] = {
      url: joinUrl(parametricBase, resolved),
      root: ("root" in entry) ? entry.root : true
    };
  }

  for (const entry of p5Entries) {
    if (functionLinks[entry.name]) {
      continue;
    }
    functionLinks[entry.name] = {
      url: joinUrl(p5Base, entry.url),
      root: true
    };
  }

  for (const entry of mozillaEntries) {
    const functionName = ("root" in entry && entry.root === true) ? entry.name : "." + entry.name;
    if (functionLinks[functionName]) {
      continue;
    }
    functionLinks[functionName] = {
      url: joinUrl(mdnBase, entry.url),
      root: ("root" in entry) ? entry.root : false
    };
  }

  return functionLinks;
}

/**
 * Coerce arbitrary input to a supported language code.
 * @param value - Candidate language value.
 * @returns Supported language code.
 */
export function resolveLanguage(value: unknown): LanguageCode {
  return value === "de" ? "de" : "en";
}

/**
 * Resolve localized URLs, falling back across available languages.
 * @param url - URL string or per-language map.
 * @param lang - Target language code.
 * @returns Resolved URL or undefined when missing.
 */
function resolveParametricUrl(
  url: string | Record<string, string>,
  lang: LanguageCode
): string | undefined {
  if (typeof url === "string") {
    return url;
  }
  return url[lang] ?? url.en ?? url.de ?? Object.values(url)[0];
}

export { resolveParametricUrl };

/**
 * Replace language placeholders in URL templates.
 * @param template - URL template containing placeholders.
 * @param language - Language code for replacement.
 * @returns Resolved URL string.
 */
export function applyLanguagePlaceholders(template: string, language: LanguageCode): string {
  const lang = language;
  const langLang = language === "de" ? "de" : "en-US";
  return template.replace(/\[LANG\]/g, lang).replace(/\[LANGLANG\]/g, langLang);
}

/**
 * Read a JSON file from the project root.
 * @param relativePath - Path relative to the project root.
 * @returns Parsed JSON content.
 */
function readJsonFile<T>(relativePath: string): T {
  const absolutePath = path.join(process.cwd(), relativePath);
  return JSON.parse(fs.readFileSync(absolutePath, "utf8")) as T;
}

export { readJsonFile };

/**
 * Join base and path while preserving a single slash.
 * @param base - Base URL.
 * @param pathPart - URL path segment.
 * @returns Joined URL string.
 */
function joinUrl(base: string, pathPart: string): string {
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  return normalizedBase + pathPart.replace(/^\/+/, "");
}

export { joinUrl };
