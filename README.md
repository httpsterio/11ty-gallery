# 11ty-gallery

## [DEMO - https://11ty-gallery.netlify.app](https://11ty-gallery.netlify.app)

This project is a barebones project that builds an image gallery website. It uses Eleventy and Photoswipe. My personal wedding album was built with this, you can see what it looks like [here](https://wedding.httpster.io).

Inside are also some bash scripts to generate the necessary json markup, feel free to customize them to your needs.

The scripts are shortly documented below. You can run them from the main directory, assuming you've put your files in the correct directories and don't need to change them up.

## Dependencies
- Node (16 at least)
- npm
- Bash
- ffmpeg
- graphicsmagick
- jq

## Usage

- Install the necessary dependencies mentioned above.

- Install eleventy and the node packages with

```npm install```

- Check the your image locations and necessary variable changes (like changing jpg files to pngs etc.) in the ```.sh``` scripts

- Supply your own images. Default location is ```/img/full/```. If you don't have thumbnails then you should the scripts in order. If you have thumbnails, add them to the /img/thumbs/jpg folder and run the scripts starting at the avif generation.

- chmod +x all the ```.sh``` files to enable execution of the scripts.

- Run ```./resizeImages.sh```

- Run ```./imagesToThumbnails.sh```

- Run ```./thumbToAvif.sh```

- Run ```./imagesToJson.sh```

- Start the site with ```npm run start``` and open ```http://localhost:8080```



---

## resizeImages.sh
### Description
This script resizes and overwrites your image files, it'll resize the shortest side of the image to a given size (2400px by default) and maintain the aspect ratio.

__You don't necessarily need to run this script. It's only used for cropping images__.

This means all your images will have the same minimum size (either width or height depending on orientation).

### Requires
- GraphicsMagick

```apt-get install graphicsmagick```

- Bash

### Input and output files
You can edit the variable input and output variable to change where the files are read from and where they're being written to. Paths are relative from where the script is executed.

```input=/img/full/```

Input and output file extensions are by default jpg. You can change the variables to any other image format supported by GraphicsMagick. The script will only loop through files matching the inputExt in the input directory. outputExt determines the end format for your images.

```inputExt=.jpg```

```outputExt=.jpg```


### Image size
By default the images are resized so the smallest side is 2400px. You can change the variable to anything else.
```minSize=2400```

---

## imageToThumbnails.sh
### Description
This script creates square shaped thumbnails. Defaults to jpg files that are 300x300 px in size. You can change the input, output, extension and size by editing the variables.

__You don't necessarily need to run this script. This is for creating thumbnails. If you don't have thumbnails, you should run it__.

### Requires
- GraphicsMagick
- Bash

### Variables 

```input=/img/full/```

```output=/img/thumb/jpg/```

```ext=.jpg```

```startDir=$(pwd)```

```thumbSize=300```

---

## thumbToAvif.sh
### Description
This script creates avif thumbnails from your other thumbnails. It's a smaller file and more performant, giving a better lighthouse score. Keep a fallback jpg though if avif isn't supported by the end user's device. You can change the input and output directories and the input file format by editing the variables.

__You don't necessarily need to run this script. This is for creating avif thumbnails. If you don't have avif thumbnails, you should run it__.

### Requires
- GraphicsMagick
- Bash

### Variables

```input=/img/thumb/jpg/;```

```output=/img/thumb/avif/;```

```inputExt=.jpg;```

```outputExt=.avif;```

```startDir=$(pwd);```

---

## imagesToJson.sh
### Description
This script generates a json that we can read into Eleventy to generate the galleries.

__You need to run this. Check that you're using the correct file directories and extensions__.

### Requires
- ffmpeg

```apt install ffmpeg```

- jq

```apt install jq```

### Variables

```output=_data/photos.json```

```imageFolder=img/full/```

```thumbFolder=img/thumb/jpg/```

```avifFolder=img/thumb/avif/```

```inputExt=.jpg```

```thumbExt=.jpg```

