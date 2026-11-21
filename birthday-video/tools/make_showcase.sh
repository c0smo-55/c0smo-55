#!/usr/bin/env bash
# Renders the Remotion title scenes and joins them with transitions + sound effects
# into style_demo.mp4 (opening -> chapter card -> polaroid photo moment -> ending).
set -euo pipefail
cd "$(dirname "$0")/.."
B=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
R=build/remotion
mkdir -p "$R"
[ "${SKIP_RENDER:-}" = 1 ] || (cd remotion && for c in Opening Chapter Polaroid Ending; do
  npx remotion render src/index.jsx "$c" "../$R/$c.mp4" --browser-executable="$B" --codec=h264 --crf=16 --log=error >/dev/null
done)

# Lengths: Opening 8s, Chapter 4s, Polaroid 5s, Ending 10s
ffmpeg -y -loglevel error -i "$R/Opening.mp4" -i "$R/Chapter.mp4" -i "$R/Polaroid.mp4" -i "$R/Ending.mp4" -filter_complex "
[0:v]fps=30,settb=AVTB,format=yuv420p[v0];[1:v]fps=30,settb=AVTB,format=yuv420p[v1];
[2:v]fps=30,settb=AVTB,format=yuv420p[v2];[3:v]fps=30,settb=AVTB,format=yuv420p[v3];
[v0][v1]xfade=transition=fadeblack:duration=0.8:offset=7.2[x1];
[x1][v2]xfade=transition=circleopen:duration=0.6:offset=10.6[x2];
[x2][v3]xfade=transition=fade:duration=1:offset=14.6,format=yuv420p[v]" \
  -map "[v]" -c:v libx264 -crf 17 -pix_fmt yuv420p -r 30 "$R/joined.mp4"

TOTAL=24.6
SFX=(impact 950 0.9  sparkle 1100 0.6  sparkle 2550 0.5  pop 2600 0.5
     whoosh 7150 0.5  pop 7700 0.45  pop 7900 0.35  whoosh 10450 0.6
     shutter 11580 0.9  sparkle 12300 0.45  whoosh 14650 0.45  pop 14950 0.4
     impact 15750 0.8  sparkle 15850 0.6  sparkle 17450 0.55  pop 17450 0.45)
args=(); fl=""; mix=""; n=0
for ((i=0; i<${#SFX[@]}; i+=3)); do
  args+=(-i "sfx/${SFX[i]}.wav")
  fl+="[$n:a]adelay=${SFX[i+1]}|${SFX[i+1]},volume=${SFX[i+2]}[a$n];"; mix+="[a$n]"; n=$((n+1))
done
ffmpeg -y -loglevel error "${args[@]}" -filter_complex \
  "${fl}${mix}amix=inputs=$n:normalize=0:duration=longest,apad=whole_dur=$TOTAL,atrim=0:$TOTAL,afade=t=out:st=23.6:d=1,alimiter=limit=0.9[aout]" \
  -map "[aout]" "$R/sfx_track.wav"

ffmpeg -y -loglevel error -i "$R/joined.mp4" -i "$R/sfx_track.wav" -c:v copy -c:a aac -b:a 192k \
  -shortest -movflags +faststart style_demo.mp4
echo "done: style_demo.mp4"
