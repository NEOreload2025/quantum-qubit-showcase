import { describe, expect, it } from "vitest";
import { bindExclusive, releaseExclusive } from "../utils/dom-events.js";

describe("bindExclusive", () => {
  it("replaces a handler instead of stacking it", () => {
    const el = document.createElement("button");
    let seen = 0;
    bindExclusive(el, "slot", "click", () => {
      seen += 1;
    });
    const current = bindExclusive(el, "slot", "click", () => {
      seen += 10;
    });
    el.click();
    expect(seen).toBe(10);
    releaseExclusive(el, "slot", current);
    el.click();
    expect(seen).toBe(10);
  });

  it("does not let a replaced owner remove the new handler", () => {
    const el = document.createElement("button");
    let seen = 0;
    const stale = bindExclusive(el, "slot", "click", () => {
      seen += 1;
    });
    bindExclusive(el, "slot", "click", () => {
      seen += 10;
    });
    releaseExclusive(el, "slot", stale);
    el.click();
    expect(seen).toBe(10);
  });
});
