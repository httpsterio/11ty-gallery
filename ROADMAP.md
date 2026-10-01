# 11ty Gallery Roadmap

This document is the canonical plan for modernising `11ty-gallery` into a privacy-friendly, cross-platform static photo gallery starter for a single event or collection—for example a wedding, trip, party, or exhibition.

The project is currently built with Eleventy and uses PhotoSwipe for the lightbox experience. The repository and documentation may refer to both **Eleventy** and its emerging **Build Awesome** successor during the transition. We are keeping the repository name `11ty-gallery` for now and are not migrating to an unstable Build Awesome release as part of the current work.

## Product scope

The project is intended for one gallery per site:

- One event, trip, wedding, exhibition, or similar collection.
- No multi-site gallery management.
- No server-side uploads or database.
- Static output suitable for ordinary hosting.
- Raw/master images remain source material and are not published by default.
- Generated, cleaned, optimised derivatives are used for the public gallery.
- Gallery order follows the source collection's natural filename order by default.
- A central metadata/configuration file may provide explicit ordering and descriptions later.

## Completed

### PR #1 — Image pipeline

Merged October 1, 2026: [Replace shell image workflow with Sharp pipeline](https://github.com/httpsterio/11ty-gallery/pull/1)

Implemented:

- Cross-platform Node.js image processing with Sharp.
- `npm run images:process` as the supported image-processing command.
- Natural filename ordering (`1`, `2`, `10`).
- EXIF orientation handling before transforms and dimension reporting.
- Metadata-stripped generated public assets by default.
- Responsive full-image derivatives at configured widths.
- JPEG, WebP, and AVIF output.
- Configurable square thumbnails using `fit: cover` and attention-based positioning.
- JavaScript-generated `_data/photos.json` without shell-built JSON or a sentinel object.
- Content-hash and configuration-aware caching.
- Reuse of processing results for byte-identical source files.
- Non-destructive processing; source files are not overwritten.
- Raw source images are not passed through to the public site by default.

Primary files:

- [`image-pipeline.config.js`](image-pipeline.config.js)
- [`scripts/process-images.js`](scripts/process-images.js)

### PR #2 — Dependency and build baseline

Merged October 1, 2026: [Modernize dependency/build baseline](https://github.com/httpsterio/11ty-gallery/pull/2)

Implemented:

- Eleventy 3 dependency baseline.
- Node.js 24 development baseline and Node.js engine requirement.
- Local package binaries instead of `npx` in project scripts.
- Removal of unused direct dependencies.
- Minimal GitHub Actions build validation.
- Updated lockfile and basic prerequisite documentation.

Primary file:

- [`.github/workflows/build.yml`](.github/workflows/build.yml)

## Next milestones

## PR #3 — Responsive gallery and accessibility integration

**Status: planned**

The image pipeline already emits responsive sources, but the current template primarily consumes the older thumbnail fields. This milestone connects the generated assets to the frontend without redesigning the gallery from scratch.

Planned work:

- Use the generated `sources` data in the gallery template.
- Add responsive `srcset` and `sizes` attributes.
- Use `<picture>` with AVIF/WebP/JPEG sources where appropriate.
- Preserve a reliable JPEG fallback.
- Use explicit image dimensions to reduce layout shift.
- Keep square thumbnails for the grid while preserving the original aspect ratio for gallery/lightbox images.
- Select an appropriate optimised full-size derivative for PhotoSwipe.
- Preserve a no-JavaScript fallback where each thumbnail links directly to its image.
- Improve keyboard navigation and focus visibility.
- Support Escape-to-close and sensible focus return in the lightbox.
- Add reduced-motion support.
- Review the existing download button and ensure it does not accidentally expose raw files.
- Keep PhotoSwipe in this milestone; evaluate alternatives separately after the integration is stable.

Acceptance criteria:

- The generated responsive derivatives are actually used by the page.
- The gallery remains usable without JavaScript.
- Portrait and landscape images display with correct dimensions and orientation.
- The lightbox opens the cleaned/optimised derivative, not a raw source file.
- The build continues to pass in CI.

## PR #4 — Gallery metadata and configuration

**Status: planned**

Introduce a central configuration/metadata model for the single-event gallery. The default should continue to work with minimal configuration, while allowing users to add human-authored content when needed.

Potential central file:

```text
_data/gallery.json
```

Potential responsibilities:

- Gallery title.
- Gallery description.
- Explicit image order.
- Alt text.
- Captions.
- Optional image titles.
- Event/date information.
- Download setting.
- Theme or presentation options where appropriate.

Proposed behavior:

- If no metadata entry exists, include source images in natural filename order.
- Use a safe filename-derived fallback only when no authored alt text is available.
- Keep captions and alt text separate concepts.
- Validate references to source files and report useful build errors.
- Preserve a simple “put images in the source directory and build” path.

### Original download behavior

Downloads must be opt-in.

- Downloads disabled: raw masters are not published and no original download link is shown.
- Downloads enabled: the gallery still displays cleaned/optimised derivatives, but the download link points to the original source file.
- Enabling downloads must be documented as publishing source files, including any metadata they contain.

The first version should not silently strip metadata from a file presented as the original download.

## PR #5 — Documentation, examples, and distribution

**Status: planned**

Make the repository feel like a maintained, reusable starter rather than a personal project with scripts.

Planned work:

- Rewrite the README around the single-event photo-gallery use case.
- Document the current Node-only image workflow as the primary path.
- Mark the legacy shell scripts as migration references or remove them once the replacement is fully documented.
- Add a polished sample gallery that contains no personal material.
- Add screenshots and, if useful, a short demo recording.
- Document the directory layout.
- Document configuration and metadata.
- Document privacy implications of source images and original downloads.
- Add deployment guides for Netlify, GitHub Pages, Cloudflare Pages, and generic static hosting.
- Clarify the relationship between Eleventy and Build Awesome during the rename transition.
- Add a migration guide from the old GraphicsMagick/FFmpeg/jq/Bash workflow.
- Add contribution guidance and issue templates.
- Add tests or fixture-based checks for image processing and generated manifest output.

## Quality and maintenance work

These items can be included with the milestone they support or handled as small follow-up pull requests:

- Add fixture images covering landscape, portrait, EXIF-rotated, and unsupported/corrupt inputs.
- Test that generated assets do not retain source EXIF metadata by default.
- Test natural ordering and duplicate-content cache reuse.
- Test cache invalidation after source or configuration changes.
- Test that stale generated files do not become publicly reachable unexpectedly.
- Validate generated JSON against a documented schema.
- Check the generated HTML with an accessibility tool.
- Check responsive output with Lighthouse or an equivalent performance audit.
- Ensure CI does not require personal/raw gallery images.
- Keep Sharp on a current supported release.

## Branding and naming

Current decision: keep the repository name `11ty-gallery` while the Eleventy-to-Build-Awesome transition develops.

For now:

- Describe the project as an Eleventy / Build Awesome-compatible gallery starter where accurate.
- Keep the stable `@11ty/eleventy` package unless a stable Build Awesome migration is justified.
- Do not adopt an alpha package merely for branding.
- Revisit a repository rename after the Build Awesome package and documentation transition stabilise.

Candidate future names:

- `static-photo-gallery`
- `photo-gallery-starter`
- `build-awesome-gallery`

A future rename should happen only with a migration note and repository redirect in place.

## Out of scope for now

- Multiple albums or sub-galleries in one installation.
- A CMS or admin interface.
- Server-side uploads.
- User accounts.
- Video processing.
- Cloud storage integrations.
- Perceptual or decoded-pixel duplicate detection.
- Replacing PhotoSwipe before the current responsive integration is complete.
- Publishing raw source files by default.

## Working order

1. Complete and review PR #3: responsive output and accessibility integration.
2. Design and implement PR #4: central metadata/configuration and opt-in original downloads.
3. Complete PR #5: documentation, examples, deployment, fixtures, and migration guidance.
4. Revisit branding and a possible repository rename once Build Awesome stabilises.
