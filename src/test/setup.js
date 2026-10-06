import "@testing-library/jest-dom";

// Mock AudioContext: every node the cabinet's bus builds (src/arcade/audio/
// bus.js), with automation that does nothing. Each context made is kept in
// MockAudioContext.instances, so a test can count them.
const param = (value) => ({
  value,
  setValueAtTime: () => {},
  linearRampToValueAtTime: () => {},
  exponentialRampToValueAtTime: () => {},
  setTargetAtTime: () => {},
  cancelScheduledValues: () => {},
});
const audioNode = (extra = {}) => ({
  connect: () => {},
  disconnect: () => {},
  ...extra,
});

class MockAudioContext {
  static instances = [];
  constructor() {
    this.state = "running";
    this.sampleRate = 44100;
    this.currentTime = 0;
    this.destination = audioNode();
    MockAudioContext.instances.push(this);
  }
  createOscillator() {
    return audioNode({
      type: "sine",
      frequency: param(440),
      start: () => {},
      stop: () => {},
    });
  }
  createGain() {
    return audioNode({ gain: param(1) });
  }
  createBiquadFilter() {
    return audioNode({ type: "lowpass", frequency: param(350), Q: param(1) });
  }
  createDelay() {
    return audioNode({ delayTime: param(0) });
  }
  createDynamicsCompressor() {
    return audioNode();
  }
  createBuffer(channels, length, sampleRate) {
    const data = Array.from({ length: channels }, () => new Float32Array(length));
    return {
      length,
      sampleRate,
      numberOfChannels: channels,
      getChannelData: (i) => data[i],
    };
  }
  createBufferSource() {
    return audioNode({ buffer: null, loop: false, start: () => {}, stop: () => {} });
  }
  resume() {
    this.state = "running";
    return Promise.resolve();
  }
  suspend() {
    this.state = "suspended";
    return Promise.resolve();
  }
  close() {
    this.state = "closed";
    return Promise.resolve();
  }
}

global.AudioContext = MockAudioContext;
global.window.AudioContext = MockAudioContext;
global.window.webkitAudioContext = MockAudioContext;

// Mock canvas getContext
HTMLCanvasElement.prototype.getContext = () => ({
  clearRect: () => {},
  fillRect: () => {},
  strokeRect: () => {},
  beginPath: () => {},
  closePath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  arc: () => {},
  fill: () => {},
  stroke: () => {},
  save: () => {},
  restore: () => {},
  translate: () => {},
  rotate: () => {},
  scale: () => {},
  setTransform: () => {},
  drawImage: () => {},
  measureText: () => ({ width: 0 }),
  fillText: () => {},
  strokeText: () => {},
  createLinearGradient: () => ({ addColorStop: () => {} }),
  createRadialGradient: () => ({ addColorStop: () => {} }),
  set shadowBlur(_) {},
  set shadowColor(_) {},
  set globalCompositeOperation(_) {},
  set globalAlpha(_) {},
  set lineWidth(_) {},
  set strokeStyle(_) {},
  set fillStyle(_) {},
  set font(_) {},
  set textAlign(_) {},
  set textBaseline(_) {},
});

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock requestAnimationFrame
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// Mock scrollIntoView (not implemented in jsdom)
Element.prototype.scrollIntoView = () => {};
