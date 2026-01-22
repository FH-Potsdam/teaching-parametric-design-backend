import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";

import { enhanceCode } from "../src/enhanceCode";
import { loadFunctionLinks } from "../src/functionLinks";
import { rawCode } from "./fixtures/codeSamples";

describe("enhanceCode", () => {
  it("converts JavaScript into highlighted HTML with linked functions", () => {
    const functionLinks = loadFunctionLinks("en");
    const html = enhanceCode(rawCode, functionLinks);

    const dom = new JSDOM(html.code);
    const document = dom.window.document;

    const codeElement = document.querySelector("pre > code.hljs.language-javascript");
    expect(codeElement).not.toBeNull();
    expect(codeElement?.textContent).toContain("createCanvas(400, 400)");

    const expectedFunctions = [
      "createCanvas",
      "background",
      "push",
      "noStroke",
      "fill",
      "cos",
      "sin",
      "circle"
    ];

    expectedFunctions.forEach((name) => {
      const link = document.querySelector(`a[data-func="${name}"]`);
      expect(link?.textContent).toBe(name);
    });

    const links = document.querySelectorAll("a[href]");
    links.forEach((link) => {
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    });
  });
});
