
Development Specification
=========================

This document records the current requirements and implementation rules for the West Coast Swing Footwork Tool. Future development should either follow these requirements or update this file when the intended behavior changes.

Purpose
-------

- The tool helps dancers learn West Coast Swing footwork faster by visualizing timing, foot labels, and left/right foot paths.
- The primary workflow is editor-first: create or adjust pattern data, then display/play it for practice.
- The app must remain usable as a static web page that can run from localhost or GitHub Pages.

Runtime And Hosting
-------------------

- The app is static: `index.html`, `styles.css`, `app.js`, and JSON files.
- The app must be served over HTTP/HTTPS because it loads JSON using `fetch()`.
- Local development uses `python3 -m http.server 5173`.
- GitHub Pages hosting is supported.
- Static hosting cannot write JSON files back to the repository or server.

Data Model
----------

- `footworks.config.json` is a manifest, not the full pattern database.
- Each pattern lives in its own file under `patterns/`.
- A pattern file must contain both `leader` and `follower` role data.
- A pattern may contain additional metadata such as `version`, `key`, and `name`.
- The app should remain backward compatible where practical with older config shapes.

Pattern Structure
-----------------

- A pattern has a `name`.
- A pattern has a `rhythm` array.
- A pattern has `roles.leader` and `roles.follower`.
- Each role has `steps` and `startSteps`.
- Each step contains at least `beat`, `foot`, `x`, `y`, `angle`, and optional `note`.
- Each start step contains `foot`, `x`, `y`, and `angle`.

Rhythm Logic
------------

- Supported step types are `step` and `triple`.
- `step` creates one time point and advances one beat.
- `triple` creates three time points across two beats, such as `3`, `&`, `4`.
- A common six-count rhythm is `step`, `step`, `triple`, `triple`, displayed as `1`, `2`, `3`, `&`, `4`, `5`, `&`, `6`.
- A basic whip-style rhythm may be `step`, `step`, `triple`, `step`, `step`, `triple`.
- Foot labels are editable per generated time point.
- By default, leader steps alternate starting with `L`; follower steps alternate starting with `R`.

Timeline Logic
--------------

- The timeline starts with an explicit `S` state before the first generated step.
- At `S`, display mode shows only the start positions.
- Generated time points appear after `S`, for example `S`, `1`, `2`, `3`, `&`, `4`, `5`, `&`, `6`.
- Previous, next, and play controls cycle through `S` plus all generated time points.

Start Position Logic
--------------------

- Start positions are shown as semi-opaque grey footsteps labeled `S`.
- Each role has separate start positions for `L` and `R`.
- Default start positions are near the center of the viewer.
- Default start angles are `L: -15` degrees and `R: 30` degrees.
- Start positions are draggable in editor mode.
- Selecting a start foot shows its editable details in the side panel.
- Start foot label is fixed; angle, `x`, and `y` are editable.

Visualization Logic
-------------------

- Footsteps are drawn as foot-like shapes with a visible time label and foot label.
- Left/right feet are shown as `L` and `R`.
- The active/current step should be visually emphasized.
- Visible lagged history steps should be slightly transparent.
- Edges are optional and controlled by `Show edges`.
- Edges connect only placements of the same foot, never across `L` and `R`.
- Edges begin from the corresponding foot's start position.
- Display lag controls how many recent positions are shown per foot.
- Lag default is `2`.
- Lag counts independently per foot and includes start positions as history.
- `All` shows the full visible path for each foot.
- Editor mode shows all steps to make drawing easier.

Editor Logic
------------

- Editor mode allows editing the selected pattern.
- Users can build rhythm from `step` and `triple` phrases.
- Users can insert new rhythm phrases.
- Users can remove rhythm phrases, while keeping at least one phrase.
- Generated time points update from the rhythm sequence.
- Users can edit each step's foot, angle, `x`, `y`, and note.
- Users can click the floor to place the selected time point.
- Users can drag normal footsteps and start footsteps.
- Users can create a new blank pattern from the pattern toolbar.
- A new blank pattern should include both leader and follower roles.

Saving And Import/Export
------------------------

- Changes are not saved automatically.
- Any edit should mark the current working state as dirty.
- Pressing `Save` persists the current config to browser `localStorage`.
- Switching patterns or creating a new pattern while dirty must ask whether to save changes, discard changes, or continue editing.
- Saving in the static app does not write files to `patterns/`.
- `Export pattern JSON` downloads the selected pattern as a standalone JSON file.
- Imported standalone pattern JSON should be added as a pattern and marked dirty until saved.
- Imported full config JSON should replace the working config.

Local Storage
-------------

- Browser storage key: `wcs-footwork-config`.
- Storage is scoped to the exact origin, such as `http://localhost:5173`.
- Restarting the HTTP server does not clear local storage.
- Changing port, hostname, browser profile, or private/incognito context changes storage behavior.

Current Defaults
----------------

- Default patterns are listed in `footworks.config.json`.
- Current default pattern files:
  - `patterns/sugarpush.json`
  - `patterns/sugartuck.json`
  - `patterns/leftsidepass.json`
  - `patterns/rightsidepass.json`
  - `patterns/simplewhip.json`
