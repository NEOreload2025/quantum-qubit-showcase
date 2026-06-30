import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  BLOCH_PRESETS,
  TWO_QUBIT_PRESETS,
  CIRCUIT_STEPS,
  GATES,
  stateFromBloch,
  blochFromState,
  blochCoordsFromState,
  formatQubit,
} from "./utils/quantum-math.js";
import { createBlochSphere } from "./scenes/bloch-sphere.js";
import { createGatesScene } from "./scenes/gates-scene.js";
import { createEntangleScene } from "./scenes/entangle-scene.js";
import { createProcessorScene } from "./scenes/processor-scene.js";
import { initShorFlow } from "./shor-flow.js";

const canvas = document.getElementById("canvas");
const canvasWrap = document.querySelector(".canvas-wrap");
const shorPanel = document.getElementById("shor-panel");
const tabs = document.querySelectorAll(".tab");
const canvasLabel = document.getElementById("canvas-label");
const blochLegend = document.getElementById("bloch-legend");
const gateLegend = document.getElementById("gate-legend");
const entangleLegend = document.getElementById("entangle-legend");

const controlPanels = {
  bloch: document.getElementById("bloch-controls"),
  gates: document.getElementById("gates-controls"),
  entangle: document.getElementById("entangle-controls"),
  processor: document.getElementById("processor-controls"),
  shor: document.getElementById("shor-controls"),
};

const shorSidebarStatus = document.getElementById("shor-sidebar-status");
const shorPlaySide = document.getElementById("shor-play-side");
const shorNextSide = document.getElementById("shor-next-side");

const stateFormula = document.getElementById("state-formula");
const thetaSlider = document.getElementById("theta-slider");
const phiSlider = document.getElementById("phi-slider");
const thetaValue = document.getElementById("theta-value");
const phiValue = document.getElementById("phi-value");
const stateButtons = document.querySelectorAll("[data-state]");
const gateButtons = document.querySelectorAll("[data-gate]");
const bellButtons = document.querySelectorAll("[data-bell]");
const measureButtons = document.querySelectorAll("[data-measure]");
const entangleFormula = document.getElementById("entangle-formula");
const circuitStepEl = document.getElementById("circuit-step");
const circuitDescEl = document.getElementById("circuit-desc");
const circuitPlayBtn = document.getElementById("circuit-play");
const circuitNextBtn = document.getElementById("circuit-next");
const entangleToggle = document.getElementById("entangle-toggle");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const clock = new THREE.Clock();
let activeView = "bloch";
let shorController = null;

function ensureShorController() {
  if (!shorController) {
    shorController = initShorFlow(shorPanel, {
      onStepChange(step) {
        if (shorSidebarStatus) {
          shorSidebarStatus.textContent = `步驟 ${step.id}：${step.plain}`;
        }
      },
    });
  }
  return shorController;
}

if (shorPlaySide) {
  shorPlaySide.addEventListener("click", () => {
    switchView("shor");
    ensureShorController().play();
  });
}
if (shorNextSide) {
  shorNextSide.addEventListener("click", () => {
    switchView("shor");
    const ctrl = ensureShorController();
    const cur = ctrl.getActiveStep();
    ctrl.selectStep(cur < 0 ? 0 : Math.min(cur + 1, 8));
  });
}

// ─── Bloch scene ──────────────────────────────────────────────────
const blochScene = new THREE.Scene();
const blochCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
blochCamera.position.set(3.2, 1.8, 3.2);
const blochOrbit = new OrbitControls(blochCamera, canvas);
blochOrbit.enableDamping = true;
blochOrbit.dampingFactor = 0.06;
blochOrbit.minDistance = 2.2;
blochOrbit.maxDistance = 8;

blochScene.add(new THREE.AmbientLight(0x334466, 0.6));
const blochKey = new THREE.DirectionalLight(0x88ccff, 1.2);
blochKey.position.set(4, 6, 3);
blochScene.add(blochKey);
const blochFill = new THREE.PointLight(0xa78bfa, 0.8, 20);
blochFill.position.set(-3, -1, 2);
blochScene.add(blochFill);

const bloch = createBlochSphere(1, 0x34d399);
blochScene.add(bloch.group);

const particlesGeo = new THREE.BufferGeometry();
const particleCount = 200;
const positions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
  const r = 1.8 + Math.random() * 2.5;
  const th = Math.random() * Math.PI * 2;
  const ph = Math.acos(2 * Math.random() - 1);
  positions[i * 3] = r * Math.sin(ph) * Math.cos(th);
  positions[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
  positions[i * 3 + 2] = r * Math.cos(ph);
}
particlesGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
const particles = new THREE.Points(
  particlesGeo,
  new THREE.PointsMaterial({ color: 0x5ce1ff, size: 0.02, transparent: true, opacity: 0.5 })
);
blochScene.add(particles);

