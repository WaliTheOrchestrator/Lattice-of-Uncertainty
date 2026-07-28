# The Lattice of Uncertainty

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Three.js](https://img.shields.io/badge/Three.js-r160-000000?logo=three.js&logoColor=white)](https://threejs.org/)
[![Rust](https://img.shields.io/badge/Rust-Wasm-000000?logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

*An open-source instrument exploring the Observer Effect, cursor prediction, and what it means for a machine to know you.A browser-based 3D art piece that turns the Observer Effect from quantum physics into something you can feel: a glowing object in a black void that only becomes real where you actually look.*

---


## Why this exists

I started this project as a journey in software engineering, learning web development from zero, with an AI as my engineering team. The idea came from quantum physics: the Observer Effect, the strange fact that a quantum system behaves differently simply because it is being measured. I wanted to stop *reading* about that idea and let someone *feel* it — a glowing object in a black void that only resolves into detail where a visitor's eyes or cursor actually land, so that looking at something is the act that makes it real.

That was the philosophical seed. But the deeper reason I kept pushing was personal: I wanted to build something that reflected genuine engineering depth, not a decorated webpage — something a senior engineer, a computer science professor, or a twenty-year veteran could look at and recognize real craft across physics, mathematics, systems architecture, and design. Not for applause. Because I was learning, and I wanted the thing I learned on to be worth the years I'll spend telling people I built it.

Five months into building it, the AI sessions I was working in lost its entire context. Everything — the architecture, the code, the reasoning — was gone in an instant, except for what was still in my mind. , I rebuilt the project from the transcripts. That failure is the reason this repository exists in its current form: a project whose memory now lives in files and git history, never again in conversation.But I would say It deepened my knowlegde about context engineering
## The Ultimate Hybrid

This is the centerpiece of the repository (`src/main.js`) — the version that fuses every system explored across the project into one running piece. On load, a two-meter icosahedron appears at the center of an obsidian void. It reacts to the visitor in real time across five layers running simultaneously: vision, gaze, place, sound, and prediction.

### The visual engine

The mesh runs on a custom GLSL shader, not a stock material. The vertex shader computes the distance from every point on the mesh to the visitor's gaze in 3D world space and displaces that point inward along its normal using an exponential falloff — `exp(-distance² × 2.5)` — so the surface physically compresses toward wherever the visitor is looking, like a gravity well opening under their attention. The fragment shader layers a pseudo-noise field over an obsidian base and blends toward gold precisely where the raycaster detects the mesh is being "observed" — the alchemical moment the void turns to metal. A second, ghostly wireframe copy of the same geometry sits underneath at low opacity, so the piece always shows both states at once: the collapsed, observed reality and the uncollapsed possibility beneath it.

### The gaze

Eye tracking runs through WebGazer.js, loaded directly in the page and configured to hide its own calibration dot and camera preview — the visitor is watched, but never shown the machinery doing it. Gaze coordinates are converted from screen space into normalized device coordinates and fed into a Kalman filter for smoothing. If the webcam model isn't ready yet or isn't available, the piece falls back to the mouse cursor automatically and invisibly — the visitor never sees a broken state, only a continuous one.

### The place

On load, the piece makes one lightweight call to GeoJS, a free IP-geolocation service, to learn the visitor's approximate latitude. That value tints the void's background and atmosphere color, so the piece carries a faint trace of *where* it's being seen from, not just *how*. If the lookup fails — no connection, a blocked request — the void simply stays at its default obsidian and the piece continues without incident.

### The sound

Web Audio drives three oscillators, created only on the visitor's first click (deliberately, to satisfy every browser's autoplay policy rather than fight it). Two sine waves at 150 Hz and 154 Hz, panned hard left and right, produce a 4 Hz binaural beat — a calm undertone meant to sit just beneath conscious notice. A third oscillator, a sawtooth wave tuned to a tritone above the base frequency (`150 × 1.414`), fades in only as the visitor's cursor movement grows erratic, driven directly by their kinetic momentum. Calm brings quiet; frantic movement brings dissonance.

### The prediction

Underneath everything runs a Rust program, compiled to WebAssembly, that tries to guess where the visitor will look next. It divides the screen into a 10×10 grid of 100 sectors and maintains a 100×100 transition matrix — flattened into a single contiguous array in memory rather than a nested structure, which keeps related probabilities physically close together for faster access. As the visitor moves, old memories in that matrix fade by a factor of 0.98 with every update, so the model always favors recent behavior over old habit. Pressing **P** hands the last several seconds of movement to this matrix, which walks itself forward fifty steps — five seconds into the future — and returns a predicted path, drawn on screen as a trail of fading cyan dots.

### How it all boots

All of the above start in parallel, not in sequence: the Rust module compiling, the geolocation request, and the webcam eye-tracker all fire at once behind a single `Promise.all`, so the visuals begin rendering immediately and each feature quietly comes online as it finishes loading, with no part of the experience blocking any other.

## Tech stack

| Layer | Technology | Role |
|---|---|---|
| 3D rendering | Three.js (WebGL) | Scene, camera, mesh, custom `ShaderMaterial` |
| Shading | Hand-written GLSL | Vertex displacement (gaze-gravity) and fragment coloring (obsidian/gold, noise) |
| Build tooling | Vite | Dev server and bundling |
| Eye tracking | WebGazer.js | Webcam-based gaze estimation, loaded via CDN |
| Geolocation | GeoJS (IP-based) | Free, keyless lookup for atmosphere tinting |
| Audio | Web Audio API | Native oscillators, gain nodes, stereo panners — no external audio library |
| Prediction engine | Rust → WebAssembly (`wasm-bindgen`) | Spatial Markov chain trajectory prediction |
| Animation | GSAP | Fade/tween of predicted-path dots and UI flashes |
| Language | Vanilla JavaScript (ES6 classes) + Rust | No frontend framework — a single `QuantumLatticeHybrid` class owns the whole experience |

## Repository contents

```
lattice-of-uncertainty/
├── index.html                 Entry page, loads WebGazer from CDN
├── src/main.js                 The Ultimate Hybrid — everything above, fused into one file
├── quantum_markov/             The Rust source for the prediction engine
│   ├── Cargo.toml
│   └── src/lib.rs               QuantumOracle: the 100×100 spatial transition matrix
└── versions/                   Earlier complete iterations, kept as working reference
    ├── sensory-behemoth.main.js   Full-immersion cut: heavier Voronoi/fractal shaders,
    │                              physically modeled sky color from real solar position
    │                              (Rayleigh/Mie scattering), no Rust predictor
    ├── cognitive-engine.main.js   Bare-metal cut: simplified shader, mouse only,
    │                              built to showcase the Wasm predictor at a locked 60fps
    └── markov-brain.lib.rs        The first Rust prediction model (four psychological
                                   states) before it evolved into the spatial grid version
```

Each earlier version represents a genuine, complete build stage of the project rather than a discarded draft — the Behemoth pushed the visual and atmospheric side as far as it could go, the Cognitive Engine pushed the predictive side, and the Hybrid is where both met.

## Running it

You'll need Node.js, and Rust with `wasm-pack` if you want the prediction engine active.

1. Build the Rust module: from `quantum_markov/`, run `wasm-pack build --target web`, then copy the generated `pkg/` folder into `src/pkg/`.
2. From the project root: `npm install`, then `npm run dev`.
3. Open the local URL. Allow the webcam if prompted (or just use the mouse), click once anywhere to start the audio, move around for about fifteen seconds, then press **P** to see the predicted path appear.

No Rust installed? Swap `src/main.js` for `versions/cognitive-engine.main.js` or `versions/sensory-behemoth.main.js` in `index.html` — both run with zero Wasm setup.

## What's next: the Oracle

This build achieved what it set out to do, but a full engineering audit surfaced real bugs underneath the ambition — a thread-safety crash in a later prototype, a predictor that could degenerate into repeating itself instead of genuinely predicting, and a few unverified performance claims. Rather than patch those in place, the next phase of this project is a ground-up rebuild of the prediction idea alone, done to a stricter standard: **The Oracle**, a transparent instrument where three separate prediction algorithms race in the open, score themselves live, and turn every session into reproducible research data. The full plan for it lives in [`SPEC.md`](./SPEC.md).

## License

Released under the [MIT License](LICENSE) — free to use, modify, and distribute with attribution. © 2026 Wali Khan.
