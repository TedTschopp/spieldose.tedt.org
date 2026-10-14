/* Random village geometry and full-sprite-clear walking routes. */
(function (root) {
  'use strict';
  const BUILDING_VARIANTS = {
    farmhouse: [
      { wall: '#d3bba0', roof: '#563f3e', trim: '#e1ddd4', accent: '#6e5751', form: 'gable' },
      { wall: '#c4a786', roof: '#51413b', trim: '#ddd0b5', accent: '#7d5539', form: 'gable' },
      { wall: '#d2c1a8', roof: '#60483d', trim: '#e6dfcf', accent: '#765347', form: 'gable' }
    ],
    barn: [
      { wall: '#8b6049', roof: '#4d3b39', trim: '#c9a77e', accent: '#51392e', form: 'loft' },
      { wall: '#a06c4c', roof: '#493738', trim: '#dfc49a', accent: '#624333', form: 'loft' },
      { wall: '#765447', roof: '#403638', trim: '#b9946d', accent: '#49332d', form: 'loft' }
    ],
    granary: [
      { wall: '#b99a70', roof: '#57433b', trim: '#e1c99d', accent: '#66513a', form: 'raised' },
      { wall: '#a98c67', roof: '#4e403a', trim: '#d9c6a4', accent: '#765b3e', form: 'raised' },
      { wall: '#c6a779', roof: '#625044', trim: '#e8d5ad', accent: '#71593f', form: 'raised' }
    ],
    bakehouse: [
      { wall: '#9b8d7d', roof: '#625348', trim: '#c9bca9', accent: '#342d2a', form: 'oven' },
      { wall: '#aa9580', roof: '#594b44', trim: '#d8c7aa', accent: '#40302b', form: 'oven' },
      { wall: '#8c8278', roof: '#514843', trim: '#bfb3a2', accent: '#2c2927', form: 'oven' }
    ],
    inn: [
      { wall: '#c5a277', roof: '#583f3a', trim: '#e5d0a7', accent: '#9b633e', form: 'gable' },
      { wall: '#bd9870', roof: '#4b3935', trim: '#ddc69f', accent: '#a66b45', form: 'gable' },
      { wall: '#d0b58e', roof: '#65473e', trim: '#e8d7b8', accent: '#89563d', form: 'gable' }
    ],
    dairy: [
      { wall: '#d8cdb8', roof: '#4f4440', trim: '#ece3d0', accent: '#5f6f73', form: 'gable' },
      { wall: '#cbbfa6', roof: '#5b4a41', trim: '#e3d8c1', accent: '#6b5a4a', form: 'gable' },
      { wall: '#e0d6c4', roof: '#463f3d', trim: '#f0e8d8', accent: '#56656a', form: 'gable' }
    ]
  };
  const BUILDING_SIZES = {
    farmhouse: [20, 29, 13, 19],
    barn: [22, 30, 14, 20],
    granary: [14, 19, 14, 19],
    bakehouse: [16, 23, 11, 15],
    inn: [22, 30, 15, 20],
    dairy: [18, 25, 13, 18]
  };
  const LANDMARK_VARIANTS = {
    flag: [
      { hem: '#e8d8b2', fringe: false },
      { hem: '#d8c69b', fringe: true },
      { hem: '#eee4cf', fringe: false }
    ],
    hitchingPost: [
      { wood: '#78634b', rail: '#9a7954', railY: 0 },
      { wood: '#5e4938', rail: '#a17c50', railY: 1 },
      { wood: '#8c7050', rail: '#604936', railY: 0 }
    ],
    fountain: [
      { stone: '#9b9b8d', water: '#9cc4c6', rim: '#c0bba5' },
      { stone: '#807f78', water: '#8cb4bd', rim: '#b3ad9e' },
      { stone: '#aaa493', water: '#a1cbd0', rim: '#d0c6ac' }
    ],
    flowerBox: [
      { box: '#70513b', flower: '#c84b43', leaf: '#64834d' },
      { box: '#805b3d', flower: '#e6bd54', leaf: '#64834d' },
      { box: '#604b3d', flower: '#ad7194', leaf: '#7d914a' }
    ],
    innSign: [
      { board: '#73513b', symbol: '#e5c273', shape: 'bell' },
      { board: '#5c4739', symbol: '#d2d6c5', shape: 'goat' },
      { board: '#805c3e', symbol: '#d4c7a5', shape: 'mountain' }
    ],
    noticeboard: [
      { wood: '#644a37', paper: '#ded2b6', pin: '#c84b43' },
      { wood: '#77583e', paper: '#e9ddc3', pin: '#d2a247' },
      { wood: '#564337', paper: '#d4c5a9', pin: '#769486' }
    ],
    bells: [
      { beam: '#644a37', bell: '#c9a24a' },
      { beam: '#77583e', bell: '#b98e42' },
      { beam: '#564337', bell: '#d1b25e' }
    ],
    sundial: [
      { face: '#d8cdb2', line: '#5d4b3d', gnomon: '#3a3633', arc: 'half' },
      { face: '#c9b98f', line: '#6b3f34', gnomon: '#2d2b2a', arc: 'square' },
      { face: '#e1d7c4', line: '#40566a', gnomon: '#4a3f36', arc: 'half' }
    ],
    lintel: [
      { wood: '#5c4434', carve: '#d3b57c', motif: 'date' },
      { wood: '#6e4f37', carve: '#c84b43', motif: 'heart' },
      { wood: '#4f3c31', carve: '#d8cfb6', motif: 'edelweiss' }
    ],
    trough: [
      { wood: '#6b5038', water: '#89b3bb', pipe: '#7d7f80' },
      { wood: '#7f5d3f', water: '#9cc4c6', pipe: '#6b6158' },
      { wood: '#574234', water: '#82a9b4', pipe: '#8b8d88' }
    ],
    signpost: [
      { post: '#6b5038', arrow: '#d8cdb2', lean: 0 },
      { post: '#584334', arrow: '#e3c779', lean: 1 },
      { post: '#7d5f43', arrow: '#c9d3c3', lean: -1 }
    ],
    woodpile: [
      { log: '#8a6545', end: '#c7a477', roof: '#4f3c31' },
      { log: '#765338', end: '#b98f62', roof: '#5f4a3a' },
      { log: '#9a7451', end: '#d4b688', roof: '#433630' }
    ],
    handcart: [
      { box: '#7a5a3e', wheel: '#3f3530', load: '#c7a477' },
      { box: '#5f4a3a', wheel: '#2f2a28', load: '#9cb26b' },
      { box: '#8c6a48', wheel: '#4a3c33', load: '#d8cdb2' }
    ],
    milkPails: [
      { wood: '#8a6a4a', band: '#55504a', milk: '#efe9da' },
      { wood: '#a07b52', band: '#3f3a36', milk: '#e8e1cf' },
      { wood: '#765a40', band: '#6c6660', milk: '#f4efe2' }
    ],
    shrine: [
      { stone: '#9b9b8d', roof: '#5a4136', glow: '#f0c56a' },
      { stone: '#d8cdb2', roof: '#6d2f2c', glow: '#f2dc8f' },
      { stone: '#7c766c', roof: '#3f4a4a', glow: '#e8a95a' }
    ],
    coveredBench: [
      { wood: '#7a5a3e', roof: '#4f3c31', seat: '#a17c50' },
      { wood: '#5f4a3a', roof: '#6d2f2c', seat: '#8a6545' },
      { wood: '#8c6a48', roof: '#3f4a4a', seat: '#b38b5e' }
    ],
    boundaryStone: [
      { stone: '#8f8b80', mark: '#4a4640', symbol: 'cross' },
      { stone: '#a49b88', mark: '#5a4f45', symbol: 'key' },
      { stone: '#77756e', mark: '#3c3a36', symbol: 'line' }
    ],
    villageBell: [
      { wood: '#5c4434', roof: '#6d2f2c', bell: '#c9a24a' },
      { wood: '#6e4f37', roof: '#3f4a4a', bell: '#b98e42' },
      { wood: '#4f3c31', roof: '#5a4136', bell: '#d1b25e' }
    ],
    marketStall: [
      { stripe: '#c84b43', cloth: '#efe6d2', counter: '#6b5038', goods: '#e6bd54' },
      { stripe: '#3f6b8c', cloth: '#e8e1cf', counter: '#5f4a3a', goods: '#c84b43' },
      { stripe: '#5d7a45', cloth: '#efe6d2', counter: '#7a5a3e', goods: '#ad7194' }
    ]
  };
  // Free-standing everyday features: footprint around x, height above baseY,
  // and the moon-shadow box (width, height) cast from that footprint.
  const GROUND_FEATURES = {
    fountain: { left: 8, right: 9, height: 14, depth: 11, shadow: [14, 11] },
    hitchingPost: { left: 7, right: 8, height: 10, depth: 6, shadow: [12, 6] },
    trough: { left: 7, right: 8, height: 9, depth: 5, shadow: [14, 5] },
    signpost: { left: 6, right: 7, height: 13, depth: 4, shadow: [4, 11] },
    woodpile: { left: 7, right: 8, height: 10, depth: 6, shadow: [14, 8] },
    handcart: { left: 7, right: 8, height: 8, depth: 5, shadow: [13, 6] },
    milkPails: { left: 6, right: 7, height: 6, depth: 4, shadow: [11, 4] },
    shrine: { left: 4, right: 5, height: 13, depth: 4, shadow: [6, 12] },
    coveredBench: { left: 8, right: 9, height: 10, depth: 5, shadow: [16, 9] },
    boundaryStone: { left: 3, right: 4, height: 6, depth: 3, shadow: [5, 5] },
    villageBell: { left: 6, right: 7, height: 15, depth: 5, shadow: [10, 14] },
    marketStall: { left: 9, right: 10, height: 12, depth: 7, shadow: [18, 10] }
  };
  // Household details hang on a wall slot; a building never gets two in the same slot.
  const ATTACHED_SLOTS = {
    flowerBox: 'left', noticeboard: 'left', innSign: 'right',
    bells: 'top', sundial: 'top', lintel: 'door'
  };
  const TERRAIN = [[0, 51], [29, 58], [56, 72], [88, 81], [127, 89],
    [161, 92], [203, 87], [239, 76], [272, 57], [299, 49], [320, 43]];
  const BUILDING_TYPES = Object.keys(BUILDING_VARIANTS);
  const BUILDING_TYPE_SET = new Set(BUILDING_TYPES);
  const ATTACHED_LANDMARKS = Object.keys(ATTACHED_SLOTS);
  const GROUND_TYPES = Object.keys(GROUND_FEATURES);
  const GRID = { x0: -24, x1: 344, dx: 4, y0: 48, y1: 120, dy: 2 };
  const MAX_SPRITE = { width: 16, height: 12 };

  function pick(items, random) {
    return items[Math.floor(random() * items.length)];
  }
  function shuffle(items, random) {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
  // Each round shows every creature once in a fresh order; no creature repeats back-to-back.
  function createParade(count, pathCount, random = Math.random) {
    let bag = [], previous = null;
    return () => {
      if (!bag.length) {
        bag = shuffle(Array.from({ length: count }, (_, i) => i), random);
        if (previous && count > 1 && bag[0] === previous.creature) {
          const swap = 1 + Math.floor(random() * (count - 1));
          [bag[0], bag[swap]] = [bag[swap], bag[0]];
        }
      }
      const creature = bag.shift();
      const path = Math.floor(random() * pathCount);
      previous = { creature, path };
      return previous;
    };
  }
  function intBetween(min, max, random) {
    return min + Math.floor(random() * (max - min + 1));
  }
  function terrainAt(x) {
    if (x <= TERRAIN[0][0]) return TERRAIN[0][1];
    for (let i = 1; i < TERRAIN.length; i++) {
      if (x <= TERRAIN[i][0]) {
        const [x0, y0] = TERRAIN[i - 1], [x1, y1] = TERRAIN[i];
        return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
      }
    }
    return TERRAIN[TERRAIN.length - 1][1];
  }
  function roofHeight(building) {
    return building.type === 'bakehouse' ? 12 : Math.min(12, Math.max(9, Math.round(building.w * .42)));
  }
  function buildingObstacle(building) {
    return {
      x0: building.x - 4, x1: building.x + building.w + 4,
      y0: building.y - roofHeight(building),
      y1: building.baseY, kind: building.type
    };
  }
  function treeObstacle(tree) {
    return { x0: tree.x - 7, x1: tree.x + 8, y0: tree.y - tree.h, y1: tree.y, kind: 'tree' };
  }
  function overlaps(a, b, margin = 2) {
    return a.x0 < b.x1 + margin && a.x1 + margin > b.x0 &&
      a.y0 < b.y1 + margin && a.y1 + margin > b.y0;
  }
  function bodyClearAt(x, baseY, obstacles, width = MAX_SPRITE.width, height = MAX_SPRITE.height) {
    if (baseY < 48 || baseY > 120) return false;
    if (x >= 0 && x <= 320 && baseY < terrainAt(x) + 1) return false;
    const body = { x0: x - width / 2, x1: x + width / 2, y0: baseY - height, y1: baseY };
    return obstacles.every(obstacle => !overlaps(body, obstacle, .5));
  }
  function segmentClear(a, b, obstacles) {
    const steps = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]));
    for (let i = 0; i <= steps; i++) {
      const f = steps ? i / steps : 0;
      if (!bodyClearAt(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, obstacles)) return false;
    }
    return true;
  }
  function priorityPush(heap, item) {
    let i = heap.length;
    heap.push(item);
    while (i) {
      const parent = (i - 1) >> 1;
      if (heap[parent].f <= item.f) break;
      heap[i] = heap[parent]; i = parent;
    }
    heap[i] = item;
  }
  function priorityPop(heap) {
    const first = heap[0], last = heap.pop();
    if (heap.length) {
      let i = 0;
      while (true) {
        const left = i * 2 + 1, right = left + 1;
        if (left >= heap.length) break;
        const child = right < heap.length && heap[right].f < heap[left].f ? right : left;
        if (heap[child].f >= last.f) break;
        heap[i] = heap[child]; i = child;
      }
      heap[i] = last;
    }
    return first;
  }
  function planPath(laneOffset, obstacles) {
    const cols = (GRID.x1 - GRID.x0) / GRID.dx + 1;
    const rows = (GRID.y1 - GRID.y0) / GRID.dy + 1;
    const count = cols * rows;
    const idAt = (ix, iy) => iy * cols + ix;
    const pointAt = id => {
      const ix = id % cols, iy = Math.floor(id / cols);
      return [GRID.x0 + ix * GRID.dx, GRID.y0 + iy * GRID.dy];
    };
    const laneY = 120;
    const goalY = (laneY - GRID.y0) / GRID.dy;
    const start = idAt(0, goalY);
    const goal = idAt(cols - 1, goalY);
    const clear = new Uint8Array(count);
    for (let iy = 0; iy < rows; iy++) for (let ix = 0; ix < cols; ix++) {
      const id = idAt(ix, iy), [x, y] = pointAt(id);
      clear[id] = bodyClearAt(x, y, obstacles) ? 1 : 0;
    }
    if (!clear[start] || !clear[goal]) throw new Error('Village walking route has no clear entrance.');
    const costs = new Float64Array(count); costs.fill(Infinity); costs[start] = 0;
    const previous = new Int32Array(count); previous.fill(-1);
    const closed = new Uint8Array(count);
    const heap = [];
    const heuristic = (ix, iy) => Math.hypot((cols - 1 - ix), (goalY - iy) * GRID.dy / GRID.dx);
    priorityPush(heap, { id: start, f: heuristic(0, goalY) });
    let reached = false;
    const moves = [];
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++)
      if (dx || dy) moves.push([dx, dy]);
    while (heap.length) {
      const current = priorityPop(heap).id;
      if (closed[current]) continue;
      if (current === goal) { reached = true; break; }
      closed[current] = 1;
      const ix = current % cols, iy = Math.floor(current / cols);
      const [x, y] = pointAt(current);
      for (const [mx, my] of moves) {
        const nx = ix + mx, ny = iy + my;
        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
        const next = idAt(nx, ny);
        if (!clear[next] || closed[next]) continue;
        if (mx && my && (!clear[idAt(ix + mx, iy)] || !clear[idAt(ix, iy + my)])) continue;
        const [nextX, nextY] = pointAt(next);
        if (!segmentClear([x, y], [nextX, nextY], obstacles)) continue;
        const lane = nextX >= 0 && nextX <= 320
          ? Math.min(120, terrainAt(nextX) + laneOffset) : laneY;
        const step = Math.hypot(mx * GRID.dx, my * GRID.dy) / GRID.dx;
        const candidate = costs[current] + step + Math.abs(nextY - lane) * .025;
        if (candidate < costs[next]) {
          costs[next] = candidate;
          previous[next] = current;
          priorityPush(heap, { id: next, f: candidate + heuristic(nx, ny) });
        }
      }
    }
    if (!reached) throw new Error(`Unable to route a creature through the village at offset ${laneOffset}; obstacles: ${JSON.stringify(obstacles)}`);
    const raw = [];
    for (let id = goal; id !== -1; id = previous[id]) {
      raw.push(pointAt(id));
      if (id === start) break;
    }
    raw.reverse();
    const points = [raw[0]];
    let direction = null;
    for (let i = 1; i < raw.length; i++) {
      const nextDirection = [Math.sign(raw[i][0] - raw[i - 1][0]), Math.sign(raw[i][1] - raw[i - 1][1])];
      if (direction && (direction[0] !== nextDirection[0] || direction[1] !== nextDirection[1]))
        points.push(raw[i - 1]);
      direction = nextDirection;
    }
    points.push(raw[raw.length - 1]);
    return { layer: 'ground', points };
  }
  function planGroundPaths(obstacles) {
    return [
      planPath(8, obstacles),
      planPath(19, obstacles),
      planPath(30, obstacles)
    ];
  }

  function createVillage(random = Math.random) {
    const obstacles = [
      { x0: 154, x1: 196, y0: 22, y1: 92, kind: 'church' }
    ];
    const buildings = [];
    const count = 2 + Math.floor(random() * 5);
    for (let i = 0; i < count; i++) {
      let placed = null;
      for (let attempt = 0; attempt < 1400 && !placed; attempt++) {
        const type = pick(BUILDING_TYPES, random);
        const [minW, maxW, minH, maxH] = BUILDING_SIZES[type];
        const w = intBetween(minW, maxW, random);
        const h = intBetween(minH, maxH, random);
        const x = intBetween(24, 296 - w, random);
        const baseY = Math.min(107, Math.round(terrainAt(x + w / 2) + 6 + random() * 17));
        const candidate = {
          id: i, x, y: baseY - h - 2, w, h, baseY, type,
          variant: Math.floor(random() * BUILDING_VARIANTS[type].length)
        };
        const box = buildingObstacle(candidate);
        if (box.y0 < 38 || box.x0 < 16 || box.x1 > 304 ||
          obstacles.some(other => overlaps(box, other, 3))) continue;
        placed = candidate;
        buildings.push(candidate);
        obstacles.push(box);
      }
      if (!placed) break;
    }

    const landmarks = [{ type: 'flag', variant: Math.floor(random() * 3) }];
    for (const building of buildings) {
      const used = new Set();
      const wanted = 1 + Math.floor(random() * 2);
      for (const type of shuffle(ATTACHED_LANDMARKS, random)) {
        if (used.size >= wanted) break;
        if (used.has(ATTACHED_SLOTS[type])) continue;
        used.add(ATTACHED_SLOTS[type]);
        landmarks.push({ type, variant: Math.floor(random() * 3), buildingId: building.id });
      }
    }
    const groundWanted = 5 + Math.floor(random() * 6);
    let groundPlaced = 0;
    for (const type of shuffle(GROUND_TYPES, random)) {
      if (groundPlaced >= groundWanted) break;
      const spec = GROUND_FEATURES[type];
      for (let attempt = 0; attempt < 500; attempt++) {
        const x = intBetween(20, 300, random);
        const baseY = Math.min(107, Math.round(terrainAt(x) + 6 + random() * 18));
        const box = { x0: x - spec.left, x1: x + spec.right, y0: baseY - spec.height, y1: baseY };
        if (obstacles.some(other => overlaps(box, other, 2))) continue;
        landmarks.push({ type, variant: Math.floor(random() * 3), x, baseY, box });
        obstacles.push({ ...box, kind: type });
        groundPlaced++;
        break;
      }
    }
    const trees = [];
    const treeCount = 12 + Math.floor(random() * 21);
    for (let i = 0; i < treeCount; i++) {
      let placed = null;
      for (let attempt = 0; attempt < 600 && !placed; attempt++) {
        const x = intBetween(18, 302, random);
        const h = intBetween(14, 22, random);
        const y = Math.min(105, Math.round(terrainAt(x) + 8 + random() * 12));
        const candidate = { x, y, h };
        const box = treeObstacle(candidate);
        if (obstacles.some(other => !BUILDING_TYPE_SET.has(other.kind) && other.kind !== 'tree' && overlaps(box, other, 3)) ||
          trees.some(other => Math.abs(other.x - x) < 6 && Math.abs(other.y - y) < 4)) continue;
        placed = candidate;
        trees.push(candidate);
        obstacles.push({ ...box, kind: 'tree' });
      }
    }
    const paths = planGroundPaths(obstacles);
    return { buildings, landmarks, trees, obstacles, paths };
  }

  // Random skylines. Ridges dip into a pass behind the church cross and stay below the moon.
  const SKY_WINDOWS = [[152, 176, 34], [246, 278, 27]];
  function keepSkyOpen(points) {
    for (const [x0, x1, minY] of SKY_WINDOWS) {
      for (const edge of [x0, x1]) {
        const i = points.findIndex(([x]) => x >= edge);
        if (points[i][0] === edge) continue;
        const [ax, ay] = points[i - 1], [bx, by] = points[i];
        points.splice(i, 0, [edge, ay + (by - ay) * (edge - ax) / (bx - ax)]);
      }
      for (const point of points)
        if (point[0] >= x0 && point[0] <= x1) point[1] = Math.max(point[1], minY);
    }
    return points.map(([x, y]) => [x, Math.round(y)]);
  }
  function ridgeLine(random, [peakLo, peakHi], [valleyLo, valleyHi], [gapLo, gapHi]) {
    const points = [[0, intBetween(valleyLo - 12, valleyHi, random)]];
    let high = random() < .5;
    for (let x = intBetween(6, gapHi, random); x < 320; x += intBetween(gapLo, gapHi, random)) {
      points.push([x, high ? intBetween(peakLo, peakHi, random) : intBetween(valleyLo, valleyHi, random)]);
      high = !high;
    }
    points.push([320, intBetween(peakHi, valleyHi, random)]);
    return keepSkyOpen(points);
  }
  function nearRidge(random) {
    const left = intBetween(12, 40, random), right = intBetween(282, 310, random);
    return keepSkyOpen([
      [0, intBetween(18, 34, random)],
      [left, intBetween(6, 22, random)],
      [left + intBetween(18, 28, random), intBetween(34, 48, random)],
      [intBetween(72, 92, random), intBetween(46, 60, random)],
      [intBetween(118, 132, random), intBetween(72, 82, random)],
      [157, intBetween(84, 90, random)],
      [intBetween(190, 214, random), intBetween(70, 82, random)],
      [intBetween(234, 252, random), intBetween(42, 60, random)],
      [right - intBetween(14, 22, random), intBetween(30, 44, random)],
      [right, intBetween(6, 22, random)],
      [320, intBetween(20, 32, random)]
    ]);
  }
  function createMountains(random = Math.random) {
    return [
      { depth: 'far', points: ridgeLine(random, [9, 22], [36, 48], [14, 28]) },
      { depth: 'middle', points: ridgeLine(random, [15, 32], [52, 70], [22, 40]) },
      { depth: 'near', points: nearRidge(random) }
    ];
  }

  const api = {
    createVillage, createMountains, createParade, terrainAt, bodyClearAt, BUILDING_VARIANTS,
    LANDMARK_VARIANTS, GROUND_FEATURES, ATTACHED_LANDMARKS, ATTACHED_SLOTS, planGroundPaths
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.VillageLayout = api;
})(typeof window !== 'undefined' ? window : globalThis);
