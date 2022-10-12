#!/bin/bash -eu

# This script resizes jpg photos from a given folder so that
# the aspect ratio stays the same but the shortest side of
# the image is set to 2400px

# folder with the images, location relative to this script
input=/img/full/

# output folder, location relative to this script
output=/img/full/

# result image format
ext=.jpg

# smallest side of the result image
minSize=2400

startDir=$(pwd)
resizeJpg() {
    inputFile="$1"; shift

    # split filename from jpg extension and save to variable
    fileName=$(basename -s .jpg ${inputFile});
    
    # convert image, resize, remove metadata and output file
    convert ${inputFile} -resize "${minSize}x${minSize}^>" -strip ${startDir}${output}${fileName}${ext}
    echo "image" $fileName "done!"
}

# loops for every jpg in inputdirectory 
for photo in ${startDir}${input}*.jpg ; do resizeJpg ${photo} ; done
echo "job done!"
