import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  BLOCH_PRESETS,
  GATES,
  stateFromBloch,
  blochFromState,
  formatQubit,
} from "../utils/quantum-math.js";
import { GATE_BLEND, GATE_TRAVEL, PULSE, SPIN } from "../utils/animation-timing.js";
import { createBlochSphere } from "../scenes/bloch-sphere.js";

export function createBlochController({ canvas, scene: blochScene }) {
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(3.2, 1.8, 3.2);

  const orbit = new OrbitControls(camera, canvas);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.06;
  orbit.minDistance = 2.2;
  orbit.maxDistance = 8;

  blochScene.add(new THREE.AmbientLight(0x334466, 0.6));
  const key = new THREE.DirectionalLight(0x88ccff, 1.2);
  key.position.set(4, 6, 3);
  blochScene.add(key);
  const fill = new THREE.PointLight(0xa78bfa, 0.8, 20);
  fill.position.set(-3, -1, 2);
  blochScene.add(fill);

  const bloch = createBlochSphere(1, 0x34d399);
  blochScene.add(bloch.group);

  const particlesGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(200 * 3);
  for (let i = 0; i < 200; i++) {
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
  let gatePulseEndT = 0;

  const stateFormula = document.getElementById("state-formula");
  const thetaSlider = document.getElementById("theta-slider");
  const phiSlider = document.getElementById("phi-slider");
  const thetaValue = document.getElementById("theta-value");
  const phiValue = document.getElementById("phi-value");
  const stateButtons = document.querySelectorAll("[data-state]");
  const gateButtons = document.querySelectorAll("[data-gate]");

  function blochVector(thetaDeg, phiDeg) {
    const t = (thetaDeg * Math.PI) / 180;
    const p = (phiDeg * Math.PI) / 180;
    return new THREE.Vector3(Math.sin(t) * Math.cos(p), Math.sin(t) * Math.sin(p), Math.cos(t));
  }

  function syncBlochFromState(s) {
    qubitState = s;
    const { theta, phi } = blochFromState(s);
    targetTheta = theta;
    targetPhi = phi;
    thetaSlider.value = Math.round(theta);
    phiSlider.value = Math.round(phi);
    thetaValue.textContent = `${Math.round(theta)}°`;
    phiValue.textContent = `${Math.round(phi)}°`;
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
      gateAnim = {
        start: blochFromState(start),
        end: blochFromState(end),
        endState: end,
        t: 0,
      };
      btn.classList.add("gate-flash");
      setTimeout(() => btn.classList.remove("gate-flash"), 500);
      gatePulseEndT = -1;
    });
  });

  setBlochAngles(0, 0);

  function tick(t, dt) {
    if (gatePulseEndT === -1) gatePulseEndT = t + 0.4;

    if (gateAnim) {
      gateAnim.t = Math.min(1, gateAnim.t + dt * GATE_TRAVEL);
      const ease = gateAnim.t * gateAnim.t * (3 - 2 * gateAnim.t);
      currentTheta = gateAnim.start.theta + (gateAnim.end.theta - gateAnim.start.theta) * ease;
      currentPhi = gateAnim.start.phi + (gateAnim.end.phi - gateAnim.start.phi) * ease;
      if (gateAnim.t >= 1) {
        syncBlochFromState(gateAnim.endState);
        gateAnim = null;
      }
    } else {
      const blend = 1 - Math.exp(-GATE_BLEND * dt);
      currentTheta += (targetTheta - currentTheta) * blend;
      currentPhi += (targetPhi - currentPhi) * blend;
    }

    const vec = blochVector(currentTheta, currentPhi);
    bloch.setVector(vec, blochFromState(qubitState).mixed, t);

    if (t < gatePulseEndT) {
      bloch.group.scale.setScalar(1 + Math.sin((gatePulseEndT - t) * PULSE * 10) * 0.03);
    } else {
      bloch.group.scale.setScalar(1);
    }

    bloch.group.rotation.y = t * SPIN;
    particles.rotation.y = t * SPIN * 0.5;
    orbit.update();
  }

  function render(renderer) {
    renderer.render(blochScene, camera);
  }

  return { camera, orbit, tick, render };
}