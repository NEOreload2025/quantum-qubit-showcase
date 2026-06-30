import * as THREE from "three";
import { PULSE } from "../utils/animation-timing.js";

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

  function textSprite(text, color = "#e8edf8", fontSize = 22) {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = color;
    ctx.font = `600 ${fontSize}px JetBrains Mono, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 64, 32);
    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })
    );
    sprite.renderOrder = 10;
    return sprite;
  }

  const labelSpecs = [
    { text: "|0⟩", pos: [0, 0, r * 1.28], color: "#5ce1ff", scale: [0.75, 0.38, 1] },
    { text: "|1⟩", pos: [0, 0, -r * 1.28], color: "#a78bfa", scale: [0.75, 0.38, 1] },
    { text: "|+⟩", pos: [r * 1.28, 0, 0], color: "#34d399", scale: [0.65, 0.33, 1] },
    { text: "疊加", pos: [0, r * 1.15, 0], color: "#f472b6", scale: [0.7, 0.35, 1], fontSize: 18 },
  ];
  labelSpecs.forEach(({ text, pos, color, scale, fontSize }) => {
    const s = textSprite(text, color, fontSize);
    s.position.set(...pos);
    s.scale.set(...scale);
    group.add(s);
  });

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
    setVector(vec, mixed = false, t = 0) {
      if (mixed || vec.length() < 0.05) {
        arrow.visible = false;
        glow.visible = false;
        mixedCloud.visible = true;
        mixedCloud.material.opacity = 0.3 + Math.sin(t * PULSE) * 0.1;
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
