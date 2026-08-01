(function () {
  'use strict';
  const W = window.NEO || (window.NEO = {});

  W.gameStarted = false;
  W.isPaused = false;

  // Game loop with proper initialization
  W.startLoop = () => {
    let lastFrameTime = performance.now();

    function frame(now) {
      requestAnimationFrame(frame);

      const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
      lastFrameTime = now;

      if (!W.gameStarted || !W.player.alive) return;

      // Update game state
      W.elapsed = (W.elapsed || 0) + dt;

      // Update player camera
      if (W.camera && W.player) {
        W.camera.position.copy(W.player.pos);
        W.camera.position.y += 0.6; // Eye height
      }

      // Update HUD
      const posLine = document.getElementById('posLine');
      if (posLine && W.player) posLine.textContent = `x:${W.player.pos.x.toFixed(1)} y:${W.player.pos.y.toFixed(1)} z:${W.player.pos.z.toFixed(1)}`;

      const hearts = document.getElementById('hearts');
      if (hearts && W.heartsString) hearts.textContent = W.heartsString(W.player.health);

      const hunger = document.getElementById('hunger');
      if (hunger && W.hungerString) hunger.textContent = W.hungerString(W.player.hunger);

      const clockLine = document.getElementById('clockLine');
      if (clockLine) {
        const isDaylight = W.isDaylight ? W.isDaylight() : true;
        clockLine.textContent = `${isDaylight ? '☀' : '☾'} Day ${W.dayCount || 1}`;
      }

      // Throttled saves
      W._saveTimer = (W._saveTimer || 0) + dt;
      if (W._saveTimer >= 5.0) {
        if (typeof W.saveGame === 'function') W.saveGame();
        W._saveTimer = 0;
      }

      // Render
      if (W.renderer && W.scene && W.camera) {
        W.renderer.render(W.scene, W.camera);
      }
    }

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

  // Bootstrap
  function boot() {
    try {
      console.log('[NEO] Booting game...');
      
      if (!window.THREE) {
        throw new Error('THREE.js not loaded');
      }

      if (typeof W.uiInit === 'function') W.uiInit();
      if (typeof W.initInput === 'function') W.initInput();
      if (typeof W.newWorld === 'function') W.newWorld();
      
      const loading = document.getElementById('loading');
      if (loading) loading.style.display = 'none';
      const blocker = document.getElementById('blocker');
      if (blocker) blocker.style.display = 'flex';
      
      W.startLoop();
      console.log('[NEO] Game boot complete');
    } catch (e) {
      console.error('[NEO] Boot error:', e);
      const loading = document.getElementById('loading');
      if (loading) loading.textContent = 'Error: ' + (e && e.message ? e.message : e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();