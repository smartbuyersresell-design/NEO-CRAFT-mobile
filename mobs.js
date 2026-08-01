(function () {
  'use strict';
  const W = window.NEO || (window.NEO = {});

  W.mobs = W.mobs || [];
  W.MAXPIGS = 8;
  W.MAXCOWS = 6;
  W.MAXZOMBIES = 10;

  const MOB_COLORS = {
    pig: { body: 0xe8a0a8, head: 0xf2b8be },
    zombie: { body: 0x3d6b3d, head: 0x4a7a4a },
    cow: { body: 0x5a4230, head: 0x3c2c1e }
  };

  W.createMobMesh = type => {
    if (typeof THREE === 'undefined') return null;
    try {
      const g = new THREE.Group();
      const c = MOB_COLORS[type] || MOB_COLORS.pig;
      const scale = type === 'cow' ? 1.25 : 1;
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.7 * scale, 0.6 * scale, 1.0 * scale), new THREE.MeshLambertMaterial({ color: c.body }));
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.5 * scale, 0.5 * scale, 0.5 * scale), new THREE.MeshLambertMaterial({ color: c.head }));
      body.position.y = 0.5 * scale;
      head.position.set(0, 0.85 * scale, 0.6 * scale);
      g.add(body, head);
      if (type === 'cow') {
        const patch = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.3), new THREE.MeshLambertMaterial({ color: 0xe8e0d5 }));
        patch.position.set(0.1, 0.65, 0.1);
        g.add(patch);
      }
      return g;
    } catch (e) {
      console.warn('[NEO] Mob mesh error:', e);
      return null;
    }
  };

  W.spawnMob = (type, x, z) => {
    try {
      if (!W.groundHeightAt || !W.scene) return;
      const y = W.groundHeightAt(x, z);
      const mesh = W.createMobMesh(type);
      if (!mesh) return;
      mesh.position.set(x, y, z);
      W.scene.add(mesh);
      const speed = type === 'pig' ? 1.1 : (type === 'cow' ? 0.9 : 1.7);
      const health = type === 'pig' ? 10 : (type === 'cow' ? 12 : 18);
      W.mobs.push({
        type, mesh, pos: new THREE.Vector3(x, y, z), dir: Math.random() * Math.PI * 2,
        speed, changeDirT: 1 + Math.random() * 3, health, attackCd: 0, alive: true, state: 'wander'
      });
    } catch (e) {
      console.warn('[NEO] Spawn mob error:', e);
    }
  };

  W.updateMobs = dt => {
    if (!W.mobs || !W.player) return;
    try {
      for (const m of W.mobs) {
        if (!m.alive) continue;
        if (m.attackCd > 0) m.attackCd -= dt;

        const dx = W.player.pos.x - m.pos.x;
        const dz = W.player.pos.z - m.pos.z;
        const dist = Math.hypot(dx, dz);

        if (m.type === 'zombie' && dist < 10) {
          m.state = 'chase';
          m.dir = Math.atan2(dz, dx);
        } else if (m.state === 'chase' && dist > 11) {
          m.state = 'wander';
        }

        if (m.state === 'wander') {
          m.changeDirT -= dt;
          if (m.changeDirT <= 0) {
            m.dir = Math.random() * Math.PI * 2;
            m.changeDirT = 2 + Math.random() * 4;
          }
        }

        const spd = m.state === 'chase' ? m.speed * 1.4 : m.speed * 0.6;
        const nx = m.pos.x + Math.cos(m.dir) * spd * dt;
        const nz = m.pos.z + Math.sin(m.dir) * spd * dt;
        const gh = W.groundHeightAt(nx, nz);

        m.pos.x = Math.max(2, Math.min(W.SX - 3, nx));
        m.pos.z = Math.max(2, Math.min(W.SZ - 3, nz));
        m.pos.y = gh;
        m.mesh.position.copy(m.pos);
        m.mesh.rotation.y = -m.dir + Math.PI / 2;

        if (m.type === 'zombie' && dist < 1.35 && m.attackCd <= 0) {
          W.player.health = Math.max(0, W.player.health - 8);
          m.attackCd = 1.0;
          if (typeof W.flashDamage === 'function') W.flashDamage();
        }
      }

      W.mobs = W.mobs.filter(m => m.alive);
    } catch (e) {
      console.warn('[NEO] Update mobs error:', e);
    }
  };

  W.killMob = m => {
    if (!m) return;
    try {
      m.alive = false;
      if (W.scene && m.mesh) W.scene.remove(m.mesh);
      const drop = m.type === 'pig' ? 108 : (m.type === 'cow' ? 110 : 109);
      if (W.addItem) W.addItem(drop, 1);
      if (W.refreshHotbarCounts) W.refreshHotbarCounts();
    } catch (e) {
      console.warn('[NEO] Kill mob error:', e);
    }
  };
})();