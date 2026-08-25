import { useEffect, useMemo, useState, type FormEvent } from "react";
import { api } from "./api";
import type { AuditEvent, Lead, LeadInput, LeadStatus } from "./domain/lead";

const statusLabels: Record<LeadStatus, string> = {
  received: "New",
  classified: "Assessed",
  drafted: "Draft ready",
  approved: "Approved",
};

const emptyInput: LeadInput = { name: "", email: "", company: "", message: "", source: "Website" };

function Icon({ name }: { name: "inbox" | "pulse" | "check" | "settings" | "plus" | "spark" | "arrow" | "shield" }) {
  const paths = {
    inbox: <><path d="M4 5h16v13H4z"/><path d="m4 13 4-4h8l4 4M9 15h6"/></>,
    pulse: <><path d="M3 12h4l2-5 4 10 2-5h6"/></>,
    check: <><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7 7 0 0 0-1.7-1L14.5 3h-5l-.3 3.1a7 7 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.3 3.1h5l.3-3.1a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5a7 7 0 0 0 .1-1Z"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    spark: <><path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z"/><path d="m19 16 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z"/></>,
    arrow: <path d="m9 18 6-6-6-6"/>,
    shield: <><path d="M12 3 5 6v5c0 4.4 3 8.1 7 10 4-1.9 7-5.6 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-5"/></>,
  };
  return <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

export function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const selected = leads.find((lead) => lead.id === selectedId) ?? leads[0] ?? null;
  const stats = useMemo(() => ({
    total: leads.length,
    qualified: leads.filter((lead) => (lead.classification?.score ?? 0) >= 60).length,
    drafts: leads.filter((lead) => lead.status === "drafted").length,
    approved: leads.filter((lead) => lead.status === "approved").length,
  }), [leads]);

  useEffect(() => {
    void api.list().then((items) => {
      setLeads(items);
      setSelectedId(items[0]?.id ?? null);
    }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Something went wrong."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected?.id) return;
    void api.audit(selected.id).then(setAudit)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Something went wrong."));
  }, [selected?.id, selected?.updatedAt]);

  function showError(cause: unknown) {
    setError(cause instanceof Error ? cause.message : "Something went wrong.");
  }

  async function run(action: () => Promise<Lead | Lead[]>) {
    setBusy(true);
    setError("");
    try {
      const result = await action();
      if (Array.isArray(result)) {
        setLeads(result);
        setSelectedId(result[0]?.id ?? null);
        if (result.length === 0) setAudit([]);
      } else {
        setLeads((current) => current.some((lead) => lead.id === result.id)
          ? current.map((lead) => lead.id === result.id ? result : lead)
          : [result, ...current]);
        setSelectedId(result.id);
      }
    } catch (cause) {
      showError(cause);
    } finally {
      setBusy(false);
    }
  }

  const nextAction = selected && ({
    received: { label: "Classify lead", action: () => api.classify(selected.id) },
    classified: { label: "Generate draft", action: () => api.draft(selected.id) },
    drafted: { label: "Approve draft", action: () => api.approve(selected.id) },
    approved: null,
  } satisfies Record<LeadStatus, { label: string; action: () => Promise<Lead> } | null>)[selected.status];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="Relay home"><span className="brand-mark">R</span><span>Relay</span></a>
        <nav aria-label="Primary navigation">
          <a className="nav-item active" href="#inbox"><Icon name="inbox" />Inbox<span className="nav-count">{stats.total}</span></a>
          <a className="nav-item" href="#pipeline"><Icon name="pulse" />Pipeline</a>
          <a className="nav-item" href="#activity"><Icon name="check" />Activity</a>
        </nav>
        <div className="sidebar-footer">
          <div className="demo-badge"><span className="status-dot" />Demo intelligence</div>
          <a className="nav-item" href="#about"><Icon name="settings" />How it works</a>
          <div className="profile"><span>PC</span><div><strong>Portfolio demo</strong><small>Human in control</small></div></div>
        </div>
      </aside>

      <main id="top">
        <header className="topbar">
          <div><p className="eyebrow">Lead operations</p><h1>Good opportunities, handled well.</h1></div>
          <div className="header-actions">
            <button className="button secondary" onClick={() => void run(api.resetDemo)} disabled={busy}>Reset demo</button>
            <button className="button primary" onClick={() => setShowForm(true)}><Icon name="plus" />Add lead</button>
          </div>
        </header>

        {error && <div className="error-banner" role="alert"><span>{error}</span><button onClick={() => setError("")}>Dismiss</button></div>}

        <section className="stats" aria-label="Lead summary">
          <Stat label="Open leads" value={stats.total} detail="Across all sources" />
          <Stat label="Qualified" value={stats.qualified} detail="Score of 60 or higher" accent />
          <Stat label="Awaiting approval" value={stats.drafts} detail="Human review required" />
          <Stat label="Approved" value={stats.approved} detail="No messages sent" />
        </section>

        <section className="workspace" id="inbox">
          <div className="lead-list-panel">
            <div className="panel-heading"><div><p className="eyebrow">Inbox</p><h2>Inbound leads</h2></div><span>{leads.length} total</span></div>
            {loading ? <div className="empty-state">Loading your workspace…</div> : leads.length === 0 ? (
              <div className="empty-state"><div className="empty-icon"><Icon name="spark" /></div><h3>Your lead queue is clear</h3><p>Load synthetic examples to explore the complete workflow without using model tokens.</p><button className="button primary" onClick={() => void run(api.resetDemo)} disabled={busy}>Load sample leads</button></div>
            ) : (
              <div className="lead-list">
                {leads.map((lead) => <LeadRow key={lead.id} lead={lead} selected={lead.id === selected?.id} onClick={() => setSelectedId(lead.id)} />)}
              </div>
            )}
          </div>

          <div className="detail-panel">
            {selected ? (
              <>
                <div className="detail-heading">
                  <div className="avatar">{initials(selected.name)}</div>
                  <div className="detail-title"><div><h2>{selected.name}</h2><StatusPill status={selected.status} /></div><p>{selected.company} · {selected.email}</p></div>
                  {nextAction && <button className="button primary" disabled={busy} onClick={() => void run(nextAction.action)}>{busy ? "Working…" : nextAction.label}<Icon name="arrow" /></button>}
                </div>

                <div className="detail-grid">
                  <section className="content-card inquiry-card">
                    <p className="eyebrow">Original inquiry</p><blockquote>“{selected.message}”</blockquote>
                    <div className="meta-row"><span>{selected.source}</span><span>{formatDate(selected.createdAt)}</span></div>
                  </section>

                  <section className="content-card">
                    <div className="card-title"><div><Icon name="spark" /><span><p className="eyebrow">Relay assessment</p><h3>{selected.classification ? `${selected.classification.score}/100 opportunity score` : "Ready for classification"}</h3></span></div>{selected.classification && <span className="confidence">{Math.round(selected.classification.confidence * 100)}% confidence</span>}</div>
                    {selected.classification ? <ClassificationView lead={selected} /> : <p className="muted">Relay will evaluate fit, urgency, and commercial signals. Every recommendation includes the reasons behind it.</p>}
                  </section>

                  <section className="content-card draft-card">
                    <div className="card-title"><div><Icon name="check" /><span><p className="eyebrow">Follow-up</p><h3>{selected.draft ? selected.draft.subject : "No draft yet"}</h3></span></div>{selected.draft && <span className="provider-label">{selected.draft.provider}</span>}</div>
                    {selected.draft ? <pre>{selected.draft.body}</pre> : <p className="muted">A personalized response can be generated after the lead has been classified.</p>}
                    {selected.status === "approved" && <div className="approval-note"><Icon name="shield" /><div><strong>Human approved</strong><span>This demo records approval but never sends email.</span></div></div>}
                  </section>

                  <section className="content-card" id="activity">
                    <p className="eyebrow">Audit trail</p><h3>Every decision, in order</h3>
                    <div className="timeline">{audit.map((event) => <div className="timeline-item" key={event.id}><span className="timeline-dot" /><div><strong>{eventLabel(event.type)}</strong><p>{event.detail}</p><small>{event.actor === "relay" ? "Relay" : "Human"} · {formatDate(event.createdAt)}</small></div></div>)}</div>
                  </section>
                </div>
              </>
            ) : <div className="detail-empty"><Icon name="inbox" /><h2>Select a lead</h2><p>Lead context, recommendations, drafts, and audit history appear here.</p></div>}
          </div>
        </section>

        <footer id="about"><Icon name="shield" /><span>Relay keeps judgment visible: AI recommends, people approve.</span></footer>
      </main>

      {showForm && <LeadForm busy={busy} onClose={() => setShowForm(false)} onSubmit={async (input) => { await run(() => api.receive(input)); setShowForm(false); }} />}
    </div>
  );
}