let qubitState = stateFromBloch(0, 0);
let targetTheta = 0;
let targetPhi = 0;
let currentTheta = 0;
let currentPhi = 0;
let gateAnim = null;

function blochVector(thetaDeg, phiDeg) {
  const t = (thetaDeg * Math.PI) / 180;
  const p = (phiDeg * Math.PI) / 180;
  return new THREE.Vector3(Math.sin(t) * Math.cos(p), Math.sin(t) * Math.sin(p), Math.cos(t));
}

function syncBlochFromState(s, animate = true) {
  qubitState = s;
  const { theta, phi } = blochFromState(s);
  if (animate) {
    targetTheta = theta;
    targetPhi = phi;
    thetaSlider.value = Math.round(theta);
    phiSlider.value = Math.round(phi);
    thetaValue.textContent = `${Math.round(theta)}°`;
    phiValue.textContent = `${Math.round(phi)}°`;
  }
  stateFormula.textContent = formatQubit(s);
}

function setBlochAngles(thetaDeg, phiDeg, fromSlider = false) {
  targetTheta = thetaDeg;
  targetPhi = phiDeg;
  qubitState = stateFromBloch(thetaDeg, phiDeg);
  thetaSlider.value = Math.round(thetaDeg);
  phiSlider.value = Math.round(phiDeg);
  thetaValue.textContent = `${Math.round(thetaDeg)}°`;
  phiValue.textContent = `${Math.round(phiDeg)}°`;
  stateFormula.textContent = formatQubit(qubitState);

  if (!fromSlider) {
    stateButtons.forEach((btn) => {
      const preset = BLOCH_PRESETS[btn.dataset.state];
      const match =
        preset &&
        Math.abs(preset.theta - thetaDeg) < 1 &&
        Math.abs(preset.phi - phiDeg) < 1;
      btn.classList.toggle("active", match);
    });
  } else {
    stateButtons.forEach((btn) => btn.classList.remove("active"));
  }
}

stateButtons.forEach((btn) => {
  if (!btn.dataset.state) return;
  btn.addEventListener("click", () => {
    const preset = BLOCH_PRESETS[btn.dataset.state];
    if (preset) setBlochAngles(preset.theta, preset.phi);
  });
});

thetaSlider.addEventListener("input", () => {
  setBlochAngles(Number(thetaSlider.value), Number(phiSlider.value), true);
});
phiSlider.addEventListener("input", () => {
  setBlochAngles(Number(thetaSlider.value), Number(phiSlider.value), true);
});

gateButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const gate = GATES[btn.dataset.gate];
    if (!gate) return;
    const start = { ...qubitState, alpha: { ...qubitState.alpha }, beta: { ...qubitState.beta } };
    const end = gate(qubitState);
    const startB = blochFromState(start);
    const endB = blochFromState(end);
    gateAnim = { start: startB, end: endB, endState: end, t: 0 };
    btn.classList.add("active");
    setTimeout(() => btn.classList.remove("active"), 600);
  });
});

setBlochAngles(0, 0);

// ─── Gates scene ──────────────────────────────────────────────────
const gates = createGatesScene();
const gatesOrbit = new OrbitControls(gates.camera, canvas);
gatesOrbit.enableDamping = true;
gatesOrbit.dampingFactor = 0.06;
gatesOrbit.minDistance = 4;
gatesOrbit.maxDistance = 12;
gatesOrbit.enabled = false;

let circuitStep = 0;
let circuitPlaying = false;
let circuitTimer = null;
let circuitSubT = 0;

function updateCircuitUI() {
  const step = CIRCUIT_STEPS[circuitStep];
  circuitStepEl.textContent = `步驟 ${circuitStep + 1} / ${CIRCUIT_STEPS.length}：${step.title}`;
  circuitDescEl.textContent = step.desc;
  gates.setGateHighlight(step.activeGate);
  const coords = blochCoordsFromState(step.q1);
  gates.blochPreview.setVector(
    new THREE.Vector3(coords.x, coords.y, coords.z),
    Boolean(step.reducedMixed)
  );
}

function setCircuitStep(idx) {
  circuitStep = Math.max(0, Math.min(CIRCUIT_STEPS.length - 1, idx));
  circuitSubT = 0;
  updateCircuitUI();
}

circuitNextBtn.addEventListener("click", () => setCircuitStep(circuitStep + 1));

