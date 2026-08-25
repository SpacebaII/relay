import { useEffect, useMemo, useState, type FormEvent } from "react";
import { api } from "./api";
import type { AuditEvent, Lead, LeadInput, LeadStatus } from "./domain/lead";

const statusLabels: Record<LeadStatus, string> = {
  received: "Unscored",
  classified: "Assessed",
  drafted: "Decision needed",
  approved: "Approved",
};

type QueueFilter = "all" | "received" | "drafted" | "approved";

const emptyInput: LeadInput = { name: "", email: "", company: "", message: "", source: "Website" };

export function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<QueueFilter>("all");

  const counts = useMemo(() => ({
    total: leads.length,
    unscored: leads.filter((lead) => lead.status === "received").length,
    review: leads.filter((lead) => lead.status === "drafted").length,
    approved: leads.filter((lead) => lead.status === "approved").length,
  }), [leads]);

  const visibleLeads = useMemo(() => {
    const term = query.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesFilter = filter === "all" || lead.status === filter;
      const matchesQuery = !term || `${lead.name} ${lead.company} ${lead.email} ${lead.message}`.toLowerCase().includes(term);
      return matchesFilter && matchesQuery;
    });
  }, [filter, leads, query]);

  const selected = visibleLeads.find((lead) => lead.id === selectedId) ?? visibleLeads[0] ?? null;

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
        setFilter("all");
        setQuery("");
        if (result.length === 0) setAudit([]);
      } else {
        setLeads((current) => current.some((lead) => lead.id === result.id)
          ? current.map((lead) => lead.id === result.id ? result : lead)
          : [result, ...current]);
        setSelectedId(result.id);
        setFilter("all");
        setQuery("");
      }
    } catch (cause) {
      showError(cause);
    } finally {
      setBusy(false);
    }
  }

  const nextAction = selected && ({
    received: { label: "Run assessment", action: () => api.classify(selected.id) },
    classified: { label: "Prepare draft", action: () => api.draft(selected.id) },
    drafted: { label: "Record approval", action: () => api.approve(selected.id) },
    approved: null,
  } satisfies Record<LeadStatus, { label: string; action: () => Promise<Lead> } | null>)[selected.status];

  return (
    <div className="page-shell">
      <header className="app-header">
        <a className="wordmark" href="#queue" aria-label="Relay lead review queue">
          <span className="wordmark-symbol" aria-hidden="true">R/</span>
          <span><strong>Relay</strong><small>lead review</small></span>
        </a>
        <p className="environment-note">Public demo / synthetic records / no email delivery</p>
        <div className="header-actions">
          <button type="button" className="button secondary" onClick={() => void run(api.resetDemo)} disabled={busy}>Reload sample queue</button>
          <button type="button" className="button primary" onClick={() => setShowForm(true)} disabled={busy}>+ Add inquiry</button>
        </div>
      </header>

      <main>
        <section className="page-heading" aria-labelledby="page-title">
          <div>
            <p className="section-label">Inbound operations</p>
            <h1 id="page-title">Lead review queue</h1>
            <p>Work an inquiry from receipt to a recorded decision. External delivery is intentionally disconnected.</p>
          </div>
          <dl className="metric-strip" aria-label="Queue summary">
            <Metric label="Records" value={counts.total} />
            <Metric label="Needs scoring" value={counts.unscored} />
            <Metric label="Needs decision" value={counts.review} attention={counts.review > 0} />
            <Metric label="Approved" value={counts.approved} />
          </dl>
        </section>

        {error && <div className="error-banner" role="alert"><span>{error}</span><button type="button" onClick={() => setError("")}>Dismiss</button></div>}

        <section className="workbench" id="queue">
          <aside className="queue-panel" aria-label="Lead queue">
            <div className="queue-header">
              <div><p className="section-label">Queue</p><h2>Inbound records</h2></div>
              <span>{visibleLeads.length} shown / {leads.length} total</span>
            </div>

            <label className="search-field">
              <span className="sr-only">Search records</span>
              <input value={query} disabled={busy} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, company, or inquiry" />
            </label>

            <div className="queue-filters" aria-label="Filter records">
              <FilterButton label="All" value="all" active={filter === "all"} disabled={busy} onSelect={setFilter} />
              <FilterButton label="Unscored" value="received" active={filter === "received"} disabled={busy} onSelect={setFilter} />
              <FilterButton label="Decision" value="drafted" active={filter === "drafted"} disabled={busy} onSelect={setFilter} />
              <FilterButton label="Approved" value="approved" active={filter === "approved"} disabled={busy} onSelect={setFilter} />
            </div>

            {loading ? <div className="queue-empty">Loading records</div> : visibleLeads.length === 0 ? (
              <div className="queue-empty"><strong>No matching records</strong><span>Clear the search or choose another queue filter.</span></div>
            ) : (
              <div className="lead-list">
                {visibleLeads.map((lead) => <LeadRow key={lead.id} lead={lead} selected={lead.id === selected?.id} disabled={busy} onClick={() => setSelectedId(lead.id)} />)}
              </div>
            )}
          </aside>

          <article className="record-panel">
            {selected ? (
              <>
                <header className="record-header">
                  <div className="record-identity">
                    <p className="record-code">{recordCode(selected.id)}</p>
                    <div className="record-title"><h2>{selected.name}</h2><StatusPill status={selected.status} /></div>
                    <p>{selected.company} <span>/</span> <a href={`mailto:${selected.email}`}>{selected.email}</a></p>
                  </div>
                  {nextAction && <button type="button" className="button action-button" disabled={busy} onClick={() => void run(nextAction.action)}>{busy ? "Working" : nextAction.label}<span aria-hidden="true">→</span></button>}
                </header>

                <dl className="record-metadata">
                  <Meta label="Source" value={selected.source} />
                  <Meta label="Received" value={formatDate(selected.createdAt)} />
                  <Meta label="Last change" value={formatDate(selected.updatedAt)} />
                </dl>

                <section className="record-section inquiry-section">
                  <div className="section-heading"><span>01</span><h3>Original inquiry</h3></div>
                  <blockquote>{selected.message}</blockquote>
                </section>

                <section className="record-section assessment-section">
                  <div className="section-heading"><span>02</span><h3>Assessment</h3>{selected.classification && <code>{selected.classification.provider}</code>}</div>
                  {selected.classification ? <ClassificationView lead={selected} /> : <PendingState title="Not assessed" detail="Run the assessment to calculate a score, route, and supporting signals." />}
                </section>

                <section className="record-section draft-section">
                  <div className="section-heading"><span>03</span><h3>Follow-up draft</h3>{selected.draft && <code>{selected.draft.provider}</code>}</div>
                  {selected.draft ? <><h4>{selected.draft.subject}</h4><pre>{selected.draft.body}</pre></> : <PendingState title="No draft on record" detail="A draft can be prepared after the inquiry has been assessed." />}
                  {selected.status === "approved" && <div className="approval-record"><strong>Approval recorded</strong><span>{selected.approvedAt ? formatDate(selected.approvedAt) : "Recorded"}. No delivery integration is connected.</span></div>}
                </section>
              </>
            ) : <div className="record-empty"><strong>No record selected</strong><span>Choose a record from the queue to inspect its inquiry and decision state.</span></div>}
          </article>

          <aside className="log-panel" aria-label="Decision log">
            <div className="log-header"><div><p className="section-label">Record history</p><h2>Decision log</h2></div><span>{audit.length} events</span></div>
            {selected && audit.length > 0 ? (
              <ol className="decision-log">
                {audit.map((event, index) => <li key={event.id}>
                  <span className="event-number">{String(index + 1).padStart(2, "0")}</span>
                  <div><strong>{eventLabel(event.type)}</strong><p>{event.detail}</p><small>{formatDate(event.createdAt)} / {event.actor === "relay" ? "system" : "reviewer"}</small></div>
                </li>)}
              </ol>
            ) : <p className="log-empty">No activity for the selected record.</p>}
            <div className="boundary-note">
              <strong>Demo boundary</strong>
              <p>The database is shared and accepts synthetic information only. Approval is recorded here, but nothing is sent.</p>
            </div>
          </aside>
        </section>
      </main>

      {showForm && <LeadForm busy={busy} onClose={() => setShowForm(false)} onSubmit={async (input) => { await run(() => api.receive(input)); setShowForm(false); }} />}
    </div>
  );
}

