# 0006 — Local Pi-hole statistics in development

Date: 2026-10-14. Status: Accepted for local development and preview.

## Context

SmartHome is still under development. The owner requested live Pi-hole statistics
and easy navigation to the native dashboard and back. The installed Pi-hole v6
API requires authentication and reports two-factor authentication enabled.

## Decision

The home-docs subsystem owns a server-only Vite plugin in
`home-docs/apps/web/server/pihole-service.ts`. It reads `PIHOLE_URL` and
`PIHOLE_APP_PASSWORD` from local environment configuration, authenticates with
`/api/auth`, and reads only `/api/stats/summary` and `/api/dns/blocking`.
The browser uses the fixed same-origin GET endpoint `/api/pihole/stats`.
The service validates localhost Host and Origin, rejects writes and cross-site
requests, disables redirects, bounds upstream requests, renews expired sessions
once, and returns only aggregate metrics. Responses and logs do not expose the
password, SID, or raw upstream errors. A ten-second cache and shared pending request
prevent duplicate authentication/polling bursts. Passwords and SIDs are not persisted
by application code; the operator's password remains in ignored `.env.local`.

The panel polls every 30 seconds while mounted, cancels on close, reports setup,
authentication, and connection failures, and offers explicit refresh. The native
Pi-hole dashboard opens separately with `noopener noreferrer`, preserving the
SmartHome tab and view state. Pi-hole's own sign-in remains intact.

## Alternatives and consequences

A direct browser API connection would expose credentials and depend on cross-origin
permissions. Embedding the native dashboard conflicts with its SAMEORIGIN framing
policy. A reverse proxy for its entire administrative UI would unnecessarily expand
this feature's scope. The selected bridge exposes only a summary.

Vite dev and preview are local tools, not production hosting. Static hosting and the
camera server do not expose this endpoint. No Pi-hole configuration was changed.
Production auth, routing, and secret storage remain a future hosting decision.

## Validation

Unit tests exercise authentication, renewal, request coalescing, malformed data, and
secret omission. Desktop/mobile tests use explicit mock metrics to exercise navigation
and failure states, and real localhost requests test rejected origins and writes.
The installed API schema was inspected; live authenticated metrics remain unverified
until the owner supplies an app password in the prepared local file.
