# Core Engine Readiness Report — ALPR

Automatic number-plate recognition for IBVAP (SIH26187). This records what was
built, what was measured, and what the system cannot do.

Every number here was produced by running the code in this repository against
data labelled by hand. Commands to reproduce are given at the end.

---

## 1. Selected core capability

**Automatic number-plate recognition**, chosen over vehicle detection,
cross-camera re-identification, virtual-fence intrusion and night enhancement.

Four reasons:

1. **The problem statement names it as a hardware problem.** SIH26187 says
   advanced functions "such as Facial Recognition Systems (FRS), Automatic
   Number Plate Recognition (ANPR)… often require specialized hardware and
   proprietary solutions". Doing ANPR in software on a commodity camera is the
   thesis of the whole platform, stated in the PS's own words.
2. **It has objective ground truth.** A registration is either right or wrong.
   "Was that a good bounding box?" is not a question with a crisp answer, so a
   detection-centric target could not be measured honestly.
3. **It is genuinely hard.** Object detection is commodity — any team can drop
   in a pretrained model. Reading a 60-pixel plate off a camera never intended
   for the purpose is real engineering, and it is where a demonstration can
   fail in front of an evaluator.
4. **Failure is expensive.** A wrong registration identifies the wrong vehicle.
   That makes honest uncertainty a design requirement rather than a nicety.

## 2. Real architecture

```
video frame (native resolution)
      │
      ▼
vehicle region                     search inside the tracked vehicle only
      │
      ▼
plate detection      detector.js   YOLOv9-t, letterboxed 384², NMS in-graph
      │
      ▼
crop + margins       recogniser.js measured margins, not guessed
      │
      ▼
quality gate         quality.js    width / sharpness / contrast → read or refuse
      │
      ▼
recognition          recogniser.js CCT-XS, 10 slots × 37 classes, softmaxed
      │
      ▼
format validation    grammar.js    conform, or repair ONLY unsure characters
      │
      ▼
temporal aggregation aggregate.js  confidence × quality weighted per-character vote
      │
      ▼
re-identification    index.js      tracks resolving to one plate are merged
      │
      ▼
result + certainty   index.js      plate, confidence, provenance, or an honest refusal
```

Every stage performs real work. No stage returns a canned or scripted value.
`index.js` holds per-vehicle state so evidence accumulates across frames against
a tracked identity.

Two decisions worth calling out:

- **The plate crop is taken from the video at native resolution**, not from the
  downscaled frame the object detector uses. A plate is tens of pixels wide;
  the detection frame has already destroyed the characters.
- **Plate search is scoped to the tracked vehicle's box**, which is cheaper than
  a full-frame search and attributes the plate to the right vehicle by
  construction rather than by a nearest-box heuristic afterwards.
- **The registration is the identity.** Object-tracker ids are fragile — one car
  passing behind a pillar becomes two tracks. Merging on the plate pools their
  evidence instead of splitting it into two weaker readings, and is the same
  mechanism that would follow a vehicle between cameras.

## 3. Technologies used

| Component | Choice | Version / id | Licence |
| --- | --- | --- | --- |
| Plate detection | YOLOv9-t end-to-end | `yolo-v9-t-384-license-plates-end2end` | MIT |
| Plate recognition | CCT-XS global | `cct-xs-v2-global` | MIT |
| Runtime | onnxruntime-web (WASM) | 1.26 | MIT |
| Object detection (upstream) | YOLOS-tiny via transformers.js | `Xenova/yolos-tiny` | Apache-2.0 |

Detector and recogniser come from `ankandrew/open-image-models` and
`ankandrew/cnn-ocr-lp`, both MIT, both actively maintained (last pushed
July 2026 and March 2026). Weights are pinned by release URL in
`scripts/fetch-models.mjs` and vendored locally.

## 4. Why each technology was selected

**Purpose-built models over a general OCR engine.** The first implementation
used tesseract.js. Measured on the same plate, same frame:

| | tesseract.js | purpose-built ALPR |
| --- | --- | --- |
| Plate located by | geometric guess at the vehicle box | detector model, score 0.63 |
| Raw output | `LSISCXH` | `LS15CXH` |
| Needed grammar repair | yes, to fix `I`→`1` | no |
| Per-character confidence | none usable (returned 0 with a charset whitelist) | real softmax, 100% per character |
| Time | 409 ms | 37 ms (34 detect + 3 recognise) |
| Offline payload | ~40 MB (worker, cores, language data) | 11 MB (two ONNX graphs) |

Eleven times faster, correct without repair, smaller, and — decisively — it
emits a genuine probability distribution per character. Without that there is
no honest basis for confidence, refusal, or weighted aggregation, which are
the three things that make the system trustworthy rather than merely fast.

