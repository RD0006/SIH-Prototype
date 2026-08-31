# IBVAP — prototype scope and demo

Intelligent Border Video Analytics Platform, built for **SIH26187** (Ministry of
Home Affairs / Sashastra Seema Bal): *AI-Based Intelligent Video Analytics
Platform for Border Surveillance using existing CCTV Infrastructure*.

The problem statement's load-bearing claim is that intelligence should be added
in **software**, so that CCTV already in the ground at Border Out Posts, check
posts and border roads becomes an intelligent network without procuring FRS,
ANPR or smart-camera hardware. Everything below exists to make that claim
demonstrable rather than asserted.

## What is real

A real object-detection neural network runs **in the browser**, against frames
from an ordinary `<video>` element. There is no server, no GPU appliance and no
smart camera anywhere in the path.

| Stage | Implementation |
| --- | --- |
| Frame acquisition | `useAnalytics` samples the video element to a 480px canvas |
| Low-light correction | `lib/detection/enhance.js` — adaptive gamma toward a measured target |
| Detection | YOLOS-tiny (quantised ONNX) via transformers.js, `lib/detection/engine.js` |
| Domain mapping | `lib/analytics/classes.js` — COCO's 80 classes reduced to what a border post cares about |
| Tracking | `lib/analytics/tracker.js` — greedy IoU association with stable identities |
| Virtual fences | `tracker.evaluateZones` against polygons in `data/zones.js` |
| Threat scoring | `lib/analytics/threat.js` — explainable, factor-by-factor |
| Plate detection | `lib/alpr/detector.js` — YOLOv9-t trained on plates, letterboxed |
| Plate recognition | `lib/alpr/recogniser.js` — CCT-XS plate OCR with real per-character confidence |
| Quality gating | `lib/alpr/quality.js` — refuses crops too small, blurred or flat to read |
| Plate aggregation | `lib/alpr/aggregate.js` — confidence-weighted vote across frames |

Measured on this machine, not estimated:

- Detection latency ≈ **320 ms/frame** at the Balanced preset (320px shortest
  edge). Input resolution dominates cost: 512px measured 2244 ms, 256px measured
  321 ms, for identical detections.
- Night frame, raw: the detector called a walking person a **horse at 48%**.
  After adaptive enhancement (γ1.8, mean luminance 52 → 112): **person at 90%**.
- ANPR: on a 54-crop hand-labelled set the engine reads **70.4%** of individual
  frames exactly, and **4 of 4 vehicles** correctly once readings are aggregated
  across frames, with **no confidently-wrong result**. Detection ~136 ms and
  recognition ~15 ms per plate in the browser. Full method, limitations and the
  reasons this is not yet a validated accuracy claim: `docs/core-engine.md`.

## What is not real, and is labelled as such

`lib/detection/fallback.js` is a scripted replay source used **only** when the
neural engine cannot start. When it is active the console shows
`SIMULATED REPLAY — engine unavailable` in place of `LIVE INFERENCE`, on every
screen that reports engine state. It exercises the same tracker, fence and
scoring code as live inference, so a failed model load degrades the
demonstration rather than ending it.

The camera estate, the seeded incident history and the cross-camera identities
in `src/data/` are authored sample data representing a sector. The footage is
real but is stock video, not border footage — see `public/footage/CREDITS.md`.

## Offline by design

A remote border post has no guaranteed connectivity, and neither does a demo
venue. `npm run fetch:models` vendors everything:

- model weights and configs → `public/models/` (`env.allowRemoteModels = false`)
- ONNX WASM runtime → `src/vendor/ort/`
- tesseract worker, cores and language data → `public/tesseract/`

All are gitignored and regenerable. Nothing is fetched from a CDN at runtime.

## Demonstration flow

Roughly six minutes, in this order.

**1 — The problem.** Open **System Status**. The estate is eight commodity fixed
bullet cameras, oldest in service since 2017, none with on-board analytics. This
is the hardware the platform does not replace.

**2 — Detection on an ordinary feed.** Open **Live Surveillance**, camera
`BOP-03`, press *Start analysis*. The badge turns to `LIVE INFERENCE` with a
measured latency. Boxes and stable track ids appear over stock street footage.
Point out that the model is running in this browser tab.

**3 — Night, and why it matters.** Switch to `BOP-07`. The overlay reports
`NIGHT · LUM 51 · ENHANCED γ1.94`. Toggle *Low-light boost* off and on: without
it the detector loses the subject or misclassifies it. This is the PS's
"night-time movement detection", solved in preprocessing rather than by buying
thermal cameras.

**4 — The fence fires.** The subject crosses `East Perimeter Line` and an
incident is raised automatically, appearing in the right rail within a second.

**5 — Why 85, not 40.** Open **Incidents**. The new alert is ranked against the
seeded history. Open it and walk the score breakdown: base weighting, zone
criticality, darkness, group size, cross-camera persistence, and the negative
factors that de-escalate it. This is the answer to "is your threat score a
magic number?".

**6 — Livestock.** In the same queue, `INC-0230` was **deliberately not
alerted**. Cattle on a border strip is the largest source of false alarms on
motion-triggered systems; recognising it and staying quiet is the feature.

**7 — ANPR without an ANPR camera.** Back to Live Surveillance, camera
`ROAD-06`. A plate is detected and read from the standard feed, showing the
cropped region, the format it matched, and the agreement across frames. Point at
the counters underneath — *"n located, n read, n refused on quality"*. The
refusals are the interesting part: the engine declines plates it cannot see well
enough rather than inventing a registration. If a reading shows "Low
confidence", say so; that is the system working, not failing.

**8 — One target, three cameras.** Open **Target Tracking**, identity `T-024`.
Sightings on BOP-03, ROAD-04 and BOP-07 resolve into a single route with a
heading. A single camera says "something was there"; the platform says "this
group is moving toward Check Post 1".

**9 — Something to file.** Open **Evidence**. The sealed package holds the
captured frame with the detection box, the capture conditions including the
enhancement applied, the chain of custody, and a real SHA-256 digest of the
record.

### If the engine will not start

Say so plainly and continue — the console will show `SIMULATED REPLAY` and every
downstream stage still runs. Do not describe replayed output as live inference.

## Deliberately out of scope

Face recognition, RTSP/VMS ingestion, a backend, authentication, multi-user
operation, persistence across reloads, and any costing claim. None of these are
implemented and none are claimed anywhere in the interface.
