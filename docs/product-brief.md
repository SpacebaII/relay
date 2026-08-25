# Relay Product Brief

## Problem

Small agencies and consultancies often collect leads through disconnected forms and inboxes. Slow triage, inconsistent qualification, and generic follow-ups make good opportunities easy to miss.

## Product hypothesis

If Relay converts an unstructured inquiry into a transparent recommendation and an editable response draft, a small team can respond faster without handing final decisions to AI.

## Target user

An owner or client-services lead at a 2–20 person agency or consultancy who handles inbound opportunities alongside delivery work.

## MVP workflow

1. A user submits an inbound lead.
2. Relay classifies fit, urgency, value, and recommended owner.
3. Relay prepares a personalized follow-up draft.
4. A human reviews and approves the draft.
5. Relay records every transition and its explanation in an audit trail.

The MVP never sends email. Approval proves the control point without risking an unintended external action.

## Success criteria

- The complete workflow is usable in a deployed browser application.
- Every automated recommendation includes human-readable reasons.
- The public demo can operate without model charges.
- Optional live AI use is explicit, bounded, and never required for the demo.
- The repository passes lint, type, unit, integration, end-to-end, and production-build checks.

## Non-goals

- CRM synchronization
- Multi-tenant billing
- Autonomous email delivery
- A general-purpose chatbot
- Custom model training

## Product risks

- **False confidence:** mitigated through visible confidence, reasons, and human approval.
- **Sensitive data:** the demo uses synthetic data and never logs secrets.
- **Cost surprises:** the deterministic provider is the default; live AI is opt-in.
- **Over-automation:** external side effects are deliberately excluded from the MVP.

