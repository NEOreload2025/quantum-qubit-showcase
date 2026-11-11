import { afterEach, describe, expect, it, vi } from "vitest";
import { createViewManager } from "../controllers/view-manager.js";

afterEach(() => {
  vi.useRealTimers();
});

function fakeOrbit() {
  let links = 0;
  let listenerAdds = 0;
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
    addEventListener() {
      listenerAdds += 1;
    },
    listenerCount: () => listenerAdds,
  };
  orbit.connect();
  return orbit;
}

function makeOrbits() {
  return {
    bloch: fakeOrbit(),
    gates: fakeOrbit(),
    entangle: fakeOrbit(),
    processor: fakeOrbit(),
  };
}

function panel() {
  return document.createElement("section");
}

function createHarness({ orbits = makeOrbits(), tabs, canvasWrap } = {}) {
  const viewTabs = tabs ?? ["bloch", "gates", "entangle", "processor", "shor"].map((view) => {
    const button = document.createElement("button");
    button.dataset.view = view;
    return button;
  });
  const wrap = canvasWrap ?? document.createElement("div");
  const canvas = document.createElement("canvas");
  const shorPanel = document.createElement("div");
  const shorControllerRef = { current: null };
  let shorEnsures = 0;

  const vm = createViewManager({
    tabs: viewTabs,
    canvas,
    canvasWrap: wrap,
    canvasLabel: document.createElement("div"),
    shorPanel,
    controlPanels: {
      bloch: panel(),
      gates: panel(),
      entangle: panel(),
      processor: panel(),
      shor: panel(),
    },
    blochLegend: document.createElement("div"),
    gateLegend: document.createElement("div"),
    entangleLegend: document.createElement("div"),
    orbits,
    ensureShorController() {
      shorEnsures += 1;
      return {
        getActiveStep: () => -1,
        selectStep() {},
        stopPlay() {},
        dispose() {},
      };
    },
    shorControllerRef,
  });

  return { vm, orbits, tabs: viewTabs, canvas, canvasWrap: wrap, shorPanel, shorEnsures: () => shorEnsures };
}

describe("view manager control cleanup", () => {
  it("connects only the active scene and releases the others on switch", async () => {
    vi.useFakeTimers();
    const { vm, orbits, canvas, shorPanel } = createHarness();
    expect(vm.getActiveView()).toBe("bloch");
    expect(orbits.bloch.links).toBe(1);
    expect(orbits.gates.links).toBe(0);
    expect(orbits.entangle.disposeCount).toBe(1);
    expect(canvas.hidden).toBe(false);

    const toGates = vm.switchView("gates");
    await vi.advanceTimersByTimeAsync(200);
    await toGates;
    expect(vm.getActiveView()).toBe("gates");
    expect(orbits.gates.links).toBe(1);
    expect(orbits.bloch.links).toBe(0);
    expect(orbits.processor.links).toBe(0);

    const toShor = vm.switchView("shor");
    await vi.advanceTimersByTimeAsync(200);
    await toShor;
    expect(vm.getActiveView()).toBe("shor");
    expect(canvas.hidden).toBe(true);
    expect(shorPanel.hidden).toBe(false);
    for (const orbit of Object.values(orbits)) {
      expect(orbit.links).toBe(0);
    }
  });

  it("does not stack tab clicks or drag listeners when set up twice", () => {
    const shared = makeOrbits();
    const tabs = ["bloch", "gates", "entangle", "processor", "shor"].map((view) => {
      const button = document.createElement("button");
      button.dataset.view = view;
      return button;
    });
    const first = createHarness({
      orbits: shared,
      tabs,
      canvasWrap: document.createElement("div"),
    });
    const second = createHarness({
      orbits: shared,
      tabs,
      canvasWrap: document.createElement("div"),
    });

    expect(shared.bloch.links).toBe(1);
    expect(shared.gates.disposeCount).toBe(1);

    tabs[1].click();
    expect(second.canvasWrap.classList.contains("view-fade")).toBe(true);
    expect(first.canvasWrap.classList.contains("view-fade")).toBe(false);

    const drag = fakeOrbit();
    second.vm.bindOrbitDragFeedback(drag, "gates");
    second.vm.bindOrbitDragFeedback(drag, "gates");
    expect(drag.listenerCount()).toBe(2);
  });
});
