# ADR 0001: Single Worker with clean internal boundaries

- Status: Accepted
- Date: 2026-08-24

## Context

Relay needs to be a credible full-stack portfolio project, deploy on free infrastructure, and remain understandable to an intermediate developer. Separate frontend, API, worker, cache, and database services would add operational cost before the product needs that scale.

## Decision

Use one TypeScript repository and one Cloudflare Worker deployment containing:

- a React single-page interface;
- an HTTP API at `/api/*`;
- application services that coordinate use cases;
- domain types and transition rules with no platform dependencies;
- a D1 repository adapter for production and local persistence;
- a replaceable lead-intelligence provider.

Dependencies point inward: infrastructure depends on application contracts, while the domain remains independent of React, HTTP, Cloudflare, and model vendors.

## Consequences

### Positive

- One free deployment and one build artifact.
- Production-like local D1 development.
- Business rules can be unit tested without a browser or database.
- A future API split does not require rewriting the domain.

### Tradeoffs

- Worker runtime limits rule out Node-only packages.
- D1 is SQLite-compatible rather than PostgreSQL.
- A single deployment is not independently scalable by component.

These constraints are appropriate for the MVP and can be revisited with usage evidence.

