#!/usr/bin/env bash
# Builds a ~22s style demo: title card, chapter card, three placeholder "clips",
# end card, with transitions, effects and synthesized sound effects.
# Real footage will replace the placeholder clips once it arrives.
set -euo pipefail
cd "$(dirname "$0")/.."

SERIF=/usr/share/fonts/truetype/crosextra/Caladea-Italic.ttf
LIGHT=/usr/share/fonts/opentype/inter/InterDisplay-Light.otf
MED=/usr/share/fonts/opentype/inter/Inter-Medium.otf
GOLD=0xC9A96E
CREAM=0xF5EFE6
W=build/demo
mkdir -p "$W"
ENC=(-c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r 30 -an)

# Fade helper: alpha that fades in from $1 over $2 seconds and out at the end ($3 = clip length).
fade_alpha() { echo "if(lt(t,$1),0,if(lt(t,$1+$2),(t-$1)/$2,if(gt(t,$3-0.6),max(0,($3-t)/0.6),1)))"; }

# ---------- 1. Chapter card ----------
printf 'CHAPTER ONE' > "$W/ch_small.txt"
printf 'The Celebration Begins' > "$W/ch_title.txt"
ffmpeg -y -loglevel error -f lavfi -i "color=c=0x14110f:s=1920x1080:d=3.5:r=30" \
  -f lavfi -i "color=c=$GOLD:s=400x2:d=3.5:r=30" -filter_complex "
[0:v]vignette=PI/4,
drawtext=fontfile=$LIGHT:textfile=$W/ch_small.txt:fontsize=30:fontcolor=$GOLD:x=(w-tw)/2:y=430:alpha='$(fade_alpha 0.2 0.6 3.5)',
drawtext=fontfile=$SERIF:textfile=$W/ch_title.txt:fontsize=100:fontcolor=$CREAM:x=(w-tw)/2:y='490+25*max(0,1-(t-0.5)/0.7)':alpha='$(fade_alpha 0.5 0.7 3.5)'[bg];
[1:v]format=rgba,fade=in:st=0.8:d=0.6:alpha=1,fade=out:st=2.9:d=0.6:alpha=1[line];
[bg][line]overlay=x=760:y=630:shortest=1
" "${ENC[@]}" "$W/s1_chapter.mp4"

# ---------- 2. Placeholder clips ----------
# $1 out, $2 c0, $3 c1, $4 clip number, $5 lower-third line 1, $6 line 2, $7 extra filters (applied last)
slide() { echo "-700+760*min(1,max(0,(t-$1)/0.45))*min(1,max(0,(3.6-t)/0.4))"; }
placeholder() {
  printf '%s' "$5" > "$W/$1_l1.txt"; printf '%s' "$6" > "$W/$1_l2.txt"
  printf 'CLIP %s' "$4" > "$W/$1_big.txt"; printf 'real footage goes here' > "$W/$1_small.txt"
  ffmpeg -y -loglevel error -f lavfi -i "gradients=s=2112x1188:c0=$2:c1=$3:x0=0:y0=0:x1=2112:y1=1188:speed=0.015:d=4:r=30" \
    -f lavfi -i "color=c=black:s=640x120:d=4:r=30" -filter_complex "
[0:v]crop=1920:1080:x='96*t/4':y='54-27*t/4',
eq=saturation=1.1:gamma=1.03,
drawtext=fontfile=$LIGHT:textfile=$W/$1_big.txt:fontsize=150:fontcolor=white@0.22:x=(w-tw)/2:y=(h-th)/2-40,
drawtext=fontfile=$LIGHT:textfile=$W/$1_small.txt:fontsize=34:fontcolor=white@0.35:x=(w-tw)/2:y=(h/2)+70[bg];
[1:v]format=rgba,colorchannelmixer=aa=0.5,drawbox=x=0:y=0:w=6:h=120:color=$GOLD:t=fill[box];
[bg][box]overlay=x='$(slide 0.6)':y=850:shortest=1,
drawtext=fontfile=$MED:textfile=$W/$1_l1.txt:fontsize=40:fontcolor=$CREAM:x='40+$(slide 0.7)':y=872,
drawtext=fontfile=$LIGHT:textfile=$W/$1_l2.txt:fontsize=28:fontcolor=$GOLD:x='40+$(slide 0.8)':y=926
$7" "${ENC[@]}" "$W/$1.mp4"
}
placeholder s2_clip01 0x2B3A55 0x7A5C8E 01 "Arrival" "The restaurant" ""
# Camera-flash effect at 1.8s for photo-taking moments.
placeholder s3_clip05 0x8E5C6A 0xD9A066 05 "Friends Arrive" "The party fills up" \
  ",eq=brightness='if(between(t,1.8,2.15),0.75*(1-(t-1.8)/0.35),0)':eval=frame"
