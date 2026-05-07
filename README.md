West Coast Swing Footwork Tool
==============================

A static web tool for drawing, editing, and displaying West Coast Swing footwork patterns. It is intended to help dancers learn foot placement, timing, and role-specific paths at home.

Quick Start
-----------

Run a local HTTP server from the repo root:

```bash
python3 -m http.server 5173
```

Then open:

```text
http://localhost:5173
```

Do not open `index.html` directly with `file://`. The app loads JSON files with `fetch()`, so it needs to be served over HTTP. GitHub Pages works because it serves the same files over HTTPS.

Repo Structure
--------------

```text
index.html              App markup
styles.css              App styles
app.js                  App logic
footworks.config.json   Pattern manifest
patterns/*.json         One pattern per file
README.md               Setup and repo guide
Specification.md        Current product/development requirements
Tasks.md                Working task list
```

Pattern Data
------------

`footworks.config.json` is a manifest. Each entry points to one file in `patterns/`.

When changing default pattern JSON for a release, increment `version` in `footworks.config.json`. The app revalidates the manifest and loads pattern files with that version as a cache-busting query string, so GitHub Pages and browser caches pick up fresh pattern data after release.

Each pattern file contains:

- pattern metadata, such as `key` and `name`
- rhythm sequence, such as `step`, `step`, `triple`, `triple`
- both `leader` and `follower` footwork
- start positions for both feet

Editing And Saving
------------------

The app has two modes:

- `Display`: step through or play the selected pattern.
- `Editor`: edit rhythm, foot labels, angles, coordinates, notes, and start positions.

Edits are not saved automatically. Press `Save` to persist changes to browser `localStorage` for `http://localhost:5173`.

If you switch patterns or add a new pattern while changes are unsaved, the app asks whether to save, discard, or continue editing.

`Export pattern JSON` downloads the selected pattern as a standalone JSON file. Because this is a static web app, saving cannot directly write files into `patterns/`; to make exported work part of the repo defaults, place the exported file in `patterns/` and add it to `footworks.config.json`.

Useful Notes
------------

- `localStorage` is tied to the exact origin. `localhost:5173`, `localhost:8000`, and `127.0.0.1:5173` each have separate saved data.
- Restarting the HTTP server does not clear `localStorage`.
- Incognito/private browsing storage may disappear when the session closes.
- Stop the local server with `Ctrl+C` in the terminal running it.
