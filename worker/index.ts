import { RelayService } from "../src/application/relay-service";
import { DomainError, type LeadInput } from "../src/domain/lead";
import { D1LeadRepository } from "./d1-repository";
import { DemoIntelligence } from "./demo-intelligence";
import { OpenAIIntelligence } from "./openai-intelligence";

interface Env {
  DB: D1Database;
  AI_MODE?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

function service(env: Env): RelayService {
  const intelligence =
    env.AI_MODE === "openai" && env.OPENAI_API_KEY
      ? new OpenAIIntelligence(env.OPENAI_API_KEY, env.OPENAI_MODEL || "gpt-5-nano")
      : new DemoIntelligence();
  return new RelayService(new D1LeadRepository(env.DB), intelligence);
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return new Response(null, { status: 404 });

    try {
      const relay = service(env);
      if (request.method === "GET" && url.pathname === "/api/leads") return json(await relay.list());
      if (request.method === "POST" && url.pathname === "/api/leads") {
        return json(await relay.receive((await request.json()) as LeadInput), 201);
      }
      if (request.method === "POST" && url.pathname === "/api/demo/reset") return json(await relay.resetDemo());

      const match = url.pathname.match(/^\/api\/leads\/([^/]+)(?:\/(classify|draft|approve|audit))?$/);
      if (match) {
        const [, id, action] = match;
        if (request.method === "GET" && action === "audit") return json(await relay.audit(id));
        if (request.method === "POST" && action === "classify") return json(await relay.classify(id));
        if (request.method === "POST" && action === "draft") return json(await relay.createDraft(id));
        if (request.method === "POST" && action === "approve") return json(await relay.approve(id));
      }

      return json({ error: { code: "NOT_FOUND", message: "Route not found." } }, 404);
    } catch (error) {
      if (error instanceof DomainError) {
        const status = error.code === "NOT_FOUND" ? 404 : error.code === "DUPLICATE_LEAD" ? 409 : 400;
        return json({ error: { code: error.code, message: error.message } }, status);
      }
      console.error("Relay request failed", error instanceof Error ? error.message : "Unknown error");
      return json({ error: { code: "INTERNAL_ERROR", message: "Relay could not complete the request." } }, 500);
    }
  },
} satisfies ExportedHandler<Env>;

