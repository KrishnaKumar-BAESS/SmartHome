# Glossary

**Umbrella repo**
A single git repository that contains multiple independent subsystems under one
organisational roof. `SmartHome` is an umbrella repo. It is not a monorepo with a
shared build system — each subsystem is self-contained.

**Subsystem**
A self-contained home automation or home documentation system that lives in its
own top-level directory (e.g. `security/`, `home-docs/`). A subsystem owns all of
its code, configuration, infrastructure, and internal docs.

**Platform**
An infrastructure-level automation service such as Home Assistant, Node-RED,
Zigbee2MQTT, or ESPHome. Platforms get a subdirectory under `platforms/` rather
than a top-level directory because they underpin other subsystems rather than
being standalone products.

**KumarSec**
The home security system being migrated into `security/`. Original source:
<https://github.com/BAESolutions/KumarSec>. Comprises RTSP cameras, MediaMTX
media server, a YOLO-based AI worker, a FastAPI REST API, a Next.js web
front-end, a Kotlin Android app, and a backup service. Currently a placeholder.

**security/**
The top-level directory reserved for the polished KumarSec home security stack.
No code lives here yet; migration is deliberate and pending.

**home-docs/**
The top-level directory reserved for the home documentation system. The system
design is pending a separate design session.

**ADR (Architecture Decision Record)**
A short document capturing a significant architectural or structural decision,
its context, and its consequences. ADRs live in `docs/decisions/` and are
numbered sequentially.
