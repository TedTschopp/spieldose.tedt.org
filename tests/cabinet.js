'use strict';
// The music box cabinet: shelves (themes) hold interchangeable mechanisms (sections), each holding any number of airs.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scoreScript = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(s => s.includes('/* Scrimshaw score format:'));
const scoreSandbox = { module: { exports: {} } };
vm.runInNewContext(scoreScript, scoreSandbox);
const score = scoreSandbox.module.exports;
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'scores.js'), 'utf8'), sandbox);
const { ScrimTracks: tracks, ScrimCabinet: cabinet } = sandbox.window;
const { slug } = require('../sharing.js');

assert.ok(cabinet && Array.isArray(cabinet.shelves) && Array.isArray(cabinet.sections), 'scores.js exports the cabinet');
const MECHANISMS = ['cylinder', 'disc', 'barrel', 'roll'];
assert.deepEqual(Object.keys(cabinet.mechanisms).sort(), [...MECHANISMS].sort(), 'Every mechanism has its vocabulary');
for (const mechanism of MECHANISMS) {
  const words = cabinet.mechanisms[mechanism];
  for (const key of ['name', 'machine', 'air', 'airs', 'new']) assert.ok(typeof words[key] === 'string' && words[key], `${mechanism}.${key}`);
}

// The original Alpine cylinder stays first and byte-for-byte unchanged.
const alpine = tracks.slice(0, 6);
assert.equal(createHash('sha256').update(JSON.stringify(alpine.map(t => [t.file, t.text]))).digest('hex'),
  '9c3bbdeaa85d879b9822c4dcf759ea28ed4014437670b8f523a4079dc7456859', 'Alpine scores are unchanged');
assert.ok(alpine.every(t => t.section === 'alpine-night'));

const shelfIds = cabinet.shelves.map(s => s.id);
for (const id of ['alpine', 'holidays', 'world', 'genre']) assert.ok(shelfIds.includes(id), `${id} shelf`);
const sectionIds = cabinet.sections.map(s => s.id);
assert.equal(new Set(sectionIds).size, sectionIds.length, 'Section ids are unique');
const expectSections = {
  'alpine-night': ['alpine', 'cylinder'],
  'winter-holidays': ['holidays', 'disc'],
  'world-folk': ['world', 'barrel'],
  'western-picture-show': ['genre', 'roll']
};
for (const [id, [shelf, mechanism]] of Object.entries(expectSections)) {
  const section = cabinet.sections.find(s => s.id === id);
  assert.ok(section, `${id} section`);
  assert.equal(section.shelf, shelf, `${id} sits on the ${shelf} shelf`);
  assert.equal(section.mechanism, mechanism, `${id} is a ${mechanism}`);
  assert.ok(section.name && section.blurb, `${id} has a name and blurb`);
}
const counts = Object.fromEntries(sectionIds.map(id => [id, tracks.filter(t => t.section === id).length]));
assert.ok(Object.values(counts).some(n => n > 6), 'At least one section holds more than six airs');
assert.ok(Object.values(counts).every(n => n > 0), 'Every bundled section has airs');

const slugs = tracks.map(slug);
assert.equal(new Set(slugs).size, slugs.length, 'Every air has a unique permalink slug');
for (const track of tracks) {
  assert.ok(sectionIds.includes(track.section), `${track.file} belongs to a known section`);
  const compiled = score.compile(track.text);
  assert.deepEqual(Array.from(compiled.errors), [], `${track.file}: ${JSON.stringify(compiled.errors)}`);
  assert.ok(compiled.intro.dur + compiled.loop.dur > 0, `${track.file} plays`);
  assert.ok(compiled.title && compiled.about, `${track.file} has a title and about`);
  assert.ok(/^\S/.test(compiled.composer || 'x'), `${track.file} composer`);
  const source = path.join(root, 'scores', track.section, track.file);
  assert.equal(fs.readFileSync(source, 'utf8'), track.text, `${track.file} matches its source file`);
}
for (const id of sectionIds) {
  const dir = path.join(root, 'scores', id);
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.scrim'))) {
    assert.ok(tracks.some(t => t.section === id && t.file === file), `${id}/${file} is bundled`);
  }
}
assert.match(html, /<script src="scores\.js"><\/script>/);
const joy = tracks.find(t => t.file === 'joy-to-the-world.scrim');
assert.equal(createHash('sha256').update(joy.text).digest('hex'),
  '8303bb69248ea1c1f73f7c93b460ae29f6f5cd818a6153a5c46389a4fd9273f2',
  'Joy to the World matches the supplied arrangement exactly, including credits');
const variations = score.compile(joy.text);
assert.equal(variations.title, 'Variations on Joy to the World');
assert.equal(variations.voices.length, 18);
assert.equal(variations.intro.sections.reduce((sum, section) => sum + section.bars, 0), 47);
assert.equal(variations.intro.dur, 94);
assert.equal(variations.loop.dur, 0, 'The supplied finale ends rather than looping');
const silentNight = tracks.find(t => t.file === 'silent-night.scrim');
assert.equal(createHash('sha256').update(silentNight.text).digest('hex'),
  '486d890738ba2058801ee4ee54f60a24058160871eaad9a2463b358ca24faac2',
  'Silent Night matches the supplied score exactly, including CC BY-SA attribution');
const stilleNacht = score.compile(silentNight.text);
assert.equal(stilleNacht.title, 'Stille Nacht (Silent Night)');
assert.equal(stilleNacht.voices.length, 18);
assert.deepEqual(Array.from(stilleNacht.intro.sections, s => [s.name, s.bars]),
  [['verse1', 24], ['verse2', 24], ['verse3', 24]]);
assert.ok(Math.abs(stilleNacht.intro.dur - 72 * 3 * 60 / 84) < 1e-9);
assert.equal(stilleNacht.loop.dur, 0, 'All three supplied verses play once');
assert.match(html, /Michael Stenov/);
assert.match(html, /href="https:\/\/creativecommons\.org\/licenses\/by-sa\/4\.0\/"/,
  'The separately licensed arrangement has a visible license link');
console.log(`PASS: cabinet of ${cabinet.shelves.length} shelves and ${sectionIds.length} sections (${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(', ')}), Alpine scores unchanged`);
