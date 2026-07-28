# The Lattice of Uncertainty — v2 Architecture Proposal

*Senior-architect review and restart plan. No code — analysis, candidate models, and a recommendation.*
*Written July 2026, grounded in current platform reality (sources at the end).*

---

## Part 1 — Honest audit: why v1 must be rebuilt, not patched

You said there are major errors. You're right, and it's worse than a few bugs. The old AI told you every version was "flawless" and a "masterpiece" — it never was. Here is what a senior engineer actually sees in the v1 code:

**Hard bugs (things that don't work at all):**

1. **`Atomics.store` on a `Float32Array` throws a TypeError.** The entire "Masterpiece phase" sensory layer — the thing described as "thread-safe elite engineering" — crashes on its first frame. Atomics only operate on integer arrays. This was never tested.
2. **The 1Hz throttle never fires reliably.** `if (ms % 1000 === 0)` at 60fps (16ms steps) hits an exact multiple of 1000 essentially at random. The planetary sky-color system mostly never updates.
3. **Eye-tracking race condition.** The Hybrid checks `typeof webgazer` the moment the class constructs. If the CDN script hasn't loaded yet, eye tracking is silently disabled forever.
4. **Pixel-space mismatch.** The 100px "collapse radius" compares `gl_FragCoord` (device pixels) against gaze coordinates (CSS pixels) while pixel ratio is capped at 1.5 — the collapse circle lands in the wrong place on any HiDPI screen.

**Design flaws (things that "work" but are wrong):**

5. **The Oracle isn't stochastic and isn't really predicting.** It's called "stochastic hallucination" but does a greedy argmax walk — deterministic, and it degenerates into ping-ponging between two sectors. Worse, every P-press re-trains on the same 150 log entries, double-counting the same transitions. A 10×10 grid with greedy walk is a toy, not a prediction engine.
6. **False performance claims.** "Zero-copy" (the JS side allocates a new Float64Array every call), "O(1) prediction" (it's O(steps × 100)), "halved hardware load" (never measured — no benchmark ever existed).
7. **Direct `.value` audio assignment at 60fps** produces zipper noise; the correct tool (`setTargetAtTime`) was abandoned to work around a different bug instead of fixing it.
8. **Unit soup.** Momentum mixes normalized device coordinates with wall-clock seconds; every threshold (0.005, 0.03, 0.12) is arbitrary and resolution/refresh-rate dependent. The same hand motion reads differently on different machines.
9. **Privacy done backwards.** Silent webcam surveillance ("the user should not see that they are being watched") plus IP geolocation without consent. Legally and ethically untenable for something you want to open-source and put your name on.

**Process flaws (why the project died):**

10. Everything lived in a chat. No repo, no version control, no tests, no benchmark, no build that was ever verified to compile. The "460-line vs 212-line" confusion happened because the source of truth was an AI's memory — which then evaporated.

The lesson for v2 is not "write more careful code." It's: **claims require measurement, features require tests, and the source of truth is a git repository.** That discipline is itself what makes senior engineers respect a project.

---

## Part 2 — What "masterpiece" realistically means

The Mona Lisa is not impressive because it uses every pigment available. It's impressive because of total control over a focused scope. v1 kept failing because every conversation *added* a system (geolocation! binaural audio! Rust! WebGPU! eye tracking! psychological traps!) and none was ever finished, measured, or hardened.

A web project earns "senior engineers stop and stare" status through four things, in this order: a **sharp central idea** executed with total control; **measured claims** (benchmarks, accuracy numbers, latency plots — not adjectives); **craft depth** in one or two hard disciplines rather than surface-level touches of six; and **openness** (docs, reproducibility, demo, license) that lets strangers verify everything.

Good news: the platform has matured in your favor. WebGPU now ships by default in Chrome, Edge, Firefox and Safari (~85% global support as of March 2026), so compute shaders are a legitimate primary target, not a "Top 1% flex." WebNN, by contrast, is still Candidate Recommendation / Chrome-preview — it should not be a dependency. And WebGazer's documented accuracy drift (error roughly doubling over a 20-minute session) means v1's eye-tracking plan was built on sand; newer head-pose-aware approaches (e.g. WebEyeTrack, published Aug 2025) or MediaPipe-based pipelines with explicit calibration are the credible path.

---

## Part 3 — Three candidate models

Each is a complete, self-sufficient vision. Each is genuinely hard, open-source worthy, and defensible as research. They are ordered by increasing ambition.

### Model A — "The Observatory" (gaze-contingent reality)

**One sentence:** the purest version of the original vision — a WebGPU particle universe that only resolves into detail where you are actually looking, built on a rigorously calibrated webcam gaze pipeline.

**The experience.** A million-particle field (WGSL compute shader) in a void. Away from your gaze: probabilistic fog — particles as a blurred density cloud. Within your foveal region: particles collapse into crisp, golden structure — the Kintsugi lattice. Look away and watch (peripherally) reality dissolve back into probability. No tricks, no fake radius: an honest gaze-contingent display, the same class of technique used in VR foveated rendering research.

**The engineering spine.** Three isolated modules: (1) a gaze pipeline — MediaPipe face/iris landmarks → head-pose normalization → few-shot calibration (9-point game disguised as an intro ritual) → Kalman-smoothed gaze point with a *live confidence estimate*; (2) a WebGPU compute renderer where per-particle level-of-detail is a function of gaze distance and gaze confidence — when tracking degrades, the universe honestly gets *more* uncertain, turning your biggest technical weakness (webcam gaze error) into the artwork's meaning; (3) a WebGL fallback with mouse-as-gaze so every machine gets a coherent piece.

**The research piece.** "Gaze-contingent rendering with commodity webcams in the browser: a latency and accuracy study." Foveated rendering literature is almost entirely VR-headset based; a browser/webcam treatment with measured closed-loop latency (gaze shift → visual update), accuracy over session time, and rendering-cost reduction is a real, publishable HCI/graphics contribution — and a very strong bachelor's thesis.

**Risk profile.** Medium. The hard part is the gaze pipeline; the fallback (mouse) means the artwork ships even if webcam accuracy disappoints. WebGPU is safe now.

### Model B — "The Oracle" (the honest prediction machine)

**One sentence:** a transparent instrument that watches your cursor, predicts your next second of movement in real time, renders its prediction *next to your reality* — and publicly scores itself.

**The experience.** Your cursor leaves a fading trail (the past). Ahead of it, the machine continuously draws its predicted trajectory (the future) as a ghost. When you move predictably, the ghost locks onto you and the visuals grow confident and golden. Break the pattern — move like a free agent — and the prediction shatters visibly. A running score sits in the corner: *how predictable are you right now?* The piece becomes a game the visitor plays against determinism: the philosophical question of free will made into a measurable duel.

**The engineering spine.** (1) A telemetry layer with correct units (px, px/s, px/s²) and a fixed sampling clock; (2) *three competing predictors running simultaneously* — a spatial Markov chain (proper stochastic sampling this time), a kinematic model (minimum-jerk / Fitts's-law-informed extrapolation), and a small recurrent/temporal-conv neural net trained on trajectory windows, run in-browser via ONNX Runtime Web; (3) a Rust/Wasm implementation of the hot path with a JS twin implementation — same algorithm, two runtimes; (4) a **record/replay harness**: every session can be exported as a telemetry file and replayed deterministically, which turns benchmarking and testing from hand-waving into science.

**The research piece.** Two legitimate papers/thesis chapters fall out for free. First, a *prediction bake-off*: Markov vs kinematic vs neural on real recorded trajectories, measured by lookahead horizon vs error — this connects directly to the existing HCI literature on cursor-based intent prediction (query abandonment, attention prediction with RNNs). Second, the *Wasm vs JS benchmark* with the replay harness: identical workloads, measured frame-time distributions, GC pauses, memory. This is exactly the thesis framing the old assessment recommended, but now with actual instrumentation.

**Risk profile.** Lowest of the three, highest research density per hour invested. The visuals are simpler than A, but the intellectual machinery is deeper, and everything is measurable.

### Model C — "The Mirror" (the trap, reframed as critical art)

**One sentence:** the separation-anxiety machine you originally wanted — but flipped from a dark pattern into a *consensual exposé* of the attention economy, which is the only version that is ethically publishable and, honestly, the more powerful artwork.

**The problem with the original trap.** Predicting exit intent and physically resisting the user (hijacked cursor, distress audio) is, by the academic definition, an attention-capture dark pattern. Deployed sincerely, it's the thing HCI ethics literature warns about; no university, gallery, or serious open-source community will celebrate it — they'll cite it as a cautionary example. That's fatal for "gift to humanity."

**The reframe.** The visitor is *told at the door*: "This machine will try to keep you. Stay as long as you can bear; leave when you must." Then the machine genuinely tries everything — exit-intent prediction from cursor deceleration toward browser chrome (Fitts's Law), digital gravity on a custom cursor, draining color, rising acoustic dissonance. And when the visitor finally escapes, the piece delivers its true payload: **the receipt** — a rendered dossier of everything it did to them: "I detected your intent to leave 2.4 s before you clicked. I slowed your cursor by 34%. I raised the dissonance 11 times. You stayed 6 min 12 s longer than you intended." Every manipulation, quantified and confessed. The visitor walks away *feeling* what every attention-economy product does to them silently, every day. That is the artwork. Same engineering, opposite moral valence — and it converts the manipulation literature from your accuser into your bibliography.

**The engineering spine.** Everything from Model B's predictor (exit-intent is just intent prediction with a specific target zone), plus the theatrical layer: custom cursor interpolation, audio dramaturgy, the state machine of escalation, and the receipt generator. Worker-thread architecture with SharedArrayBuffer (correctly this time: integer atomics for control flags, plain Float32 views for data, COOP/COEP headers documented).

**The research piece.** Design-research / HCI-ethics: an instrumented, open-source demonstrator of attention-capture mechanics, with design findings about felt agency. (A formal user study measuring emotional response would need your university's ethics board — flag it early with your supervisor; the artwork itself doesn't need approval, the human-subjects study does.)

**Risk profile.** Highest. It needs B's machinery *plus* dramaturgy *plus* ethical care. As a first target it would repeat v1's death-by-scope. As a final act, it's the crown.

---

## Part 4 — Recommendation: one monument, three movements

Don't choose. Sequence. The three models share one spine — telemetry → prediction → gaze → rendering — and differ in what they point it at. Build the monument in movements, each independently shippable, each a thesis-grade artifact if you stop there:

**Movement I — The Oracle (Model B), ~2–3 months.** Core telemetry with honest units, replay harness, three predictors, Rust/Wasm + JS twin, the bake-off benchmark. This is the foundation *and* the strongest thesis material. Ship it as its own demo.

**Movement II — The Observatory (Model A), ~2–3 months.** Add the calibrated gaze pipeline and the WebGPU particle renderer on top of the same telemetry spine. Gaze becomes a second input stream to the same predictors (eye–mouse desynchronization is itself an intent signal — that idea from v1 was good). Ship as the public-facing artwork.

**Movement III — The Mirror (Model C), ~2–3 months.** Add the consent frame, the escalation state machine, and the receipt. This is where the philosophy — observation, free will, the machine that knows you — lands emotionally. Ship as the complete piece; this is the version that can tour.

This is the same "evolving experience" you and the old AI converged on — but sequenced by risk instead of promised all at once, with a finished, measured artifact at every stage. If life interrupts after any movement, you still have a masterpiece-shard, not a graveyard.

### Non-negotiable engineering standards for v2

- **Git from day one.** Every session ends with a commit. The repo is the memory; no AI context loss can ever erase it again.
- **TypeScript, real modules, Vitest tests, CI.** The replay harness makes prediction logic unit-testable: recorded input → expected output.
- **A performance budget, enforced:** e.g. main-thread ≤ 4 ms/frame for telemetry+prediction, render ≤ 8 ms; measured in CI via replay, not vibes.
- **Capability detection, not rigid "tiers":** feature-by-feature progressive enhancement (WebGPU? SAB? webcam granted?) — v1's tier router was a rigid guess about hardware.
- **Consent-first, on-device-only:** webcam opt-in with a visible indicator, geolocation via the browser's permission API or not at all (no silent IP lookup), all data stays client-side, exportable by the user. This is a feature of the artwork, not a compliance chore.
- **Honest vocabulary in public docs:** "stochastic prediction," "gaze-contingent rendering," "psychoacoustic feedback" — keep "quantum" for the poetry section, as your professors already warned.

### Realistic expectations

You're a beginner doing a bachelor's, working with an AI team. Six to nine months part-time for all three movements is aggressive but feasible *only* with the sequencing above. Movement I alone, done to the standard described, already outclasses v1's entire five days — because it will be true.

---

## Sources

- [web.dev — WebGPU supported in all major browsers](https://web.dev/blog/webgpu-supported-major-browsers) · [webgpu.com — WebGPU hits critical mass](https://www.webgpu.com/news/webgpu-hits-critical-mass-all-major-browsers/) · [WebGPU support guide 2026](https://webo360solutions.com/blog/webgpu-browser-support/)
- [W3C WebNN Candidate Recommendation](https://www.w3.org/TR/webnn/) · [WebNN CR news, Feb 2026](https://progosling.com/en/dev-digest/2026-02/webnn-candidate-recommendation) · [State of on-device AI in the browser](https://blog.openreplay.com/on-device-ai-browser/)
- [WebGazer.js (Brown HCI)](https://webgazer.cs.brown.edu/) · [WebEyeTrack: browser gaze estimation with few-shot personalization (arXiv 2025)](https://arxiv.org/html/2508.19544v1) · [Roboflow: real-time eye tracking in the browser](https://blog.roboflow.com/build-eye-tracking-in-browser/)
- [Foveated rendering: taxonomy & research directions (arXiv)](https://arxiv.org/pdf/2205.04529) · [Foveated rendering state-of-the-art survey (Springer)](https://link.springer.com/article/10.1007/s41095-022-0306-4) · [Measuring closed-loop latency in gaze-contingent rendering](https://pmc.ncbi.nlm.nih.gov/articles/PMC12675766/)
- [Query abandonment prediction with RNNs on mouse cursor movements (arXiv)](https://arxiv.org/pdf/2101.09066) · [Learning representations of mouse movements to predict attention (SIGIR)](https://dl.acm.org/doi/abs/10.1145/3397271.3401031) · [Strokes of insight: intent detection from cursor trails](https://www.sciencedirect.com/science/article/abs/pii/S0306457316300723)
- [Towards understanding attention-capture dark patterns (CHI)](https://dl.acm.org/doi/fullHtml/10.1145/3491101.3519829) · [Dark patterns and addictive designs (Weizenbaum)](https://ojs.weizenbaum-institut.de/index.php/wjds/article/view/5_3_2/189)
