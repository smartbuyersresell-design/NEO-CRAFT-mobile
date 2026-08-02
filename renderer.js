(function () {
  'use strict';
  const W = window.NEO || (window.NEO = {});

  if (typeof THREE === 'undefined') {
    console.error('[NEO] THREE.js required');
    return;
  }

  W.scene = new THREE.Scene();
  W.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 200);
  W.camera.position.y = 32;

  W.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'low-power', alpha: false, stencil: false });
  W.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  W.renderer.setSize(window.innerWidth, window.innerHeight);
  W.renderer.shadowMap.enabled = false;
  W.renderer.sortObjects = false;
  document.body.appendChild(W.renderer.domElement);

  W.scene.background = new THREE.Color(0x87CEEB);
  W.scene.fog = new THREE.Fog(0x87CEEB, 40, 120);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
  const sun = new THREE.DirectionalLight(0xfff3d0, 0.8);
  sun.position.set(80, 60, 80);
  const amb = new THREE.AmbientLight(0xffffff, 0.4);
  W.scene.add(hemi, sun, amb);
  W.hemi = hemi;
  W.sun = sun;
  W.amb = amb;

  W.sunMesh = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfff2b0 }));
  W.moonMesh = new THREE.Mesh(new THREE.SphereGeometry(2.5, 8, 8), new THREE.MeshBasicMaterial({ color: 0xcfd8ee }));
  W.scene.add(W.sunMesh, W.moonMesh);

  W.createAtlas = () => {
    if (W._atlas) return W._atlas;
    const tileSize = 32, tilesPerRow = 8, atlasSize = tileSize * tilesPerRow;
    const canvas = document.createElement('canvas');
    canvas.width = atlasSize;
    canvas.height = atlasSize;
    const ctx = canvas.getContext('2d', { willReadFrequently: false });

    const drawTile = (idx, drawFn) => {
      const tx = (idx % tilesPerRow) * tileSize;
      const ty = Math.floor(idx / tilesPerRow) * tileSize;
      const img = ctx.createImageData(tileSize, tileSize);
      const data = img.data;
      for (let y = 0; y < tileSize; y++) {
        for (let x = 0; x < tileSize; x++) {
          const off = (y * tileSize + x) * 4;
          const col = drawFn(x, y, tileSize);
          data[off] = col[0];
          data[off+1] = col[1];
          data[off+2] = col[2];
          data[off+3] = col[3];
        }
      }
      ctx.putImageData(img, tx, ty);
    };

    drawTile(0, (x,y,ts)=> { const g = Math.floor(150 + 50 * Math.sin((x+y)/4)); return [40,g,30,255]; });
    drawTile(1, (x,y,ts)=> [35,110,35,255]);
    drawTile(2, (x,y,ts)=> [100,60,30,255]);
    drawTile(3, (x,y,ts)=> [180,180,190,255]);
    drawTile(4, (x,y,ts)=> [220,200,140,255]);
    drawTile(5, (x,y,ts)=> [150,100,50,255]);
    drawTile(6, (x,y,ts)=> [180,80,80,255]);
    drawTile(7, (x,y,ts)=> [200,180,120,255]);
    drawTile(8, (x,y,ts)=> [160,100,60,255]);
    drawTile(9, (x,y,ts)=> [200,180,100,255]);
    drawTile(10,(x,y,ts)=> [100,60,30,255]);
    drawTile(11,(x,y,ts)=> [80,150,200,180]);
    drawTile(12,(x,y,ts)=> [200,100,150,255]);
    drawTile(13,(x,y,ts)=> [80,220,80,200]);
    drawTile(14,(x,y,ts)=> [200,230,240,120]);

    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.needsUpdate = true;
    W._atlas = { texture: tex, tileSize, tilesPerRow, atlasSize };
    return W._atlas;
  };

  const F = [[1,0,0,[1,0,0,1,1,0,1,1,1,1,0,1],'side'],[-1,0,0,[0,0,1,0,1,1,0,1,0,0,0,0],'side'],[0,1,0,[0,1,0,0,1,1,1,1,1,1,1,0],'top'],[0,-1,0,[0,0,1,0,0,0,1,0,0,1,0,1],'bottom'],[0,0,1,[1,0,1,1,1,1,0,1,1,0,0,1],'side'],[0,0,-1,[0,0,0,0,1,0,1,1,0,1,0,0],'side']];
  const isSolidBlock = id => id !== W.BLOCK.AIR && id !== W.BLOCK.WATER;

  W._solidMat = null;
  W._transMat = null;

  const doBuildMesh = () => {
    W._buildPending = false;
    const atlas = W.createAtlas();
    if (!W._solidMat) W._solidMat = new THREE.MeshLambertMaterial({ map: atlas.texture, vertexColors: false });
    if (!W._transMat) W._transMat = new THREE.MeshPhongMaterial({ map: atlas.texture, vertexColors: false, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide });

    const posS = [], norS = [], colS = [], uvS = [];
    const posT = [], norT = [], colT = [], uvT = [];

    if (W.chunks) {
      for (const c of W.chunks.values()) {
        if (!c.dirty && W.mesh) continue;
        let empty = true;
        for (let i = 0; i < 100; i++) { if (c.blocks[i]) { empty = false; break; } }
        if (empty) continue;

        for (let x = 0; x < W.CHUNK; x++) {
          for (let y = 0; y < W.SY; y++) {
            for (let z = 0; z < W.CHUNK; z++) {
              const b = c.blocks[W.idx(x, y, z)];
              if (!b || b === W.BLOCK.AIR) continue;

              const gx = c.cx * W.CHUNK + x;
              const gz = c.cz * W.CHUNK + z;
              const mapping = (W.BLOCK_UV && W.BLOCK_UV[b]) ? W.BLOCK_UV[b] : { top: 0, side: 0 };
              const vnoise = 0.85 + (W.hash2 ? (W.hash2(gx + y, gz) * 0.15) : 0);

              for (const f of F) {
                const nx = gx + f[0], ny = y + f[1], nz = gz + f[2];
                const nb = W.getBlock(nx, ny, nz);
                if (nb !== W.BLOCK.AIR && nb !== W.BLOCK.WATER) continue;

                const faceType = f[4];
                let tileIndex = mapping[faceType] ?? mapping.side ?? 0;
                const isTrans = !!mapping.transparent || b === W.BLOCK.WATER || b === W.BLOCK.LEAVES || b === W.BLOCK.GLASS || b === W.BLOCK.FLOWER || b === W.BLOCK.TALLGRASS;

                const shadeBase = (faceType === 'top') ? 1.0 : (faceType === 'bottom' ? 0.5 : 0.7);
                let oc = 0;
                if (isSolidBlock(W.getBlock(gx+1, y, gz))) oc++;
                if (isSolidBlock(W.getBlock(gx-1, y, gz))) oc++;
                if (isSolidBlock(W.getBlock(gx, y, gz+1))) oc++;
                if (isSolidBlock(W.getBlock(gx, y, gz-1))) oc++;
                const ocFactor = 1 - Math.min(0.4, oc * 0.08);

                const baseColor = W.BLOCKCOLORS[b] ? (W.BLOCKCOLORS[b][faceType] || W.BLOCKCOLORS[b].side) : [0.5, 0.5, 0.5];
                const r0 = Math.round(baseColor[0] * shadeBase * ocFactor * vnoise * 255);
                const g0 = Math.round(baseColor[1] * shadeBase * ocFactor * vnoise * 255);
                const b0 = Math.round(baseColor[2] * shadeBase * ocFactor * vnoise * 255);

                const cr = f[3];
                const tileX = tileIndex % atlas.tilesPerRow;
                const tileY = Math.floor(tileIndex / atlas.tilesPerRow);
                const u0 = (tileX * atlas.tileSize) / atlas.atlasSize;
                const v0 = (tileY * atlas.tileSize) / atlas.atlasSize;
                const u1 = ((tileX+1) * atlas.tileSize) / atlas.atlasSize;
                const v1 = ((tileY+1) * atlas.tileSize) / atlas.atlasSize;
                const faceUVs = [[u1,v1],[u0,v1],[u0,v0],[u1,v0]];

                let targetPos, targetNor, targetCol, targetUV;
                if (isTrans) { targetPos = posT; targetNor = norT; targetCol = colT; targetUV = uvT; }
                else { targetPos = posS; targetNor = norS; targetCol = colS; targetUV = uvS; }

                for (let oi = 0; oi < 6; oi++) {
                  const vi = [0,1,2,0,2,3][oi];
                  const vx = cr[vi*3], vy = cr[vi*3+1], vz = cr[vi*3+2];
                  targetPos.push(gx + vx, y + vy, gz + vz);
                  targetNor.push(f[0], f[1], f[2]);
                  targetCol.push(r0, g0, b0);
                  const uv = faceUVs[vi % 4];
                  targetUV.push(uv[0], uv[1]);
                }
              }
            }
          }
        }
        c.dirty = false;
      }
    }

    const makeGeo = (posA, norA, colA, uvA) => {
      if (!posA.length) return null;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(posA, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(norA, 3));
      geo.setAttribute('color', new THREE.Uint8BufferAttribute(new Uint8Array(colA), 3, true));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvA, 2));
      geo.computeBoundingSphere();
      return geo;
    };

    const geoS = makeGeo(posS, norS, colS, uvS);
    const geoT = makeGeo(posT, norT, colT, uvT);

    try { if (W.mesh) { W.scene.remove(W.mesh); W.mesh.geometry && W.mesh.geometry.dispose(); } } catch (e) {}
    try { if (W.transMesh) { W.scene.remove(W.transMesh); W.transMesh.geometry && W.transMesh.geometry.dispose(); } } catch (e) {}

    if (geoS) { W.mesh = new THREE.Mesh(geoS, W._solidMat); W.scene.add(W.mesh); }
    if (geoT) { W.transMesh = new THREE.Mesh(geoT, W._transMat); W.scene.add(W.transMesh); }
  };

  W._buildPending = false;
  W.buildMesh = () => {
    if (W._buildPending) return;
    W._buildPending = true;
    setTimeout(doBuildMesh, 150);
  };

  W.onResize = () => {
    W.camera.aspect = window.innerWidth / window.innerHeight;
    W.camera.updateProjectionMatrix();
    W.renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', W.onResize);

  (function tickLoop() {
    const tick = () => {
      if (W.renderer && W.scene && W.camera) W.renderer.render(W.scene, W.camera);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  })();

  console.log('[NEO] Renderer optimized for low-end devices');
})();