// The cabinet's one sound system (docs/AUDIT-NEON.md, step 9): a single
// AudioContext, a master gain into a compressor, and a delay send for space.
// Every voice takes a send amount. Nothing exists until the first sound is
// asked for, and the cabinet asks only once the machine is started: the
// power-on, the boot and the title card are silent, and a visitor who only
// looks never gets a context.

const SOUND_KEY = "ampactor_sound";
// The compressor's makeup gain lifts quiet sounds about 3.7 dB at its
// defaults; the master gives that back, so every voice plays at the level it
// was written at and the compressor only catches the peaks.
const MASTER = 0.65;
let bus = null;
let bed = null;

// SOUND ON / SOUND OFF on the panel, remembered.
export function soundOn() {
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

export function hasBus() {
  return bus !== null;
}

export function getBus() {
  if (bus) return bus;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = soundOn() ? MASTER : 0;
  const comp = ctx.createDynamicsCompressor();
  master.connect(comp);
  comp.connect(ctx.destination);
  // The send: a short slap echo with a little feedback, low in the mix.
  const send = ctx.createGain();
  const delay = ctx.createDelay(1);
  delay.delayTime.value = 0.18;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.28;
  const wet = ctx.createGain();
  wet.gain.value = 0.35;
  send.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(wet);
  wet.connect(master);
  bus = { ctx, master, send };
  return bus;
}

// Run fn(bus, t0) against a live audio clock. resume() is async and a
// suspended context's clock stands still, so a note scheduled before it runs
// would elapse unheard; gate on the state and defer to resume() instead.
export function withClock(fn) {
  // SOUND OFF is silence all the way down: no context, no notes.
  if (!soundOn()) return;
  let b;
  try {
    b = getBus();
  } catch {
    return;
  }
  const run = () => {
    try {
      fn(b, b.ctx.currentTime);
    } catch {
      /* context closed mid-flight */
    }
  };
  if (b.ctx.state === "running") run();
  else b.ctx.resume().then(run).catch(() => {});
}

// One voice: an oscillator through an envelope, optionally through a
// resonant lowpass that sweeps, into the master and (by `send`) the delay.
export function voice(
  b,
  t0,
  { freq, type = "square", at = 0, dur, peak, sweepTo, cutoff, cutoffTo, q = 1, send = 0, attack = 0 },
) {
  const { ctx } = b;
  const start = t0 + at;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (sweepTo != null) osc.frequency.linearRampToValueAtTime(sweepTo, start + dur);
  const env = ctx.createGain();
  if (attack > 0) {
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(peak, start + attack);
  } else {
    env.gain.setValueAtTime(peak, start);
  }
  env.gain.exponentialRampToValueAtTime(0.001, start + dur);
  let head = osc;
  if (cutoff != null) {
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = q;
    filter.frequency.setValueAtTime(cutoff, start);
    if (cutoffTo != null)
      filter.frequency.exponentialRampToValueAtTime(cutoffTo, start + dur);
    osc.connect(filter);
    head = filter;
  }
  head.connect(env);
  env.connect(b.master);
  if (send > 0) {
    const s = ctx.createGain();
    s.gain.value = send;
    env.connect(s);
    s.connect(b.send);
  }
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

// A burst of noise through a bandpass: the coin's clink, the game's blasts.
export function noise(b, t0, { at = 0, dur, peak, freq = 2400, q = 1, send = 0 }) {
  const { ctx } = b;
  const start = t0 + at;
  const buf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * dur)), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = freq;
  band.Q.value = q;
  const env = ctx.createGain();
  env.gain.setValueAtTime(peak, start);
  env.gain.exponentialRampToValueAtTime(0.001, start + dur);
  src.connect(band);
  band.connect(env);
  env.connect(b.master);
  if (send > 0) {
    const s = ctx.createGain();
    s.gain.value = send;
    env.connect(s);
    s.connect(b.send);
  }
  src.start(start);
  src.stop(start + dur);
}

