import { afterEach, describe, expect, it, vi } from "vitest";
import { createLead } from "../src/domain/lead";
import { OpenAIIntelligence } from "../worker/openai-intelligence";

afterEach(() => vi.unstubAllGlobals());

describe("OpenAIIntelligence", () => {
  it("uses bounded, non-persistent structured responses", async () => {
    const classification = {
      fit: "high", urgency: "medium", value: "high", score: 82, owner: "Strategy",
      summary: "A good-fit automation inquiry.", reasons: ["Clear scope", "Budget signal"],
      confidence: 0.86, provider: "OpenAI Responses API",
    };
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ output_text: JSON.stringify(classification) }));
    vi.stubGlobal("fetch", fetchMock);

    const provider = new OpenAIIntelligence("server-secret", "gpt-5-nano");
    const result = await provider.classify(createLead({ name: "Maya", email: "m@example.com", company: "Northstar", message: "Automation project" }, "2026-08-24T12:00:00Z", "lead-1"));

    expect(result.score).toBe(82);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as { store: boolean; max_output_tokens: number; text: { format: { type: string; strict: boolean } } };
    expect(init.headers).toMatchObject({ Authorization: "Bearer server-secret" });
    expect(body.store).toBe(false);
    expect(body.max_output_tokens).toBe(700);
    expect(body.text.format).toMatchObject({ type: "json_schema", strict: true });
  });
});

