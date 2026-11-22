import React from 'react';
import {FairyDust, LensFlare} from './magic';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {
  Background, Bokeh, Butterflies, C, Confetti, F, FadeOut, Photo, Sfx, ShimmerScript, Sparkles, SpringWords, clamp, useFonts,
} from './fx';

const Center = ({children, style}) => (
  <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', ...style}}>{children}</AbsoluteFill>
);

const SpacedCaps = ({text, start, size = 30, color = C.sky}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame - start, [0, 25], [0, 1], clamp);
  const ls = interpolate(frame - start, [0, 40], [1.1, 0.55], {...clamp, easing: (x) => 1 - Math.pow(1 - x, 3)});
  return (
    <div style={{fontFamily: F.sans, fontWeight: 300, fontSize: size, letterSpacing: `${ls}em`, color, opacity: o, textTransform: 'uppercase', marginRight: `-${ls}em`}}>
      {text}
    </div>
  );
};

const GrowLine = ({start, width = 520}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - start, fps, config: {damping: 200}});
  return (
    <div style={{width, height: 2, margin: '18px 0', transform: `scaleX(${s})`,
      background: `linear-gradient(90deg, transparent, ${C.sky}, #FFFFFF, ${C.sky}, transparent)`}} />
  );
};

export const Opening = ({name}) => {
  useFonts();
  const frame = useCurrentFrame();
  const sub = interpolate(frame, [110, 135], [0, 1], clamp);
  const zoom = interpolate(frame, [0, 240], [1.06, 1], clamp);
  return (
    <AbsoluteFill style={{backgroundColor: C.bgOuter}}>
      <FadeOut at={222} len={18}>
        <AbsoluteFill style={{transform: `scale(${zoom})`}}>
          <Background />
          <Bokeh seed="open" />
        </AbsoluteFill>
        <Center>
          <SpacedCaps text="Happy birthday" start={12} />
          <ShimmerScript text={name} start={32} size={300} />
          <GrowLine start={88} />
          <div style={{fontFamily: F.serif, fontStyle: 'italic', fontSize: 54, color: C.white, opacity: sub,
            transform: `translateY(${(1 - sub) * 20}px)`}}>
            turns 17
          </div>
        </Center>
        <Butterflies count={6} seed="open" start={20} />
        <Sparkles start={70} points={[[560, 420, 0.9, 0], [1390, 380, 1.1, 10], [1460, 640, 0.7, 22], [470, 650, 0.6, 30], [960, 300, 0.8, 40]]} />
        <Confetti start={78} seed="open" origin={[960, 560]} />
        <FairyDust seed="open-dust" count={40} />
        <LensFlare at={30} dur={26} y={0.47} />
      </FadeOut>
      <Sfx name="riser_1s" at={32} volume={0.35} />
      <Sfx name="boom_1" at={32} volume={0.7} />
      <Sfx name="name_reveal" at={33} volume={0.5} />
      <Sfx name="glitter_1" at={70} volume={0.25} />
      <Sfx name="popper" at={78} volume={0.65} />
      <Sfx name="chime_up" at={110} volume={0.35} />
    </AbsoluteFill>
  );
};

export const Chapter = ({number, title}) => {
  useFonts();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const num = spring({frame: frame - 2, fps, config: {damping: 14}});
  return (
    <AbsoluteFill style={{backgroundColor: C.bgOuter}}>
      <FadeOut at={118} len={14}>
        <Background />
        <Bokeh seed={`ch-${number}`} count={30} strength={0.8} />
        <Center>
          <div style={{position: 'absolute', fontFamily: F.serif, fontSize: 620, color: 'transparent',
            WebkitTextStroke: `2px ${C.sky}55`, opacity: num * 0.9,
            transform: `translateX(${(1 - num) * 120}px) scale(${0.9 + num * 0.1})`}}>
            {String(number).padStart(2, '0')}
          </div>
          <SpacedCaps text={`Chapter ${['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'][number]}`} start={8} size={30} />
          <SpringWords text={title} start={16} style={{fontFamily: F.serif, fontStyle: 'italic', fontSize: 120, color: C.white, marginTop: 10,
            textShadow: '0 0 30px rgba(142,197,255,0.45)'}} />
          <GrowLine start={34} width={420} />
        </Center>
        <Sparkles start={30} points={[[520, 470, 0.7, 0], [1420, 560, 0.8, 12]]} />
      </FadeOut>
      <LightLeak at={0} dur={26} seed={number} />
      <Sfx name="whoosh_4" at={4} volume={0.45} />
      <Sfx name="chime_down" at={17} volume={0.35} />
      <Sfx name="glitter_2" at={32} volume={0.2} />
    </AbsoluteFill>
  );
};

