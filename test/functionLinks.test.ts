import { describe, expect, it } from "vitest";

import { loadFunctionLinks, resolveLanguage } from "../src/functionLinks";

describe("loadFunctionLinks", () => {
  it("applies English placeholders for MDN and parametric links", () => {
    const links = loadFunctionLinks("en");

    expect(links.eval).toEqual({
      url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval",
      root: true,
      thumbnail: null
    });
    expect(links[".log"]).toEqual({
      url: "https://parametric-design.fh-potsdam.de/en/2d/01-intro/#debugging",
      root: false,
      thumbnail: "/images/thumbnails/en_2d_intro_debug.png"
    });
    expect(links.draw).toEqual({
      url: "https://parametric-design.fh-potsdam.de/en/2d/01-intro/#sketch",
      root: true,
      thumbnail: "/images/thumbnails/en_2d_intro_sketch.png"
    });
    expect(links.arc).toEqual({
      url: "https://parametric-design.fh-potsdam.de/en/2d/02_1-drawing/#arcs",
      root: true,
      thumbnail: "/images/thumbnails/en_2d_drawing_arc.png"
    });
    expect(links[".push"]).toEqual({
      url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push",
      root: false,
      thumbnail: null
    });
  });

  it("applies German placeholders for MDN and parametric links", () => {
    const links = loadFunctionLinks("de");

    expect(links.eval).toEqual({
      url: "https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/eval",
      root: true,
      thumbnail: null
    });
    expect(links[".log"]).toEqual({
      url: "https://parametric-design.fh-potsdam.de/de/2d/01-intro/#debugging",
      root: false,
      thumbnail: "/images/thumbnails/de_2d_intro_debug.png"
    });
    expect(links.draw).toEqual({
      url: "https://parametric-design.fh-potsdam.de/de/2d/01-intro/#sketch",
      root: true,
      thumbnail: "/images/thumbnails/de_2d_intro_sketch.png"
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
