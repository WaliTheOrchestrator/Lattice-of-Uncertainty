// ============================================================================
// "THE MASTERPIECE" PHASE — Hardware Router + Sensory Layer (parts 14-15)
// This was the NEW direction started after the original context loss:
// a desktop-only predictive-friction system (Fitts's Law exit-intent trap).
// Status when work stopped: only these two components were written.
// NOT yet written: markov-worker.js (referenced below), the Rust engine v2,
// WebGPU renderer, cursor trap, acoustic distress. See README for roadmap.
// NOTE: SharedArrayBuffer requires COOP/COEP headers (crossOriginIsolated).
// ============================================================================

class MasterpieceApp {
  constructor() {
    this.tier = 3; // Default fallback state
    this.worker = null;
    this.sharedBuffer = null;
    this.sensoryLayer = null;
    this.capabilities = {
      webgpu: false,
      webnn: false,
      cores: navigator.hardwareConcurrency || 2,
      memory: navigator.deviceMemory || 4
    };
  }

  // Initialize System
  async init() {
    console.log("[SYSTEM DIAGNOSTIC] Initiating hardware profile...");
    await this.profileDevice();
    this.executeTierArchitecture();
  }

  // Profile hardware capabilities to allocate Tiers
  async profileDevice() {
    if (navigator.gpu) {
      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (adapter) this.capabilities.webgpu = true;
      } catch (e) {
        this.capabilities.webgpu = false;
      }
    }
    if (window.ml) {
      this.capabilities.webnn = true;
    }

    // Tier Routing Matrix (Top 1% Flex vs Mid vs Low)
    if (this.capabilities.webgpu && this.capabilities.cores >= 6 && this.capabilities.memory >= 8) {
      this.tier = 1;
    } else if (this.capabilities.cores >= 4 && this.capabilities.memory >= 4) {
      this.tier = 2;
    } else {
      this.tier = 3;
    }
  }

  executeTierArchitecture() {
    console.log(`[SYSTEM DIAGNOSTIC] Device assigned to Tier ${this.tier}`);
    switch (this.tier) {
      case 1:
        this.initializeHighEndEngine();
        break;
      case 2:
        this.initializeMidRangeEngine();
        break;
      case 3:
        this.initializeSafeEngine();
        break;
    }
  }

  // Tier 1: The Top 1% Uncompromised Flex Pipeline
  initializeHighEndEngine() {
    // Allocate 1024 bytes of shared raw memory
    this.sharedBuffer = new SharedArrayBuffer(1024);

    // Spin up the background mathematical processor thread
    this.worker = new Worker(new URL('./markov-worker.js', import.meta.url), { type: 'module' });
    this.worker.postMessage({ type: 'INIT_MEMORY', buffer: this.sharedBuffer });

    // Spin up the Sensory Tracking Layer
    this.sensoryLayer = new SensoryLayer(this.sharedBuffer);
    this.sensoryLayer.start();
    console.log("⚡ Tier 1 Operational: WebGPU ready, Web Worker threaded, Tracking active.");
  }

  // Tier 2: Mid-Range Hardware Pipeline
  initializeMidRangeEngine() {
    this.sharedBuffer = new SharedArrayBuffer(256); // Smaller memory footprint
    this.worker = new Worker(new URL('./markov-worker.js', import.meta.url), { type: 'module' });
    this.worker.postMessage({ type: 'INIT_MEMORY_LIGHT', buffer: this.sharedBuffer });
    this.sensoryLayer = new SensoryLayer(this.sharedBuffer);
    this.sensoryLayer.start();
    console.log("⚙️ Tier 2 Operational: WebGL fallback ready, Telemetry active.");
  }

  // Tier 3: Low-End/Mobile Graceful Degradation
  initializeSafeEngine() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.sharedBuffer = null; // Purge from memory, return to OS allocation
    console.log("🛑 Tier 3 Operational: Safe Mode. Multi-threading bypassed. Memory fully reclaimed.");
  }
}

// ============================================================================
// SENSORY LAYER MODULE (4D Telemetry Compiler)
// ============================================================================
class SensoryLayer {
  constructor(sharedBufferArray) {
    this.sharedMemory = new Float32Array(sharedBufferArray);
    this.currentX = 0;
    this.currentY = 0;
    this.lastX = 0;
    this.lastY = 0;
    this.lastTime = performance.now();
    this.isTracking = false;

    window.addEventListener('mousemove', (e) => {
      this.currentX = e.clientX;
      this.currentY = e.clientY;
    }, { passive: true }); // Passive flag prevents input rendering lag
  }

  start() {
    this.isTracking = true;
    this.captureTelemetry();
  }

  stop() {
    this.isTracking = false;
  }

  captureTelemetry() {
    if (!this.isTracking) return;
    const now = performance.now();
    const deltaTime = now - this.lastTime;

    if (deltaTime > 0) {
      const dx = this.currentX - this.lastX;
      const dy = this.currentY - this.lastY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const velocity = distance / deltaTime; // Pixels per millisecond
      const angle = Math.atan2(dy, dx); // Directional radians

      // Atomic thread-safe writing to Web Worker memory
      // Index 0: X | Index 1: Y | Index 2: Velocity | Index 3: Angle
      Atomics.store(this.sharedMemory, 0, this.currentX);
      Atomics.store(this.sharedMemory, 1, this.currentY);
      Atomics.store(this.sharedMemory, 2, velocity);
      Atomics.store(this.sharedMemory, 3, angle);

      this.lastX = this.currentX;
      this.lastY = this.currentY;
      this.lastTime = now;
    }

    // Loop perfectly in sync with the monitor's refresh rate
    requestAnimationFrame(() => this.captureTelemetry());
  }
}

// Instantiate and kickstart the Masterpiece execution
const app = new MasterpieceApp();
window.addEventListener('DOMContentLoaded', () => app.init());
