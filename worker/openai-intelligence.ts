import type { LeadIntelligence } from "../src/application/contracts";
import type { Classification, Lead } from "../src/domain/lead";

interface OpenAIResponse {
  output_text?: string;
  output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
}

export class OpenAIIntelligence implements LeadIntelligence {
  readonly name = "OpenAI Responses API";

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async classify(lead: Lead): Promise<Classification> {
    return this.request<Classification>(
      "relay_classification",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          fit: { type: "string", enum: ["low", "medium", "high"] },
          urgency: { type: "string", enum: ["low", "medium", "high"] },
          value: { type: "string", enum: ["low", "medium", "high"] },
          score: { type: "integer", minimum: 0, maximum: 100 },
          owner: { type: "string", enum: ["Growth", "Strategy", "General"] },
          summary: { type: "string" },
          reasons: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          provider: { type: "string", enum: [this.name] },
        },
        required: ["fit", "urgency", "value", "score", "owner", "summary", "reasons", "confidence", "provider"],
      },
      `Classify this agency lead conservatively. Do not invent facts.\n${JSON.stringify({ name: lead.name, company: lead.company, message: lead.message, source: lead.source })}`,
    );
  }

  async draft(lead: Lead) {
    return this.request<{ subject: string; body: string; provider: string }>(
      "relay_draft",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          subject: { type: "string" },
          body: { type: "string" },
          provider: { type: "string", enum: [this.name] },
        },
        required: ["subject", "body", "provider"],
      },
      `Draft a concise, warm follow-up. Ask for a 30-minute discovery call. Do not claim an email was sent.\n${JSON.stringify({ lead, classification: lead.classification })}`,
    );
  }

  private async request<T>(name: string, schema: object, input: string): Promise<T> {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        instructions: "You are Relay's lead-intelligence component. Return only schema-compliant data.",
        input,
        store: false,
        max_output_tokens: 700,
        text: { format: { type: "json_schema", name, strict: true, schema } },
      }),
    });

    if (!response.ok) throw new Error(`OpenAI request failed with status ${response.status}.`);
    const payload = (await response.json()) as OpenAIResponse;
    const text = payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")?.text;
    if (!text) throw new Error("OpenAI returned no structured output.");
    return JSON.parse(text) as T;
  }
}

