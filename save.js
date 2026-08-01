(function () {
  'use strict';
  const W = window.NEO || (window.NEO = {});

  W.SAVEKEY = 'neocraft-save';

  W.uint8ToBase64 = u8 => {
    const CHUNK = 0x8000;
    let str = '';
    for (let i = 0; i < u8.length; i += CHUNK) {
      str += String.fromCharCode.apply(null, u8.subarray(i, i + CHUNK));
    }
    return btoa(str);
  };

  W.base64ToUint8 = b64 => {
    const bin = atob(b64);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return u8;
  };

  W.showSaveToast = () => {
    try {
      const t = document.getElementById('saveToast');
      if (t) {
        t.style.opacity = '1';
        setTimeout(() => { try { t.style.opacity = '0'; } catch (e) {} }, 1200);
      }
    } catch (e) {}
  };

  W.exportWorld = () => {
    try {
      if (!W.chunks || !W.player) return null;
      return {
        chunks: [...W.chunks.entries()].map(([k, c]) => [k, W.uint8ToBase64(c.blocks)]),
        px: W.player.pos.x, py: W.player.pos.y, pz: W.player.pos.z,
        yaw: W.player.yaw || 0, pitch: W.player.pitch || 0,
        health: W.player.health, hunger: W.player.hunger,
        inventory: W.inventory, selected: W.selected, equippedTool: W.equippedTool,
        elapsed: W.elapsed, dayCount: W.dayCount, seed: W.seed
      };
    } catch (e) {
      console.warn('[NEO] Export error:', e);
      return null;
    }
  };

  W.importWorld = data => {
    if (!data) return;
    try {
      if (!W.chunks) W.chunks = new Map();
      W.chunks.clear();
      if (data.chunks) {
        for (const [k, b64] of data.chunks) {
          const [cx, cz] = k.split(',').map(Number);
          W.chunks.set(k, { cx, cz, blocks: W.base64ToUint8(b64), dirty: true });
        }
      }
      if (W.player) {
        if (data.px != null) W.player.pos.x = data.px;
        if (data.py != null) W.player.pos.y = data.py;
        if (data.pz != null) W.player.pos.z = data.pz;
        W.player.yaw = data.yaw || 0;
        W.player.pitch = data.pitch || 0;
        W.player.health = data.health ?? 100;
        W.player.hunger = data.hunger ?? 100;
      }
      W.inventory = data.inventory || {};
      W.selected = data.selected || 1;
      W.equippedTool = data.equippedTool || 0;
      W.elapsed = data.elapsed || 0;
      W.dayCount = data.dayCount || 1;
      W.seed = data.seed || 1337;
    } catch (e) {
      console.warn('[NEO] Import error:', e);
    }
  };

  W._lastSave = 0;
  W._saveInterval = 5000;

  W.saveGame = (force = false) => {
    const now = Date.now();
    if (!force && (now - W._lastSave) < W._saveInterval) return;
    try {
      const payload = W.exportWorld();
      if (payload) {
        localStorage.setItem(W.SAVEKEY, JSON.stringify(payload));
        W.showSaveToast();
        W._lastSave = now;
      }
    } catch (e) {
      console.warn('[NEO] Save failed:', e);
    }
  };

  W.loadGame = () => {
    try {
      const raw = localStorage.getItem(W.SAVEKEY);
      if (!raw) {
        if (typeof W.newWorld === 'function') W.newWorld();
        return;
      }
      W.importWorld(JSON.parse(raw));
      if (typeof W.buildMesh === 'function') W.buildMesh();
      if (typeof W.refreshHotbarCounts === 'function') W.refreshHotbarCounts();
      if (typeof W.updateToolLine === 'function') W.updateToolLine();
      console.log('[NEO] World loaded from save');
    } catch (e) {
      console.error('[NEO] Load failed:', e);
      if (typeof W.newWorld === 'function') W.newWorld();
    }
  };
})();