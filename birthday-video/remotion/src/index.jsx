import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Chapter, Ending, Opening, Polaroid} from './scenes';
import {Main, timelineFrames} from './main';

const base = {fps: 30, width: 1920, height: 1080};
const Root = () => (
  <>
    <Composition id="Opening" component={Opening} durationInFrames={240} {...base} defaultProps={{name: 'Jesslyn'}} />
    <Composition id="Chapter" component={Chapter} durationInFrames={120} {...base}
      defaultProps={{number: 1, title: 'The Celebration Begins'}} />
    <Composition id="Polaroid" component={Polaroid} durationInFrames={150} {...base}
      defaultProps={{src: 'placeholder.jpg', caption: 'Best friends'}} />
    <Composition id="Ending" component={Ending} durationInFrames={300} {...base}
      defaultProps={{name: 'Jesslyn', message: 'With love, Papa & Mama'}} />
    <Composition id="Main" component={Main} durationInFrames={timelineFrames()} {...base} />
  </>
);
registerRoot(Root);
