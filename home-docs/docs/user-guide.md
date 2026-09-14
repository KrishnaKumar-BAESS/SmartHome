# Using the house atlas

HOUSE.SYS helps you find recorded information about the house and relate it to
a visual floor model. Start the app using the [quick start](../../README.md#start-locally)
or use a deployment supplied by the repository owner.

**The atlas inventory is documentation.** Device states are recorded values;
camera previews and history are demonstrations. Climate sensor records are planned.
The separate **Security → Live cameras** panel displays actual video when this
app runs through the local security service. There is no persistent editing.

## First walkthrough

1. Open **Overview** to see the house summary and model.
2. Enter **Front Doorbell** in the inventory search and select its result.
   The app opens **Security**, selects that camera, and clears the search field.
3. Open **Isolate**, select **Basement**, and inspect the reduced model.
   Choose **All** to restore all rooms.
4. Open **View options** and try **Stacked**, **Floors**, and **Exploded**.
5. Use **View options → Reset orientation** to restore orientation and zoom, or
   **Reset everything** to also clear isolation and separation.
6. Press **?** (or the help button in the top bar) for controls, shortcuts, the
   recorded-versus-demonstration boundary, and how to request a correction.

On a narrow screen the model shows first with the details as a bottom sheet.
The controls cluster offers **List**, **Details**, and **Show model / Show
panels** toggles.

## Documentation modes

| Mode       | What it shows                                                                  | Typical use                                      |
| ---------- | ------------------------------------------------------------------------------ | ------------------------------------------------ |
| Overview   | House summary, system summaries, and room model                                | Get oriented or search for a room                |
| Electrical | Panels, circuit types, circuit details, and served-room highlights             | Follow a documented circuit-to-room relationship |
| Lighting   | Fixture records, specifications, room/status filters, and replacement status   | Find a recorded bulb or fixture specification    |
| Network    | Mesh nodes, documented network membership, server details, and model overlays  | Inspect the recorded topology                    |
| Sound      | Defined audio zones and illustrative speaker layouts                           | Understand the documented zone arrangement       |
| Security   | Camera inventory, illustrative coverage, demo history, and a live-camera panel | Inspect placement or open live Xfinity video     |
| Climate    | Planned sensors, target measurements, and mount locations                      | Review the documented sensor plan                |
| Upkeep     | Maintenance items, recorded usage/life values, parts, and status               | Find a documented maintenance item               |

Selecting items changes the displayed details and relevant model highlighting.
The app does not send commands, update hardware configuration, schedule work, or
save changes to the inventory.

## Search

Search is global across rooms, circuits, panels, fixture records, networks and
nodes, servers, sound zones, cameras, climate sensors, and upkeep items,
including amperage, wattage, lumens, colour temperature, SSIDs, and camera
power or storage text. Try an item name, `gateway`, or
`projector`. Queries are case-insensitive; all words must appear in a result's
indexed text. Results include contextual labels and can switch the active mode.

The dropdown shows the first 16 matches with category chips and a **Show n
more** control; exact identifiers such as `MP·20`, SSIDs, and names rank first.
With the field empty, **Jump to** suggestions accept the same arrow-key and Enter
navigation. Selecting a room opens its summary and isolates it in the model. If
another selection would be hidden by an active isolation, the app clears the
isolation and says so; the details panel also shows "Isolation hides this item"
with a **Show all rooms** action.

Search is not a workbook search and does not query devices or the internet.

## Model controls

| Action                      | Control                                                                              | Result                                                     |
| --------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| Rotate                      | Drag the model                                                                       | Change yaw and pitch                                       |
| Pan on desktop              | Shift-drag, middle-button drag, or right-button drag                                 | Move the projected model                                   |
| Zoom                        | Mouse wheel toward the pointer, pinch, or **+ / −**                                  | Adjust scale within 40–400%; buttons disable at the bounds |
| Pan on touch                | Two-finger drag                                                                      | Move the projected model                                   |
| Reset orientation           | **View options → Reset orientation**, or **0** / **r**                               | Restore yaw, pitch, zoom, and pan; stops auto-spin         |
| Fit / presets               | **View options → Fit visible, Isometric, Plan, North up, Elevation**                 | Recentre or jump to a preset orientation                   |
| Rotate, tilt, pan by button | **View options** arrow buttons, or arrow keys with the model focused (Shift for pan) | Tap- and keyboard-operable camera moves                    |
| Stack floors                | **View options → Stacked**                                                           | Bring floors to their stacked arrangement                  |
| Separate floors             | **View options → Floors**                                                            | Separate floor levels vertically                           |
| Spread rooms                | **View options → Exploded**                                                          | Separate floors and spread rooms outward                   |
| Rotate automatically        | **View options → Auto-spin**                                                         | Toggle automatic rotation                                  |
| Labels and key              | **View options → Room labels / Legend**                                              | Toggle labels or the current mode's legend                 |

**Reset orientation** does not touch selections, isolation, or separation;
**Reset everything** clears isolation and separation too. The address bar tracks
mode, selection, isolation, and separation, so reloading or sharing the link
restores that view. Theme (System / Light / Dark), the single-key shortcut
toggle, and the first-run hint persist in the browser.

## Isolate floors or rooms

Open **Isolate**. Choose **Basement**, **Main**, or **2nd** for a whole floor.
Alternatively, choose room chips to show a selected group. Choosing a floor clears
the room selection; choosing rooms switches to room-based isolation.

Use **All**, **Clear**, or the **×** beside the Isolate pill to restore the
entire house. The pill names the isolated floor or room count. Isolation controls
the model only; lists and totals stay complete, and a selected item hidden by
isolation is flagged in its details.

## Security cameras

In **Security**, choose **Live cameras** to open the integrated player. For local
setup, run `corepack pnpm build` and `corepack pnpm security:start` from the
repository root, then open <http://127.0.0.1:4318/house/>. A static-only copy shows
setup guidance instead of claiming a working camera connection.

Follow the [player setup guide](../../security/apps/camera-viewer/README.md) to
configure account access on Windows. Choose **Sign in to Xfinity** once, then
choose a camera to start its session. Later launches reuse the encrypted account
session. The player reports **LIVE** only after decoding video. **Stop**, closing
the overlay, or pressing Escape ends playback and cancels retries. Credentials renew automatically;
Xfinity may require another sign-in if it revokes the session. The existing
Xfinity app remains paired. ADB import is a temporary troubleshooting fallback.

Selecting an inventory camera still shows its recorded specifications and
illustrative coverage. **Review demo history** opens generated examples, not
recorded footage. Inventory offline badges are stored values, not current health
checks. NVR recording and remote hosting are not
implemented; see the [player guide](../../security/apps/camera-viewer/README.md).

## Keyboard and layout

Tab reaches every control, list row, and model marker; Enter or Space activates
them, and arrow keys move between rows in a list. With the model focused, the
arrow keys rotate and tilt and Shift + arrows pan. A skip link jumps to the model.
Single-key shortcuts (`1`–`8`, `/`, `+`, `−`, `0`, `r`) can be turned off in
View options or the help sheet if they conflict with speech or switch input;
`?` and Escape always work. Selection changes and search counts are announced
to assistive technology. Screen-reader output on real devices is still
unverified; see [known limitations](../../docs/limitations.md) and the
[UI audit resolution log](ui-audit.md).

Below 760 pixels wide the app uses its narrow layout with a horizontally
scrolling navigation rail and a details sheet. Between 760 and 1000 pixels one
side panel is open at a time. Printing produces inventory tables instead of the
interactive stage.

Each list has a **CSV** export of the visible rows; circuit tags and camera
names have copy buttons.

## When something looks wrong

| Observation                           | Next step                                                                          |
| ------------------------------------- | ---------------------------------------------------------------------------------- |
| A room/device highlight is missing    | Clear model isolation and review the active mode's filters                         |
| Model is off-center or too small      | Use Fit visible or Reset orientation; inspect isolation separately                 |
| Side panels obscure the mobile model  | Select Show model                                                                  |
| Search has too many results           | Add a more specific name or keyword                                                |
| Status/date/specification seems stale | Treat it as recorded data and report a correction to the maintainer                |
| A camera does not show real video     | Expected: camera views are demonstrations                                          |
| A value is marked UNVERIFIED          | The recorded reference does not match a documented circuit; report it              |
| Reload loses a setting                | Mode, selection, and isolation live in the URL; other settings persist per browser |

Inventory corrections follow the [data editing workflow](data-model.md#intentional-inventory-changes);
there is no in-app editor.
