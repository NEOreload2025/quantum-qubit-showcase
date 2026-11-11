// OrbitControls (three r170) connects pointer, wheel, and key listeners in the
// constructor and again on every connect() call. connect() does not replace an
// existing set, and `.enabled = false` leaves those listeners in place.
// Inactive views share one canvas, so their controls must be disconnected
// (dispose()) on switch and reconnected as a single set when shown again.

const linkState = new WeakMap();
const disposedGpu = new WeakSet();
const disposedRenderers = new WeakSet();

function mark(orbit, state) {
  linkState.set(orbit, state);
}

/**
 * Drop DOM listeners for one OrbitControls instance.
 * Safe to call more than once.
 */
export function disposeOrbit(orbit) {
  if (!orbit || linkState.get(orbit) === "down") return;
  if (typeof orbit.dispose === "function") orbit.dispose();
  else if (typeof orbit.disconnect === "function") orbit.disconnect();
  orbit.enabled = false;
  mark(orbit, "down");
}

/**
 * Guarantee exactly one listener set on `orbit`.
 * Controls are constructed already connected, so the first activation
 * disconnects that set before connecting again. That also makes this control
 * the last writer of canvas touch-action (disconnect sets "auto").
 */
export function activateOrbit(orbit) {
  if (!orbit) return;
  if (linkState.get(orbit) !== "down") {
    if (typeof orbit.disconnect === "function") orbit.disconnect();
    else if (typeof orbit.dispose === "function") orbit.dispose();
  }
  if (typeof orbit.connect === "function") orbit.connect();
  orbit.enabled = true;
  mark(orbit, "live");
}

/** Only `activeView`'s controls stay connected. Any other name releases all. */
export function syncOrbitListeners(orbits, activeView) {
  const active = orbits?.[activeView] ?? null;
  for (const orbit of Object.values(orbits ?? {})) {
    if (orbit && orbit !== active) disposeOrbit(orbit);
  }
  if (active) activateOrbit(active);
}

export function disposeAllOrbits(orbits) {
  for (const orbit of Object.values(orbits ?? {})) disposeOrbit(orbit);
}

function disposeMaterial(material) {
  const list = Array.isArray(material) ? material : [material];
  for (const mat of list) {
    if (!mat || disposedGpu.has(mat)) continue;
    disposedGpu.add(mat);
    for (const value of Object.values(mat)) {
      if (value?.isTexture && !disposedGpu.has(value)) {
        disposedGpu.add(value);
        value.dispose?.();
      }
    }
    mat.dispose?.();
  }
}

/** Release geometries, materials, and textures under a scene graph. */
export function disposeObject3D(root) {
  if (!root) return;
  const visit = (obj) => {
    const geo = obj?.geometry;
    if (geo && !disposedGpu.has(geo)) {
      disposedGpu.add(geo);
      geo.dispose?.();
    }
    if (obj?.material) disposeMaterial(obj.material);
  };
  if (typeof root.traverse === "function") root.traverse(visit);
  else visit(root);
}

export function disposeRenderer(renderer) {
  if (!renderer || disposedRenderers.has(renderer)) return;
  disposedRenderers.add(renderer);
  renderer.dispose?.();
  renderer.forceContextLoss?.();
}

/** Tick the controller for the visible view and leave the others idle. */
export function tickActive(controllers, view, t, dt) {
  const ctrl = controllers?.[view];
  if (typeof ctrl?.tick === "function") ctrl.tick(t, dt, view);
}

export function createAnimationLoop(
  callback,
  raf = globalThis.requestAnimationFrame,
  caf = globalThis.cancelAnimationFrame,
) {
  let handle = 0;
  let running = false;

  function frame() {
    if (!running) return;
    handle = raf(frame);
    callback();
  }

  return {
    start() {
      if (running) return;
      running = true;
      handle = raf(frame);
    },
    stop() {
      running = false;
      if (handle) {
        caf(handle);
        handle = 0;
      }
    },
    get running() {
      return running;
    },
  };
}

/**
 * Full page teardown: stop the frame loop, run caller unbinders,
 * disconnect every control, free GPU resources, and drop the WebGL context.
 */
export function disposeShowcaseResources({
  loop,
  unbind = [],
  orbits,
  roots = [],
  renderer,
} = {}) {
  loop?.stop?.();
  for (const fn of unbind) fn?.();
  if (orbits) disposeAllOrbits(orbits);
  for (const root of roots) disposeObject3D(root);
  if (renderer) disposeRenderer(renderer);
}
