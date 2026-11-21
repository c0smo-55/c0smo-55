#!/usr/bin/env bash
# For each finished preview copy: timestamped contact sheets (1 frame/sec, 2s for very long clips)
# and a loudness curve (every 0.5s) so cheering/laughing/singing peaks can be found.
set -u
P=/home/user/footage/proxy; A=/home/user/footage/analysis; mkdir -p "$A"
LOG=$1
FONT=/usr/share/fonts/opentype/inter/Inter-Medium.otf
for i in $(seq 1 33); do
  n=$(printf %02d $i)
  until grep -q "^proxy $i done" "$LOG"; do sleep 10; done
  [ -s "$A/$n.loud.csv" ] && continue
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$P/$n.mp4")
  step=1; awk "BEGIN{exit !($d > 300)}" && step=2
  ffmpeg -y -loglevel error -i "$P/$n.mp4" -vf "fps=1/$step,scale=256:144,drawtext=fontfile=$FONT:text='$n %{eif\:t*$step\:d}s':fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6:x=4:y=4,tile=8x6" \
    -vsync vfr "$A/${n}_sheet_%02d.jpg"
  ffmpeg -y -loglevel error -i "$P/$n.mp4" -vn -af "aresample=16000,asetnsamples=8000,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=$A/$n.rms.txt" -f null -
  awk -F= '/pts_time/{split($0,a,"pts_time:"); t=a[2]} /RMS_level/{printf "%.1f,%s\n", t, $2}' "$A/$n.rms.txt" > "$A/$n.loud.csv"
  echo "analyzed $i"
done
