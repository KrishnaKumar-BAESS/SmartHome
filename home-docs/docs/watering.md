# Watering controllers

Open **Upkeep → Manage watering system** in the HOUSE.SYS details pane. Choose USB or MQTT. A successful status query identifies the device. The panel monitors one selected controller and its single pump. Disconnect to select another. Pump state describes the commanded output. Volumes are estimates based on calibrated flow. This hardware has no flow, moisture, reservoir, or valve feedback.

## Connect

- **USB** uses a Web Serial browser such as desktop Chromium on localhost or HTTPS. Attach a UNO R4 running the watering controller, close other serial monitors, and select its port. The panel opens it at 115200 baud. A port open can reset a board. The ESP32-S3 network sketch reports diagnostics over this connection and holds its pump off. Its TCP port 23 console is read-only, and its BLE service provisions Wi-Fi. The commissioning and motor-test sketches do not implement the controller management protocol.
- **MQTT** requires a broker with a browser-accessible WebSocket listener and the UNO controller connected to the same broker. Enter the listener URL, for example `wss://broker.example/mqtt`, and the configured device ID. Use a trusted TLS certificate and a dedicated broker account. Permit publishing only to `watering/<id>/cmd` and subscribing to that device’s `reply`, `event`, and `availability` topics. The browser sends non-retained QoS 0 commands with unique reply tags. Broker credentials stay in the current connection. The static atlas requires no watering backend. USB is available without a broker.

## Operate and calibrate

1. Place the outlet in a catch container. Enter a prime duration in seconds and press **Prime pump**. The device enforces its own maximum run, rest interval, and daily budgets. **Stop pump** sends an immediate stop request. The panel reads back the pump state.
2. In **Calibration**, collect a timed trial of at least three seconds. When the device reports its completed trial, enter the measured mL and save. The firmware validates the resulting flow and writes it to flash. Verify a different volume using **Water by volume**.
3. Keep the board’s power disconnect accessible during commissioning. Closing the dialog or losing the connection ends monitoring. An accepted dose ends at its device deadline. If a reply times out, check the pump locally before repeating a command.

## Schedule and administer

Select one of eight slots. Choose a controller-local time, volume and weekdays. Save to create or replace the slot, or delete it. With calibrated flow, you can enter pump duration in seconds. The editor converts it to a stored volume rounded to 0.001 mL. Recalibrating changes the time required to deliver that volume. The schedule’s enable/pause switch governs all slots. Saving the first slot leaves a disabled schedule disabled. The controller requires calibration to enable and a trusted clock to run. A configured schedule persists and can run while the browser is closed.

In **Administration**, set a browser-local display name and zone for this connection and device. Each board drives one physical pump. Firmware version, build, reset reason, network state, and daily budgets come from the board. UTC offset and USB runtime limit updates persist in the controller. The physical USB console owns credentials, clock setting, pump direction, and the MQTT device ID.

Verification uses simulated device replies. Physical flow, cutoff behavior, and unattended operation require the watering firmware repository’s bench acceptance procedure.
