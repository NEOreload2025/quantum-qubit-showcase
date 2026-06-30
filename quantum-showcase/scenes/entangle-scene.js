import * as THREE from "three";
import { createBlochSphere } from "./bloch-sphere.js";

export function createEntangleScene() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 1.2, 5.8);

  scene.add(new THREE.AmbientLight(0x334466, 0.6));
  const key = new THREE.DirectionalLight(0x88ccff, 1.2);
  key.position.set(4, 5, 3);
  scene.add(key);
  const fill = new THREE.PointLight(0xa78bfa, 0.7, 20);
  fill.position.set(-3, 0, 2);
  scene.add(fill);

  const root = new THREE.Group();
  scene.add(root);

  const q1 = createBlochSphere(0.85, 0x5ce1ff);
  q1.group.position.set(-1.55, 0, 0);
  root.add(q1.group);

  const q2 = createBlochSphere(0.85, 0xa78bfa);
  q2.group.position.set(1.55, 0, 0);
  root.add(q2.group);

  function label(text, x, y, color) {
    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = color;
    ctx.font = "500 26px Noto Sans TC, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(text, 80, 40);
    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tex, transparent: true })
    );
    sprite.scale.set(1.1, 0.44, 1);
    sprite.position.set(x, y, 0);
    root.add(sprite);
    return sprite;
  }

  label("量子位元 A", -1.55, 1.35, "#5ce1ff");
  label("量子位元 B", 1.55, 1.35, "#a78bfa");

  const linkPts = Array.from({ length: 33 }, (_, i) => {
    const t = i / 32;
    return new THREE.Vector3(
      -0.75 + t * 1.5,
      Math.sin(t * Math.PI) * 0.35,
      Math.cos(t * Math.PI * 2) * 0.15
    );
  });
  const linkGeo = new THREE.BufferGeometry().setFromPoints(linkPts);
  const link = new THREE.Line(
    linkGeo,
    new THREE.LineBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.7 })
  );
  root.add(link);

  const linkParticles = new THREE.Points(
    new THREE.BufferGeometry().setFromPoints(linkPts),
    new THREE.PointsMaterial({ color: 0xf472b6, size: 0.06, transparent: true, opacity: 0.8 })
  );
  root.add(linkParticles);

  const measureRing = new THREE.Mesh(
    new THREE.RingGeometry(0.95, 1.02, 64),
    new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    })
  );
  measureRing.rotation.x = Math.PI / 2;
  q1.group.add(measureRing);

  return {
    scene,
    camera,
    root,
    q1,
    q2,
    link,
    linkParticles,
    measureRing,
    setLinkVisible(visible) {
      link.visible = visible;
      linkParticles.visible = visible;
    },
    animateLink(t, entangled) {
      if (!entangled) return;
      link.material.opacity = 0.45 + Math.sin(t * 3) * 0.25;
      link.rotation.y = Math.sin(t * 0.5) * 0.15;
    },
  };
}
