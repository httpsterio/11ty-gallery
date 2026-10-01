#!/usr/bin/env node

const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");

const config = require("../image-pipeline.config");

const projectRoot = process.cwd();
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".tif", ".tiff"]);

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function hashString(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function hashBuffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function ensureDir(directory) {
  await fs.mkdir(directory, { recursive: true });
}

async function readJsonIfExists(filePath, fallback) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      return fallback;
    }

    throw error;
  }
}

async function writeFileIfChanged(filePath, content) {
  try {
    const previous = await fs.readFile(filePath, "utf8");

    if (previous === content) {
      return false;
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf8");
  return true;
}

async function copyFileIfChanged(sourcePath, destinationPath) {
  try {
    const [sourceBuffer, destinationBuffer] = await Promise.all([
      fs.readFile(sourcePath),
      fs.readFile(destinationPath)
    ]);

    if (sourceBuffer.equals(destinationBuffer)) {
      return false;
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  await ensureDir(path.dirname(destinationPath));
  await fs.copyFile(sourcePath, destinationPath);
  return true;
}

function getOrientedDimensions(metadata) {
  const width = metadata.width || 0;
  const height = metadata.height || 0;
  const orientation = metadata.orientation || 1;

  if ([5, 6, 7, 8].includes(orientation)) {
    return { width: height, height: width };
  }

  return { width, height };
}

function normalizeWidths(widths, sourceWidth, sourceHeight) {
  const maxDimension = Math.max(sourceWidth, sourceHeight);
  const uniqueWidths = [...new Set(widths)]
    .filter((value) => Number.isInteger(value) && value > 0 && value <= maxDimension)
    .sort((a, b) => a - b);

  if (uniqueWidths.length === 0) {
    uniqueWidths.push(maxDimension);
  }

  return uniqueWidths;
}

function pipelineConfigKey() {
  return hashString(
    JSON.stringify({
      pipelineVersion: config.pipelineVersion,
      sourceDir: config.sourceDir,
      output: config.output,
      thumbnail: config.thumbnail,
      fullWidths: config.fullWidths,
      fullFormats: config.fullFormats
    })
  );
}

async function getSourceFiles(sourceDirectory) {
  const entries = await fs.readdir(sourceDirectory, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => supportedExtensions.has(path.extname(name).toLowerCase()))
    .sort(collator.compare);
}

async function transformUniqueSource({
  sourceBuffer,
  cacheEntryDirectory,
  sourceWidth,
  sourceHeight,
  fullWidths,
  fullFormats,
  thumbnail
}) {
  const artifacts = {
    width: sourceWidth,
    height: sourceHeight,
    widths: fullWidths,
    full: {},
    thumb: {}
  };

  for (const [format, formatOptions] of Object.entries(fullFormats)) {
    const extension = format === "jpeg" ? "jpg" : format;
    artifacts.full[format] = [];

    for (const width of fullWidths) {
      const outputPath = path.join(cacheEntryDirectory, "full", format, `${width}.${extension}`);
      await ensureDir(path.dirname(outputPath));

      const { data, info } = await sharp(sourceBuffer)
        .rotate()
        .resize({ width, fit: "inside", withoutEnlargement: true })
        .toFormat(format, formatOptions)
        .toBuffer({ resolveWithObject: true });

      await fs.writeFile(outputPath, data);

      artifacts.full[format].push({
        width: info.width,
        height: info.height,
        cachePath: toPosixPath(path.relative(projectRoot, outputPath))
      });
    }
  }

  const thumbJpgPath = path.join(cacheEntryDirectory, "thumb", "thumb.jpg");
  const thumbAvifPath = path.join(cacheEntryDirectory, "thumb", "thumb.avif");
  await ensureDir(path.dirname(thumbJpgPath));

  const thumbBase = sharp(sourceBuffer)
    .rotate()
    .resize({
      width: thumbnail.size,
      height: thumbnail.size,
      fit: thumbnail.fit,
      position: thumbnail.position,
      withoutEnlargement: true
    });

  await thumbBase
    .clone()
    .jpeg({ quality: thumbnail.jpgQuality, mozjpeg: true })
    .toFile(thumbJpgPath);

  await thumbBase
    .clone()
    .avif({ quality: thumbnail.avifQuality })
    .toFile(thumbAvifPath);

  artifacts.thumb.jpgCachePath = toPosixPath(path.relative(projectRoot, thumbJpgPath));
  artifacts.thumb.avifCachePath = toPosixPath(path.relative(projectRoot, thumbAvifPath));

  return artifacts;
}

async function main() {
  const sourceDirectory = path.resolve(projectRoot, config.sourceDir);
  const cacheDirectory = path.resolve(projectRoot, config.cacheDir);
  const cacheManifestPath = path.join(cacheDirectory, "cache-manifest.json");
  const outputFullDirectory = path.resolve(projectRoot, config.output.fullDir);
  const outputThumbJpgDirectory = path.resolve(projectRoot, config.output.thumbJpgDir);
  const outputThumbAvifDirectory = path.resolve(projectRoot, config.output.thumbAvifDir);
  const photosJsonPath = path.resolve(projectRoot, config.photosJson);

  await Promise.all([
    ensureDir(cacheDirectory),
    ensureDir(outputFullDirectory),
    ensureDir(outputThumbJpgDirectory),
    ensureDir(outputThumbAvifDirectory)
  ]);

  const configKey = pipelineConfigKey();
  const cacheManifest = await readJsonIfExists(cacheManifestPath, {});
  const files = await getSourceFiles(sourceDirectory);

  const seenBasenames = new Set();
  const generated = [];
  const errors = [];
  const uniqueResults = new Map();

  for (const fileName of files) {
    const absolutePath = path.join(sourceDirectory, fileName);
    const basename = path.parse(fileName).name;

    if (seenBasenames.has(basename)) {
      errors.push(`${fileName}: duplicate basename "${basename}" is not supported across extensions`);
      continue;
    }
    seenBasenames.add(basename);

    try {
      const sourceBuffer = await fs.readFile(absolutePath);
      const sourceHash = hashBuffer(sourceBuffer);
      const cacheKey = hashString(`${config.pipelineVersion}:${configKey}:${sourceHash}`);
      const cacheEntryDirectory = path.join(cacheDirectory, cacheKey);

      let artifacts = uniqueResults.get(cacheKey);

      if (!artifacts) {
        const sourceMetadata = await sharp(sourceBuffer).metadata();

        if (!sourceMetadata.width || !sourceMetadata.height) {
          throw new Error("could not read image dimensions");
        }

        const orientedDimensions = getOrientedDimensions(sourceMetadata);
        const fullWidths = normalizeWidths(config.fullWidths, orientedDimensions.width, orientedDimensions.height);

        const existingArtifacts = cacheManifest[cacheKey];
        const cacheFilesExist = existingArtifacts
          ? await Promise.all(
              [
                ...Object.values(existingArtifacts.full || {}).flat().map((entry) => path.resolve(projectRoot, entry.cachePath)),
                path.resolve(projectRoot, existingArtifacts.thumb?.jpgCachePath || ""),
                path.resolve(projectRoot, existingArtifacts.thumb?.avifCachePath || "")
              ].map(async (artifactPath) => {
                if (!artifactPath) {
                  return false;
                }

                try {
                  await fs.access(artifactPath);
                  return true;
                } catch {
                  return false;
                }
              })
            )
          : [];

        if (existingArtifacts && cacheFilesExist.length > 0 && cacheFilesExist.every(Boolean)) {
          artifacts = existingArtifacts;
        } else {
          artifacts = await transformUniqueSource({
            sourceBuffer,
            cacheEntryDirectory,
            sourceWidth: orientedDimensions.width,
            sourceHeight: orientedDimensions.height,
            fullWidths,
            fullFormats: config.fullFormats,
            thumbnail: config.thumbnail
          });

          cacheManifest[cacheKey] = artifacts;
        }

        uniqueResults.set(cacheKey, artifacts);
      }

      const fullSources = {};

      for (const [format, entries] of Object.entries(artifacts.full)) {
        const extension = format === "jpeg" ? "jpg" : format;
        fullSources[format] = [];

        for (const entry of entries) {
          const destinationFile = path.resolve(
            projectRoot,
            config.output.fullDir,
            format,
            `${basename}-${entry.width}.${extension}`
          );

          const sourceFile = path.resolve(projectRoot, entry.cachePath);
          await copyFileIfChanged(sourceFile, destinationFile);

          fullSources[format].push({
            url: `/${toPosixPath(path.relative(projectRoot, destinationFile))}`,
            width: entry.width,
            height: entry.height
          });
        }
      }

      const thumbJpgDestination = path.resolve(projectRoot, config.output.thumbJpgDir, `${basename}.jpg`);
      const thumbAvifDestination = path.resolve(projectRoot, config.output.thumbAvifDir, `${basename}.avif`);

      await Promise.all([
        copyFileIfChanged(path.resolve(projectRoot, artifacts.thumb.jpgCachePath), thumbJpgDestination),
        copyFileIfChanged(path.resolve(projectRoot, artifacts.thumb.avifCachePath), thumbAvifDestination)
      ]);

      const jpegSources = fullSources.jpeg || [];
      const lightboxImage = jpegSources[jpegSources.length - 1] || null;

      if (!lightboxImage) {
        throw new Error("jpeg derivative generation failed");
      }

      generated.push({
        url: lightboxImage.url,
        alt: `kuva ${basename}`,
        thumb: `/${toPosixPath(path.relative(projectRoot, thumbJpgDestination))}`,
        thumbAvif: `/${toPosixPath(path.relative(projectRoot, thumbAvifDestination))}`,
        thumbSize: config.thumbnail.size,
        width: artifacts.width,
        height: artifacts.height,
        sources: fullSources
      });
    } catch (error) {
      errors.push(`${fileName}: ${error.message}`);
    }
  }

  const photosJson = `${JSON.stringify(generated, null, 2)}\n`;
  const cacheManifestJson = `${JSON.stringify(cacheManifest, null, 2)}\n`;

  const [photosChanged, cacheChanged] = await Promise.all([
    writeFileIfChanged(photosJsonPath, photosJson),
    writeFileIfChanged(cacheManifestPath, cacheManifestJson)
  ]);

  console.log(`Processed ${generated.length} image(s) from ${files.length} source file(s).`);
  console.log(photosChanged ? `Updated ${config.photosJson}` : `${config.photosJson} unchanged.`);
  console.log(cacheChanged ? `Updated ${toPosixPath(path.relative(projectRoot, cacheManifestPath))}` : "Cache unchanged.");

  if (errors.length > 0) {
    console.error("\nSome images could not be processed:");

    for (const error of errors) {
      console.error(`- ${error}`);
    }

    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
