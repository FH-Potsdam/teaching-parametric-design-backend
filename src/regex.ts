import hljs from "highlight.js";
import {applyLanguagePlaceholders} from "./functionLinks";
import type {LanguageCode} from "./functionLinks";

const KEYWORD_LINKS: Record<string, string> = {
  let: "https://parametric-design.fh-potsdam.de/[LANG]/2d/03_1-variables/",
  const: "https://parametric-design.fh-potsdam.de/[LANG]/2d/03_1-variables/"
};

const ARRAY_LINK = "https://parametric-design.fh-potsdam.de/[LANG]/2d/05_1-variables/#arrays";

const FUNC_DEFS = [
  "preload", "setup", "draw", 
  "keyPressed", "keyReleased", "keyTyped", 
  "doubleClicked", "mouseButton", "mouseClicked", "mouseDragged", 
  "mouseMoved", "mousePressed", "mouseReleased", "mouseWheel"
];

const SPECIAL_KEYWORDS = ["mouseX", "mouseY", "keyIsPressed"];

/**
 * Linkify let/const keywords with language-specific docs.
 * @param code - Highlighted HTML source.
 * @param language - Language code for URLs.
 * @returns HTML with linked let/const keywords.
 */
function linkifyLetConst(code: string, language: LanguageCode = "en"): string {
  const regex = /<span class="hljs-keyword">(let|const)<\/span>/g;
  return code.replace(regex, (match, keyword) => {
    const url = KEYWORD_LINKS[keyword];
    return `<span class="hljs-keyword"><a href="${applyLanguagePlaceholders(url, language)}" data-func="${keyword}" data-root="true" target="_blank" rel="noopener noreferrer">${keyword}</a></span>`;
  });
}

export { linkifyLetConst };

/**
 * Linkify array literals while preserving nested arrays and strings.
 * @param code - Highlighted HTML source.
 * @param language - Language code for URLs.
 * @returns HTML with linked array literals.
 */
function linkifyArrays(code: string, language: LanguageCode = "en"): string {
  const tokenRegex =
    /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(<[^>]*>)|\[|\]/g;
  let output = "";
  let cursor = 0;
  let depth = 0;
  let arrayBuffer = "";

  while (true) {
    const match = tokenRegex.exec(code);
    if (!match) {
      break;
    }
    const token = match[0];
    const index = match.index;
    const isQuoted = Boolean(match[1]);
    const isComment = Boolean(match[2]);
    const isHtmlTag = Boolean(match[3]);
    const chunk = code.slice(cursor, index);

    if (depth > 0) {
      arrayBuffer += chunk;
    } else {
      output += chunk;
    }

    if (isQuoted || isComment || isHtmlTag) {
      if (depth > 0) {
        arrayBuffer += token;
      } else {
        output += token;
      }
      cursor = index + token.length;
      continue;
    }

    if (token === "[") {
      if (depth === 0) {
        arrayBuffer = "[";
      } else {
        arrayBuffer += "[";
      }
      depth += 1;
      cursor = index + 1;
      continue;
    }

    if (token === "]") {
      if (depth > 0) {
        depth -= 1;
        arrayBuffer += "]";
        if (depth === 0) {
          output += `<a href="${applyLanguagePlaceholders(ARRAY_LINK, language)}" data-func="Array-Bracket" data-root="true" target="_blank" rel="noopener noreferrer">${arrayBuffer}</a>`;
          arrayBuffer = "";
        }
      } else {
        output += "]";
      }
      cursor = index + 1;
      continue;
    }

    cursor = index + token.length;
  }

  const tail = code.slice(cursor);
  if (depth > 0) {
    arrayBuffer += tail;
    output += arrayBuffer;
  } else {
    output += tail;
  }
  return output;
}

export { linkifyArrays };
export type FunctionList = {[id: string]: {name: string, url: string, thumbnail: string | null}};
export type FunctionArray = {name: string, url: string, thumbnail: string | null}[];

/**
 * Linkify function call names and build the list of linked functions.
 * @param code - Highlighted HTML source.
 * @param ignoredNames - Callee names to skip.
 * @param functionLinks - Resolved function link list.
 * @returns Linkified HTML plus linked function metadata.
 */
