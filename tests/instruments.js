'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
for (const script of scripts) new vm.Script(script);
function load(marker) {
  const sandbox = { module: { exports: {} } };
  const script = scripts.find(s => s.includes(marker))
    .replace('const api = { createSynth', 'const api = { _waves: WAVES, _pluck: PLUCK, createSynth');
  vm.runInNewContext(script, sandbox);
  return sandbox.module.exports;
}
const score = load('/* Scrimshaw score format:');
const synth = load('/* Scrimshaw synth:');
const added = ['piano', 'epiano', 'saxalto', 'saxtenor', 'elecguitar', 'elecbass',
  'violin', 'viola', 'cello', 'trombone', 'schwyzeroergeli', 'hackbrett', 'alphorn', 'buechel', 'yodel'];
const legacy = ['steeldrum', 'marimba', 'vibes', 'celesta', 'glock', 'xylophone', 'musicbox',
  'bell', 'organ', 'pipe', 'strings', 'pad', 'choir', 'voices', 'brass', 'trumpet', 'horn', 'tuba',
  'flute', 'clarinet', 'oboe', 'bassoon', 'accordion', 'fiddle', 'harp', 'guitar', 'banjo',
  'harpsichord', 'pizz', 'upright', 'fretless', 'synbass', 'timpani', 'chip', 'sine', 'square', 'saw', 'triangle'];
const hash = s => createHash('sha256').update(s).digest('hex');
const select = (object, keys) => Object.fromEntries(keys.map(k => [k, object[k]]));
assert.equal(hash(JSON.stringify([
  select(synth._waves, ['organ', 'pipe', 'clarinet', 'oboe', 'bassoon', 'reed', 'horn']),
  select(synth._pluck, ['harp', 'guitar', 'banjo', 'harpsichord', 'pizz', 'upright']),
  Object.entries(synth.DRUM).map(([k, v]) => [k, v.rev, v.level, v.hit.toString()])
])), 'e00db9d2ba3e0277f9dcd643609b7bd3e259c7e99c54af700b9bb94a733af6b3',
'Existing waveforms, string configurations and percussion must remain unchanged');
assert.equal(hash(JSON.stringify(legacy.map(k => {
  const v = synth.INST[k];
  return [k, v.rev, v.level, v.play.toString()];
}))), 'cff276455725f4f48e4e530a643195e3536fc6624a5b5dded2f758046eab881a',
'Existing instrument definitions must remain unchanged');
const trackAt = html.indexOf('const TRACKS = window.ScrimTracks;');
assert.notEqual(trackAt, -1);
const uiScript = scripts.find(s => s.includes('const TRACKS = window.ScrimTracks;'));
assert.ok(uiScript);
assert.equal(hash(scripts.find(s => s.includes('/* Scrimshaw score format:'))),
  '733c4c3ee6d3ea440698be90f88f4f9a3408608eca62d60250ad7fee6a715963',
  'Parser/compiler source must remain unchanged');
assert.equal(hash(scripts.find(s => s.includes('/* Scrimshaw synth:'))),
  '0025f7f142c91b8ac0796adb049e5a5c246fb0003e8866928918079039aad777',
  'Synth source must remain unchanged');
const playerStart = uiScript.indexOf('  const player = {');
const playerEnd = uiScript.indexOf('\n\n  // where are we in the song?', playerStart);
const rollStart = uiScript.indexOf('  const roll = (() => {');
const rollEnd = uiScript.indexOf('  const ui = (() => {', rollStart);
const playerSource = uiScript.slice(playerStart, playerEnd);
assert.ok(playerSource.includes('if (!song.loop.dur || !state.loop)'), 'One-shot timelines stop even when looping is enabled');
assert.equal(hash(playerSource.replace('if (!song.loop.dur || !state.loop)', 'if (!state.loop)')),
  'a1b519748f0cb7595748060fd4f1221d06b38e0525f7f95caa6d09ee929f116b',
  'Playback scheduling and audio lifecycle must remain unchanged except for the empty-loop completion fix');
assert.equal(hash(uiScript.slice(rollStart, rollEnd)),
  '7104e9d6b38de7e7e52c7055cacbb5d85792e6c437037159da038622f169e430',
  'Score-roll rendering must remain unchanged');
assert.deepEqual([...score.MELODIC].sort(), Object.keys(synth.INST).sort());
assert.equal(new Set(score.MELODIC).size, score.MELODIC.length);

