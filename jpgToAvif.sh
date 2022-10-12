#!/bin/bash -eu
input=/img/thumb/jpg/;
output=/img/thumb/avif/;
ext=.avif;
startDir=$(pwd);



convertToAvif() {
    inputFile="$1"; shift
    fileName=$(basename -s .jpg ${inputFile});
    convert ${inputFile} -quality 85 ${startDir}${output}${fileName}${ext}
    echo "image" $fileName "done!"
}

for photo in ${startDir}${input}*.jpg ; do convertToAvif ${photo} ; done
echo "job done!"
