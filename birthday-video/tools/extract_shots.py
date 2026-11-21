"""Cut every shot in the edit list out of the 4K HDR originals into 1080p SDR files Remotion can play.

Usage: python3 extract_shots.py   (reads remotion/src/edl.json, writes remotion/public/shots/)
Skips shots that already exist.
"""
import json
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = Path("/home/user/footage/Dicky")
OUT = ROOT / "remotion/public/shots"
OUT.mkdir(parents=True, exist_ok=True)

# HLG HDR -> SDR Rec.709 with gentle tone mapping, then a touch of warmth/contrast for indoor light.
TM = ("zscale=w=1920:h=1080:f=spline36,zscale=t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,"
      "tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p,"
      "eq=contrast=1.05:saturation=1.12:gamma=1.02")


def shot_name(s):
    return f"c{s['clip']:02d}_{s['in']:07.2f}_{s.get('speed', 1)}"


def aac_index(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries",
                          "stream=index,codec_name", "-of", "csv=p=0", str(path)], capture_output=True, text=True).stdout
    for line in out.splitlines():
        idx, codec = line.split(",")[:2]
        if codec == "aac":
            return idx
    return None


def extract(s):
    name = shot_name(s)
    mp4 = OUT / f"{name}.mp4"
    src = SRC / f"{s['clip']}.MOV"
    length = s["dur"] * s.get("speed", 1) + 0.6
    if not mp4.exists():
        a = aac_index(src)
        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-threads", "2", "-ss", str(s["in"]), "-t", f"{length:.3f}",
               "-i", str(src), "-map", "0:v:0"] + (["-map", f"0:{a}"] if a else []) + [
               "-vf", TM, "-r", "30", "-c:v", "libx264", "-preset", "fast", "-crf", "16", "-g", "15",
               "-c:a", "aac", "-b:a", "192k", "-ac", "2", "-movflags", "+faststart", str(mp4)]
        subprocess.run(cmd, check=True)
    pol = s.get("fx", {}).get("polaroid")
    if pol:
        jpg = OUT / f"{name}_freeze.jpg"
        if not jpg.exists():
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(pol["at"] * s.get("speed", 1)), "-i", str(mp4),
                            "-frames:v", "1", "-q:v", "2", str(jpg)], check=True)
    return name


if __name__ == "__main__":
    edl = json.loads((ROOT / "remotion/src/edl.json").read_text())
    shots = [it for it in edl["items"] if it["type"] == "shot"]
    with ThreadPoolExecutor(max_workers=2) as ex:
        for n in ex.map(extract, shots):
            print("ok", n, flush=True)
    sys.exit(0)
