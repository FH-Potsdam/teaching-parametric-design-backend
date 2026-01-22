import { describe, expect, it } from "vitest";

import {
  highlightJavaScript,
  linkifyArrays,
  linkifyControlKeywords,
  linkifyFunctionCalls,
  linkifyLetConst,
  linkifySpecialKeywords
} from "../src/regex";

import { highlightJSCode } from "./fixtures/codeSamples";

function countOccurrences(haystack: string, needle: string): number {
  if (needle.length === 0) return 0;
  return haystack.split(needle).length - 1;
}

describe("linkifyLetConst", () => {
  it("links let/const outside strings and comments", () => {
    const input = highlightJSCode;
    const output = linkifyLetConst(input);

    const countConst = countOccurrences(output, '<a href="https://parametric-design.fh-potsdam.de/en/2d/03_1-variables/" target="_blank" rel="noopener noreferrer">const</a>');
    expect(countConst).toBe(10);
    const countLet = countOccurrences(output, '<a href="https://parametric-design.fh-potsdam.de/en/2d/03_1-variables/" target="_blank" rel="noopener noreferrer">let</a>');
    expect(countLet).toBe(3);

    expect(output).toContain(
      '<a href="https://parametric-design.fh-potsdam.de/en/2d/03_1-variables/" target="_blank" rel="noopener noreferrer">let</a>'
    );

    expect(output).toContain(
      '<a href="https://parametric-design.fh-potsdam.de/en/2d/03_1-variables/" target="_blank" rel="noopener noreferrer">const</a>'
    );
  });
});

describe("linkifyFunctionCalls", () => {
  it("links function_ spans and skips function definitions", () => {
    const output = linkifyFunctionCalls(highlightJSCode, [], [
      { name: "createCanvas", url: "https://demo.com/createCanvas", root: true },
      { name: "background", url: "https://demo.com/background", root: true },
      { name: ".push", url: "https://demo.com/push", root: false }
    ]);

    expect(output.code).toContain(
      '<a href="https://demo.com/createCanvas" data-func="createCanvas" data-root="true" target="_blank" rel="noopener noreferrer">createCanvas</a>'
    );
    expect(output.code).toContain(
      '<a href="https://demo.com/background" data-func="background" data-root="true" target="_blank" rel="noopener noreferrer">background</a>'
    );
    expect(output.code).toContain(
      '<a href="https://demo.com/push" data-func="push" data-root="false" target="_blank" rel="noopener noreferrer">push</a>'
    );
    expect(output.code).toContain(
      '<span class="hljs-keyword">function</span> <span class="hljs-title function_">newFunction</span>'
    );
  });
});

describe("linkifyArrays", () => {
  it("links arrays while preserving nested HTML tags inside code blocks", () => {
    const input = highlightJSCode;
    const output = linkifyArrays(input);

    expect(output).toContain(
      '<a href="https://parametric-design.fh-potsdam.de/en/2d/05_1-variables/#arrays" data-func="Array-Bracket" target="_blank" rel="noopener noreferrer">[]</a>'
    );
    expect(output).toContain(
      '<a href="https://parametric-design.fh-potsdam.de/en/2d/05_1-variables/#arrays" data-func="Array-Bracket" target="_blank" rel="noopener noreferrer">[i]</a>'
    );
    expect(output).toContain(
      '<a href="https://parametric-design.fh-potsdam.de/en/2d/05_1-variables/#arrays" data-func="Array-Bracket" target="_blank" rel="noopener noreferrer">[<span class="hljs-number">1</span>]</a>'
    );
  });
});

describe("linkifyControlKeywords", () => {
  it("links for/while/if keyword spans with matching function links", () => {
    const input = highlightJSCode;
    const output = linkifyControlKeywords(input, [
      { name: "for", url: "https://demo.com/for", root: true },
      { name: "if", url: "https://demo.com/if", root: true }
    ]);

    expect(output).toContain(
      '<a href="https://demo.com/for" data-func="for" data-root="true" target="_blank" rel="noopener noreferrer">for</a>'
    );

  });
});

describe("linkifySpecialKeywords", () => {
  it("links configured keywords with matching root links", () => {
    const input = `let x = mouseX; const y = mouseY; if (keyIsPressed) { console.log("hello"); }`;
    const output = linkifySpecialKeywords(input, [
      { name: "mouseX", url: "https://demo.com/mouseX", root: true },
      { name: "mouseY", url: "https://demo.com/mouseY", root: true },
      { name: "keyIsPressed", url: "https://demo.com/keyIsPressed", root: true }
    ]);

    expect(output).toContain(
      '<a href="https://demo.com/mouseX" data-func="mouseX" data-root="true" target="_blank" rel="noopener noreferrer">mouseX</a>'
    );
    expect(output).toContain(
      '<a href="https://demo.com/mouseY" data-func="mouseY" data-root="true" target="_blank" rel="noopener noreferrer">mouseY</a>'
    );
    expect(output).toContain(
      '<a href="https://demo.com/keyIsPressed" data-func="keyIsPressed" data-root="true" target="_blank" rel="noopener noreferrer">keyIsPressed</a>'
    );
  });
});

describe("highlightJavaScript", () => {
  it("wraps highlighted code in a pre/code block", () => {
    const html = highlightJavaScript("const value = 1;");
    expect(html).toContain('<pre><code class="hljs language-javascript">');
  });
});
