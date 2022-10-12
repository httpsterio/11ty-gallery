#!/bin/bash -eu
input=/img/full/
output=/img/thumb/jpg/
ext=.jpg
startDir=$(pwd)
thumbSize=300

resizeJpg() {
    inputFile="$1"; shift
    fileName=$(basename -s .jpg ${inputFile});
    convert ${inputFile} -resize "${thumbSize}^>" -gravity center -crop ${thumbSize}x${thumbSize}+0+0 -strip ${startDir}${output}${fileName}${ext}
    echo "image" $fileName "done!"
}

for photo in ${startDir}${input}*.jpg ; do resizeJpg ${photo} ; done
echo "job done!"
