(function () {
  'use strict';
  const W = window.NEO || (window.NEO = {});

  W.canCraft = recipe => {
    if (!recipe || !recipe.inputs) return false;
    return recipe.inputs.every(inp => W.hasItem && W.hasItem(inp.item, inp.count));
  };

  W.doCraft = recipe => {
    if (!W.canCraft(recipe)) return false;
    try {
      recipe.inputs.forEach(inp => {
        if (W.removeItem) W.removeItem(inp.item, inp.count);
      });
      if (W.addItem) W.addItem(recipe.output.item, recipe.output.count);
      if (W.refreshHotbarCounts) W.refreshHotbarCounts();
      return true;
    } catch (e) {
      console.warn('[NEO] Craft error:', e);
      return false;
    }
  };
})();