circuitPlayBtn.addEventListener("click", () => {
  if (circuitPlaying) {
    circuitPlaying = false;
    circuitPlayBtn.textContent = "▶ 播放電路";
    clearInterval(circuitTimer);
    circuitTimer = null;
    return;
  }
  circuitPlaying = true;
  circuitPlayBtn.textContent = "⏸ 暫停";
  if (circuitStep >= CIRCUIT_STEPS.length - 1) setCircuitStep(0);

  circuitTimer = setInterval(() => {
    circuitSubT += 0.04;
    if (circuitSubT >= 1) {
      circuitSubT = 0;
      if (circuitStep >= CIRCUIT_STEPS.length - 1) {
        circuitPlaying = false;
        circuitPlayBtn.textContent = "▶ 播放電路";
        clearInterval(circuitTimer);
        return;
      }
      setCircuitStep(circuitStep + 1);
    }
  }, 50);
});

setCircuitStep(0);

// ─── Entangle scene ───────────────────────────────────────────────
const entangle = createEntangleScene();
const entangleOrbit = new OrbitControls(entangle.camera, canvas);
entangleOrbit.enableDamping = true;
entangleOrbit.dampingFactor = 0.06;
entangleOrbit.minDistance = 3.5;
entangleOrbit.maxDistance = 10;
entangleOrbit.enabled = false;

let activeBell = "phiPlus";
let measuredQ1 = null;

function applyTwoQubit(presetKey, q2Override = null) {
  const preset = TWO_QUBIT_PRESETS[presetKey];
  if (!preset) return;
  activeBell = presetKey;
  measuredQ1 = null;

  bellButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.bell === presetKey);
  });
  measureButtons.forEach((btn) => btn.classList.remove("active"));

  entangleFormula.textContent = preset.formula;
  entangle.setLinkVisible(preset.entangled);

  const q1coords = blochCoordsFromState(preset.q1);
  const q2state = q2Override || preset.q2;
  const q2coords = blochCoordsFromState(q2state);

  entangle.q1.setVector(
    new THREE.Vector3(q1coords.x, q1coords.y, q1coords.z),
    preset.reducedMixed && !q2Override
  );
  entangle.q2.setVector(
    new THREE.Vector3(q2coords.x, q2coords.y, q2coords.z),
    preset.reducedMixed && !q2Override
  );
}

bellButtons.forEach((btn) => {
  btn.addEventListener("click", () => applyTwoQubit(btn.dataset.bell));
});

measureButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const preset = TWO_QUBIT_PRESETS[activeBell];
    if (!preset?.entangled || !preset.measureMap) return;
    measuredQ1 = btn.dataset.measure;
    btn.classList.add("active");
    measureButtons.forEach((b) => {
      if (b !== btn) b.classList.remove("active");
    });

    const collapsed = preset.measureMap[measuredQ1];
    const q1collapsed = measuredQ1 === "0" ? stateFromBloch(0, 0) : stateFromBloch(180, 0);
    const c1 = blochCoordsFromState(q1collapsed);
    const c2 = blochCoordsFromState(collapsed);

    entangle.q1.setVector(new THREE.Vector3(c1.x, c1.y, c1.z), false);
    entangle.q2.setVector(new THREE.Vector3(c2.x, c2.y, c2.z), false);
    entangle.measureRing.material.opacity = 0.6;
    const bBit = blochFromState(collapsed).theta < 90 ? "0" : "1";
    entangleFormula.textContent = `量測 A = ${measuredQ1}  →  B 瞬間坍縮為 |${bBit}⟩（非古典關聯）`;
  });
});

applyTwoQubit("phiPlus");

// ─── Processor scene ──────────────────────────────────────────────
const processor = createProcessorScene();
const procOrbit = new OrbitControls(processor.camera, canvas);
procOrbit.enableDamping = true;
procOrbit.dampingFactor = 0.06;
procOrbit.minDistance = 4;
procOrbit.maxDistance = 14;
procOrbit.enabled = false;

entangleToggle.addEventListener("change", () => {
  processor.entangleLines.forEach((line) => {
    line.visible = entangleToggle.checked;
  });
});

// ─── View labels ──────────────────────────────────────────────────
const VIEW_META = {
  bloch: {
    tag: "Bloch 球",
    desc: "單量子位元態空間 — 套用閘門即時動畫",
    showCanvas: true,
  },
  gates: {
    tag: "量子閘門",
    desc: "H 與 CNOT 電路逐步演示",
    showCanvas: true,
  },
  entangle: {
    tag: "量子糾纏",
    desc: "雙 Bloch 球 — Bell 態與量測坍縮",
    showCanvas: true,
  },
  processor: {
    tag: "量子處理器",
    desc: "超導量子位元陣列示意",
    showCanvas: true,
  },
  shor: {
    tag: "Shor 演算法",
    desc: "質因數分解的量子加速流程",
    showCanvas: false,
  },
};

