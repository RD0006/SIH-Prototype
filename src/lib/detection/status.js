/**
 * Engine lifecycle states.
 *
 * Deliberately kept in its own module with no dependencies: the context and the
 * layout chrome need to reason about engine status, and importing it from
 * engine.js would drag the entire transformers.js runtime into the main bundle
 * on first paint. The engine itself is loaded on demand.
 */

export const STATUS = {
  IDLE: "idle",
  LOADING: "loading",
  READY: "ready",
  FALLBACK: "fallback",
  ERROR: "error",
};

export const QUALITY_PRESETS = [
  { id: "fast", label: "Fast", hint: "256px · lowest latency" },
  { id: "balanced", label: "Balanced", hint: "320px · recommended" },
  { id: "accurate", label: "Accurate", hint: "448px · slowest" },
];
