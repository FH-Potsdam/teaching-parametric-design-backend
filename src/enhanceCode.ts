import {
  highlightJavaScript,
  linkifyControlKeywords,
  linkifyFunctionCalls,
  linkifyLetConst,
  linkifyArrays,
  linkifySpecialKeywords
} from "./regex";
import type {FunctionLinks, LanguageCode} from "./functionLinks";

export type MappedFunctionLink = { name: string; url: string; root: boolean; thumbnail: string | null; };

import type {FunctionArray} from "./regex";

/**
 * Convert generated code into syntax-highlighted HTML and linkify known constructs.
 * @param code - Raw JavaScript source.
 * @param functionLinks - Resolved function link map.
 * @param language - Language code for URLs.
 * @returns Linkified HTML plus linked function metadata.
 */
export function enhanceCode(
  code: string,
  functionLinks: FunctionLinks,
  language: LanguageCode = "en"
): {code: string, functions: FunctionArray} {
  if (!isPureJS(code)) {
    throw new Error("Model violated pure JS constraint");
  }
  let highlighted = highlightJavaScript(code);
  highlighted = linkifyLetConst(highlighted, language);
  highlighted = linkifyArrays(highlighted, language);
  const mappedFunctionLinks = mapFunctionLinks(functionLinks);
  highlighted = linkifyControlKeywords(highlighted, mappedFunctionLinks);
  highlighted = linkifySpecialKeywords(highlighted, mappedFunctionLinks);
  const linkifiedFunctions = linkifyFunctionCalls(highlighted, [], mappedFunctionLinks);
  return {
    code: linkifiedFunctions.code,
    functions: collectLinkedFunctions(linkifiedFunctions.code, mappedFunctionLinks)
  };
}

/**
 * Normalize function links for lookups during linkification.
 * @param functionLinks - Function link map keyed by name.
 * @returns Normalized array of link entries.
 */
function mapFunctionLinks(functionLinks: FunctionLinks): MappedFunctionLink[] {
  return Object.entries(functionLinks).map(([fullName, data]) => {
    return { name: fullName, url: data.url, root: data.root, thumbnail: data.thumbnail };
  });
}

export { mapFunctionLinks };

/**
 * Collect linked entries from all `data-func` anchors in highlighted output.
 * @param code - Linkified highlighted HTML source.
 * @param functionLinks - Normalized function links.
 * @returns Deduplicated linked functions with thumbnail metadata.
 */
function collectLinkedFunctions(
  code: string,
  functionLinks: MappedFunctionLink[]
): FunctionArray {
  const functionListByName = new Map<string, {name: string; url: string; thumbnail: string | null;}>();
  const thumbnailMap = new Map<string, string | null>();
  functionLinks.forEach((entry) => {
    thumbnailMap.set(entry.name, entry.thumbnail);
  });

  const anchorRegex = /<a\b[^>]*>/g;
  let anchorMatch: RegExpExecArray | null = anchorRegex.exec(code);
  while (anchorMatch) {
    const anchorTag = anchorMatch[0];
    const name = anchorTag.match(/\sdata-func="([^"]+)"/)?.[1];
    const url = anchorTag.match(/\shref="([^"]+)"/)?.[1];
    const root = anchorTag.match(/\sdata-root="([^"]+)"/)?.[1];

    if (!name || !url || url === "#") {
      anchorMatch = anchorRegex.exec(code);
      continue;
    }

    let thumbnail: string | null = null;
    if (root === "false") {
      thumbnail = thumbnailMap.get(`.${name}`) ?? null;
    } else if (root === "true") {
      thumbnail = thumbnailMap.get(name) ?? null;
    } else {
      thumbnail = thumbnailMap.get(name) ?? thumbnailMap.get(`.${name}`) ?? null;
    }

    if (!functionListByName.has(name)) {
      functionListByName.set(name, { name, url, thumbnail });
    }

    anchorMatch = anchorRegex.exec(code);
  }

  return Array.from(functionListByName.values());
}

export { collectLinkedFunctions };

/**
 * Check whether the model output looks like pure JavaScript without wrappers.
 * @param output - Model output string.
 * @returns True when the output appears to be pure JavaScript.
 */
function isPureJS(output: string): boolean {
  return (
    !output.includes("```") &&
    !/^[\s\n]*(Here|Sure|This|Below|Explanation)/i.test(output)
  );
}

export { isPureJS };
