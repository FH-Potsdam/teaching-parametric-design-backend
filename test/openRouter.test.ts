import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.fn();

vi.mock("@openrouter/sdk", () => {
  class OpenRouter {
    chat = { send: sendMock };
  }

  return { OpenRouter, __sendMock: sendMock };
});

describe("requestOpenRouterCode", () => {
  beforeEach(() => {
    sendMock.mockReset();
    process.env.OPENROUTER_API_KEY = "test-key";
    vi.resetModules();
  });

  it("returns the parsed code from a JSON response", async () => {
    sendMock.mockResolvedValue({
      choices: [{ message: { content: '{"code":"console.log(1);"}' } }]
    });

    const { requestOpenRouterCode } = await import("../src/openRouter");
    const code = await requestOpenRouterCode("hi");

    expect(code).toBe("console.log(1);");
  });

  it("accepts array-based text content", async () => {
    sendMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: [{ type: "text", text: '{"code":"const x = 1;"}' }]
          }
        }
      ]
    });

    const { requestOpenRouterCode } = await import("../src/openRouter");
    const code = await requestOpenRouterCode("hi");

    expect(code).toBe("const x = 1;");
  });
});
