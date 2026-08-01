(function () {
  'use strict';
  const W = window.NEO || (window.NEO = {});

  W.uiInit = () => {
    try {
      const isMobile = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
      const controlsHelp = document.getElementById('controlsHelp');
      if (controlsHelp) {
        controlsHelp.textContent = isMobile
          ? 'Left pad to move, right side to look. Hold break to mine, tap place to build, jump to jump.'
          : 'WASD move, Shift sprint, mouse look. Left click mine/attack, right click place. Keys 1-9 select, E inventory.';
      }

      const mobileUI = document.getElementById('mobileUI');
      if (mobileUI) mobileUI.style.display = isMobile ? 'block' : 'none';

      // Build hotbar
      const hotbar = document.getElementById('hotbar');
      if (hotbar) {
        hotbar.innerHTML = '';
        if (W.SLOT_ORDER && W.BLOCKCOLORS && W.itemName) {
          W.SLOT_ORDER.forEach((b, i) => {
            const el = document.createElement('div');
            el.className = 'slot' + (i === 0 ? ' active' : '');
            const col = W.BLOCKCOLORS[b] ? W.BLOCKCOLORS[b].side : [0.6, 0.6, 0.6];
            el.style.background = `rgb(${Math.round(col[0]*255)},${Math.round(col[1]*255)},${Math.round(col[2]*255)})`;
            el.innerHTML = `<span class="num">${i+1}</span><span>${W.itemName(b)}</span><span class="cnt">0</span>`;
            el.onclick = () => { if (typeof W.selectSlot === 'function') W.selectSlot(i + 1); };
            hotbar.appendChild(el);
          });
        }
      }

      // Button bindings
      const invBtn = document.getElementById('invBtn');
      if (invBtn) invBtn.onclick = () => { if (typeof W.toggleInventory === 'function') W.toggleInventory(); };

      const closeInv = document.getElementById('closeInv');
      if (closeInv) closeInv.onclick = () => { if (typeof W.toggleInventory === 'function') W.toggleInventory(); };

      const respawnBtn = document.getElementById('respawnBtn');
      if (respawnBtn) respawnBtn.onclick = () => { if (typeof W.respawn === 'function') W.respawn(); };

      const startBtn = document.getElementById('startBtn');
      if (startBtn) {
        startBtn.onclick = () => {
          if (typeof W.loadGame === 'function') W.loadGame();
          if (typeof W.enterGame === 'function') W.enterGame();
        };
      }

      const newBtn = document.getElementById('newBtn');
      if (newBtn) {
        newBtn.onclick = () => {
          if (typeof W.newWorld === 'function') W.newWorld();
          if (typeof W.enterGame === 'function') W.enterGame();
        };
      }

      console.log('[NEO] UI initialized');
    } catch (e) {
      console.error('[NEO] UI init error:', e);
    }
  };
})();