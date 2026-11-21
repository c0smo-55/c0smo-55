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
