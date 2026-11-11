import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SHOR_STEPS,
  initShorFlow,
  stepBackward,
  stepForward,
} from "../shor-flow.js";

afterEach(() => {
  vi.useRealTimers();
});

describe("Shor step helpers", () => {
  it("walks the nine published steps without leaving the range", () => {
    expect(SHOR_STEPS.map((step) => step.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(stepForward(-1)).toBe(0);
    expect(stepForward(0)).toBe(1);
    expect(stepForward(8)).toBe(8);
    expect(stepBackward(-1)).toBe(0);
    expect(stepBackward(0)).toBe(0);
    expect(stepBackward(4)).toBe(3);
  });
});

describe("initShorFlow", () => {
  it("does not stack handlers or the play timer when initialized twice", () => {
    vi.useFakeTimers();
    Element.prototype.scrollIntoView = () => {};
    const container = document.createElement("div");
    const first = [];
    const second = [];

    const original = initShorFlow(container, {
      onStepChange(step) {
        first.push(step.id);
      },
    });
    original.play();
    expect(first).toEqual([1]);

    initShorFlow(container, {
      onStepChange(step) {
        second.push(step.id);
      },
    });
    vi.advanceTimersByTime(10_000);
    expect(first).toEqual([1]);
    expect(second).toEqual([]);

    container.querySelector('[data-action="next"]').click();
    container.querySelector('[data-action="next"]').click();
    expect(second).toEqual([1, 2]);
    expect(container.querySelectorAll(".shor-node.active")).toHaveLength(1);
  });

  it("stops playback and ignores clicks after dispose", () => {
    vi.useFakeTimers();
    Element.prototype.scrollIntoView = () => {};
    const container = document.createElement("div");
    const seen = [];
    const ctrl = initShorFlow(container, {
      onStepChange(step) {
        seen.push(step.id);
      },
    });

    ctrl.play();
    vi.advanceTimersByTime(2500);
    expect(seen).toEqual([1, 2]);

    ctrl.dispose();
    vi.advanceTimersByTime(20_000);
    container.querySelector('[data-action="next"]').click();
    container.querySelector(".shor-node").click();
    expect(seen).toEqual([1, 2]);
  });

  it("fires one step callback per node click", () => {
    Element.prototype.scrollIntoView = () => {};
    const container = document.createElement("div");
    let calls = 0;
    initShorFlow(container, { onStepChange() { calls += 1; } });
    initShorFlow(container, { onStepChange() { calls += 1; } });
    calls = 0;
    container.querySelectorAll(".shor-node")[3].click();
    expect(calls).toBe(1);
    expect(container.querySelector(".shor-node.active").dataset.step).toBe("3");
  });
});
