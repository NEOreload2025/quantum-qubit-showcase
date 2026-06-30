import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createProcessorScene } from "../scenes/processor-scene.js";

export function createProcessorController({ canvas }) {
  const processor = createProcessorScene();
  const orbit = new OrbitControls(processor.camera, canvas);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.06;
  orbit.minDistance = 4;
  orbit.maxDistance = 14;
  orbit.enabled = false;

  const entangleToggle = document.getElementById("entangle-toggle");
  entangleToggle.addEventListener("change", () => {
    processor.entangleLines.forEach((line) => {
      line.visible = entangleToggle.checked;
    });
  });

  function tick(t) {
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
    orbit.update();
  }

  function render(renderer) {
    renderer.render(processor.scene, processor.camera);
  }

  return { camera: processor.camera, orbit, tick, render };
}