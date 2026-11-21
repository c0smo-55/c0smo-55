#!/usr/bin/env bash
# Small SDR preview copies of every clip (640x360, tone-mapped from iPhone HLG HDR) for review + analysis.
set -u
SRC=/home/user/footage/Dicky; OUT=/home/user/footage/proxy; mkdir -p "$OUT"
TM="scale=640:360:flags=fast_bilinear,zscale=t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p"
for i in $(seq 1 33); do
  o=$OUT/$(printf %02d $i).mp4
  [ -s "$o" ] && [ "$o" -nt "$0" ] && continue
  aac=$(ffprobe -v error -select_streams a -show_entries stream=index,codec_name -of csv=p=0 "$SRC/$i.MOV" | awk -F, '$2=="aac"{print $1; exit}')
  ffmpeg -y -loglevel error -threads 4 -i "$SRC/$i.MOV" -map 0:v:0 -map 0:$aac -vf "$TM" \
    -c:v libx264 -preset veryfast -crf 26 -g 30 -c:a aac -b:a 96k -ac 1 "$o" && echo "proxy $i done"
done
