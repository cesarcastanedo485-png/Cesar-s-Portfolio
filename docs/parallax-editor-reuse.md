# Parallax Editor Reuse Guide

This repo now isolates parallax-editor logic so it can be moved to other sites.

## Reusable pieces

- `lib/parallax-editor.ts`
  - Core types + keys:
  - `EditorDraft`, `EditorArpTune`, `PARALLAX_EDITOR_DRAFT_KEY`
  - `isEditorPreviewEnabled()`
- `lib/parallax-editor-config.ts`
  - Reusable defaults and validation:
  - `createEditorDraft(seed)`
  - `sanitizeEditorTune(...)`
  - `getEditorWarnings(draft)`
  - `EditorSeed` type
- `components/tools/ParallaxStackEditor.tsx`
  - UI implementation with mobile minimize, health checks, preview/publish actions
- `app/api/parallax-assets/route.ts`
  - Upload endpoint that stores assets in `public/backgrounds`
- `app/api/parallax-publish/route.ts`
  - Publish endpoint that writes validated editor values into `content/portfolio.json`

## Minimum files to copy into another Next.js app

1. `components/tools/ParallaxStackEditor.tsx`
2. `lib/parallax-editor.ts`
3. `lib/parallax-editor-config.ts`
4. `app/api/parallax-assets/route.ts`
5. `app/api/parallax-publish/route.ts`
6. `app/tools/parallax-editor/page.tsx`

## Integration requirements

- Keep the same URL flags in runtime:
  - `?arpPreview=1`
  - `?arpTune=1`
- Runtime background renderer should:
  - read `PARALLAX_EDITOR_DRAFT_KEY` when preview mode is on
  - apply the draft layer/tune overrides
  - fall back to published site config when flags are absent

## Safety notes

- Use repo-relative asset paths (`/backgrounds/...`) for portability.
- Publish path should include clamping (`sanitizeEditorTune`) to prevent out-of-range values.
- Keep mobile and desktop profiles separate in all data models.

## Copy and send tune JSON

Use this when you want to share the exact tuned values and reapply them elsewhere.

1. Open the tuned page with `?arpTune=1`.
2. Open browser DevTools Console.
3. Copy raw stored JSON:
   - `copy(localStorage.getItem('arp-mobile-tune-v1'))`
4. If you want pretty JSON:
   - `copy(JSON.stringify(JSON.parse(localStorage.getItem('arp-mobile-tune-v1') || '{}'), null, 2))`
5. Paste that JSON into chat or a file and send it.

## Restore tune JSON

On the target site/page:

1. Open the same page with `?arpTune=1`.
2. Open DevTools Console.
3. Run:
   - `localStorage.setItem('arp-mobile-tune-v1', '<PASTE_JSON_HERE>')`
4. Refresh the page.