// Freeze-frame photo moment: flash, the frame becomes a polaroid with a handwritten caption.
export const Polaroid = ({src, caption}) => {
  useFonts();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const snap = 30;
  const s = spring({frame: frame - snap, fps, config: {damping: 14, mass: 0.9}});
  const flash = interpolate(frame, [snap - 2, snap, snap + 10], [0, 1, 0], clamp);
  const live = frame < snap;
  const kb = interpolate(frame, [0, snap], [1.0, 1.06], clamp);
  const scale = live ? kb : interpolate(s, [0, 1], [1.06, 0.62]);
  const rot = interpolate(s, [0, 1], [0, -4]);
  const border = interpolate(s, [0, 1], [0, 28]);
  const capO = interpolate(frame, [snap + 18, snap + 35], [0, 1], clamp);
  return (
    <AbsoluteFill style={{backgroundColor: C.bgOuter}}>
      <AbsoluteFill style={{opacity: live ? 0 : 1}}>
        <Photo src={src} style={{filter: 'blur(28px) brightness(0.55) saturate(1.2)', transform: 'scale(1.15)'}} />
        <AbsoluteFill style={{background: `radial-gradient(ellipse, transparent 30%, ${C.bgOuter}cc 100%)`}} />
        <Bokeh seed="pol" count={25} strength={0.7} />
      </AbsoluteFill>
      <Center>
        <div style={{transform: `scale(${scale}) rotate(${rot}deg)`, background: '#FBFBF8',
          padding: `${border}px ${border}px ${border * 5}px ${border}px`,
          boxShadow: live ? 'none' : `0 ${30 * s}px ${80 * s}px rgba(0,0,0,0.55)`, position: 'relative'}}>
          <div style={{width: 1920, height: 1080, overflow: 'hidden'}}>
            <Photo src={src} />
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, bottom: border * 0.9, textAlign: 'center',
            fontFamily: F.script, fontSize: 120, color: '#1C3B70', opacity: capO}}>
            {caption}
          </div>
        </div>
      </Center>
      <Sparkles start={snap + 20} points={[[1450, 230, 0.9, 0], [430, 860, 0.7, 10]]} />
      <AbsoluteFill style={{backgroundColor: 'white', opacity: flash}} />
      <Sfx name="shutter_1" at={snap - 1} volume={0.8} />
      <Sfx name="whoosh_2" at={snap + 9} volume={0.35} />
      <Sfx name="chime_single" at={snap + 20} volume={0.35} />
      <Sfx name="glitter_3" at={snap + 22} volume={0.2} />
    </AbsoluteFill>
  );
};

export const Ending = ({name, message}) => {
  useFonts();
  const frame = useCurrentFrame();
  const msg = interpolate(frame, [120, 150], [0, 1], clamp);
  return (
    <AbsoluteFill style={{backgroundColor: C.bgOuter}}>
      <FadeOut at={270} len={30}>
        <Background />
        <Bokeh seed="end" />
        <Butterflies count={5} seed="end" start={0} />
        <Confetti start={0} mode="rain" count={120} seed="end" />
        <Center>
          <SpringWords text="Happy 17th" start={10} stagger={8}
            style={{fontFamily: F.serif, fontStyle: 'italic', fontSize: 84, color: C.ice}} />
          <ShimmerScript text={name} start={35} size={320} duration={50} />
          <GrowLine start={100} width={600} />
          <div style={{fontFamily: F.soft, fontStyle: 'italic', fontSize: 52, color: C.white, opacity: msg,
            transform: `translateY(${(1 - msg) * 16}px)`}}>
            {message}
          </div>
        </Center>
        <Sparkles start={80} points={[[520, 400, 1, 0], [1400, 360, 1.1, 14], [1500, 700, 0.7, 26], [430, 700, 0.8, 36]]} />
        <Confetti start={85} seed="end-burst" origin={[960, 600]} count={140} />
      </FadeOut>
      <Sfx name="chime_up" at={10} volume={0.3} />
      <Sfx name="boom_2" at={35} volume={0.6} />
      <Sfx name="name_reveal_end" at={36} volume={0.45} />
      <Sfx name="popper" at={85} volume={0.6} />
      <Sfx name="glitter_2" at={122} volume={0.22} />
    </AbsoluteFill>
  );
};

