# Security and privacy boundaries

SmartHome currently renders versioned home documentation in the browser.
This page describes the implemented boundary and contributor handling rules;
it is not a claim of a completed security audit.

## What is exposed

The production JavaScript bundle contains inventory and floor geometry. Display
content also includes home-identifying details, network descriptions, device
locations, and maintenance records. Anyone who can retrieve the assets can
inspect that data, including records not currently visible in the UI.

The original workbook and historical prototype contain additional reference
material. They are outside the active Vite application root and must stay outside
the hosted output. See [deployment](deployment.md) for the document-root contract.

There is no application authentication, authorization, backend, telemetry
ingestion, device-command endpoint, or persistent user storage. An “online” label
or changing camera clock does not represent a network connection to a device.

## Trust boundaries

| Boundary                   | Current behavior                                             | Handling rule                                                                 |
| -------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Source → build             | Inventory and display content are bundled                    | Review data before deploying; do not treat hidden UI as private storage       |
| Host → viewer              | Static assets are served without app-level login             | Restrict access at the host/gateway when sharing private documentation        |
| Workbook → app             | No automatic import                                          | Review intentional data updates and preserve reference provenance             |
| Archive → tests            | Trusted checked-in code is evaluated in a Node VM for parity | Never substitute untrusted input or expose that test mechanism in the browser |
| Browser → external systems | No implemented device/backend integration                    | A future integration needs an explicit trust and failure model                |
| Tests → artifacts          | Traces can capture rendered home information                 | Limit artifact sharing and retention to the intended audience                 |

Locally bundled fonts and React remove runtime CDN requests in the current
application. Package installation and CI still access external dependency services.
The browser tests check external requests during their navigation scenario;
this is not a general network-security audit.

## Credentials and local configuration

Do not commit credentials, tokens, camera URLs containing passwords, or secret
keys. The root ignore rules cover `.env`, `.env.*`, and `*.local`, while
allowing `.env.example`. Ignore rules do not protect a file already tracked by Git.

The current app needs no environment variables. Future browser-exposed build
configuration cannot carry a secret, even if its input comes from an ignored file.
A live integration must define server-side secret handling and authorization
before using credentials.

The checked-in [.claude/settings.json](../.claude/settings.json) configures
attribution only. Machine-local overrides remain ignored; do not copy credentials
or broad personal permissions into shared settings.

## Reporting and response

No dedicated disclosure address, bug-bounty program, or response SLA is configured.
For a sensitive issue, contact the repository owner through an established private
channel rather than publishing home details or exploit evidence in a public issue.

Provide the affected commit/path, reproduction conditions, observed impact, and
minimal sanitized evidence. If deployed source or private assets are exposed,
restrict the affected host first, retain enough private evidence to diagnose the
cause, correct the deployment boundary, and verify direct asset access.

If an actual credential is exposed, revoke or rotate it at its issuing system.
Removing it from the latest file does not remove it from Git history, cached
artifacts, or previous deployments. Coordinate any history cleanup with the owner.

## Future integrations

Before introducing live cameras, telemetry, remote editing, or automation, record
authentication, authorization, secret storage, retention, error behavior, and
operational ownership in an [ADR](decisions/README.md).
The reserved [security subsystem](../security/README.md) does not supply these
controls today.
