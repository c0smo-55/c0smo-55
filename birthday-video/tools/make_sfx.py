"""Synthesize the sound effects used in the birthday video (no downloads, no licensing issues).

Usage: python3 make_sfx.py <output_dir>
"""
import sys
import wave
from pathlib import Path

import numpy as np

SR = 48000
rng = np.random.default_rng(7)


def t_axis(dur):
    return np.arange(int(SR * dur)) / SR


def lowpass_sweep(x, cutoffs):
    """One-pole low-pass whose cutoff (Hz) changes per sample."""
    a = np.exp(-2 * np.pi * cutoffs / SR)
    y = np.empty_like(x)
    prev = 0.0
    for i in range(len(x)):
        prev = (1 - a[i]) * x[i] + a[i] * prev
        y[i] = prev
    return y


def write(path, left, right=None):
    right = left if right is None else right
    stereo = np.stack([left, right], axis=1)
    peak = np.max(np.abs(stereo)) or 1.0
    stereo = stereo / peak * 0.89  # about -1 dBFS
    data = (stereo * 32767).astype("<i2").tobytes()
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data)


def whoosh(dur=0.9):
    t = t_axis(dur)
    p = t / dur
    noise = rng.standard_normal(len(t))
    # Cutoff rises then falls, like something rushing past.
    cutoff = 300 + 5200 * np.sin(np.pi * p) ** 2
    band = lowpass_sweep(noise, cutoff) - lowpass_sweep(noise, cutoff * 0.25)
    env = np.sin(np.pi * p) ** 1.6
    sig = band * env
    pan = p  # left to right
    return sig * np.cos(pan * np.pi / 2), sig * np.sin(pan * np.pi / 2)


def sparkle(dur=2.2):
    t = t_axis(dur)
    sig = np.zeros_like(t)
    notes = [1568.0, 2093.0, 2637.0, 3136.0, 4186.0, 3136.0, 5274.0]
    for i, f in enumerate(notes):
        start = 0.07 * i
        tt = np.clip(t - start, 0, None)
        on = (t >= start).astype(float)
        tone = np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt)
        sig += on * tone * np.exp(-tt * 3.2) * (0.9 ** i)
    shimmer = lowpass_sweep(rng.standard_normal(len(t)), np.full(len(t), 9000.0))
    shimmer -= lowpass_sweep(shimmer, np.full(len(t), 4000.0))
    sig += 0.25 * shimmer * np.exp(-t * 2.5)
    l = sig * (1 + 0.15 * np.sin(2 * np.pi * 3 * t))
    r = sig * (1 - 0.15 * np.sin(2 * np.pi * 3 * t))
    return l, r


def impact(dur=1.6):
    t = t_axis(dur)
    freq = 38 + 50 * np.exp(-t * 10)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    body = np.sin(phase) * np.exp(-t * 2.8)
    thump = lowpass_sweep(rng.standard_normal(len(t)), np.full(len(t), 600.0)) * np.exp(-t * 25)
    sig = body + 1.5 * thump
    return sig, sig


def shutter(dur=0.3):
    t = t_axis(dur)
    sig = np.zeros_like(t)
    for start, decay, amp in [(0.0, 180, 1.0), (0.09, 140, 0.8)]:
        tt = np.clip(t - start, 0, None)
        click = rng.standard_normal(len(t)) * np.exp(-tt * decay) * (t >= start)
        sig += amp * (click - lowpass_sweep(click, np.full(len(t), 1500.0)))
    return sig, sig


def pop(dur=0.18):
    t = t_axis(dur)
    freq = 900 * np.exp(-t * 18) + 250
    phase = 2 * np.pi * np.cumsum(freq) / SR
    sig = np.sin(phase) * np.exp(-t * 30)
    return sig, sig


if __name__ == "__main__":
    out = Path(sys.argv[1] if len(sys.argv) > 1 else "sfx")
    out.mkdir(parents=True, exist_ok=True)
    for name, fn in [("whoosh", whoosh), ("sparkle", sparkle), ("impact", impact),
                     ("shutter", shutter), ("pop", pop)]:
        write(out / f"{name}.wav", *fn())
        print("wrote", out / f"{name}.wav")
