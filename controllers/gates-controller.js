import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CIRCUIT_STEPS, blochCoordsFromState } from "../utils/quantum-math.js";
import { WOBBLE } from "../utils/animation-timing.js";
import { createGatesScene } from "../scenes/gates-scene.js";

export function createGatesController({ canvas }) {
  const gates = createGatesScene();
  const orbit = new OrbitControls(gates.camera, canvas);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.06;
  orbit.minDistance = 4;
  orbit.maxDistance = 12;
  orbit.enabled = false;

  const circuitStepEl = document.getElementById("circuit-step");
  const circuitDescEl = document.getElementById("circuit-desc");
  const circuitPlayBtn = document.getElementById("circuit-play");
  const circuitNextBtn = document.getElementById("circuit-next");

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
    refreshBlochPreview(0);
  }

  function refreshBlochPreview(t) {
    const step = CIRCUIT_STEPS[circuitStep];
    const coords = blochCoordsFromState(step.q1);
    gates.blochPreview.setVector(
      new THREE.Vector3(coords.x, coords.y, coords.z),
      Boolean(step.reducedMixed),
      t
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

  function tick(t, _dt, activeView) {
    if (circuitPlaying || activeView === "gates") {
      gates.setPulseProgress(circuitStep, circuitSubT, t);
      refreshBlochPreview(t);
      gates.root.rotation.y = Math.sin(t * WOBBLE) * 0.05;
    }
    orbit.update();
  }

  function render(renderer) {
    renderer.render(gates.scene, gates.camera);
  }

  return { camera: gates.camera, orbit, tick, render };
}