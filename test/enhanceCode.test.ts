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

    expect(html.functions).toEqual(
      expect.arrayContaining([
        {
          name: "for",
          url: "https://parametric-design.fh-potsdam.de/en/2d/03_2-loops/#for-loop",
          thumbnail: "/images/thumbnails/en_2d_loops_for.png"
        },
        {
          name: "let",
          url: "https://parametric-design.fh-potsdam.de/en/2d/03_1-variables/",
          thumbnail: null
        },
        {
          name: "const",
          url: "https://parametric-design.fh-potsdam.de/en/2d/03_1-variables/",
          thumbnail: null
        },
        {
          name: "Array-Bracket",
          url: "https://parametric-design.fh-potsdam.de/en/2d/05_1-variables/#arrays",
          thumbnail: null
        }
      ])
    );
  });

  it("returns links for special runtime keywords in functionCalls", () => {
    const functionLinks = loadFunctionLinks("en");
    const code = "function draw() { const x = mouseX; if (keyIsPressed) { circle(mouseX, mouseY, 10); } }";
    const html = enhanceCode(code, functionLinks);

    expect(html.functions).toEqual(
      expect.arrayContaining([
        {
          name: "mouseX",
          url: "https://p5js.org/reference/p5/mouseX/",
          thumbnail: null
        },
        {
          name: "mouseY",
          url: "https://p5js.org/reference/p5/mouseY/",
          thumbnail: null
        },
        {
          name: "keyIsPressed",
          url: "https://p5js.org/reference/p5/keyIsPressed/",
          thumbnail: null
        }
      ])
    );
  });
});
