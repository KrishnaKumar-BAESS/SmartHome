# Watering controllers

Select **Watering** in the HOUSE.SYS main navigation or open the atlas with `#m=watering`. Choose **USB cable** or **MQTT broker**. A successful status query identifies the device. The workspace monitors one selected controller and its single pump. Disconnect to select another. Pump state describes the commanded output. Volumes are estimates based on calibrated flow. This hardware has no flow, moisture, reservoir, or valve feedback.

## Connect

- **USB cable** uses a Web Serial browser such as desktop Chromium on localhost or HTTPS. Attach a UNO R4 running the watering controller, close other serial monitors, and select its port. The workspace opens it at 115200 baud. A port open can reset a board. Browsers without Web Serial show why USB is unavailable. Closing the port chooser without a selection is not an error. The ESP32-S3 network sketch reports diagnostics over this connection and holds its pump off. Its TCP port 23 console is read-only, and its BLE service provisions Wi-Fi. The commissioning and motor-test sketches do not implement the controller management protocol.
- **MQTT broker** requires a broker with a browser-accessible WebSocket listener and the UNO controller connected to the same broker. Enter the listener URL, for example `wss://broker.example/mqtt`, and the configured device ID. Use a trusted TLS certificate and a dedicated broker account. Permit publishing only to `watering/<id>/cmd` and subscribing to that device’s `reply`, `event`, and `availability` topics. The browser sends non-retained QoS 0 commands with unique reply tags. The browser remembers the last broker URL, controller ID and username. The password stays in the current connection and is never stored. The static atlas requires no watering backend. USB is available without a broker.

## The workspace

The header names the controller and shows whether status reports are arriving. The status rail on the left (at the top on phones) shows the following:

- **Pump output.** The commanded state, with a countdown ring for a running dose or a rest interval. The countdown starts from each report's remaining time and dims when reports lag. **Stop pump** is always available. On phones it is pinned to the bottom of the screen.
- **Today.** Estimated volume and pump time against the controller's daily budgets, which reset at controller-local midnight.
- **Health.** Calibration, clock trust, settings storage, event log and device network.

Conditions that limit operation appear above every tab: an inhibited pump, storage faults and an untrusted clock. Confirmations fade after a few seconds. Errors stay until dismissed.

## Operate and calibrate

1. In **Operate**, place the outlet in a catch container. Enter a prime duration in seconds or choose a suggested value, and press **Prime pump**. With calibrated flow, **Water by volume** delivers a dose in mL and previews the pump time. The device enforces its own maximum run, rest interval, and daily budgets. Each card says why a dose cannot start. **Stop pump** sends an immediate stop request, and the rail reads back the pump state. **Session activity** lists the commands sent from this browser and the events the controller reports while you stay connected.
2. In **Calibration**, follow the three steps. Prepare the outlet, run a timed trial of at least three seconds, then enter the measured mL and save. The firmware validates the resulting flow and writes it to flash. Verify a different volume using **Water by volume**.
3. Keep the board’s power disconnect accessible during commissioning. Leaving the Watering view or losing the connection ends monitoring and says why. An accepted dose ends at its device deadline. If a reply times out, check the pump locally before repeating a command.

## Schedule and administer

**Schedule** shows the week at a glance in controller-local time. It marks the current time and the next dose. The next dose is a preview of the stored schedule. The firmware decides when doses actually run. Select one of eight slots, either from the slot grid or the week view. Choose a local time, a dose and weekdays, or use **Every day**, **Weekdays** or **Weekends**. Save to create or replace the slot, or delete it. With calibrated flow, choose **Pump time** to enter the dose in seconds. The editor converts it to a stored volume rounded to 0.001 mL. Recalibrating changes the time required to deliver that volume. **Automatic watering** turns all slots on or off. Saving the first slot leaves a disabled schedule disabled. The controller requires calibration to enable the schedule and a trusted clock to run it. A configured schedule persists and can run while the browser is closed.

In **Device**, set a browser-local display name and zone for this connection and device. Each board drives one physical pump. **Controller clock** shows the controller-local time and UTC offset. You can copy this browser's offset before saving it. Offsets are fixed, so daylight-saving changes need a manual update. **Runtime limits** lists the maximum run, minimum rest and daily budgets. Over USB they can be edited and saved one at a time. Over MQTT they are read-only. Firmware version, build, reset reason and network state come from the board. The physical USB console owns credentials, clock setting, pump direction, and the MQTT device ID.

Verification uses simulated device replies. Physical flow, cutoff behavior, and unattended operation require the watering firmware repository’s bench acceptance procedure.
