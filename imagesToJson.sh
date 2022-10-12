#!/bin/bash -eu

# this script generates a json file with the following data:
# image path, alt text, thumbnail paths for jpg and avif and
# image height and width
# dependencies: ffmpeg and jq

# the result json file, path relative to script
output=_data/photos.json

# folder from where images are read
imageFolder=img/full/



createImageObject() {
local height=$(ffprobe -v quiet -show_streams -print_format json ./$1 | jq '.[] | .[] | .height');
local width=$(ffprobe -v quiet -show_streams -print_format json ./$1 | jq '.[] | .[] | .width');

# removes the folder and file extension from the filename
# replace with basename?
local imgName=$(echo $1|sed 's|full/||g' | sed 's|img/||g' | sed s'|.jpg||g');
local url="/img/full/$imgName";
local thumb="img/thumb/jpg/$imgName";
local avif="img/thumb/avif/$imgName"
local altText="kuva $imgName";

echo "  {" | tee -a $output
echo "    \"url\": \"$url.jpg\"," | tee -a $output
echo "    \"alt\": \"$altText\"," | tee -a $output
echo "    \"thumb\": \"$thumb.jpg\"," | tee -a $output
echo "    \"thumbAvif\": \"$avif.avif\"," | tee -a $output
echo "    \"thumbSize\": 300", | tee -a $output
echo "    \"width\": $width," | tee -a $output
echo "    \"height\": $height" | tee -a $output
echo "  }," | tee -a $output
}

# starts json array
echo "[" | tee $output

# loops all images in imageFolder and passes each as a param to the function
for photo in ${imageFolder}*.jpg ; do createImageObject ${photo} ; done

# adds one empty object as the last object can't end with a comma
echo "  {}" | tee -a $output

# ends json array
echo "]" | tee -a $output
