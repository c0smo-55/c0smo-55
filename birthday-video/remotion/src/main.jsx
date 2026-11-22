import React from 'react';
import {
  AbsoluteFill, Img, OffthreadVideo, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {clockWipe} from '@remotion/transitions/clock-wipe';
import {Butterflies, C, F, Sfx, Sparkles, clamp, useFonts} from './fx';
import {Chapter, Ending, LightLeak, Opening} from './scenes';
import {CheerMeter, Countdown, EmojiBurst, FreezeTag, PhotoWall, PiP, ProgressBar, Punch, Scrapbook, Stats, Teaser, Triptych, shakeTransform} from './viral';
import {Html5Audio, Sequence, useCurrentFrame as useFrame} from 'remotion';
import EDL from './edl.json';
import {Finish, FairyDust, LensFlare, PapaNote, Viewfinder, dreamy, flash, zoomBlur} from './magic';
import SUBS from './subs.json';

// English subtitles: lines are timed in the ORIGINAL clip's seconds; map timeline frame -> source time.
const Subtitles = ({s}) => {
  const frame = useFrame();
  const lines = SUBS[String(s.clip)];
  if (!lines) return null;
  const f = frame;
  const sp = s.speed || 1;
  const t = s.in + (sp >= 1 ? (f / FPS) * sp : (f / FPS) * sp);
  const cur = lines.find((l) => t >= l.start && t < l.end);
  if (!cur) return null;
  const into = (t - cur.start) * FPS / sp;
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 70, pointerEvents: 'none'}}>
      <div style={{maxWidth: 1500, textAlign: 'center', padding: '12px 28px', borderRadius: 14,
        background: 'rgba(5,11,28,0.62)', opacity: Math.min(1, into / 4),
        fontFamily: F.sans, fontWeight: 500, fontSize: 46, lineHeight: 1.3, color: '#FFFFFF',
        textShadow: '0 2px 8px rgba(0,0,0,0.6)'}}>
        {cur.id && cur.id !== cur.text && (
          <div style={{fontSize: 34, fontWeight: 500, color: 'rgba(230,240,255,0.82)', fontStyle: 'italic', marginBottom: 4}}>
            {cur.speaker && <span style={{color: C.sky, fontWeight: 800, fontStyle: 'normal'}}>{cur.speaker}: </span>}{cur.id}
          </div>
        )}
        <div>
          {cur.speaker && !(cur.id && cur.id !== cur.text) && <span style={{color: C.sky, fontWeight: 800}}>{cur.speaker}: </span>}
          {cur.text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const FPS = EDL.fps;
const fr = (s) => Math.round(s * FPS);
export const shotName = (s) => `c${String(s.clip).padStart(2, '0')}_${s.in.toFixed(2).padStart(7, '0')}_${s.speed || 1}`;

// ---------- motion graphics ----------

const DateTag = ({text, place}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - 6, fps, config: {damping: 18}});
  const line = spring({frame: frame - 2, fps, config: {damping: 200}});
  const out = interpolate(frame, [fr(2.4), fr(2.9)], [1, 0], clamp);
  return (
    <AbsoluteFill style={{opacity: out}}>
      <div style={{position: 'absolute', left: 110, top: 110}}>
        <div style={{width: 420 * line, height: 2, background: `linear-gradient(90deg, ${C.sky}, transparent)`}} />
        <div style={{fontFamily: F.sans, fontWeight: 500, fontSize: 40, letterSpacing: '0.35em', color: C.white,
          marginTop: 18, opacity: s, transform: `translateY(${(1 - s) * 30}px)`, textShadow: '0 2px 20px rgba(0,0,0,0.6)'}}>
          {text}
        </div>
        <div style={{fontFamily: F.serif, fontStyle: 'italic', fontSize: 44, color: C.ice, marginTop: 6,
          opacity: interpolate(frame, [14, 30], [0, 1], clamp), textShadow: '0 2px 20px rgba(0,0,0,0.7)'}}>
          {place}
        </div>
      </div>
      <Sfx name="tick" at={6} volume={0.25} />
      <Sfx name="chime_single" at={14} volume={0.25} />
    </AbsoluteFill>
  );
};

