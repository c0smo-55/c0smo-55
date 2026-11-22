// "Viral YouTube" style motion graphics: freeze-frame name tags, emoji bursts, screen shake,
// countdowns, punchy captions, cheer meter, chapter progress bar, photo wall.
import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Butterflies, C, F, Sfx, clamp} from './fx';

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
        {label}
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
export const Punch = ({text, emoji, at = 0, dur = 2, y = 90}) => {
  const frame = useCurrentFrame() - at;
  const {fps} = useVideoConfig();
  if (frame < 0 || frame > dur * fps) return null;
  const s = spring({frame, fps, config: {damping: 9, mass: 0.5, stiffness: 200}});
  const out = interpolate(frame, [dur * fps - 8, dur * fps], [1, 0], clamp);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', opacity: out,
        transform: `translateY(${(1 - s) * 30}px)`}}>
        <span style={{fontFamily: F.sans, fontWeight: 800, fontSize: 84, color: '#FFFFFF', textTransform: 'uppercase',
          letterSpacing: '0.12em', textShadow: '0 4px 24px rgba(0,0,0,0.65), 0 0 40px rgba(59,125,216,0.55)'}}>
          {text}
        </span>
        <div style={{width: 220 * s, height: 3, margin: '14px auto 0', background: `linear-gradient(90deg, transparent, ${C.sky}, transparent)`}} />

      </div>
      <Sfx name="tick" at={at} volume={0.25} />
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
export const CheerMeter = ({items, title = 'Who got the loudest cheer?'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const min = Math.min(...items.map((i) => i.db)) - 6;
  const max = Math.max(...items.map((i) => i.db));
  const sorted = [...items].sort((a, b) => b.db - a.db);
  const top = sorted[0].label;
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 40%, ${C.bgInner}, ${C.bgOuter})`, padding: '120px 200px'}}>
      <div style={{fontFamily: F.serif, fontStyle: 'italic', fontSize: 96, color: C.white,
        opacity: interpolate(frame, [0, 12], [0, 1], clamp)}}>{title}</div>
      <div style={{fontFamily: F.sans, fontSize: 28, letterSpacing: '0.35em', color: C.sky, margin: '10px 0 60px'}}>
        GOING BY HOW LOUD THE ROOM GOT IN THE VIDEOS
      </div>
      {items.map((it, i) => {
        const g = spring({frame: frame - 14 - i * 8, fps, config: {damping: 200}, durationInFrames: 40});
        const w = interpolate(it.db, [min, max], [0.15, 1]) * g;
        const win = it.label === top;
        const glow = win ? 0.6 + 0.4 * Math.sin(frame / 5) : 0;
        return (
          <div key={i} style={{display: 'flex', alignItems: 'center', marginBottom: 34}}>
            <div style={{width: 580, fontFamily: F.sans, fontWeight: 500, fontSize: 40, color: C.white, whiteSpace: 'nowrap'}}>
              {it.label}
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

const vid = (name) => staticFile(`shots/${name}.mp4`);

// Cold-open teaser: rapid best-moment cuts with white flash frames, then a title line.
export const Teaser = ({clips, line = 'Jesslyn turns 17'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  let t = 0;
  const seqs = clips.map((c, i) => {
    const d = Math.round(c.dur * fps);
    const el = (
      <Sequence key={i} from={t} durationInFrames={d} layout="none">
        <AbsoluteFill style={{transform: `scale(${1.04 + 0.04 * (i % 2)})`}}>
          <OffthreadVideo src={vid(c.name)} startFrom={Math.round((c.start || 0) * fps)} volume={c.vol ?? 0.5}
            style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </AbsoluteFill>
        <Sfx name={['whoosh_1', 'whoosh_3', 'whoosh_6', 'whoosh_4'][i % 4]} at={0} volume={0.3} />
      </Sequence>
    );
    t += d;
    return {el, at: t};
  });
  const end = t;
  const flashes = seqs.map((s) => interpolate(frame, [s.at - 2, s.at, s.at + 4], [0, 0.85, 0], clamp)).reduce((a, b) => Math.max(a, b), 0);
  const txt = spring({frame: frame - end, fps, config: {damping: 200}});
  return (
    <AbsoluteFill style={{backgroundColor: C.bgOuter}}>
      {seqs.map((s) => s.el)}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 50%, rgba(5,11,28,0.6) 100%)'}} />
      <AbsoluteFill style={{backgroundColor: 'white', opacity: flashes}} />
      {frame >= end && (
        <AbsoluteFill style={{backgroundColor: C.bgOuter, alignItems: 'center', justifyContent: 'center'}}>
          <div style={{fontFamily: F.serif, fontStyle: 'italic', fontSize: 92, color: C.white, opacity: txt,
            transform: `translateY(${(1 - txt) * 20}px)`, letterSpacing: '0.02em'}}>{line}</div>
          <Sfx name="boom_2" at={end} volume={0.6} />
          <Sfx name="chime_single" at={end + 4} volume={0.3} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// Animated "by the numbers" card.
export const Stats = ({items, title = 'Jesslyn\'s 17th'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 40%, ${C.bgInner}, ${C.bgOuter})`, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{fontFamily: F.sans, fontWeight: 500, fontSize: 30, letterSpacing: '0.45em', color: C.sky, marginBottom: 70,
        opacity: interpolate(frame, [0, 15], [0, 1], clamp)}}>{title.toUpperCase()}</div>
      <div style={{display: 'flex', gap: 110}}>
        {items.map((it, i) => {
          const g = spring({frame: frame - 10 - i * 10, fps, config: {damping: 200}, durationInFrames: 45});
          return (
            <div key={i} style={{textAlign: 'center', opacity: g, transform: `translateY(${(1 - g) * 40}px)`}}>
              <div style={{fontFamily: F.serif, fontStyle: 'italic', fontSize: 190, color: C.white, lineHeight: 1,
                textShadow: `0 0 40px ${C.royal}`}}>
                {Math.round(it.value * g)}{it.suffix || ''}
              </div>
              <div style={{width: 120 * g, height: 2, margin: '20px auto', background: C.sky}} />
              <div style={{fontFamily: F.sans, fontWeight: 500, fontSize: 30, letterSpacing: '0.25em', color: C.ice}}>{it.label.toUpperCase()}</div>
            </div>
          );
        })}
      </div>
      {items.map((_, i) => <Sfx key={i} name="tick" at={10 + i * 10} volume={0.3} />)}
    </AbsoluteFill>
  );
};

