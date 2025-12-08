import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";

import { enhanceCode, FUNCTION_LINKS } from "../src/index";

const SAMPLE_JS = "const message = 'Hello'; console.log(message);";

describe("enhanceCode", () => {
  it("converts JavaScript into highlighted HTML with linked functions", () => {
    const { html, links } = enhanceCode(SAMPLE_JS);

    const dom = new JSDOM(html);
    const document = dom.window.document;

    const codeElement = document.querySelector("pre > code.hljs.language-javascript");
    expect(codeElement).not.toBeNull();
    expect(codeElement?.textContent).toContain("const message");

    const consoleLink = document.querySelector(
      `a[href="${FUNCTION_LINKS["console.log"]}"]`
    );
    expect(consoleLink?.textContent).toBe("console.log");

    const anchorElements = document.querySelectorAll("a[href]");
    anchorElements.forEach((link) => {
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    });

    expect(links).toContainEqual({ function: "console.log", url: FUNCTION_LINKS["console.log"] });
  });

  it("adds custom function links alongside MDN defaults", () => {
    const { html, links } = enhanceCode("customUtility();", { customUtility: "https://example.com/custom" });

    const dom = new JSDOM(html);
    const customLink = dom.window.document.querySelector('a[href="https://example.com/custom"]');

    expect(customLink?.textContent).toBe("customUtility");
    expect(links).toContainEqual({ function: "customUtility", url: "https://example.com/custom" });
    expect(links).toContainEqual({ function: "console.log", url: FUNCTION_LINKS["console.log"] });
  });
});
