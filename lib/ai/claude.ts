import Anthropic from "@anthropic-ai/sdk";

export class ClaudeAPIError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "ClaudeAPIError";
  }

  get isRetryable(): boolean {
    return this.statusCode >= 500;
  }
}

export async function callClaude(
  apiKey: string,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const client = new Anthropic({ apiKey });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await client.messages.create(
      {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      },
      { signal: controller.signal }
    );

    const block = response.content[0];
    if (block.type === "text") {
      return block.text;
    }

    throw new ClaudeAPIError(500, "Unexpected response content type");
  } catch (error: unknown) {
    if (error instanceof ClaudeAPIError) {
      throw error;
    }

    if (error instanceof Anthropic.APIError) {
      const status = error.status;
      if (status === 401) {
        throw new ClaudeAPIError(401, "Invalid API key");
      }
      if (status === 429) {
        throw new ClaudeAPIError(429, "Rate limit exceeded");
      }
      throw new ClaudeAPIError(status, error.message);
    }

    if (
      error instanceof DOMException &&
      error.name === "AbortError"
    ) {
      throw new ClaudeAPIError(408, "Request timed out (30s)");
    }

    // AbortController in Node may throw a different error type
    if (
      error instanceof Error &&
      error.name === "AbortError"
    ) {
      throw new ClaudeAPIError(408, "Request timed out (30s)");
    }

    throw new ClaudeAPIError(
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  } finally {
    clearTimeout(timeout);
  }
}
