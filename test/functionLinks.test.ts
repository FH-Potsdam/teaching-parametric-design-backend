import { describe, expect, it } from "vitest";

import { loadFunctionLinks, resolveLanguage } from "../src/functionLinks";

describe("loadFunctionLinks", () => {
  it("applies English placeholders for MDN and parametric links", () => {
    const links = loadFunctionLinks("en");

    expect(links.eval).toEqual({
      url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval",
      root: true
    });
    expect(links[".log"]).toEqual({
      url: "https://parametric-design.fh-potsdam.de/en/2d/01-intro/#debugging",
      root: false
    });
    expect(links.draw).toEqual({
      url: "https://parametric-design.fh-potsdam.de/en/2d/01-intro/#sketch",
      root: true
    });
    expect(links.arc).toEqual({
      url: "https://parametric-design.fh-potsdam.de/en/2d/02_1-drawing/#arcs",
      root: true
    });
    expect(links[".push"]).toEqual({
      url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push",
      root: false
    });
  });

  it("applies German placeholders for MDN and parametric links", () => {
    const links = loadFunctionLinks("de");

    expect(links.eval).toEqual({
      url: "https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/eval",
      root: true
    });
    expect(links[".log"]).toEqual({
      url: "https://parametric-design.fh-potsdam.de/de/2d/01-intro/#debugging",
      root: false
    });
    expect(links.draw).toEqual({
      url: "https://parametric-design.fh-potsdam.de/de/2d/01-intro/#sketch",
      root: true
    });
  });
});

describe("resolveLanguage", () => {
  it("defaults to English for unknown values", () => {
    expect(resolveLanguage(undefined)).toBe("en");
    expect(resolveLanguage("fr")).toBe("en");
  });

  it("returns German when requested", () => {
    expect(resolveLanguage("de")).toBe("de");
  });
});