const LowerThird = ({title, sub, at = 0.5, dur}) => {
  const frame = useCurrentFrame() - fr(at);
  const {fps} = useVideoConfig();
  if (frame < 0) return null;
  const end = fr(dur - at) - 18;
  const inS = spring({frame, fps, config: {damping: 16}});
  const outS = interpolate(frame, [end, end + 14], [0, 1], clamp);
  const x = (1 - inS) * -120 - outS * 80;
  return (
    <AbsoluteFill style={{opacity: inS * (1 - outS)}}>
      <div style={{position: 'absolute', left: 110, bottom: 330, transform: `translateX(${x}px)`, padding: '18px 60px 26px 40px',
        background: 'linear-gradient(90deg, rgba(10,22,48,0.72), rgba(10,22,48,0.25) 80%, transparent)',
        borderLeft: `4px solid ${C.sky}`, borderRadius: 6}}>
        <div style={{fontFamily: F.script, fontSize: 120, lineHeight: 1.3, paddingBottom: 18, color: C.white,
          clipPath: `inset(-20% ${100 - interpolate(frame, [4, 30], [0, 100], clamp)}% -40% 0)`,
          textShadow: '0 0 24px rgba(142,197,255,0.6)'}}>
          {title}
        </div>
        <div style={{fontFamily: F.sans, fontWeight: 500, fontSize: 26, letterSpacing: '0.4em', color: C.sky, marginTop: 8,
          opacity: interpolate(frame, [16, 30], [0, 1], clamp), textTransform: 'uppercase'}}>
          {sub}
        </div>
      </div>
      <Sfx name="chime_up" at={4} volume={0.3} />
      <Sfx name="glitter_1" at={12} volume={0.15} />
    </AbsoluteFill>
  );
};

const Kinetic = ({text, sub, at = 0.2, dur}) => {
  const frame = useCurrentFrame() - fr(at);
  const {fps} = useVideoConfig();
  if (frame < 0) return null;
  const end = fr(dur - at) - 12;
  const out = interpolate(frame, [end, end + 10], [0, 1], clamp);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: 1 - out,
      transform: `scale(${1 + out * 0.15})`, filter: `blur(${out * 10}px)`}}>
      <div style={{display: 'flex'}}>
        {text.split('').map((ch, i) => {
          const s = spring({frame: frame - i * 2, fps, config: {damping: 9, mass: 0.5, stiffness: 180}});
          return (
            <span key={i} style={{fontFamily: F.sans, fontWeight: 900, fontSize: 230, letterSpacing: '0.06em',
              color: C.white, display: 'inline-block', whiteSpace: 'pre',
              transform: `translateY(${(1 - s) * -160}px) scale(${0.6 + 0.4 * s})`, opacity: Math.min(1, s * 1.5),
              textShadow: `0 0 40px ${C.royal}, 0 6px 30px rgba(0,0,0,0.6)`, WebkitTextStroke: `2px ${C.ice}`}}>
              {ch}
            </span>
          );
        })}
      </div>
      <div style={{fontFamily: F.script, fontSize: 130, color: C.ice, marginTop: -40,
        opacity: interpolate(frame, [text.length * 2 + 4, text.length * 2 + 16], [0, 1], clamp),
        textShadow: '0 0 30px rgba(59,125,216,0.9)'}}>
        {sub}
      </div>
      <Sfx name="whoosh_4" at={2} volume={0.3} />
      <Sfx name="pop_3" at={text.length * 2 + 2} volume={0.35} />
      <Sfx name="chime_down" at={text.length * 2 + 6} volume={0.25} />
    </AbsoluteFill>
  );
};

const Glow = () => {
  const frame = useCurrentFrame();
  const x = 70 + Math.sin(frame / 40) * 15;
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', opacity: 0.45,
      background: `radial-gradient(circle at ${x}% 20%, rgba(127,196,255,0.9), rgba(59,125,216,0.3) 30%, transparent 60%)`}} />
  );
};

const Vignette = () => (
  <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(5,11,28,0.55) 100%)'}} />
);

const zoomFor = (mode, frame, total, fps) => {
  if (mode === 'in') return interpolate(frame, [0, total], [1.0, 1.08]);
  if (mode === 'out') return interpolate(frame, [0, total], [1.1, 1.02]);
  if (mode === 'punch') return 1 + 0.14 * (1 - spring({frame, fps, config: {damping: 14}}));
  return 1;
};

const Video = ({s, name, startFrom = 0}) => (
  <OffthreadVideo src={staticFile(`shots/${name}.mp4`)} playbackRate={(s.speed || 1) >= 1 ? (s.speed || 1) : 1}
    volume={s.vol ?? 0.3} startFrom={startFrom} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
);
export const stillName = (s, at) => `shots/${shotName(s)}_f${at.toFixed(2)}.jpg`;

