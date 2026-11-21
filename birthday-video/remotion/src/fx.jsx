import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Img, continueRender, delayRender, interpolate, random, spring,
  staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import '@fontsource/great-vibes';
import '@fontsource/playfair-display/400.css';
import '@fontsource/playfair-display/400-italic.css';
import '@fontsource/playfair-display/700-italic.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource/montserrat/300.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';

export const C = {
  bgInner: '#16397A',
  bgOuter: '#050B1C',
  ice: '#CFE6FF',
  sky: '#8EC5FF',
  royal: '#3B7DD8',
  white: '#F5F9FF',
  silver: '#DCE6F2',
};
export const F = {
  script: '"Great Vibes", cursive',
  serif: '"Playfair Display", serif',
  soft: '"Cormorant Garamond", serif',
  sans: 'Montserrat, sans-serif',
};

// Block rendering until the web fonts are ready, so no frame shows a fallback font.
export const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    document.fonts.ready.then(() => continueRender(handle));
  }, [handle]);
};

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};

export const Background = ({glow = 1}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at 50% 45%, ${C.bgInner} 0%, #0B1F4A 45%, ${C.bgOuter} 100%)`,
      opacity: glow,
    }}
  />
);

// Soft out-of-focus party lights drifting upward.
export const Bokeh = ({count = 45, seed = 'b', strength = 1}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {new Array(count).fill(0).map((_, i) => {
        const r = (k) => random(`${seed}-${i}-${k}`);
        const size = 30 + r('s') * 150;
        const x = r('x') * width;
        const y = ((r('y') * (height + 300) - frame * (0.4 + r('v') * 1.2)) % (height + 300) + height + 300) % (height + 300) - 150;
        const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(frame / (18 + r('t') * 30) + r('p') * 6));
        const colors = [C.sky, C.ice, C.royal, '#FFFFFF'];
        return (
          <div
            key={i}
            style={{
              position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: '50%',
              background: `radial-gradient(circle, ${colors[i % 4]}cc 0%, ${colors[i % 4]}33 55%, transparent 70%)`,
              filter: `blur(${2 + r('b') * 6}px)`,
              opacity: twinkle * 0.55 * strength,
              mixBlendMode: 'screen',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// Confetti: mode "burst" explodes from a point, mode "rain" falls from the top.
export const Confetti = ({start = 0, count = 160, mode = 'burst', seed = 'c', origin = [960, 520]}) => {
  const frame = useCurrentFrame();
  const t = frame - start;
  if (t < 0) return null;
  const colors = [C.sky, C.white, C.royal, C.ice, '#7AA8FF', '#C0C8D6'];
  return (
    <AbsoluteFill style={{overflow: 'hidden', pointerEvents: 'none'}}>
      {new Array(count).fill(0).map((_, i) => {
        const r = (k) => random(`${seed}-${i}-${k}`);
        let x; let y;
        if (mode === 'burst') {
          const angle = -Math.PI / 2 + (r('a') - 0.5) * Math.PI * 1.6;
          const speed = 14 + r('v') * 26;
          const drag = Math.pow(0.965, t);
          const dist = (speed * (1 - drag)) / (1 - 0.965);
          x = origin[0] + Math.cos(angle) * dist + Math.sin(t / 9 + i) * 12;
          y = origin[1] + Math.sin(angle) * dist + 0.09 * t * t;
        } else {
          const delay = r('d') * 120;
          const tt = (t + delay) % 160;
          x = r('x') * 1920 + Math.sin(tt / 12 + i) * 40;
          y = -40 + tt * (7 + r('v') * 5);
        }
        const rot = t * (6 + r('r') * 14) * (r('dir') > 0.5 ? 1 : -1);
        const flip = Math.abs(Math.cos(t / (5 + r('f') * 6) + i));
        const w = 10 + r('w') * 12;
        const isCircle = r('shape') > 0.75;
        const fade = mode === 'burst' ? interpolate(t, [60, 110], [1, 0], clamp) : 1;
        return (
          <div
            key={i}
            style={{
              position: 'absolute', left: x, top: y, width: w, height: isCircle ? w : w * 0.45,
              borderRadius: isCircle ? '50%' : 2,
              background: colors[i % colors.length],
              transform: `rotate(${rot}deg) scaleY(${isCircle ? 1 : flip})`,
              opacity: fade,
              boxShadow: `0 0 8px ${colors[i % colors.length]}88`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// Twinkling four-point stars.
export const Sparkles = ({points, start = 0}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {points.map(([x, y, s, d], i) => {
        const t = frame - start - d;
        const scale = t < 0 ? 0 : Math.max(0, Math.sin((t / 22) * Math.PI)) * s;
        return (
          <svg key={i} viewBox="-50 -50 100 100" width={90} height={90}
            style={{position: 'absolute', left: x - 45, top: y - 45, transform: `scale(${scale}) rotate(${t * 2}deg)`, filter: `drop-shadow(0 0 12px ${C.sky})`}}>
            <path d="M0,-50 C5,-5 5,-5 50,0 C5,5 5,5 0,50 C-5,5 -5,5 -50,0 C-5,-5 -5,-5 0,-50Z" fill="#FFFFFF" />
          </svg>
        );
      })}
    </AbsoluteFill>
  );
};

// Script name revealed left-to-right like handwriting, with a moving shimmer.
export const ShimmerScript = ({text, start, size = 260, duration = 45}) => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame - start, [0, duration], [0, 105], {...clamp, easing: (x) => 1 - Math.pow(1 - x, 3)});
  const blur = interpolate(frame - start, [0, duration * 0.6], [8, 0], clamp);
  const shimmer = interpolate(frame, [start + duration, start + duration + 50], [-60, 160], clamp);
  return (
    <div
      style={{
        fontFamily: F.script, fontSize: size, lineHeight: 1.15, padding: '0 60px',
        backgroundImage: `linear-gradient(100deg, ${C.silver} 0%, ${C.white} ${shimmer - 12}%, #FFFFFF ${shimmer}%, ${C.sky} ${shimmer + 12}%, ${C.silver} 100%)`,
        WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
        clipPath: `inset(-20% ${100 - reveal}% -20% -5%)`,
        filter: `blur(${blur}px) drop-shadow(0 0 28px rgba(142,197,255,0.55))`,
      }}
    >
      {text}
    </div>
  );
};

// Words that spring up one after another.
export const SpringWords = ({text, start, style, stagger = 5}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div style={{display: 'flex', gap: '0.28em', justifyContent: 'center', ...style}}>
      {text.split(' ').map((w, i) => {
        const s = spring({frame: frame - start - i * stagger, fps, config: {damping: 12, mass: 0.6}});
        return (
          <span key={i} style={{display: 'inline-block', opacity: s, transform: `translateY(${(1 - s) * 60}px) rotate(${(1 - s) * 8}deg)`}}>
            {w}
          </span>
        );
      })}
    </div>
  );
};

export const FadeOut = ({children, at, len = 15}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{opacity: interpolate(frame, [at, at + len], [1, 0], clamp)}}>{children}</AbsoluteFill>;
};

export const Photo = ({src, style}) => <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', ...style}} />;

// Sound effect placed so its sync point (from sfx/sync.json) lands exactly on frame `at`.
import {Audio, Sequence} from 'remotion';
import SYNC from '../public/sfx/sync.json';
export const Sfx = ({name, at, volume = 0.6}) => {
  const {fps} = useVideoConfig();
  const from = Math.round(at - (SYNC[name] || 0) * fps);
  const trim = Math.max(0, -from);
  return (
    <Sequence from={Math.max(0, from)} layout="none">
      <Audio src={staticFile(`sfx/${name}.wav`)} startFrom={trim} volume={volume} />
    </Sequence>
  );
};

// Butterflies (her party theme): flapping wings, drifting along gentle curves.
const Wing = ({flip, fill}) => (
  <g transform={flip ? 'scale(-1,1)' : undefined}>
    <path d="M0,0 C18,-46 70,-58 78,-26 C84,-2 46,10 0,4Z" fill={fill} opacity="0.92" />
    <path d="M0,4 C34,10 62,26 50,52 C38,72 10,44 0,10Z" fill={fill} opacity="0.75" />
    <path d="M6,-4 C26,-34 58,-42 66,-24" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="2" fill="none" />
  </g>
);
export const Butterflies = ({count = 5, seed = 'bf', start = 0}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const fills = ['url(#bfA)', 'url(#bfB)', 'url(#bfC)'];
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={width} height={height} style={{position: 'absolute'}}>
        <defs>
          <linearGradient id="bfA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#B8A4FF" /><stop offset="1" stopColor="#5B7CFA" /></linearGradient>
          <linearGradient id="bfB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#9FE3FF" /><stop offset="1" stopColor="#3B7DD8" /></linearGradient>
          <linearGradient id="bfC" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E3D4FF" /><stop offset="1" stopColor="#8E6CF0" /></linearGradient>
        </defs>
        {new Array(count).fill(0).map((_, i) => {
          const r = (k) => random(`${seed}-${i}-${k}`);
          const t = frame - start - r('d') * 40;
          if (t < 0) return null;
          const dir = r('dir') > 0.5 ? 1 : -1;
          const speed = 2.2 + r('v') * 2.5;
          const x0 = dir > 0 ? -120 - r('x') * 200 : width + 120 + r('x') * 200;
          const x = x0 + dir * t * speed;
          const y = height * (0.15 + r('y') * 0.7) + Math.sin(t / (14 + r('w') * 10)) * 60 - t * (0.4 + r('u') * 0.8);
          const flap = 0.25 + 0.75 * Math.abs(Math.cos(t / (2.6 + r('f') * 1.2)));
          const s = 0.45 + r('s') * 0.55;
          const tilt = Math.cos(t / (14 + r('w') * 10)) * 12 - dir * 10;
          return (
            <g key={i} transform={`translate(${x},${y}) rotate(${tilt}) scale(${s * (dir > 0 ? 1 : -1)},${s})`}
              style={{filter: 'drop-shadow(0 0 10px rgba(160,190,255,0.7))'}}>
              <g transform={`scale(${flap},1)`}><Wing fill={fills[i % 3]} /></g>
              <g transform={`scale(${flap},1)`}><Wing flip fill={fills[(i + 1) % 3]} /></g>
              <ellipse cx="0" cy="8" rx="3.5" ry="20" fill="#1B2A55" />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
