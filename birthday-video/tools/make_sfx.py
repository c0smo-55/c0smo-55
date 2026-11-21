"""Synthesize the sound-effect library for the birthday video (original sounds, no licensing issues).

Several variants of each effect so nothing repeats; everything gets a short stereo room reverb.
Usage: python3 make_sfx.py <output_dir>
"""
import sys
import wave
from pathlib import Path

import numpy as np

SR = 48000


def t_axis(dur):
    return np.arange(int(SR * dur)) / SR


def onepole(x, cutoffs):
    cutoffs = np.broadcast_to(cutoffs, x.shape)
    a = np.exp(-2 * np.pi * cutoffs / SR)
    y = np.empty_like(x)
    prev = 0.0
    for i in range(len(x)):
        prev = (1 - a[i]) * x[i] + a[i] * prev
        y[i] = prev
    return y


def bandpass(x, lo, hi):
    return onepole(x, hi) - onepole(x, lo)


def reverb(l, r, mix=0.25, size=1.0, seed=0):
    """Cheap stereo room: a cloud of decaying, filtered early reflections."""
    rng = np.random.default_rng(seed)
    tail = int(SR * 1.2 * size)
    out_l = np.concatenate([l, np.zeros(tail)])
    out_r = np.concatenate([r, np.zeros(tail)])
    wet_l = np.zeros_like(out_l)
    wet_r = np.zeros_like(out_r)
    src = (l + r) / 2
    for k in range(140):
        d = int(SR * (0.012 + rng.random() * 0.9 * size))
        g = 0.22 * np.exp(-d / (SR * 0.35 * size)) * (0.6 + 0.4 * rng.random())
        tgt = wet_l if k % 2 else wet_r
        tgt[d:d + len(src)] += g * src
    wet_l = onepole(wet_l, 5000.0)
    wet_r = onepole(wet_r, 5000.0)
    return out_l + mix * wet_l, out_r + mix * wet_r


def write(path, l, r=None, peak_db=-1.0, verb=0.22, size=1.0):
    r = l if r is None else r
    if verb:
        l, r = reverb(l, r, verb, size, seed=hash(path.name) % 1000)
    st = np.stack([l, r], axis=1)
    # Trim trailing silence.
    loud = np.where(np.max(np.abs(st), axis=1) > 1e-4 * np.max(np.abs(st)))[0]
    st = st[: loud[-1] + 1] if len(loud) else st
    fade = min(len(st), int(SR * 0.02))
    st[-fade:] *= np.linspace(1, 0, fade)[:, None]
    st = st / (np.max(np.abs(st)) or 1) * 10 ** (peak_db / 20)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((st * 32767).astype("<i2").tobytes())


def pan(sig, p):
    p = np.clip(p, 0, 1)
    return sig * np.cos(p * np.pi / 2), sig * np.sin(p * np.pi / 2)


def whoosh(rng, dur, lo, hi, direction=1, peak=0.5, tone=0.0):
    """Air swish; `peak` = where the loudest point sits (0..1). Peak time is used for syncing."""
    t = t_axis(dur)
    p = t / dur
    shape = np.where(p < peak, (p / peak) ** 2.2, ((1 - p) / (1 - peak)) ** 1.4)
    n = rng.standard_normal(len(t))
    cut = lo + (hi - lo) * shape
    sig = bandpass(n, cut * 0.18, cut) * shape
    if tone:
        f = 180 + 500 * shape
        sig += tone * np.sin(2 * np.pi * np.cumsum(f) / SR) * shape
    pp = p if direction > 0 else 1 - p
    return pan(sig, 0.15 + 0.7 * pp)


