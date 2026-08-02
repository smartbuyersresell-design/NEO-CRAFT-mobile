(function () {
  'use strict';
  const W = window.NEO || (window.NEO = {});

  W.chunks = W.chunks || new Map();
  W.MAX_CHUNKS = 64;
  W.chunkLoadQueue = [];

  W.makeChunk = (cx, cz) => {
    const key = cx + ',' + cz;
    if (W.chunks.has(key)) return W.chunks.get(key);
    if (W.chunks.size >= W.MAX_CHUNKS) {
      const first = W.chunks.entries().next().value[0];
      W.chunks.delete(first);
    }
    const c = { cx, cz, blocks: new Uint8Array(W.CHUNK * W.SY * W.CHUNK), dirty: false };
    W.chunks.set(key, c);
    return c;
  };

  W.idx = (x, y, z) => {
    if (x < 0 || x >= W.CHUNK || y < 0 || y >= W.SY || z < 0 || z >= W.CHUNK) return -1;
    return y * W.CHUNK * W.CHUNK + z * W.CHUNK + x;
  };

  W.getBlock = (x, y, z) => {
    if (y < 0 || y >= W.SY) return W.BLOCK.AIR;
    const cx = Math.floor(x / W.CHUNK);
    const cz = Math.floor(z / W.CHUNK);
    const lx = ((x % W.CHUNK) + W.CHUNK) % W.CHUNK;
    const lz = ((z % W.CHUNK) + W.CHUNK) % W.CHUNK;
    const chunk = W.chunks.get(cx + ',' + cz);
    if (!chunk) return W.BLOCK.AIR;
    const i = W.idx(lx, y, lz);
    return i < 0 ? W.BLOCK.AIR : chunk.blocks[i];
  };

  W.setBlock = (x, y, z, b) => {
    if (y < 0 || y >= W.SY) return;
    const cx = Math.floor(x / W.CHUNK);
    const cz = Math.floor(z / W.CHUNK);
    const lx = ((x % W.CHUNK) + W.CHUNK) % W.CHUNK;
    const lz = ((z % W.CHUNK) + W.CHUNK) % W.CHUNK;
    const chunk = W.makeChunk(cx, cz);
    if (!chunk) return;
    const i = W.idx(lx, y, lz);
    if (i >= 0 && chunk.blocks[i] !== b) {
      chunk.blocks[i] = b;
      chunk.dirty = true;
      W._buildPending = false;
      if (typeof W.buildMesh === 'function') setTimeout(W.buildMesh, 50);
    }
  };

  console.log('[NEO] Chunk system optimized');
})();