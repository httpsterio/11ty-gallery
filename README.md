# 11ty-gallery

## [DEMO - https://11ty-gallery.netlify.app](https://11ty-gallery.netlify.app)

A single-event static photo gallery starter (weddings, trips, events) using Eleventy + PhotoSwipe.

This project now uses a cross-platform Node.js image pipeline powered by [Sharp](https://sharp.pixelplumbing.com/). Bash/GraphicsMagick/FFmpeg/jq are no longer required for the supported workflow.

## Requirements

- Node.js
- npm

## Quick start

```bash
npm install
npm run images:process
npm run start
```

Open `http://localhost:8080`.

## Directory layout

- Source images (not published by default): `img/full/`
- Generated full gallery images: `img/gallery/`
- Generated square thumbnail JPG fallback: `img/thumb/jpg/`
- Generated square thumbnail AVIF: `img/thumb/avif/`
- Generated gallery metadata: `_data/photos.json`
- Pipeline cache (safe to delete): `.cache/image-pipeline/`

## Image pipeline behavior

`npm run images:process`:

- Reads source images from `img/full/`
- Processes files in deterministic natural order (`1.jpg`, `2.jpg`, `10.jpg`)
- Applies EXIF orientation before derivative generation
- Measures width/height in displayed orientation for PhotoSwipe metadata
- Strips source metadata from generated public assets by default
- Generates responsive full-image derivatives at widths `320, 640, 1280, 1920` (skipping widths larger than source dimensions)
- Generates full-image formats: JPEG, WebP, AVIF
- Generates square thumbnails (`300x300`) with `fit: cover` + `position: attention`
- Writes `_data/photos.json` with `JSON.stringify` (ordered, no sentinel object)

## Cache and invalidation

The pipeline cache key includes:

- Source file content hash
- Pipeline version (`pipelineVersion`)
- Transformation config (`image-pipeline.config.js`)

That means:

- Identical source bytes reused multiple times are transformed once and then reused
- Re-running without source/config changes is incremental and avoids rewriting unchanged outputs
- Changing source content or pipeline settings invalidates cached transforms

## Configuration

Pipeline settings live in `image-pipeline.config.js`, including:

- source/output directories
- responsive widths
- output qualities/formats
- thumbnail sizing and crop behavior
- cache directory

## Migration note

Legacy scripts are still present for reference (`resizeImages.sh`, `imageToThumbnail.sh`, `thumbToAvif.sh`, `imagesToJson.sh`), but the supported workflow is now:

```bash
npm run images:process
```

## Known limitations

- The pipeline reads only top-level files in `img/full/` (no nested album folders in this PR).
- Ordering/captions/alt-text custom metadata files are intentionally deferred for a follow-up PR.
