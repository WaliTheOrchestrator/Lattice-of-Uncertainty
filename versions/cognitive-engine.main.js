// ============================================================================
// VERSION ARCHIVE — "The Cognitive Engine" (~212 lines, transcript part 12)
// The bare-metal version: simplified visuals, 2-oscillator binaural audio,
// mouse-only telemetry, powered by the Rust/Wasm QuantumOracle.
// Drop-in replacement for src/main.js (requires src/pkg/ from wasm-pack).
// ============================================================================

import * as THREE from 'three';
import gsap from 'gsap';
import init, { QuantumOracle } from './pkg/quantum_markov.js';

class QuantumLatticeExperience {
  constructor() {
    // 1. State & Telemetry
    this.gazeNDC = new THREE.Vector2(0, 0);
    this.prevGazeNDC = new THREE.Vector2(0, 0);
    this.gazeWorld = new THREE.Vector3(0, 0, 0);
    this.momentum = 0;
    this.isAIReady = false;

    // 2. Memory & Observation
    this.userBehaviorLog = [];
    this.lastLogTime = 0;
    this.oracle = null;
    this.raycaster = new THREE.Raycaster();
    this.clock = new THREE.Clock();

    // 3. Audio Nodes (Dormant)
    this.audioCtx = null;
    this.isAudioAwake = false;

    // 4. Initialization Sequence
    this.initScene();
    this.initMesh();
    this.bindEvents();
    this.awakenOracle();
    this.clock.start();
    this.render();
  }

