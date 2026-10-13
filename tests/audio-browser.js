'use strict';

// Load after index.html, then await runInstrumentAudioTests() in a browser console.
async function runInstrumentAudioTests() {
  const names = ['piano', 'epiano', 'saxalto', 'saxtenor', 'elecguitar', 'elecbass',
    'violin', 'viola', 'cello', 'trombone', 'schwyzeroergeli', 'hackbrett', 'alphorn', 'buechel', 'yodel'];
  const results = [];
  function check(ok, message) { if (!ok) throw new Error(message); }
  function rms(data, from, to) {
    let sum = 0;
    for (let i = from; i < to; i++) sum += data[i] * data[i];
    return Math.sqrt(sum / (to - from));
  }
  for (const name of names) {
    for (const variant of ['normal', 'short-bright', 'chord', 'long-attack']) {
      const options = variant === 'short-bright' ? 'bright=4 att=0.001 rel=0.005'
        : variant === 'long-attack' ? 'att=0.8 rel=0.15' : '';
      const notes = variant === 'chord' ? 'C4+E4+G4' : variant === 'short-bright' ? 'E7' : 'A3';
      const song = ScrimScore.compile(`beats 1\nsteps 1\nvoice a ${name} ${options}\npattern A\na | ${notes} |\nplay A`);
      check(!song.errors.length, `${name}: ${JSON.stringify(song.errors)}`);
      const sr = 44100;
      const ctx = new OfflineAudioContext(2, sr * 4, sr);
      const syn = ScrimSynth.createSynth(ctx, ctx.destination);
      const session = syn.session(song);
      // Call the public definition directly too: the player's legacy catch must not hide a failure.
      session.ch[0].def.play(syn.S, session.ch[0].input, .05, .3,
        ScrimSynth.mtof(song.intro.events[0].m[0]), 0,
        { bright: song.voices[0].bright, att: song.voices[0].att, rel: song.voices[0].rel,
          glide: .07, from: null });
      session.play(song.intro.events[0], .1);
      const buffer = await ctx.startRendering();
      let peak = 0;
      for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
        for (const sample of buffer.getChannelData(ch)) {
          check(Number.isFinite(sample), `${name}/${variant}: nonfinite audio`);
          peak = Math.max(peak, Math.abs(sample));
        }
      }
      const data = buffer.getChannelData(0);
      const active = rms(data, Math.floor(sr * .1), Math.floor(sr * 1.2));
      const tail = rms(data, Math.floor(sr * 3.8), sr * 4);
      check(active > .0005, `${name}/${variant}: silent (RMS ${active})`);
      check(peak < .98, `${name}/${variant}: clipping (peak ${peak})`);
      check(tail < .004, `${name}/${variant}: unreleased tail (RMS ${tail})`);
      results.push({ name, variant, rms: +active.toFixed(5), peak: +peak.toFixed(5), tail: +tail.toFixed(6) });
    }
  }
  return results;
}

async function runTuneAudioTests() {
  const results = [];
  for (const track of ScrimTracks) {
    const song = ScrimScore.compile(track.text);
    if (song.errors.length) throw new Error(`${track.file}: ${JSON.stringify(song.errors)}`);
    const sampleRate = 44100;
    const seconds = 4;
    const ctx = new OfflineAudioContext(2, sampleRate * seconds, sampleRate);
    const synth = ScrimSynth.createSynth(ctx, ctx.destination);
    const session = synth.session(song);
    const events = song.intro.events.map(event => [event, event.t])
      .concat(song.loop.events.map(event => [event, event.t + song.intro.dur]));
    for (const [event, time] of events) {
      if (time + .05 < seconds) session.play(event, time + .05);
    }
    const audio = await ctx.startRendering();
    let peak = 0, energy = 0;
    for (let channel = 0; channel < audio.numberOfChannels; channel++) {
      for (const sample of audio.getChannelData(channel)) {
        if (!Number.isFinite(sample)) throw new Error(`${track.file}: nonfinite audio`);
        peak = Math.max(peak, Math.abs(sample));
        energy += sample * sample;
      }
    }
    const rms = Math.sqrt(energy / (audio.numberOfChannels * sampleRate * seconds));
    if (rms < .0005) throw new Error(`${track.file}: silent audio (RMS ${rms})`);
    if (peak >= .99) throw new Error(`${track.file}: clipped audio (peak ${peak})`);
    results.push({ file: track.file, rms: +rms.toFixed(5), peak: +peak.toFixed(5) });
  }
  return results;
}
