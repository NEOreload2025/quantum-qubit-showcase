import { describe, expect, it } from "vitest";
import {
  GATES,
  TWO_QUBIT_PRESETS,
  blochFromState,
  c,
  formatQubit,
  stateFromBloch,
} from "../utils/quantum-math.js";

function probabilities(state) {
  return {
    p0: state.alpha.re ** 2 + state.alpha.im ** 2,
    p1: state.beta.re ** 2 + state.beta.im ** 2,
  };
}

describe("formatQubit", () => {
  it("prints a computational basis state", () => {
    expect(formatQubit(stateFromBloch(0, 0))).toBe("|ψ⟩ = 1.00|0⟩ + 0|1⟩");
  });

  it("keeps the imaginary part of alpha", () => {
    expect(formatQubit({ alpha: c(0, 0.5), beta: c(0.2, 0) })).toBe(
      "|ψ⟩ = 0.50i|0⟩ + 0.20|1⟩",
    );
    expect(formatQubit({ alpha: c(0.5, -0.5), beta: c(0.5, 0.5) })).toBe(
      "|ψ⟩ = (0.50-0.50i)|0⟩ + (0.50+0.50i)|1⟩",
    );
  });

  it("shows the imaginary amplitude of Y|0⟩", () => {
    expect(formatQubit(GATES.Y(stateFromBloch(0, 0)))).toBe("|ψ⟩ = 0|0⟩ + -1.00i|1⟩");
  });
});

describe("gates", () => {
  it("applies H, X, Z, and Y to basis states", () => {
    const plus = GATES.H(stateFromBloch(0, 0));
    expect(plus.alpha.re).toBeCloseTo(Math.SQRT1_2);
    expect(plus.beta.re).toBeCloseTo(Math.SQRT1_2);
    expect(plus.alpha.im).toBeCloseTo(0);
    expect(plus.beta.im).toBeCloseTo(0);

    const back = GATES.H(plus);
    expect(back.alpha.re).toBeCloseTo(1);
    expect(back.beta.re).toBeCloseTo(0);

    const flipped = GATES.X(stateFromBloch(0, 0));
    expect(flipped.alpha.re).toBeCloseTo(0);
    expect(flipped.beta.re).toBeCloseTo(1);
    const restored = GATES.X(flipped);
    expect(restored.alpha.re).toBeCloseTo(1);
    expect(restored.beta.re).toBeCloseTo(0);

    const minus = GATES.Z(stateFromBloch(90, 0));
    expect(minus.alpha.re).toBeCloseTo(Math.SQRT1_2);
    expect(minus.beta.re).toBeCloseTo(-Math.SQRT1_2);

    const y0 = GATES.Y(stateFromBloch(0, 0));
    expect(y0.alpha.re).toBeCloseTo(0);
    expect(y0.alpha.im).toBeCloseTo(0);
    expect(y0.beta.re).toBeCloseTo(0);
    expect(y0.beta.im).toBeCloseTo(-1);
  });
});

describe("measurement and entanglement", () => {
  it("gives basis and superposition probabilities", () => {
    expect(probabilities(stateFromBloch(0, 0)).p0).toBeCloseTo(1);
    expect(probabilities(stateFromBloch(180, 0)).p1).toBeCloseTo(1);
    const plus = probabilities(stateFromBloch(90, 0));
    expect(plus.p0).toBeCloseTo(0.5);
    expect(plus.p1).toBeCloseTo(0.5);
    expect(probabilities(GATES.Y(stateFromBloch(0, 0))).p1).toBeCloseTo(1);
  });

  it("collapses Bell partners and leaves product states unentangled", () => {
    for (const key of ["phiPlus", "phiMinus", "psiPlus", "psiMinus"]) {
      const preset = TWO_QUBIT_PRESETS[key];
      expect(preset.entangled).toBe(true);
      expect(preset.reducedMixed).toBe(true);
      expect(blochFromState(preset.measureMap["0"]).mixed).toBe(false);
      expect(blochFromState(preset.measureMap["1"]).mixed).toBe(false);
    }

    expect(blochFromState(TWO_QUBIT_PRESETS.phiPlus.measureMap["0"]).theta).toBeCloseTo(0);
    expect(blochFromState(TWO_QUBIT_PRESETS.phiPlus.measureMap["1"]).theta).toBeCloseTo(180);
    expect(blochFromState(TWO_QUBIT_PRESETS.phiMinus.measureMap["1"]).theta).toBeCloseTo(180);
    expect(blochFromState(TWO_QUBIT_PRESETS.psiPlus.measureMap["0"]).theta).toBeCloseTo(180);
    expect(blochFromState(TWO_QUBIT_PRESETS.psiPlus.measureMap["1"]).theta).toBeCloseTo(0);
    expect(blochFromState(TWO_QUBIT_PRESETS.psiMinus.measureMap["0"]).theta).toBeCloseTo(180);

    expect(TWO_QUBIT_PRESETS.product00.entangled).toBe(false);
    expect(TWO_QUBIT_PRESETS.product00.measureMap).toBeUndefined();
    expect(TWO_QUBIT_PRESETS.productPlusPlus.entangled).toBe(false);
    const product = probabilities(TWO_QUBIT_PRESETS.productPlusPlus.q1);
    expect(product.p0).toBeCloseTo(0.5);
    expect(product.p1).toBeCloseTo(0.5);
  });
});

describe("blochFromState mixed threshold", () => {
  it("treats |0⟩ as pure and states under 0.999 purity as mixed", () => {
    expect(blochFromState(stateFromBloch(0, 0))).toMatchObject({
      mixed: false,
      theta: 0,
      purity: 1,
    });

    const borderline = blochFromState({
      alpha: c(Math.sqrt(0.995), 0),
      beta: c(Math.sqrt(0.005), 0),
    });
    expect(borderline.purity).toBeGreaterThan(0.98);
    expect(borderline.purity).toBeLessThan(0.999);
    expect(borderline.mixed).toBe(true);
  });
});
