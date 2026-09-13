# Using the house atlas

HOUSE.SYS helps you find recorded information about the house and relate it to
a visual floor model. Start the app using the [quick start](../../README.md#start-locally)
or use a deployment supplied by the repository owner.

**The atlas is documentation.** Device states are recorded values. Camera
graphics and history are demonstrations, even where the UI says LIVE, Online,
Today, or shows a changing clock. Climate sensor records are planned.
There is no connection to home devices and no persistent editing.

## First walkthrough

1. Open **Overview** to see the house summary and model.
2. Enter **Front Doorbell** in the inventory search and select its result.
   The app opens **Security**, selects that camera, and clears the search field.
3. Open **Isolate**, select **Basement**, and inspect the reduced model.
   Choose **All** to restore all rooms.
4. Open **View options** and try **Stacked**, **Floors**, and **Exploded**.
5. Use **Reset view** to restore orientation and zoom. If rooms are still hidden,
   clear isolation separately.

On a narrow screen, choose **Show model** to hide the side panels and reach the
model controls. Choose **Show panels** to return to the inventory and details.

## Documentation modes

| Mode       | What it shows                                                                 | Typical use                                      |
| ---------- | ----------------------------------------------------------------------------- | ------------------------------------------------ |
| Overview   | House summary, system summaries, and room model                               | Get oriented or search for a room                |
| Electrical | Panels, circuit types, circuit details, and served-room highlights            | Follow a documented circuit-to-room relationship |
| Lighting   | Fixture records, specifications, room/status filters, and replacement status  | Find a recorded bulb or fixture specification    |
| Network    | Mesh nodes, documented network membership, server details, and model overlays | Inspect the recorded topology                    |
| Sound      | Defined audio zones and illustrative speaker layouts                          | Understand the documented zone arrangement       |
| Security   | Camera records, illustrative coverage, feed grid, and simulated history       | Explore recorded camera placement                |
| Climate    | Planned sensors, target measurements, and mount locations                     | Review the documented sensor plan                |
| Upkeep     | Maintenance items, recorded usage/life values, parts, and status              | Find a documented maintenance item               |

Selecting items changes the displayed details and relevant model highlighting.
The app does not send commands, update hardware configuration, schedule work, or
save changes to the inventory.

## Search

Search is global across rooms, circuits, panels, lights, network nodes, servers,
cameras, climate sensors, and upkeep items. Try an item name, `gateway`, or
`projector`. Queries are case-insensitive; all words must appear in a result's
indexed text. Results include contextual labels and can switch the active mode.

The dropdown shows up to 16 matching results. Refine a broad query to locate a
specific item. Selecting a room isolates it in the model. Selecting other types
can leave existing floor/room isolation active; if an expected highlight is
missing, use **Isolate → All** or **Clear**.

Search is not a workbook search and does not query devices or the internet.

## Model controls

| Action               | Control                                              | Result                                     |
| -------------------- | ---------------------------------------------------- | ------------------------------------------ |
| Rotate               | Drag the model                                       | Change yaw and pitch                       |
| Pan on desktop       | Shift-drag, middle-button drag, or right-button drag | Move the projected model                   |
| Zoom                 | Mouse wheel over the model, or **+ / −** controls    | Adjust scale within 40–400%                |
| Reset orientation    | **View options → Reset view**                        | Restore yaw, pitch, zoom, and pan          |
| Stack floors         | **View options → Stacked**                           | Bring floors to their stacked arrangement  |
| Separate floors      | **View options → Floors**                            | Separate floor levels vertically           |
| Spread rooms         | **View options → Exploded**                          | Separate floors and spread rooms outward   |
| Rotate automatically | **View options → Auto-spin**                         | Toggle automatic rotation                  |
| Labels and key       | **View options → Room labels / Legend**              | Toggle labels or the current mode's legend |

Reset view does not reset selections, isolation, separation mode, or all other
options. Reloading the page resets the whole in-memory session.
On touch devices, use the explicit zoom buttons; pinch zoom is not an implemented
model gesture.

## Isolate floors or rooms

Open **Isolate**. Choose **Basement**, **Main**, or **2nd** for a whole floor.
Alternatively, choose room chips to show a selected group. Choosing a floor clears
the room selection; choosing rooms switches to room-based isolation.

Use **All** or **Clear** to restore the entire house. Isolation controls the model,
while each mode's inventory filters remain separate.

## Camera demonstrations

In **Security**, select a camera to inspect its recorded specifications and
illustrative coverage. **All feeds** opens the camera grid. The expanded viewer
offers generated event-history examples and a return to its demonstration live view.

No video stream, microphone audio, NVR, cloud recording, or physical health check
is connected. An offline badge is a stored status. History entries and duration
labels are generated examples, not evidence that an event occurred.

## Keyboard and layout

Use Tab to move through focusable controls and Enter or Space to activate
buttons and preserved clickable panels. Navigation indicates the active mode.
The UI has some keyboard support, but full keyboard-only model manipulation and
screen-reader coverage have not been verified. See
[known limitations](../../docs/limitations.md).

Below 900 pixels wide the app uses its narrow layout. The navigation can scroll
horizontally. **Show model / Show panels** toggles the side panels; desktop views
also have individual list/detail toggles.

## When something looks wrong

| Observation                           | Next step                                                           |
| ------------------------------------- | ------------------------------------------------------------------- |
| A room/device highlight is missing    | Clear model isolation and review the active mode's filters          |
| Model is off-center or too small      | Use Reset view; inspect isolation separately                        |
| Side panels obscure the mobile model  | Select Show model                                                   |
| Search has too many results           | Add a more specific name or keyword                                 |
| Status/date/specification seems stale | Treat it as recorded data and report a correction to the maintainer |
| A camera does not show real video     | Expected: camera views are demonstrations                           |
| Reload loses selections               | Expected: state is not persisted                                    |

Inventory corrections follow the [data editing workflow](data-model.md#intentional-inventory-changes);
there is no in-app editor.
