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

