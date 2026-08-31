# Raw video corpus

Unlabelled source footage for building ALPR evaluation datasets. Not committed
(size); every file's origin and licence is recorded in the per-directory
MANIFEST.md.

| Directory | Scope |
| --- | --- |
| `india/` | Indian traffic — the problem statement's target, and the one region with no public ALPR benchmark |
| `night/` | Night, dusk, rain, low light |
| `fixed/` | Fixed-camera / CCTV-like: toll booths, car parks, gates, junctions |
| `highway/` | Highway and open road, varied distance and angle |

Turn a clip into labelled samples with:

```bash
node eval/extract-crops.mjs eval/footage/corpus/<dir>/<clip>.mp4 30
```

then read each crop and fill in `groundTruth` by hand. See `eval/README.md`.

**Resolution is the binding constraint.** The same plate is 68px wide at 1080p
and unreadable at 480p. Nothing here should ever be downscaled below 1080p.
