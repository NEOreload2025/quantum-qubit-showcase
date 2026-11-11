import * as THREE from "three";
import { initShorFlow, stepForward } from "./shor-flow.js";
import { bindExclusive, releaseExclusive } from "./utils/dom-events.js";
import { createViewManager } from "./controllers/view-manager.js";
import { createBlochController } from "./controllers/bloch-controller.js";
import { createGatesController } from "./controllers/gates-controller.js";
import { createEntangleController } from "./controllers/entangle-controller.js";
import { createProcessorController } from "./controllers/processor-controller.js";
import {
  createAnimationLoop,
  disposeShowcaseResources,
  tickActive,
} from "./utils/scene-lifecycle.js";

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
const owned = [];
function on(el, group, type, handler) {
  const ac = bindExclusive(el, group, type, handler);
  if (ac) owned.push(() => releaseExclusive(el, group, ac));
}
on(shorPlaySide, "shor-side-play", "click", () => {
  viewManager.switchView("shor");
  ensureShorController().play();
});
on(shorNextSide, "shor-side-next", "click", () => {
  viewManager.switchView("shor");
  const ctrl = ensureShorController();
  ctrl.selectStep(stepForward(ctrl.getActiveStep()));
});

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

on(window, "showcase-resize", "resize", resize);
resize();

const clock = new THREE.Clock();
let elapsedTime = 0;
const tickMap = { bloch, gates, entangle, processor };
const controllers = [bloch, gates, entangle, processor];

const loop = createAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  elapsedTime += dt;
  const t = elapsedTime;
  const view = viewManager.getActiveView();

  tickActive(tickMap, view, t, dt);

  if (view === "bloch") bloch.render(renderer);
  else if (view === "gates") gates.render(renderer);
  else if (view === "entangle") entangle.render(renderer);
  else if (view === "processor") processor.render(renderer);
});

let tornDown = false;

function disposeShowcase() {
  if (tornDown) return;
  tornDown = true;
  loop.stop();
  for (const key of Object.keys(tickMap)) delete tickMap[key];
  for (const ctrl of controllers) ctrl.dispose?.();
  viewManager.dispose?.();
  disposeShowcaseResources({
    unbind: owned,
    renderer,
  });
}

function onPageHide(event) {
  if (event.persisted) return;
  disposeShowcase();
}

on(window, "showcase-pagehide", "pagehide", onPageHide);
loop.start();