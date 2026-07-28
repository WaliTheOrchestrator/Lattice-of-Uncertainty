// ============================================================================
// VERSION ARCHIVE — "The Sensory Behemoth" (~460 lines, transcript parts 9-11)
// The full-immersion version: Voronoi/FBM Kintsugi shaders, Schlick fresnel,
// GeoJS planetary optics (Rayleigh/Mie), WebGazer, 3-oscillator acoustics.
// All audio fixes applied (click-created AudioContext, direct value injection).
// No Rust/Wasm prediction in this version — purely reactive.
// Drop-in replacement for src/main.js (no pkg/ needed).
// ============================================================================

import * as THREE from 'three';
import gsap from 'gsap';

class QuantumLatticeExperience {
  constructor() {
    // 1. Biometric & Kinetic State
    this.gazeNDC = new THREE.Vector2(0, 0);
    this.prevGazeNDC = new THREE.Vector2(0, 0);
    this.gazeWorld = new THREE.Vector3(0, 0, 0);
    this.momentum = 0;
    this.isAIReady = false;

    // 2. Physics & Engine Memory
    this.raycaster = new THREE.Raycaster();
    this.clock = new THREE.Clock();

    // 3. Geospatial & Temporal Anchors
    this.physicalGaze = null;
    this.baseDate = new Date();
    this.localTimeMs = 0;
    this.targetAtmosphereColor = new THREE.Color(0x050505);

    // 4. Acoustic Reality Nodes (Dormant until click)
    this.audioCtx = null;
    this.masterVolume = null;
    this.isAudioAwake = false;
    this.humVolume = null;
    this.oscLeft = null;
    this.oscRight = null;
    this.stressVolume = null;
    this.oscStress = null;

    // 5. Ignite the Visual Universe
    this.initScene();
    this.initMesh();
    this.initLighting();
    this.initObserver();
    this.bindEvents();

    // 6. Anchor to Physical Reality (Using the open GeoJS API)
    this.fetchLocalReality();

    // 7. Begin Simulation
    this.clock.start();
    this.render();
  }

