import type { AuditEvent, Lead, LeadInput } from "./domain/lead";

interface ApiErrorBody {
  error?: { message?: string };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json", ...init.headers } : init?.headers,
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new Error(body.error?.message || `Request failed (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  list: () => request<Lead[]>("/api/leads"),
  receive: (input: LeadInput) => request<Lead>("/api/leads", { method: "POST", body: JSON.stringify(input) }),
  classify: (id: string) => request<Lead>(`/api/leads/${id}/classify`, { method: "POST" }),
  draft: (id: string) => request<Lead>(`/api/leads/${id}/draft`, { method: "POST" }),
  approve: (id: string) => request<Lead>(`/api/leads/${id}/approve`, { method: "POST" }),
  audit: (id: string) => request<AuditEvent[]>(`/api/leads/${id}/audit`),
  resetDemo: () => request<Lead[]>("/api/demo/reset", { method: "POST" }),
};

