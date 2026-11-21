// "Viral YouTube" style motion graphics: freeze-frame name tags, emoji bursts, screen shake,
// countdowns, punchy captions, cheer meter, chapter progress bar, photo wall.
import React from 'react';
import {AbsoluteFill, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, F, Sfx, clamp} from './fx';

const EMOJI = '"Noto Color Emoji", sans-serif';

// Freeze frame with a hand-drawn circle, arrow and a bold label (call-out tag).
export const FreezeTag = ({img, label, emoji, x = 960, y = 500, r = 160, side = 'right'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({frame: frame - 4, fps, config: {damping: 10, mass: 0.6}});
  const circle = interpolate(frame, [0, 10], [0, 1], clamp);
  const zoom = interpolate(frame, [0, 8], [1, 1.06], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)});
  const lx = side === 'right' ? x + r + 140 : x - r - 140;
  const ly = y - r - 40;
  const circ = 2 * Math.PI * r;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: `${x}px ${y}px`}}>
        <Img src={img} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.55) brightness(0.8)'}} />
        {/* subject stays in full colour inside the circle */}
        <Img src={img} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
          clipPath: `circle(${r}px at ${x}px ${y}px)`}} />
      </AbsoluteFill>
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        <circle cx={x} cy={y} r={r} fill="none" stroke="#FFFFFF" strokeWidth={8} strokeDasharray={circ}
          strokeDashoffset={circ * (1 - circle)} strokeLinecap="round" transform={`rotate(-90 ${x} ${y})`}
          style={{filter: `drop-shadow(0 0 14px ${C.sky})`}} />
        <path d={`M ${side === 'right' ? x + r * 0.75 : x - r * 0.75} ${y - r * 0.75} Q ${(x + lx) / 2} ${ly - 60} ${lx} ${ly + 30}`}
          fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" strokeDasharray={600}
          strokeDashoffset={600 * (1 - interpolate(frame, [6, 16], [0, 1], clamp))} />
      </svg>
      <div style={{position: 'absolute', left: side === 'right' ? lx : undefined, right: side === 'left' ? 1920 - lx : undefined,
        top: Math.max(40, ly - 70), transform: `scale(${pop}) rotate(${(1 - pop) * -10 - 3}deg)`,
        transformOrigin: side === 'right' ? 'left center' : 'right center',
        background: '#FFFFFF', color: '#0B1F4A', padding: '14px 30px', borderRadius: 18,
        fontFamily: F.sans, fontWeight: 900, fontSize: 60, letterSpacing: '0.01em', whiteSpace: 'nowrap',
        boxShadow: `0 10px 0 ${C.royal}, 0 20px 50px rgba(0,0,0,0.45)`}}>
        {label} <span style={{fontFamily: EMOJI}}>{emoji}</span>
      </div>
      <Sfx name="tick" at={0} volume={0.35} />
      <Sfx name="pop_2" at={5} volume={0.45} />
    </AbsoluteFill>
  );
};