export function setSound(on) {
  try {
    localStorage.setItem(SOUND_KEY, on ? "on" : "off");
  } catch {
    /* private mode: the choice lasts for this page */
  }
  if (!bus) return;
  const g = bus.master.gain;
  const t = bus.ctx.currentTime;
  g.cancelScheduledValues(t);
  g.setValueAtTime(g.value, t);
  g.linearRampToValueAtTime(on ? MASTER : 0, t + 0.12);
  if (on) return;
  // Off, the room stops and the context sleeps once the ramp is down,
  // rather than rendering silence; the next note after SOUND ON wakes it.
  stopBed(0.12);
  setTimeout(() => {
    if (!soundOn()) suspendBus();
  }, 200);
}

// The room's bed: two detuned triangles a fifth apart under a slow lowpass,
// and a quiet band of noise for the air. It fades in after START and out on
// the way back to the title card. setBedOpen(0..1) opens the filter: the
// tunnel's speed, so the game and the boss brighten the room.
// About -38 dBFS, under every sound the cabinet makes.
const BED_LEVEL = 0.015;
const BED_CLOSED = 320;
const BED_SPAN = 1500;

export function bedRunning() {
  return bed !== null;
}

export function startBed() {
  if (!soundOn()) return;
  if (bed) {
    // Started again while the clock was still waking: forget the stop.
    if (bed.pending) bed.stopAfter = undefined;
    return;
  }
  bed = { pending: true };
  withClock((b, t0) => {
    // Reset while the clock was waking: nothing to start.
    if (!bed || !bed.pending) return;
    const { ctx } = b;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, t0);
    out.gain.exponentialRampToValueAtTime(BED_LEVEL, t0 + 2.5);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = BED_CLOSED;
    lp.Q.value = 0.7;
    const root = ctx.createOscillator();
    root.type = "triangle";
    root.frequency.value = 55;
    const fifth = ctx.createOscillator();
    fifth.type = "triangle";
    fifth.frequency.value = 82.6;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05;
    const depth = ctx.createGain();
    depth.gain.value = 90;
    lfo.connect(depth);
    depth.connect(lp.frequency);
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const air = ctx.createBufferSource();
    air.buffer = buf;
    air.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 800;
    band.Q.value = 0.5;
    const airGain = ctx.createGain();
    airGain.gain.value = 0.25;
    root.connect(lp);
    fifth.connect(lp);
    lp.connect(out);
    air.connect(band);
    band.connect(airGain);
    airGain.connect(out);
    out.connect(b.master);
    const nodes = [root, fifth, lfo, air];
    for (const n of nodes) n.start(t0);
    // A stop asked for while the clock was still waking takes effect now.
    const stopAfter = bed.stopAfter;
    bed = { out, lp, nodes };
    if (stopAfter != null) stopBed(stopAfter);
  });
}

export function stopBed(fade = 1.2) {
  if (!bed) return;
  if (bed.pending) {
    bed.stopAfter = fade;
    return;
  }
  if (!bus) {
    bed = null;
    return;
  }
  const { out, nodes } = bed;
  const t = bus.ctx.currentTime;
  out.gain.cancelScheduledValues(t);
  out.gain.setValueAtTime(Math.max(out.gain.value, 0.0001), t);
  out.gain.exponentialRampToValueAtTime(0.0001, t + fade);
  for (const n of nodes) n.stop(t + fade + 0.05);
  bed = null;
}

export function setBedOpen(amount) {
  if (!bed || bed.pending || !bus) return;
  const open = Math.max(0, Math.min(1, amount));
  bed.lp.frequency.setTargetAtTime(BED_CLOSED + open * BED_SPAN, bus.ctx.currentTime, 0.4);
}

export function suspendBus() {
  bus?.ctx.suspend?.().catch?.(() => {});
}

// For tests: forget the context and the bed.
export function resetBus() {
  try {
    bus?.ctx.close?.();
  } catch {
    /* already closed */
  }
  bus = null;
  bed = null;
}