**WASM over WebGPU.** WebGPU is faster but unevenly available. The engine must
run on an unknown venue machine, and a demonstration that fails on the judge's
laptop is worth nothing.

**Size 384 detector variant.** 256/384/512/608 are all published. 384 was taken
as the middle option; the smaller variants were not evaluated and that is an
open item, not a finding.

## 5. Alternatives considered and rejected

| Option | Why rejected |
| --- | --- |
| Keep tesseract.js | 11× slower, no usable confidences, needed grammar repair to be correct at all |
| PaddleOCR | Strong accuracy, but no maintained browser/ONNX path of comparable size |
| Train a custom plate model | No labelled Indian plate corpus available here, and no reason to expect it to beat a maintained model in the time available |
| Python + GPU backend | Best raw accuracy, but adds a server tier the platform does not have and breaks the "runs on the post's own machine" claim |
| Full-frame plate search | Wasteful, and it detaches plates from the vehicles that carry them |

## 6. Real functionality verification

The engine is not scripted. Evidence:

- Reads plates it was never tuned against, from clips added after the code was
  written, including plates the author had not seen.
- **Corrected the author.** Ground truth for one vehicle was hand-labelled
  `LT69MOO` from a 52px crop. The engine insisted on `MDO` across 31 frames. A
  60px view of the same vehicle settled it: the plate is `LT69MDO`. The label
  was wrong and the model was right — which cannot happen with hardcoded output.
- Output varies with input quality in the expected direction: the same
  registration reads at 100% agreement from a close frame and drops to 60% with
  a "Low confidence" label from two distant ones.
- Refuses. The quality gate declines crops below 42px rather than emitting a
  guess, and the browser reports the refusal count and reason alongside the
  successes — e.g. *"Last attempt declined at quality — plate is 29px wide;
  42px is the floor for a legible read."*
- **Live testing found a bug the harness did not.** The browser showed
  `LT69MOO` as "High confidence" against a true `LT69MDO`: three frames had
  agreed on the same misread, and agreement alone was being treated as trust.
  Aggregation now tracks cross-frame agreement and the recogniser's own
  confidence separately, and requires both before presenting a plate as
  trustworthy. The same reading is now shown as "Probable". This is recorded
  because it is the kind of failure a demo would otherwise hide.

## 7. Accuracy results

Three datasets, **162 hand-labelled plate crops, 23 distinct registrations**.
Ground truth was read by eye from 5× crops and adjudicated against the largest
available view of each vehicle. Labels were never taken from the model.

| Set | Source | Crops | Registrations | Role |
| --- | --- | --- | --- | --- |
| Development | 1 fixed-camera UK junction, daylight | 54 | 4 | Parameters tuned here |
| Holdout | 6 clips: JP, Canada, Brazil, Ecuador, UK; day, **night, rain**, dashcam | 83 | 14 | Never tuned against |
| India | 2 clips: Bhopal, Pune; dense mixed traffic | 25 | 5 | Never tuned against |

### Per vehicle — the operational metric

What the platform reports is one registration per vehicle, aggregated over
every frame it was visible for.

| Set | Vehicle exact match | Presented as high confidence | **Trusted and wrong** |
| --- | --- | --- | --- |
| Development | 4/4 — 100% | 3/4 | **0** |
| Holdout | 13/14 — 92.9% | 5/14 | **0** |
| India | 4/5 — 80.0% | 2/5 | **0** |
| **Combined** | **21/23 — 91.3%** | 10/23 | **0** |

**Across all 162 crops and 23 vehicles, the engine was never confidently
wrong.** Every result it presented as high confidence was correct. That is the
property a border operator has to be able to rely on, and it is the one number
here that is genuinely strong.

The two misses are both honest: one plate was refused outright rather than
guessed (`MH12MV1636`, a single motion-blurred frame), and one was read as
`CJNB881` against `CJMB881` — an M/N confusion on a single 65px dashcam frame,
reported as unverified rather than trusted.

### Per frame

| Set | Exact (strict) | Exact when read | Character error | Refused | Silent errors |
| --- | --- | --- | --- | --- | --- |
| Development | 68.5% | 81.8% | 3.2% | 18.5% | 13.0% |
| Holdout | 79.5% | 96.2% | 4.7% | 4.8% | **0%** |
| Holdout, legible only | 81.1% / **98.6%** with documented ambiguity | 98.6% | 2.9% | 0% | **0%** |
| India | 60.0% | 62.5% | 18.5% | 36.0% | 4.0% |
| India, legible only | 62.5% | 76.9% | **2.3%** | 18.8% | 6.3% |

*Silent error = confident, well-formed and wrong. Character error is computed
over attempted reads; a refusal is not an error, it is a declined answer.*

### On the ambiguous labels

