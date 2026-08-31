# Evaluation harness

Measures the ALPR engine against ground truth read by a person, not by the
model. Results, method and limitations: [`../docs/core-engine.md`](../docs/core-engine.md).

```bash
npm run eval           # per-frame:   exact match, character error, silent errors
npm run eval:vehicles  # per-vehicle: the operational metric
npm run eval:sweep     # the crop-margin experiment that drove 42.6% -> 70.4%
```

## Layout

| Path | What it is |
| --- | --- |
| `pipeline-node.mjs` | The pipeline outside a browser. Imports `quality.js`, `grammar.js` and `aggregate.js` straight from `src/` so the decision logic under test is the shipped logic; only image resizing is re-implemented. |
| `score.mjs` | Per-frame metrics. |
| `score-aggregate.mjs` | Per-vehicle metrics — what the platform actually reports. |
| `sweep-margins.mjs` | Single-parameter sweep over crop margins. |
| `extract-crops.mjs` | Finds plates in a clip and writes crops for a human to label. |
| `dataset/labelled.json` | Ground truth. |
| `dataset/crops/` | The 5× crops the labels were read from — check them yourself. |

## Adding data

```bash
node eval/extract-crops.mjs eval/footage/<clip>.mp4 30
```

Writes crops and unlabelled entries to `dataset/pending.json`. **Read each crop
and type what you see** into `groundTruth`, and set `legible` to whether it can
be read from that crop alone. Labelling with the model's own output measures
agreement with itself, which is worth nothing.

Where a small crop and a large crop of the same vehicle disagree, the large one
wins. That rule has already mattered once: a plate labelled `LT69MOO` from a
52px crop turned out to be `LT69MDO` at 60px — the model was right and the
label was wrong.

## Honest state of the dataset

54 crops, 4 registrations, one daylight fixed-camera scene, UK plates only.
Enough for a baseline and for parameter work; **not** enough to support an
accuracy claim. No night footage, no Indian plates, no adverse weather.
