/** @typedef {{ re: number, im: number }} Complex */

/** @param {number} re @param {number} [im] @returns {Complex} */
export function c(re, im = 0) {
  return { re, im };
}

/** @param {Complex} a @param {Complex} b @returns {Complex} */
export function cAdd(a, b) {
  return { re: a.re + b.re, im: a.im + b.im };
}

/** @param {Complex} a @param {Complex} b @returns {Complex} */
export function cMul(a, b) {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

/** @param {Complex} a @param {number} s @returns {Complex} */
export function cScale(a, s) {
  return { re: a.re * s, im: a.im * s };
}

/** @param {Complex} a @returns {number} */
export function cAbs(a) {
  return Math.sqrt(a.re * a.re + a.im * a.im);
}

/** @param {Complex} a @returns {Complex} */
export function cNorm(a) {
  const mag = cAbs(a) || 1;
  return { re: a.re / mag, im: a.im / mag };
}

/** @typedef {{ alpha: Complex, beta: Complex }} QubitState */

/** @param {number} thetaDeg @param {number} phiDeg @returns {QubitState} */
export function stateFromBloch(thetaDeg, phiDeg) {
  const t = (thetaDeg * Math.PI) / 180;
  const p = (phiDeg * Math.PI) / 180;
  const cosHalf = Math.cos(t / 2);
  const sinHalf = Math.sin(t / 2);
  return {
    alpha: c(cosHalf),
    beta: c(sinHalf * Math.cos(p), sinHalf * Math.sin(p)),
  };
}

/** @param {QubitState} s @returns {{ theta: number, phi: number, mixed: boolean, purity?: number }} */
export function blochFromState(s) {
  const a = s.alpha;
  const b = s.beta;
  const prob0 = a.re * a.re + a.im * a.im;
  const prob1 = b.re * b.re + b.im * b.im;
  const purity = prob0 * prob0 + prob1 * prob1;

  if (purity < 0.98) {
    return { theta: 90, phi: 0, mixed: true, purity };
  }

  const theta = 2 * Math.acos(Math.min(1, Math.sqrt(prob0))) * (180 / Math.PI);
  let phi = 0;
  if (Math.sqrt(prob1) > 0.01) {
    phi = (Math.atan2(b.im, b.re) - Math.atan2(a.im, a.re)) * (180 / Math.PI);
    if (phi < 0) phi += 360;
  }
  return { theta, phi, mixed: false, purity };
}

/** @param {QubitState} s @returns {string} */
export function formatQubit(s) {
  const fmt = (x) => (Math.abs(x) < 0.005 ? "0" : x.toFixed(2));
  const a = s.alpha;
  const b = s.beta;
  let betaStr;
  if (Math.abs(b.im) < 0.005) {
    betaStr = `${fmt(b.re)}|1⟩`;
  } else if (Math.abs(b.re) < 0.005) {
    betaStr = `${fmt(b.im)}i|1⟩`;
  } else {
    betaStr = `(${fmt(b.re)}${b.im >= 0 ? "+" : ""}${fmt(b.im)}i)|1⟩`;
  }
  return `|ψ⟩ = ${fmt(a.re)}|0⟩ + ${betaStr}`;
}

const SQRT2 = Math.SQRT1_2;

/** @type {Record<string, (s: QubitState) => QubitState>} */
export const GATES = {
  H: (s) => ({
    alpha: cScale(cAdd(s.alpha, s.beta), SQRT2),
    beta: cScale(cAdd(s.alpha, cScale(s.beta, -1)), SQRT2),
  }),
  X: (s) => ({ alpha: s.beta, beta: s.alpha }),
  Z: (s) => ({ alpha: s.alpha, beta: cScale(s.beta, -1) }),
  Y: (s) => ({
    alpha: c(-s.beta.im, s.beta.re),
    beta: c(s.alpha.im, -s.alpha.re),
  }),
};

/** @param {QubitState} s @returns {{ x: number, y: number, z: number, mixed: boolean }} */
export function blochCoordsFromState(s) {
  const { theta, phi, mixed } = blochFromState(s);
  if (mixed) return { x: 0, y: 0, z: 0, mixed: true };
  const t = (theta * Math.PI) / 180;
  const p = (phi * Math.PI) / 180;
  return {
    x: Math.sin(t) * Math.cos(p),
    y: Math.sin(t) * Math.sin(p),
    z: Math.cos(t),
    mixed: false,
  };
}

export const BLOCH_PRESETS = {
  zero: { theta: 0, phi: 0 },
  one: { theta: 180, phi: 0 },
  plus: { theta: 90, phi: 0 },
  minus: { theta: 90, phi: 180 },
};

/** @typedef {{ label: string, formula: string, q1: QubitState, q2: QubitState, entangled: boolean, reducedMixed?: boolean, measureMap?: Record<string, QubitState> }} TwoQubitPreset */

export const TWO_QUBIT_PRESETS = {
  product00: {
    label: "|00⟩",
    formula: "|ψ⟩ = |00⟩",
    q1: stateFromBloch(0, 0),
    q2: stateFromBloch(0, 0),
    entangled: false,
  },
  productPlusPlus: {
    label: "|++⟩",
    formula: "|ψ⟩ = |++⟩ = (|0⟩+|1⟩)/√2 ⊗ (|0⟩+|1⟩)/√2",
    q1: stateFromBloch(90, 0),
    q2: stateFromBloch(90, 0),
    entangled: false,
  },
  phiPlus: {
    label: "|Φ⁺⟩",
    formula: "|ψ⟩ = (|00⟩ + |11⟩) / √2",
    q1: stateFromBloch(90, 0),
    q2: stateFromBloch(90, 0),
    entangled: true,
    reducedMixed: true,
    measureMap: {
      "0": stateFromBloch(0, 0),
      "1": stateFromBloch(180, 0),
    },
  },
  phiMinus: {
    label: "|Φ⁻⟩",
    formula: "|ψ⟩ = (|00⟩ − |11⟩) / √2",
    q1: stateFromBloch(90, 0),
    q2: stateFromBloch(90, 0),
    entangled: true,
    reducedMixed: true,
    measureMap: {
      "0": stateFromBloch(0, 0),
      "1": stateFromBloch(180, 0),
    },
  },
  psiPlus: {
    label: "|Ψ⁺⟩",
    formula: "|ψ⟩ = (|01⟩ + |10⟩) / √2",
    q1: stateFromBloch(90, 0),
    q2: stateFromBloch(90, 0),
    entangled: true,
    reducedMixed: true,
    measureMap: {
      "0": stateFromBloch(180, 0),
      "1": stateFromBloch(0, 0),
    },
  },
  psiMinus: {
    label: "|Ψ⁻⟩",
    formula: "|ψ⟩ = (|01⟩ − |10⟩) / √2",
    q1: stateFromBloch(90, 0),
    q2: stateFromBloch(90, 0),
    entangled: true,
    reducedMixed: true,
    measureMap: {
      "0": stateFromBloch(180, 0),
      "1": stateFromBloch(0, 0),
    },
  },
};

export const CIRCUIT_STEPS = [
  {
    title: "初始化",
    desc: "|q₀q₁⟩ = |00⟩",
    q1: stateFromBloch(0, 0),
    q2: stateFromBloch(0, 0),
    activeGate: null,
  },
  {
    title: "Hadamard → q₀",
    desc: "H|0⟩ = (|0⟩+|1⟩)/√2",
    q1: stateFromBloch(90, 0),
    q2: stateFromBloch(0, 0),
    activeGate: "H",
  },
  {
    title: "CNOT (q₀→q₁)",
    desc: "控制位 0，目標位 1",
    q1: stateFromBloch(90, 0),
    q2: stateFromBloch(90, 0),
    activeGate: "CNOT",
    entangled: true,
    reducedMixed: true,
  },
  {
    title: "達成 |Φ⁺⟩",
    desc: "(|00⟩+|11⟩)/√2",
    q1: stateFromBloch(90, 0),
    q2: stateFromBloch(90, 0),
    activeGate: null,
    entangled: true,
    reducedMixed: true,
  },
];
