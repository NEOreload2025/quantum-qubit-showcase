import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  TWO_QUBIT_PRESETS,
  stateFromBloch,
  blochFromState,
  blochCoordsFromState,
} from "../utils/quantum-math.js";
import { createEntangleScene } from "../scenes/entangle-scene.js";

export function createEntangleController({ canvas }) {
  const entangle = createEntangleScene();
  const orbit = new OrbitControls(entangle.camera, canvas);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.06;
  orbit.minDistance = 3.5;
  orbit.maxDistance = 10;
  orbit.enabled = false;

  const entangleFormula = document.getElementById("entangle-formula");
  const bellButtons = document.querySelectorAll("[data-bell]");
  const measureButtons = document.querySelectorAll("[data-measure]");

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

  function tick(t) {
    const preset = TWO_QUBIT_PRESETS[activeBell];
    entangle.animateLink(t, preset?.entangled);
    entangle.root.rotation.y = Math.sin(t * 0.06) * 0.04;
    if (measuredQ1) {
      entangle.measureRing.material.opacity = 0.4 + Math.sin(t * 4) * 0.2;
    } else {
      entangle.measureRing.material.opacity *= 0.95;
    }
    orbit.update();
  }

  function render(renderer) {
    renderer.render(entangle.scene, entangle.camera);
  }

  return { camera: entangle.camera, orbit, tick, render };
}