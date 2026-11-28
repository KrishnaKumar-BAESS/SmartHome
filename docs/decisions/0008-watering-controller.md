# 0008 — Connect watering controllers from the atlas

Accepted 2026-11-27.

The watering firmware owns pump timing, calibration, daily budgets and recurring schedules. The atlas needs live control while preserving the firmware’s physical-access boundary for safety settings.

The dedicated Watering view in the main navigation connects directly from the browser. Operators can choose a physical Web Serial port or an MQTT broker WebSocket listener. Direct USB enables runtime limit changes. MQTT uses a restricted command set, clean sessions, unique reply tags and non-retained commands. A fresh status reply identifies the pump. Display names and zone labels persist in browser storage. The browser also remembers the last broker URL, controller ID and username, but never the broker password. The controller stores operational settings in flash.

A host-side bridge could serve browsers without Web Serial or WebSocket access to their broker. It would also require a new server authentication and authorization boundary for actuators. Browser connections keep access under the port chooser and the operator’s broker credentials and allow the static deployment to manage a controller.

Operators must provision browser-accessible transport, scope broker permissions and verify physical operation during commissioning. The read-only ESP32-S3 network sketch can report diagnostics over USB. See the [watering guide](../../home-docs/docs/watering.md).
