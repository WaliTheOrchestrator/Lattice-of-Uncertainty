// ============================================================================
// THE LATTICE OF UNCERTAINTY — Ultimate Hybrid Architecture (main.js)
// Final version before context loss (reconstructed from transcript part 13).
// Fuses: GeoJS planetary anchoring, 3-oscillator acoustics, quantum shaders,
// WebGazer biometric eye tracking, and the Rust/Wasm predictive Oracle.
// Requires the compiled Rust pkg/ folder (see quantum_markov/ + README).
// ============================================================================

import * as THREE from 'three';
import gsap from 'gsap';
import init, { QuantumOracle } from './pkg/quantum_markov.js';

class QuantumLatticeHybrid {
  constructor() {
    // 1. Biometric & Kinetic State
    this.gazeNDC = new THREE.Vector2(0, 0);
    this.prevGazeNDC = new THREE.Vector2(0, 0);
    this.gazeWorld = new THREE.Vector3(0, 0, 0);
    this.momentum = 0;
    this.isAIReady = false;

    // 2. Geospatial Anchors & Optics
    this.physicalGaze = null;
    this.targetAtmosphereColor = new THREE.Color(0x050505);

    // 3. Memory & Prediction (Rust/Wasm)
    this.userBehaviorLog = [];
    this.lastLogTime = 0;
    this.oracle = null;

    // 4. Engine & Acoustics
    this.raycaster = new THREE.Raycaster();
    this.clock = new THREE.Clock();
    this.audioCtx = null;
    this.isAudioAwake = false;

    // 5. Asynchronous Ignition Sequence
    this.initScene();
    this.initMesh();
    this.bindEvents();

    // Non-blocking initialization
    Promise.all([
      this.awakenOracle(),
      this.fetchLocalReality(),
      this.initObserver()
    ]).then(() => {
      console.log("[Lattice] Hybrid System Online. All threads harmonized.");
      this.clock.start();
      this.render();
    });
  }

  // ==========================================
  // I. CORE ASYNC INITIALIZATION (Optimized)
  // ==========================================
  async awakenOracle() {
    await init();
    this.oracle = new QuantumOracle();
  }

  async fetchLocalReality() {
    try {
      // Async fetch prevents UI blocking
      const response = await fetch('https://get.geojs.io/v1/ip/geo.json');
      const data = await response.json();
      this.physicalGaze = { lat: parseFloat(data.latitude), lng: parseFloat(data.longitude) };
      // Simulate real-world atmospheric color based on location (simplified for GPU optimization)
      this.targetAtmosphereColor.setHSL(Math.abs(this.physicalGaze.lat) / 90, 0.5, 0.1);
    } catch (e) {
      console.warn('[Lattice] Observer untraceable. Void active.');
    }
  }

  async initObserver() {
    // WebGazer is heavy. We load it lazily only when window is ready.
    if (typeof webgazer === 'undefined') return;
    webgazer.setGazeListener((data) => {
      if (!data) return;
      this.isAIReady = true;
      this.gazeNDC.set((data.x / window.innerWidth) * 2 - 1, -(data.y / window.innerHeight) * 2 + 1);
    }).saveDataAcrossSessions(false) // Optimized: Don't read/write to local storage constantly
      .applyKalmanFilter(true).showVideo(false).showPredictionPoints(false).begin();
  }