def riser(rng, dur=2.0):
    """Builds tension and ends abruptly on the hit (sync the END to the reveal)."""
    t = t_axis(dur)
    p = t / dur
    n = rng.standard_normal(len(t))
    sig = bandpass(n, 200 + 2500 * p ** 2, 800 + 9000 * p ** 2) * p ** 2.5
    f = 220 * 2 ** (2 * p)
    sig += 0.25 * (np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)) * p ** 3
    sig[-int(SR * 0.01):] *= np.linspace(1, 0, int(SR * 0.01))
    trem = 1 + 0.25 * np.sin(2 * np.pi * (4 + 12 * p) * t)
    return pan(sig * trem, 0.5)


def bell(freq, dur=2.5, bright=1.0):
    t = t_axis(dur)
    partials = [(1, 1.0, 1.6), (2.0, 0.45 * bright, 2.6), (3.01, 0.25 * bright, 3.8), (4.2, 0.12 * bright, 5.5)]
    sig = sum(a * np.sin(2 * np.pi * freq * m * t) * np.exp(-t * d) for m, a, d in partials)
    attack = np.minimum(1, t / 0.003)
    return sig * attack


# D major pentatonic, high register: friendly, "magical", never clashes with pop songs in D/G/A.
PENTA = [587.3, 659.3, 740.0, 880.0, 987.8, 1174.7, 1318.5, 1480.0, 1760.0, 1975.5]


def chime_run(notes, gap, dur=2.6, spread=0.6):
    total = gap * len(notes) + dur
    l = np.zeros(int(SR * total))
    r = np.zeros_like(l)
    for i, f in enumerate(notes):
        b = bell(f, dur, 0.8)
        s = int(SR * gap * i)
        pl, pr = pan(b, 0.5 + spread * (i / max(1, len(notes) - 1) - 0.5))
        l[s:s + len(b)] += pl * (0.92 ** i)
        r[s:s + len(b)] += pr * (0.92 ** i)
    return l, r


def glitter(rng, dur=1.8, density=60):
    t = t_axis(dur)
    l = np.zeros(len(t))
    r = np.zeros(len(t))
    for _ in range(density):
        s = int(rng.random() ** 1.6 * (len(t) - SR * 0.4))
        f = rng.choice(PENTA) * rng.choice([1, 2])
        b = bell(f, 0.4, 0.3) * (0.25 + 0.5 * rng.random()) * (1 - s / len(t))
        pl, pr = pan(b, rng.random())
        l[s:s + len(b)] += pl
        r[s:s + len(b)] += pr
    return l, r


def sub_boom(dur=2.0, f0=55):
    t = t_axis(dur)
    f = f0 + 70 * np.exp(-t * 14)
    sig = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    return sig, sig


def shutter(rng, variant=0):
    dur = 0.35
    t = t_axis(dur)
    sig = np.zeros(len(t))
    hits = [(0.0, 220, 1.0), (0.075, 160, 0.75)] if variant == 0 else [(0.0, 260, 1.0), (0.045, 200, 0.5), (0.11, 150, 0.8)]
    for st, dec, amp in hits:
        tt = np.clip(t - st, 0, None)
        n = rng.standard_normal(len(t)) * np.exp(-tt * dec) * (t >= st)
        sig += amp * bandpass(n, 900, 9000)
        sig += amp * 0.4 * np.sin(2 * np.pi * 2200 * tt) * np.exp(-tt * 400) * (t >= st)
    return pan(sig, 0.5)


def popper(rng):
    """Party popper: sharp crack + crinkly paper confetti falling."""
    dur = 1.6
    t = t_axis(dur)
    crack = bandpass(rng.standard_normal(len(t)), 300, 7000) * np.exp(-t * 70)
    crack += 0.8 * np.sin(2 * np.pi * np.cumsum(140 * np.exp(-t * 20) + 60) / SR) * np.exp(-t * 30)
    crinkle = np.zeros(len(t))
    for _ in range(260):
        s = int((0.03 + rng.random() ** 1.3 * 1.3) * SR)
        ln = int(SR * 0.004)
        if s + ln < len(t):
            crinkle[s:s + ln] += rng.standard_normal(ln) * (0.3 + rng.random()) * np.exp(-s / SR * 1.8)
    crinkle = bandpass(crinkle, 1500, 11000)
    l = crack + 0.5 * crinkle
    r = crack + 0.5 * np.roll(crinkle, 400)
    return l, r


