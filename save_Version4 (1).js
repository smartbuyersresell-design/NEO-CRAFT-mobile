(function () {
  'use strict';
  const W = window.NEO;
  W.SAVEKEY = 'neocraft2-save';

  // Convert Uint8Array to base64 without blowing the call-argument limit.
  W.uint8ToBase64 = u8 => {
    const CHUNK = 0x8000; // 32k chunks
    let str = '';
    for (let i = 0; i < u8.length; i += CHUNK) {
      str += String.fromCharCode.apply(null, u8.subarray(i, i + CHUNK));
    }
    return btoa(str);
  };

  // Robust base64 -> Uint8Array
  W.base64ToUint8 = b64 => {
    const bin = atob(b64);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return u8;
  };

  W.showSaveToast = () => {
    const t = document.getElementById('saveToast');
    if (!t) return;
    t.style.opacity = 1;
    setTimeout(() => { try { t.style.opacity = 0; } catch(e){} }, 1200);
  };

  W.exportWorld = () => ({
    chunks: [...W.chunks.entries()].map(([k, c]) => [k, W.uint8ToBase64(c.blocks)]),
    px: W.player.pos.x, py: W.player.pos.y, pz: W.player.pos.z,
    yaw: W.player.yaw, pitch: W.player.pitch,
    health: W.player.health, hunger: W.player.hunger,
    inventory: W.inventory, selected: W.selected, equippedTool: W.equippedTool,
    elapsed: W.elapsed, dayCount: W.dayCount, seed: W.seed
  });

  W.importWorld = data => {
    W.chunks.clear();
    for (const [k, b64] of (data.chunks || [])) {
      const [cx, cz] = k.split(',').map(Number);
      W.chunks.set(k, { cx, cz, blocks: W.base64ToUint8(b64), dirty: true });
    }
    if (data.px != null && data.py != null && data.pz != null) {
      W.player.pos.set(data.px, data.py, data.pz);
    }
    W.player.yaw = data.yaw || 0;
    W.player.pitch = data.pitch || 0;
    W.player.health = data.health ?? 100;
    W.player.hunger = data.hunger ?? 100;
    W.inventory = data.inventory || {};
    W.selected = data.selected || 1;
    W.equippedTool = data.equippedTool || 0;
    W.elapsed = data.elapsed || 0;
    W.dayCount = data.dayCount || 1;
    W.seed = data.seed || 1337;
  };

  // Throttle saves so we don't try to stringify & write huge data every frame.
  W._lastSave = 0;
  W._saveInterval = 5000; // ms

  W.saveGame = (force = false) => {
    const now = Date.now();
    if (!force && (now - W._lastSave) < W._saveInterval) return;
    try {
      // exportWorld may be large — wrap in try/catch to avoid throwing into main loop
      const payload = W.exportWorld();
      localStorage.setItem(W.SAVEKEY, JSON.stringify(payload));
      W.showSaveToast();
      W._lastSave = now;
    } catch (e) {
      // log but don't throw
      console.warn('Save failed:', e);
    }
  };

  W.loadGame = () => {
    const raw = localStorage.getItem(W.SAVEKEY);
    if (!raw) return typeof W.newWorld === 'function' ? W.newWorld() : null;
    try {
      W.importWorld(JSON.parse(raw));
      if (typeof W.buildMesh === 'function') W.buildMesh();
      if (typeof W.refreshHotbarCounts === 'function') W.refreshHotbarCounts();
      if (typeof W.updateToolLine === 'function') W.updateToolLine();
    } catch (e) {
      console.error('Save load error:', e);
      if (typeof W.newWorld === 'function') W.newWorld();
    }
  };
})();