const reference = html.match(/<dl class="inst">([\s\S]*?)<\/dl>/)[1];
const prompt = html.match(/id="llm-prompt"[^>]*>([\s\S]*?)<\/pre>/)[1];
for (const name of added) {
  assert.ok(score.MELODIC.includes(name), `${name} is allowed`);
  assert.equal(typeof synth.INST[name]?.play, 'function', `${name} has a synth`);
  assert.match(reference, new RegExp(`\\b${name}\\b`));
  assert.match(prompt, new RegExp(`\\b${name}\\b`));
  const text = `tempo 120\nbeats 4\nsteps 1\nvoice lead ${name.toUpperCase()}\npattern A\nlead | C4 D4 [C] ~E4 |\nloop A`;
  assert.equal(score.parse(text).errors.length, 0, name);
  const song = score.compile(text);
  assert.equal(song.errors.length, 0, JSON.stringify(song.errors));
  assert.equal(song.voices[0].inst, name);
  assert.equal(song.loop.events.length, 4);
  assert.equal(song.loop.dur, 2);
  assert.deepEqual([...song.loop.events[0].m], [60]);
  assert.equal(song.loop.events[2].m.length, 3);
  assert.deepEqual([...song.loop.events[3].m], [64]);
}
assert.match(score.parse('voice bad missinginstrument').errors[0].msg, /Unknown instrument/);

function audioMock() {
  const nodes = [];
  function param(value = 0) {
    return {
      value, events: [],
      setValueAtTime(v, t) { this.record('set', v, t); },
      linearRampToValueAtTime(v, t) { this.record('linear', v, t); },
      exponentialRampToValueAtTime(v, t) { assert.ok(v > 0); this.record('exp', v, t); },
      setTargetAtTime(v, t, tau) { assert.ok(tau > 0); this.record('target', v, t, tau); },
      record(...event) {
        assert.ok(event.slice(1).every(Number.isFinite), JSON.stringify(event));
        assert.ok(event[2] >= 0);
        this.events.push(event);
      }
    };
  }
  function node(kind) {
    const n = { kind, connections: [], gain: param(), frequency: param(), detune: param(),
      Q: param(), playbackRate: param(1), connect(target) { this.connections.push(target); return target; },
      setPeriodicWave(w) { this.wave = w; },
      start(t) { assert.ok(Number.isFinite(t) && t >= 0); this.startTime = t; },
      stop(t) { assert.ok(Number.isFinite(t) && t > this.startTime); this.stopTime = t; } };
    nodes.push(n);
    return n;
  }
  const ctx = { sampleRate: 44100, createGain: () => node('gain'),
    createBiquadFilter: () => node('filter'), createOscillator: () => node('oscillator'),
    createBufferSource: () => node('buffer'),
    createPeriodicWave: (real, imag) => ({ real: [...real], imag: [...imag] }),
    createBuffer(channels, length, sr) {
      assert.ok(length > 0 && Number.isFinite(length));
      const data = new Float32Array(length);
      return { duration: length / sr, getChannelData: () => data };
    } };
  return { S: { ctx, nyq: 22050, waves: {}, ks: {}, noise: { duration: 3 } }, nodes, out: node('output') };
}
function sound(name, f, p = {}) {
  const mock = audioMock();
  synth.INST[name].play(mock.S, mock.out, .1, .3, f, .7,
    { bright: 1, att: null, rel: null, from: null, glide: .07, ...p });
  const sources = mock.nodes.filter(n => ['oscillator', 'buffer'].includes(n.kind));
  assert.ok(sources.length > 0, `${name} creates sound sources`);
  for (const n of sources) {
    assert.ok(n.stopTime > n.startTime, `${name} stops sources`);
    assert.ok(n.connections.length > 0, `${name} connects sources`);
    if (n.buffer?.getChannelData) assert.ok(n.buffer.getChannelData(0).every(Number.isFinite));
  }
  return mock;
}
for (const name of added) {
  assert.ok(synth.INST[name].level > 0 && synth.INST[name].level <= 3);
  assert.ok(synth.INST[name].rev >= 0 && synth.INST[name].rev <= 1);
  for (const f of [55, 220, 880, 7902]) {
    sound(name, f);
    sound(name, f, { bright: 4, att: .001, rel: .005, from: f / 2 });
    sound(name, f, { bright: .1, att: 4, rel: 6 });
  }
}
const reeds = sound('schwyzeroergeli', 220).nodes.filter(n => n.wave);
assert.equal(reeds.length, 3);
assert.deepEqual(reeds.map(n => n.frequency.events[0][1]), [220, 440, 440]);
assert.ok(reeds[1].detune.value !== reeds[2].detune.value, 'Octave reeds beat');
const signatures = added.map(name => JSON.stringify(sound(name, 220).nodes.map(n =>
  [n.kind, n.type, n.wave, n.frequency.value, n.frequency.events, n.detune.value, n.gain.events])));
assert.equal(new Set(signatures).size, added.length, 'All new timbres have distinct graphs');
const chest = sound('yodel', 220).nodes.find(n => n.wave).wave.imag;
const head = sound('yodel', 880).nodes.find(n => n.wave).wave.imag;
assert.notDeepEqual(chest, head, 'Yodel changes excitation with register');
console.log('PASS: 15 instruments, parser/compile, sound graphs, envelopes, lists, unchanged legacy sounds and playback');
