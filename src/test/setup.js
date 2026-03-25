import "@testing-library/jest-dom";

// Mock AudioContext
class MockAudioContext {
  createOscillator() {
    return {
      type: "sine",
      frequency: { value: 440, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
      connect: () => {},
      disconnect: () => {},
      start: () => {},
      stop: () => {},
    };
  }
  createGain() {
    return {
      gain: { value: 1, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
      connect: () => {},
      disconnect: () => {},
    };
  }
  createBiquadFilter() {
    return {
      type: "lowpass",
      frequency: { value: 440, setValueAtTime: () => {} },
      Q: { value: 1 },
      connect: () => {},
      disconnect: () => {},
    };
  }
  createDelay() {
    return {
      delayTime: { value: 0 },
      connect: () => {},
      disconnect: () => {},
    };
  }
  createDynamicsCompressor() {
    return { connect: () => {}, disconnect: () => {} };
  }
  get destination() {
    return {};
  }
  get currentTime() {
    return 0;
  }
  close() {}
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
