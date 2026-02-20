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

  it("adds current code context when code is provided", async () => {
    sendMock.mockResolvedValue({
      choices: [{ message: { content: '{"code":"console.log(2);"}' } }]
    });

    const { requestOpenRouterCode } = await import("../src/openRouter");
    await requestOpenRouterCode("change this", "function draw() { background(0); }");

    expect(sendMock).toHaveBeenCalledTimes(1);
    const requestPayload = sendMock.mock.calls[0]?.[0];
    expect(requestPayload.messages).toHaveLength(3);
    expect(requestPayload.messages[2]).toMatchObject({
      role: "user"
    });
    expect(requestPayload.messages[2].content).toContain(
      "The question is about the attached current code.",
    );
    expect(requestPayload.messages[2].content).toContain("function draw() { background(0); }");
  });
});
