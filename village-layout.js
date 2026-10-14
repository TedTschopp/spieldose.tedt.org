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
    chapel: [
      { wall: '#c2b9a7', roof: '#514746', trim: '#e1ddd4', accent: '#817866', form: 'chapel' },
      { wall: '#b5aa97', roof: '#484344', trim: '#ddd4c3', accent: '#8d7e69', form: 'chapel' },
      { wall: '#d0c5b0', roof: '#5a4c49', trim: '#eee5d4', accent: '#756e64', form: 'chapel' }
    ]
  };
  const BUILDING_SIZES = {
    farmhouse: [20, 29, 13, 19],
    barn: [22, 30, 14, 20],
    granary: [14, 19, 14, 19],
    bakehouse: [16, 23, 11, 15],
    inn: [22, 30, 15, 20],
    chapel: [15, 22, 16, 22]
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
    ]
  };
  const TERRAIN = [[0, 51], [29, 58], [56, 72], [88, 81], [127, 89],
    [161, 92], [203, 87], [239, 76], [272, 57], [299, 49], [320, 43]];
  const BUILDING_TYPES = Object.keys(BUILDING_VARIANTS);
  const BUILDING_TYPE_SET = new Set(BUILDING_TYPES);
  const ATTACHED_LANDMARKS = ['flowerBox', 'innSign', 'noticeboard', 'bells'];
  const GRID = { x0: -24, x1: 344, dx: 4, y0: 48, y1: 120, dy: 2 };
  const MAX_SPRITE = { width: 16, height: 12 };

  function pick(items, random) {
    return items[Math.floor(random() * items.length)];
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
      y0: building.y - roofHeight(building) - (building.type === 'chapel' ? 3 : 0),
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
      { x0: 154, x1: 174, y0: 38, y1: 91, kind: 'church' },
      { x0: 144, x1: 157, y0: 74, y1: 92, kind: 'flag' }
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
    const extraCount = Math.floor(random() * 3);
    for (let i = 0; i < extraCount; i++) {
      const useGroundProp = i === 0 && random() < .55;
      if (useGroundProp) {
        const type = pick(['hitchingPost', 'fountain'], random);
        let placed = null;
        for (let attempt = 0; attempt < 500 && !placed; attempt++) {
          const x = intBetween(34, 286, random);
          const baseY = Math.min(107, Math.round(terrainAt(x) + 8 + random() * 15));
          const box = type === 'fountain'
            ? { x0: x - 8, x1: x + 9, y0: baseY - 14, y1: baseY }
            : { x0: x - 7, x1: x + 8, y0: baseY - 10, y1: baseY };
          if (obstacles.some(other => overlaps(box, other, 4))) continue;
          placed = { type, variant: Math.floor(random() * 3), x, baseY, box };
        }
        if (placed) {
          landmarks.push(placed);
          obstacles.push({ ...placed.box, kind: type });
        }
      }
      if (landmarks.length === i + 1) {
        const type = pick(ATTACHED_LANDMARKS, random);
        const building = pick(buildings, random);
        landmarks.push({
          type, variant: Math.floor(random() * 3), buildingId: building.id
        });
      }
    }
    const trees = [];
    const treeCount = 4 + Math.floor(random() * 3);
    for (let i = 0; i < treeCount; i++) {
      let placed = null;
      for (let attempt = 0; attempt < 300 && !placed; attempt++) {
        const x = intBetween(18, 302, random);
        const h = intBetween(14, 22, random);
        const y = Math.min(105, Math.round(terrainAt(x) + 8 + random() * 12));
        const candidate = { x, y, h };
        const box = treeObstacle(candidate);
        if (obstacles.some(other => !BUILDING_TYPE_SET.has(other.kind) && overlaps(box, other, 3)) ||
          trees.some(other => overlaps(box, treeObstacle(other), 3))) continue;
        placed = candidate;
        trees.push(candidate);
        obstacles.push({ ...box, kind: 'tree' });
      }
    }
    const paths = planGroundPaths(obstacles);
    return { buildings, landmarks, trees, obstacles, paths };
  }

  const api = {
    createVillage, terrainAt, bodyClearAt, BUILDING_VARIANTS,
    LANDMARK_VARIANTS, planGroundPaths
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.VillageLayout = api;
})(typeof window !== 'undefined' ? window : globalThis);
