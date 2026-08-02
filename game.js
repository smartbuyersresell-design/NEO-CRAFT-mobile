(function () {
  'use strict';
  const W = window.NEO || (window.NEO = {});

  W.gameStarted = false;
  W.playerAttackCooldown = 0;
  W.isDaylight = () => true;
  W.heartsString = h => '❤'.repeat(Math.ceil(h / 20));
  W.hungerString = h => '🍗'.repeat(Math.ceil(h / 20));
  W.updateSky = () => {};
  W.initInput = () => {};
  W.flashDamage = () => {};

  W.startLoop = () => {
    let lastTime = performance.now();
    const frame = now => {
      requestAnimationFrame(frame);
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      if (!W.gameStarted || !W.player || !W.player.alive) return;
      W.elapsed = (W.elapsed || 0) + dt;
      if (W.camera && W.player) {
        W.camera.position.copy(W.player.pos);
        W.camera.position.y += 0.6;
      }
      const posLine = document.getElementById('posLine');
      if (posLine && W.player) posLine.textContent = `x:${W.player.pos.x.toFixed(1)} y:${W.player.pos.y.toFixed(1)} z:${W.player.pos.z.toFixed(1)}`;
      const hearts = document.getElementById('hearts');
      if (hearts) hearts.textContent = W.heartsString(W.player.health);
      const hunger = document.getElementById('hunger');
      if (hunger) hunger.textContent = W.hungerString(W.player.hunger);
      const clockLine = document.getElementById('clockLine');
      if (clockLine) clockLine.textContent = `☀ Day ${W.dayCount || 1}`;
      W._saveTimer = (W._saveTimer || 0) + dt;
      if (W._saveTimer >= 10) { if (typeof W.saveGame === 'function') W.saveGame(); W._saveTimer = 0; }
      if (typeof W.updateMobs === 'function') W.updateMobs(dt);
    };
    requestAnimationFrame(frame);
  };

  W.enterGame = () => {
    const isMobile = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    const blocker = document.getElementById('blocker');
    if (blocker) blocker.style.display = 'none';
    const mobileUI = document.getElementById('mobileUI');
    if (mobileUI && isMobile) mobileUI.style.display = 'block';
    const death = document.getElementById('deathScreen');
    if (death) death.style.display = 'none';
    W.gameStarted = true;
    if (!isMobile && W.renderer && W.renderer.domElement.requestPointerLock) {
      try { W.renderer.domElement.requestPointerLock(); } catch (e) {}
    }
  };

  W.respawn = () => {
    W.player.health = 100;
    W.player.hunger = 100;
    W.player.alive = true;
    W.player.vel.set(0, 0, 0);
    W.placeSpawn();
    const ds = document.getElementById('deathScreen');
    if (ds) ds.style.display = 'none';
  };

  function boot() {
    try {
      console.log('[NEO] Boot starting');
      if (!window.THREE) throw new Error('THREE.js not loaded');
      if (typeof W.uiInit === 'function') W.uiInit();
      const l = document.getElementById('loading');
      if (l) l.style.display = 'none';
      const b = document.getElementById('blocker');
      if (b) b.style.display = 'flex';
      W.startLoop();
      console.log('[NEO] Boot complete');
    } catch (e) {
      console.error('[NEO] Boot error:', e);
      const l = document.getElementById('loading');
      if (l) l.textContent = 'Error: ' + (e && e.message ? e.message : e);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  console.log('[NEO] Game system ready');
})();