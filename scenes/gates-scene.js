import * as THREE from "three";
import { PULSE } from "../utils/animation-timing.js";
import { createBlochSphere } from "./bloch-sphere.js";

export function createGatesScene() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 2.2, 7.5);

  scene.add(new THREE.AmbientLight(0x334466, 0.55));
  const key = new THREE.DirectionalLight(0x88ccff, 1.3);
  key.position.set(3, 6, 4);
  scene.add(key);
  const rim = new THREE.PointLight(0xa78bfa, 0.9, 25);
  rim.position.set(-4, 1, -2);
  scene.add(rim);

  const root = new THREE.Group();
  scene.add(root);

  const wireY = [0.55, -0.55];
  const wires = wireY.map((y) => {
    const pts = [
      new THREE.Vector3(-4.2, y, 0),
      new THREE.Vector3(4.2, y, 0),
    ];
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0x5ce1ff, transparent: true, opacity: 0.45 })
    );
    root.add(line);
    return line;
  });

  function label(text, x, y, color = 0x8b9bb8) {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#e8edf8";
    ctx.font = "bold 28px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText(text, 64, 40);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, color });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(0.9, 0.45, 1);
    sprite.position.set(x, y, 0);
    root.add(sprite);
    return sprite;
  }

  label("q₀", -4.5, wireY[0]);
  label("q₁", -4.5, wireY[1]);

  function gateBox(x, y, w, h, color, labelText) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, 0.35),
      new THREE.MeshPhysicalMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.15,
        metalness: 0.4,
        roughness: 0.25,
        clearcoat: 0.8,
      })
    );
    mesh.position.set(x, y, 0);
    root.add(mesh);

    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 48px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(labelText, 64, 64);
    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tex, transparent: true })
    );
    sprite.scale.set(0.55, 0.55, 1);
    sprite.position.set(x, y, 0.25);
    root.add(sprite);

    return { mesh, sprite };
  }

  const hGate = gateBox(-1.2, wireY[0], 0.7, 0.7, 0x1a5080, "H");
  const cnotControl = gateBox(1.4, wireY[0], 0.45, 0.45, 0x4a3080, "●");
  const cnotTarget = gateBox(1.4, wireY[1], 0.7, 0.7, 0x1a6040, "⊕");

  const cnotLinePts = [
    new THREE.Vector3(1.4, wireY[0], 0),
    new THREE.Vector3(1.4, wireY[1], 0),
  ];
  const cnotLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(cnotLinePts),
    new THREE.LineBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.7 })
  );
  root.add(cnotLine);

  const blochPreview = createBlochSphere(0.55, 0x34d399);
  blochPreview.group.position.set(3.2, 0, 0);
  root.add(blochPreview.group);

  const pulse = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x5ce1ff })
  );
  pulse.position.set(-4, wireY[0], 0.2);
  root.add(pulse);

  const pulseGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x5ce1ff, transparent: true, opacity: 0.25 })
  );
  pulse.add(pulseGlow);

  return {
    scene,
    camera,
    root,
    blochPreview,
    pulse,
    wireY,
    setGateHighlight(activeGate) {
      hGate.mesh.material.emissiveIntensity = activeGate === "H" ? 0.55 : 0.15;
      cnotControl.mesh.material.emissiveIntensity = activeGate === "CNOT" ? 0.55 : 0.15;
      cnotTarget.mesh.material.emissiveIntensity = activeGate === "CNOT" ? 0.55 : 0.15;
    },
    setPulseProgress(step, subT, t = 0) {
      const positions = [-4, -1.2, 1.4, 3.5];
      const wireIdx = step <= 1 ? 0 : 0;
      const segStart = positions[Math.min(step, 3)];
      const segEnd = positions[Math.min(step + 1, 3)];
      const x = segStart + (segEnd - segStart) * subT;
      pulse.position.set(x, wireY[wireIdx], 0.2);
      if (step >= 2) {
        pulse.children[0].material.opacity = 0.4 + Math.sin(t * PULSE) * 0.2;
      }
    },
  };
}
