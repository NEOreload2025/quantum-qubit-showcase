import * as THREE from "three";

export function createBlochSphere(radius = 1, arrowColor = 0x34d399) {
  const group = new THREE.Group();
  const sphereGeo = new THREE.SphereGeometry(radius, 48, 32);

  group.add(
    new THREE.Mesh(
      sphereGeo,
      new THREE.MeshPhysicalMaterial({
        color: 0x1a2844,
        transparent: true,
        opacity: 0.35,
        roughness: 0.2,
        metalness: 0.1,
        clearcoat: 0.6,
        side: THREE.DoubleSide,
      })
    )
  );

  group.add(
    new THREE.LineSegments(
      new THREE.WireframeGeometry(sphereGeo),
      new THREE.LineBasicMaterial({ color: 0x5ce1ff, transparent: true, opacity: 0.18 })
    )
  );

  const equator = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.998, radius * 1.002, 64),
    new THREE.MeshBasicMaterial({
      color: 0xa78bfa,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    })
  );
  equator.rotation.x = Math.PI / 2;
  group.add(equator);

  const meridianPts = [];
  for (let i = 0; i <= 64; i++) {
    const t = (i / 64) * Math.PI;
    meridianPts.push(new THREE.Vector3(0, Math.sin(t) * radius, Math.cos(t) * radius));
  }
  group.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(meridianPts),
      new THREE.LineBasicMaterial({ color: 0x5ce1ff, transparent: true, opacity: 0.25 })
    )
  );

  function axis(dir, color) {
    const pts = [new THREE.Vector3(), dir.clone().multiplyScalar(radius * 1.35)];
    return new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color })
    );
  }

  group.add(axis(new THREE.Vector3(0, 0, 1), 0x5ce1ff));
  group.add(axis(new THREE.Vector3(0, 0, -1), 0xa78bfa));
  group.add(axis(new THREE.Vector3(1, 0, 0), 0x34d399));

  function pole(pos, color) {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 0.045, 16, 16),
      new THREE.MeshBasicMaterial({ color })
    );
    m.position.copy(pos);
    return m;
  }

  const r = radius;
  group.add(pole(new THREE.Vector3(0, 0, r * 1.05), 0x5ce1ff));
  group.add(pole(new THREE.Vector3(0, 0, -r * 1.05), 0xa78bfa));
  group.add(pole(new THREE.Vector3(r * 1.05, 0, 0), 0x34d399));
  group.add(pole(new THREE.Vector3(-r * 1.05, 0, 0), 0xf472b6));

  const arrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(),
    r * 1.15,
    arrowColor,
    r * 0.12,
    r * 0.07
  );
  group.add(arrow);

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(r * 0.06, 16, 16),
    new THREE.MeshBasicMaterial({ color: arrowColor })
  );
  glow.position.set(0, 0, r * 1.15);
  group.add(glow);

  const mixedCloud = new THREE.Mesh(
    new THREE.SphereGeometry(r * 0.22, 16, 16),
    new THREE.MeshBasicMaterial({
      color: 0xa78bfa,
      transparent: true,
      opacity: 0.35,
    })
  );
  mixedCloud.visible = false;
  group.add(mixedCloud);

  return {
    group,
    arrow,
    glow,
    mixedCloud,
    setVector(vec, mixed = false) {
      if (mixed || vec.length() < 0.05) {
        arrow.visible = false;
        glow.visible = false;
        mixedCloud.visible = true;
        mixedCloud.material.opacity = 0.3 + Math.sin(performance.now() * 0.003) * 0.1;
        return;
      }
      arrow.visible = true;
      glow.visible = true;
      mixedCloud.visible = false;
      const dir = vec.clone().normalize();
      arrow.setDirection(dir);
      arrow.setLength(r * 1.15);
      glow.position.copy(dir.multiplyScalar(r * 1.15));
    },
  };
}
