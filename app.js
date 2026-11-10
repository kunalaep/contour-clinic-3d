/**
 * CONTOUR COSMETIC CLINIC — 3D INTERACTIVE ENGINE & APPLICATION LOGIC
 * Engine: Three.js (r128) + Custom Touch/Drag Orbit Dampening + Procedural PBR
 * Grounded on clinical data from https://www.contourcosmeticclinic.com
 */

(function () {
  'use strict';

  // --- STATE MANAGEMENT ---
  const APP_STATE = {
    active3DMode: 'scalp', // 'scalp' | 'sapphire' | 'cellular'
    norwoodStage: 3,
    technique: 'sapphire', // 'sapphire' | 'dhi' | 'combo'
    techniqueRate: 25,
    densityGoal: 'natural', // 'natural' | 'dense'
    activeCase: 1
  };

  // Clinical Norwood Diagnostic Database (Dr. Saket Jha Protocol)
  const NORWOOD_DATA = {
    1: {
      title: 'Stage I — Mature Hairline (Minimal Recession)',
      baseGrafts: [800, 1200],
      duration: '3 – 4 Hours',
      zones: ['Early Temporal Angle Micro-Touchup', 'Frontal Edge Softening'],
      basePackage: 35000,
      scalpRecessionFactor: 0.15
    },
    2: {
      title: 'Stage II — Temporal Peak Recession',
      baseGrafts: [1400, 1800],
      duration: '4 Hours',
      zones: ['Bilateral Frontotemporal Triangles', 'Hairline Edge Alignment'],
      basePackage: 45000,
      scalpRecessionFactor: 0.3
    },
    3: {
      title: 'Stage III — Deep Frontal M-Pattern Recession',
      baseGrafts: [2000, 2400],
      duration: '4 – 5 Hours',
      zones: ['Bilateral Temporal Peaks', 'Frontal M-Line Redefinition', 'Mid-Scalp Feathering'],
      basePackage: 59999,
      scalpRecessionFactor: 0.5
    },
    4: {
      title: 'Stage IV — Frontal Recession & Vertex Thinning',
      baseGrafts: [2600, 3200],
      duration: '5 – 6 Hours',
      zones: ['Complete Frontal Forelock', 'Temporal Pillars', 'Early Crown / Vertex Swirl'],
      basePackage: 79999,
      scalpRecessionFactor: 0.7
    },
    5: {
      title: 'Stage V — Extensive Frontal & Crown Bridge Loss',
      baseGrafts: [3400, 4000],
      duration: '6 – 7 Hours',
      zones: ['Frontal Reconstruction', 'Mid-Scalp Bridge', 'Crown Vertex Expansion'],
      basePackage: 99999,
      scalpRecessionFactor: 0.85
    },
    6: {
      title: 'Stage VI — Confluent Frontal & Vertex Baldness',
      baseGrafts: [4200, 4800],
      duration: '7 – 8 Hours (or 2-Day Session)',
      zones: ['Full Calvarium Resurfacing', 'Hairline Lowering', 'High-Density Crown Swirl'],
      basePackage: 119999,
      scalpRecessionFactor: 0.95
    },
    7: {
      title: 'Stage VII — Severe Horseshoe Pattern (Mega Session)',
      baseGrafts: [5000, 5800],
      duration: '2-Day Mega Session Protocol',
      zones: ['Complete Occipital Donor Optimization', 'Aesthetic Frontal Frame', 'Beard Donor Integration'],
      basePackage: 139999,
      scalpRecessionFactor: 1.0
    }
  };

  // Case Studies Database with Real Patient Photographic Grounding
  const CASE_STUDIES = {
    1: {
      id: 1,
      badge: 'Verified Case #2841 · DHI Hairline',
      title: 'Frontal Hairline & Bilateral Temporal Reconstruction',
      details: '4,500 Grafts · DHI Technique · Month 9 Result · Surgeon: Dr. Saket Jha',
      beforeImage: 'case1-before.png',
      afterImage: 'case1-after.png',
      fullPoster: 'ht-result1.png',
      grafts: '4,500 Grafts',
      retention: '98.8%',
      time: '4.5 Hours',
      scarring: 'Zero Scarring',
      growth: 'Permanent Lifelong'
    },
    2: {
      id: 2,
      badge: 'Verified Case #3190 · Full Head Mega-Session',
      title: 'Complete Calvarium Frontal-to-Crown Transformation',
      details: '6,500 Grafts · DHI Mega-Session · Month 10 Result · Surgeon: Dr. Saket Jha',
      beforeImage: 'case2-before.png',
      afterImage: 'case2-after.png',
      fullPoster: 'ht-result6.png',
      grafts: '6,500 Grafts',
      retention: '99.2%',
      time: '1 Day Mega',
      scarring: 'Zero Linear Scar',
      growth: 'Permanent Lifelong'
    },
    3: {
      id: 3,
      badge: 'Verified Case #4055 · Sapphire FUE',
      title: 'Frontal & Mid-Scalp Micro-Gemstone Restoration',
      details: '4,500 Grafts · Sapphire FUE Technique · Month 9 Result · Surgeon: Dr. Saket Jha',
      beforeImage: 'case3-before.png',
      afterImage: 'case3-after.png',
      fullPoster: 'ht-result3.png',
      grafts: '4,500 Grafts',
      retention: '98.5%',
      time: '5 Hours',
      scarring: 'Zero Scarring',
      growth: 'Permanent Lifelong'
    },
    4: {
      id: 4,
      badge: 'Verified Case #2114 · Vertex & Crown Swirl',
      title: 'Top-Down Crown Spiral & Frontal Densification',
      details: '4,500 Grafts · DHI Direct Implantation · Month 9 Result · Surgeon: Dr. Saket Jha',
      beforeImage: 'case4-before.png',
      afterImage: 'case4-after.png',
      fullPoster: 'ht-result2.png',
      grafts: '4,500 Grafts',
      retention: '98.1%',
      time: '4.5 Hours',
      scarring: 'Zero Scarring',
      growth: 'Permanent Lifelong'
    }
  };

  // Preload real patient image assets for zero-latency slider interaction
  const IMAGE_CACHE = {};
  [
    'case1-before.png', 'case1-after.png',
    'case2-before.png', 'case2-after.png',
    'case3-before.png', 'case3-after.png',
    'case4-before.png', 'case4-after.png'
  ].forEach(src => {
    const img = new Image();
    img.src = src;
    IMAGE_CACHE[src] = img;
  });

  // =========================================================================
  // 1. THREE.JS 3D INTERACTIVE ENGINE
  // =========================================================================
  let scene, camera, renderer, container;
  let sceneGroups = {
    scalp: null,
    sapphire: null,
    cellular: null
  };
  let activeSceneGroup = null;

  // Orbit / Interaction Variables
  let isDragging = false;
  let prevMousePos = { x: 0, y: 0 };
  let targetRotation = { x: 0.2, y: 0.4 };
  let currentRotation = { x: 0.2, y: 0.4 };
  let targetZoom = 5.2;
  let currentZoom = 5.2;
  let initialPinchDistance = 0;

  // Dynamic 3D Objects
  let humanHeadGroup = null;
  let humanHeadModel = null;
  let humanHeadMesh = null;
  let humanHairMesh = null;
  let graftTargetsGroup = null;
  let hairlineCurveGroup = null;
  let sapphireBladeGroup = null;
  let cellularGroup = null;
  let pulseTimer = 0;

  function initThreeEngine() {
    container = document.getElementById('threeCanvasContainer');
    if (!container || typeof THREE === 'undefined') {
      console.warn('Three.js container or library not found. Running in UI mode.');
      return;
    }

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    // SCENE
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x081a16, 0.08);

    // CAMERA
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.5, currentZoom);
    camera.lookAt(0, 0, 0);

    // RENDERER with Retina Optimization
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // LIGHTING SYSTEM (Medical-Grade Studio Light)
    const ambientLight = new THREE.AmbientLight(0xdfe6e2, 0.85);
    scene.add(ambientLight);

    // Key Light (Gold Tint)
    const keyLight = new THREE.DirectionalLight(0xffdfa4, 2.2);
    keyLight.position.set(5, 8, 5);
    scene.add(keyLight);

    // Cool Rim Light (Surgical Precision Emerald / Cyan)
    const rimLight = new THREE.DirectionalLight(0x7fe3c5, 1.8);
    rimLight.position.set(-6, 3, -4);
    scene.add(rimLight);

    // Subtle Under-Glow
    const fillLight = new THREE.PointLight(0xc5a059, 1.2, 15);
    fillLight.position.set(0, -3, 3);
    scene.add(fillLight);

    // Frontal Soft Facial Key Light (enhances anatomical facial features & hair depth)
    const frontLight = new THREE.DirectionalLight(0xfff5ea, 1.35);
    frontLight.position.set(0, 1.2, 6);
    scene.add(frontLight);

    // BUILD MODES
    buildScalpMode();
    buildSapphireMode();
    buildCellularMode();

    // Default active mode
    switch3DMode('scalp');

    // ATTACH GESTURE & TOUCH CONTROLS
    setupInteractionControls();

    // START ANIMATION LOOP
    requestAnimationFrame(renderLoop);

    // WINDOW RESIZE OBSERVER
    window.addEventListener('resize', onWindowResize, { passive: true });
  }

  // --- BUILD MODE 1: REALISTIC 3D HUMAN HEAD & HAIR MODEL ---
  function buildScalpMode() {
    const group = new THREE.Group();
    sceneGroups.scalp = group;
    humanHeadGroup = group;

    // Load authentic photorealistic 3D human head & hair model
    loadRealisticHumanModel(group);

    scene.add(group);
  }

  // --- BASE64 DECODER FOR EMBEDDED MODEL ---
  function base64ToArrayBuffer(base64Data) {
    const base64 = base64Data.indexOf(',') !== -1 ? base64Data.split(',')[1] : base64Data;
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // --- REALISTIC 3D HUMAN HEAD MODEL LOADER ---
  function loadRealisticHumanModel(group) {
    if (typeof THREE === 'undefined' || typeof THREE.GLTFLoader === 'undefined') {
      console.warn('THREE.GLTFLoader not ready yet.');
      return;
    }

    const loader = new THREE.GLTFLoader();

    function onModelSuccess(gltf) {
      const model = gltf.scene;
      humanHeadModel = model;

      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          const name = child.name || '';

          // Hide lower body meshes so the presentation is a clean medical bust
          if (name.includes('Bottom') || name.includes('Footwear') || (name.includes('Body') && !name.includes('Head'))) {
            child.visible = false;
          }

          // 3D Realistic Hair
          if (name.includes('Hair')) {
            humanHairMesh = child;
            if (child.material) {
              child.material = child.material.clone();
              child.material.transparent = true;
              child.material.opacity = 1.0;
              child.material.roughness = 0.54;
              child.material.metalness = 0.08;
              child.material.depthWrite = true;
            }
          }

          // Realistic Facial Architecture & Skin
          if (name.includes('Head')) {
            humanHeadMesh = child;
            if (child.material) {
              child.material = child.material.clone();
              child.material.roughness = 0.58;
              child.material.metalness = 0.02;
            }
          }

          // Realistic Eyes
          if (name.includes('Eye')) {
            if (child.material) {
              child.material = child.material.clone();
              child.material.roughness = 0.12;
              child.material.metalness = 0.0;
            }
          }

          // Clinic Attire Collar
          if (name.includes('Top')) {
            if (child.material) {
              child.material = child.material.clone();
              child.material.color.setHex(0x0a221b); // Luxury Clinic Forest Emerald
              child.material.roughness = 0.82;
            }
          }
        }
      });

      // Fit and center head right at origin for fluid 360° inspection
      const scaleFactor = 6.8;
      model.scale.set(scaleFactor, scaleFactor, scaleFactor);
      model.position.set(0, -1.67 * scaleFactor, -0.02 * scaleFactor);
      group.add(model);

      // Luxury Architectural Emerald & Gold Pedestal
      group.add(createLuxuryPedestal());

      // Surgical Transplant Graft Mapping
      graftTargetsGroup = new THREE.Group();
      group.add(graftTargetsGroup);

      // Laser Hairline Restoration Contour
      hairlineCurveGroup = new THREE.Group();
      group.add(hairlineCurveGroup);

      // Populate for current Norwood stage
      updateHumanHairForNorwood(APP_STATE.norwoodStage);
    }

    // 1. In-memory parse from embedded base64 (fastest, offline-safe, zero CORS issue)
    if (window.HEAD_MODEL_BASE64) {
      try {
        const buffer = base64ToArrayBuffer(window.HEAD_MODEL_BASE64);
        loader.parse(buffer, '', onModelSuccess, function (err) {
          console.warn('Base64 parse error, falling back to direct GLB file load:', err);
          loader.load('human-head.glb', onModelSuccess);
        });
        return;
      } catch (e) {
        console.warn('Error processing base64 buffer, falling back to direct load:', e);
      }
    }

    // 2. Direct load fallback
    loader.load('human-head.glb', onModelSuccess, undefined, function (err) {
      console.error('Failed to load human-head.glb:', err);
    });
  }

  // --- LUXURY ARCHITECTURAL CLINICAL PEDESTAL ---
  function createLuxuryPedestal() {
    const pedestalGroup = new THREE.Group();

    // Dark Forest Emerald Tiered Pedestal Base
    const baseGeo = new THREE.CylinderGeometry(0.92, 1.25, 0.32, 48);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x081e19,
      metalness: 0.85,
      roughness: 0.22
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -1.95;
    pedestalGroup.add(baseMesh);

    // Gleaming Clinic Gold Trim Ring
    const goldRingGeo = new THREE.TorusGeometry(0.93, 0.025, 16, 64);
    const goldRingMat = new THREE.MeshStandardMaterial({
      color: 0xc5a059,
      metalness: 0.95,
      roughness: 0.12
    });
    const goldRing = new THREE.Mesh(goldRingGeo, goldRingMat);
    goldRing.rotation.x = Math.PI / 2;
    goldRing.position.y = -1.78;
    pedestalGroup.add(goldRing);

    // Subtle Ground Shadow Disc
    const shadowGeo = new THREE.CircleGeometry(1.4, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x040c0a,
      transparent: true,
      opacity: 0.55
    });
    const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
    shadowDisc.rotation.x = -Math.PI / 2;
    shadowDisc.position.y = -2.11;
    pedestalGroup.add(shadowDisc);

    return pedestalGroup;
  }

  // --- DYNAMIC NORWOOD HAIR DENSITY & SURGICAL MAPPING ENGINE ---
  function updateHumanHairForNorwood(stage) {
    // 1. Modulate 3D Human Hair Mesh Density & Foliage
    if (humanHairMesh && humanHairMesh.material) {
      const densityMap = {
        1: { opacity: 1.00, scaleY: 1.00 },
        2: { opacity: 0.95, scaleY: 0.99 },
        3: { opacity: 0.86, scaleY: 0.97 },
        4: { opacity: 0.74, scaleY: 0.95 },
        5: { opacity: 0.60, scaleY: 0.93 },
        6: { opacity: 0.45, scaleY: 0.90 },
        7: { opacity: 0.35, scaleY: 0.88 }
      };
      const cfg = densityMap[stage] || densityMap[3];
      humanHairMesh.material.opacity = cfg.opacity;
      humanHairMesh.scale.set(1.0, cfg.scaleY, 1.0);
    }

    // 2. Generate Surgical Transplant Graft Hologram Markers
    if (graftTargetsGroup) {
      generateRealisticGraftMarkers(graftTargetsGroup, stage);
    }

    // 3. Generate Laser Restoration Hairline Contour Spline
    if (hairlineCurveGroup) {
      generateHairlineLaserContour(hairlineCurveGroup, stage);
    }
  }

  // --- SURGICAL TRANSPLANT GRAFT HOLOGRAPHIC MAPPING ---
  function generateRealisticGraftMarkers(parentGroup, stage) {
    while (parentGroup.children.length > 0) {
      const child = parentGroup.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
      parentGroup.remove(child);
    }

    const graftPositions = [];
    const graftColors = [];

    const goldColor = new THREE.Color(0xc5a059); // Recipient graft sites (BIO-FUE / MHI target)
    const tealColor = new THREE.Color(0x7fe3c5); // Permanent safe donor extraction sites

    // Helper to add a cluster of surface points
    function addSurfaceCluster(count, centerX, centerY, centerZ, spreadX, spreadY, spreadZ, color, isSpherical) {
      for (let i = 0; i < count; i++) {
        let x, y, z;
        if (isSpherical) {
          const r = Math.random() * spreadX;
          const theta = Math.random() * 2 * Math.PI;
          x = centerX + r * Math.cos(theta);
          z = centerZ + r * Math.sin(theta);
          y = centerY + (Math.random() - 0.5) * spreadY;
        } else {
          x = centerX + (Math.random() - 0.5) * spreadX * 2;
          y = centerY + (Math.random() - 0.5) * spreadY * 2;
          z = centerZ + (Math.random() - 0.5) * spreadZ * 2;
        }
        graftPositions.push(x, y, z);
        graftColors.push(color.r, color.g, color.b);
      }
    }

    // 1. Safe Donor Zone Points (Occipital horseshoe perimeter)
    const donorCount = Math.min(360, 120 + stage * 35);
    for (let i = 0; i < donorCount; i++) {
      const angle = (Math.random() - 0.5) * 2.8; // spans across back and sides
      const radius = 0.72 + (Math.random() - 0.5) * 0.08;
      const x = Math.sin(angle) * radius;
      const z = -Math.cos(angle) * radius - 0.05;
      const y = 0.15 + (Math.random() - 0.5) * 0.40;
      graftPositions.push(x, y, z);
      graftColors.push(tealColor.r, tealColor.g, tealColor.b);
    }

    // 2. Recipient Zone Points (mapped by Norwood Stage)
    if (stage === 1) {
      // Stage 1: Fine inspection line
      addSurfaceCluster(40, -0.32, 0.74, 0.64, 0.08, 0.05, 0.06, goldColor, false);
      addSurfaceCluster(40, 0.32, 0.74, 0.64, 0.08, 0.05, 0.06, goldColor, false);
    } else if (stage === 2) {
      // Stage 2: Bilateral temporal triangles (140 grafts)
      addSurfaceCluster(80, -0.42, 0.78, 0.56, 0.12, 0.08, 0.10, goldColor, false);
      addSurfaceCluster(80, 0.42, 0.78, 0.56, 0.12, 0.08, 0.10, goldColor, false);
      addSurfaceCluster(40, 0.0, 0.82, 0.76, 0.18, 0.04, 0.04, goldColor, false);
    } else if (stage === 3) {
      // Stage 3: Deep temporal M-recession angles + frontal redefinition (280 grafts)
      addSurfaceCluster(140, -0.46, 0.82, 0.48, 0.15, 0.10, 0.14, goldColor, false);
      addSurfaceCluster(140, 0.46, 0.82, 0.48, 0.15, 0.10, 0.14, goldColor, false);
      addSurfaceCluster(70, 0.0, 0.84, 0.74, 0.22, 0.05, 0.06, goldColor, false);
    } else if (stage === 4) {
      // Stage 4: Complete frontal forelock + crown vertex swirl (450 grafts)
      addSurfaceCluster(160, -0.44, 0.84, 0.46, 0.16, 0.10, 0.14, goldColor, false);
      addSurfaceCluster(160, 0.44, 0.84, 0.46, 0.16, 0.10, 0.14, goldColor, false);
      addSurfaceCluster(100, 0.0, 0.88, 0.68, 0.26, 0.08, 0.08, goldColor, false);
      // Crown vertex
      addSurfaceCluster(120, 0.02, 1.28, -0.20, 0.22, 0.06, 0.22, goldColor, true);
    } else if (stage === 5) {
      // Stage 5: Frontal + mid-scalp bridge + expanded crown (620 grafts)
      addSurfaceCluster(220, 0.0, 0.90, 0.58, 0.48, 0.10, 0.20, goldColor, false);
      addSurfaceCluster(120, 0.0, 1.10, 0.20, 0.36, 0.08, 0.16, goldColor, false);
      addSurfaceCluster(200, 0.02, 1.28, -0.20, 0.32, 0.08, 0.32, goldColor, true);
    } else if (stage >= 6) {
      // Stage 6 & 7: Full calvarium resurfacing (850+ grafts)
      addSurfaceCluster(300, 0.0, 0.92, 0.52, 0.52, 0.12, 0.24, goldColor, false);
      addSurfaceCluster(220, 0.0, 1.14, 0.12, 0.44, 0.10, 0.24, goldColor, false);
      addSurfaceCluster(280, 0.02, 1.28, -0.18, 0.38, 0.10, 0.38, goldColor, true);
    }

    if (graftPositions.length > 0) {
      const graftGeo = new THREE.BufferGeometry();
      graftGeo.setAttribute('position', new THREE.Float32BufferAttribute(graftPositions, 3));
      graftGeo.setAttribute('color', new THREE.Float32BufferAttribute(graftColors, 3));

      const graftMat = new THREE.PointsMaterial({
        size: 0.038,
        vertexColors: true,
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending
      });

      const graftCloud = new THREE.Points(graftGeo, graftMat);
      parentGroup.add(graftCloud);
    }
  }

  // --- LASER HAIRLINE RESTORATION CONTOUR ---
  function generateHairlineLaserContour(parentGroup, stage) {
    while (parentGroup.children.length > 0) {
      const child = parentGroup.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
      parentGroup.remove(child);
    }

    // Surgical Laser Guide Spline across frontal hairline
    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-0.46, 0.72, 0.58), // Left temporal peak
      new THREE.Vector3(-0.24, 0.84, 0.76), // Left frontal arch
      new THREE.Vector3(0.00, 0.82, 0.80),  // Central micro-widow's peak
      new THREE.Vector3(0.24, 0.84, 0.76)   // Right frontal arch
    );
    const curveRight = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0.24, 0.84, 0.76),
      new THREE.Vector3(0.38, 0.78, 0.68),
      new THREE.Vector3(0.44, 0.74, 0.62),
      new THREE.Vector3(0.46, 0.72, 0.58)  // Right temporal peak
    );

    const pts1 = curve.getPoints(24);
    const pts2 = curveRight.getPoints(16);
    const allPts = pts1.concat(pts2.slice(1));

    const lineGeo = new THREE.BufferGeometry().setFromPoints(allPts);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xc5a059, // Clinic Gold Laser
      linewidth: 3,
      transparent: true,
      opacity: 0.95
    });

    const laserLine = new THREE.Line(lineGeo, lineMat);
    parentGroup.add(laserLine);

    // Glowing Laser Dots along the Contour
    const dotGeo = new THREE.BufferGeometry().setFromPoints(allPts);
    const dotMat = new THREE.PointsMaterial({
      color: 0xffdf9e,
      size: 0.05,
      transparent: true,
      opacity: 0.98,
      blending: THREE.AdditiveBlending
    });
    const laserDots = new THREE.Points(dotGeo, dotMat);
    parentGroup.add(laserDots);

    // If Stage >= 4, add Crown Vertex Laser Ring
    if (stage >= 4) {
      const crownRadius = 0.16 + (stage - 3) * 0.04;
      const ringGeo = new THREE.RingGeometry(crownRadius - 0.02, crownRadius, 36);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xc5a059,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      const crownRing = new THREE.Mesh(ringGeo, ringMat);
      crownRing.position.set(0.02, 1.28, -0.20);
      crownRing.rotation.x = -Math.PI / 2 + 0.22;
      parentGroup.add(crownRing);
    }
  }

  // --- BUILD MODE 2: SAPPHIRE BLADE SURGICAL INSTRUMENT ---
  function buildSapphireMode() {
    const group = new THREE.Group();
    sceneGroups.sapphire = group;

    // Stylized Precision Ergonomic Titanium Handle
    const handleGeo = new THREE.CylinderGeometry(0.12, 0.08, 3.2, 32);
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0x1b2b27,
      metalness: 0.85,
      roughness: 0.25
    });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.y = -0.6;
    group.add(handle);

    // Gold Knurled Collar
    const collarGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.35, 32);
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0xc5a059,
      metalness: 0.9,
      roughness: 0.2
    });
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.y = 1.05;
    group.add(collar);

    // Authentic Sapphire Gem Blade (V-Shape Hexagonal Crystal)
    const bladeGeo = new THREE.ConeGeometry(0.18, 0.95, 4);
    bladeGeo.scale(0.3, 1, 1); // Flatten into surgical micro-blade
    const sapphireMat = new THREE.MeshPhysicalMaterial({
      color: 0x228be6,
      emissive: 0x0c4a6e,
      emissiveIntensity: 0.4,
      metalness: 0.05,
      roughness: 0.08,
      transmission: 0.92,
      thickness: 0.4,
      transparent: true,
      opacity: 0.95,
      clearcoat: 1.0
    });
    const blade = new THREE.Mesh(bladeGeo, sapphireMat);
    blade.position.y = 1.7;
    group.add(blade);

    // Micro-Aperture Glowing Sparkles at Blade Edge
    const sparkCount = 35;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPos = [];
    for (let i = 0; i < sparkCount; i++) {
      sparkPos.push(
        (Math.random() - 0.5) * 0.4,
        1.7 + (Math.random() - 0.5) * 0.7,
        (Math.random() - 0.5) * 0.4
      );
    }
    sparkGeo.setAttribute('position', new THREE.Float32BufferAttribute(sparkPos, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.045,
      transparent: true,
      opacity: 0.8
    });
    const sparkles = new THREE.Points(sparkGeo, sparkMat);
    group.add(sparkles);

    group.rotation.z = -Math.PI / 4;
    group.rotation.x = Math.PI / 6;

    scene.add(group);
  }

  // --- BUILD MODE 3: GFC & CELLULAR REGENERATION BIOSPHERE ---
  function buildCellularMode() {
    const group = new THREE.Group();
    sceneGroups.cellular = group;

    // Central Autologous Bio-Nucleus (Icosahedron)
    const nucleusGeo = new THREE.IcosahedronGeometry(1.1, 4);
    const nucleusMat = new THREE.MeshPhysicalMaterial({
      color: 0xc5a059,
      emissive: 0x88652c,
      emissiveIntensity: 0.35,
      roughness: 0.25,
      metalness: 0.2,
      clearcoat: 0.9,
      wireframe: false
    });
    const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
    group.add(nucleus);

    // Concentric Growth Factor Molecular Orbitals
    const ringCount = 3;
    for (let r = 0; r < ringCount; r++) {
      const ringGeo = new THREE.TorusGeometry(1.6 + r * 0.35, 0.015, 16, 100);
      const ringMat = new THREE.MeshBasicMaterial({
        color: (r === 1) ? 0x7fe3c5 : 0xdfc282,
        transparent: true,
        opacity: 0.55
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = (r + 1) * Math.PI / 3;
      ring.rotation.y = r * Math.PI / 4;
      group.add(ring);
    }

    // Floating Bio-Active Growth Factors (PDGF, VEGF, EGF, IGF-1)
    const factorCount = 45;
    const factorGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const factorMat = new THREE.MeshStandardMaterial({
      color: 0x38d9a9,
      emissive: 0x12b886,
      emissiveIntensity: 0.6,
      roughness: 0.3
    });

    for (let f = 0; f < factorCount; f++) {
      const factorMesh = new THREE.Mesh(factorGeo, factorMat);
      const dist = 1.5 + Math.random() * 1.0;
      const angle1 = Math.random() * Math.PI * 2;
      const angle2 = (Math.random() - 0.5) * Math.PI;

      factorMesh.position.set(
        dist * Math.cos(angle2) * Math.sin(angle1),
        dist * Math.sin(angle2),
        dist * Math.cos(angle2) * Math.cos(angle1)
      );
      group.add(factorMesh);
    }

    scene.add(group);
  }

  // Switch 3D Active Viewport Mode
  function switch3DMode(mode) {
    APP_STATE.active3DMode = mode;

    Object.keys(sceneGroups).forEach(key => {
      if (sceneGroups[key]) {
        sceneGroups[key].visible = (key === mode);
      }
    });

    activeSceneGroup = sceneGroups[mode];

    // Update HUD and Chips
    const titleEl = document.getElementById('viewportModeTitle');
    const chipTitle = document.getElementById('chipTitle');
    const chipSub = document.getElementById('chipSub');

    if (mode === 'scalp') {
      if (titleEl) titleEl.textContent = 'Photorealistic 3D Human Model & Hair Simulator';
      if (chipTitle) chipTitle.textContent = 'Photorealistic 3D Human Model · Stage ' + APP_STATE.norwoodStage;
      if (chipSub) chipSub.textContent = 'Realistic face and hair with dynamic Norwood density & surgical transplant mapping.';
      targetZoom = 5.2;
    } else if (mode === 'sapphire') {
      if (titleEl) titleEl.textContent = '3D Sapphire Micro-Blade Precision Stylus';
      if (chipTitle) chipTitle.textContent = '0.8mm Genuine Sapphire Gemstone Tip';
      if (chipSub) chipSub.textContent = 'Creates V-shaped micro-slits ensuring rapid scabbing recovery and dense angulation.';
      targetZoom = 4.8;
    } else if (mode === 'cellular') {
      if (titleEl) titleEl.textContent = '3D GFC / Exosome Bio-Therapy Cluster';
      if (chipTitle) chipTitle.textContent = 'Autologous Growth Factor Concentrate';
      if (chipSub) chipSub.textContent = 'Zero inflammation cellular biotherapy stimulating microvascular follicle recovery.';
      targetZoom = 5.5;
    }

    // Update active class on buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
  }

  // --- INTERACTION & TOUCH DAMPENING CONTROLS ---
  function setupInteractionControls() {
    if (!container) return;

    // Mouse down
    container.addEventListener('mousedown', (e) => {
      isDragging = true;
      prevMousePos.x = e.clientX;
      prevMousePos.y = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;

      targetRotation.y += deltaX * 0.008;
      targetRotation.x += deltaY * 0.008;

      // Clamp X rotation to avoid flipping upside down
      targetRotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, targetRotation.x));

      prevMousePos.x = e.clientX;
      prevMousePos.y = e.clientY;
    });

    // Touch events for Mobile Phones & Tablets (Touch-action none)
    container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMousePos.x = e.touches[0].clientX;
        prevMousePos.y = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        isDragging = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDistance = Math.hypot(dx, dy);
      }
    }, { passive: false });

    container.addEventListener('touchmove', (e) => {
      e.preventDefault(); // Prevent page scroll hijack when rotating 3D

      if (e.touches.length === 1 && isDragging) {
        const deltaX = e.touches[0].clientX - prevMousePos.x;
        const deltaY = e.touches[0].clientY - prevMousePos.y;

        targetRotation.y += deltaX * 0.01;
        targetRotation.x += deltaY * 0.01;

        targetRotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, targetRotation.x));

        prevMousePos.x = e.touches[0].clientX;
        prevMousePos.y = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const pinchDelta = (dist - initialPinchDistance) * 0.01;

        targetZoom = Math.max(3.2, Math.min(8.0, targetZoom - pinchDelta));
        initialPinchDistance = dist;
      }
    }, { passive: false });

    container.addEventListener('touchend', () => {
      isDragging = false;
    });

    // Wheel Zoom
    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      targetZoom += e.deltaY * 0.003;
      targetZoom = Math.max(3.2, Math.min(8.0, targetZoom));
    }, { passive: false });

    // Mode Buttons Listeners
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        if (mode) switch3DMode(mode);
      });
    });

    // Reset Camera Button
    const resetCamBtn = document.getElementById('resetCamBtn');
    if (resetCamBtn) {
      resetCamBtn.addEventListener('click', () => {
        targetRotation = { x: 0.2, y: 0.4 };
        targetZoom = (APP_STATE.active3DMode === 'scalp') ? 5.2 : (APP_STATE.active3DMode === 'sapphire' ? 4.8 : 5.5);
      });
    }
  }

  // Handle Canvas Resizing on device rotation or browser resize
  function onWindowResize() {
    if (!container || !camera || !renderer) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  // Main Render Loop
  function renderLoop(time) {
    requestAnimationFrame(renderLoop);
    pulseTimer += 0.016;

    // Smooth Damping (Lerp)
    currentRotation.x += (targetRotation.x - currentRotation.x) * 0.08;
    currentRotation.y += (targetRotation.y - currentRotation.y) * 0.08;
    currentZoom += (targetZoom - currentZoom) * 0.08;

    camera.position.z = currentZoom;

    // Auto idle slow turntable rotation if not actively dragging
    if (!isDragging) {
      targetRotation.y += 0.0018;
    }

    if (activeSceneGroup) {
      activeSceneGroup.rotation.x = currentRotation.x;
      activeSceneGroup.rotation.y = currentRotation.y;

      // Mode-specific micro-animations
      if (APP_STATE.active3DMode === 'scalp') {
        if (graftTargetsGroup && graftTargetsGroup.children.length > 0) {
          const pulse = (Math.sin(pulseTimer * 3.5) + 1.0) * 0.5;
          graftTargetsGroup.children.forEach(target => {
            if (target.material) {
              target.material.opacity = 0.55 + pulse * 0.40;
            }
          });
        }
      } else if (APP_STATE.active3DMode === 'sapphire') {
        // Subtle levitation wobble
        activeSceneGroup.position.y = Math.sin(pulseTimer * 2) * 0.08;
      } else if (APP_STATE.active3DMode === 'cellular') {
        // Rotate internal molecular rings
        activeSceneGroup.children.forEach((child, idx) => {
          if (child.isMesh && child.geometry.type === 'TorusGeometry') {
            child.rotation.z += 0.01 * (idx % 2 === 0 ? 1 : -1);
          }
        });
      }
    }

    renderer.render(scene, camera);
  }

  // =========================================================================
  // 2. INTERACTIVE NORWOOD SCALE & GRAFT CALCULATOR
  // =========================================================================
  function initNorwoodCalculator() {
    const slider = document.getElementById('norwoodSlider');
    const stageLabelDisplay = document.getElementById('stageLabelDisplay');
    const graftCountDisplay = document.getElementById('graftCountDisplay');
    const durationDisplay = document.getElementById('durationDisplay');
    const zonesDisplay = document.getElementById('zonesDisplay');
    const costEstimateDisplay = document.getElementById('costEstimateDisplay');

    if (!slider) return;

    function updateCalculator() {
      const stage = parseInt(slider.value, 10);
      APP_STATE.norwoodStage = stage;
      const data = NORWOOD_DATA[stage] || NORWOOD_DATA[3];

      // Update Slider Ticks Active Class
      const ticks = document.querySelectorAll('.slider-ticks span');
      ticks.forEach((tick, idx) => {
        tick.classList.toggle('active', idx + 1 === stage);
      });

      // Update Diagnostic Labels
      if (stageLabelDisplay) stageLabelDisplay.textContent = data.title;

      // Calculate graft range based on density goal
      const densityMultiplier = (APP_STATE.densityGoal === 'dense') ? 1.25 : 1.0;
      const minGrafts = Math.round(data.baseGrafts[0] * densityMultiplier);
      const maxGrafts = Math.round(data.baseGrafts[1] * densityMultiplier);

      if (graftCountDisplay) {
        graftCountDisplay.textContent = `${minGrafts.toLocaleString('en-IN')} – ${maxGrafts.toLocaleString('en-IN')}`;
      }

      if (durationDisplay) durationDisplay.textContent = data.duration;

      // Update Focus Zones
      if (zonesDisplay) {
        zonesDisplay.innerHTML = '';
        data.zones.forEach(zone => {
          const span = document.createElement('span');
          span.className = 'zone-tag';
          span.textContent = zone;
          zonesDisplay.appendChild(span);
        });
      }

      // Calculate Estimated Package Cost
      // Technique multiplier: Sapphire: ₹25, DHI: ₹35, Combo: ₹30
      const avgGrafts = (minGrafts + maxGrafts) / 2;
      let calculatedCost = Math.round(avgGrafts * APP_STATE.techniqueRate);
      // Floor at base package
      if (calculatedCost < data.basePackage) calculatedCost = data.basePackage;

      if (costEstimateDisplay) {
        costEstimateDisplay.textContent = '₹' + calculatedCost.toLocaleString('en-IN');
      }

      // Sync with 3D Human Scalp & Hair Model
      updateHumanHairForNorwood(stage);

      // Update Info Chip if in Scalp mode
      const chipTitle = document.getElementById('chipTitle');
      if (chipTitle && APP_STATE.active3DMode === 'scalp') {
        chipTitle.textContent = `3D Human Model · Norwood Stage ${stage} (${minGrafts}–${maxGrafts} Grafts)`;
      }
    }

    slider.addEventListener('input', updateCalculator);

    // Technique Buttons
    const techButtons = document.querySelectorAll('.tech-btn');
    techButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        techButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        APP_STATE.technique = btn.dataset.tech;
        APP_STATE.techniqueRate = parseInt(btn.dataset.rate, 10) || 25;
        updateCalculator();
      });
    });

    // Goal Buttons
    const goalButtons = document.querySelectorAll('.goal-btn');
    goalButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        goalButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        APP_STATE.densityGoal = btn.dataset.density;
        updateCalculator();
      });
    });

    // Calc Book Button
    const calcBookBtn = document.getElementById('calcBookBtn');
    if (calcBookBtn) {
      calcBookBtn.addEventListener('click', () => {
        const stage = APP_STATE.norwoodStage;
        const notes = document.getElementById('patientNotes');
        if (notes) {
          notes.value = `Norwood Stage ${stage} diagnostic inquiry. Preferred technique: ${APP_STATE.technique.toUpperCase()}.`;
        }
        const bookingSection = document.getElementById('booking');
        if (bookingSection) {
          bookingSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    // Initial Trigger
    updateCalculator();
  }

  // =========================================================================
  // 3. BEFORE & AFTER INTERACTIVE DUAL SLIDER
  // =========================================================================
  function initBeforeAfterSlider() {
    const container = document.getElementById('compareContainer');
    const beforeLayer = document.getElementById('beforeLayer');
    const handle = document.getElementById('compareHandle');
    const beforeCanvas = document.getElementById('beforeCanvas');
    const afterCanvas = document.getElementById('afterCanvas');
    const caseTitleDisplay = document.getElementById('caseTitleDisplay');
    const caseDetailsDisplay = document.getElementById('caseDetailsDisplay');

    if (!container || !beforeLayer || !handle) return;

    let isSliding = false;
    let currentPercent = 50;

    function renderCaseCanvases(caseId) {
      const c = CASE_STUDIES[caseId] || CASE_STUDIES[1];
      const badgeEl = document.getElementById('caseBadgeDisplay');
      const titleEl = document.getElementById('caseTitleDisplay');
      const detailsEl = document.getElementById('caseDetailsDisplay');
      const retentionEl = document.getElementById('statRetention');
      const graftsEl = document.getElementById('statGrafts');
      const timeEl = document.getElementById('statTime');
      const growthEl = document.getElementById('statGrowth');

      if (badgeEl) badgeEl.textContent = c.badge;
      if (titleEl) titleEl.textContent = c.title;
      if (detailsEl) detailsEl.textContent = c.details;
      if (retentionEl) retentionEl.textContent = c.retention;
      if (graftsEl) graftsEl.textContent = c.grafts;
      if (timeEl) timeEl.textContent = c.time;
      if (growthEl) growthEl.textContent = c.growth;

      // Sync active state on case switcher tabs
      document.querySelectorAll('.case-tab').forEach(tab => {
        tab.classList.toggle('active', parseInt(tab.dataset.case, 10) === caseId);
      });

      // Sync active state on gallery cards
      document.querySelectorAll('.clinical-gallery-card').forEach(card => {
        card.classList.toggle('active', parseInt(card.dataset.case, 10) === caseId);
      });

      // Draw real patient clinical photographs on 2D canvases
      drawHairCanvas(beforeCanvas, c, true);
      drawHairCanvas(afterCanvas, c, false);
    }

    function drawHairCanvas(canvasContainer, caseData, isBefore) {
      if (!canvasContainer) return;
      canvasContainer.innerHTML = '';

      const canvas = document.createElement('canvas');
      // High-DPI crisp clinical resolution (matching 550x740 ratio)
      canvas.width = 1100;
      canvas.height = 1480;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      const ctx = canvas.getContext('2d');
      const W = canvas.width;
      const H = canvas.height;

      const imgSrc = isBefore ? caseData.beforeImage : caseData.afterImage;

      function renderFrame(img) {
        ctx.clearRect(0, 0, W, H);

        // 1. Surgical background
        ctx.fillStyle = '#081714';
        ctx.fillRect(0, 0, W, H);

        // 2. Draw patient photograph (preserving high fidelity)
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, 0, 0, W, H);
        }

        // 3. Clinical vignette overlay
        const vignette = ctx.createLinearGradient(0, 0, 0, H);
        vignette.addColorStop(0, 'rgba(5, 16, 14, 0.4)');
        vignette.addColorStop(0.12, 'rgba(5, 16, 14, 0)');
        vignette.addColorStop(0.85, 'rgba(5, 16, 14, 0)');
        vignette.addColorStop(1, 'rgba(5, 16, 14, 0.65)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, W, H);

        // 4. Subtle anatomical measurement grid overlay
        ctx.strokeStyle = 'rgba(197, 160, 89, 0.06)';
        ctx.lineWidth = 1;
        for (let x = 110; x < W; x += 110) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, H);
          ctx.stroke();
        }
        for (let y = 148; y < H; y += 148) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(W, y);
          ctx.stroke();
        }

        // 5. Authentic surgical watermark & doctor attribution
        ctx.textAlign = 'right';
        ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 10;
        ctx.fillText('CONTOUR COSMETIC CLINIC', W - 32, H - 60);

        ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#c5a059';
        ctx.fillText('Dr. Saket Jha · ' + caseData.grafts, W - 32, H - 28);
        ctx.shadowBlur = 0; // reset shadow
      }

      const cached = IMAGE_CACHE[imgSrc];
      if (cached && cached.complete && cached.naturalWidth > 0) {
        renderFrame(cached);
      } else {
        // Fallback loading indicator
        ctx.fillStyle = '#0d231e';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#c5a059';
        ctx.font = '600 26px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Loading Patient Photography...', W / 2, H / 2);

        const img = new Image();
        img.onload = () => {
          IMAGE_CACHE[imgSrc] = img;
          renderFrame(img);
        };
        img.src = imgSrc;
      }

      canvasContainer.appendChild(canvas);
    }

    // Set Slider Position with full clipping and coordinate stability
    function setSliderPosition(clientX) {
      const rect = container.getBoundingClientRect();
      let percent = ((clientX - rect.left) / rect.width) * 100;
      percent = Math.max(0, Math.min(100, percent));
      currentPercent = percent;

      // Update clip-path smoothly without resizing underlying canvas
      beforeLayer.style.clipPath = `polygon(0 0, ${percent}% 0, ${percent}% 100%, 0 100%)`;
      beforeLayer.style.webkitClipPath = `polygon(0 0, ${percent}% 0, ${percent}% 100%, 0 100%)`;
      handle.style.left = `${percent}%`;

      handle.setAttribute('aria-valuenow', Math.round(percent));
    }

    // Modern Unified Pointer Events (Mouse, Touch, Stylus)
    container.addEventListener('pointerdown', (e) => {
      isSliding = true;
      try {
        container.setPointerCapture(e.pointerId);
      } catch (err) {}
      setSliderPosition(e.clientX);
    });

    container.addEventListener('pointermove', (e) => {
      if (!isSliding) return;
      setSliderPosition(e.clientX);
    });

    const stopSliding = (e) => {
      if (isSliding && e && e.pointerId) {
        try {
          container.releasePointerCapture(e.pointerId);
        } catch (err) {}
      }
      isSliding = false;
    };

    container.addEventListener('pointerup', stopSliding);
    container.addEventListener('pointercancel', stopSliding);

    // Fallback Touch listeners with non-passive touchmove for older mobile engines
    container.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length === 1) {
        isSliding = true;
        setSliderPosition(e.touches[0].clientX);
      }
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      if (!isSliding || !e.touches || e.touches.length !== 1) return;
      e.preventDefault(); // Prevent scroll while sliding
      setSliderPosition(e.touches[0].clientX);
    }, { passive: false });

    container.addEventListener('touchend', () => {
      isSliding = false;
    });

    // Keyboard Accessibility
    handle.setAttribute('tabindex', '0');
    handle.setAttribute('role', 'slider');
    handle.setAttribute('aria-label', 'Before and After Hairline Comparison Slider');
    handle.setAttribute('aria-valuemin', '0');
    handle.setAttribute('aria-valuemax', '100');
    handle.setAttribute('aria-valuenow', '50');

    handle.addEventListener('keydown', (e) => {
      const rect = container.getBoundingClientRect();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSliderPosition(rect.left + (rect.width * Math.max(0, currentPercent - 5) / 100));
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSliderPosition(rect.left + (rect.width * Math.min(100, currentPercent + 5) / 100));
      }
    });

    // Case Tabs
    const caseTabs = document.querySelectorAll('.case-tab');
    caseTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        caseTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const caseId = parseInt(tab.dataset.case, 10) || 1;
        APP_STATE.activeCase = caseId;
        renderCaseCanvases(caseId);
      });
    });

    // Gallery Card Clicks
    const galleryCards = document.querySelectorAll('.clinical-gallery-card');
    galleryCards.forEach(card => {
      card.addEventListener('click', () => {
        const caseId = parseInt(card.dataset.case, 10) || 1;
        APP_STATE.activeCase = caseId;
        renderCaseCanvases(caseId);
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const caseId = parseInt(card.dataset.case, 10) || 1;
          APP_STATE.activeCase = caseId;
          renderCaseCanvases(caseId);
          container.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    });

    // Initial render & center handle
    renderCaseCanvases(1);
    setSliderPosition(container.getBoundingClientRect().left + container.clientWidth * 0.5);
  }

  // =========================================================================
  // 4. FAQ ACCORDION
  // =========================================================================
  function initFAQAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
      const trigger = item.querySelector('.faq-trigger');
      const content = item.querySelector('.faq-content');

      if (!trigger || !content) return;

      trigger.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        // Close other open items
        faqItems.forEach(other => {
          if (other !== item && other.classList.contains('open')) {
            other.classList.remove('open');
            other.querySelector('.faq-trigger').setAttribute('aria-expanded', 'false');
            other.querySelector('.faq-content').style.maxHeight = null;
          }
        });

        // Toggle current item
        if (isOpen) {
          item.classList.remove('open');
          trigger.setAttribute('aria-expanded', 'false');
          content.style.maxHeight = null;
        } else {
          item.classList.add('open');
          trigger.setAttribute('aria-expanded', 'true');
          content.style.maxHeight = content.scrollHeight + 'px';
        }
      });
    });
  }

  // =========================================================================
  // 5. APPOINTMENT FORM & WHATSAPP INTEGRATION
  // =========================================================================
  function initAppointmentForm() {
    const form = document.getElementById('appointmentForm');
    const successBanner = document.getElementById('formSuccessMessage');

    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('patientName').value.trim();
      const phone = document.getElementById('patientPhone').value.trim();
      const treatment = document.getElementById('treatmentSelect').value;
      const doctor = document.getElementById('doctorSelect').value;
      const notes = document.getElementById('patientNotes').value.trim();

      // Build WhatsApp Pre-Filled Message
      const message = `*Contour Cosmetic Clinic Appointment Request*\n\n` +
        `• *Patient Name:* ${name}\n` +
        `• *Phone:* ${phone}\n` +
        `• *Procedure:* ${treatment}\n` +
        `• *Specialist:* ${doctor}\n` +
        `• *Norwood Stage Estimate:* Stage ${APP_STATE.norwoodStage}\n` +
        (notes ? `• *Notes:* ${notes}\n` : '') +
        `\n_Sent via Contour 3D Interactive Web Concierge_`;

      const encoded = encodeURIComponent(message);
      const whatsappUrl = `https://api.whatsapp.com/send?phone=918660432589&text=${encoded}`;

      if (successBanner) {
        successBanner.style.display = 'block';
        successBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      // Open WhatsApp in new tab for instant real-time patient-clinic connection
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
      }, 600);
    });
  }

  // =========================================================================
  // 6. RESPONSIVE NAVIGATION & SCROLL TRACKING
  // =========================================================================
  function initNavigation() {
    const header = document.getElementById('navbar');
    const mobileToggle = document.getElementById('mobileToggle');
    const mobileDrawer = document.getElementById('mobileDrawer');
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');

    // Sticky Header Scroll Class
    window.addEventListener('scroll', () => {
      if (header) {
        header.classList.toggle('scrolled', window.scrollY > 20);
      }
    }, { passive: true });

    // Mobile Toggle
    if (mobileToggle && mobileDrawer) {
      mobileToggle.addEventListener('click', () => {
        const isOpen = mobileDrawer.classList.contains('open');
        mobileDrawer.classList.toggle('open', !isOpen);
        mobileToggle.classList.toggle('active', !isOpen);
      });
    }

    // Close mobile drawer on link click
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (mobileDrawer) mobileDrawer.classList.remove('open');
        if (mobileToggle) mobileToggle.classList.remove('active');
      });
    });
  }

  // DOM Content Loaded Initializer
  document.addEventListener('DOMContentLoaded', () => {
    initThreeEngine();
    initNorwoodCalculator();
    initBeforeAfterSlider();
    initFAQAccordion();
    initAppointmentForm();
    initNavigation();
  });

})();