function Metric({ label, value, attention = false }: { label: string; value: number; attention?: boolean }) {
  return <div className={attention ? "metric attention" : "metric"}><dt>{label}</dt><dd>{String(value).padStart(2, "0")}</dd></div>;
}

function FilterButton({ label, value, active, disabled, onSelect }: { label: string; value: QueueFilter; active: boolean; disabled: boolean; onSelect: (value: QueueFilter) => void }) {
  return <button type="button" className={active ? "filter-button active" : "filter-button"} aria-pressed={active} disabled={disabled} onClick={() => onSelect(value)}>{label}</button>;
}

function LeadRow({ lead, selected, disabled, onClick }: { lead: Lead; selected: boolean; disabled: boolean; onClick: () => void }) {
  return <button type="button" className={`lead-row ${selected ? "selected" : ""}`} disabled={disabled} onClick={onClick}>
    <span className="lead-row-top"><code>{recordCode(lead.id)}</code><StatusPill status={lead.status} /></span>
    <strong>{lead.name}</strong>
    <span className="lead-company">{lead.company} / {lead.source}</span>
    <span className="lead-preview">{lead.message}</span>
    <span className="lead-score">{lead.classification ? `${lead.classification.score}/100` : "Not scored"}</span>
  </button>;
}

function StatusPill({ status }: { status: LeadStatus }) {
  return <span className={`status-label ${status}`}>{statusLabels[status]}</span>;
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}

