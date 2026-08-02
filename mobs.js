(function () {
  'use strict';
  const W = window.NEO || (window.NEO = {});

  W.mobs = [];
  W.MAXPIGS = 4;
  W.MAXCOWS = 3;
  W.MAXZOMBIES = 6;

  const MOB_COLORS = { pig: { body: 0xe8a0a8, head: 0xf2b8be }, zombie: { body: 0x3d6b3d, head: 0x4a7a4a }, cow: { body: 0x5a4230, head: 0x3c2c1e } };

  W.createMobMesh = type => {
    if (typeof THREE === 'undefined') return null;
    try {
      const g = new THREE.Group();
      const c = MOB_COLORS[type] || MOB_COLORS.pig;
      const scale = type === 'cow' ? 1.2 : 1;
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.6 * scale, 0.5 * scale, 0.8 * scale), new THREE.MeshLambertMaterial({ color: c.body }));
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.4 * scale, 0.4 * scale, 0.4 * scale), new THREE.MeshLambertMaterial({ color: c.head }));
      body.position.y = 0.4 * scale;
      head.position.set(0, 0.7 * scale, 0.5 * scale);
      g.add(body, head);
      return g;
    } catch (e) {
      console.warn('[NEO] Mob error:', e.message);
      return null;
    }
  };

  W.spawnMob = (type, x, z) => {
    try {
      if (!W.groundHeightAt || !W.scene || W.mobs.length > 15) return;
      const y = W.groundHeightAt(x, z);
      const mesh = W.createMobMesh(type);
      if (!mesh) return;
      mesh.position.set(x, y, z);
      W.scene.add(mesh);
      W.mobs.push({ type, mesh, pos: new THREE.Vector3(x, y, z), dir: Math.random() * Math.PI * 2, speed: 0.8 + Math.random() * 0.5, health: type === 'pig' ? 8 : (type === 'cow' ? 10 : 15), alive: true });
    } catch (e) {
      console.warn('[NEO] Spawn error:', e.message);
    }
  };

  W.updateMobs = dt => {
    if (!W.mobs || !W.player) return;
    for (let i = W.mobs.length - 1; i >= 0; i--) {
      const m = W.mobs[i];
      if (!m.alive) { W.mobs.splice(i, 1); continue; }
      const dx = W.player.pos.x - m.pos.x, dz = W.player.pos.z - m.pos.z, dist = Math.hypot(dx, dz);
      if (m.type === 'zombie' && dist < 8) m.dir = Math.atan2(dz, dx);
      const spd = m.type === 'zombie' && dist < 8 ? m.speed * 1.2 : m.speed * 0.5;
      m.pos.x += Math.cos(m.dir) * spd * dt;
      m.pos.z += Math.sin(m.dir) * spd * dt;
      m.pos.y = W.groundHeightAt(m.pos.x, m.pos.z);
      m.mesh.position.copy(m.pos);
      if (m.type === 'zombie' && dist < 1.5) { W.player.health = Math.max(0, W.player.health - 5); }
    }
  };

  W.killMob = m => { if (m) { m.alive = false; if (W.scene) W.scene.remove(m.mesh); if (W.addItem) W.addItem(m.type === 'pig' ? 108 : 109, 1); } };

  console.log('[NEO] Mobs optimized');
})();