# Warm light-leak glow for emotional moments.
placeholder s4_clip14 0x3D2B4F 0x8A5A6A 14 "Make a Wish" "Happy Birthday song" \
  "[base];gradients=s=1920x1080:c0=0xFF9A4D:c1=0x000000:x0=1700:y0=100:x1=900:y1=700:speed=0.03:d=4:r=30[leak];[base][leak]blend=all_mode=screen:all_opacity=0.35"

# ---------- 3. End card ----------
printf 'Happy Birthday,' > "$W/end1.txt"; printf 'Jesslyn' > "$W/end2.txt"
printf 'WITH LOVE, PAPA & MAMA' > "$W/end3.txt"
ffmpeg -y -loglevel error -f lavfi -i "color=c=0x14110f:s=1920x1080:d=5:r=30" -vf "
vignette=PI/4,
drawtext=fontfile=$LIGHT:textfile=$W/end1.txt:fontsize=52:fontcolor=$GOLD:x=(w-tw)/2:y=360:alpha='$(fade_alpha 0.3 0.8 5)',
drawtext=fontfile=$SERIF:textfile=$W/end2.txt:fontsize=180:fontcolor=$CREAM:x=(w-tw)/2:y=430:alpha='$(fade_alpha 0.8 1.0 5)',
drawtext=fontfile=$LIGHT:textfile=$W/end3.txt:fontsize=30:fontcolor=$CREAM@0.75:x=(w-tw)/2:y=680:alpha='$(fade_alpha 1.6 0.8 5)'
" "${ENC[@]}" "$W/s5_end.mp4"

# ---------- 4. Join with transitions + sound effects ----------
# Lengths: title 6, chapter 3.5, clips 4 each, end 5.
# Offsets: fadeblack@5 (1.0), circleopen@7.7 (0.8), smoothleft@11.1 (0.6), zoomin@14.4 (0.7), fade@17.4 (1.0)
ffmpeg -y -loglevel error \
  -i title_card_sample.mp4 -i "$W/s1_chapter.mp4" -i "$W/s2_clip01.mp4" -i "$W/s3_clip05.mp4" \
  -i "$W/s4_clip14.mp4" -i "$W/s5_end.mp4" -filter_complex "
[0:v]fps=30,settb=AVTB,format=yuv420p[v0];[1:v]fps=30,settb=AVTB,format=yuv420p[v1];
[2:v]fps=30,settb=AVTB,format=yuv420p[v2];[3:v]fps=30,settb=AVTB,format=yuv420p[v3];
[4:v]fps=30,settb=AVTB,format=yuv420p[v4];[5:v]fps=30,settb=AVTB,format=yuv420p[v5];
[v0][v1]xfade=transition=fadeblack:duration=1:offset=5[x1];
[x1][v2]xfade=transition=circleopen:duration=0.8:offset=7.7[x2];
[x2][v3]xfade=transition=smoothleft:duration=0.6:offset=11.1[x3];
[x3][v4]xfade=transition=zoomin:duration=0.7:offset=14.4[x4];
[x4][v5]xfade=transition=fade:duration=1:offset=17.4,format=yuv420p[vout]" \
  -map "[vout]" "${ENC[@]}" "$W/video.mp4"

# Sound effects placed on the timeline: name, start (ms), volume
SFX=(impact 450 0.9  sparkle 600 0.55  whoosh 5050 0.35  pop 5900 0.4
     whoosh 7650 0.6  pop 8450 0.45  whoosh 10950 0.6  pop 11850 0.45
     shutter 12880 0.8  whoosh 14300 0.6  pop 15150 0.45  impact 18150 0.8  sparkle 18300 0.6)
args=(); fl=""; mix=""; n=0
for ((i=0; i<${#SFX[@]}; i+=3)); do
  args+=(-i "sfx/${SFX[i]}.wav")
  fl+="[$n:a]adelay=${SFX[i+1]}|${SFX[i+1]},volume=${SFX[i+2]}[a$n];"; mix+="[a$n]"; n=$((n+1))
done
ffmpeg -y -loglevel error "${args[@]}" -filter_complex \
  "${fl}${mix}amix=inputs=$n:normalize=0:duration=longest,apad=whole_dur=22.4,atrim=0:22.4,afade=t=out:st=21.4:d=1,alimiter=limit=0.9[aout]" \
  -map "[aout]" "$W/sfx_track.wav"

ffmpeg -y -loglevel error -i "$W/video.mp4" -i "$W/sfx_track.wav" -c:v copy -c:a aac -b:a 192k \
  -shortest -movflags +faststart style_demo.mp4
echo "done: style_demo.mp4"
