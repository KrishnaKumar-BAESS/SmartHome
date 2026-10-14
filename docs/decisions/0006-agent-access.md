# ADR 0006: Browser agent API with scoped local HTTP access

Date: 2026-10-14. Status: Accepted.

## Context

Programs need to explore recorded house data and manipulate the atlas visible to
the user. Operators also need to issue, manage and revoke granular API keys.
The atlas supports static hosting; the existing local security service already
serves its built files under `/house/`.

## Decision

Expose a versioned `window.smartHome` interface owned by the mounted controller.
Reuse its data and selection paths, validate commands before applying them, return
detached snapshots, and publish committed view changes to subscribers.

Extend the local service with a separate admin console and hash-only persistent
API-key store. Administrator sign-in uses a host-local bootstrap credential and
an expiring HttpOnly cookie. Only authenticated browser sessions can connect atlas
tabs through a same-origin event stream. Programs select an explicit live tab ID
and invoke whitelisted methods with `data:read`, `view:read`, or `view:write` keys.
Replies follow the same mounted controller path as direct browser automation.

## Alternatives

DOM-only automation is brittle and obscures structured data. A second server-side
UI model would drift from the actual screen. A new MCP server or public hosting
layer adds deployment and authentication boundaries that this local task does
not require. The HTTP contract can be wrapped by such a client later.

## Consequences

Static browser automation needs no service. Scoped HTTP access needs the local
service, administrator sign-in, and an open atlas tab. The atlas remains the
authoritative owner of data and view behavior; there is no cross-subsystem source
import or shared database. Service restart preserves key hashes and revocations,
but invalidates admin sessions and tab IDs. Timeouts cannot prove a delivered
command had no effect, so callers inspect state before retrying.

This extends [ADR 0004](0004-security-live-camera-integration.md)'s shared local
origin without changing Xfinity authentication. Keys govern the new HTTP methods,
not static inventory exposure, trusted local processes, or direct browser scripts.
They cannot mutate inventory, operate devices, or administer other keys.

See the [agent guide](../../home-docs/docs/agent-api.md) for contracts, recovery,
test evidence, and the detailed trust boundary.
