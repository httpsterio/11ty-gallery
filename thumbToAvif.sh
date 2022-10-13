#!/bin/bash -eu

# This script creates avif thumbnails from your other thumbnails. It's a smaller file and more performant, giving a better lighthouse score. Keep a fallback jpg though if avif isn't supported by the end user's device.

input=/img/thumb/jpg/;
output=/img/thumb/avif/;
inputExt=.jpg;
outputExt=.avif;
startDir=$(pwd);



convertToAvif() {
    inputFile="$1"; shift
    fileName=$(basename -s ${inputExt} ${inputFile});
    convert ${inputFile} -quality 85 ${startDir}${output}${fileName}${outputExt}
    echo "image" $fileName "done!"
}

for photo in ${startDir}${input}*${inputExt} ; do convertToAvif ${photo} ; done
echo "job done!"
