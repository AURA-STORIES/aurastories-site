
    import * as THREE from 'three';
    import { OrbitControls } from 'orbit';

    // -------------------------------------------------------------------------
    // 1. WEBGL CHECK
    // -------------------------------------------------------------------------
    function isWebGLAvailable() {
      try {
        const c = document.createElement('canvas');
        return !!c.getContext('webgl2');
      } catch {
        return false;
      }
    }

    if (!isWebGLAvailable()) {
      document.getElementById('webgl-fallback').classList.add('visible');
      throw new Error('WebGL unavailable');
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // -------------------------------------------------------------------------
    // 2. CHAPTER METADATA & GUIDED CAMERA TARGETS
    // -------------------------------------------------------------------------
    const CHAPTERS = [
      {
        id: 0,
        shortLabel: '1891 Cut',
        start: 0.00,
        end: 0.16,
        jumpT: 0.14,
        title: '1891 · Survey & Hillside Cut',
        badge: 'Representative stretch · 1891–1908',
        badgeType: 'historical',
        caption: 'Surveyors peg a steady 1-in-12 alignment along the rocky Nilgiri slope. Rock-cut benching and lower retaining footings prepare the hillside.',
        camPos: new THREE.Vector3(-34, 24, 42),
        camTarget: new THREE.Vector3(-8, 10, 0)
      },
      {
        id: 1,
        shortLabel: 'Piers',
        start: 0.16,
        end: 0.34,
        jumpT: 0.32,
        title: 'Earthworks & Pier Foundations',
        badge: 'Engineering sequence · Stage 2',
        badgeType: 'engineering',
        caption: 'Terraced granite retaining walls with drainage weep holes stabilize the embankments while three tapered masonry piers with cutwaters rise from the ravine floor.',
        camPos: new THREE.Vector3(24, 15, 36),
        camTarget: new THREE.Vector3(0, 7.5, 0)
      },
      {
        id: 2,
        shortLabel: 'Falsework',
        start: 0.34,
        end: 0.54,
        jumpT: 0.51,
        title: 'Timber Falsework & Arch Masonry',
        badge: 'Engineering sequence · Stage 3',
        badgeType: 'engineering',
        caption: 'Arched timber centering trusses erect between the piers first. Radial granite voussoir blocks then climb symmetrically from both sides until the keystone locks each arch.',
        camPos: new THREE.Vector3(16, 14, 25),
        camTarget: new THREE.Vector3(0, 9.8, 0)
      },
      {
        id: 3,
        shortLabel: 'Deck',
        start: 0.54,
        end: 0.70,
        jumpT: 0.68,
        title: 'Spandrels, Parapet & Ballast',
        badge: 'Engineering sequence · Stage 4',
        badgeType: 'engineering',
        caption: 'With the masonry arches self-supporting, the timber falsework is struck and removed. Spandrel walls, cornice coping, refuge bays, and crushed ballast complete the deck.',
        camPos: new THREE.Vector3(28, 21, 34),
        camTarget: new THREE.Vector3(0, 11.5, 0)
      },
      {
        id: 4,
        shortLabel: 'Abt Rack',
        start: 0.70,
        end: 0.85,
        jumpT: 0.84,
        title: 'Sleepers, Rails & Abt Rack',
        badge: 'Engineering sequence · Stage 5',
        badgeType: 'engineering',
        caption: 'Creosoted sleepers, cast-iron rail chairs, and flanged metre-gauge rails climb the grade, paired with the staggered double-bar toothed Abt rack between them. Zoom in to inspect the teeth.',
        camPos: new THREE.Vector3(14, 25, 22),
        camTarget: new THREE.Vector3(1, 12.8, 0.2)
      },
      {
        id: 5,
        shortLabel: 'Crossing',
        start: 0.85,
        end: 1.00,
        jumpT: 1.00,
        title: '1899–1908 · First Crossing',
        badge: 'Representative stretch · 1891–1908',
        badgeType: 'historical',
        caption: 'An unbranded rack tank locomotive pushes a vintage wooden coach uphill along the 1-in-12 incline—authentic hill-railway practice so the coach stays secured above the engine.',
        camPos: new THREE.Vector3(31, 21, 37),
        camTarget: new THREE.Vector3(2, 12.2, 0)
      }
    ];

    const DEFAULT_CAM_POS = new THREE.Vector3(14,25,61);
    const DEFAULT_CAM_TARGET = new THREE.Vector3(4,11,0);



    // -------------------------------------------------------------------------
    // 3. PROCEDURAL PBR CANVAS TEXTURES (ALBEDO + BUMP + ROUGHNESS)
    // -------------------------------------------------------------------------
    function makeSeededRandom(seed) {
      let s = seed % 2147483647;
      if (s <= 0) s += 2147483646;
      return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
      };
    }

    function createAshlarPBR(seed = 101) {
      const rand = makeSeededRandom(seed);
      const size = 512;
      const cCol = document.createElement('canvas');
      const cBump = document.createElement('canvas');
      cCol.width = cBump.width = size;
      cCol.height = cBump.height = size;
      const ctx = cCol.getContext('2d');
      const btx = cBump.getContext('2d');

      // Warm Nilgiri dressed granite base
      ctx.fillStyle = '#8b857b';
      ctx.fillRect(0, 0, size, size);
      btx.fillStyle = '#c8c8c8';
      btx.fillRect(0, 0, size, size);

      const rows = 8;
      const rowH = size / rows;
      for (let r = 0; r < rows; r++) {
        const cols = 4;
        const colW = size / cols;
        const offset = (r % 2) * (colW * 0.5);
        for (let c = -1; c <= cols; c++) {
          const x = c * colW + offset;
          const y = r * rowH;
          const tone = 116 + Math.floor((rand() - 0.5) * 32);
          const warmR = tone + Math.floor(rand() * 14);
          const warmG = tone + Math.floor(rand() * 8);
          const warmB = tone - Math.floor(rand() * 8);

          ctx.fillStyle = `rgb(${warmR},${warmG},${warmB})`;
          ctx.fillRect(x + 2, y + 2, colW - 4, rowH - 4);

          // Chiseled block face bump
          const bVal = 175 + Math.floor((rand() - 0.5) * 40);
          btx.fillStyle = `rgb(${bVal},${bVal},${bVal})`;
          btx.fillRect(x + 3, y + 3, colW - 6, rowH - 6);
        }
      }

      // Mineral granite speckles & mossy weathering streaks
      for (let i = 0; i < 4200; i++) {
        const x = rand() * size;
        const y = rand() * size;
        const dark = rand() > 0.5;
        ctx.fillStyle = dark ? 'rgba(42,38,34,0.16)' : 'rgba(220,214,200,0.14)';
        ctx.fillRect(x, y, 2, 2);
        btx.fillStyle = dark ? 'rgba(90,90,90,0.22)' : 'rgba(245,245,245,0.18)';
        btx.fillRect(x, y, 2, 2);
      }

      // Deep recessed mortar joints
      ctx.strokeStyle = 'rgba(44, 41, 37, 0.72)';
      ctx.lineWidth = 3;
      btx.strokeStyle = '#202020';
      btx.lineWidth = 4;

      for (let r = 0; r <= rows; r++) {
        const y = r * rowH;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke();
        btx.beginPath(); btx.moveTo(0, y); btx.lineTo(size, y); btx.stroke();
        if (r < rows) {
          const cols = 4;
          const colW = size / cols;
          const offset = (r % 2) * (colW * 0.5);
          for (let c = 0; c <= cols; c++) {
            const x = (c * colW + offset) % size;
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + rowH); ctx.stroke();
            btx.beginPath(); btx.moveTo(x, y); btx.lineTo(x, y + rowH); btx.stroke();
          }
        }
      }

      const map = new THREE.CanvasTexture(cCol);
      const bumpMap = new THREE.CanvasTexture(cBump);
      [map, bumpMap].forEach((t) => {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.anisotropy = 4;
      });
      map.colorSpace = THREE.SRGBColorSpace;
      return { map, bumpMap };
    }

    function createBallastPBR(seed = 202) {
      const rand = makeSeededRandom(seed);
      const size = 256;
      const cCol = document.createElement('canvas');
      const cBump = document.createElement('canvas');
      cCol.width = cBump.width = size;
      cCol.height = cBump.height = size;
      const ctx = cCol.getContext('2d');
      const btx = cBump.getContext('2d');

      ctx.fillStyle = '#6f6c66';
      ctx.fillRect(0, 0, size, size);
      btx.fillStyle = '#555555';
      btx.fillRect(0, 0, size, size);

      for (let i = 0; i < 2400; i++) {
        const x = rand() * size;
        const y = rand() * size;
        const w = 2 + rand() * 5;
        const h = 2 + rand() * 4;
        const v = 72 + Math.floor(rand() * 88);
        ctx.fillStyle = `rgb(${v + 4},${v + 2},${v})`;
        ctx.fillRect(x, y, w, h);
        const bv = 90 + Math.floor(rand() * 165);
        btx.fillStyle = `rgb(${bv},${bv},${bv})`;
        btx.fillRect(x, y, w, h);
      }

      const map = new THREE.CanvasTexture(cCol);
      const bumpMap = new THREE.CanvasTexture(cBump);
      [map, bumpMap].forEach((t) => {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(3, 1);
      });
      map.colorSpace = THREE.SRGBColorSpace;
      return { map, bumpMap };
    }

    function createTimberPBR(baseHex = '#5d4531', seed = 303) {
      const rand = makeSeededRandom(seed);
      const size = 256;
      const cCol = document.createElement('canvas');
      const cBump = document.createElement('canvas');
      cCol.width = cBump.width = size;
      cCol.height = cBump.height = size;
      const ctx = cCol.getContext('2d');
      const btx = cBump.getContext('2d');

      ctx.fillStyle = baseHex;
      ctx.fillRect(0, 0, size, size);
      btx.fillStyle = '#888888';
      btx.fillRect(0, 0, size, size);

      // Wood grain fibers
      for (let i = 0; i < 180; i++) {
        const y = rand() * size;
        const h = 1 + rand() * 2.5;
        ctx.fillStyle = rand() > 0.5 ? 'rgba(26,16,9,0.22)' : 'rgba(180,145,105,0.12)';
        ctx.fillRect(0, y, size, h);
        btx.fillStyle = rand() > 0.5 ? 'rgba(40,40,40,0.35)' : 'rgba(210,210,210,0.25)';
        btx.fillRect(0, y, size, h);
      }

      const map = new THREE.CanvasTexture(cCol);
      const bumpMap = new THREE.CanvasTexture(cBump);
      [map, bumpMap].forEach((t) => {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
      });
      map.colorSpace = THREE.SRGBColorSpace;
      return { map, bumpMap };
    }

    function createIronPBR(seed = 404) {
      const rand = makeSeededRandom(seed);
      const size = 256;
      const cCol = document.createElement('canvas');
      const cBump = document.createElement('canvas');
      cCol.width = cBump.width = size;
      cCol.height = cBump.height = size;
      const ctx = cCol.getContext('2d');
      const btx = cBump.getContext('2d');

      ctx.fillStyle = '#383d40';
      ctx.fillRect(0, 0, size, size);
      btx.fillStyle = '#808080';
      btx.fillRect(0, 0, size, size);

      for (let i = 0; i < 1600; i++) {
        const x = rand() * size;
        const y = rand() * size;
        ctx.fillStyle = rand() > 0.5 ? 'rgba(95,102,108,0.16)' : 'rgba(20,22,24,0.20)';
        ctx.fillRect(x, y, 6, 1.5);
        btx.fillStyle = rand() > 0.5 ? 'rgba(160,160,160,0.25)' : 'rgba(60,60,60,0.25)';
        btx.fillRect(x, y, 5, 1.5);
      }

      const map = new THREE.CanvasTexture(cCol);
      const bumpMap = new THREE.CanvasTexture(cBump);
      [map, bumpMap].forEach((t) => {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
      });
      map.colorSpace = THREE.SRGBColorSpace;
      return { map, bumpMap };
    }

    // -------------------------------------------------------------------------
    // 4. SCENE, RENDERER, LIGHTING & CAMERA
    // -------------------------------------------------------------------------
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xc3d8dc);
    scene.fog = new THREE.FogExp2(0xd3ded9, 0.0052);

    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.25, 380);
    camera.position.copy(DEFAULT_CAM_POS);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.04;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(DEFAULT_CAM_TARGET);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.maxPolarAngle = Math.PI * .545;
    controls.minDistance = .85; // Allow close-up inspection of Abt rack teeth!
    controls.maxDistance = 180;
    controls.enablePan=true; controls.screenSpacePanning=true;
    controls.update();

    // Sunlit Nilgiri Hills Atmosphere
    const hemiLight = new THREE.HemisphereLight(0xeef5fa, 0x5c6855, 0.88);
    hemiLight.position.set(0, 70, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff2dc, 2.2);
    sunLight.position.set(42, 62, 36);
    sunLight.castShadow = true;
    const isMobile = window.innerWidth < 768;
    sunLight.shadow.mapSize.width = isMobile ? 1024 : 2048;
    sunLight.shadow.mapSize.height = isMobile ? 1024 : 2048;
    sunLight.shadow.camera.near = 8;
    sunLight.shadow.camera.far = 170;
    const sd = 58;
    sunLight.shadow.camera.left = -sd;
    sunLight.shadow.camera.right = sd;
    sunLight.shadow.camera.top = sd;
    sunLight.shadow.camera.bottom = -sd;
    sunLight.shadow.bias = -0.00045;
    sunLight.shadow.normalBias = 0.04;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0xcbe0ec, 0.55);
    rimLight.position.set(-48, 28, -32);
    scene.add(rimLight);

    // -------------------------------------------------------------------------
    // 5. SHARED PBR MATERIALS & WIREFRAME INSPECTOR REGISTRY
    // -------------------------------------------------------------------------
    const ashlarPBR = createAshlarPBR(101);
    const ashlarWallMap = ashlarPBR.map.clone();
    ashlarWallMap.repeat.set(3, 2);
    ashlarWallMap.needsUpdate = true;
    const ashlarWallBump = ashlarPBR.bumpMap.clone();
    ashlarWallBump.repeat.set(3, 2);
    ashlarWallBump.needsUpdate = true;

    const ballastPBR = createBallastPBR(202);
    const sleeperPBR = createTimberPBR('#4c3929', 303);
    const falseworkPBR = createTimberPBR('#9e7447', 309);
    const ironPBR = createIronPBR(404);

    // Materials registered for the CAD-style Mesh / Wireframe inspector toggle
    const inspectableMaterials = [];
    function regMat(mat) {
      inspectableMaterials.push(mat);
      return mat;
    }

    const MAT = {
      graniteAshlar: regMat(new THREE.MeshStandardMaterial({
        map: ashlarWallMap,
        bumpMap: ashlarWallBump,
        bumpScale: 0.14,
        color: 0xd6d0c6,
        roughness: 0.84,
        metalness: 0.04
      })),
      graniteBlock: regMat(new THREE.MeshStandardMaterial({
        map: ashlarPBR.map,
        bumpMap: ashlarPBR.bumpMap,
        bumpScale: 0.11,
        color: 0xded7cb,
        roughness: 0.80,
        metalness: 0.05
      })),
      graniteKeystone: regMat(new THREE.MeshStandardMaterial({
        map: ashlarPBR.map,
        bumpMap: ashlarPBR.bumpMap,
        bumpScale: 0.12,
        color: 0xede5d7,
        roughness: 0.74,
        metalness: 0.06
      })),
      graniteDark: regMat(new THREE.MeshStandardMaterial({
        map: ashlarPBR.map,
        bumpMap: ashlarPBR.bumpMap,
        bumpScale: 0.14,
        color: 0x9b958b,
        roughness: 0.88,
        metalness: 0.04
      })),
      falseworkTimber: regMat(new THREE.MeshStandardMaterial({
        map: falseworkPBR.map,
        bumpMap: falseworkPBR.bumpMap,
        bumpScale: 0.08,
        color: 0xc2935e,
        roughness: 0.82,
        metalness: 0.02
      })),
      ballast: regMat(new THREE.MeshStandardMaterial({
        map: ballastPBR.map,
        bumpMap: ballastPBR.bumpMap,
        bumpScale: 0.18,
        color: 0x9c9890,
        roughness: 0.95,
        metalness: 0.02
      })),
      sleeper: regMat(new THREE.MeshStandardMaterial({
        map: sleeperPBR.map,
        bumpMap: sleeperPBR.bumpMap,
        bumpScale: 0.09,
        color: 0x6b503b,
        roughness: 0.88,
        metalness: 0.03
      })),
      steelRail: regMat(new THREE.MeshStandardMaterial({
        map: ironPBR.map,
        bumpMap: ironPBR.bumpMap,
        bumpScale: 0.04,
        color: 0x8f989e,
        roughness: 0.34,
        metalness: 0.82
      })),
      rackSteel: regMat(new THREE.MeshStandardMaterial({
        map: ironPBR.map,
        bumpMap: ironPBR.bumpMap,
        bumpScale: 0.05,
        color: 0xb78b57,
        roughness: 0.36,
        metalness: 0.78
      })),
      castIron: regMat(new THREE.MeshStandardMaterial({
        map: ironPBR.map,
        bumpMap: ironPBR.bumpMap,
        bumpScale: 0.06,
        color: 0x3b4043,
        roughness: 0.56,
        metalness: 0.72
      })),
      locoGreen: regMat(new THREE.MeshStandardMaterial({
        map: ironPBR.map,
        bumpMap: ironPBR.bumpMap,
        bumpScale: 0.03,
        color: 0x234438,
        roughness: 0.42,
        metalness: 0.38
      })),
      locoBlack: regMat(new THREE.MeshStandardMaterial({
        map: ironPBR.map,
        bumpMap: ironPBR.bumpMap,
        bumpScale: 0.04,
        color: 0x23272a,
        roughness: 0.48,
        metalness: 0.65
      })),
      locoRed: regMat(new THREE.MeshStandardMaterial({
        color: 0x8d2b24,
        roughness: 0.46,
        metalness: 0.25
      })),
      brass: regMat(new THREE.MeshStandardMaterial({
        color: 0xd4a64c,
        roughness: 0.24,
        metalness: 0.88
      })),
      coachWood: regMat(new THREE.MeshStandardMaterial({
        map: falseworkPBR.map,
        bumpMap: falseworkPBR.bumpMap,
        bumpScale: 0.06,
        color: 0x82442c,
        roughness: 0.58,
        metalness: 0.08
      })),
      coachCream: regMat(new THREE.MeshStandardMaterial({
        color: 0xe7dec8,
        roughness: 0.64,
        metalness: 0.04
      })),
      surveyRed: new THREE.MeshStandardMaterial({ color: 0xc93b2b, roughness: 0.55 }),
      surveyWhite: new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.55 }),
      stream: new THREE.MeshStandardMaterial({
        color: 0x4b7a85,
        roughness: 0.14,
        metalness: 0.28
      }),
      foliageDark: new THREE.MeshStandardMaterial({ color: 0x2e4c36, roughness: 0.90 }),
      foliageMid: new THREE.MeshStandardMaterial({ color: 0x3e6243, roughness: 0.88 }),
      trunk: new THREE.MeshStandardMaterial({ color: 0x4b3a2c, roughness: 0.92 })
    };

    function enableShadows(obj, cast = true, receive = true) {
      obj.traverse((c) => {
        if (c.isMesh) {
          c.castShadow = cast;
          c.receiveShadow = receive;
        }
      });
      return obj;
    }

    // -------------------------------------------------------------------------
    // 6. 1-IN-12 (8.33%) S-CURVE MOUNTAIN ALIGNMENT SPLINE
    // -------------------------------------------------------------------------
    // Horizontal run ~96m (-48 to +48 along X), vertical rise ~8.0m (y = 8.4 to 16.4)
    // Authentic ~8.33% (1-in-12) mountain rack railway ruling gradient!
    const trackControlPts = [
      new THREE.Vector3(-48,  8.40,  7.5),
      new THREE.Vector3(-32,  9.73,  4.2),
      new THREE.Vector3(-16, 11.07, -1.6),
      new THREE.Vector3(  0, 12.40, -3.2),
      new THREE.Vector3( 16, 13.73, -0.4),
      new THREE.Vector3( 32, 15.07,  4.6),
      new THREE.Vector3( 48, 16.40,  7.0)
    ];
    const trackCurve = new THREE.CatmullRomCurve3(trackControlPts, false, 'centripetal', 0.5);
    const TRACK_LENGTH = trackCurve.getLength();

    // Sample lookup table for fast terrain & structural alignment queries
    const CURVE_SAMPLES = 240;
    const curveTable = [];
    for (let i = 0; i <= CURVE_SAMPLES; i++) {
      const u = i / CURVE_SAMPLES;
      const p = trackCurve.getPointAt(u);
      const t = trackCurve.getTangentAt(u).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(up, t).normalize();
      const normal = new THREE.Vector3().crossVectors(t, right).normalize();
      curveTable.push({ u, p, t, right, normal });
    }

    /**
     * Returns an upright rail-aligned basis at normalized distance u in [0, 1].
     */
    function getTrackFrame(u) {
      const cu = Math.max(0, Math.min(1, u));
      const pos = trackCurve.getPointAt(cu);
      const tan = trackCurve.getTangentAt(cu).normalize();
      const worldUp = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(worldUp, tan).normalize();
      const up = new THREE.Vector3().crossVectors(tan, right).normalize();
      return { pos, tan, right, up };
    }

    /**
     * Finds closest track curve sample in XZ plane for terrain carving.
     */
    function nearestTrackXZ(x, z) {
      let bestDistSq = Infinity;
      let best = curveTable[0];
      for (let i = 0; i < curveTable.length; i++) {
        const s = curveTable[i];
        const dx = x - s.p.x;
        const dz = z - s.p.z;
        const dSq = dx * dx + dz * dz;
        if (dSq < bestDistSq) {
          bestDistSq = dSq;
          best = s;
        }
      }
      const dx = x - best.p.x;
      const dz = z - best.p.z;
      // Signed lateral offset: negative = uphill (-Z side), positive = downhill (+Z side)
      const signedLat = dx * best.right.x + dz * best.right.z;
      return { sample: best, dist: Math.sqrt(bestDistSq), signedLat };
    }

    // -------------------------------------------------------------------------
    // 7. INVENTED NILGIRI HILLSIDE & CENTRAL RAVINE TERRAIN
    // -------------------------------------------------------------------------
    function fbmNoise(x, z) {
      return (
        Math.sin(x * 0.085 + z * 0.04) * 1.45 +
        Math.cos(x * 0.17 - z * 0.13) * 0.72 +
        Math.sin(x * 0.34 + z * 0.29) * 0.32 +
        Math.cos(x * 0.68 - z * 0.54) * 0.14
      );
    }

    const streamLevel = z => 1.65 - z * 0.055;
    const streamWidth = z => 3.25 + 0.52 * Math.sin(z * .17) + .32 * Math.cos(z * .36);
    const waterTime = {value: 0};
    function computeTerrainHeight(x, z) {
      // Base Nilgiri mountain slope: rises uphill toward -Z and climbs gradually from -X to +X
      const baseGrade = 12.4 + x * 0.0833;
      const hillSlope = -z * 0.36;
      const strata = Math.sin((baseGrade + hillSlope) * 1.35) * 0.24;
      let h = baseGrade + hillSlope + fbmNoise(x, z) * 1.15 + strata;

      // Deep central rocky ravine cutting roughly north-south across x ≈ 0
      const ravineCenterX = Math.sin(z * 0.065) * 4.5;
      const dxRavine = (x - ravineCenterX) / 17.5;
      const ravineFactor = Math.exp(-dxRavine * dxRavine * 1.65);
      // Carve deep ravine down toward stream bed (y ≈ 0.35 near z=0, sloping downhill toward +Z)
      const streamFloorY = 1.6 - z * 0.055 + Math.sin(z * 0.2) * 0.15;
      h = THREE.MathUtils.lerp(h, streamFloorY, ravineFactor * 0.94);

      // Rock-cut benching along the railway approaches (outside the central viaduct ravine)
      const { sample, dist, signedLat } = nearestTrackXZ(x, z);
      const u = sample.u;
      // Viaduct spans roughly u = 0.285 to 0.715
      const inApproach = Math.max(
        THREE.MathUtils.smoothstep(0.305 - u, 0, 0.055),
        THREE.MathUtils.smoothstep(u - 0.695, 0, 0.055)
      );

      if (inApproach > 0.001) {
        const shelfY = sample.p.y - 0.38;
        if (dist < 2.6) {
          // Flat rock-cut roadbed bench
          h = THREE.MathUtils.lerp(h, shelfY, inApproach * 0.98);
        } else if (dist < 10.5) {
          const blend = 1 - THREE.MathUtils.smoothstep(dist, 2.6, 10.5);
          // Steeper cut on uphill side (-signedLat), embankment slope on downhill side (+signedLat)
          const targetY = signedLat < 0
            ? Math.max(h, shelfY + (dist - 2.6) * 0.85)
            : Math.min(h, shelfY - (dist - 2.6) * 0.45);
          h = THREE.MathUtils.lerp(h, targetY, blend * inApproach * 0.85);
        }
      }

      const lateral = Math.abs(x - ravineCenterX);
      const width = streamWidth(z);
      const bed = streamLevel(z) - 0.7 + 1.1 * Math.pow(lateral / width, 3);
      const bankBlend = THREE.MathUtils.smoothstep(lateral, width, width + 3);
      const surface = THREE.MathUtils.lerp(bed, Math.max(-2.5, h), bankBlend);
      const corridor = 1 - THREE.MathUtils.smoothstep(dist, 2.8, 5.2);
      return THREE.MathUtils.lerp(surface,Math.min(surface,sample.p.y-.43),corridor);
    }

    function buildTerrain() {
      const group = new THREE.Group();
      const segX = 148;
      const segZ = 112;
      const geo = new THREE.PlaneGeometry(132, 104, segX, segZ);
      geo.rotateX(-Math.PI / 2);

      const pos = geo.attributes.position;
      const colors = new Float32Array(pos.count * 3);
      const cGrass = new THREE.Color(0x4e6b46);
      const cMoss = new THREE.Color(0x3f593b);
      const cRock = new THREE.Color(0x6d6960);
      const cCutRock = new THREE.Color(0x887f72);
      const cStreamBed = new THREE.Color(0x4f5650);
      const tmpColor = new THREE.Color();

      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const y = computeTerrainHeight(x, z);
        pos.setY(i, y);

        // Compute local slope approximation for realistic rock-strata coloring
        const hx = computeTerrainHeight(x + 0.8, z);
        const hz = computeTerrainHeight(x, z + 0.8);
        const slope = Math.hypot(hx - y, hz - y) / 0.8;

        const { sample, dist } = nearestTrackXZ(x, z);
        const isBench = dist < 4.5 && (sample.u < 0.30 || sample.u > 0.70);

        tmpColor.copy(cGrass).lerp(cMoss, Math.sin(x * 0.14 + z * 0.11) * 0.5 + 0.5);
        if (slope > 0.52) {
          tmpColor.lerp(cRock, Math.min(1, (slope - 0.52) * 1.45));
        }
        if (isBench) {
          tmpColor.lerp(cCutRock, 0.72);
        }
        if (y < 2.3) {
          tmpColor.lerp(cStreamBed, THREE.MathUtils.clamp((2.3 - y) * 0.6, 0, 0.85));
        }
        colors[i * 3] = tmpColor.r;
        colors[i * 3 + 1] = tmpColor.g;
        colors[i * 3 + 2] = tmpColor.b;
      }

      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geo.computeVertexNormals();

      const terrainMat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.92,
        metalness: 0.02
      });
      const terrainMesh = new THREE.Mesh(geo, terrainMat);
      terrainMesh.receiveShadow = true;
      terrainMesh.castShadow = true;
      group.add(terrainMesh);

      // Winding mountain stream at the ravine bottom
      const positions = [], texcoords = [], indices = [];
      for (let row = 0; row <= 208; row++) {
        const z = -52 + row / 2;
        for (let col = 0; col <= 8; col++) {
          const side = col / 4 - 1;
          positions.push(Math.sin(z*.065)*4.5 + side*streamWidth(z), streamLevel(z), z);
          texcoords.push(side, z);
          if (row && col) {
            const i = row*9 + col;
            indices.push(i-10,i-1,i,i-10,i,i-9);
          }
        }
      }
      const waterGeo = new THREE.BufferGeometry();
      waterGeo.setIndex(indices);
      waterGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions,3));
      waterGeo.setAttribute('uv', new THREE.Float32BufferAttribute(texcoords,2));
      const water = new THREE.ShaderMaterial({
        uniforms: { time: waterTime }, side: THREE.DoubleSide,
        vertexShader: `varying vec2 river; void main(){
          river=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
        }`,
        fragmentShader: `uniform float time; varying vec2 river;
          void main(){
            float x=river.x, z=river.y, t=time;
            float adv=z-t*(1.35-.46*x*x);
            float bend=sin(adv*.78+x*5.)+.45*sin(adv*1.7-x*12.);
            float ripple=sin(adv*4.+bend*2.+x*8.);
            float foam=smoothstep(.84,1.,ripple)*smoothstep(.23,1.35,bend);
            float shoal=smoothstep(.24,.96,abs(x));
            vec3 color=mix(vec3(.043,.23,.25),vec3(.20,.40,.36),shoal);
            color+=vec3(.055,.085,.083)*(.5+.5*ripple);
            color=mix(color,vec3(.77,.88,.81),foam*.70);
            gl_FragColor=vec4(color,1.);
            #include <colorspace_fragment>
          }`
      });
      group.add(new THREE.Mesh(waterGeo,water));

      // Instanced Nilgiri hill trees (shola pines / eucalyptus clusters) placed safely clear of track & ravine stream
      const rand = makeSeededRandom(888);
      const treePositions = [];
      for (let i = 0; i < 140; i++) {
        const tx = (rand() - 0.5) * 116;
        const tz = (rand() - 0.5) * 88;
        const { dist } = nearestTrackXZ(tx, tz);
        const ravineCenterX = Math.sin(tz * 0.065) * 4.5;
        if (dist < 6.8) continue; // Keep track corridor clear
        if (Math.abs(tx - ravineCenterX) < 4.8) continue; // Keep stream bed clear
        const ty = computeTerrainHeight(tx, tz);
        if (ty < 2.6) continue;
        treePositions.push({ x: tx, y: ty, z: tz, s: 0.72 + rand() * 0.78 });
      }

      const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.11,.20,2.7,7),MAT.trunk,treePositions.length);
      const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),
        new THREE.MeshStandardMaterial({roughness:.96}),treePositions.length*6);
      const twig = new THREE.Object3D(), shade = new THREE.Color();
      treePositions.forEach(({x,y,z,s},i)=>{
        twig.position.set(x,y+1.24*s,z);
        twig.rotation.set(.09*(rand()-.5),rand()*6,.14*(rand()-.5));
        twig.scale.setScalar(s); twig.updateMatrix(); trunks.setMatrixAt(i,twig.matrix);
        const hue=.23+rand()*.085, spread=.9+rand()*.55, angle=rand()*6;
        for(let j=0;j<6;j++){
          const a=angle+j*2.4, r=j===5?0:(.48+.37*rand())*spread;
          twig.position.set(x+s*r*Math.cos(a),y+s*(2.35+(j===5?.88:rand()*.5)),z+s*r*Math.sin(a));
          twig.rotation.set(rand()*.45,a,rand()*.45);
          twig.scale.set(s*spread*(.7+.45*rand()),s*(.66+.48*rand()),s*spread*(.7+.4*rand()));
          twig.updateMatrix(); crowns.setMatrixAt(i*6+j,twig.matrix);
          crowns.setColorAt(i*6+j,shade.setHSL(hue,.20+rand()*.1,.12+rand()*.08+(j===5?.035:0)));
        }
      });
      for(const mesh of [trunks,crowns]){mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}
      return group;
    }

    scene.add(buildTerrain());

    // -------------------------------------------------------------------------
    // 8. STAGE 1: SURVEY STAKES & ROCK-CUT BENCHING FOOTINGS
    // -------------------------------------------------------------------------
    const surveyGroup = new THREE.Group();
    const stakeGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.35, 8);
    const bandGeo = new THREE.CylinderGeometry(0.056, 0.056, 0.28, 8);

    for (let i = 0; i <= 26; i++) {
      const u = 0.04 + (i / 26) * 0.92;
      const f = getTrackFrame(u);
      const isRavine = u > 0.29 && u < 0.71;
      for (const side of [-1, 1]) {
        const sx = f.pos.x + f.right.x * side * 2.15;
        const sz = f.pos.z + f.right.z * side * 2.15;
        const sy = isRavine ? computeTerrainHeight(sx, sz) : f.pos.y - 0.35;
        const pole = new THREE.Mesh(stakeGeo, MAT.surveyWhite);
        pole.position.set(sx, sy + 0.65, sz);
        const band = new THREE.Mesh(bandGeo, MAT.surveyRed);
        band.position.set(sx, sy + 1.12, sz);
        surveyGroup.add(pole, band);
      }
    }
    enableShadows(surveyGroup);
    scene.add(surveyGroup);

    // -------------------------------------------------------------------------
    // 9. STAGE 2: TERRACED GRANITE RETAINING WALLS & 3 TAPERED VIADUCT PIERS
    // -------------------------------------------------------------------------
    // Viaduct spans 4 arches between West Abutment (u=0.29), Pier 1 (u=0.395), Pier 2 (u=0.50), Pier 3 (u=0.605), East Abutment (u=0.71)
    const PIER_US = [0.29, 0.395, 0.50, 0.605, 0.71]; // 0 and 4 are abutments, 1..3 are tall ravine piers

    function buildRetainingWalls() {
      const group = new THREE.Group();
      // Build terraced dressed-granite retaining walls along both hillside approaches (uphill cut wall + downhill embankment wall)
      const approachRanges = [
        { uStart: 0.02, uEnd: 0.29, segs: 16 },
        { uStart: 0.71, uEnd: 0.98, segs: 16 }
      ];

      for (const range of approachRanges) {
        for (let i = 0; i < range.segs; i++) {
          const u0 = THREE.MathUtils.lerp(range.uStart, range.uEnd, i / range.segs);
          const u1 = THREE.MathUtils.lerp(range.uStart, range.uEnd, (i + 1) / range.segs);
          const um = (u0 + u1) * 0.5;
          const f0 = getTrackFrame(u0);
          const f1 = getTrackFrame(u1);
          const fm = getTrackFrame(um);
          const segLen = f0.pos.distanceTo(f1.pos) + 0.14;
          const yaw = Math.atan2(fm.tan.x, fm.tan.z);

          // Uphill retaining wall (-right) with battered face & dark drainage weep holes
          const upWallH = 2.6;
          const upPos = fm.pos.clone().addScaledVector(fm.right, -2.55);
          const upWall = new THREE.Mesh(new THREE.BoxGeometry(0.95, upWallH, segLen), MAT.graniteAshlar);
          upWall.position.set(upPos.x, fm.pos.y + upWallH * 0.32, upPos.z);
          upWall.rotation.y = yaw;
          group.add(upWall);

          // Coping stone on uphill wall
          const upCope = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.22, segLen + 0.04), MAT.graniteKeystone);
          upCope.position.set(upPos.x, fm.pos.y + upWallH * 0.82, upPos.z);
          upCope.rotation.y = yaw;
          group.add(upCope);

          // Recessed weep hole shadow pocket
          if (i % 2 === 0) {
            const weep = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.22, 0.22), MAT.castIron);
            weep.position.set(upPos.x, fm.pos.y + 0.12, upPos.z);
            weep.rotation.y = yaw;
            group.add(weep);
          }

          // Downhill embankment retaining wall (+right)
          const dnPos = fm.pos.clone().addScaledVector(fm.right, 2.35);
          const dnGroundY = computeTerrainHeight(dnPos.x, dnPos.z);
          const dnTopY = fm.pos.y - 0.28;
          const dnWallH = Math.max(1.4, dnTopY - dnGroundY + 1.2);
          const dnWall = new THREE.Mesh(new THREE.BoxGeometry(1.15, dnWallH, segLen), MAT.graniteDark);
          dnWall.position.set(dnPos.x, dnTopY - dnWallH * 0.5, dnPos.z);
          dnWall.rotation.y = yaw;
          group.add(dnWall);
        }
      }
      return enableShadows(group);
    }

    const retainingWallsGroup = buildRetainingWalls();
    scene.add(retainingWallsGroup);

    /**
     * Builds a detailed tapered granite masonry pier with stepped plinth footings,
     * triangular cutwater pilasters facing upstream/downstream, and protruding stone belt courses.
     */
    function createMasonryPier(u, isAbutment = false) {
      const f = getTrackFrame(u);
      const group = new THREE.Group();
      group.position.set(f.pos.x, 0, f.pos.z);
      // Orient local +Z along track tangent, local +X along track right (transverse width of bridge)
      const yaw = Math.atan2(f.tan.x, f.tan.z);
      group.rotation.y = yaw;

      const groundY = Math.min(computeTerrainHeight(f.pos.x, f.pos.z) - 1.2, f.pos.y - 6.95);
      const springY = f.pos.y - 3.65; // Springing line of the arches
      const pierH = Math.max(2.6, springY - groundY);

      const widthX = isAbutment ? 4.4 : 4.1; // Transverse across bridge
      const thickZ = isAbutment ? 3.2 : 1.95; // Longitudinal along bridge

      // Stepped foundation plinth courses
      const foot1 = new THREE.Mesh(new THREE.BoxGeometry(widthX + 1.3, 1.1, thickZ + 1.1), MAT.graniteDark);
      foot1.position.y = groundY + 0.55;
      group.add(foot1);

      const foot2 = new THREE.Mesh(new THREE.BoxGeometry(widthX + 0.7, 0.9, thickZ + 0.6), MAT.graniteAshlar);
      foot2.position.y = groundY + 1.5;
      group.add(foot2);

      // Tapered main pier shaft (custom extruded/tapered 8-vertex frustum via CylinderGeometry(r, r, h, 4))
      const shaftH = Math.max(1.2, pierH - 1.9);
      const shaftGeo = new THREE.BoxGeometry(widthX, shaftH, thickZ);
      // Taper upper vertices inward slightly for authentic masonry batter
      const sp = shaftGeo.attributes.position;
      for (let i = 0; i < sp.count; i++) {
        if (sp.getY(i) > 0) {
          sp.setX(i, sp.getX(i) * 0.88);
          sp.setZ(i, sp.getZ(i) * 0.86);
        }
      }
      shaftGeo.computeVertexNormals();
      const shaft = new THREE.Mesh(shaftGeo, MAT.graniteAshlar);
      shaft.position.y = groundY + 1.9 + shaftH * 0.5;
      group.add(shaft);

      // Triangular pointed cutwater pilasters on upstream (-X) and downstream (+X) faces for ravine piers
      if (!isAbutment) {
        const cutH = Math.min(shaftH * 0.68, 5.2);
        const cutGeo = new THREE.CylinderGeometry(0.02, 0.72, cutH, 3);
        for (const side of [-1, 1]) {
          const cutBody = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.76, cutH, 3), MAT.graniteBlock);
          cutBody.position.set(side * (widthX * 0.46), groundY + 1.9 + cutH * 0.5, 0);
          cutBody.rotation.y = side > 0 ? Math.PI / 6 : -Math.PI / 6;
          group.add(cutBody);

          // Pyramid cap on cutwater
          const cutCap = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.65, 3), MAT.graniteKeystone);
          cutCap.position.set(side * (widthX * 0.46), groundY + 1.9 + cutH + 0.32, 0);
          cutCap.rotation.y = side > 0 ? Math.PI / 6 : -Math.PI / 6;
          group.add(cutCap);
        }
      }

      // Belt course / impost molding at the arch springing line
      const impost = new THREE.Mesh(
        new THREE.BoxGeometry(widthX * 0.96, 0.44, thickZ * 0.98),
        MAT.graniteKeystone
      );
      impost.position.y = springY - 0.18;
      group.add(impost);

      // Mid-height stone belt course on tall piers
      if (shaftH > 5.0) {
        const belt = new THREE.Mesh(
          new THREE.BoxGeometry(widthX * 0.98, 0.30, thickZ * 0.98),
          MAT.graniteKeystone
        );
        belt.position.y = groundY + 1.9 + shaftH * 0.52;
        group.add(belt);
      }

      return { group: enableShadows(group), groundY, springY };
    }

    const piersData = PIER_US.map((u, idx) => createMasonryPier(u, idx === 0 || idx === PIER_US.length - 1));
    piersData.forEach((p) => scene.add(p.group));

    // -------------------------------------------------------------------------
    // 10. STAGE 3: TEMPORARY TIMBER FALSEWORK (CENTERING) + RADIAL VOUSSOIR ARCHES
    // -------------------------------------------------------------------------
    // Build 4 curved-span arches connecting PIER_US[i] to PIER_US[i+1]
    const ARCH_SPANS = [];
    for (let s = 0; s < PIER_US.length - 1; s++) {
      const uA = PIER_US[s];
      const uB = PIER_US[s + 1];
      const fA = getTrackFrame(uA);
      const fB = getTrackFrame(uB);
      const uMid = (uA + uB) * 0.5;
      const fMid = getTrackFrame(uMid);

      const springA = new THREE.Vector3(fA.pos.x, fA.pos.y - 3.65, fA.pos.z);
      const springB = new THREE.Vector3(fB.pos.x, fB.pos.y - 3.65, fB.pos.z);
      const spanVec = new THREE.Vector3().subVectors(springB, springA);
      const spanDist = spanVec.length();
      const midPt = new THREE.Vector3().addVectors(springA, springB).multiplyScalar(0.5);
      const clearSpan = spanDist - 1.85; // Subtract pier half-thicknesses
      const archRadius = clearSpan * 0.5;
      const archRise = Math.min(2.75, archRadius * 0.72);
      const yaw = Math.atan2(spanVec.x, spanVec.z);

      ARCH_SPANS.push({ uA, uB, uMid, fMid, springA, springB, midPt, clearSpan, archRadius, archRise, yaw });
    }

    // --- 10A. Temporary Timber Falsework (Centering Trusses + Vertical Trestle Bents) ---
    const falseworkGroup = new THREE.Group();
    ARCH_SPANS.forEach((span) => {
      const spanWrap = new THREE.Group();
      spanWrap.position.copy(span.midPt);
      spanWrap.rotation.y = span.yaw;

      const groundY = computeTerrainHeight(span.midPt.x, span.midPt.z) - 0.5;
      const dropH = Math.max(1.5, span.midPt.y - groundY);

      // Two parallel timber centering frames spaced transversely across the arch soffit
      for (const xOff of [-1.25, 0, 1.25]) {
        // Horizontal tie beam at springing line
        const tieBeam = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, 0.24, span.clearSpan + 0.1),
          MAT.falseworkTimber
        );
        tieBeam.position.set(xOff, -0.1, 0);
        spanWrap.add(tieBeam);

        // Arched wooden ribs & radial king/queen struts supporting the masonry soffit
        const ribSegs = 10;
        for (let r = 0; r < ribSegs; r++) {
          const a0 = (r / ribSegs) * Math.PI;
          const a1 = ((r + 1) / ribSegs) * Math.PI;
          const z0 = -Math.cos(a0) * (span.archRadius - 0.12);
          const y0 = Math.sin(a0) * (span.archRise - 0.12);
          const z1 = -Math.cos(a1) * (span.archRadius - 0.12);
          const y1 = Math.sin(a1) * (span.archRise - 0.12);
          const segLen = Math.hypot(z1 - z0, y1 - y0);
          const rib = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, segLen + 0.06), MAT.falseworkTimber);
          rib.position.set(xOff, (y0 + y1) * 0.5, (z0 + z1) * 0.5);
          rib.rotation.x = -Math.atan2(y1 - y0, z1 - z0);
          spanWrap.add(rib);

          // Radial strut from tie-beam center to arch rib
          if (r > 0 && r < ribSegs && r % 2 === 0) {
            const strutLen = Math.hypot(z0, y0);
            const strut = new THREE.Mesh(new THREE.BoxGeometry(0.12, strutLen, 0.12), MAT.falseworkTimber);
            strut.position.set(xOff, y0 * 0.5, z0 * 0.5);
            strut.rotation.x = Math.atan2(z0, y0);
            spanWrap.add(strut);
          }
        }
      }

      // Timber lagging planks across the arch extrados (supporting the voussoir stones)
      for (let p = 1; p < 12; p++) {
        const ang = (p / 12) * Math.PI;
        const pz = -Math.cos(ang) * (span.archRadius - 0.04);
        const py = Math.sin(ang) * (span.archRise - 0.04);
        const plank = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.09, 0.24), MAT.falseworkTimber);
        plank.position.set(0, py, pz);
        plank.rotation.x = ang - Math.PI / 2;
        spanWrap.add(plank);
      }

      // Vertical timber trestle bents & diagonal X-bracing down to ravine floor
      for (const zPost of [-span.archRadius * 0.45, span.archRadius * 0.45]) {
        for (const xPost of [-1.25, 1.25]) {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, dropH, 0.18), MAT.falseworkTimber);
          post.position.set(xPost, -dropH * 0.5 - 0.1, zPost);
          spanWrap.add(post);
        }
        // Horizontal ledger & diagonal cross-brace between left/right trestle posts
        const levels = Math.max(1, Math.floor(dropH / 3.2));
        for (let lv = 0; lv < levels; lv++) {
          const yLv = -1.6 - lv * 3.0;
          if (yLv < -dropH + 0.5) break;
          const ledger = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.14, 0.14), MAT.falseworkTimber);
          ledger.position.set(0, yLv, zPost);
          spanWrap.add(ledger);

          const diag = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.11, 0.11), MAT.falseworkTimber);
          diag.position.set(0, yLv + 1.3, zPost);
          diag.rotation.z = (lv % 2 === 0 ? 1 : -1) * 0.72;
          spanWrap.add(diag);
        }
      }

      falseworkGroup.add(spanWrap);
    });
    enableShadows(falseworkGroup);
    scene.add(falseworkGroup);

    // --- 10B. InstancedMesh Radial Voussoir Arch Stones + Protruding Keystones ---
    // Ordered symmetrically from BOTH haunches upward toward the keystone so scrubbing shows real masonry assembly!
    const VOUSSOIRS_PER_ARCH = 19; // Odd number so center index = keystone
    const totalVoussoirs = ARCH_SPANS.length * (VOUSSOIRS_PER_ARCH - 1);
    const voussoirGeo = new THREE.BoxGeometry(3.52, 0.74, 0.56);
    const voussoirInst = new THREE.InstancedMesh(voussoirGeo, MAT.graniteBlock, totalVoussoirs);
    voussoirInst.castShadow = true;
    voussoirInst.receiveShadow = true;

    const keystoneGeo = new THREE.BoxGeometry(3.84, 0.96, 0.68);
    const keystoneInst = new THREE.InstancedMesh(keystoneGeo, MAT.graniteKeystone, ARCH_SPANS.length);
    keystoneInst.castShadow = true;
    keystoneInst.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const voussoirMatrices = [];
    const keystoneMatrices = [];

    // Build layer-by-layer symmetrically from haunches up across all 4 arches simultaneously
    const halfCount = (VOUSSOIRS_PER_ARCH - 1) / 2;
    for (let step = 0; step < halfCount; step++) {
      for (const span of ARCH_SPANS) {
        const quatYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), span.yaw);
        for (const side of [step, VOUSSOIRS_PER_ARCH - 1 - step]) {
          const ang = ((side + 0.5) / VOUSSOIRS_PER_ARCH) * Math.PI;
          const lz = -Math.cos(ang) * (span.archRadius + 0.28);
          const ly = Math.sin(ang) * (span.archRise + 0.28);
          const localPos = new THREE.Vector3(0, ly, lz).applyQuaternion(quatYaw).add(span.midPt);

          dummy.position.copy(localPos);
          dummy.rotation.set(0, span.yaw, 0);
          dummy.rotateX(ang - Math.PI / 2);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          voussoirMatrices.push(dummy.matrix.clone());
        }
      }
    }

    // Keystones at crown (angle = PI / 2)
    ARCH_SPANS.forEach((span) => {
      dummy.position.set(span.midPt.x, span.midPt.y + span.archRise + 0.34, span.midPt.z);
      dummy.rotation.set(0, span.yaw, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      keystoneMatrices.push(dummy.matrix.clone());
    });

    voussoirMatrices.forEach((m, i) => voussoirInst.setMatrixAt(i, m));
    keystoneMatrices.forEach((m, i) => keystoneInst.setMatrixAt(i, m));
    voussoirInst.instanceMatrix.needsUpdate = true;
    keystoneInst.instanceMatrix.needsUpdate = true;
    scene.add(voussoirInst, keystoneInst);

    // -------------------------------------------------------------------------
    // 11. STAGE 4: SPANDREL WALLS, CORNICE COPING, PARAPETS WITH REFUGE BAYS & BALLAST
    // -------------------------------------------------------------------------
    function buildViaductSuperstructure() {
      const group = new THREE.Group();

      // Spandrel masonry infill panels & bridge deck slab following the curved 1-in-12 viaduct
      const spandrelSteps = 38;
      for (let i = 0; i < spandrelSteps; i++) {
        const u0 = THREE.MathUtils.lerp(0.285, 0.715, i / spandrelSteps);
        const u1 = THREE.MathUtils.lerp(0.285, 0.715, (i + 1) / spandrelSteps);
        const um = (u0 + u1) * 0.5;
        const f0 = getTrackFrame(u0);
        const f1 = getTrackFrame(u1);
        const fm = getTrackFrame(um);
        const segLen = f0.pos.distanceTo(f1.pos) + 0.12;
        const yaw = Math.atan2(fm.tan.x, fm.tan.z);
        const pitch = -Math.asin(fm.tan.y);

        // Compute how far down the spandrel wall drops to meet the arch ring
        let archCrownDrop = 0.65;
        for (const span of ARCH_SPANS) {
          if (um >= span.uA && um <= span.uB) {
            const localT = (um - span.uA) / (span.uB - span.uA);
            const ang = localT * Math.PI;
            const archY = span.midPt.y + Math.sin(ang) * span.archRise;
            archCrownDrop = Math.max(0.55, (fm.pos.y - 0.35) - archY);
            break;
          }
        }

        const spandrel = new THREE.Mesh(
          new THREE.BoxGeometry(3.45, archCrownDrop, segLen),
          MAT.graniteAshlar
        );
        spandrel.position.set(fm.pos.x, fm.pos.y - 0.35 - archCrownDrop * 0.5, fm.pos.z);
        spandrel.rotation.order = 'YXZ';
        spandrel.rotation.y = yaw;
        spandrel.rotation.x = pitch;
        group.add(spandrel);

        // Protruding corbelled stone cornice coping course
        const cornice = new THREE.Mesh(
          new THREE.BoxGeometry(4.06, 0.28, segLen + 0.04),
          MAT.graniteKeystone
        );
        cornice.position.set(fm.pos.x, fm.pos.y - 0.34, fm.pos.z);
        cornice.rotation.order = 'YXZ';
        cornice.rotation.y = yaw;
        cornice.rotation.x = pitch;
        group.add(cornice);

        // Low granite stone parapets on both sides of the viaduct deck
        for (const side of [-1, 1]) {
          const pPos = fm.pos.clone().addScaledVector(fm.right, side * 1.82);
          const parapet = new THREE.Mesh(
            new THREE.BoxGeometry(0.32, 0.88, segLen + 0.03),
            MAT.graniteBlock
          );
          parapet.position.set(pPos.x, fm.pos.y + 0.22, pPos.z);
          parapet.rotation.order = 'YXZ';
          parapet.rotation.y = yaw;
          parapet.rotation.x = pitch;
          group.add(parapet);

          // Chamfered coping cap on parapet
          const cap = new THREE.Mesh(
            new THREE.BoxGeometry(0.40, 0.14, segLen + 0.05),
            MAT.graniteKeystone
          );
          cap.position.set(pPos.x, fm.pos.y + 0.69, pPos.z);
          cap.rotation.order = 'YXZ';
          cap.rotation.y = yaw;
          cap.rotation.x = pitch;
          group.add(cap);
        }
      }

      // Cantilevered stone refuge bays above the 3 ravine piers (authentic safety alcoves for trackmen)
      for (let p = 1; p <= 3; p++) {
        const f = getTrackFrame(PIER_US[p]);
        const yaw = Math.atan2(f.tan.x, f.tan.z);
        for (const side of [-1, 1]) {
          const bay = new THREE.Group();
          const bPos = f.pos.clone().addScaledVector(f.right, side * 2.18);
          bay.position.set(bPos.x, f.pos.y - 0.18, bPos.z);
          bay.rotation.y = yaw;

          const floor = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.36, 1.85), MAT.graniteKeystone);
          bay.add(floor);
          const outerWall = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.96, 1.85), MAT.graniteBlock);
          outerWall.position.set(side * 0.30, 0.48, 0);
          bay.add(outerWall);
          for (const endZ of [-0.82, 0.82]) {
            const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.96, 0.22), MAT.graniteBlock);
            sideWall.position.set(0, 0.48, endZ);
            bay.add(sideWall);
          }
          group.add(bay);
        }
      }

      return enableShadows(group);
    }

    const superstructureGroup = buildViaductSuperstructure();
    scene.add(superstructureGroup);

    // --- Crushed Granite Ballast Bed (Instanced sloped-trapezoid prism segments along entire spline) ---
    const BALLAST_SEGS = 130;
    const ballastShape = new THREE.Shape();
    ballastShape.moveTo(-1.42, 0);
    ballastShape.lineTo(1.42, 0);
    ballastShape.lineTo(1.06, 0.26);
    ballastShape.lineTo(-1.06, 0.26);
    ballastShape.closePath();

    const segLenBallast = (TRACK_LENGTH / BALLAST_SEGS) + 0.14;
    const ballastGeo = new THREE.ExtrudeGeometry(ballastShape, {
      depth: segLenBallast,
      bevelEnabled: false
    });
    ballastGeo.translate(0, 0, -segLenBallast * 0.5);

    const ballastInst = new THREE.InstancedMesh(ballastGeo, MAT.ballast, BALLAST_SEGS);
    ballastInst.receiveShadow = true;
    ballastInst.castShadow = true;

    for (let i = 0; i < BALLAST_SEGS; i++) {
      const u = (i + 0.5) / BALLAST_SEGS;
      const f = getTrackFrame(u);
      const m = new THREE.Matrix4().makeBasis(f.right, f.up, f.tan);
      m.setPosition(f.pos.clone().addScaledVector(f.up, -0.24));
      ballastInst.setMatrixAt(i, m);
    }
    ballastInst.instanceMatrix.needsUpdate = true;
    scene.add(ballastInst);

    // -------------------------------------------------------------------------
    // 12. STAGE 5: METRE-GAUGE SLEEPERS, RAIL CHAIRS, FLANGED RAILS & ABT RACK
    // -------------------------------------------------------------------------
    const GAUGE = 1.0; // Metre gauge (1.0m)
    const HALF_GAUGE = GAUGE * 0.5;

    // 12A. Closely-spaced timber sleepers + cast-iron rail chairs (InstancedMesh)
    const SLEEPER_COUNT = 165;
    const sleeperGeo = new THREE.BoxGeometry(1.88, 0.12, 0.22);
    const sleeperInst = new THREE.InstancedMesh(sleeperGeo, MAT.sleeper, SLEEPER_COUNT);
    sleeperInst.castShadow = true;
    sleeperInst.receiveShadow = true;

    const chairGeo = new THREE.BoxGeometry(0.18, 0.08, 0.16);
    const chairInst = new THREE.InstancedMesh(chairGeo, MAT.castIron, SLEEPER_COUNT * 3); // Left rail, right rail, center rack chair
    chairInst.castShadow = true;

    for (let i = 0; i < SLEEPER_COUNT; i++) {
      const u = 0.008 + (i / (SLEEPER_COUNT - 1)) * 0.984;
      const f = getTrackFrame(u);
      const basis = new THREE.Matrix4().makeBasis(f.right, f.up, f.tan);

      const sMat = basis.clone();
      sMat.setPosition(f.pos.clone().addScaledVector(f.up, 0.04));
      sleeperInst.setMatrixAt(i, sMat);

      // Left, Right & Center Abt rack cast-iron chairs
      const offsets = [-HALF_GAUGE, HALF_GAUGE, 0];
      offsets.forEach((lat, oi) => {
        const cMat = basis.clone();
        cMat.setPosition(
          f.pos.clone()
            .addScaledVector(f.right, lat)
            .addScaledVector(f.up, 0.115)
        );
        chairInst.setMatrixAt(i * 3 + oi, cMat);
      });
    }
    sleeperInst.instanceMatrix.needsUpdate = true;
    chairInst.instanceMatrix.needsUpdate = true;
    scene.add(sleeperInst, chairInst);

    // 12B. Flanged I-Profile Steel Running Rails (Instanced segments for crisp progressive laying)
    const RAIL_SEGS = 140;
    const railSegLen = (TRACK_LENGTH / RAIL_SEGS) + 0.08;
    const railProfile = new THREE.Shape();
    railProfile.moveTo(-0.055, 0);
    railProfile.lineTo(0.055, 0);
    railProfile.lineTo(0.055, 0.025);
    railProfile.lineTo(0.018, 0.035);
    railProfile.lineTo(0.018, 0.105);
    railProfile.lineTo(0.042, 0.118);
    railProfile.lineTo(0.042, 0.148);
    railProfile.lineTo(-0.042, 0.148);
    railProfile.lineTo(-0.042, 0.118);
    railProfile.lineTo(-0.018, 0.105);
    railProfile.lineTo(-0.018, 0.035);
    railProfile.lineTo(-0.055, 0.025);
    railProfile.closePath();

    const railGeo = new THREE.ExtrudeGeometry(railProfile, {
      depth: railSegLen,
      bevelEnabled: false
    });
    railGeo.translate(0, 0, -railSegLen * 0.5);

    const railInst = new THREE.InstancedMesh(railGeo, MAT.steelRail, RAIL_SEGS * 2);
    railInst.castShadow = true;

    for (let i = 0; i < RAIL_SEGS; i++) {
      const u = (i + 0.5) / RAIL_SEGS;
      const f = getTrackFrame(u);
      const basis = new THREE.Matrix4().makeBasis(f.right, f.up, f.tan);

      for (let sideIdx = 0; sideIdx < 2; sideIdx++) {
        const lat = sideIdx === 0 ? -HALF_GAUGE : HALF_GAUGE;
        const rMat = basis.clone();
        rMat.setPosition(
          f.pos.clone()
            .addScaledVector(f.right, lat)
            .addScaledVector(f.up, 0.125)
        );
        railInst.setMatrixAt(i * 2 + sideIdx, rMat);
      }
    }
    railInst.instanceMatrix.needsUpdate = true;
    scene.add(railInst);

    // 12C. Signature ABT RACK-AND-PINION SYSTEM:
    // Two parallel steel rack bars down the center with STAGGERED (180° out-of-phase) toothed cogs!
    const RACK_BAR_SEGS = 140;
    const rackBarGeo = new THREE.BoxGeometry(0.036, 0.095, railSegLen);
    const rackBarInst = new THREE.InstancedMesh(rackBarGeo, MAT.rackSteel, RACK_BAR_SEGS * 2);
    rackBarInst.castShadow = true;

    for (let i = 0; i < RACK_BAR_SEGS; i++) {
      const u = (i + 0.5) / RACK_BAR_SEGS;
      const f = getTrackFrame(u);
      const basis = new THREE.Matrix4().makeBasis(f.right, f.up, f.tan);
      for (let b = 0; b < 2; b++) {
        const lat = b === 0 ? -0.055 : 0.055;
        const mat = basis.clone();
        mat.setPosition(
          f.pos.clone()
            .addScaledVector(f.right, lat)
            .addScaledVector(f.up, 0.17)
        );
        rackBarInst.setMatrixAt(i * 2 + b, mat);
      }
    }
    rackBarInst.instanceMatrix.needsUpdate = true;
    scene.add(rackBarInst);

    // Trapezoidal rack tooth geometry (crisp & inspectable when zoomed in)
    const toothShape = new THREE.Shape();
    toothShape.moveTo(-0.052, 0);
    toothShape.lineTo(0.052, 0);
    toothShape.lineTo(0.030, 0.072);
    toothShape.lineTo(-0.030, 0.072);
    toothShape.closePath();
    const toothGeo = new THREE.ExtrudeGeometry(toothShape, { depth: 0.034, bevelEnabled: false });
    toothGeo.translate(0, 0, -0.017);
    toothGeo.rotateY(Math.PI / 2); // Orient tooth profile along track tangent (+Z)

    const RACK_PITCH = 0.22; // 22cm pitch for crisp visibility in 3D
    const TEETH_PER_BAR = Math.floor(TRACK_LENGTH / RACK_PITCH);
    const rackToothInst = new THREE.InstancedMesh(toothGeo, MAT.rackSteel, TEETH_PER_BAR * 2);
    rackToothInst.castShadow = true;

    for (let i = 0; i < TEETH_PER_BAR; i++) {
      // Bar 0 (left) at phase 0.0; Bar 1 (right) STAGGERED by half-pitch (0.5)
      for (let b = 0; b < 2; b++) {
        const u = Math.min(0.998, ((i + (b === 1 ? 0.5 : 0.0)) * RACK_PITCH) / TRACK_LENGTH);
        const f = getTrackFrame(u);
        const basis = new THREE.Matrix4().makeBasis(f.right, f.up, f.tan);
        const lat = b === 0 ? -0.055 : 0.055;
        const tMat = basis.clone();
        tMat.setPosition(
          f.pos.clone()
            .addScaledVector(f.right, lat)
            .addScaledVector(f.up, 0.215)
        );
        rackToothInst.setMatrixAt(i * 2 + b, tMat);
      }
    }
    rackToothInst.instanceMatrix.needsUpdate = true;
    scene.add(rackToothInst);

    // -------------------------------------------------------------------------
    // 13. STAGE 6: UNBRANDED PERIOD STEAM RACK TANK LOCOMOTIVE & VINTAGE COACH
    // -------------------------------------------------------------------------
    const animatedWheels = [];
    const animatedRods = [];
    let pinionGearMesh = null;
    let stackEmitterLocal = new THREE.Vector3(0, 3.05, 1.75);

    /**
     * Builds an original, unbranded 19th-century Swiss-inspired rack tank steam locomotive.
     * Local origin sits on railhead level (y=0), facing uphill along +Z.
     */
    function createRackLocomotive() {
      const loco = new THREE.Group();

      // Main steel chassis frame & red buffer beams
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.34, 5.15), MAT.locoBlack);
      chassis.position.set(0, 0.56, 0);
      loco.add(chassis);

      for (const bz of [-2.62, 2.62]) {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.32, 0.16), MAT.locoRed);
        beam.position.set(0, 0.58, bz);
        loco.add(beam);

        // Dual spring buffers + center coupler hook
        for (const bx of [-0.52, 0.52]) {
          const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.24, 10), MAT.castIron);
          shank.rotation.x = Math.PI / 2;
          shank.position.set(bx, 0.58, bz + (bz > 0 ? 0.14 : -0.14));
          loco.add(shank);
          const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 12), MAT.steelRail);
          plate.rotation.x = Math.PI / 2;
          plate.position.set(bx, 0.58, bz + (bz > 0 ? 0.26 : -0.26));
          loco.add(plate);
        }
      }

      // Riveted cylindrical boiler (tilted slightly to keep water level on steep Nilgiri incline!)
      const boilerGroup = new THREE.Group();
      boilerGroup.position.set(0, 1.48, 0.65);

      const boiler = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 2.75, 24), MAT.locoBlack);
      boiler.rotation.x = Math.PI / 2;
      boilerGroup.add(boiler);

      // Smokebox door with central locking dart
      const smokeDoor = new THREE.Mesh(new THREE.SphereGeometry(0.54, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.38), MAT.locoBlack);
      smokeDoor.rotation.x = Math.PI / 2;
      smokeDoor.position.set(0, 0, 1.32);
      boilerGroup.add(smokeDoor);

      // Brass boiler bands
      for (const zBand of [-0.95, -0.32, 0.32, 0.92]) {
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.568, 0.02, 8, 28), MAT.brass);
        band.position.set(0, 0, zBand);
        boilerGroup.add(band);
      }

      // Tall flared smokestack with spark-arrestor rim
      const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.14, 1.12, 16), MAT.locoBlack);
      stack.position.set(0, 0.92, 1.05);
      boilerGroup.add(stack);
      const stackRim = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.036, 10, 18), MAT.brass);
      stackRim.rotation.x = Math.PI / 2;
      stackRim.position.set(0, 1.48, 1.05);
      boilerGroup.add(stackRim);
      stackEmitterLocal = new THREE.Vector3(0, 1.48 + 1.54, 0.65 + 1.05);

      // Polished brass steam dome & cast sand dome
      const steamDome = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.27, 0.55, 18), MAT.brass);
      steamDome.position.set(0, 0.72, 0.12);
      boilerGroup.add(steamDome);
      const steamCap = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), MAT.brass);
      steamCap.position.set(0, 0.99, 0.12);
      boilerGroup.add(steamCap);

      const sandDome = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.42, 14), MAT.locoGreen);
      sandDome.position.set(0, 0.68, -0.58);
      boilerGroup.add(sandDome);

      // Front brass headlamp
      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.22, 12), MAT.brass);
      lamp.rotation.x = Math.PI / 2;
      lamp.position.set(0, 0.22, 1.56);
      boilerGroup.add(lamp);

      loco.add(boilerGroup);

      // Side pannier water tanks (deep hill-railway forest green with brass trim)
      for (const side of [-1, 1]) {
        const tank = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.92, 2.25), MAT.locoGreen);
        tank.position.set(side * 0.66, 1.32, 0.28);
        loco.add(tank);

        const trim = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.05, 2.28), MAT.brass);
        trim.position.set(side * 0.66, 1.76, 0.28);
        loco.add(trim);

        // Steam cylinders at front
        const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.78, 14), MAT.castIron);
        cyl.rotation.x = Math.PI / 2;
        cyl.position.set(side * 0.72, 0.54, 1.65);
        loco.add(cyl);
      }

      // Open-sided mountain cab with curved roof & rear coal bunker
      const cabFront = new THREE.Mesh(new THREE.BoxGeometry(1.62, 1.65, 0.12), MAT.locoGreen);
      cabFront.position.set(0, 1.62, -0.78);
      loco.add(cabFront);

      // Two round brass spectacle windows on cab front
      for (const sx of [-0.42, 0.42]) {
        const spec = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.025, 8, 16), MAT.brass);
        spec.position.set(sx, 2.02, -0.72);
        loco.add(spec);
      }

      const cabBunker = new THREE.Mesh(new THREE.BoxGeometry(1.62, 1.05, 0.72), MAT.locoGreen);
      cabBunker.position.set(0, 1.28, -2.18);
      loco.add(cabBunker);

      // Four slender cab roof pillars
      for (const sx of [-0.75, 0.75]) {
        for (const sz of [-0.82, -2.36]) {
          const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.72, 8), MAT.locoBlack);
          pillar.position.set(sx, 1.68, sz);
          loco.add(pillar);
        }
      }

      // Curved cab roof
      const roofGeo = new THREE.CylinderGeometry(1.18, 1.18, 1.88, 18, 1, true, -0.78, 1.56);
      roofGeo.rotateX(Math.PI / 2);
      const roof = new THREE.Mesh(roofGeo, MAT.locoBlack);
      roof.position.set(0, 1.52, -1.58);
      loco.add(roof);

      // Coupled spoked driving wheels (3 axles) + animated side connecting rods
      const wheelZ = [-1.45, -0.15, 1.15];
      const wheelR = 0.42;
      wheelZ.forEach((wz) => {
        const axleGroup = new THREE.Group();
        axleGroup.position.set(0, wheelR, wz);

        const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.24, 10), MAT.castIron);
        axle.rotation.z = Math.PI / 2;
        axleGroup.add(axle);

        for (const side of [-1, 1]) {
          const wheel = new THREE.Group();
          wheel.position.x = side * (HALF_GAUGE + 0.02);

          const rim = new THREE.Mesh(new THREE.TorusGeometry(wheelR - 0.04, 0.045, 8, 20), MAT.steelRail);
          rim.rotation.y = Math.PI / 2;
          wheel.add(rim);

          const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.09, 12), MAT.locoRed);
          hub.rotation.z = Math.PI / 2;
          wheel.add(hub);

          // 8 radial wheel spokes
          for (let sp = 0; sp < 8; sp++) {
            const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.035, wheelR * 1.78, 0.035), MAT.locoRed);
            spoke.rotation.x = (sp / 8) * Math.PI;
            wheel.add(spoke);
          }
          axleGroup.add(wheel);
        }

        animatedWheels.push(axleGroup);
        loco.add(axleGroup);
      });

      // Side coupling rods (animated in circular eccentric motion)
      for (const side of [-1, 1]) {
        const rod = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.075, 2.75), MAT.steelRail);
        rod.position.set(side * (HALF_GAUGE + 0.11), wheelR, -0.15);
        animatedRods.push({ mesh: rod, baseY: wheelR, baseZ: -0.15, phase: side > 0 ? 0 : Math.PI * 0.5 });
        loco.add(rod);
      }

      // Underside Abt Rack Pinion Cogwheel (visibly meshes above the double rack bar)
      const pinionGroup = new THREE.Group();
      pinionGroup.position.set(0, 0.20, 0.15);
      const pinionDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.18, 16), MAT.brass);
      pinionDrum.rotation.z = Math.PI / 2;
      pinionGroup.add(pinionDrum);
      for (let t = 0; t < 12; t++) {
        const ang = (t / 12) * Math.PI * 2;
        const cog = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.07, 0.055), MAT.brass);
        cog.position.set(0, Math.sin(ang) * 0.25, Math.cos(ang) * 0.25);
        cog.rotation.x = -ang;
        pinionGroup.add(cog);
      }
      pinionGearMesh = pinionGroup;
      loco.add(pinionGroup);

      return enableShadows(loco);
    }

    /**
     * Builds one unbranded vintage wooden hill-railway passenger coach with clerestory roof.
     */
    function createVintageCoach() {
      const coach = new THREE.Group();

      // Underframe & buffer beams
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.24, 6.2), MAT.locoBlack);
      frame.position.set(0, 0.54, 0);
      coach.add(frame);

      for (const bz of [-3.12, 3.12]) {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.24, 0.12), MAT.locoRed);
        beam.position.set(0, 0.54, bz);
        coach.add(beam);
      }

      // Two 4-wheel bogies
      for (const wz of [-2.1, -1.25, 1.25, 2.1]) {
        const axleGroup = new THREE.Group();
        axleGroup.position.set(0, 0.30, wz);
        const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.15, 8), MAT.castIron);
        axle.rotation.z = Math.PI / 2;
        axleGroup.add(axle);
        for (const side of [-1, 1]) {
          const w = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.30, 0.07, 14), MAT.steelRail);
          w.rotation.z = Math.PI / 2;
          w.position.x = side * HALF_GAUGE;
          axleGroup.add(w);
        }
        animatedWheels.push(axleGroup);
        coach.add(axleGroup);
      }

      // Lower teak/mahogany slatted waist panel
      const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.82, 5.15), MAT.coachWood);
      lowerBody.position.set(0, 1.07, 0);
      coach.add(lowerBody);

      // Upper window frame pilasters (leaving open vintage mountain-railway window bays)
      const windowPillarsZ = [-2.52, -1.68, -0.84, 0, 0.84, 1.68, 2.52];
      for (const side of [-1, 1]) {
        for (const pz of windowPillarsZ) {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.82, 0.14), MAT.coachCream);
          post.position.set(side * 0.76, 1.88, pz);
          coach.add(post);
        }
        // Top header fascia rail
        const fascia = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 5.18), MAT.coachWood);
        fascia.position.set(side * 0.76, 2.34, 0);
        coach.add(fascia);
      }

      // End bulkheads & open end veranda railings
      for (const ez of [-2.52, 2.52]) {
        const endWall = new THREE.Mesh(new THREE.BoxGeometry(1.56, 1.72, 0.10), MAT.coachWood);
        endWall.position.set(0, 1.54, ez);
        coach.add(endWall);
      }
      for (const vz of [-3.02, 3.02]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.06, 0.06), MAT.locoBlack);
        rail.position.set(0, 1.24, vz);
        coach.add(rail);
        for (const vx of [-0.68, -0.24, 0.24, 0.68]) {
          const st = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.65, 6), MAT.locoBlack);
          st.position.set(vx, 0.92, vz);
          coach.add(st);
        }
      }

      // Curved main roof + raised ventilated Clerestory roof
      const mainRoof = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.14, 6.24), MAT.coachCream);
      mainRoof.position.set(0, 2.48, 0);
      coach.add(mainRoof);

      const clerestory = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.24, 4.95), MAT.coachWood);
      clerestory.position.set(0, 2.66, 0);
      coach.add(clerestory);

      const clRoof = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.08, 5.12), MAT.coachCream);
      clRoof.position.set(0, 2.80, 0);
      coach.add(clRoof);

      return enableShadows(coach);
    }

    const locoGroup = createRackLocomotive();
    const coachGroup = createVintageCoach();
    scene.add(locoGroup, coachGroup);

    // Rising translucent steam wisps emitted from the locomotive smokestack
    const STEAM_COUNT = 22;
    const steamParticles = [];
    const steamGeo = new THREE.SphereGeometry(0.28, 10, 8);
    for (let i = 0; i < STEAM_COUNT; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xf4f7f8,
        roughness: 0.95,
        transparent: true,
        opacity: 0.0,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(steamGeo, mat);
      mesh.visible = false;
      scene.add(mesh);
      steamParticles.push({
        mesh,
        age: (i / STEAM_COUNT) * 2.4,
        maxAge: 2.4,
        vel: new THREE.Vector3(),
        origin: new THREE.Vector3()
      });
    }

    /**
     * Places an articulated vehicle accurately on the 1-in-12 S-curve spline.
     */
    function placeOnTrack(obj, u) {
      const f = getTrackFrame(u);
      const m = new THREE.Matrix4().makeBasis(f.right, f.up, f.tan);
      // Railhead top is at f.pos + f.up * 0.273
      const railPos = f.pos.clone().addScaledVector(f.up, 0.273);
      obj.position.copy(railPos);
      obj.quaternion.setFromRotationMatrix(m);
    }

    // -------------------------------------------------------------------------
    // 14. DETERMINISTIC REVERSIBLE CONSTRUCTION KINEMATICS (0.0 -> 1.0)
    // -------------------------------------------------------------------------
    function clamp01(v) {
      return Math.max(0, Math.min(1, v));
    }

    function easeOutCubic(x) {
      const t = clamp01(x);
      return 1 - Math.pow(1 - t, 3);
    }

    function subProgress(t, start, end) {
      return easeOutCubic((t - start) / (end - start));
    }

    let currentTrainU = 0.46;

    const halt=new THREE.Group();
    const haltFrame=getTrackFrame(.922);
    halt.position.copy(haltFrame.pos).addScaledVector(haltFrame.right,3.8);
    halt.rotation.y=Math.atan2(haltFrame.tan.x,haltFrame.tan.z);
    function haltPart(w,h,d,x,y,z,material){
      const obj=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
      obj.position.set(x,y,z);obj.castShadow=true;obj.receiveShadow=true;halt.add(obj);
    }
    haltPart(4.2,1.45,10.7,.15,-.28,0,MAT.graniteAshlar);
    haltPart(2.3,2.15,4.4,.8,1.48,.4,MAT.coachCream);
    haltPart(3.7,.18,5.5,.32,2.63,.4,MAT.locoGreen);
    for(const z of [-2,2.8]) haltPart(.09,2.15,.09,-1.27,1.5,z,MAT.trunk);
    haltPart(.05,1.65,.8,-.37,1.25,.4,MAT.coachWood);
    scene.add(halt);
    function updateConstruction(t) {
      halt.visible=t>=.85;
      const ct = clamp01(t);

      // --- Stage 1 (0.00–0.16): Survey stakes appear & stay until deck/ballast covers them ---
      const pSurveyIn = subProgress(ct, 0.01, 0.14);
      const pSurveyOut = 1 - subProgress(ct, 0.64, 0.72);
      const surveyVis = pSurveyIn * pSurveyOut;
      surveyGroup.visible = surveyVis > 0.01;
      surveyGroup.scale.set(1, Math.max(0.01, surveyVis), 1);

      // --- Stage 2 (0.16–0.34): Retaining walls & 3 tapered masonry piers rise from ravine floor ---
      const pRetain = subProgress(ct, 0.16, 0.26);
      retainingWallsGroup.visible = pRetain > 0.005;
      retainingWallsGroup.scale.set(1, Math.max(0.01, pRetain), 1);

      piersData.forEach((p, idx) => {
        const s = 0.18 + idx * 0.022;
        const pp = subProgress(ct, s, s + 0.09);
        p.group.visible = pp > 0.005;
        if (p.group.visible) {
          p.group.scale.set(1, Math.max(0.01, pp), 1);
          p.group.position.y = (1 - pp) * p.groundY;
        }
      });

      // --- Stage 3 (0.34–0.54): Timber Falsework erects FIRST, then radial voussoirs climb & lock keystone ---
      // Falsework erects in [0.34, 0.41], stays solid during masonry, then is STRUCK (dismantled) in [0.55, 0.61]!
      const pFalseUp = subProgress(ct, 0.34, 0.41);
      const pFalseDown = 1 - subProgress(ct, 0.55, 0.605);
      const falseAlpha = Math.min(pFalseUp, pFalseDown);
      falseworkGroup.visible = falseAlpha > 0.01;
      if (falseworkGroup.visible) {
        falseworkGroup.scale.set(1, Math.max(0.01, falseAlpha), 1);
        falseworkGroup.position.y = -(1 - falseAlpha) * 2.2;
      }

      // Voussoir stones climb symmetrically from both haunches [0.40, 0.52]
      const pVoussoir = clamp01((ct - 0.40) / 0.11);
      voussoirInst.count = Math.floor(pVoussoir * totalVoussoirs);
      voussoirInst.visible = voussoirInst.count > 0;

      // Keystones drop into crown [0.51, 0.54]
      const pKey = clamp01((ct - 0.51) / 0.03);
      keystoneInst.count = ARCH_SPANS.length;
      for(let i=0;i<keystoneMatrices.length;i++){
        const keyMatrix=keystoneMatrices[i].clone();
        keyMatrix.elements[13]+=1.05*(1-pKey);
        keystoneInst.setMatrixAt(i,keyMatrix);
      }
      keystoneInst.instanceMatrix.needsUpdate=true;
      keystoneInst.visible = pKey > 0.01;

      // --- Stage 4 (0.54–0.70): Spandrel walls, cornice, parapets & crushed ballast bed ---
      const pSuper = subProgress(ct, 0.56, 0.65);
      superstructureGroup.visible = pSuper > 0.005;
      if (superstructureGroup.visible) {
        superstructureGroup.scale.set(1, Math.max(0.01, pSuper), 1);
        superstructureGroup.position.y = (1 - pSuper) * 10.5;
      }

      const pBallast = clamp01((ct - 0.63) / 0.07);
      ballastInst.count = Math.floor(pBallast * BALLAST_SEGS);
      ballastInst.visible = ballastInst.count > 0;

      // --- Stage 5 (0.70–0.85): Sleepers, Rail Chairs, Flanged Rails & Staggered Abt Rack ---
      const pSleepers = clamp01((ct - 0.70) / 0.06);
      const sCount = Math.floor(pSleepers * SLEEPER_COUNT);
      sleeperInst.count = sCount;
      sleeperInst.visible = sCount > 0;
      chairInst.count = sCount * 3;
      chairInst.visible = sCount > 0;

      const pRails = clamp01((ct - 0.75) / 0.055);
      railInst.count = Math.floor(pRails * RAIL_SEGS) * 2;
      railInst.visible = railInst.count > 0;

      const pRack = clamp01((ct - 0.795) / 0.055);
      rackBarInst.count = Math.floor(pRack * RACK_BAR_SEGS) * 2;
      rackBarInst.visible = rackBarInst.count > 0;
      rackToothInst.count = Math.floor(pRack * TEETH_PER_BAR) * 2;
      rackToothInst.visible = rackToothInst.count > 0;

      // --- Stage 6 (0.85–1.00): First Crossing (Locomotive pushes vintage coach uphill across viaduct) ---
      const trainVisible = ct >= 0.85;
      locoGroup.visible = trainVisible;
      coachGroup.visible = trainVisible;

      if (trainVisible) {
        const pCross = clamp01((ct - 0.85) / 0.15);
        // Climb from lower approach (u = 0.09) onto the dramatic viaduct hero pose (u = 0.47) at t = 1.0
        currentTrainU = openingPortrait ? .47 : THREE.MathUtils.lerp(0.09, 0.86, pCross);
        const coachU = Math.min(0.96, currentTrainU + 6.25 / TRACK_LENGTH); // Coach pushed uphill in front of loco

        placeOnTrack(locoGroup, currentTrainU);
        placeOnTrack(coachGroup, coachU);

        // Rotate driving wheels, side coupling rods, and underside Abt pinion gear deterministically from travel distance
        const distTraveled = currentTrainU * TRACK_LENGTH;
        const wheelAngle = distTraveled / 0.42;
        animatedWheels.forEach((ax) => {
          ax.rotation.x = wheelAngle;
        });
        animatedRods.forEach((r) => {
          const a = wheelAngle + r.phase;
          r.mesh.position.y = r.baseY + Math.sin(a) * 0.12;
          r.mesh.position.z = r.baseZ + Math.cos(a) * 0.12;
        });
        if (pinionGearMesh) {
          pinionGearMesh.rotation.x = distTraveled / 0.23;
        }
      } else {
        steamParticles.forEach((p) => { p.mesh.visible = false; });
      }
    }

    // -------------------------------------------------------------------------
    // 15. STATE, WIREFRAME INSPECTOR, UI SYNC & EVENTS
    // -------------------------------------------------------------------------
    let openingPortrait = true;
    let followClimb=false;
    const state = {
      t: 1.0,
      playing: false,
      guidedCamera: true,
      wireframeMode: false,
      playSpeed: prefersReducedMotion ? 0.028 : 0.042, // ~24s full civil engineering playback
      resettingCamera: false,
      activeChapterIdx: 5
    };

    const ui = {
      slider: document.getElementById('timeline-slider'),
      sliderReadout: document.getElementById('slider-readout'),
      btnPlay: document.getElementById('btn-play'),
      iconPlay: document.getElementById('icon-play'),
      iconPause: document.getElementById('icon-pause'),
      labelPlay: document.getElementById('label-play'),
      btnReplay: document.getElementById('btn-replay'),
      btnHeroReplay: document.getElementById('btn-hero-replay'),
      heroReplayWrap: document.getElementById('hero-replay-wrap'),
      btnGuided: document.getElementById('btn-guided'),
      btnReset: document.getElementById('btn-reset'),
      btnWireframe: document.getElementById('btn-wireframe'),
      stageBadge: document.getElementById('stage-badge'),
      captionTitle: document.getElementById('caption-title'),
      captionBody: document.getElementById('caption-body'),
      captionCard: document.getElementById('caption-card'),
      btnCaptionToggle: document.getElementById('btn-caption-toggle'),
      chapterBtns: Array.from(document.querySelectorAll('.chapter-btn')),
      toast: document.getElementById('toast'),
      btnSources: document.getElementById('btn-sources'),
      modalSources: document.getElementById('modal-sources'),
      btnModalClose: document.getElementById('btn-modal-close')
    };

    let toastTimer = null;
    function showToast(msg) {
      ui.toast.textContent = msg;
      ui.toast.classList.add('visible');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => ui.toast.classList.remove('visible'), 4600);
    }

    function getChapterForT(t) {
      if (t >= 0.85) return CHAPTERS[5];
      if (t >= 0.70) return CHAPTERS[4];
      if (t >= 0.54) return CHAPTERS[3];
      if (t >= 0.34) return CHAPTERS[2];
      if (t >= 0.16) return CHAPTERS[1];
      return CHAPTERS[0];
    }

    function syncUI() {
      const pct = Math.round(state.t * 100);
      ui.slider.value = Math.round(state.t * 1000);
      ui.slider.style.setProperty('--progress', `${pct}%`);
      ui.slider.setAttribute('aria-valuetext', pct+' percent');

      const ch = getChapterForT(state.t);
      state.activeChapterIdx = ch.id;

      const phaseTag = pct === 100 ? 'First Crossing (1899–1908)' : pct === 0 ? 'Survey (1891)' : ch.shortLabel;
      ui.sliderReadout.textContent = `${pct}% · ${phaseTag}`;

      ui.stageBadge.textContent = ch.badge;
      ui.stageBadge.className = `stage-badge ${ch.badgeType}`;
      ui.captionTitle.textContent = ch.title;
      ui.captionBody.textContent = state.t>=.51 && state.t<.55 ? 'The keystone settles between the two rising halves of the arch.' :
        state.t>=.55 && state.t<.605 ? 'The timber drops away, leaving the stone arch spanning the ravine.' : ch.caption;

      ui.chapterBtns.forEach((btn, idx) => btn.classList.toggle('active', idx === ch.id));

      ui.iconPlay.style.display = state.playing ? 'none' : 'block';
      ui.iconPause.style.display = state.playing ? 'block' : 'none';
      ui.labelPlay.textContent = state.playing ? 'Pause' : 'Play';

      ui.btnGuided.classList.toggle('is-active', state.guidedCamera);
      ui.btnGuided.setAttribute('aria-pressed', String(state.guidedCamera));

      ui.btnWireframe.classList.toggle('is-active', state.wireframeMode);
      ui.btnWireframe.setAttribute('aria-pressed', String(state.wireframeMode));

      const showHeroReplay = !state.playing && state.t >= 0.995;
      ui.heroReplayWrap.classList.remove('is-hidden'); ui.btnHeroReplay.hidden=!showHeroReplay;
      document.getElementById('climb').hidden=false;
      if(openingPortrait) ui.sliderReadout.textContent='Completed railway'; 
      if(openingPortrait) ui.captionBody.textContent = 'Follow a mountain railway from the first survey to the crossing of a completed viaduct.';
    }

    function setTimeline(newT) {
      followClimb=false;
      openingPortrait = false;
      state.t = clamp01(newT);
      updateConstruction(state.t);
      syncUI();
    }

    function startReplay() {
      followClimb=false;
      openingPortrait = false;
      state.resettingCamera = false;
      state.t = 0.0;
      state.playing = true;
      updateConstruction(0.0);
      syncUI();
    }

    function togglePlay() {
      openingPortrait = false;
      if (state.playing) {
        state.playing = false;
      } else {
        if (state.t >= 0.998) {
          followClimb=false;
          state.t = 0.0;
          updateConstruction(0.0);
        }
        state.playing = true;
      }
      syncUI();
    }

    function toggleGuidedCamera() {
      followClimb=false;
      state.guidedCamera = !state.guidedCamera;
      state.resettingCamera = false;
      syncUI();
      showToast(
        state.guidedCamera
          ? 'Guided camera enabled — drag anywhere to resume manual orbit.'
          : 'Guided camera off — your manual camera angle stays locked while scrubbing.'
      );
    }

    function toggleWireframe() {
      state.wireframeMode = !state.wireframeMode;
      inspectableMaterials.forEach((mat) => {
        mat.wireframe = state.wireframeMode;
      });
      syncUI();
      showToast(
        state.wireframeMode
          ? 'Structural wireframe active — inspect instanced voussoirs, timber centering, Abt rack teeth & locomotive mesh.'
          : 'Shaded PBR materials restored.'
      );
    }

    function resetView() {
      followClimb=false;
      state.guidedCamera = false;
      if (prefersReducedMotion) {
        camera.position.copy(DEFAULT_CAM_POS);
        controls.target.copy(DEFAULT_CAM_TARGET);
        controls.update();
        state.resettingCamera = false;
      } else {
        state.resettingCamera = true;
      }
      syncUI();
    }

    // Yield Guided Camera automatically if user orbits manually
    controls.addEventListener('start', () => {
      if (state.guidedCamera) {
        state.guidedCamera = false;
        syncUI();
      }
      state.resettingCamera = false;
    });

    ui.slider.addEventListener('input', (e) => {
      state.playing = false;
      setTimeline(Number(e.target.value) / 1000);
    });

    ui.btnPlay.addEventListener('click', togglePlay);
    ui.btnReplay.addEventListener('click', startReplay);
    let dragPan=false;
    const modeButton=document.getElementById('view-mode');
    modeButton.onclick=()=>{
      dragPan=!dragPan;
      controls.mouseButtons.LEFT=dragPan?THREE.MOUSE.PAN:THREE.MOUSE.ROTATE;
      controls.touches.ONE=dragPan?THREE.TOUCH.PAN:THREE.TOUCH.ROTATE;
      modeButton.textContent=dragPan?'Drag · pan':'Drag · orbit';
      modeButton.setAttribute('aria-pressed',String(dragPan));
      showToast(dragPan?'Drag to move across the scene.':'Drag to rotate around the scene.');
    };
    function zoomBy(factor){
      const offset=camera.position.clone().sub(controls.target);
      offset.setLength(THREE.MathUtils.clamp(offset.length()*factor,controls.minDistance,controls.maxDistance));
      camera.position.copy(controls.target).add(offset); state.resettingCamera=false; state.guidedCamera=false; controls.update();syncUI();
    }
    document.getElementById('zoom-in').onclick=()=>zoomBy(.78);
    document.getElementById('zoom-out').onclick=()=>zoomBy(1.28);
    const lastFollowPosition=new THREE.Vector3();
    function gearPosition(){
      return pinionGearMesh.getWorldPosition(new THREE.Vector3());
    }
    document.getElementById('climb').addEventListener('click',()=>{
      state.guidedCamera=false; state.resettingCamera=false;
      setTimeline(.882); state.playing=true;followClimb=true;
      const f=getTrackFrame(currentTrainU);
      lastFollowPosition.copy(gearPosition());
      controls.target.copy(lastFollowPosition);
      camera.position.copy(controls.target).addScaledVector(f.right,1.85).addScaledVector(f.tan,-.95).addScaledVector(f.up,.26);
      controls.update(); syncUI(); showToast('Following the rack wheel. Drag to look around.');
    });
    ui.btnHeroReplay.addEventListener('click', startReplay);
    ui.btnGuided.addEventListener('click', toggleGuidedCamera);
    ui.btnReset.addEventListener('click', resetView);
    ui.btnWireframe.addEventListener('click', toggleWireframe);

    ui.chapterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.chapter);
        if (!CHAPTERS[idx]) return;
        state.playing = false;
        setTimeline(CHAPTERS[idx].jumpT);
      });
    });



    ui.btnCaptionToggle.addEventListener('click', () => {
      const collapsed = ui.captionCard.classList.toggle('collapsed');
      ui.btnCaptionToggle.textContent = collapsed ? 'Show' : 'Hide';
      ui.btnCaptionToggle.setAttribute('aria-expanded', String(!collapsed));
    });

    function openModal() {
      ui.modalSources.classList.add('open');
      ui.btnModalClose.focus();
    }
    function closeModal() {
      ui.modalSources.classList.remove('open');ui.btnSources.focus();
    }
    ui.btnSources.addEventListener('click', openModal);
    ui.btnModalClose.addEventListener('click', closeModal);
    ui.modalSources.addEventListener('click', (e) => {
      if (e.target === ui.modalSources) closeModal();
    });

    window.addEventListener('keydown', (e) => {
      if (ui.modalSources.classList.contains('open')) {
        if (e.key === 'Escape') closeModal();
        return;
      }
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        if (e.key === ' ') {
          e.preventDefault();
          togglePlay();
        }
        return;
      }
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          state.playing = false;
          setTimeline(state.t + 0.02);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          state.playing = false;
          setTimeline(state.t - 0.02);
          break;
        case 'r':
        case 'R':
          resetView();
          break;
        case 'g':
        case 'G':
          toggleGuidedCamera();
          break;
        case 'w':
        case 'W':
          toggleWireframe();
          break;
        case '1': case '2': case '3': case '4': case '5': case '6':
          state.playing = false;
          setTimeline(CHAPTERS[Number(e.key) - 1].jumpT);
          break;
      }
    });

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // -------------------------------------------------------------------------
    // 16. MAIN ANIMATION LOOP (PLAYBACK, STEAM WISPS & CAMERA)
    // -------------------------------------------------------------------------
    const clock = new THREE.Clock();
    const worldStackPos = new THREE.Vector3();

    function updateSteam(dt) {
      if (!locoGroup.visible) return;
      locoGroup.updateMatrixWorld();
      worldStackPos.copy(stackEmitterLocal).applyMatrix4(locoGroup.matrixWorld);

      for (const p of steamParticles) {
        p.age += dt * (prefersReducedMotion ? 0.35 : 1.0);
        if (p.age >= p.maxAge) {
          p.age = 0;
          p.origin.copy(worldStackPos);
          p.vel.set((Math.random() - 0.5) * 0.45, 1.35 + Math.random() * 0.55, (Math.random() - 0.5) * 0.45);
          p.mesh.position.copy(p.origin);
          p.mesh.visible = true;
        }
        const life = p.age / p.maxAge;
        p.mesh.position.addScaledVector(p.vel, dt);
        // Gentle Nilgiri hill breeze drift
        p.mesh.position.x -= dt * 0.35;
        const sc = 0.45 + life * 2.15;
        p.mesh.scale.setScalar(sc);
        p.mesh.material.opacity = Math.sin(life * Math.PI) * 0.42;
      }
    }

    function animate() {
      requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      if(!prefersReducedMotion) waterTime.value+=dt;

      if (state.playing) {
        state.t += dt * state.playSpeed * (state.t >= .85 ? .32 : state.t >= .49 && state.t < .61 ? .52 : 1);
        if (state.t >= 1.0) {
          state.t = 1.0;
          state.playing = false;
        }
        updateConstruction(state.t);
        syncUI();
      }

      updateSteam(dt);

      if(followClimb){
        const next=gearPosition();
        const delta=next.clone().sub(lastFollowPosition);
        controls.target.add(delta);camera.position.add(delta);lastFollowPosition.copy(next);
      }
      if (state.guidedCamera) {
        const ch = CHAPTERS[state.activeChapterIdx];
        const alpha = prefersReducedMotion ? 1 : 1 - Math.exp(-dt * 2.2);
        if(state.t>=.445 && state.t<.61){
          const target=ARCH_SPANS[1].midPt.clone().add(new THREE.Vector3(0,1.9,0));
          controls.target.lerp(target,alpha); camera.position.lerp(target.add(new THREE.Vector3(4,2,12)),alpha);
        } else if(state.t>=.85){
          const frame=getTrackFrame(currentTrainU);
          const target=gearPosition().addScaledVector(frame.up,1.1);
          const cameraGoal=target.clone().addScaledVector(frame.right,5.2).addScaledVector(frame.tan,-9).addScaledVector(frame.up,4.2);
          controls.target.lerp(target,alpha); camera.position.lerp(cameraGoal,alpha);
        } else {
          camera.position.lerp(ch.camPos,alpha); controls.target.lerp(ch.camTarget,alpha);
        }
      } else if (state.resettingCamera) {
        const alpha = 1 - Math.exp(-dt * 5.0);
        camera.position.lerp(DEFAULT_CAM_POS, alpha);
        controls.target.lerp(DEFAULT_CAM_TARGET, alpha);
        if (
          camera.position.distanceTo(DEFAULT_CAM_POS) < 0.08 &&
          controls.target.distanceTo(DEFAULT_CAM_TARGET) < 0.08
        ) {
          camera.position.copy(DEFAULT_CAM_POS);
          controls.target.copy(DEFAULT_CAM_TARGET);
          state.resettingCamera = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    }

    {
      updateConstruction(1.0);
      syncUI();
      animate();
    }