function switchView(view) {
  activeView = view;
  tabs.forEach((t) => {
    const on = t.dataset.view === view;
    t.classList.toggle("active", on);
    t.setAttribute("aria-selected", on);
  });

  Object.entries(controlPanels).forEach(([key, el]) => {
    if (el) el.hidden = key !== view;
  });

  blochLegend.hidden = view !== "bloch";
  gateLegend.hidden = view !== "gates";
  entangleLegend.hidden = view !== "entangle";

  const meta = VIEW_META[view];
  canvasLabel.innerHTML = `<span class="overlay-tag">${meta.tag}</span><span class="overlay-desc">${meta.desc}</span>`;

  const isShor = view === "shor";
  canvas.hidden = !meta.showCanvas;
  canvas.style.display = isShor ? "none" : "block";
  canvas.style.pointerEvents = isShor ? "none" : "auto";
  canvasLabel.style.display = isShor ? "none" : "";
  blochLegend.style.display = view === "bloch" ? "" : "none";
  gateLegend.style.display = view === "gates" ? "" : "none";
  entangleLegend.style.display = view === "entangle" ? "" : "none";

  if (isShor) {
    canvasWrap.classList.add("shor-mode");
    shorPanel.hidden = false;
    shorPanel.setAttribute("aria-hidden", "false");
    const ctrl = ensureShorController();
    if (ctrl.getActiveStep() < 0) ctrl.selectStep(0);
  } else {
    canvasWrap.classList.remove("shor-mode");
    shorPanel.hidden = true;
    shorPanel.setAttribute("aria-hidden", "true");
    shorController?.stopPlay?.();
  }

  blochOrbit.enabled = view === "bloch";
  gatesOrbit.enabled = view === "gates";
  entangleOrbit.enabled = view === "entangle";
  procOrbit.enabled = view === "processor";
}

tabs.forEach((tab) => tab.addEventListener("click", () => switchView(tab.dataset.view)));

// ─── Resize & animate ─────────────────────────────────────────────
function resize() {
  const w = canvasWrap.clientWidth;
  const h = canvasWrap.clientHeight;
  if (w === 0 || h === 0) return;
  renderer.setSize(w, h, false);
  [blochCamera, gates.camera, entangle.camera, processor.camera].forEach((cam) => {
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  });
}

window.addEventListener("resize", resize);
resize();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  const dt = 0.08;

  if (gateAnim) {
    gateAnim.t = Math.min(1, gateAnim.t + 0.06);
    const e = gateAnim.t;
    const ease = e * e * (3 - 2 * e);
    currentTheta = gateAnim.start.theta + (gateAnim.end.theta - gateAnim.start.theta) * ease;
    currentPhi = gateAnim.start.phi + (gateAnim.end.phi - gateAnim.start.phi) * ease;
    if (gateAnim.t >= 1) {
      syncBlochFromState(gateAnim.endState, false);
      gateAnim = null;
    }
  } else {
    currentTheta += (targetTheta - currentTheta) * dt;
    currentPhi += (targetPhi - currentPhi) * dt;
  }

  const vec = blochVector(currentTheta, currentPhi);
  bloch.setVector(vec, blochFromState(qubitState).mixed);
  bloch.group.rotation.y = t * 0.08;
  particles.rotation.y = t * 0.02;

  if (circuitPlaying || activeView === "gates") {
    gates.setPulseProgress(circuitStep, circuitSubT);
    gates.root.rotation.y = Math.sin(t * 0.08) * 0.05;
  }

  const preset = TWO_QUBIT_PRESETS[activeBell];
  entangle.animateLink(t, preset?.entangled);
  entangle.root.rotation.y = Math.sin(t * 0.06) * 0.04;
  if (measuredQ1) {
    entangle.measureRing.material.opacity = 0.4 + Math.sin(t * 4) * 0.2;
  } else {
    entangle.measureRing.material.opacity *= 0.95;
  }

  processor.qubitMeshes.forEach((q) => {
    q.position.y = 0.15 + Math.sin(t * 2 + q.userData.phase) * 0.04;
    q.material.emissiveIntensity = 0.4 + Math.sin(t * 1.5 + q.userData.phase) * 0.3;
  });
  if (entangleToggle.checked) {
    processor.entangleLines.forEach((line, i) => {
      line.material.opacity = 0.25 + Math.sin(t * 3 + i * 0.7) * 0.2;
    });
  }
  processor.cryostatRing.rotation.z = t * 0.15;
  processor.group.rotation.y = Math.sin(t * 0.1) * 0.08;

  if (activeView === "bloch") {
    blochOrbit.update();
    renderer.render(blochScene, blochCamera);
  } else if (activeView === "gates") {
    gatesOrbit.update();
    renderer.render(gates.scene, gates.camera);
  } else if (activeView === "entangle") {
    entangleOrbit.update();
    renderer.render(entangle.scene, entangle.camera);
  } else if (activeView === "processor") {
    procOrbit.update();
    renderer.render(processor.scene, processor.camera);
  }
}

animate();