const PolaroidShot = ({s, name}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const snap = fr(s.fx.polaroid.at);
  const p = spring({frame: frame - snap, fps, config: {damping: 14, mass: 0.9}});
  const flash = interpolate(frame, [snap - 2, snap, snap + 10], [0, 1, 0], clamp);
  const live = frame < snap;
  const img = staticFile(`shots/${name}_freeze.jpg`);
  return (
    <AbsoluteFill style={{backgroundColor: C.bgOuter}}>
      {live ? <Video s={s} name={name} /> : (
        <>
          <Img src={img} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(26px) brightness(0.5)', transform: 'scale(1.15)'}} />
          <Butterflies count={4} seed={`pol-${name}`} start={0} />
          <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
            <div style={{transform: `scale(${interpolate(p, [0, 1], [1, 0.64])}) rotate(${interpolate(p, [0, 1], [0, -4])}deg)`,
              background: '#FBFBF8', padding: `${28 * p}px ${28 * p}px ${140 * p}px`, position: 'relative',
              boxShadow: `0 ${30 * p}px ${80 * p}px rgba(0,0,0,0.6)`}}>
              <Img src={img} style={{width: 1920, height: 1080, display: 'block'}} />
              <div style={{position: 'absolute', left: 0, right: 0, bottom: 10, textAlign: 'center', fontFamily: F.script,
                fontSize: 120, color: '#1C3B70', opacity: interpolate(frame, [snap + 18, snap + 32], [0, 1], clamp)}}>
                {s.fx.polaroid.caption}
              </div>
            </div>
          </AbsoluteFill>
        </>
      )}
      <AbsoluteFill style={{backgroundColor: 'white', opacity: flash}} />
      <Sfx name="shutter_2" at={snap - 1} volume={0.8} />
      <Sfx name="whoosh_2" at={snap + 9} volume={0.3} />
      <Sfx name="chime_single" at={snap + 20} volume={0.3} />
    </AbsoluteFill>
  );
};

const Shot = ({s}) => {
  useFonts();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const name = shotName(s);
  const total = fr(s.dur);
  const fx = s.fx || {};
  if (fx.polaroid) return <PolaroidShot s={s} name={name} />;
  const fz = fx.freeze;
  const fzA = fz ? fr(fz.at) : 0;
  const fzH = fz ? fr(fz.hold || 1.3) : 0;
  const shake = (fx.shake || []).map((a) => shakeTransform(frame, fr(a))).join(' ');
  const zoom = `scale(${zoomFor(s.zoom, frame, total, fps)}) ${shake}`;
  return (
    <AbsoluteFill style={{backgroundColor: 'black'}}>
      {!fz && (
        <AbsoluteFill style={{transform: zoom}}>
          <Video s={s} name={name} />
        </AbsoluteFill>
      )}
      {fz && (
        <>
          <Sequence durationInFrames={fzA} layout="none">
            <AbsoluteFill style={{transform: zoom}}><Video s={s} name={name} /></AbsoluteFill>
          </Sequence>
          <Sequence from={fzA} durationInFrames={fzH} layout="none">
            <FreezeTag img={staticFile(stillName(s, fz.at))} {...fz} />
            {/* keep the room sound running under the freeze so nobody gets cut off */}
            <Html5Audio src={staticFile(`shots/${name}.mp4`)} startFrom={Math.round(fzA * (s.speed || 1))} volume={s.vol ?? 0.3} />
          </Sequence>
          <Sequence from={fzA + fzH} layout="none">
            <AbsoluteFill style={{transform: zoom}}><Video s={s} name={name} startFrom={Math.round((fzA + fzH) * (s.speed || 1))} /></AbsoluteFill>
          </Sequence>
        </>
      )}
      <Vignette />
      <FairyDust seed={name} count={fx.glow ? 40 : 18} strength={fx.glow ? 1 : 0.6} />
      {(fx.emoji || []).map((e, k) => <EmojiBurst key={k} seed={`${name}-${k}`} {...e} at={fr(e.at)} />)}
      {s.subs !== false && <Subtitles s={s} />}
      {fx.viewfinder && <Viewfinder dur={Math.min(s.dur, 4)} />}
      {fx.note && <PapaNote {...fx.note} />}
      {fx.pip && <PiP {...fx.pip} at={fr(fx.pip.at || 0)} />}
      {fx.punch && <Punch {...fx.punch} at={fr(fx.punch.at)} />}
      {fx.countdown && <Countdown at={fr(fx.countdown.at)} step={fr(fx.countdown.step || 1)} />}
      {(fx.sfx || []).map((x, k) => <Sfx key={k} name={x.name} at={fr(x.at)} volume={x.vol ?? 0.5} />)}
      {fx.glow && <Glow />}
      {fx.sparkles && <Sparkles start={4} points={[[420, 300, 0.9, 0], [1500, 260, 1.1, 8], [1380, 780, 0.7, 18], [560, 820, 0.6, 26]]} />}
      {fx.sparkles && <Sfx name="glitter_3" at={6} volume={0.22} />}
      {fx.date && <DateTag {...fx.date} />}
      {fx.lower && <LowerThird {...fx.lower} dur={s.dur} />}
      {fx.kinetic && <Kinetic {...fx.kinetic} dur={s.dur} />}
    </AbsoluteFill>
  );
};