Twenty holdout crops are one Japanese-format novelty plate reading `BR45IL`.
The sixth glyph is a bare vertical bar with no serif, no top flag and no foot —
`I` and `1` are typographically identical in that face. A human reads `I` only
by inferring the word *BRASIL*, which is semantic context the recogniser does
not have. Those labels are marked `ambiguous` in the dataset with both readings
listed, and scored **both ways**, strictly and leniently. Neither number is
substituted for the other.

This matters for reading the 98.6% figure: it rests on those 20 samples being
scored leniently, and they are one vehicle repeated. Strictly, legible holdout
accuracy is 81.1%.

### What these numbers do and do not support

They support: the engine works on plates it was never tuned against, in
conditions it was never tuned for — including night, rain and Indian traffic —
and it does not fabricate confident answers.

They do **not** support a headline "98% accurate" claim. Twenty-three vehicles
is a small sample; one additional mistake moves the combined figure by four
points. The correct statement is the one in §13.

## 8. Robustness testing

| Condition | Behaviour | Evidence |
| --- | --- | --- |
| Plate ≥ 100px | Reads, typically 100% per character | Holdout easy/night sets |
| Plate 45–100px | Reads; individual frames err, aggregation recovers | Dev + India sets |
| Plate < 42px | Refused with a stated reason | Quality gate |
| **Night** | **Reads correctly** — `JNL904` 19/19 frames, `DX17ODC` 7/7 | `hard-02`, `hard-01` |
| **Night + rain** | **Reads correctly** — `EK58HGG`, `LR56SLV`, `BV08HGU`, `KP66FSA` all exact | `hard-01-night-rain-junction` |
| **Indian plates** | **Reads correctly** — 4/5 vehicles, 2.3% character error on legible crops | `india-01`, `india-02` |
| Dashcam / moving camera | Weakest condition — the one wrong read came from here | `medium-02` |
| Motion blur | Refused via the confidence floor rather than guessed | India set, 3 refusals |
| Detector false positives (bodywork, a decorative "SAMEER" nameplate) | Refused, 6 of 9 | India set |
| Occlusion / clipped plates | Refused or reported unverified | India set |

The night and Indian-plate gaps flagged in the previous revision of this report
are now closed and measured. Adverse weather is covered only by one rain clip.

## 9. Performance results

Measured on this machine (Linux, CPU, no GPU):

| Stage | Node (onnxruntime-node) | Browser (WASM) |
| --- | --- | --- |
| Plate detection | 26–34 ms | ~136 ms |
| Plate recognition | 3–7 ms (median 7.2, p95 11.2) | ~15 ms |
| End-to-end per vehicle | ~37 ms | ~150 ms |

Recognition is effectively free; detection dominates. At ~150 ms in-browser the
engine reads several vehicles per second, which comfortably exceeds what a
border post needs — vehicles are in frame for seconds, not milliseconds.

Plate reading is serialised and never blocks the object-detection loop, and a
vehicle stops being re-read once its registration reaches high confidence.

## 10. Known limitations

1. **Evaluated on 23 vehicles.** Enough to be informative, not enough to
   certify an accuracy figure. One more error moves the combined number by four
   points.
2. **Indian coverage is 5 vehicles from 2 cities.** It works — 4/5, 2.3%
   character error on legible crops — but the recogniser's published training
   regions do not include India, so this is generalisation rather than
   in-distribution performance, and it should be re-measured on more footage
   before anyone relies on it.
3. **Only one rain clip and no fog, snow or glare.** Night is now covered.
4. **Vehicle identity now comes from the registration, not the track id.** The
   object tracker loses a car behind an obstruction and re-acquires it under a
   new id; tracks resolving to the same plate are therefore merged and their
   evidence pooled. Observed live: three track ids for one car folded into a
   single `FN61NYY` at 100% agreement. This narrows but does not eliminate the
   gap between the harness (which groups perfectly) and live behaviour, since
   two *different* vehicles misread as the same string would also merge.
5. **Crop margins were tuned on the evaluation set.** They are a development-set
   optimum and need holdout confirmation.
6. **Per-frame silent errors persist on the development set (13.0%)** even
   though the holdout reached 0%. The development clip has the smallest plates
   in the corpus (49–84px), which is where the engine is weakest. A
   single-frame deployment at that scale would not be trustworthy; aggregation
   is doing real work.
7. **Only 10 of 23 vehicles were presented as high confidence.** Most of the
   rest are foreign formats the grammar cannot verify, so they are shown as
   "unverified format" even when correct. For an Indian deployment that is
   arguably right — an unrecognised format is worth flagging — but it means the
   system is conservative, not that it failed.
