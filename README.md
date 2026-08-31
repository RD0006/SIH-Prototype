# IBVAP — Intelligent Border Video Analytics Platform

Turns existing, ordinary CCTV into an intelligent surveillance network — in
software, with no new hardware. Built for **SIH26187** (Ministry of Home Affairs
/ Sashastra Seema Bal).

A real object-detection network runs **in the browser** against standard video
feeds and produces tracked identities, virtual-fence intrusion alerts,
explainable threat scores, number-plate reads and filable evidence packages.
No server, no GPU appliance, no smart cameras, and no internet at runtime.

## Run it

```bash
npm ci
npm run fetch:models
npm run dev
```

`fetch:models` vendors the detection weights, the ONNX WASM runtime and the
tesseract OCR assets into the project so the console runs fully offline. It
needs network access once; after that the network cable can come out. Skipping
it leaves the console working but permanently in labelled replay mode.

Requires Node.js 20.19+ or 22.12+.

## Layout

| Path | Contents |
| --- | --- |
| `src/main.jsx` | Entry point and route definitions |
| `src/App.jsx` | Layout shell — sidebar, header, page outlet |
| `src/pages/` | One component per route |
| `src/components/` | `layout/`, `dashboard/`, `surveillance/`, `incidents/`, `evidence/`, `system/`, `tracking/` |
| `src/lib/detection/` | Model loading, low-light enhancement, replay fallback |
| `src/lib/analytics/` | Domain classes, geometry, tracker, threat scoring |
| `src/lib/alpr/` | The plate-recognition engine — detection, quality gating, recognition, validation, aggregation |
| `eval/` | Evaluation harness, hand-labelled ground truth, parameter sweeps |
| `src/hooks/useAnalytics.js` | The analytics loop that ties them together |
| `src/context/` | Shared platform state |
| `src/data/` | Camera estate, virtual fences, seeded incidents, identities |
| `scripts/fetch-models.mjs` | Vendors all offline assets |
| `public/footage/` | Demo clips — see `CREDITS.md` for sources and licences |

## Scope, honesty and the demo script

[`docs/prototype.md`](docs/prototype.md) records what genuinely runs, what is
sample data, the measured performance numbers, and a step-by-step demonstration
flow. Read it before demonstrating.

[`docs/core-engine.md`](docs/core-engine.md) is the readiness report for the
plate-recognition engine: architecture, why each model was chosen over the
alternatives, measured accuracy, and — importantly — the conditions under which
it has *not* been tested.

## Checks

```bash
npm run lint && npm run build
```

Engine accuracy, against hand-labelled ground truth:

```bash
npm run eval && npm run eval:vehicles
```
