# home-docs/

Interactive home documentation system for 8502 Forrest St · April 147.

## What's here

`app/` — self-contained browser app (no build step required):

| File | Purpose |
|------|---------|
| `home-documentation.dc.html` | Main app — 3D isometric house model with 8 documentation views |
| `support.js` | DC runtime (loads React 18 from CDN, powers the `.dc.html` format) |

## Running locally

Serve `app/` over HTTP (required — React loads from the CDN and `file://` won't work):

```sh
cd home-docs/app
python -m http.server 8080
```

Then open `http://localhost:8080/home-documentation.dc.html` in a browser.

## Views

| Mode | What it shows |
|------|--------------|
| Overview | Isometric 3D house model — all floors, pan/zoom/rotate/explode |
| Electrical | Breaker panels (Main + Basement Subpanel), 13+ circuits, loads |
| Lighting | 18 bulbs across all rooms, fixture types, dimmer status |
| Network | Mesh nodes, coverage map, 6-node Wi-Fi topology |
| Sound | Speaker zones |
| Security | 8 cameras with live-feed mockups |
| Climate | 7 planned sensor locations |
| Upkeep | 7 consumable items with service intervals |

## Tech

`.dc.html` is a Claude Design Component — a self-contained React app authored in the
DC prototype format. The runtime (`support.js`) compiles the template and mounts it.
No build tooling, no package.json, no Node required.