// ---------- timeline ----------

const presentation = (t) => {
  switch (t.type) {
    case 'slide': return zoomBlur({strength: 0.7});
    case 'wipe': return flash();
    case 'clockWipe': return zoomBlur({strength: 1});
    case 'zoomBlur': return zoomBlur({strength: t.strength ?? 1});
    case 'flash': return flash();
    case 'dreamy': return dreamy();
    default: return dreamy();
  }
};
const WHOOSHES = ['whoosh_1', 'whoosh_3', 'whoosh_6', 'whoosh_2', 'whoosh_5', 'whoosh_4'];

export const timelineFrames = () => EDL.items.reduce((acc, it, i) => acc + fr(it.dur) - (i && it.trans ? fr(it.trans.dur) : 0), 0);

export const Main = () => {
  useFonts();
  let w = 0;
  const children = [];
  EDL.items.forEach((it, i) => {
    if (i > 0 && it.trans) {
      children.push(
        <TransitionSeries.Transition key={`t${i}`} presentation={presentation(it.trans)}
          timing={linearTiming({durationInFrames: fr(it.trans.dur)})} />,
      );
    }
    const whoosh = i > 0 && it.trans ? WHOOSHES[w++ % WHOOSHES.length] : null;
    const tHalf = it.trans ? Math.round(fr(it.trans.dur) / 2) : 0;
    children.push(
      <TransitionSeries.Sequence key={`s${i}`} durationInFrames={fr(it.dur)}>
        {it.type === 'scene' && it.scene === 'Opening' && <Opening name="Jesslyn" />}
        {it.type === 'scene' && it.scene === 'Chapter' && <Chapter {...it.props} />}
        {it.type === 'scene' && it.scene === 'Ending' && <Ending name="Jesslyn" {...it.props} />}
        {it.type === 'scene' && it.scene === 'CheerMeter' && <CheerMeter {...it.props} />}
        {it.type === 'scene' && it.scene === 'PhotoWall' && <PhotoWall {...it.props} />}
        {it.type === 'scene' && it.scene === 'Teaser' && <Teaser {...it.props} />}
        {it.type === 'scene' && it.scene === 'Scrapbook' && <Scrapbook {...it.props} />}
        {it.type === 'scene' && it.scene === 'Stats' && <Stats {...it.props} />}
        {it.type === 'scene' && it.scene === 'Triptych' && <Triptych {...it.props} />}
        {it.type === 'scene' && it.scene !== 'Teaser' && (
          <Html5Audio src={staticFile('sfx/pad.wav')} loop
            volume={(f) => 0.16 * Math.min(1, f / 15, (Math.round(it.dur * FPS) - f) / 15)} />
        )}
        {it.type === 'shot' && <Shot s={it} />}
        {it.trans && it.trans.type !== 'fade' && <LensFlare at={Math.max(0, tHalf - 9)} dur={18} seed={i % 4} y={[0.38, 0.5, 0.3, 0.45][i % 4]} />}
        {it.type === 'shot' && i > 0 && EDL.items[i - 1].scene === 'Chapter' && <LightLeak at={0} dur={22} seed={i % 5} />}
        {whoosh && ['zoomBlur', 'flash', 'clockWipe', 'slide', 'wipe'].includes(it.trans.type) && <Sfx name={whoosh} at={tHalf} volume={0.3} />}
        
      </TransitionSeries.Sequence>,
    );
  });
  return (
    <AbsoluteFill style={{backgroundColor: 'black'}}>
      <TransitionSeries>{children}</TransitionSeries>
      <Finish />
      <Progress />
    </AbsoluteFill>
  );
};

// Start frame of every item on the final timeline (transitions overlap).
export const starts = () => {
  let t = 0;
  return EDL.items.map((it, i) => {
    if (i && it.trans) t -= fr(it.trans.dur);
    const st = t;
    t += fr(it.dur);
    return st;
  });
};

const Progress = () => {
  const frame = useFrame();
  const st = starts();
  const total = timelineFrames();
  const chapters = EDL.items.map((it, i) => ({it, at: st[i]})).filter((c) => c.it.scene === 'Chapter');
  const firstCh = chapters.length ? chapters[0].at : 0;
  const cur = EDL.items[st.filter((x) => x <= frame).length - 1];
  if (frame < firstCh || !cur || cur.type !== 'shot') return null;
  return <ProgressBar frame={frame} total={total} chapters={chapters} />;
};
