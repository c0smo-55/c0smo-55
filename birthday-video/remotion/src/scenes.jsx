import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {
  Background, Bokeh, C, Confetti, F, FadeOut, Photo, ShimmerScript, Sparkles, SpringWords, clamp, useFonts,
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
          <SpacedCaps text="Celebrating" start={12} />
          <ShimmerScript text={name} start={32} size={300} />
          <GrowLine start={88} />
          <div style={{fontFamily: F.serif, fontStyle: 'italic', fontSize: 54, color: C.white, opacity: sub,
            transform: `translateY(${(1 - sub) * 20}px)`}}>
            Happy Birthday
          </div>
        </Center>
        <Sparkles start={70} points={[[560, 420, 0.9, 0], [1390, 380, 1.1, 10], [1460, 640, 0.7, 22], [470, 650, 0.6, 30], [960, 300, 0.8, 40]]} />
        <Confetti start={78} seed="open" origin={[960, 560]} />
      </FadeOut>
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
      <FadeOut at={105} len={15}>
        <Background />
        <Bokeh seed={`ch-${number}`} count={30} strength={0.8} />
        <Center>
          <div style={{position: 'absolute', fontFamily: F.serif, fontSize: 620, color: 'transparent',
            WebkitTextStroke: `2px ${C.sky}55`, opacity: num * 0.9,
            transform: `translateX(${(1 - num) * 120}px) scale(${0.9 + num * 0.1})`}}>
            {String(number).padStart(2, '0')}
          </div>
          <SpacedCaps text={`Chapter ${['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'][number]}`} start={8} size={28} />
          <SpringWords text={title} start={16} style={{fontFamily: F.serif, fontStyle: 'italic', fontSize: 120, color: C.white, marginTop: 10,
            textShadow: '0 0 30px rgba(142,197,255,0.45)'}} />
          <GrowLine start={34} width={420} />
        </Center>
        <Sparkles start={30} points={[[520, 470, 0.7, 0], [1420, 560, 0.8, 12]]} />
      </FadeOut>
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
        <Confetti start={0} mode="rain" count={120} seed="end" />
        <Center>
          <SpringWords text="Happy Birthday" start={10} stagger={8}
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
    </AbsoluteFill>
  );
};
