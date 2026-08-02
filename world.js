(function () {
  'use strict';
  const W = window.NEO || (window.NEO = {});

  // Optimized world generation with minimal memory usage
  W.SX = 128;
  W.SY = 48;
  W.SZ = 128;
  W.CHUNK = 16;

  W.BLOCK = { AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, SAND: 4, WOOD: 5, LEAVES: 6, PLANKS: 7, TABLE: 8, WATER: 9, FLOWER: 10, TALLGRASS: 11, GLASS: 12 };
  W.ITEM = { STICK: 101, WPICK: 102, WAXE: 103, WSWORD: 104, SPICK: 105, SAXE: 106, SSWORD: 107, PORK: 108, ROTTEN: 109, BEEF: 110, APPLE: 111 };
  W.BLOCKNAMES = { 1: 'Grass', 2: 'Dirt', 3: 'Stone', 4: 'Sand', 5: 'Wood', 6: 'Leaves', 7: 'Planks', 8: 'Table', 9: 'Water', 10: 'Flower', 11: 'Grass', 12: 'Glass' };
  W.ITEMNAMES = { 101: 'Stick', 102: 'Wood Pick', 103: 'Wood Axe', 104: 'Wood Sword', 105: 'Stone Pick', 106: 'Stone Axe', 107: 'Stone Sword', 108: 'Pork', 109: 'Rotten', 110: 'Beef', 111: 'Apple' };
  W.FOOD = { 108: { h: 35, n: 'Pork' }, 109: { h: 15, n: 'Rotten', p: 0.4, d: 15 }, 110: { h: 30, n: 'Beef' }, 111: { h: 15, n: 'Apple' } };
  W.itemName = id => W.BLOCKNAMES[id] || W.ITEMNAMES[id] || ('Item ' + id);
  W.BLOCKCOLORS = {
    1: { top: [0.36,0.72,0.28], side: [0.29,0.57,0.23] },
    2: { top: [0.45,0.33,0.18], side: [0.42,0.30,0.16] },
    3: { top: [0.56,0.56,0.58], side: [0.55,0.55,0.57] },
    4: { top: [0.92,0.86,0.60], side: [0.86,0.79,0.56] },
    5: { top: [0.56,0.40,0.22], side: [0.46,0.32,0.17] },
    6: { top: [0.20,0.58,0.20], side: [0.20,0.58,0.20] },
    7: { top: [0.74,0.57,0.35], side: [0.72,0.55,0.34] },
    8: { top: [0.63,0.44,0.25], side: [0.52,0.36,0.20] },
    9: { top: [0.15,0.45,0.88], side: [0.12,0.37,0.78] },
    10: { top: [0.95,0.40,0.72], side: [0.94,0.38,0.70] },
    11: { top: [0.28,0.80,0.28], side: [0.25,0.78,0.25] },
    12: { top: [0.80,0.92,0.97], side: [0.80,0.92,0.95] }
  };
  W.BREAKTIME = { 1:2,2:2.5,3:4.5,4:2.8,5:4.5,6:1.2,7:2,8:3.5,9:1.8,10:0.8,11:0.5,12:1.2 };
  W.RECIPES = [
    { id: 'planks', name: 'Planks x4', inputs: [{ item:5, count:1 }], output: { item:7, count:4 } },
    { id: 'stick', name: 'Stick x4', inputs: [{ item:7, count:2 }], output: { item:101, count:4 } },
    { id: 'wpick', name: 'Wood Pick', inputs: [{ item:7, count:3 }, { item:101, count:2 }], output: { item:102, count:1 } }
  ];
  W.SLOT_ORDER = [1,2,3,4,5,6,7,8,12];
  W.BLOCK_UV = {
    1: { top:0, side:1 }, 2: { top:2, side:2 }, 3: { top:3, side:3 },
    4: { top:4, side:4 }, 5: { top:5, side:6 }, 6: { top:7, side:7, transparent:true },
    7: { top:8, side:8 }, 8: { top:9, side:10 }, 9: { top:11, side:11, transparent:true },
    10: { top:12, side:12, transparent:true }, 11: { top:13, side:13, transparent:true }, 12: { top:14, side:14, transparent:true }
  };

  W.hash2 = (x, z) => { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123; return s - Math.floor(s); };
  W.fade = t => t * t * (3 - 2 * t);
  W.lerp = (a, b, t) => a + (b - a) * t;
  W.valueNoise = (x, z) => {
    const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
    const v1 = W.hash2(xi, zi), v2 = W.hash2(xi + 1, zi), v3 = W.hash2(xi, zi + 1), v4 = W.hash2(xi + 1, zi + 1);
    const i1 = W.lerp(v1, v2, W.fade(xf)), i2 = W.lerp(v3, v4, W.fade(xf));
    return W.lerp(i1, i2, W.fade(zf));
  };
  W.fbm = (x, z) => {
    let total = 0, amp = 1, freq = 1, maxAmp = 0;
    for (let o = 0; o < 4; o++) { total += W.valueNoise(x * freq * 0.03, z * freq * 0.03) * amp; maxAmp += amp; amp *= 0.5; freq *= 2; }
    return total / maxAmp;
  };

  W.seed = 1337;
  W.rnd = () => { W.seed = (W.seed * 1664525 + 1013904223) >>> 0; return W.seed / 4294967296; };
  W.groundHeightAt = (x, z) => {
    const base = Math.floor(16 + W.fbm(x, z) * 12 + W.valueNoise(x * 0.1, z * 0.1) * 2);
    return Math.max(4, Math.min(W.SY - 4, base));
  };

  W.generateWorld = () => {
    if (!W.chunks) W.chunks = new Map();
    W.chunks.clear();
    const cxMax = Math.ceil(W.SX / W.CHUNK);
    const czMax = Math.ceil(W.SZ / W.CHUNK);
    for (let cx = 0; cx < cxMax; cx++) {
      for (let cz = 0; cz < czMax; cz++) {
        const c = W.makeChunk(cx, cz);
        if (!c) continue;
        for (let lx = 0; lx < W.CHUNK; lx++) {
          for (let lz = 0; lz < W.CHUNK; lz++) {
            const x = cx * W.CHUNK + lx, z = cz * W.CHUNK + lz;
            if (x >= W.SX || z >= W.SZ) continue;
            const h = W.groundHeightAt(x, z);
            for (let y = 0; y < W.SY; y++) {
              let b = W.BLOCK.AIR;
              if (y < h - 3) b = W.BLOCK.STONE;
              else if (y < h - 1) b = W.BLOCK.DIRT;
              else if (y === h - 1) b = W.BLOCK.GRASS;
              if (y > h - 1 && y <= 12 && h < 14) b = W.BLOCK.WATER;
              c.blocks[W.idx(lx, y, lz)] = b;
            }
            if (h > 13 && W.rnd() < 0.08) W.setBlock(x, h, z, W.BLOCK.TALLGRASS);
          }
        }
      }
    }
    console.log('[NEO] World ready:', W.chunks.size, 'chunks');
    if (typeof W.buildMesh === 'function') W.buildMesh();
  };

  W.placeSpawn = () => {
    const sx = Math.floor(W.SX / 2), sz = Math.floor(W.SZ / 2);
    if (W.player) W.player.pos.set(sx + 0.2, W.groundHeightAt(sx, sz) + 2, sz + 0.2);
  };

  W.newWorld = () => {
    W.seed = 1337;
    W.inventory = {};
    W.selected = 1;
    W.equippedTool = 0;
    W.elapsed = 0;
    W.dayCount = 1;
    if (!W.player) W.player = { pos: new (window.THREE ? THREE.Vector3 : class { set(){} })(), vel: new (window.THREE ? THREE.Vector3 : class { set(){} })(), yaw: 0, pitch: 0, health: 100, hunger: 100, alive: true };
    W.player.health = 100;
    W.player.hunger = 100;
    W.player.alive = true;
    W.player.vel.set(0, 0, 0);
    W.generateWorld();
    W.placeSpawn();
    W.mobs = W.mobs || [];
    W.mobs.length = 0;
    if (typeof W.refreshHotbarCounts === 'function') W.refreshHotbarCounts();
    if (typeof W.updateToolLine === 'function') W.updateToolLine();
    if (typeof W.renderInventoryPanel === 'function') W.renderInventoryPanel();
    if (typeof W.updateSky === 'function') W.updateSky();
    console.log('[NEO] New world ready');
  };

  console.log('[NEO] World system loaded');
})();