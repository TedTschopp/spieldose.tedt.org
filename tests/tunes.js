'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const scoreScript = scripts.find(s => s.includes('/* Scrimshaw score format:'));
const scoreSandbox = { module: { exports: {} } };
vm.runInNewContext(scoreScript, scoreSandbox);
const score = scoreSandbox.module.exports;
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'scores.js'), 'utf8'), sandbox);
const allTracks = sandbox.window.ScrimTracks;
assert.ok(Array.isArray(allTracks), 'score bundle exports a track list');
const tracks = allTracks.filter(track => track.section === 'alpine-night');
assert.equal(tracks.length, 6);
assert.deepEqual(Array.from(tracks, track => track.file), [
  '01-sennentuntschis-lullaby.scrim',
  '02-stollenwurm-behind-the-stove.scrim',
  '03-wildmannlis-midnight-dance.scrim',
  '04-do-not-wake-the-rollibock.scrim',
  '05-three-steps-aside-for-the-tuerst.scrim',
  '06-devils-bridge-mazurka.scrim'
]);
const expected = [
  ["The Sennentuntschi's Lullaby", ['musicbox']],
  ['The Stollenwurm Behind the Stove', ['schwyzeroergeli']],
  ["The Wildmannli's Midnight Dance", ['violin', 'hackbrett', 'cello']],
  ['Do Not Wake the Rollibock', ['alphorn', 'yodel', 'schwyzeroergeli']],
  ['Three Steps Aside for the Tuerst', ['clarinet', 'schwyzeroergeli', 'buechel']],
  ["The Devil's Bridge Mazurka", ['violin', 'clarinet', 'schwyzeroergeli']]
];
for (const [i, track] of tracks.entries()) {
  assert.equal(typeof track.text, 'string');
  const compiled = score.compile(track.text);
  assert.deepEqual(Array.from(compiled.errors), [], `${track.file}: ${JSON.stringify(compiled.errors)}`);
  assert.equal(compiled.title, expected[i][0]);
  assert.ok(compiled.intro.dur > 0 && compiled.loop.dur > 0);
  const names = Array.from(compiled.voices, voice => voice.inst);
  for (const instrument of expected[i][1]) assert.ok(names.includes(instrument), `${track.file}: ${instrument}`);
}
assert.match(html, /<script src="scores\.js"><\/script>/);
assert.match(html, /const TRACKS = window\.ScrimTracks;/);
assert.match(html, /A cabinet of music box airs: pinned cylinders, steel discs, organ barrels and piano rolls/);
console.log('PASS: six supplied Swiss scores load as tracks and compile with the intended instruments');
