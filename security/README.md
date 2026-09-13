# Security subsystem

**Status: reserved; no implementation.** This directory reserves a boundary for
a deliberate future migration from the separate KumarSec repository. No service,
camera integration, API, frontend, or deployment is present here.

The **Security** mode in the home atlas belongs to
[home-docs](../home-docs/README.md) and displays recorded camera information and
demonstrations. Its presence does not indicate that this subsystem is running.

## Integration boundary

[KumarSec](https://github.com/BAESolutions/KumarSec) is the identified migration source.
Its implementation and supported
deployment must be reviewed at the chosen source revision when a migration is
requested; this placeholder does not assert that an external stack has already
been verified or imported.

A migration should define scope and ownership in an
[architecture decision](../docs/decisions/README.md), retain the subsystem's
internal structure where appropriate, and document:

- Which services and data move, and which remain external.
- Authentication, authorization, credentials, network exposure, and retention.
- Installation, configuration, compatibility, and verification.
- Deployment, backup/restore, failure diagnosis, and rollback.
- Any contract with the house atlas or automation platforms.

Add `apps/`, `services/`, `infra/`, or `docs/` only when content exists.
Update the root map, shared architecture, CI coverage, and changelog as part of
the actual integration. No migration is implied by documentation maintenance.

For the current repository's trust boundaries, see
[security and privacy](../docs/security.md).
