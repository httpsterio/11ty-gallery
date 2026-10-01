module.exports = {
  pipelineVersion: 1,
  sourceDir: "img/full",
  output: {
    fullDir: "img/gallery",
    thumbJpgDir: "img/thumb/jpg",
    thumbAvifDir: "img/thumb/avif"
  },
  photosJson: "_data/photos.json",
  thumbnail: {
    size: 300,
    fit: "cover",
    position: "attention",
    jpgQuality: 85,
    avifQuality: 55
  },
  fullWidths: [320, 640, 1280, 1920],
  fullFormats: {
    jpeg: { quality: 82, mozjpeg: true, progressive: true },
    webp: { quality: 78 },
    avif: { quality: 55 }
  },
  cacheDir: ".cache/image-pipeline"
};
