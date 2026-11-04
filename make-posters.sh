#!/usr/bin/env bash
# Makes a poster (.webp) next to every video, same name:  Cinematic/cinematic0.webm -> Cinematic/cinematic0.webp
# Needs ffmpeg.  Run from the site's root folder:  bash make-posters.sh
for f in Cinematic/*.webm VFX/*.webm; do
  [ -f "$f" ] || continue
  ffmpeg -loglevel error -y -ss 0.6 -i "$f" -frames:v 1 -vf "scale='min(640,iw)':-2" -c:v libwebp -quality 78 "${f%.webm}.webp" && echo "poster: ${f%.webm}.webp"
done