// Emojis that pop up and float away from a point.
export const EmojiBurst = ({emojis = ['🎉', '💙', '✨'], at = 0, x = 960, y = 700, count = 14, seed = 'e'}) => {
  const frame = useCurrentFrame() - at;
  if (frame < 0 || frame > 70) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {new Array(count).fill(0).map((_, i) => {
        const r = (k) => random(`${seed}-${i}-${k}`);
        const t = frame - r('d') * 8;
        if (t < 0) return null;
        const ang = -Math.PI / 2 + (r('a') - 0.5) * 2.2;
        const sp = 9 + r('v') * 12;
        const px = x + Math.cos(ang) * sp * t;
        const py = y + Math.sin(ang) * sp * t + 0.18 * t * t;
        const s = Math.min(1, t / 5) * (0.8 + r('s') * 0.8);
        return (
          <div key={i} style={{position: 'absolute', left: px, top: py, fontFamily: EMOJI, fontSize: 90,
            transform: `translate(-50%,-50%) scale(${s}) rotate(${(r('r') - 0.5) * 60 + t * (r('w') - 0.5) * 6}deg)`,
            opacity: interpolate(t, [45, 62], [1, 0], clamp)}}>
            {emojis[i % emojis.length]}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// Shake: wraps footage; strong for `len` frames from `at`, decaying.
export const shakeTransform = (frame, at, len = 14, amp = 18) => {
  const t = frame - at;
  if (t < 0 || t > len) return '';
  const k = 1 - t / len;
  return `translate(${Math.sin(t * 2.7) * amp * k}px, ${Math.cos(t * 3.3) * amp * 0.7 * k}px) rotate(${Math.sin(t * 2.1) * 0.6 * k}deg)`;
};

// Big punchy caption (bold white, blue outline) with an emoji; bounces in.
export const Punch = ({text, emoji, at = 0, dur = 2, y = 820}) => {
  const frame = useCurrentFrame() - at;
  const {fps} = useVideoConfig();
  if (frame < 0 || frame > dur * fps) return null;
  const s = spring({frame, fps, config: {damping: 9, mass: 0.5, stiffness: 200}});
  const out = interpolate(frame, [dur * fps - 8, dur * fps], [1, 0], clamp);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', opacity: out,
        transform: `scale(${s}) rotate(${(1 - s) * 6 - 1.5}deg)`}}>
        <span style={{fontFamily: F.sans, fontWeight: 900, fontSize: 118, color: '#FFFFFF', textTransform: 'uppercase',
          WebkitTextStroke: '10px #0B1F4A', paintOrder: 'stroke fill', letterSpacing: '0.02em',
          textShadow: `0 6px 0 ${C.royal}, 0 12px 40px rgba(0,0,0,0.55)`}}>
          {text} <span style={{fontFamily: EMOJI, WebkitTextStroke: 0}}>{emoji}</span>
        </span>
      </div>
      <Sfx name="pop_1" at={at} volume={0.4} />
    </AbsoluteFill>
  );
};

// 3-2-1 countdown, numbers slam in on each second.
export const Countdown = ({at = 0, step = 30}) => {
  const frame = useCurrentFrame() - at;
  const {fps} = useVideoConfig();
  if (frame < 0 || frame >= step * 3) return null;
  const n = 3 - Math.floor(frame / step);
  const f = frame % step;
  const s = spring({frame: f, fps, config: {damping: 11, mass: 0.6}});
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', pointerEvents: 'none'}}>
      <div style={{width: 420, height: 420, borderRadius: '50%', border: `10px solid ${C.ice}`, display: 'flex',
        alignItems: 'center', justifyContent: 'center', transform: `scale(${2 - s})`, opacity: s * interpolate(f, [step - 6, step], [1, 0.2], clamp),
        background: 'rgba(11,31,74,0.45)', boxShadow: `0 0 60px ${C.sky}`}}>
        <span style={{fontFamily: F.serif, fontStyle: 'italic', fontSize: 300, color: '#FFFFFF', lineHeight: 1}}>{n}</span>
      </div>
      {[0, 1, 2].map((k) => <Sfx key={k} name="tick" at={at + k * step} volume={0.5} />)}
    </AbsoluteFill>
  );
};

// Animated bar chart of the night's loudest cheers (values in dB from the real audio).
export const CheerMeter = ({items, title = 'Cheer-o-meter'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const min = Math.min(...items.map((i) => i.db)) - 6;
  const max = Math.max(...items.map((i) => i.db));
  const sorted = [...items].sort((a, b) => b.db - a.db);
  const top = sorted[0].label;
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 40%, ${C.bgInner}, ${C.bgOuter})`, padding: '120px 200px'}}>
      <div style={{fontFamily: F.serif, fontStyle: 'italic', fontSize: 96, color: C.white,
        opacity: interpolate(frame, [0, 12], [0, 1], clamp)}}>{title} <span style={{fontFamily: EMOJI}}>📣</span></div>
      <div style={{fontFamily: F.sans, fontSize: 28, letterSpacing: '0.35em', color: C.sky, margin: '10px 0 60px'}}>
        LOUDEST MOMENTS OF THE NIGHT (MEASURED FROM THE VIDEO)
      </div>
      {items.map((it, i) => {
        const g = spring({frame: frame - 14 - i * 8, fps, config: {damping: 200}, durationInFrames: 40});
        const w = interpolate(it.db, [min, max], [0.15, 1]) * g;
        const win = it.label === top;
        const glow = win ? 0.6 + 0.4 * Math.sin(frame / 5) : 0;
        return (
          <div key={i} style={{display: 'flex', alignItems: 'center', marginBottom: 34}}>
            <div style={{width: 430, fontFamily: F.sans, fontWeight: 500, fontSize: 40, color: C.white}}>
              <span style={{fontFamily: EMOJI}}>{it.emoji}</span> {it.label}
            </div>
            <div style={{flex: 1, height: 70, background: 'rgba(255,255,255,0.06)', borderRadius: 35, overflow: 'hidden'}}>
              <div style={{width: `${w * 100}%`, height: '100%', borderRadius: 35,
                background: win ? `linear-gradient(90deg, ${C.royal}, #8EC5FF, #FFFFFF)` : `linear-gradient(90deg, #2A4A8A, ${C.royal})`,
                boxShadow: win ? `0 0 ${40 * glow}px ${C.sky}` : 'none'}} />
            </div>
            <div style={{width: 160, textAlign: 'right', fontFamily: F.sans, fontSize: 38, color: win ? '#FFFFFF' : C.sky}}>
              {Math.round(interpolate(g, [0, 1], [0, 100 * interpolate(it.db, [min, max], [0.3, 1])]))}%
            </div>
          </div>
        );
      })}
      {items.map((_, i) => <Sfx key={i} name={`pop_${(i % 4) + 1}`} at={14 + i * 8} volume={0.3} />)}
      <Sfx name="chime_up" at={14 + items.length * 8 + 10} volume={0.35} />
    </AbsoluteFill>
  );
};