  // ==========================================
  // II. VISUAL ENGINE & SHADERS
  // ==========================================
  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050505);
    this.scene.fog = new THREE.FogExp2(0x050505, 0.05);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.z = 5;

    // Hardware Optimization: Cap pixel ratio to 1.5 to save GPU cycles on 4K screens
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    document.body.appendChild(this.renderer.domElement);
  }

  initMesh() {
    const geometry = new THREE.IcosahedronGeometry(2, 32); // Reduced from 64 to 32 for vertex optimization

    // The FBM / Voronoi Hybrid Shader (Math reduced by 50% for performance)
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorObsidian: { value: new THREE.Color(0x0b0c10) },
        uColorGold: { value: new THREE.Color(0xffd700) },
        uAtmosphereColor: { value: new THREE.Color(0x050505) },
        uOpacity: { value: 0.8 },
        uObservation: { value: 0.0 },
        uWorldGaze: { value: new THREE.Vector3(0, 0, 0) },
      },
      vertexShader: `
        uniform vec3 uWorldGaze;
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          float dist = distance(worldPosition.xyz, uWorldGaze);
          worldPosition.xyz -= normalize(normalMatrix * normal) * (exp(-dist * dist * 2.5) * 0.45);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColorObsidian;
        uniform vec3 uColorGold;
        uniform vec3 uAtmosphereColor;
        uniform float uOpacity;
        uniform float uObservation;
        varying vec3 vWorldPosition;

        // Optimized Pseudo-Noise
        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

        void main() {
          float noise = hash(vWorldPosition.xy * 2.0 + uTime * 0.1);
          vec3 baseColor = mix(uColorObsidian, uAtmosphereColor, noise * 0.5);
          // Observation triggers the gold alchemical state
          vec3 finalColor = mix(baseColor, uColorGold, uObservation * noise);
          finalColor += vec3(0.0, 0.5, 0.8) * (uObservation * 0.3);
          gl_FragColor = vec4(finalColor, uOpacity);
        }
      `,
      transparent: true, depthWrite: false
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.mesh);

    // Wireframe ghosting
    this.wireMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true, transparent: true, opacity: 0.05 }));
    this.scene.add(this.wireMesh);
  }

  // ==========================================
  // III. 3-OSCILLATOR ACOUSTICS
  // ==========================================
  igniteAcoustics() {
    this.masterVolume = this.audioCtx.createGain();
    this.masterVolume.gain.value = 0.5;
    this.masterVolume.connect(this.audioCtx.destination);

    this.humVolume = this.audioCtx.createGain();
    this.humVolume.gain.value = 0;
    this.humVolume.connect(this.masterVolume);

    // Binaural Theta Left
    this.oscLeft = this.audioCtx.createOscillator();
    this.oscLeft.frequency.value = 150.0;
    const pannerLeft = this.audioCtx.createStereoPanner();
    pannerLeft.pan.value = -1.0;
    this.oscLeft.connect(pannerLeft).connect(this.humVolume);

    // Binaural Theta Right
    this.oscRight = this.audioCtx.createOscillator();
    this.oscRight.frequency.value = 154.0;
    const pannerRight = this.audioCtx.createStereoPanner();
    pannerRight.pan.value = 1.0;
    this.oscRight.connect(pannerRight).connect(this.humVolume);

    // Diabolus in Musica (Stress)
    this.stressVolume = this.audioCtx.createGain();
    this.stressVolume.gain.value = 0;
    this.stressVolume.connect(this.masterVolume);

    this.oscStress = this.audioCtx.createOscillator();
    this.oscStress.type = 'sawtooth';
    this.oscStress.frequency.value = 150.0 * 1.414;
    this.oscStress.connect(this.stressVolume);

    this.oscLeft.start(); this.oscRight.start(); this.oscStress.start();
  }

  // ==========================================
  // IV. EVENT BINDING & RUST HALLUCINATION
  // ==========================================
  bindEvents() {
    window.addEventListener('mousemove', (e) => {
      if (!this.isAIReady) { // Fallback if WebGazer is loading
        this.gazeNDC.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      }
    });

    window.addEventListener('click', () => {
      if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.audioCtx && !this.isAudioAwake) {
        this.audioCtx.resume().then(() => {
          this.isAudioAwake = true;
          this.igniteAcoustics();
        });
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'p' && this.oracle && this.userBehaviorLog.length > 20) {
        const flatCoords = new Float64Array(this.userBehaviorLog.flatMap(log => [log.x, log.y]));
        const predictions = this.oracle.hallucinate_trajectory(flatCoords, window.innerWidth, window.innerHeight, 50);
        this.drawGhostPath(predictions);
      }
    });
  }

  drawGhostPath(flatPredictions) {
    for (let i = 0; i < flatPredictions.length; i += 2) {
      const dot = document.createElement('div');
      dot.style.cssText = `position:absolute; left:${flatPredictions[i]}px; top:${flatPredictions[i + 1]}px; width:5px; height:5px; background:cyan; border-radius:50%; pointer-events:none; z-index:99; opacity:0; box-shadow: 0 0 10px cyan;`;
      document.body.appendChild(dot);
      gsap.to(dot, { opacity: 1, duration: 0.3, delay: (i / 2) * 0.05, yoyo: true, repeat: 1, onComplete: () => dot.remove() });
    }
  }

  // ==========================================
  // V. MASTER PHYSICS ENGINE (Decoupled & Optimized)
  // ==========================================
  updatePhysics(deltaTime) {
    this.material.uniforms.uTime.value = this.clock.getElapsedTime();

    // Map NDC back to World space for the shader
    const vector = new THREE.Vector3(this.gazeNDC.x, this.gazeNDC.y, 0.5).unproject(this.camera);
    const dir = vector.sub(this.camera.position).normalize();
    this.gazeWorld.copy(this.camera.position.clone().add(dir.multiplyScalar(-this.camera.position.z / dir.z)));
    this.material.uniforms.uWorldGaze.value.copy(this.gazeWorld);

    // Physics Momentum (Lerp for smooth transition)
    const dx = this.gazeNDC.x - this.prevGazeNDC.x;
    const dy = this.gazeNDC.y - this.prevGazeNDC.y;
    this.momentum = THREE.MathUtils.lerp(this.momentum, (dx * dx + dy * dy) / (deltaTime || 0.016), 0.15);
    this.prevGazeNDC.copy(this.gazeNDC);

    // Mesh transforms based on kinetic energy
    let targetScale = this.momentum > 0.03 ? 1.5 + (this.momentum * 1.5) : 1.0;
    this.mesh.scale.setScalar(THREE.MathUtils.lerp(this.mesh.scale.x, targetScale, 0.08));
    this.mesh.rotation.x += (this.gazeNDC.y * 0.4 - this.mesh.rotation.x) * 0.05;
    this.mesh.rotation.y += (this.gazeNDC.x * 0.4 - this.mesh.rotation.y) * 0.05;
    this.wireMesh.rotation.copy(this.mesh.rotation);
    this.wireMesh.scale.copy(this.mesh.scale);

    // Quantum Collapse Raycaster
    this.raycaster.setFromCamera(this.gazeNDC, this.camera);
    const isObserved = this.raycaster.intersectObject(this.mesh).length > 0;
    this.material.uniforms.uObservation.value = THREE.MathUtils.lerp(this.material.uniforms.uObservation.value, isObserved ? 1.0 : 0.0, 0.05);

    // Sync Background to planetary logic
    this.scene.background.lerp(this.targetAtmosphereColor, 0.01);
    this.material.uniforms.uAtmosphereColor.value.lerp(this.targetAtmosphereColor, 0.01);

    // 3-Oscillator Audio Entanglement
    if (this.isAudioAwake && this.humVolume) {
      const nE = Math.min(this.momentum, 0.2) / 0.2;
      this.oscLeft.frequency.value = 150.0 + (nE * 80.0);
      this.oscRight.frequency.value = (150.0 + (nE * 80.0)) + (4.0 + (nE * 8.0));
      this.humVolume.gain.value = 0.2 + (nE * 0.5);
      this.oscStress.frequency.value = (150.0 + (nE * 80.0)) * (1.414 + (Math.pow(nE, 3) * 0.5));
      this.stressVolume.gain.value = Math.pow(nE, 3) * 0.15;
    }

    // THREAD DECOUPLING: Log data only every 100ms, not every frame
    const currentElapsed = this.clock.getElapsedTime();
    if (currentElapsed - this.lastLogTime >= 0.1) {
      this.userBehaviorLog.push({
        x: ((this.gazeNDC.x + 1) / 2) * window.innerWidth,
        y: ((-this.gazeNDC.y + 1) / 2) * window.innerHeight
      });
      if (this.userBehaviorLog.length > 150) this.userBehaviorLog.shift();
      this.lastLogTime = currentElapsed;
    }
  }

  render = () => {
    requestAnimationFrame(this.render);
    this.updatePhysics(this.clock.getDelta());
    this.renderer.render(this.scene, this.camera);
  }
}

new QuantumLatticeHybrid();
