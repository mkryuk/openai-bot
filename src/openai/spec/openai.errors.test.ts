import { inspect } from "util";
import { OpenAi } from "../openai";

describe("OpenAI credential protection", () => {
  const token = "test-private-token";
  let client: OpenAi;
  let rawError: any;
  let logError: jest.SpyInstance;

  beforeEach(() => {
    client = new OpenAi(token);
    rawError = Object.assign(new Error(`Request failed with Bearer ${token}`), {
      code: "ERR_BAD_REQUEST",
      config: { headers: { Authorization: `Bearer ${token}` } },
      request: { _header: `Authorization: Bearer ${token}` },
      cause: new Error(token),
      response: {
        status: 401,
        statusText: "Unauthorized",
        headers: { "x-debug": token },
        config: { headers: { Authorization: `Bearer ${token}` } },
        data: {
          error: { message: `Invalid API key: ${token}` },
          debug: token,
        },
      },
    });
    jest.spyOn(client["httpClient"], "post").mockRejectedValue(rawError);
    jest.spyOn(client["httpClient"], "get").mockRejectedValue(rawError);
    logError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it.each(["chat", "vision", "draw", "models", "variations"])(
    "removes credentials before a %s error reaches its caller",
    async (operation) => {
      client.addImageHistory(1, "https://example.invalid/image.png", "cat");
      const requests: Record<string, () => Promise<unknown>> = {
        chat: () => client.getChatCompletions("hello"),
        vision: () =>
          client.handleImageVision("https://example.invalid/a.png", "hello"),
        draw: () => client.draw("cat"),
        models: () => client.getModelsList(),
        variations: () => client.drawVariations(1),
      };
      const error: any = await requests[operation]().catch((error) => error);

      expect(error).toBeInstanceOf(Error);
      expect(error).not.toBe(rawError);
      expect(error.code).toBe("ERR_BAD_REQUEST");
      expect(error.response.status).toBe(401);
      expect(error.response.data.error.message).toBe(
        "Invalid API key: [REDACTED]",
      );
      expect(error.config).toBeUndefined();
      expect(error.request).toBeUndefined();
      expect(error.cause).toBeUndefined();
      expect(error.response.headers).toBeUndefined();
      expect(error.response.config).toBeUndefined();
      // Simulate the caller logging the thrown error, including its stack.
      console.error("Caller:", error);
      expect(inspect(logError.mock.calls, { depth: null })).not.toContain(
        token,
      );
    },
  );

  it("keeps useful network error information without the original request", async () => {
    jest.spyOn(client["httpClient"], "get").mockRejectedValueOnce({
      message: "Network Error",
      code: "ECONNRESET",
      request: { authorization: token },
    });

    await expect(client.getModelsList()).rejects.toMatchObject({
      message: "Network Error",
      code: "ECONNRESET",
      response: undefined,
    });
  });
});