// Thin chapter progress bar shown at the top over footage.
export const ProgressBar = ({frame, total, chapters}) => (
  <div style={{position: 'absolute', left: 60, right: 60, top: 34, height: 5, background: 'rgba(255,255,255,0.18)', borderRadius: 3}}>
    <div style={{width: `${(frame / total) * 100}%`, height: '100%', background: `linear-gradient(90deg, ${C.royal}, ${C.ice})`, borderRadius: 3}} />
    {chapters.map((c, i) => (
      <div key={i} style={{position: 'absolute', left: `${(c.at / total) * 100}%`, top: -6, width: 17, height: 17, borderRadius: '50%',
        transform: 'translateX(-50%)', background: frame >= c.at ? C.ice : 'rgba(255,255,255,0.35)', boxShadow: frame >= c.at ? `0 0 12px ${C.sky}` : 'none'}} />
    ))}
  </div>
);

// Grid of freeze frames flying in for the finale.
export const PhotoWall = ({images}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cols = 4;
  return (
    <AbsoluteFill style={{background: C.bgOuter}}>
      {images.map((src, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const s = spring({frame: frame - i * 3, fps, config: {damping: 13}});
        const rot = (random(`pw${i}`) - 0.5) * 10;
        return (
          <div key={i} style={{position: 'absolute', left: 40 + col * 470, top: 40 + row * 340, width: 430, height: 300,
            background: '#FBFBF8', padding: 10, boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
            transform: `translateY(${(1 - s) * 900}px) rotate(${rot * s + (1 - s) * 40}deg) scale(${0.7 + 0.3 * s})`}}>
            <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