def tick(freq=2400):
    t = t_axis(0.12)
    sig = np.sin(2 * np.pi * freq * t) * np.exp(-t * 90) + 0.3 * np.sin(2 * np.pi * freq * 2.7 * t) * np.exp(-t * 140)
    return sig, sig


def soft_pop(freq):
    t = t_axis(0.2)
    f = freq * (1 + 1.2 * np.exp(-t * 60))
    sig = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 28) * np.minimum(1, t / 0.002)
    return sig, sig


if __name__ == "__main__":
    out = Path(sys.argv[1] if len(sys.argv) > 1 else "sfx")
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob("*.wav"):
        old.unlink()
    rng = np.random.default_rng(17)
    lib = {}
    # Whooshes: different lengths, colours, directions. Peak sits at 50% of the file.
    specs = [(0.55, 400, 6000, 1, 0.0), (0.7, 300, 4500, -1, 0.0), (0.9, 250, 7000, 1, 0.15),
             (0.5, 600, 9000, -1, 0.0), (1.1, 200, 3500, 1, 0.25), (0.8, 350, 8000, -1, 0.1)]
    for i, (d, lo, hi, dr, tone) in enumerate(specs, 1):
        lib[f"whoosh_{i}"] = (whoosh(rng, d, lo, hi, dr, 0.5, tone), dict(verb=0.18))
    lib["riser_2s"] = (riser(rng, 2.0), dict(verb=0.15))
    lib["riser_1s"] = (riser(rng, 1.0), dict(verb=0.15))
    lib["name_reveal"] = (chime_run([PENTA[i] for i in (0, 2, 3, 5, 7, 9)], 0.11), dict(verb=0.35, size=1.4))
    lib["name_reveal_end"] = (chime_run([PENTA[i] for i in (9, 7, 5, 6, 3, 2, 0)], 0.13), dict(verb=0.35, size=1.4))
    lib["chime_up"] = (chime_run([PENTA[i] for i in (3, 5, 7)], 0.08), dict(verb=0.3))
    lib["chime_down"] = (chime_run([PENTA[i] for i in (8, 6, 4)], 0.08), dict(verb=0.3))
    lib["chime_single"] = (pan(bell(PENTA[5], 2.5, 0.7), 0.5), dict(verb=0.35))
    for i in (1, 2, 3):
        lib[f"glitter_{i}"] = (glitter(rng, 1.2 + 0.4 * i, 30 + 15 * i), dict(verb=0.3))
    lib["boom_1"] = (sub_boom(2.0, 50), dict(verb=0.1))
    lib["boom_2"] = (sub_boom(1.5, 62), dict(verb=0.1))
    lib["shutter_1"] = (shutter(rng, 0), dict(verb=0.04, size=0.4))
    lib["shutter_2"] = (shutter(rng, 1), dict(verb=0.04, size=0.4))
    lib["popper"] = (popper(rng), dict(verb=0.2))
    for i, f in enumerate((520, 660, 780, 880), 1):
        lib[f"pop_{i}"] = (soft_pop(f), dict(verb=0.2, size=0.6))
    lib["tick"] = (tick(), dict(verb=0.15, size=0.5))
    # Sync point (seconds into the file) = the moment that should land on the visual event.
    sync = {f"whoosh_{i}": specs[i - 1][0] * 0.5 for i in range(1, 7)}
    sync.update({"riser_2s": 2.0, "riser_1s": 1.0})
    import json
    for name, ((l, r), kw) in lib.items():
        write(out / f"{name}.wav", l, r, **kw)
    (out / "sync.json").write_text(json.dumps({n: round(sync.get(n, 0.0), 4) for n in lib}, indent=1))
    print("wrote", len(lib), "sounds")
