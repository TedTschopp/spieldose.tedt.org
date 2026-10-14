'use strict';
const assert = require('node:assert/strict');
const layout = require('../village-layout.js');

let seed = 0x5eed1234;
const random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 0x100000000;
};

const seenPositions = new Set();
const seenGroundTypes = new Set(), seenAttachedTypes = new Set();
for (let i = 0; i < 80; i++) {
  const village = layout.createVillage(random);
  assert.ok(village.buildings.length + 1 >= 3 && village.buildings.length + 1 <= 7,
    'village has 3–7 buildings, counting the church');
  const ground = village.landmarks.filter(l => l.baseY !== undefined);
  const attached = village.landmarks.filter(l => l.buildingId !== undefined);
  assert.ok(ground.length >= 5 && ground.length <= 10, 'village has 5–10 everyday ground features');
  assert.ok(new Set(ground.map(l => l.type)).size >= Math.min(5, ground.length),
    'ground features are a varied mix, not one repeated item');
  for (const building of village.buildings) {
    const own = attached.filter(l => l.buildingId === building.id);
    assert.ok(own.length >= 1 && own.length <= 2, 'each building carries 1–2 household details');
    assert.equal(new Set(own.map(l => l.type)).size, own.length, 'no duplicate detail on one building');
  }
  for (const item of ground) {
    seenGroundTypes.add(item.type);
    assert.ok(layout.GROUND_FEATURES[item.type], 'ground feature has a footprint');
    assert.ok(item.baseY <= 107, 'ground feature keeps the bottom walking lane open');
  }
  for (const item of attached) seenAttachedTypes.add(item.type);
  assert.equal(village.landmarks[0].type, 'flag', 'every village keeps its municipal flag');
  assert.ok(village.trees.length >= 12 && village.trees.length <= 32,
    'each village has a random group of 12–32 trees');
  for (const building of village.buildings) {
    assert.ok(layout.BUILDING_VARIANTS[building.type][building.variant], 'building variant exists');
    assert.ok(building.x >= 0 && building.x + building.w <= 320, 'building stays in scene bounds');
    assert.ok(building.baseY <= 120, 'building stays above the ground edge');
  }
  seenPositions.add(village.buildings.map(b => `${b.x},${b.y}`).join(';'));
  assert.equal(village.paths.length, 3, 'each village has three calculated ground paths');
  for (const path of village.paths) {
    assert.equal(path.layer, 'ground');
    for (let i = 1; i < path.points.length; i++) {
      const [x0, y0] = path.points[i - 1], [x1, y1] = path.points[i];
      const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
      for (let j = 0; j <= steps; j++) {
        const f = steps ? j / steps : 0;
        assert.ok(layout.bodyClearAt(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, village.obstacles),
          'full creature footprint clears randomized scene obstacles');
      }
    }
  }
}
assert.ok(seenPositions.size > 75, 'building layouts use varied positions across page loads');
assert.deepEqual([...seenGroundTypes].sort(), Object.keys(layout.GROUND_FEATURES).sort(),
  'every everyday ground feature appears across loads');
assert.deepEqual([...seenAttachedTypes].sort(), [...layout.ATTACHED_LANDMARKS].sort(),
  'every household detail appears across loads');

// Creature parade: shuffled rounds, each creature once per round, never back-to-back.
const openings = new Set();
for (let run = 0; run < 40; run++) {
  const next = layout.createParade(9, 3, random);
  const shows = Array.from({ length: 45 }, (_, i) => next(i));
  openings.add(shows.slice(0, 9).map(s => s.creature).join(','));
  for (let round = 0; round < 5; round++)
    assert.deepEqual(shows.slice(round * 9, round * 9 + 9).map(s => s.creature).sort(),
      [0, 1, 2, 3, 4, 5, 6, 7, 8], 'each round shows every creature exactly once');
  for (let i = 1; i < shows.length; i++)
    assert.notEqual(shows[i].creature, shows[i - 1].creature, 'no creature appears twice in a row');
  assert.ok(shows.every(s => s.path >= 0 && s.path < 3));
}
assert.ok(openings.size > 35, 'opening order differs between page loads');

const ridgeAt = (points, x) => {
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1], [x1, y1] = points[i];
    if (x <= x1) return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
  }
  return points[points.length - 1][1];
};
const skylines = new Set();
for (let i = 0; i < 60; i++) {
  const ranges = layout.createMountains(random);
  assert.equal(ranges.length, 3, 'far, middle and near ranges');
  skylines.add(ranges[0].points.map(p => p.join(',')).join(';'));
  for (const range of ranges) {
    assert.equal(range.points[0][0], 0);
    assert.equal(range.points[range.points.length - 1][0], 320);
    for (let x = 160; x <= 169; x++)
      assert.ok(ridgeAt(range.points, x) >= 31, 'church cross (y 22–29) always stands against open sky');
    for (let x = 250; x <= 274; x++)
      assert.ok(ridgeAt(range.points, x) >= 25, 'moon (y 3–23) stays unobstructed');
  }
}
assert.ok(skylines.size > 55, 'mountain skyline changes between loads');

for (const [type, variants] of Object.entries(layout.BUILDING_VARIANTS)) {
  assert.equal(variants.length, 3, `${type} has three visual versions`);
  assert.equal(new Set(variants.map(JSON.stringify)).size, 3, `${type} versions differ`);
}
for (const [type, variants] of Object.entries(layout.LANDMARK_VARIANTS)) {
  assert.equal(variants.length, 3, `${type} has three visual versions`);
  assert.equal(new Set(variants.map(JSON.stringify)).size, 3, `${type} versions differ`);
}

console.log('PASS: randomized village size, placement, landmarks, variants, and full-body clear routes');
