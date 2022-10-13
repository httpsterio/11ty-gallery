#!/bin/bash -eu

# This script creates thumbnails from your files
# it crops the images to a square
# You can change the input and output folders. By default it outputs to a jpg folder inside /img/thumb/
# Default size is 300px

input=/img/full/
output=/img/thumb/jpg/
ext=.jpg
startDir=$(pwd)
thumbSize=300

createThumb() {
    inputFile="$1"; shift
    fileName=$(basename -s ${ext} ${inputFile});
    convert ${inputFile} -resize "${thumbSize}^>" -gravity center -crop ${thumbSize}x${thumbSize}+0+0 -strip ${startDir}${output}${fileName}${ext}
    echo "image" $fileName "done!"
}

for photo in ${startDir}${input}*.jpg ; do createThumb ${photo} ; done
echo "job done!"
