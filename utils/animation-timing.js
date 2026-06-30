// Shared animation speed scale (seconds-based, frame-rate independent).
export const SPIN = 0.1; // slow continuous rotation: t * SPIN
export const WOBBLE = 0.1; // slow sway: sin(t * WOBBLE) * amplitude
export const PULSE = 2.0; // medium opacity/emissive pulse: sin(t * PULSE)
export const GATE_BLEND = 12; // exponential smoothing: 1 - exp(-GATE_BLEND * dt)
export const GATE_TRAVEL = 3.5; // gate transition progress per second