// ---------- Storybook ----------
const PAPER = '#F6F0E4';
const INK = '#1C2F55';
const WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven'];

const BookShell = ({children, open = 1}) => (
  <div style={{position: 'absolute', left: 160, top: 110, width: 1600, height: 860, perspective: 2400}}>
    <div style={{position: 'absolute', inset: 0, borderRadius: 14, background: '#0E2350',
      boxShadow: '0 40px 90px rgba(0,0,0,0.6)', transform: 'translate(-14px, 12px)'}} />
    <div style={{position: 'absolute', inset: 0, display: 'flex'}}>
      <div style={{flex: 1, background: `linear-gradient(90deg, ${PAPER} 80%, #E3D9C6)`, borderRadius: '10px 0 0 10px'}} />
      <div style={{flex: 1, background: `linear-gradient(270deg, ${PAPER} 80%, #E3D9C6)`, borderRadius: '0 10px 10px 0'}} />
    </div>
    <div style={{position: 'absolute', left: '50%', top: 0, bottom: 0, width: 4, marginLeft: -2, background: 'rgba(80,60,30,0.25)'}} />
    {children}
  </div>
);


// After-Effects style finishing: a glossy light sweep, a ribbon bookmark and a butterfly that lands on the page.
const BookPolish = ({seed, sweepAt = 40}) => {
  const frame = useCurrentFrame();
  const sweep = interpolate(frame, [sweepAt, sweepAt + 34], [-40, 140], clamp);
  const ribbon = spring({frame: frame - 10, fps: 30, config: {damping: 14}});
  const t = Math.max(0, frame - 20);
  const land = Math.min(1, t / 50);
  const ease = 1 - Math.pow(1 - land, 3);
  const bx = interpolate(ease, [0, 1], [1700, 1380]) + Math.sin(t / 7) * 30 * (1 - ease);
  const by = interpolate(ease, [0, 1], [-80, 150]) + Math.cos(t / 9) * 25 * (1 - ease);
  const flap = land < 1 ? 0.25 + 0.75 * Math.abs(Math.cos(t / 2.6)) : 0.55 + 0.45 * Math.abs(Math.cos(t / 14));
  return (
    <>
      <div style={{position: 'absolute', left: 160, top: 110, width: 1600, height: 860, overflow: 'hidden', borderRadius: 10, pointerEvents: 'none',
        background: `linear-gradient(105deg, transparent ${sweep - 12}%, rgba(255,255,255,0.45) ${sweep}%, transparent ${sweep + 12}%)`,
        mixBlendMode: 'soft-light'}} />
      <div style={{position: 'absolute', left: 830, top: 104, width: 46, height: 230 * ribbon,
        background: 'linear-gradient(90deg, #2A5DB8, #4F86E0 50%, #2A5DB8)', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 88%, 0 100%)',
        boxShadow: '0 6px 14px rgba(0,0,0,0.3)'}} />
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}>
        <defs><linearGradient id={`bk-${seed}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#B8D8FF" /><stop offset="1" stopColor="#3B6FD8" /></linearGradient></defs>
        <g transform={`translate(${bx},${by}) rotate(${-15 + 15 * ease}) scale(0.7)`} style={{filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.35))'}}>
          <g transform={`scale(${flap},1)`}><path d="M0,0 C18,-46 70,-58 78,-26 C84,-2 46,10 0,4Z" fill={`url(#bk-${seed})`} /><path d="M0,4 C34,10 62,26 50,52 C38,72 10,44 0,10Z" fill={`url(#bk-${seed})`} opacity="0.8" /></g>
          <g transform={`scale(${-flap},1)`}><path d="M0,0 C18,-46 70,-58 78,-26 C84,-2 46,10 0,4Z" fill={`url(#bk-${seed})`} /><path d="M0,4 C34,10 62,26 50,52 C38,72 10,44 0,10Z" fill={`url(#bk-${seed})`} opacity="0.8" /></g>
          <ellipse cx="0" cy="8" rx="3.5" ry="20" fill="#1B2A55" />
        </g>
      </svg>
    </>
  );
};