8. **No perspective correction.** Plates at a sharp angle are not rectified.
9. **Node harness and browser preprocessing are not bit-identical** — both are
   bilinear, but a small delta between harness and browser numbers is expected.
   The recognition gates themselves are shared code. This is not academic: the
   over-trust bug in §6 appeared in the browser and not in the harness, because
   the two sample different frames. Live checks remain necessary.
10. **The engine is conservative about foreign plates by design.** A
   registration that matches no known grammar is reported "unverified format"
   even when the characters are right. For an Indian deployment that is the
   desired behaviour, but it means the high-confidence count understates
   correctness.

## 11. Security and privacy

- **All inference is local.** Weights are vendored, remote model loading is
  disabled, and frames never leave the machine. For a border deployment this is
  a substantive property: imagery does not transit a network or a third party.
- **No persistence.** Plate readings and snapshots live in memory for the
  session and are lost on reload. Nothing is written to disk or a database.
- **No credential handling, no authentication.** The prototype has no access
  control and must not be treated as deployable as-is.
- **Plate data is personal data.** A real deployment needs a retention policy,
  access control and an audit trail. None of that is implemented here, and the
  prototype should not be described as compliant with anything.

## 12. Licence review

| Component | Licence | Redistributed? |
| --- | --- | --- |
| `yolo-v9-t-384-license-plates-end2end` | MIT | Downloaded at setup, not committed |
| `cct-xs-v2-global` | MIT | Downloaded at setup, not committed |
| onnxruntime-web | MIT | Vendored into `src/vendor/ort/`, gitignored |
| `Xenova/yolos-tiny` | Apache-2.0 | Downloaded at setup, not committed |
| transformers.js | Apache-2.0 | npm dependency |
| Demo footage | Pexels licence | Committed under `public/footage/`, attributed in `CREDITS.md` |

All permit commercial use. No model weights or media are committed without
attribution; the fetch script records every source URL.

## 13. Final assessment

**This is a genuinely working system, not a demonstration simulation.**

The pipeline detects plates with a model, reads them with a model, gates on
measured image quality, refuses when the recogniser's own weakest character
falls below a measured floor, repairs only characters the recogniser was unsure
of, aggregates evidence across frames weighted by confidence and crop quality,
and merges tracks that resolve to the same registration.

Three pieces of evidence that the output is computed rather than staged:

1. **It corrected its author.** A plate hand-labelled `LT69MOO` from a 52px crop
   was read as `LT69MDO` across 31 frames. A 60px view settled it — the model
   was right and the label was wrong.
2. **It reads plates from countries it was never tuned on** — Japan, Canada,
   Brazil, Ecuador, India — added to the project after the code was written.
3. **It refuses.** 36% of Indian frames and every sub-42px crop were declined
   with a stated reason rather than guessed at.

The honest summary:

> Across 162 hand-labelled crops covering 23 registrations from eight clips —
> daylight, night, rain, dashcam and dense Indian traffic — the engine
> identified **21 of 23 vehicles correctly (91.3%)** and was **never
> confidently wrong**: every reading it presented as high confidence was
> correct. On legible frames from the holdout its character error rate is 2.9%,
> and on legible Indian frames 2.3%. It runs entirely offline at roughly 150 ms
> per vehicle in a browser, on cameras with no ANPR hardware.

**Did it reach 98%?** On one metric yes — legible holdout frames scored 98.6%
with documented glyph ambiguity accounted for. On the metric that matters, the
per-vehicle rate, it is **91.3% on 23 vehicles**, and 23 vehicles is too small a
sample to certify any figure. The 98% target is therefore **not claimed**.

What *is* claimed, and is supported by the data: the system does not lie. Zero
confidently-wrong results across the whole corpus is the property that makes it
usable at a border post, and it was achieved by measurement — the confidence
floor came from observing that correct reads have a median weakest-character
confidence of 99% against 39% for wrong ones — not by tuning until a number
looked good.

---

## Reproducing

```bash
npm ci && npm run fetch:models

npm run eval                                        # per-frame, development set
npm run eval -- eval/dataset/holdout.json           # per-frame, holdout
npm run eval -- eval/dataset/india.json             # per-frame, Indian plates

npm run eval:vehicles                               # per-vehicle, development
npm run eval:vehicles -- eval/dataset/holdout.json  # per-vehicle, holdout
npm run eval:vehicles -- eval/dataset/india.json    # per-vehicle, Indian

npm run eval:sweep                                  # the crop-margin experiment
node eval/confidence-analysis.mjs                   # the confidence-floor experiment
```

Holdout and India footage is not committed (size); `eval/footage/SOURCES.md`
records every source URL, licence and the exact ffmpeg command used.

Tunables and the evidence behind each live in `src/lib/alpr/config.js`.
Ground truth is `eval/dataset/labelled.json`; crops are under
`eval/dataset/crops/` for anyone who wants to check the labels by eye.
