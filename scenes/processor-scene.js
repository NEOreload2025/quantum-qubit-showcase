import * as THREE from "three";

export function createProcessorScene() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 4.5, 6);

  scene.add(new THREE.AmbientLight(0x223355, 0.5));
  const key = new THREE.DirectionalLight(0x88ddff, 1.4);
  key.position.set(2, 8, 4);
  scene.add(key);
  const rim = new THREE.PointLight(0xa78bfa, 1, 30);
  rim.position.set(-4, 2, -2);
  scene.add(rim);

  const group = new THREE.Group();
  scene.add(group);

  group.add(
    new THREE.Mesh(
      new THREE.BoxGeometry(5.5, 0.25, 4),
      new THREE.MeshPhysicalMaterial({
        color: 0x0c1428,
        metalness: 0.7,
        roughness: 0.3,
        clearcoat: 0.8,
      })
    )
  );
  group.children[0].position.y = -0.5;

  const circuit = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 3.5),
    new THREE.MeshBasicMaterial({ color: 0x1a3050, transparent: true, opacity: 0.6 })
  );
  circuit.rotation.x = -Math.PI / 2;
  circuit.position.y = -0.36;
  group.add(circuit);

  const grid = new THREE.GridHelper(5, 20, 0x5ce1ff, 0x1a2844);
  grid.position.y = -0.35;
  grid.material.opacity = 0.25;
  grid.material.transparent = true;
  group.add(grid);

  const cryostatRing = new THREE.Mesh(
    new THREE.TorusGeometry(3.8, 0.06, 8, 64),
    new THREE.MeshBasicMaterial({ color: 0x5ce1ff, transparent: true, opacity: 0.4 })
  );
  cryostatRing.rotation.x = Math.PI / 2;
  cryostatRing.position.y = 0.8;
  group.add(cryostatRing);

  const qubitPositions = [];
  const qubitMeshes = [];
  const rows = 3;
  const cols = 4;
  const spacing = 1.1;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c - (cols - 1) / 2) * spacing;
      const z = (r - (rows - 1) / 2) * spacing;
      qubitPositions.push(new THREE.Vector3(x, 0.15, z));

      const qubit = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 24, 24),
        new THREE.MeshPhysicalMaterial({
          color: 0x5ce1ff,
          emissive: 0x1a6080,
          emissiveIntensity: 0.6,
          metalness: 0.3,
          roughness: 0.2,
          clearcoat: 1,
        })
      );
      qubit.position.set(x, 0.15, z);
      qubit.userData.phase = Math.random() * Math.PI * 2;
      qubitMeshes.push(qubit);
      group.add(qubit);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.28, 0.015, 8, 32),
        new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.5 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, 0.15, z);
      group.add(ring);
    }
  }

  const entanglePairs = [
    [0, 5], [1, 6], [2, 9], [3, 10], [4, 7], [5, 8],
    [6, 11], [0, 3], [4, 8], [1, 9], [2, 6],
  ];
  const entangleLines = entanglePairs.map(([a, b]) => {
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([qubitPositions[a], qubitPositions[b]]),
      new THREE.LineBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.45 })
    );
    line.position.y = 0.15;
    group.add(line);
    return line;
  });

  return { scene, camera, group, cryostatRing, qubitMeshes, entangleLines };
}
