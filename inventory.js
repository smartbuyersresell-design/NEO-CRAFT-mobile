(function () {
  'use strict';
  const W = window.NEO || (window.NEO = {});

  W.inventory = {};
  W.selected = 1;
  W.equippedTool = 0;

  W.addItem = (id, count) => {
    if (!id || !count) return;
    W.inventory[id] = (W.inventory[id] || 0) + count;
  };

  W.hasItem = (id, count) => {
    return (W.inventory[id] || 0) >= (count || 1);
  };

  W.removeItem = (id, count) => {
    if (!W.hasItem(id, count)) return false;
    W.inventory[id] -= count;
    if (W.inventory[id] <= 0) delete W.inventory[id];
    return true;
  };

  W.refreshHotbarCounts = () => {
    try {
      const slots = document.querySelectorAll('#hotbar .slot');
      slots.forEach((el, i) => {
        if (W.SLOT_ORDER && W.SLOT_ORDER[i]) {
          const b = W.SLOT_ORDER[i];
          const cnt = el.querySelector('.cnt');
          if (cnt) cnt.textContent = W.inventory[b] || 0;
          el.classList.toggle('active', i === W.selected - 1);
        }
      });
    } catch (e) {
      console.warn('[NEO] Hotbar refresh error:', e);
    }
  };

  W.selectSlot = n => {
    if (!W.SLOT_ORDER || n < 1 || n > W.SLOT_ORDER.length) return;
    W.selected = n;
    W.refreshHotbarCounts();
  };

  W.updateToolLine = () => {
    try {
      const toolLine = document.getElementById('toolLine');
      if (toolLine) {
        toolLine.textContent = 'Tool: ' + (W.equippedTool && W.itemName ? W.itemName(W.equippedTool) : 'Hand');
      }
    } catch (e) {
      console.warn('[NEO] Tool line update error:', e);
    }
  };

  W.renderInventoryPanel = () => {
    try {
      const matList = document.getElementById('matList');
      const craftList = document.getElementById('craftList');
      const toolList = document.getElementById('toolList');

      if (!matList || !craftList || !toolList) return;

      matList.innerHTML = '';
      craftList.innerHTML = '';
      toolList.innerHTML = '';

      if (W.inventory) {
        for (const [itemId, count] of Object.entries(W.inventory)) {
          const id = parseInt(itemId);
          if (id >= 100) {
            const row = document.createElement('div');
            row.className = 'invRow';
            row.innerHTML = `<span class="name">${W.itemName ? W.itemName(id) : 'Item ' + id}</span><span class="cnt">${count}</span>`;
            if (id >= 108) toolList.appendChild(row);
            else craftList.appendChild(row);
          } else {
            const row = document.createElement('div');
            row.className = 'invRow';
            row.innerHTML = `<span class="name">${W.BLOCKNAMES ? W.BLOCKNAMES[id] : 'Block ' + id}</span><span class="cnt">${count}</span>`;
            matList.appendChild(row);
          }
        }
      }
    } catch (e) {
      console.warn('[NEO] Inventory panel render error:', e);
    }
  };

  W.toggleInventory = () => {
    try {
      const panel = document.getElementById('invPanel');
      if (panel) {
        const isHidden = panel.style.display === 'none';
        panel.style.display = isHidden ? 'flex' : 'none';
        if (isHidden && typeof W.renderInventoryPanel === 'function') {
          W.renderInventoryPanel();
        }
      }
    } catch (e) {
      console.warn('[NEO] Toggle inventory error:', e);
    }
  };
})();