function ClassificationView({ lead }: { lead: Lead }) {
  const value = lead.classification!;
  return <div className="assessment-layout">
    <div className="score-block"><span>Opportunity score</span><strong>{value.score}</strong><small>/ 100 · {Math.round(value.confidence * 100)}% confidence</small></div>
    <div className="assessment-detail">
      <p className="assessment-summary">{value.summary}</p>
      <dl className="signal-table">
        <Rating label="Fit" value={value.fit} />
        <Rating label="Urgency" value={value.urgency} />
        <Rating label="Value" value={value.value} />
        <Meta label="Route" value={value.owner} />
      </dl>
      <ul className="finding-list">{value.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
    </div>
  </div>;
}

function Rating({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd className={`rating-${value}`}>{value}</dd></div>;
}

function PendingState({ title, detail }: { title: string; detail: string }) {
  return <div className="pending-state"><strong>{title}</strong><span>{detail}</span></div>;
}

function LeadForm({ busy, onClose, onSubmit }: { busy: boolean; onClose: () => void; onSubmit: (input: LeadInput) => Promise<void> }) {
  const [input, setInput] = useState(emptyInput);
  function change(field: keyof LeadInput, value: string) { setInput((current) => ({ ...current, [field]: value })); }
  function submit(event: FormEvent) { event.preventDefault(); void onSubmit(input); }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="lead-form-title">
      <div className="modal-heading"><div><p className="section-label">Queue intake</p><h2 id="lead-form-title">Add queue record</h2></div><button type="button" className="close-button" onClick={onClose} aria-label="Close">×</button></div>
      <form onSubmit={submit}>
        <div className="form-grid">
          <label>Contact name<input autoFocus required maxLength={80} value={input.name} onChange={(event) => change("name", event.target.value)} placeholder="Jordan Lee" /></label>
          <label>Work email<input type="email" required maxLength={254} value={input.email} onChange={(event) => change("email", event.target.value)} placeholder="jordan@company.example" /></label>
          <label>Company<input required maxLength={120} value={input.company} onChange={(event) => change("company", event.target.value)} placeholder="Atlas Works" /></label>
          <label>Source<select value={input.source} onChange={(event) => change("source", event.target.value)}><option>Website</option><option>Email</option><option>Referral</option><option>LinkedIn</option><option>Event</option></select></label>
        </div>
        <label>Inquiry<textarea required maxLength={2000} rows={6} value={input.message} onChange={(event) => change("message", event.target.value)} placeholder="What does this prospect need, and when?" /></label>
        <p className="form-note">This public queue is shared. Use synthetic information. Submitting a record does not send email.</p>
        <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button className="button primary" disabled={busy}>{busy ? "Adding" : "Add to queue"}</button></div>
      </form>
    </div>
  </div>;
}

function recordCode(id: string) { return `R-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`; }
function formatDate(value: string) { return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)); }
function eventLabel(type: AuditEvent["type"]) { return ({ "lead.received": "Inquiry received", "lead.classified": "Assessment completed", "draft.created": "Draft prepared", "draft.approved": "Approval recorded" })[type]; }