// Three clips side by side, sliding in one after another.
export const Triptych = ({clips, caption}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: C.bgOuter, flexDirection: 'row', gap: 14, padding: 14}}>
      {clips.map((c, i) => {
        const s = spring({frame: frame - i * 6, fps, config: {damping: 16}});
        return (
          <div key={i} style={{flex: 1, overflow: 'hidden', borderRadius: 10, transform: `translateY(${(1 - s) * (i % 2 ? -1100 : 1100)}px)`}}>
            <OffthreadVideo src={vid(c.name)} startFrom={Math.round((c.start || 0) * fps)} volume={i === 0 ? (c.vol ?? 0.6) : 0}
              style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${c.focus ?? 50}% 50%`}} />
          </div>
        );
      })}
      {caption && (
        <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 70, pointerEvents: 'none'}}>
          <div style={{fontFamily: F.sans, fontWeight: 800, fontSize: 70, letterSpacing: '0.14em', color: '#FFFFFF',
            textShadow: '0 4px 24px rgba(0,0,0,0.7)', opacity: interpolate(frame, [12, 24], [0, 1], clamp)}}>{caption.toUpperCase()}</div>
        </AbsoluteFill>
      )}
      {clips.map((_, i) => <Sfx key={i} name={['whoosh_4', 'whoosh_1', 'whoosh_6'][i]} at={i * 6 + 3} volume={0.3} />)}
    </AbsoluteFill>
  );
};

// Picture-in-picture reaction window.
export const PiP = ({name, start = 0, label, at = 0, corner = 'right'}) => {
  const frame = useCurrentFrame() - at;
  const {fps} = useVideoConfig();
  if (frame < 0) return null;
  const s = spring({frame, fps, config: {damping: 15}});
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <Sequence from={at} layout="none">
        <div style={{position: 'absolute', top: 70, [corner]: 70, width: 520, height: 292, borderRadius: 18, overflow: 'hidden',
          border: `4px solid ${C.ice}`, boxShadow: '0 20px 50px rgba(0,0,0,0.55)', transform: `scale(${s})`,
          transformOrigin: corner === 'right' ? 'top right' : 'top left'}}>
          <OffthreadVideo src={vid(name)} startFrom={Math.round(start * fps)} volume={0}
            style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          {label && <div style={{position: 'absolute', left: 14, bottom: 10, fontFamily: F.sans, fontWeight: 800, fontSize: 24,
            letterSpacing: '0.2em', color: '#FFFFFF', textShadow: '0 2px 10px rgba(0,0,0,0.8)'}}>{label.toUpperCase()}</div>}
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};

// Scrapbook: candid snapshots drop onto a board as taped polaroids, one per beat, with handwritten captions.
// `live: true` polaroids play their clip instead of a still.
export const Scrapbook = ({title, shots, beat = 0.75}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const pan = interpolate(frame, [0, durationInFrames], [1.02, 1.1]);
  const drift = interpolate(frame, [0, durationInFrames], [0, -40]);
  const titleIn = spring({frame, fps, config: {damping: 200}});
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 40%, #1B3F80, ${C.bgOuter} 75%)`, overflow: 'hidden'}}>
      {/* faint paper grid */}
      <AbsoluteFill style={{opacity: 0.07, backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
        backgroundSize: '60px 60px'}} />
      <AbsoluteFill style={{transform: `scale(${pan}) translateY(${drift}px)`}}>
        {shots.map((sh, i) => {
          const at = Math.round(10 + i * beat * fps);
          const t = frame - at;
          if (t < -2) return null;
          const s = spring({frame: t, fps, config: {damping: 12, mass: 0.8}});
          const r = (k) => random(`sb-${title}-${i}-${k}`);
          const rot = sh.rot ?? (r('r') - 0.5) * 14;
          const fromX = (r('fx') - 0.5) * 1400;
          const w = sh.w || 520;
          const flash = interpolate(t, [0, 2, 9], [0, 1, 0], clamp);
          return (
            <div key={i} style={{position: 'absolute', left: sh.x - w / 2, top: sh.y - w * 0.42,
              width: w, transform: `translate(${(1 - s) * fromX}px, ${(1 - s) * -900}px) rotate(${rot + (1 - s) * 35}deg) scale(${0.85 + 0.15 * s})`,
              zIndex: i}}>
              <div style={{background: '#FBFBF8', padding: `${w * 0.035}px ${w * 0.035}px ${w * 0.17}px`,
                boxShadow: '0 18px 40px rgba(0,0,0,0.55)', position: 'relative'}}>
                <div style={{width: '100%', aspectRatio: '16 / 10', overflow: 'hidden', position: 'relative', background: '#000'}}>
                  {sh.live ? (
                    <Sequence from={at} layout="none">
                      <OffthreadVideo src={vid(sh.name)} startFrom={Math.round((sh.start || 0) * fps)} volume={0}
                        style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${sh.focus ?? 50}% 40%`}} />
                    </Sequence>
                  ) : (
                    <Img src={staticFile(sh.img)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${sh.focus ?? 50}% 40%`,
                      filter: `brightness(${1 + flash * 0.8}) saturate(1.08)`}} />
                  )}
                  {sh.live && <div style={{position: 'absolute', top: 10, right: 12, display: 'flex', alignItems: 'center', gap: 6,
                    fontFamily: F.sans, fontWeight: 800, fontSize: 18, letterSpacing: '0.2em', color: '#fff'}}>
                    <div style={{width: 10, height: 10, borderRadius: 5, background: '#FF4D5E', opacity: 0.5 + 0.5 * Math.sin(frame / 4)}} />LIVE</div>}
                </div>
                <div style={{position: 'absolute', left: 0, right: 0, bottom: w * 0.025, textAlign: 'center', fontFamily: F.script,
                  fontSize: w * 0.11, color: '#1C3B70', opacity: interpolate(t, [10, 22], [0, 1], clamp)}}>{sh.caption}</div>
                {/* tape */}
                <div style={{position: 'absolute', top: -16, left: '50%', width: w * 0.3, height: 34, marginLeft: -w * 0.15,
                  background: 'rgba(170,205,255,0.55)', transform: `rotate(${(r('t') - 0.5) * 10}deg)`, boxShadow: '0 2px 6px rgba(0,0,0,0.2)'}} />
              </div>
              <Sfx name={i % 2 ? 'shutter_1' : 'shutter_2'} at={at} volume={0.45} />
              <Sfx name={['pop_1', 'pop_2', 'pop_3', 'pop_4'][i % 4]} at={at + 10} volume={0.2} />
            </div>
          );
        })}
      </AbsoluteFill>
      <Butterflies count={4} seed={`sb-${title}`} start={0} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 40, textAlign: 'center', opacity: titleIn, zIndex: 100,
        transform: `translateY(${(1 - titleIn) * -30}px)`}}>
        <span style={{fontFamily: F.script, fontSize: 110, color: C.white, padding: '0 60px', borderRadius: 80,
          background: 'radial-gradient(ellipse, rgba(5,11,28,0.75) 30%, rgba(5,11,28,0) 72%)',
          textShadow: '0 0 30px rgba(142,197,255,0.7), 0 4px 18px rgba(0,0,0,0.8)'}}>{title}</span>
      </div>
      <Sfx name="chime_up" at={4} volume={0.25} />
    </AbsoluteFill>
  );
};