function linkifyFunctionCalls(
  code: string,
  ignoredNames: string[],
  functionLinks: Array<{ name: string; url: string; root: boolean; thumbnail: string | null }>
): {code: string, functions: FunctionArray} {
  const functionList: FunctionList = {};
  const regex = /<span class="hljs-title function_">([A-Za-z_$][A-Za-z0-9_$]*)<\/span>/g;
  const ignored = new Set(ignoredNames);
  const rootLinkMap = new Map<string, { url: string; thumbnail: string | null }>();
  const nonRootLinkMap = new Map<string, { url: string; thumbnail: string | null }>();
  functionLinks.forEach((entry) => {
    if (entry.root) {
      rootLinkMap.set(entry.name, { url: entry.url, thumbnail: entry.thumbnail });
    } else {
      nonRootLinkMap.set(entry.name, { url: entry.url, thumbnail: entry.thumbnail });
    }
  });
  const linkifiedCode = code.replace(regex, (match, callee, offset, source) => {
    if (ignored.has(callee)) {
      return match;
    }
    if (!FUNC_DEFS.includes(callee) && isFunctionDefinition(source, offset)) {
      return match;
    }
    const hasLeadingDot = offset > 0 && source[offset - 1] === ".";
    const dataRoot = hasLeadingDot ? "false" : "true";
    const linkData = hasLeadingDot ? nonRootLinkMap.get("." + callee) : rootLinkMap.get(callee);
    const url = linkData?.url ?? "#";
    if (url !== "#" && !(callee in functionList)) {
      functionList[callee] = {
        name: callee,
        url,
        thumbnail: linkData?.thumbnail ?? null
      };
    }
    return `<span class="hljs-title function_"><a href="${url}" data-func="${callee}" data-root="${dataRoot}" target="_blank" rel="noopener noreferrer">${callee}</a></span>`;
  });
  //Transform Object to Array
  const functionListA: FunctionArray = [];
  Object.keys(functionList).forEach(key => {
    functionListA.push(functionList[key]);
  });

  return {code: linkifiedCode, functions: functionListA};
}

export { linkifyFunctionCalls };

/**
 * Linkify control-flow keywords when a matching entry exists.
 * @param code - Highlighted HTML source.
 * @param functionLinks - Resolved function link list.
 * @returns HTML with linked control-flow keywords.
 */
function linkifyControlKeywords(
  code: string,
  functionLinks: Array<{ name: string; url: string; root: boolean; thumbnail: string | null }>
): string {
  const keywordRegex = /<span class="hljs-keyword">(for|while|if)<\/span>/g;
  const keywordLinkMap = new Map<string, string>();
  functionLinks.forEach((entry) => {
    if (entry.root) {
      keywordLinkMap.set(entry.name, entry.url);
    }
  });
  return code.replace(keywordRegex, (match, keyword) => {
    const url = keywordLinkMap.get(keyword);
    if (!url) {
      return match;
    }
    return `<span class="hljs-keyword"><a href="${url}" data-func="${keyword}" data-root="true" target="_blank" rel="noopener noreferrer">${keyword}</a></span>`;
  });
}

export { linkifyControlKeywords };

/**
 * Linkify special runtime keywords like mouseX/mouseY when configured.
 * @param code - Highlighted HTML source.
 * @param functionLinks - Resolved function link list.
 * @returns HTML with linked runtime keywords.
 */
function linkifySpecialKeywords(
  code: string,
  functionLinks: Array<{ name: string; url: string; root: boolean; thumbnail: string | null }>
): string {
  const keywordLinkMap = new Map<string, string>();
  functionLinks.forEach((entry) => {
    if (entry.root) {
      keywordLinkMap.set(entry.name, entry.url);
    }
  });
  const keywordRegex = new RegExp(`\\b(${SPECIAL_KEYWORDS.join("|")})\\b`, "g");
  return code.replace(keywordRegex, (match, keyword) => {
    const url = keywordLinkMap.get(keyword);
    if (!url) {
      return match;
    }
    return `<a href="${url}" data-func="${keyword}" data-root="true" target="_blank" rel="noopener noreferrer">${keyword}</a>`;
  });
}

export { linkifySpecialKeywords };

const FUNCTION_KEYWORD_SPAN = '<span class="hljs-keyword">function</span>';

/**
 * Detect whether a highlighted identifier is part of a function definition.
 * @param source - Highlighted HTML source.
 * @param spanIndex - Index of the identifier span.
 * @returns True when the identifier appears in a function definition.
 */
function isFunctionDefinition(source: string, spanIndex: number): boolean {
  const keywordIndex = source.lastIndexOf(FUNCTION_KEYWORD_SPAN, spanIndex);
  if (keywordIndex === -1) {
    return false;
  }
  const between = source.slice(keywordIndex + FUNCTION_KEYWORD_SPAN.length, spanIndex);
  const visible = between.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ");
  return /^[\s*]*$/.test(visible);
}

export { isFunctionDefinition };

/**
 * Highlight JavaScript code and wrap it with pre/code tags.
 * @param code - Raw JavaScript source.
 * @returns Highlighted HTML string.
 */
function highlightJavaScript(code: string): string {
  const { value } = hljs.highlight(code, { language: "javascript" });
  return `<pre><code class="hljs language-javascript">${value}</code></pre>`;
}

export { highlightJavaScript };
