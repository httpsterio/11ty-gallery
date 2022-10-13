#!/bin/bash -eu

# This script resizes photos from a given folder so that
# the aspect ratio stays the same but the shortest side of
# the image is set to 2400px

# folder with the images, location relative to this script
input=/img/full/

# output folder, location relative to this script
output=/img/full/

# input image file extension
inputExt=.jpg
# result image format
outputExt=.jpg

# smallest side of the result image
minSize=2400

startDir=$(pwd)
resizeImages() {
    inputFile="$1"; shift

    # split filename from file extension and save to variable
    fileName=$(basename -s ${inputExt} ${inputFile});
    
    # convert image, resize, remove metadata and output file
    convert ${inputFile} -resize "${minSize}x${minSize}^>" -strip ${startDir}${output}${fileName}${ext}
    echo "image" $fileName "done!"
}

# loops for every image in inputdirectory 
for photo in ${startDir}${input}*${inputExt} ; do resizeImages ${photo} ; done
echo "job done!"
