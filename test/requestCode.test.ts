import { beforeEach, describe, expect, it, vi } from "vitest";

const createMock = vi.fn();

vi.mock("openai", () => {
  class OpenAI {
    chat = { completions: { create: createMock } };
  }

  return { default: OpenAI };
});

describe("requestCode", () => {
  beforeEach(() => {
    createMock.mockReset();
    process.env.OPENAI_API_KEY = "test-key";
    vi.resetModules();
  });

  it("returns the parsed code from a JSON response", async () => {
    createMock.mockResolvedValue({
      choices: [{ message: { content: '{"code":"console.log(1);"}' } }]
    });

    const { requestCode } = await import("../src/requestCode");
    const code = await requestCode("hi");

    expect(code).toBe("console.log(1);");
  });

  it("accepts array-based text content", async () => {
    createMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: [{ type: "text", text: '{"code":"const x = 1;"}' }]
          }
        }
      ]
    });

    const { requestCode } = await import("../src/requestCode");
    const code = await requestCode("hi");

    expect(code).toBe("const x = 1;");
  });

  it("adds current code context when code is provided", async () => {
    createMock.mockResolvedValue({
      choices: [{ message: { content: '{"code":"console.log(2);"}' } }]
    });

    const { requestCode } = await import("../src/requestCode");
    await requestCode("change this", "function draw() { background(0); }");

    expect(createMock).toHaveBeenCalledTimes(1);
    const requestPayload = createMock.mock.calls[0]?.[0];
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
