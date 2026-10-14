'use strict';
const assert = require('node:assert/strict');
const layout = require('../village-layout.js');

let seed = 0x5eed1234;
const random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 0x100000000;
};

const seenPositions = new Set();
for (let i = 0; i < 80; i++) {
  const village = layout.createVillage(random);
  assert.ok(village.buildings.length + 1 >= 3 && village.buildings.length + 1 <= 7,
    'village has 3–7 buildings, counting the church');
  assert.ok(village.landmarks.length >= 1 && village.landmarks.length <= 3,
    'village has 1–3 landmarks');
  assert.equal(village.landmarks[0].type, 'flag', 'every village keeps its municipal flag');
  assert.ok(village.trees.length >= 12 && village.trees.length <= 32,
    'each village has a random group of 12–32 trees');
  for (const building of village.buildings) {
    assert.ok(layout.BUILDING_VARIANTS[building.type][building.variant], 'building variant exists');
    assert.ok(building.x >= 0 && building.x + building.w <= 320, 'building stays in scene bounds');
    assert.ok(building.baseY <= 120, 'building stays above the ground edge');
  }
  const groundLandmarks = village.landmarks.filter(l => ['hitchingPost', 'fountain'].includes(l.type));
  assert.ok(groundLandmarks.length <= 1, 'ground landmarks do not compete for the same clear site');
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
