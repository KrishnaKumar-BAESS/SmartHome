# security/

**Status: Placeholder — migration pending.**

This directory is reserved for the polished home security system, migrated from
the KumarSec stack: <https://github.com/BAESolutions/KumarSec>

No code lives here yet. Migration is deliberate and will happen in a separate
session.

## What KumarSec is

KumarSec is a self-hosted home security system. Its stack:

| Component         | Technology              | Role                                      |
|-------------------|-------------------------|-------------------------------------------|
| Cameras           | RTSP streams            | Live video source                         |
| Media server      | MediaMTX                | RTSP relay and HLS/WebRTC distribution    |
| AI worker         | YOLO (object detection) | Motion analysis and event detection       |
| REST API          | FastAPI (Python)        | Core backend, event storage, integrations |
| Web front-end     | Next.js (TypeScript)    | Live view, event timeline, settings       |
| Android app       | Kotlin                  | Mobile live view and notifications        |
| Backup service    | —                       | Clip archival and off-site backup         |

## When migration happens

The polished version will land here with its own internal structure
(`apps/`, `services/`, `infra/`, `docs/`). An ADR will be filed if any
significant structural decisions are made during migration.
