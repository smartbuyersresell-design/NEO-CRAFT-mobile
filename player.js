(function () {
  'use strict';
  const W = window.NEO || (window.NEO = {});

  if (typeof THREE === 'undefined') {
    console.error('[NEO] THREE.js not loaded!');
    return;
  }

  W.player = {
    pos: new THREE.Vector3(128, 40, 128),
    vel: new THREE.Vector3(0, 0, 0),
    health: 100,
    hunger: 100,
    alive: true,
    yaw: 0,
    pitch: 0
  };

  W.playerAttackCooldown = 0;

  console.log('[NEO] Player initialized');
})();