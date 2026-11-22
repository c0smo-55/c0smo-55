// After-Effects style finishing layer: custom CSS transitions (no WebGL), fairy-dust particles,
// anamorphic lens flares, bloom and film grain.
import React from 'react';
import {AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Zoom-blur: outgoing shot punches in and blurs out, incoming settles from a blurred zoom.
const ZoomBlurComp = ({children, presentationDirection, presentationProgress, passedProps}) => {
  const p = ease(presentationProgress);
  const strength = passedProps.strength ?? 1;
  const entering = presentationDirection === 'entering';
  const scale = entering ? interpolate(p, [0, 1], [1 + 0.35 * strength, 1]) : interpolate(p, [0, 1], [1, 1 + 0.45 * strength]);
  const blur = entering ? interpolate(p, [0, 1], [24 * strength, 0]) : interpolate(p, [0, 1], [0, 24 * strength]);
  const opacity = entering ? interpolate(p, [0, 0.55, 1], [0, 1, 1]) : interpolate(p, [0, 0.45, 1], [1, 1, 0]);
  const bright = entering ? interpolate(p, [0, 1], [1.6, 1]) : interpolate(p, [0, 1], [1, 1.6]);
  return (
    <AbsoluteFill style={{opacity, scale: String(scale), filter: `blur(${blur}px) brightness(${bright})`}}>{children}</AbsoluteFill>
  );
};
export const zoomBlur = (props = {}) => ({component: ZoomBlurComp, props});

// Flash: bright white bloom through the cut (camera-flash feel).
const FlashComp = ({children, presentationDirection, presentationProgress}) => {
  const p = presentationProgress;
  const entering = presentationDirection === 'entering';
  const opacity = entering ? interpolate(p, [0.45, 0.55], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
  const glow = Math.sin(Math.PI * p);
  return (
    <AbsoluteFill style={{opacity, filter: `brightness(${1 + 2.2 * glow}) saturate(${1 - 0.4 * glow})`,
      scale: String(1 + 0.05 * glow)}}>{children}</AbsoluteFill>
  );
};
export const flash = (props = {}) => ({component: FlashComp, props});

// Dreamy: soft blur cross-dissolve with a gentle drift.
const DreamyComp = ({children, presentationDirection, presentationProgress}) => {
  const p = ease(presentationProgress);
  const entering = presentationDirection === 'entering';
  const opacity = entering ? p : 1 - p;
  const blur = 14 * Math.sin(Math.PI * p);
  const x = entering ? interpolate(p, [0, 1], [60, 0]) : interpolate(p, [0, 1], [0, -60]);
  return <AbsoluteFill style={{opacity, filter: `blur(${blur}px)`, translate: `${x}px 0px`}}>{children}</AbsoluteFill>;
};
export const dreamy = (props = {}) => ({component: DreamyComp, props});

// Anamorphic lens flare streak that sweeps across at a cut.
export const LensFlare = ({at = 0, dur = 18, y = 0.42, seed = 0}) => {
  const frame = useCurrentFrame() - at;
  const {width} = useVideoConfig();
  if (frame < 0 || frame > dur) return null;
  const p = frame / dur;
  const o = Math.sin(Math.PI * p);
  const x = interpolate(p, [0, 1], [-0.2, 1.2]) * width;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen', opacity: o}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: `${y * 100}%`, height: 6, marginTop: -3,
        background: `radial-gradient(ellipse 30% 100% at ${x}px 50%, rgba(170,210,255,1), rgba(80,140,255,0.5) 40%, transparent 75%)`,
        filter: 'blur(2px)'}} />
      <div style={{position: 'absolute', left: x - 170, top: `calc(${y * 100}% - 170px)`, width: 340, height: 340, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.95), rgba(150,200,255,0.5) 18%, rgba(80,130,255,0.15) 45%, transparent 70%)'}} />
      {[0.35, 0.6, 0.85].map((k, i) => (
        <div key={i} style={{position: 'absolute', left: x + (width / 2 - x) * k * 2 - 30, top: `calc(${y * 100}% + ${(i - 1) * 50 + seed * 7}px)`,
          width: 60 - i * 12, height: 60 - i * 12, borderRadius: '50%', border: '2px solid rgba(160,200,255,0.5)',
          background: 'rgba(120,170,255,0.12)'}} />
      ))}
    </AbsoluteFill>
  );
};

// Fairy dust: small glints drifting up and twinkling over footage.
export const FairyDust = ({count = 26, seed = 'fd', strength = 1}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen'}}>
      {new Array(count).fill(0).map((_, i) => {
        const r = (k) => random(`${seed}-${i}-${k}`);
        const speed = 0.4 + r('v') * 1.1;
        const y = ((r('y') * height - frame * speed) % height + height) % height;
        const x = r('x') * width + Math.sin(frame / (25 + r('w') * 30) + i) * 25;
        const tw = Math.pow(Math.max(0, Math.sin(frame / (6 + r('t') * 10) + r('p') * 6)), 3);
        const s = 2 + r('s') * 4;
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%',
            background: '#FFFFFF', opacity: (0.25 + 0.75 * tw) * 0.8 * strength,
            boxShadow: `0 0 ${6 + 14 * tw}px ${2 + 4 * tw}px rgba(160,205,255,${0.7 * tw})`}} />
        );
      })}
    </AbsoluteFill>
  );
};