function Stat({ label, value, detail, accent = false }: { label: string; value: number; detail: string; accent?: boolean }) {
  return <article className={`stat-card ${accent ? "accent" : ""}`}><p>{label}</p><strong>{value.toString().padStart(2, "0")}</strong><span>{detail}</span></article>;
}

function LeadRow({ lead, selected, onClick }: { lead: Lead; selected: boolean; onClick: () => void }) {
  return <button className={`lead-row ${selected ? "selected" : ""}`} onClick={onClick}>
    <span className="avatar small">{initials(lead.name)}</span><span className="lead-copy"><span><strong>{lead.name}</strong><StatusPill status={lead.status} /></span><small>{lead.company}</small><p>{lead.message}</p></span><span className="score">{lead.classification?.score ?? "—"}</span>
  </button>;
}

function StatusPill({ status }: { status: LeadStatus }) {
  return <span className={`status-pill ${status}`}>{statusLabels[status]}</span>;
}

function ClassificationView({ lead }: { lead: Lead }) {
  const value = lead.classification!;
  return <><p className="assessment-summary">{value.summary}</p><div className="rating-row"><Rating label="Fit" value={value.fit} /><Rating label="Urgency" value={value.urgency} /><Rating label="Value" value={value.value} /><div className="rating"><span>Route</span><strong>{value.owner}</strong></div></div><ul className="reason-list">{value.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul><p className="provider-note">Assessment source: {value.provider}</p></>;
}

function Rating({ label, value }: { label: string; value: string }) {
  return <div className="rating"><span>{label}</span><strong className={`rating-${value}`}>{value}</strong></div>;
}

function LeadForm({ busy, onClose, onSubmit }: { busy: boolean; onClose: () => void; onSubmit: (input: LeadInput) => Promise<void> }) {
  const [input, setInput] = useState(emptyInput);
  function change(field: keyof LeadInput, value: string) { setInput((current) => ({ ...current, [field]: value })); }
  function submit(event: FormEvent) { event.preventDefault(); void onSubmit(input); }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="lead-form-title"><div className="modal-heading"><div><p className="eyebrow">New inquiry</p><h2 id="lead-form-title">Add an inbound lead</h2></div><button className="close-button" onClick={onClose} aria-label="Close">×</button></div><form onSubmit={submit}><div className="form-grid"><label>Contact name<input autoFocus required value={input.name} onChange={(e) => change("name", e.target.value)} placeholder="Jordan Lee" /></label><label>Work email<input type="email" required value={input.email} onChange={(e) => change("email", e.target.value)} placeholder="jordan@company.com" /></label><label>Company<input required value={input.company} onChange={(e) => change("company", e.target.value)} placeholder="Acme Studio" /></label><label>Source<select value={input.source} onChange={(e) => change("source", e.target.value)}><option>Website</option><option>Referral</option><option>LinkedIn</option><option>Event</option></select></label></div><label>Inquiry<textarea required rows={5} value={input.message} onChange={(e) => change("message", e.target.value)} placeholder="What does this prospect need, and when?" /></label><div className="form-note"><Icon name="shield" /><span>Adding a lead stores it locally. It does not contact the prospect.</span></div><div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button className="button primary" disabled={busy}>{busy ? "Adding…" : "Add to inbox"}</button></div></form></div></div>;
}

function initials(name: string) { return name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
function formatDate(value: string) { return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)); }
function eventLabel(type: AuditEvent["type"]) { return ({ "lead.received": "Lead received", "lead.classified": "Lead classified", "draft.created": "Draft generated", "draft.approved": "Draft approved" })[type]; }