// A chapter page: the book sits open, a page turns, then the chapter number, title and one story line appear.
export const StoryChapter = ({number, title, line, img}) => {
  useFonts();
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 200}, durationInFrames: 20});
  const flip = interpolate(frame, [6, 30], [0, -180], {...clamp, easing: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)});
  const reveal = (d) => interpolate(frame, [d, d + 14], [0, 1], clamp);
  const words = line.split(' ');
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.05]);
  const out = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], clamp);
  return (
    <AbsoluteFill style={{backgroundColor: C.bgOuter, opacity: out}}>
      <Background />
      <Bokeh seed={`story-${number}`} count={25} strength={0.6} />
      <AbsoluteFill style={{transform: `scale(${(0.92 + 0.08 * enter) * zoom}) translateY(${(1 - enter) * 60}px)`, opacity: enter}}>
        <BookShell>
          {/* left page: chapter + title + story line */}
          <div style={{position: 'absolute', left: 90, top: 110, width: 620, color: INK}}>
            <div style={{fontFamily: F.sans, fontWeight: 500, fontSize: 26, letterSpacing: '0.5em', color: '#6E83AD', opacity: reveal(28)}}>
              CHAPTER {WORDS[number].toUpperCase()}
            </div>
            <div style={{fontFamily: F.serif, fontStyle: 'italic', fontSize: 82, lineHeight: 1.08, marginTop: 24, opacity: reveal(34),
              transform: `translateY(${(1 - reveal(34)) * 16}px)`}}>{title}</div>
            <div style={{width: 140 * reveal(44), height: 2, background: '#8EA9D8', margin: '34px 0'}} />
            <div style={{fontFamily: F.soft, fontStyle: 'italic', fontSize: 46, lineHeight: 1.35, color: '#2E3F63'}}>
              {words.map((w, i) => (
                <span key={i} style={{opacity: reveal(50 + i * 2.2)}}>{w} </span>
              ))}
            </div>
          </div>
          <div style={{position: 'absolute', left: 90, bottom: 60, fontFamily: F.soft, fontStyle: 'italic', fontSize: 30, color: '#8A7C66'}}>{number * 2 + 1}</div>
          {/* right page: taped photo */}
          <div style={{position: 'absolute', left: 900, top: 120, width: 600, transform: `rotate(2.5deg) scale(${0.9 + 0.1 * reveal(30)})`, opacity: reveal(30)}}>
            <div style={{background: '#FFFFFF', padding: '18px 18px 70px', boxShadow: '0 14px 30px rgba(40,30,10,0.35)'}}>
              <Img src={staticFile(img)} style={{width: '100%', aspectRatio: '4 / 3.4', objectFit: 'cover', display: 'block'}} />
            </div>
            <div style={{position: 'absolute', top: -14, left: 220, width: 160, height: 34, background: 'rgba(170,200,240,0.6)', transform: 'rotate(-4deg)'}} />
          </div>
          <div style={{position: 'absolute', right: 90, bottom: 60, fontFamily: F.soft, fontStyle: 'italic', fontSize: 30, color: '#8A7C66'}}>{number * 2 + 2}</div>
          {/* the turning page */}
          {flip > -180 && (
            <div style={{position: 'absolute', left: '50%', top: 0, width: '50%', height: '100%', transformOrigin: 'left center',
              transform: `rotateY(${flip}deg)`, transformStyle: 'preserve-3d'}}>
              <div style={{position: 'absolute', inset: 0, background: `linear-gradient(270deg, ${PAPER} 70%, #DDD2BC)`, borderRadius: '0 10px 10px 0',
                backfaceVisibility: 'hidden', boxShadow: `${-20 * Math.sin((-flip * Math.PI) / 180)}px 0 40px rgba(0,0,0,0.25)`}} />
              <div style={{position: 'absolute', inset: 0, background: `linear-gradient(90deg, ${PAPER} 70%, #DDD2BC)`, borderRadius: '10px 0 0 10px',
                transform: 'rotateY(180deg)', backfaceVisibility: 'hidden'}} />
            </div>
          )}
        </BookShell>
        <BookPolish seed={`ch${number}`} />
      </AbsoluteFill>
      <Sfx name={number % 2 ? 'page_turn' : 'page_turn_2'} at={6} volume={0.7} />
      <Sfx name="chime_single" at={36} volume={0.18} />
    </AbsoluteFill>
  );
};

