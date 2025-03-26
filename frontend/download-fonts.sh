#!/bin/bash

# Create fonts directory if it doesn't exist
mkdir -p public/fonts

# Download font files
curl -o public/fonts/BMHANNAAir.ttf "https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2302@1.0/BMHANNAAir.woff2"
curl -o public/fonts/BMHANNAPro.ttf "https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2302@1.0/BMHANNAPro.woff2"

echo "Font files downloaded successfully!" 