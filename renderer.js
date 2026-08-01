(function () {
  'use strict';
  const W = window.NEO || (window.NEO = {});

  // Initialize THREE scene
  if (typeof THREE === 'undefined') {
    console.error('[NEO] THREE.js not loaded!');
    return;
  }

  W.scene = new THREE.Scene();
  W.camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.05, 400);
  W.camera.position.y = 40;

  W.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', alpha: false });
  W.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  W.renderer.setSize(window.innerWidth, window.innerHeight);
  W.renderer.shadowMap.enabled = false;
  document.body.appendChild(W.renderer.domElement);

  // Lighting
  W.scene.background = new THREE.Color(0x87CEEB);
  W.scene.fog = new THREE.Fog(0x87CEEB, 50, 150);
  
  const hemi = new THREE.HemisphereLight(0xffffff, 0x445533, 0.9);
  const sun = new THREE.DirectionalLight(0xfff3d0, 0.9);
  sun.position.set(100, 80, 100);
  const amb = new THREE.AmbientLight(0xffffff, 0.35);
  W.scene.add(hemi, sun, amb);
  W.hemi = hemi;
  W.sun = sun;
  W.amb = amb;

  // Sun & Moon
  W.sunMesh = new THREE.Mesh(new THREE.SphereGeometry(4, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfff2b0 }));
  W.moonMesh = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 8), new THREE.MeshBasicMaterial({ color: 0xcfd8ee }));
  W.scene.add(W.sunMesh, W.moonMesh);

  // Starfield
  (function createStars() {
    const STAR_COUNT = 500;
    const stars = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < stars.length; i += 3) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 260;
      stars[i]   = Math.cos(theta) * Math.sin(phi) * r + (W.SX || 128) / 2;
      stars[i+1] = Math.cos(phi) * r + 30;
      stars[i+2] = Math.sin(theta) * Math.sin(phi) * r + (W.SZ || 128) / 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(stars, 3));
    W.starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.9, transparent: true, opacity: 0.0 });
    W.starPoints = new THREE.Points(geo, W.starMaterial);
    W.scene.add(W.starPoints);
  })();

  // Texture Atlas
  W.createAtlas = () => {
    if (W._atlas) return W._atlas;
    const tileSize = 32;
    const tilesPerRow = 8;
    const atlasSize = tileSize * tilesPerRow;
    const canvas = document.createElement('canvas');
    canvas.width = atlasSize;
    canvas.height = atlasSize;
    const ctx = canvas.getContext('2d');

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

    drawTile(0, (x,y,ts)=> { const g = Math.floor(150 + 60 * (0.9 + 0.1 * Math.sin((x+y)/6))); return [40,g,30,255]; });
    drawTile(1, (x,y,ts)=> [35,120,35,255]);
    drawTile(2, (x,y,ts)=> [110 + ((x*y)%7),70,30,255]);
    drawTile(3, (x,y,ts)=> { const n = Math.floor(200 - (Math.abs(Math.sin(x*0.3+y*0.2))*40)); return [n,n-10,n-5,255]; });
    drawTile(4, (x,y,ts)=> [220 - (x%5),200 + (y%3),120 + (x%4),255]);
    drawTile(5, (x,y,ts)=> { const cx = ts/2, cy = ts/2; const d = Math.sqrt((x-cx)*(x-cx)+(y-cy)*(y-cy)); const ring = Math.floor(d/3)%2; return ring ? [140,100,60,255] : [175,120,70,255]; });
    drawTile(6, (x,y,ts)=> { const row = Math.floor(y/8); return (row%2) ? [125,85,45,255] : [150,100,60,255]; });
    drawTile(7, (x,y,ts)=> { const g = 130 + Math.floor(Math.random()*60); return [40,g,20,220]; });
    drawTile(8, (x,y,ts)=> [170,120,70,255]);
    drawTile(9, (x,y,ts)=> { const c = ((Math.floor(x/8)+Math.floor(y/8))%2)? [180,130,80,255] : [150,110,70,255]; return c; });
    drawTile(10,(x,y,ts)=> [120,80,45,255]);
    drawTile(11,(x,y,ts)=> [50,120,200,180]);
    drawTile(12,(x,y,ts)=> [220,100,180,255]);
    drawTile(13,(x,y,ts)=> { const a = (x>ts*0.45 && x<ts*0.55) ? [30,200,40,220] : [0,0,0,0]; return a; });
    drawTile(14,(x,y,ts)=> [200,235,245,120]);

    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestMipMapNearestFilter;
    tex.needsUpdate = true;
    W._atlas = { texture: tex, tileSize: tileSize, tilesPerRow: tilesPerRow, atlasSize: atlasSize };
    return W._atlas;
  };

  // Face definitions
  const F = [
    [1,0,0,[1,0,0,1,1,0,1,1,1,1,0,1],'side'],
    [-1,0,0,[0,0,1,0,1,1,0,1,0,0,0,0],'side'],
    [0,1,0,[0,1,0,0,1,1,1,1,1,1,1,0],'top'],
    [0,-1,0,[0,0,1,0,0,0,1,0,0,1,0,1],'bottom'],
    [0,0,1,[1,0,1,1,1,1,0,1,1,0,0,1],'side'],
    [0,0,-1,[0,0,0,0,1,0,1,1,0,1,0,0],'side']
  ];

  const isSolidBlock = id => id !== W.BLOCK.AIR && id !== W.BLOCK.WATER;

  W._solidMat = null;
  W._transMat = null;

  const doBuildMesh = () => {
    W._buildPending = false;
    const atlas = W.createAtlas();
    
    if (!W._solidMat) W._solidMat = new THREE.MeshLambertMaterial({ map: atlas.texture, vertexColors: true });
    else W._solidMat.map = atlas.texture;
    if (!W._transMat) W._transMat = new THREE.MeshPhongMaterial({ map: atlas.texture, vertexColors: true, transparent: true, opacity: 0.92, depthWrite: false, side: THREE.DoubleSide });
    else W._transMat.map = atlas.texture;

    const posS = [], norS = [], colS = [], uvS = [];
    const posT = [], norT = [], colT = [], uvT = [];

    if (!W.chunks) return;
    for (const c of W.chunks.values()) {
      let empty = true;
      for (let i = 0; i < c.blocks.length; i++) { if (c.blocks[i]) { empty = false; break; } }
      if (empty) continue;

      for (let x = 0; x < W.CHUNK; x++) {
        for (let y = 0; y < W.SY; y++) {
          for (let z = 0; z < W.CHUNK; z++) {
            const b = c.blocks[W.idx(x, y, z)];
            if (!b || b === W.BLOCK.AIR) continue;

            const gx = c.cx * W.CHUNK + x;
            const gz = c.cz * W.CHUNK + z;
            const mapping = (W.BLOCK_UV && W.BLOCK_UV[b]) ? W.BLOCK_UV[b] : { top: 0, side: 0, bottom: 0 };
            const vnoise = 0.9 + (W.hash2 ? (W.hash2(gx * 13 + y * 7, gz * 17) - 0.5) * 0.18 : 0);

            for (const f of F) {
              const nx = gx + f[0], ny = y + f[1], nz = gz + f[2];
              const nb = W.getBlock(nx, ny, nz);
              if (nb !== W.BLOCK.AIR && nb !== W.BLOCK.WATER) continue;

              const faceType = f[4];
              let tileIndex = mapping[faceType] ?? mapping.side ?? 0;
              const isTrans = !!mapping.transparent || b === W.BLOCK.WATER || b === W.BLOCK.LEAVES || b === W.BLOCK.GLASS || b === W.BLOCK.FLOWER || b === W.BLOCK.TALLGRASS;

              const shadeBase = (faceType === 'top') ? 1.0 : (faceType === 'bottom' ? 0.60 : 0.78);
              let oc = 0;
              if (isSolidBlock(W.getBlock(gx+1, y, gz))) oc++;
              if (isSolidBlock(W.getBlock(gx-1, y, gz))) oc++;
              if (isSolidBlock(W.getBlock(gx, y, gz+1))) oc++;
              if (isSolidBlock(W.getBlock(gx, y, gz-1))) oc++;
              const ocFactor = 1 - Math.min(0.5, oc * 0.06);

              const baseColor = W.BLOCKCOLORS[b] ? (W.BLOCKCOLORS[b][faceType] || W.BLOCKCOLORS[b].side) : [0.6, 0.6, 0.6];
              const r0 = baseColor[0] * shadeBase * ocFactor * vnoise;
              const g0 = baseColor[1] * shadeBase * ocFactor * vnoise;
              const b0 = baseColor[2] * shadeBase * ocFactor * vnoise;

              const cr = f[3];
              const order = [0, 1, 2, 0, 2, 3];

              const tileX = tileIndex % atlas.tilesPerRow;
              const tileY = Math.floor(tileIndex / atlas.tilesPerRow);
              const u0 = (tileX * atlas.tileSize) / atlas.atlasSize;
              const v0 = (tileY * atlas.tileSize) / atlas.atlasSize;
              const u1 = ((tileX + 1) * atlas.tileSize) / atlas.atlasSize;
              const v1 = ((tileY + 1) * atlas.tileSize) / atlas.atlasSize;
              const faceUVs = [[u1, v1], [u0, v1], [u0, v0], [u1, v0]];

              let targetPos, targetNor, targetCol, targetUV;
              if (isTrans) {
                targetPos = posT;
                targetNor = norT;
                targetCol = colT;
                targetUV = uvT;
              } else {
                targetPos = posS;
                targetNor = norS;
                targetCol = colS;
                targetUV = uvS;
              }

              for (let oi = 0; oi < order.length; oi++) {
                const vi = order[oi];
                const vx = cr[vi * 3], vy = cr[vi * 3 + 1], vz = cr[vi * 3 + 2];
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
    }

    const makeGeo = (posA, norA, colA, uvA) => {
      if (!posA.length) return null;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(posA, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(norA, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colA, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvA, 2));
      geo.computeBoundingSphere();
      return geo;
    };

    const geoS = makeGeo(posS, norS, colS, uvS);
    const geoT = makeGeo(posT, norT, colT, uvT);

    try { if (W.mesh) { W.scene.remove(W.mesh); W.mesh.geometry && W.mesh.geometry.dispose(); } } catch (e) {}
    try { if (W.transMesh) { W.scene.remove(W.transMesh); W.transMesh.geometry && W.transMesh.geometry.dispose(); } } catch (e) {}

    if (geoS) { W.mesh = new THREE.Mesh(geoS, W._solidMat); W.scene.add(W.mesh); } else W.mesh = null;
    if (geoT) { W.transMesh = new THREE.Mesh(geoT, W._transMat); W.scene.add(W.transMesh); } else W.transMesh = null;
    
    console.log('[NEO] Mesh built');
  };

  W._buildPending = false;
  W.buildMesh = () => {
    if (W._buildPending) return;
    W._buildPending = true;
    setTimeout(() => {
      try { doBuildMesh(); } catch (e) { console.error('[NEO] buildMesh error:', e); }
    }, 100);
  };

  W.onResize = () => {
    W.camera.aspect = window.innerWidth / window.innerHeight;
    W.camera.updateProjectionMatrix();
    W.renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', W.onResize);

  // Tick loop for animation
  (function tickLoop() {
    const tick = () => {
      let dayLight = 1;
      if (typeof W.sunElevation === 'function') {
        try { dayLight = Math.max(0, W.sunElevation()); } catch (e) { dayLight = 1; }
      }
      if (W.starMaterial) W.starMaterial.opacity = Math.max(0, 1 - Math.pow(dayLight, 1.6));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  })();

  console.log('[NEO] Renderer initialized');
})();