// Closing page of the book.
export const StoryEnd = ({line1 = 'The end of sixteen.', line2 = 'Chapter seventeen starts now.', img}) => {
  useFonts();
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 200}, durationInFrames: 20});
  const reveal = (d) => interpolate(frame, [d, d + 18], [0, 1], clamp);
  const close = interpolate(frame, [durationInFrames - 30, durationInFrames - 8], [0, 180], clamp);
  const out = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], clamp);
  return (
    <AbsoluteFill style={{backgroundColor: C.bgOuter, opacity: out}}>
      <Background />
      <Bokeh seed="story-end" count={30} strength={0.7} />
      <AbsoluteFill style={{transform: `scale(${0.92 + 0.08 * enter})`, opacity: enter}}>
        <BookShell>
          <div style={{position: 'absolute', left: 900, top: 140, width: 600, transform: 'rotate(-2deg)', opacity: reveal(8)}}>
            <div style={{background: '#FFFFFF', padding: '18px 18px 70px', boxShadow: '0 14px 30px rgba(40,30,10,0.35)'}}>
              <Img src={staticFile(img)} style={{width: '100%', aspectRatio: '4 / 3.4', objectFit: 'cover', display: 'block'}} />
            </div>
          </div>
          <div style={{position: 'absolute', left: 90, top: 250, width: 640, color: INK}}>
            <div style={{fontFamily: F.serif, fontStyle: 'italic', fontSize: 74, lineHeight: 1.15, opacity: reveal(18)}}>{line1}</div>
            <div style={{fontFamily: F.soft, fontStyle: 'italic', fontSize: 56, lineHeight: 1.25, marginTop: 30, color: '#2E3F63', opacity: reveal(50)}}>{line2}</div>
          </div>
          {close > 0 && (
            <div style={{position: 'absolute', left: '50%', top: 0, width: '50%', height: '100%', transformOrigin: 'left center',
              transform: `rotateY(${-close}deg)`, background: '#16397A', borderRadius: '0 10px 10px 0', backfaceVisibility: 'visible'}} />
          )}
        </BookShell>
        <BookPolish seed="end" sweepAt={30} />
      </AbsoluteFill>
      <Sfx name="page_turn" at={2} volume={0.6} />
      <Sfx name="chime_up" at={52} volume={0.25} />
      <Sfx name="page_turn_2" at={durationInFrames - 30} volume={0.6} />
    </AbsoluteFill>
  );
};

// Soft blue/warm light leak built from animated gradients (no WebGL needed). Sweeps across once.
export const LightLeak = ({at = 0, dur = 24, seed = 0}) => {
  const frame = useCurrentFrame() - at;
  if (frame < 0 || frame > dur) return null;
  const p = frame / dur;
  const o = 0.5 * Math.sin(Math.PI * p);
  const x = -10 + 50 * p;
  const y = 30 + 20 * Math.sin(p * 3 + seed);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen', opacity: o}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 35% 60% at ${x}% ${y}%, rgba(150,200,255,0.8), rgba(90,140,255,0.3) 40%, transparent 70%)`}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 30% 45% at ${x + 18}% ${y + 25}%, rgba(255,214,170,0.55), transparent 70%)`}} />
      <AbsoluteFill style={{background: `linear-gradient(${100 + seed * 20}deg, transparent ${x - 30}%, rgba(255,255,255,0.35) ${x}%, transparent ${x + 25}%)`}} />
    </AbsoluteFill>
  );
};
