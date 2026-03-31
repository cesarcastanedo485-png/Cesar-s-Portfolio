# Godot Web Demo Upload Workflow

This portfolio supports optional, in-card Godot mini demos using static files under `public/demos/`.

## Folder convention

For each demo, create:

- `public/demos/<slug>/index.html`
- `public/demos/<slug>/*.wasm`
- `public/demos/<slug>/*.pck`
- any generated `.js` and asset files from Godot export

Example:

`public/demos/cyoa-pilot/index.html`

## Content metadata

In `content/portfolio.json`, set fields on a game or work item:

- `demoEnabled`: `true`
- `demoSlug`: maps to `/demos/<slug>/index.html`
- `demoTitle`: short heading for the embed card
- `demoNotes`: control instructions/help text
- `demoFallbackHref` (optional): custom external URL for the "Open new tab" button

## Export steps (manual)

1. In Godot, export to **Web**.
2. Copy all exported files into `public/demos/<slug>/`.
3. Ensure the exported entrypoint is named `index.html` in that folder.
4. Start the portfolio site and click **Launch demo** on the target card.

## Notes

- Demos are lazy-loaded and only start when users click "Launch demo".
- Keep mini demos lightweight to avoid slowing the portfolio page.
- If a demo fails, use "Open new tab" to debug pathing quickly.
