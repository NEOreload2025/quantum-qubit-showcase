import { describe, expect, it, vi } from "vitest";
import {
  activateOrbit,
  createAnimationLoop,
  disposeAllOrbits,
  disposeObject3D,
  disposeOrbit,
  disposeRenderer,
  disposeShowcaseResources,
  syncOrbitListeners,
  tickActive,
} from "../utils/scene-lifecycle.js";

function fakeOrbit() {
  let links = 0;
  const orbit = {
    enabled: true,
    disposeCount: 0,
    get links() {
      return links;
    },
    connect() {
      links += 1;
    },
    disconnect() {
      links -= 1;
    },
    dispose() {
      this.disposeCount += 1;
      this.disconnect();
    },
  };
  orbit.connect();
  return orbit;
}

function orbits() {
  return {
    bloch: fakeOrbit(),
    gates: fakeOrbit(),
    entangle: fakeOrbit(),
    processor: fakeOrbit(),
  };
}

describe("OrbitControls listener sync", () => {
  it("keeps a single listener set on the active control", () => {
    const group = orbits();
    syncOrbitListeners(group, "bloch");
    expect(group.bloch.links).toBe(1);
    expect(group.gates.links).toBe(0);
    expect(group.entangle.links).toBe(0);
    expect(group.processor.links).toBe(0);
    expect(group.gates.disposeCount).toBe(1);

    syncOrbitListeners(group, "bloch");
    expect(group.bloch.links).toBe(1);
    expect(group.gates.disposeCount).toBe(1);

    syncOrbitListeners(group, "gates");
    expect(group.bloch.links).toBe(0);
    expect(group.gates.links).toBe(1);
    expect(group.entangle.links).toBe(0);

    syncOrbitListeners(group, "shor");
    expect(group.bloch.links).toBe(0);
    expect(group.gates.links).toBe(0);
    expect(group.entangle.links).toBe(0);
    expect(group.processor.links).toBe(0);
  });

  it("does not dispose an already released control again", () => {
    const orbit = fakeOrbit();
    disposeOrbit(orbit);
    disposeOrbit(orbit);
    expect(orbit.disposeCount).toBe(1);
    expect(orbit.links).toBe(0);
    expect(orbit.enabled).toBe(false);
    activateOrbit(orbit);
    expect(orbit.links).toBe(1);
    expect(orbit.enabled).toBe(true);
  });

  it("releases every control on teardown", () => {
    const group = orbits();
    syncOrbitListeners(group, "processor");
    disposeAllOrbits(group);
    expect(group.processor.links).toBe(0);
    expect(group.bloch.disposeCount).toBe(1);
    expect(group.processor.disposeCount).toBe(1);
  });
});

describe("tickActive", () => {
  it("ticks only the visible scene", () => {
    const calls = [];
    const controllers = {
      bloch: { tick: (...args) => calls.push(["bloch", ...args]) },
      gates: { tick: () => calls.push(["gates"]) },
      entangle: { tick: (...args) => calls.push(["entangle", ...args]) },
      processor: { tick: () => calls.push(["processor"]) },
    };
    tickActive(controllers, "entangle", 3, 0.016);
    tickActive(controllers, "shor", 4, 0.016);
    expect(calls).toEqual([["entangle", 3, 0.016, "entangle"]]);
  });
});

describe("GPU teardown", () => {
  it("disposes geometries, materials, and a shared texture once", () => {
    const texture = { isTexture: true, dispose: vi.fn() };
    const material = { map: texture, dispose: vi.fn() };
    const geometry = { dispose: vi.fn() };
    const child = { geometry, material };
    const root = {
      traverse(visit) {
        visit(root);
        visit(child);
        visit(child);
      },
    };

    disposeObject3D(root);
    disposeObject3D(root);
    expect(geometry.dispose).toHaveBeenCalledTimes(1);
    expect(material.dispose).toHaveBeenCalledTimes(1);
    expect(texture.dispose).toHaveBeenCalledTimes(1);
  });

  it("disposes array materials and the renderer once", () => {
    const materials = [{ dispose: vi.fn() }, { dispose: vi.fn() }];
    disposeObject3D({ geometry: { dispose: vi.fn() }, material: materials });
    expect(materials[0].dispose).toHaveBeenCalledTimes(1);
    expect(materials[1].dispose).toHaveBeenCalledTimes(1);

    const renderer = { dispose: vi.fn(), forceContextLoss: vi.fn() };
    disposeRenderer(renderer);
    disposeRenderer(renderer);
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    expect(renderer.forceContextLoss).toHaveBeenCalledTimes(1);
  });

  it("stops the frame loop before releasing resources", () => {
    const order = [];
    let scheduled = null;
    let handle = 0;
    const loop = createAnimationLoop(
      () => order.push("frame"),
      (fn) => {
        scheduled = fn;
        handle += 1;
        return handle;
      },
      (id) => order.push(`cancel:${id}`),
    );
    loop.start();
    loop.start();
    expect(handle).toBe(1);
    scheduled();
    expect(order).toEqual(["frame"]);

    const renderer = {
      dispose: () => order.push("renderer"),
      forceContextLoss: () => order.push("context"),
    };
    disposeShowcaseResources({
      loop,
      unbind: [() => order.push("unbind")],
      roots: [],
      renderer,
    });
    expect(loop.running).toBe(false);
    expect(order).toEqual(["frame", "cancel:2", "unbind", "renderer", "context"]);
    scheduled();
    expect(order.filter((item) => item === "frame")).toHaveLength(1);
  });
});
