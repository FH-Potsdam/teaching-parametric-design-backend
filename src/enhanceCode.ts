import {
  highlightJavaScript,
  linkifyControlKeywords,
  linkifyFunctionCalls,
  linkifyLetConst,
  linkifyArrays,
  linkifySpecialKeywords
} from "./regex";
import type {FunctionLinks, LanguageCode} from "./functionLinks";

export type MappedFunctionLink = { name: string; url: string; root: boolean; };

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
  return linkifiedFunctions;
}

/**
 * Normalize function links for lookups during linkification.
 * @param functionLinks - Function link map keyed by name.
 * @returns Normalized array of link entries.
 */
function mapFunctionLinks(functionLinks: FunctionLinks): MappedFunctionLink[] {
  return Object.entries(functionLinks).map(([fullName, data]) => {
    return { name: fullName, url: data.url, root: data.root };
  });
}

export { mapFunctionLinks };

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