  async awakenOracle() {
    await init();
    this.oracle = new QuantumOracle();
    console.log("[Lattice] Rust Wasm Oracle online. Memory allocated.");
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050505); // Obsidian Void
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.z = 5;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(this.renderer.domElement);
  }

  initMesh() {
    const geometry = new THREE.IcosahedronGeometry(2, 64);

    // Shader encapsulates Quantum Wave-Function collapse (observation alters reality)
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorObsidian: { value: new THREE.Color(0x0b0c10) },
        uColorGold: { value: new THREE.Color(0xffd700) }, // Alchemy/Enlightenment
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
        uniform float uOpacity;
        uniform float uObservation;
        varying vec3 vWorldPosition;
        void main() {
          // Simplified fluid distortion for elite performance
          float noise = sin(vWorldPosition.x * 3.0 + uTime) * cos(vWorldPosition.y * 3.0 - uTime);
          vec3 baseColor = mix(uColorObsidian, uColorGold, (noise + 1.0) * 0.1 * uObservation);
          gl_FragColor = vec4(baseColor + vec3(0.0, 0.5, 0.8) * (uObservation * 0.2), uOpacity);
        }
      `,
      transparent: true, depthWrite: false
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.mesh);
  }

  igniteAcoustics() {
    if (!this.audioCtx) return;
    this.masterVolume = this.audioCtx.createGain();
    this.masterVolume.gain.value = 0.5;
    this.masterVolume.connect(this.audioCtx.destination);

    // 150Hz baseline avoids sub-bass hardware limitations
    this.humVolume = this.audioCtx.createGain();
    this.humVolume.gain.value = 0;
    this.humVolume.connect(this.masterVolume);

    this.oscLeft = this.audioCtx.createOscillator();
    this.oscLeft.frequency.value = 150.0;
    const pannerLeft = this.audioCtx.createStereoPanner();
    pannerLeft.pan.value = -1.0;
    this.oscLeft.connect(pannerLeft).connect(this.humVolume);

    this.oscRight = this.audioCtx.createOscillator();
    this.oscRight.frequency.value = 154.0; // 4Hz Theta difference
    const pannerRight = this.audioCtx.createStereoPanner();
    pannerRight.pan.value = 1.0;
    this.oscRight.connect(pannerRight).connect(this.humVolume);

    this.oscLeft.start();
    this.oscRight.start();
  }

  bindEvents() {
    window.addEventListener('mousemove', (e) => {
      this.gazeNDC.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      const vector = new THREE.Vector3(this.gazeNDC.x, this.gazeNDC.y, 0.5).unproject(this.camera);
      const dir = vector.sub(this.camera.position).normalize();
      this.gazeWorld.copy(this.camera.position.clone().add(dir.multiplyScalar(-this.camera.position.z / dir.z)));
    });

    window.addEventListener('click', () => {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
      }
      if (this.audioCtx && !this.isAudioAwake) {
        this.audioCtx.resume().then(() => {
          this.isAudioAwake = true;
          this.igniteAcoustics();
        });
      }
    });

    // Press 'P' to trigger the Wasm Hallucination
    window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'p' && this.oracle && this.userBehaviorLog.length > 20) {
        // Flatten the coordinate array for Rust
        const flatCoords = new Float64Array(this.userBehaviorLog.flatMap(log => [log.x, log.y]));
        const predictions = this.oracle.hallucinate_trajectory(flatCoords, window.innerWidth, window.innerHeight, 50);
        console.log("[Oracle] 5-Second Trajectory Hallucinated.");
        this.drawGhostPath(predictions);
      }
    });
  }

  drawGhostPath(flatPredictions) {
    for (let i = 0; i < flatPredictions.length; i += 2) {
      const dot = document.createElement('div');
      dot.style.cssText = `position:absolute; left:${flatPredictions[i]}px; top:${flatPredictions[i + 1]}px; width:4px; height:4px; background:cyan; border-radius:50%; pointer-events:none; z-index:99; opacity:0;`;
      document.body.appendChild(dot);
      gsap.to(dot, { opacity: 0.8, duration: 0.5, delay: (i / 2) * 0.1, yoyo: true, repeat: 1, onComplete: () => dot.remove() });
    }
  }

  updatePhysics(deltaTime) {
    this.material.uniforms.uTime.value = this.clock.getElapsedTime();
    this.material.uniforms.uWorldGaze.value.copy(this.gazeWorld);

    // Exponential Moving Average for Kinetic Momentum
    const dx = this.gazeNDC.x - this.prevGazeNDC.x;
    const dy = this.gazeNDC.y - this.prevGazeNDC.y;
    this.momentum = THREE.MathUtils.lerp(this.momentum, (dx * dx + dy * dy) / (deltaTime || 0.016), 0.15);
    this.prevGazeNDC.copy(this.gazeNDC);

    // Quantum Observation Collapse
    this.raycaster.setFromCamera(this.gazeNDC, this.camera);
    const isObserved = this.raycaster.intersectObject(this.mesh).length > 0;
    this.material.uniforms.uObservation.value = THREE.MathUtils.lerp(this.material.uniforms.uObservation.value, isObserved ? 1.0 : 0.0, 0.05);

    // Audio Entanglement
    if (this.isAudioAwake && this.humVolume && this.oscLeft) {
      const nE = Math.min(this.momentum, 0.2) / 0.2;
      this.oscLeft.frequency.value = 150.0 + (nE * 80.0);
      this.oscRight.frequency.value = (150.0 + (nE * 80.0)) + (4.0 + (nE * 8.0));
      this.humVolume.gain.value = 0.2 + (nE * 0.5);
    }

    // The Silent Observer Data Ingestion
    const currentElapsed = this.clock.getElapsedTime();
    if (currentElapsed - this.lastLogTime >= 0.1) {
      this.userBehaviorLog.push({
        x: ((this.gazeNDC.x + 1) / 2) * window.innerWidth,
        y: ((-this.gazeNDC.y + 1) / 2) * window.innerHeight
      });
      if (this.userBehaviorLog.length > 150) this.userBehaviorLog.shift(); // Keep last 15 seconds
      this.lastLogTime = currentElapsed;
    }
  }

  render = () => {
    requestAnimationFrame(this.render);
    this.updatePhysics(this.clock.getDelta());
    this.renderer.render(this.scene, this.camera);
  }
}

new QuantumLatticeExperience();
