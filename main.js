import * as THREE from "three";
import { initShorFlow } from "./shor-flow.js";
import { createViewManager } from "./controllers/view-manager.js";
import { createBlochController } from "./controllers/bloch-controller.js";
import { createGatesController } from "./controllers/gates-controller.js";
import { createEntangleController } from "./controllers/entangle-controller.js";
import { createProcessorController } from "./controllers/processor-controller.js";

const canvas = document.getElementById("canvas");
const canvasWrap = document.querySelector(".canvas-wrap");
const shorPanel = document.getElementById("shor-panel");
const shorControllerRef = { current: null };

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const blochScene = new THREE.Scene();
const bloch = createBlochController({ canvas, scene: blochScene });
const gates = createGatesController({ canvas });
const entangle = createEntangleController({ canvas });
const processor = createProcessorController({ canvas });

const orbits = {
  bloch: bloch.orbit,
  gates: gates.orbit,
  entangle: entangle.orbit,
  processor: processor.orbit,
};

function ensureShorController() {
  if (!shorControllerRef.current) {
    shorControllerRef.current = initShorFlow(shorPanel, {
      onStepChange(step) {
        const el = document.getElementById("shor-sidebar-status");
        if (el) el.textContent = `步驟 ${step.id}：${step.plain}`;
      },
    });
  }
  return shorControllerRef.current;
}

const viewManager = createViewManager({
  tabs: document.querySelectorAll(".tab"),
  canvas,
  canvasWrap,
  canvasLabel: document.getElementById("canvas-label"),
  shorPanel,
  controlPanels: {
    bloch: document.getElementById("bloch-controls"),
    gates: document.getElementById("gates-controls"),
    entangle: document.getElementById("entangle-controls"),
    processor: document.getElementById("processor-controls"),
    shor: document.getElementById("shor-controls"),
  },
  blochLegend: document.getElementById("bloch-legend"),
  gateLegend: document.getElementById("gate-legend"),
  entangleLegend: document.getElementById("entangle-legend"),
  orbits,
  ensureShorController,
  shorControllerRef,
});

Object.entries(orbits).forEach(([name, orbit]) => {
  viewManager.bindOrbitDragFeedback(orbit, name);
});

const shorPlaySide = document.getElementById("shor-play-side");
const shorNextSide = document.getElementById("shor-next-side");
if (shorPlaySide) {
  shorPlaySide.addEventListener("click", () => {
    viewManager.switchView("shor");
    ensureShorController().play();
  });
}
if (shorNextSide) {
  shorNextSide.addEventListener("click", () => {
    viewManager.switchView("shor");
    const ctrl = ensureShorController();
    const cur = ctrl.getActiveStep();
    ctrl.selectStep(cur < 0 ? 0 : Math.min(cur + 1, 8));
  });
}

function resize() {
  const w = canvasWrap.clientWidth;
  const h = canvasWrap.clientHeight;
  if (w === 0 || h === 0) return;
  renderer.setSize(w, h, false);
  [bloch.camera, gates.camera, entangle.camera, processor.camera].forEach((cam) => {
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  });
}

window.addEventListener("resize", resize);
resize();

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  const dt = Math.min(clock.getDelta(), 0.1);
  const view = viewManager.getActiveView();

  bloch.tick(t, dt);
  gates.tick(t, dt, view);
  entangle.tick(t, dt);
  processor.tick(t, dt);

  if (view === "bloch") bloch.render(renderer);
  else if (view === "gates") gates.render(renderer);
  else if (view === "entangle") entangle.render(renderer);
  else if (view === "processor") processor.render(renderer);
}

animate();