// Bloom: blurred, brightened copy of an image layered with screen blend.
export const Bloom = ({src, strength = 0.35}) => (
  <AbsoluteFill style={{mixBlendMode: 'screen', opacity: strength, pointerEvents: 'none'}}>
    <Img src={src} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(28px) brightness(1.3) saturate(1.2)'}} />
  </AbsoluteFill>
);

// Film grain + soft cinematic grade over everything.
export const Finish = () => {
  const frame = useCurrentFrame();
  const ox = Math.floor(random(`gx${frame}`) * 512);
  const oy = Math.floor(random(`gy${frame}`) * 512);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{backgroundImage: `url(${staticFile('grain.png')})`, backgroundPosition: `${ox}px ${oy}px`,
        mixBlendMode: 'overlay', opacity: 0.09}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(40,80,170,0.10), transparent 30%, transparent 70%, rgba(10,20,60,0.18))',
        mixBlendMode: 'soft-light'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 60%, rgba(5,10,30,0.35) 100%)'}} />
    </AbsoluteFill>
  );
};

// Papa's camera: a soft viewfinder overlay (REC dot, corner brackets, date) so it feels like we're seeing through his lens.
export const Viewfinder = ({dur = 3.5, date = '07.11.2026'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const end = Math.round(dur * fps);
  const o = interpolate(frame, [0, 10, end - 12, end], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (o <= 0) return null;
  const blink = Math.floor(frame / 15) % 2 === 0 ? 1 : 0.25;
  const c = 'rgba(255,255,255,0.85)';
  const corner = (pos) => ({position: 'absolute', width: 70, height: 70, ...pos});
  const sec = Math.floor(frame / fps);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: o, fontFamily: 'Montserrat, sans-serif', fontWeight: 500, color: c}}>
      <div style={{...corner({left: 70, top: 70}), borderLeft: `3px solid ${c}`, borderTop: `3px solid ${c}`}} />
      <div style={{...corner({right: 70, top: 70}), borderRight: `3px solid ${c}`, borderTop: `3px solid ${c}`}} />
      <div style={{...corner({left: 70, bottom: 70}), borderLeft: `3px solid ${c}`, borderBottom: `3px solid ${c}`}} />
      <div style={{...corner({right: 70, bottom: 70}), borderRight: `3px solid ${c}`, borderBottom: `3px solid ${c}`}} />
      <div style={{position: 'absolute', left: 110, top: 100, display: 'flex', alignItems: 'center', gap: 12, fontSize: 30, letterSpacing: '0.15em'}}>
        <div style={{width: 18, height: 18, borderRadius: 9, background: '#FF4D5E', opacity: blink}} />REC
      </div>
      <div style={{position: 'absolute', right: 110, top: 100, fontSize: 28, letterSpacing: '0.15em'}}>{date}</div>
      <div style={{position: 'absolute', right: 110, bottom: 100, fontSize: 26, letterSpacing: '0.15em'}}>00:{String(sec).padStart(2, '0')}</div>
      <div style={{position: 'absolute', left: 110, bottom: 100, fontSize: 24, letterSpacing: '0.3em'}}>PAPA'S CAMERA</div>
    </AbsoluteFill>
  );
};

// A short handwritten note from Papa over the footage.
export const PapaNote = ({text, at = 0.5, dur = 3.5}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const a = Math.round(at * fps);
  const end = a + Math.round(dur * fps);
  const o = interpolate(frame, [a, a + 14, end - 12, end], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (o <= 0) return null;
  const reveal = interpolate(frame, [a, a + 30], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{pointerEvents: 'none', justifyContent: 'flex-start', alignItems: 'flex-end', padding: '150px 130px 0 0', opacity: o}}>
      <div style={{maxWidth: 820, textAlign: 'right'}}>
        <div style={{fontFamily: '"Great Vibes", cursive', fontSize: 78, lineHeight: 1.2, color: '#FFFFFF', paddingBottom: 12,
          clipPath: `inset(-20% ${100 - reveal}% -40% 0)`, textShadow: '0 2px 18px rgba(0,0,0,0.75), 0 0 30px rgba(59,125,216,0.6)'}}>{text}</div>
        <div style={{fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: 24, letterSpacing: '0.35em', color: 'rgba(220,235,255,0.9)',
          textShadow: '0 2px 10px rgba(0,0,0,0.7)', opacity: interpolate(frame, [a + 24, a + 36], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>— PAPA</div>
      </div>
    </AbsoluteFill>
  );
};
