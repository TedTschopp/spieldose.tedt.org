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
  assert.ok(ground.length >= 1 && ground.length <= 5, 'village has 1–5 everyday ground features');
  assert.equal(new Set(ground.map(l => l.type)).size, ground.length,
    'ground features are a varied mix, not one repeated item');
  for (const building of village.buildings) {
    const own = attached.filter(l => l.buildingId === building.id);
    assert.equal(new Set(own.map(l => layout.ATTACHED_SLOTS[l.type])).size, own.length,
      'no two details share a wall slot on one building');
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

// Feature count follows a bell curve centred on three (1 + Binomial(4, 1/2)).
{
  const counts = [0, 0, 0, 0, 0, 0];
  const runs = 1600;
  for (let run = 0; run < runs; run++)
    counts[layout.createVillage(random).landmarks.filter(l => l.baseY !== undefined).length]++;
  const expected = [0, 1, 4, 6, 4, 1].map(k => k / 16);
  for (let n = 1; n <= 5; n++)
    assert.ok(Math.abs(counts[n] / runs - expected[n]) < .04,
      `count ${n} appears ${(counts[n] / runs).toFixed(3)}, expected about ${expected[n].toFixed(3)}`);
}

// One roll pool: building details are placed when rolled but never count toward the 1–5 ground limit.
{
  let villagesWithoutDetails = 0, totalDetails = 0, totalGround = 0;
  const runs = 1200;
  for (let run = 0; run < runs; run++) {
    const village = layout.createVillage(random);
    const details = village.landmarks.filter(l => l.buildingId !== undefined).length;
    totalDetails += details;
    totalGround += village.landmarks.filter(l => l.baseY !== undefined).length;
    if (!details) villagesWithoutDetails++;
  }
  // Six detail kinds against twelve ground kinds: about one detail per two ground features.
  const ratio = totalDetails / totalGround;
  assert.ok(ratio > .3 && ratio < .8, `details per ground feature ${ratio.toFixed(2)} follows the roll pool`);
  assert.ok(villagesWithoutDetails > runs * .1, 'some villages roll no building details at all');
}

// Road: only things that belong on a street may stand on it.
assert.deepEqual([...layout.ROAD_FEATURES].sort(), ['handcart', 'marketStall']);
for (let run = 0; run < 400; run++) {
  const village = layout.createVillage(random);
  const onRoad = (x0, x1, y) => layout.roadSpanOverlaps(x0, x1, y);
  for (const b of village.buildings)
    assert.ok(!onRoad(b.x - 2, b.x + b.w + 2, b.baseY), `${b.type} stays off the road`);
  for (const t of village.trees)
    assert.ok(!onRoad(t.x - 4, t.x + 4, t.y), 'trees stay off the road');
  for (const item of village.landmarks.filter(l => l.baseY !== undefined)) {
    if (layout.ROAD_FEATURES.has(item.type)) continue;
    const spec = layout.GROUND_FEATURES[item.type];
    assert.ok(!onRoad(item.x - spec.left, item.x + spec.right, item.baseY),
      `${item.type} at ${item.x},${item.baseY} stays off the road`);
  }
}

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