  // ==========================================
  // I. VISUAL & OPTICAL SETUP
  // ==========================================
  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050505);
    this.scene.fog = new THREE.FogExp2(0x050505, 0.05);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      stencil: false,
      depth: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(this.renderer.domElement);
  }

  createQuantumMaterial() {
    const uniforms = {
      uTime: { value: 0 },
      uColorObsidian: { value: new THREE.Color(0x0b0c10) },
      uColorGold: { value: new THREE.Color(0xffd700) },
      uAtmosphereColor: { value: new THREE.Color(0x050505) },
      uLightPos: { value: new THREE.Vector3(-5, 5, 2) },
      uCameraPos: { value: this.camera.position },
      uOpacity: { value: 0.8 },
      uGlow: { value: 0.0 },
      uObservation: { value: 0.0 },
      uWorldGaze: { value: new THREE.Vector3(0, 0, 0) },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uGazeNDC: { value: new THREE.Vector2(0, 0) },
      uCalibrationFlash: { value: 0.0 }
    };

    const vertexShader = `
      uniform vec3 uWorldGaze;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        // Gaussian Gravity Well (e^(-x^2))
        float dist = distance(worldPosition.xyz, uWorldGaze);
        float pressure = exp(-dist * dist * 2.5);
        worldPosition.xyz -= vNormal * (pressure * 0.45);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `;

    const fragmentShader = `
      uniform float uTime;
      uniform vec3 uColorObsidian;
      uniform vec3 uColorGold;
      uniform vec3 uAtmosphereColor;
      uniform vec3 uLightPos;
      uniform vec3 uCameraPos;
      uniform float uOpacity;
      uniform float uGlow;
      uniform float uObservation;
      uniform float uCalibrationFlash;
      uniform vec2 uResolution;
      uniform vec2 uGazeNDC;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying vec2 vUv;

      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

      vec3 voronoi(vec2 x) {
        vec2 n = floor(x); vec2 f = fract(x); vec2 mg, mr; float md = 8.0;
        for(int j=-1; j<=1; j++)
        for(int i=-1; i<=1; i++) {
          vec2 g = vec2(float(i),float(j)); vec2 o = vec2(hash(n + g));
          o = 0.5 + 0.5*sin(uTime * 0.15 + 6.2831*o); vec2 r = g + o - f;
          float d = dot(r,r); if( d<md ) { md=d; mr=r; mg=g; }
        }
        md = 8.0;
        for(int j=-2; j<=2; j++)
        for(int i=-2; i<=2; i++) {
          vec2 g = mg + vec2(float(i),float(j)); vec2 o = vec2(hash(n + g));
          o = 0.5 + 0.5*sin(uTime * 0.15 + 6.2831*o); vec2 r = g + o - f;
          if( dot(mr-r,mr-r)>0.00001 ) md = min( md, dot( 0.5*(mr+r), normalize(r-mr) ) );
        }
        return vec3(md, mr);
      }

      float fbm(vec3 p) {
        vec3 i = floor(p); vec3 f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(mix(hash(i.xy), hash(i.xy + vec2(1.0, 0.0)), f.x),
          mix(hash(i.xy + vec2(0.0, 1.0)), hash(i.xy + vec2(1.0, 1.0)), f.x), f.y),
          mix(mix(hash(i.xy), hash(i.xy + vec2(1.0, 0.0)), f.x),
          mix(hash(i.xy + vec2(0.0, 1.0)), hash(i.xy + vec2(1.0, 1.0)), f.x), f.y), f.z);
      }

      void main() {
        // Wave Function Collapse Mask (reality only exists within ~100px of the gaze)
        vec2 gazePixel = (uGazeNDC * 0.5 + 0.5) * uResolution;
        float distPx = distance(gl_FragCoord.xy, gazePixel);
        float collapseMask = 1.0 - smoothstep(100.0, 120.0, distPx);
        float finalAlpha = uOpacity * collapseMask * uObservation;
        if (finalAlpha <= 0.005) discard;

        // Schlick's Approximation
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(uCameraPos - vWorldPosition);
        vec3 lightDir = normalize(uLightPos - vWorldPosition);
        vec3 halfVector = normalize(lightDir + viewDir);
        float NdotL = max(dot(normal, lightDir), 0.0);
        float NdotH = max(dot(normal, halfVector), 0.0);

        vec2 uv = vUv * 5.0;
        vec3 v = voronoi(uv);
        float edgeVar = length(vec2(dFdx(v.x), dFdy(v.x)));
        float goldMask = smoothstep(0.05 - edgeVar, 0.0 + edgeVar, v.x);

        vec3 finalColor;
        if (goldMask > 0.5) {
          float spec = pow(NdotH, 32.0);
          vec3 activeGold = mix(uColorGold, vec3(1.0), uCalibrationFlash);
          finalColor = mix(activeGold * 0.2, activeGold * (NdotL + spec), goldMask);
        } else {
          float deepTexture = fbm(vWorldPosition * 3.0);
          vec3 obsidianBase = mix(uColorObsidian, uAtmosphereColor * 0.3, deepTexture);
          float spec = pow(NdotH, 256.0);
          float fresnel = 0.04 + (1.0 - 0.04) * pow(1.0 - max(dot(normal, viewDir), 0.0), 5.0);
          vec3 iridescence = 0.5 + 0.5 * cos(uTime * 0.5 + vWorldPosition.xyx * 3.0 + vec3(0,2,4));
          finalColor = (obsidianBase * NdotL) + (spec * fresnel) + (fresnel * iridescence * 0.25);
          finalColor += uAtmosphereColor * fresnel * 0.5;
        }

        // Chromatic Aberration at the edge of the observer's gaze
        float aberrationIntensity = smoothstep(80.0, 120.0, distPx);
        finalColor.r += aberrationIntensity * 0.1 * uObservation;
        finalColor.b -= aberrationIntensity * 0.05 * uObservation;
        finalColor += vec3(0.0, 0.8, 1.0) * uGlow;
        gl_FragColor = vec4(finalColor, finalAlpha);
      }
    `;

    return new THREE.ShaderMaterial({
      uniforms, vertexShader, fragmentShader, transparent: true, lights: false, depthWrite: false
    });
  }

  initMesh() {
    const geometry = new THREE.IcosahedronGeometry(2, 64);
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff, wireframe: true, transparent: true, opacity: 0.08, depthWrite: false
    });
    this.wireMesh = new THREE.Mesh(geometry, wireMaterial);
    this.scene.add(this.wireMesh);

    this.material = this.createQuantumMaterial();
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.mesh);
  }

  initLighting() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  }

  // ==========================================
  // II. ACOUSTIC REALITY (DSP)
  // ==========================================
  igniteAcoustics() {
    if (!this.audioCtx) return;

    // 1. Theta Wave Binaural Engine (Pitched to 150Hz for laptop speakers)
    this.humVolume = this.audioCtx.createGain();
    this.humVolume.gain.value = 0;
    this.humVolume.connect(this.masterVolume);

    this.oscLeft = this.audioCtx.createOscillator();
    this.oscLeft.type = 'sine';
    this.oscLeft.frequency.value = 150.0;
    const pannerLeft = this.audioCtx.createStereoPanner();
    pannerLeft.pan.value = -1.0;
    this.oscLeft.connect(pannerLeft);
    pannerLeft.connect(this.humVolume);

    this.oscRight = this.audioCtx.createOscillator();
    this.oscRight.type = 'sine';
    this.oscRight.frequency.value = 154.0;
    const pannerRight = this.audioCtx.createStereoPanner();
    pannerRight.pan.value = 1.0;
    this.oscRight.connect(pannerRight);
    pannerRight.connect(this.humVolume);

    // 2. The Diabolus in Musica Engine (Anxiety Sawtooth)
    this.stressVolume = this.audioCtx.createGain();
    this.stressVolume.gain.value = 0;
    this.stressVolume.connect(this.masterVolume);

    this.oscStress = this.audioCtx.createOscillator();
    this.oscStress.type = 'sawtooth';
    this.oscStress.frequency.value = 150.0 * 1.414;
    this.oscStress.connect(this.stressVolume);

    this.oscLeft.start();
    this.oscRight.start();
    this.oscStress.start();
  }

  // ==========================================
  // III. GEOSPATIAL & PLANETARY OPTICS
  // ==========================================
  async fetchLocalReality() {
    try {
      const response = await fetch('https://get.geojs.io/v1/ip/geo.json');
      if (!response.ok) throw new Error('Geospatial anchor failed.');
      const data = await response.json();
      this.physicalGaze = { lat: parseFloat(data.latitude), lng: parseFloat(data.longitude) };
      console.log(`[Quantum Lattice] Anchored to physical reality: ${data.city} (${this.physicalGaze.lat}, ${this.physicalGaze.lng})`);
    } catch (error) {
      console.warn('[Quantum Lattice] Observer untraceable. Defaulting to the origin void.');
      this.physicalGaze = { lat: 0, lng: 0 };
    }
  }

  syncTemporalReality() {
    const elapsedSinceLoad = performance.now();
    const absoluteNow = new Date(this.baseDate.getTime() + elapsedSinceLoad);
    this.localTimeMs = (absoluteNow.getHours() * 3600000) + (absoluteNow.getMinutes() * 60000) + (absoluteNow.getSeconds() * 1000) + absoluteNow.getMilliseconds();
    return { absoluteNow, totalMs: this.localTimeMs };
  }

  calculatePlanetaryOptics(lat, lng, absoluteDate) {
    if (!lat || !lng) return new THREE.Color(0x050505);
    const phi = lat * (Math.PI / 180);
    const dayOfYear = Math.floor((absoluteDate - new Date(absoluteDate.getFullYear(), 0, 0)) / 86400000);
    const delta = 0.409 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));
    const hours = absoluteDate.getHours() + (absoluteDate.getMinutes() / 60);
    const omega = (Math.PI / 12) * (hours - 12);
    const sin_h = Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(omega);
    const elevationAngle = Math.asin(sin_h);
    let airMass = elevationAngle > 0 ? 1 / (Math.sin(elevationAngle) + 0.50572 * Math.pow(elevationAngle * (180 / Math.PI) + 6.07995, -1.6364)) : 100;
    const rayleighBlue = Math.exp(-airMass * 0.08);
    const rayleighGreen = Math.exp(-airMass * 0.04);
    const mieRed = Math.exp(-airMass * 0.01);
    const r = Math.min(1.0, 0.1 + (mieRed * 0.9));
    const g = Math.min(1.0, 0.15 + (rayleighGreen * 0.7));
    const b = Math.min(1.0, 0.2 + (rayleighBlue * 0.8));
    const intensity = Math.max(0.02, Math.sin(elevationAngle));
    return new THREE.Color(r * intensity, g * intensity, b * intensity);
  }

  // ==========================================
  // IV. BIOMETRIC OBSERVER TELEMETRY
  // ==========================================
  mapTo3DSpace(screenX, screenY) {
    const ndcX = (screenX / window.innerWidth) * 2 - 1;
    const ndcY = -(screenY / window.innerHeight) * 2 + 1;
    const vector = new THREE.Vector3(ndcX, ndcY, 0.5);
    vector.unproject(this.camera);
    const dir = vector.sub(this.camera.position).normalize();
    return this.camera.position.clone().add(dir.multiplyScalar(-this.camera.position.z / dir.z));
  }

  initObserver() {
    window.addEventListener('load', () => {
      if (typeof webgazer === 'undefined') return;
      webgazer.setGazeListener((data) => {
        if (!data) return;
        this.isAIReady = true;
        this.gazeNDC.set((data.x / window.innerWidth) * 2 - 1, -(data.y / window.innerHeight) * 2 + 1);
        this.gazeWorld.copy(this.mapTo3DSpace(data.x, data.y));
      }).saveDataAcrossSessions(true).applyKalmanFilter(true).showVideo(false).showPredictionPoints(false).begin();
    });
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      if (this.material) this.material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isAIReady) {
        this.gazeNDC.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
        this.gazeWorld.copy(this.mapTo3DSpace(e.clientX, e.clientY));
      }
    });

    window.addEventListener('click', (e) => {
      if (typeof webgazer !== 'undefined') webgazer.recordScreenPosition(e.clientX, e.clientY, 'click');

      if (this.material && this.material.uniforms) {
        this.material.uniforms.uCalibrationFlash.value = 1.0;
        gsap.to(this.material.uniforms.uCalibrationFlash, { value: 0.0, duration: 1.2, ease: "expo.out" });
      }

      // STRICT AUDIO CONTEXT INITIALIZATION ON USER GESTURE
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
        this.masterVolume = this.audioCtx.createGain();
        this.masterVolume.gain.value = 0.5;
        this.masterVolume.connect(this.audioCtx.destination);
      }

      if (this.audioCtx && !this.isAudioAwake) {
        this.audioCtx.resume().then(() => {
          this.isAudioAwake = true;
          this.igniteAcoustics();
          console.log("[Quantum Lattice] Acoustic reality explicitly bound on click.");
        }).catch(err => console.error("[Quantum Lattice] Audio blocked:", err));
      }
    });
  }

  // ==========================================
  // V. MASTER PHYSICS ENGINE (60FPS)
  // ==========================================
  updatePhysics(deltaTime) {
    const temporalState = this.syncTemporalReality();

    // Throttle Heavy Mathematical Optics (1Hz execution)
    if (Math.floor(temporalState.totalMs) % 1000 === 0 && this.physicalGaze) {
      const newSkyColor = this.calculatePlanetaryOptics(this.physicalGaze.lat, this.physicalGaze.lng, temporalState.absoluteNow);
      this.targetAtmosphereColor.copy(newSkyColor);
    }

    const bleedSpeed = (deltaTime || 0.016) * 0.5;
    this.scene.background.lerp(this.targetAtmosphereColor, bleedSpeed);
    this.scene.fog.color.lerp(this.targetAtmosphereColor, bleedSpeed);
    if (this.material) this.material.uniforms.uAtmosphereColor.value.lerp(this.targetAtmosphereColor, bleedSpeed);

    if (this.material) {
      this.material.uniforms.uTime.value = this.clock.getElapsedTime();
      this.material.uniforms.uWorldGaze.value.copy(this.gazeWorld);
      this.material.uniforms.uGazeNDC.value.copy(this.gazeNDC);
    }

    // Kinetic Momentum (Exponential Moving Average)
    const dx = this.gazeNDC.x - this.prevGazeNDC.x;
    const dy = this.gazeNDC.y - this.prevGazeNDC.y;
    const instantMomentum = (dx * dx + dy * dy) / (deltaTime || 0.016);
    this.momentum = THREE.MathUtils.lerp(this.momentum, instantMomentum, 0.15);
    this.prevGazeNDC.copy(this.gazeNDC);

    // Uncertainty & Gravitational Drift
    let targetOpacity = this.momentum > 0.03 ? 0.1 : 0.8;
    let targetScale = this.momentum > 0.03 ? 1.5 + (this.momentum * 1.5) : 1.0;
    this.material.uniforms.uOpacity.value = THREE.MathUtils.lerp(this.material.uniforms.uOpacity.value, targetOpacity, 0.08);
    this.mesh.scale.setScalar(THREE.MathUtils.lerp(this.mesh.scale.x, targetScale, 0.08));

    if (this.momentum < 0.005) {
      const t = this.clock.getElapsedTime();
      this.mesh.position.x += Math.sin(t * 0.5) * 0.0005;
      this.mesh.position.y += Math.cos(t * 0.4) * 0.0005;
    } else {
      this.mesh.position.lerp(new THREE.Vector3(0, 0, 0), 0.05);
    }

    this.mesh.rotation.x += (this.gazeNDC.y * 0.4 - this.mesh.rotation.x) * 0.05;
    this.mesh.rotation.y += (this.gazeNDC.x * 0.4 - this.mesh.rotation.y) * 0.05;
    this.mesh.rotation.z += (deltaTime || 0.016) * 0.08;

    // The Observer Effect
    this.raycaster.setFromCamera(this.gazeNDC, this.camera);
    const isObserved = this.raycaster.intersectObject(this.mesh).length > 0;
    this.material.uniforms.uGlow.value = THREE.MathUtils.lerp(this.material.uniforms.uGlow.value, isObserved ? 0.8 : 0.0, 0.1);
    this.material.uniforms.uObservation.value = THREE.MathUtils.lerp(this.material.uniforms.uObservation.value, isObserved ? 1.0 : 0.0, 0.04);

    this.wireMesh.position.copy(this.mesh.position);
    this.wireMesh.rotation.copy(this.mesh.rotation);
    this.wireMesh.scale.copy(this.mesh.scale);

    // Psychoacoustic Entanglement (Direct Hardware Injection)
    if (this.isAudioAwake && this.humVolume && this.oscLeft && this.oscRight && this.oscStress) {
      const normalizedEnergy = Math.min(this.momentum, 0.2) / 0.2;
      const targetLeftFreq = 150.0 + (normalizedEnergy * 80.0);
      const targetRightFreq = targetLeftFreq + (4.0 + (normalizedEnergy * 8.0));
      const targetVolume = 0.2 + (normalizedEnergy * 0.5);
      const crescendoCurve = Math.pow(normalizedEnergy, 3);
      const stressFreq = targetLeftFreq * (1.414 + (crescendoCurve * 0.5));
      const stressVol = crescendoCurve * 0.12;

      // Direct injection to bypass 60FPS scheduling conflicts
      this.oscLeft.frequency.value = targetLeftFreq;
      this.oscRight.frequency.value = targetRightFreq;
      this.humVolume.gain.value = targetVolume;
      this.oscStress.frequency.value = stressFreq;
      this.stressVolume.gain.value = stressVol;
    }
  }

  render = () => {
    requestAnimationFrame(this.render);
    this.updatePhysics(this.clock.getDelta());
    this.renderer.render(this.scene, this.camera);
  }
}

new QuantumLatticeExperience();
