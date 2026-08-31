# Raw video corpus

Unlabelled source footage for building ALPR and detection evaluation datasets.
**Not committed** (5.8 GB); provenance for every file is in the per-directory
manifests, which are.

| Directory | Scope | Clips | Size |
| --- | --- | --- | --- |
| `india/` | Indian traffic — the problem statement's target, and the one region with no public camera API | 56 | 1.4 GB |
| `night/` | Night, dusk, rain, low light | 94 | 1.5 GB |
| `fixed/` | Fixed-camera / CCTV-like: toll booths, car parks, gates, junctions | 87 | 1.7 GB |
| `highway/` | Highway and open road, varied distance and angle | 59 | 1.3 GB |

**296 clips, 5.8 GB.** Every clip is 1080 lines or taller — sampling shows a
spread from 1080p to 4K. Nothing below 1080p was kept, because the same plate
measures 68px wide at 1080p and is unreadable at 480p.

Turn a clip into labelled samples:

```bash
node eval/extract-crops.mjs eval/footage/corpus/<dir>/<clip>.mp4 30
```

then read each crop and fill in `groundTruth` by hand. See `eval/README.md`.

## What this corpus is and is not

It is **raw material**, not evaluation data. Two measurements from processing
the first batches, both worth knowing before planning around the file count:

- Roughly **a third** of "fixed camera" stock clips show plates at a readable
  size. Stock footage is composed for mood, not for surveillance.
- **38%** of clips that *look* locked-off actually drift, measured with
  `ffmpeg vidstabdetect` on per-frame median motion vectors rather than by eye.

So 296 clips is not 296 usable scenes, and hand-labelling — not downloading —
is the slow part.

## Provenance

Sources are recorded per directory in `MANIFEST.md` / `MANIFEST-pexels.md`,
with the originating URL and licence for each file. Pexels-licensed material
permits commercial and non-commercial use without attribution; Wikimedia
Commons material carries its own per-file licence, recorded in the manifest.
