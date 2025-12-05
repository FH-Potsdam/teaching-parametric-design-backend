import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";

import { enhanceCode, FUNCTION_LINKS } from "../src/index";

const SAMPLE_JS = "const message = 'Hello'; console.log(message);";

describe("enhanceCode", () => {
  it("converts JavaScript into highlighted HTML with linked functions", () => {
    const html = enhanceCode(SAMPLE_JS);

    const dom = new JSDOM(html);
    const document = dom.window.document;

    const codeElement = document.querySelector("pre > code.hljs.language-javascript");
    expect(codeElement).not.toBeNull();
    expect(codeElement?.textContent).toContain("const message");

    const consoleLink = document.querySelector(
      `a[href="${FUNCTION_LINKS["console.log"]}"]`
    );
    expect(consoleLink?.textContent).toBe("console.log");

    const links = document.querySelectorAll("a[href]");
    links.forEach((link) => {
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    });
  });
});
