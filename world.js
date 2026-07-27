(function () {
  'use strict';
  const W = window.NEO || (window.NEO = {});
  // Blocks / Items / Names
  W.BLOCK = { AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, SAND: 4, WOOD: 5, LEAVES: 6, PLANKS: 7, TABLE: 8, WATER: 9, FLOWER: 10, TALLGRASS: 11, GLASS: 12 };
  W.ITEM = { STICK: 101, WPICK: 102, WAXE: 103, WSWORD: 104, SPICK: 105, SAXE: 106, SSWORD: 107, PORK: 108, ROTTEN: 109, BEEF: 110, APPLE: 111 };
  W.BLOCKNAMES = { 1: 'Grass', 2: 'Dirt', 3: 'Stone', 4: 'Sand', 5: 'Wood Log', 6: 'Leaves', 7: 'Planks', 8: 'Crafting Table', 9: 'Water', 10: 'Flower', 11: 'Tall Grass', 12: 'Glass' };
  W.ITEMNAMES = { 101: 'Stick', 102: 'Wood Pickaxe', 103: 'Wood Axe', 104: 'Wood Sword', 105: 'Stone Pickaxe', 106: 'Stone Axe', 107: 'Stone Sword', 108: 'Porkchop', 109: 'Rotten Flesh', 110: 'Raw Beef', 111: 'Apple' };
  W.FOOD = {
    108: { hunger: 35, name: 'Porkchop' },
    109: { hunger: 15, name: 'Rotten Flesh', poisonChance: 0.4, poisonDamage: 15 },
    110: { hunger: 30, name: 'Raw Beef' },
    111: { hunger: 15, name: 'Apple' }
  };
  W.itemName = id => W.BLOCKNAMES[id] || W.ITEMNAMES[id] || ('Item ' + id);

  // Colors (kept to be referenced if needed)
  W.BLOCKCOLORS = {
    1: { top: [0.36,0.72,0.28], bottom: [0.42,0.30,0.16], side: [0.29,0.57,0.23] },
    2: { top: [0.45,0.33,0.18], bottom: [0.42,0.30,0.16], side: [0.42,0.30,0.16] },
    3: { top: [0.56,0.56,0.58], bottom: [0.55,0.55,0.57], side: [0.55,0.55,0.57] },
    4: { top: [0.92,0.86,0.60], bottom: [0.86,0.79,0.56], side: [0.86,0.79,0.56] },
    5: { top: [0.56,0.40,0.22], bottom: [0.55,0.38,0.20], side: [0.46,0.32,0.17] },
    6: { top: [0.20,0.58,0.20], bottom: [0.20,0.58,0.20], side: [0.20,0.58,0.20] },
    7: { top: [0.74,0.57,0.35], bottom: [0.72,0.55,0.34], side: [0.72,0.55,0.34] },
    8: { top: [0.63,0.44,0.25], bottom: [0.45,0.32,0.18], side: [0.52,0.36,0.20] },
    9: { top: [0.15,0.45,0.88], bottom: [0.15,0.45,0.88], side: [0.12,0.37,0.78] },
    10:{ top: [0.95,0.40,0.72], bottom: [0.94,0.38,0.70], side: [0.94,0.38,0.70] },
    11:{ top: [0.28,0.80,0.28], bottom: [0.25,0.78,0.25], side: [0.25,0.78,0.25] },
    12:{ top: [0.80,0.92,0.97], bottom: [0.80,0.92,0.95], side: [0.80,0.92,0.95] }
  };

  W.BREAKTIME = { 1:2,2:2.5,3:4.5,4:2.8,5:4.5,6:1.2,7:2,8:3.5,9:1.8,10:0.8,11:0.5,12:1.2 };
  W.RECIPES = [
    { id: 'planks', name: 'Planks x4', inputs: [{ item:5, count:1 }], output: { item:7, count:4 } },
    { id: 'glass', name: 'Glass x1', inputs: [{ item:4, count:4 }], output: { item:12, count:1 } },
    { id: 'stick', name: 'Stick x4', inputs: [{ item:7, count:2 }], output: { item:101, count:4 } },
    { id: 'table', name: 'Crafting Table', inputs: [{ item:7, count:4 }], output: { item:8, count:1 } },
    { id: 'wpick', name: 'Wood Pickaxe', inputs: [{ item:7, count:3 }, { item:101, count:2 }], output: { item:102, count:1 } },
    { id: 'waxe', name: 'Wood Axe', inputs: [{ item:7, count:3 }, { item:101, count:2 }], output: { item:103, count:1 } },
    { id: 'wsword', name: 'Wood Sword', inputs: [{ item:7, count:2 }, { item:101, count:1 }], output: { item:104, count:1 } },
    { id: 'spick', name: 'Stone Pickaxe', inputs: [{ item:3, count:3 }, { item:101, count:2 }], output: { item:105, count:1 } },
    { id: 'saxe', name: 'Stone Axe', inputs: [{ item:3, count:3 }, { item:101, count:2 }], output: { item:106, count:1 } },
    { id: 'ssword', name: 'Stone Sword', inputs: [{ item:3, count:2 }, { item:101, count:1 }], output: { item:107, count:1 } }
  ];
  W.SLOT_ORDER = [1,2,3,4,5,6,7,8,12];

  // map size (increased for variety)
  W.SX = 256; W.SY = 64; W.SZ = 256; W.CHUNK = 16;

  // BLOCK -> atlas tile indices mapping (per-face)
  // tile indices refer to a packed atlas generated in renderer.js (tile index integer)
  W.BLOCK_UV = {
    1: { top:0, side:1, bottom:2 },    // grass
    2: { top:2, side:2, bottom:2 },    // dirt
    3: { top:3, side:3, bottom:3 },    // stone
    4: { top:4, side:4, bottom:4 },    // sand
    5: { top:5, side:6, bottom:6 },    // wood (top/plank/side)
    6: { top:7, side:7, bottom:7, transparent:true }, // leaves
    7: { top:8, side:8, bottom:8 },    // planks
    8: { top:9, side:10, bottom:2 },   // table (top/side/bottom dirt base)
    9: { top:11, side:11, bottom:11, transparent:true }, // water
    10:{ top:12, side:12, bottom:12, transparent:true }, // flower
    11:{ top:13, side:13, bottom:13, transparent:true }, // tall grass
    12:{ top:14, side:14, bottom:14, transparent:true }  // glass
  };

  // noise & helper functions
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
    for (let o = 0; o < 6; o++) { total += W.valueNoise(x * freq * 0.03, z * freq * 0.03) * amp; maxAmp += amp; amp *= 0.5; freq *= 2; }
    return total / maxAmp;
  };

  W.seed = 1337;
  W.rnd = () => (W.seed = (W.seed * 1664525 + 1013904223) >>> 0, W.seed / 4294967296);

  // ground height with river-like depression
  W.groundHeightAt = (x, z) => {
    const base = Math.floor(18 + W.fbm(x, z) * 18 + W.valueNoise(x * 0.12, z * 0.12) * 3);
    const river = Math.abs(W.valueNoise(x * 0.02, z * 0.02) - 0.5);
    const riverDepth = river < 0.06 ? Math.floor((0.06 - river) * 60) : 0;
    let h = base - riverDepth;
    return Math.max(4, Math.min(W.SY - 8, h));
  };

  W.placeTreeAt = (x, h, z) => {
    const trunk = 3 + Math.floor(W.rnd() * 4);
    for (let i = 0; i < trunk; i++) {
      if (h + i < W.SY) W.setBlock(x, h + i, z, W.BLOCK.WOOD);
    }
    const leafBase = h + trunk;
    const radius = 2 + Math.floor(W.rnd() * 2);
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        for (let dy = -1; dy <= 2; dy++) {
          const dist = Math.abs(dx) + Math.abs(dz) + Math.abs(dy);
          if (dist <= radius + 0.2 && leafBase + dy < W.SY) {
            if (Math.abs(dx) === radius && Math.abs(dz) === radius && Math.random() > 0.6) continue;
            const lx = x + dx, lz = z + dz, ly = leafBase + dy;
            if (W.getBlock(lx, ly, lz) === W.BLOCK.AIR) W.setBlock(lx, ly, lz, W.BLOCK.LEAVES);
          }
        }
      }
    }
    if (Math.random() < 0.15) {
      for (let d = 1; d <= 2; d++) {
        if (W.getBlock(x, leafBase - d, z) === W.BLOCK.AIR) W.setBlock(x, leafBase - d, z, W.BLOCK.LEAVES);
      }
    }
  };

  W.generateWorld = () => {
    W.chunks.clear();

    const cxMax = Math.ceil(W.SX / W.CHUNK);
    const czMax = Math.ceil(W.SZ / W.CHUNK);

    for (let cx = 0; cx < cxMax; cx++) {
      for (let cz = 0; cz < czMax; cz++) {
        const c = W.makeChunk(cx, cz);

        for (let lx = 0; lx < W.CHUNK; lx++) {
          for (let lz = 0; lz < W.CHUNK; lz++) {
            const x = cx * W.CHUNK + lx;
            const z = cz * W.CHUNK + lz;
            if (x >= W.SX || z >= W.SZ) continue;

            const h = W.groundHeightAt(x, z);
            const waterLevel = 14;

            for (let y = 0; y < W.SY; y++) {
              let b = W.BLOCK.AIR;
              if (y < h - 4) b = W.BLOCK.STONE;
              else if (y < h - 1) b = W.BLOCK.DIRT;
              else if (y === h - 1) b = h < waterLevel + 2 ? W.BLOCK.SAND : W.BLOCK.GRASS;
              if (y > h - 1 && y <= waterLevel && h < waterLevel) b = W.BLOCK.WATER;
              c.blocks[W.idx(lx, y, lz)] = b;
            }

            const humidity = W.fbm(x * 0.6, z * 0.6) * 0.5 + 0.5;
            const heightAboveWater = h - waterLevel;
            if (heightAboveWater > 1 && W.rnd() < 0.025 + humidity * 0.03) {
              W.placeTreeAt(x, h, z);
            }

            if (heightAboveWater > 1 && W.rnd() < 0.04 + humidity * 0.05) W.setBlock(x, h, z, W.BLOCK.TALLGRASS);
            if (heightAboveWater > 1 && W.rnd() < 0.02 + humidity * 0.03) W.setBlock(x, h, z, W.BLOCK.FLOWER);
          }
        }
      }
    }

    console.log('world chunks', W.chunks.size);
    W.buildMesh && W.buildMesh();
  };

  W.placeSpawn = () => {
    const sx = Math.floor(W.SX / 2);
    const sz = Math.floor(W.SZ / 2);
    const sy = W.groundHeightAt(sx, sz);
    W.player.pos.set(sx + 0.2, sy + 2.2, sz + 0.2);
  };

  // newWorld wrapper used by other code
  W.newWorld = () => {
    W.seed = 1337;
    W.inventory = {};
    W.equippedTool = 0;
    W.selected = 1;
    W.elapsed = 0;
    W.dayCount = 1;
    W.player.health = 100;
    W.player.hunger = 100;
    W.player.alive = true;
    W.player.vel.set(0, 0, 0);

    W.generateWorld();
    W.placeSpawn();
    W.mobs && (W.mobs.length = 0);
    W.refreshHotbarCounts && W.refreshHotbarCounts();
    W.updateToolLine && W.updateToolLine();
    W.renderInventoryPanel && W.renderInventoryPanel();
    W.updateSky && W.updateSky();

    document.getElementById('deathScreen').style.display = 'none';
    document.getElementById('loading').style.display = 'none';
    console.log('new world ready');
  };

  // expose
  W.placeTreeAt = W.placeTreeAt;
})();
