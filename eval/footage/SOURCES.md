# ANPR evaluation footage — sources and licences

8 clips sourced from Pexels (all **Pexels License** — free to use, commercial and
non-commercial, no attribution required; attribution recorded here anyway).

All files: H.264 / MP4, **no audio track**, re-encoded with
`ffmpeg -c:v libx264 -crf 23 -preset slow -an` (plus `-movflags +faststart`).

## Resolution note (read this)

Five sources were 3840x2160 or 2520x1080. A 12 s 4K segment at CRF 23 / preset slow
measured **51 MB** — over 2x the 25 MB cap — and fitting 4K under 25 MB would have
required trimming below the 8 s minimum. Those clips were therefore scaled to
**exactly 1920x1080** (Lanczos), which is the resolution named in the brief.
**Nothing was reduced below 1080p.** `hard-01` is left at its native 2520x1080
(full 1080 line height, ultrawide 21:9 crop from the camera).

Plate pixel widths below are measured **in the delivered file**, not the source.

---

## easy-01-skyline-rear-plate.mp4

- **Difficulty:** EASY
- **Source:** https://www.pexels.com/video/sleek-black-nissan-skyline-with-license-plate-30391326/
- **Author:** Gaurav Kumar (Pexels @gaurav-kumar-1281378)
- **Licence:** Pexels License
- **Resolution / duration:** 1920x1080, 23.98 fps, 12.35 s, 3.3 MB
- **Source resolution:** 1920x1080 (native, not rescaled)
- **Camera:** slow orbit/pan around a parked car — NOT fixed
- **Plates:** Japanese plate `日本 337 / BR45IL` on the rear, legible for the entire
  clip. Best at **t = 5–8 s**. **Plate width ≈ 300 px.** Overcast daylight, sharp.

## easy-02-carpark-daylight.mp4

- **Difficulty:** EASY
- **Source:** https://www.pexels.com/video/parking-lot-at-a-shopping-center-1315986/
- **Author:** Zuzanna Musial
- **Licence:** Pexels License
- **Resolution / duration:** 1920x1080, 30 fps, 15.00 s, 8.1 MB
- **Source resolution:** 1920x1080 (native, not rescaled)
- **Camera:** handheld/slow tracking across a retail car park — NOT fixed
- **Plates:** Alberta plate `BSL-8607` on a dark Ford in the left foreground,
  clearly readable at **t = 10–13 s**. **Plate width ≈ 95 px.** Bright hard
  sunlight; several other parked cars carry smaller, partly readable plates.

## medium-01-crosswalk-approach.mp4

- **Difficulty:** MEDIUM
- **Source:** https://www.pexels.com/video/quiet-urban-street-with-passing-car-32143482/
- **Author:** Igor Vieira
- **Licence:** Pexels License
- **Resolution / duration:** 1920x1080, 23.98 fps, 15.02 s, 6.9 MB
- **Source resolution:** 3840x2160 → scaled to 1920x1080
- **Camera:** **FIXED tripod**, low angle facing up a narrow cobbled street (CCTV-like)
- **Plates:** Brazilian front plate `QQV4H45` on a VW Polo rolling towards camera.
  Enters frame ~t = 4 s, best at **t = 7 s** when the car stops at the crosswalk.
  **Plate width ≈ 95 px.** Late-afternoon side light, front of vehicle in shade —
  the plate itself is bright and sharp. A second car exits right at ~t = 13 s
  (plate angled and blurred, not readable).

## medium-02-dashcam-suburban.mp4

- **Difficulty:** MEDIUM
- **Source:** https://www.pexels.com/video/cars-are-driving-on-the-road-at-an-intersection-25258881/
- **Author:** Ahnaf Piash
- **Licence:** Pexels License
- **Resolution / duration:** 1920x1080, 30 fps, 12.00 s, 19.7 MB
- **Source resolution:** 1920x1080 (native, not rescaled)
- **Camera:** **DASHCAM** through windscreen, Ontario suburb, bright clear daylight
- **Plates:** Ontario plate `CJFV 629` on a black Honda Accord queued directly ahead —
  readable from t = 0 through **t ≈ 5.5 s** (best). **Plate width ≈ 78 px.**
  A silver Honda CR-V in the right lane shows a second Ontario plate at
  ~30–40 px (detectable, characters not resolvable).

## hard-01-night-rain-junction.mp4

- **Difficulty:** HARD (night + rain + wet-road glare + pedestrian occlusion)
- **Source:** https://www.pexels.com/video/cars-in-the-street-in-ealing-london-england-20271800/
- **Author:** George Morina
- **Licence:** Pexels License
- **Resolution / duration:** **2520x1080** (native, not rescaled), 23.98 fps, 15.02 s, 16.6 MB
- **Camera:** **FIXED**, kerb-level, Ealing, London
- **Plates:** UK yellow rear plates. `DX17 ODC` on a Volvo XC90 in the left
  foreground is readable **t = 3–9 s** (best at t = 5.5 s), **plate width ≈ 155 px**.
  An Audi TT `BV08 HGU` passes at ~t = 5 s (≈ 120 px, motion-blurred but readable).
  Further plates (`EK58 HGG`, `RP66 FSA`) appear at 60–80 px. Pedestrians walk
  across the foreground and occlude the Volvo plate intermittently — deliberate.

## hard-02-night-rear-plate.mp4

- **Difficulty:** HARD (near-total darkness, extreme dynamic range)
- **Source:** https://www.pexels.com/video/the-rear-end-of-a-car-at-night-16768845/
- **Author:** Erik Mclean
- **Licence:** Pexels License
- **Resolution / duration:** 1920x1080, 59.94 fps, 12.41 s, 0.6 MB
- **Source resolution:** 3840x2160 → scaled to 1920x1080
- **Camera:** **FIXED**, close behind a parked car at night
- **Plates:** Newfoundland plate `JNL 904` under its own plate lamp, readable for the
  whole clip. **Plate width ≈ 240 px.**
  ⚠️ **Caveat on the category:** the *scene* is hard (99% of the frame is black,
  the only light is the plate lamp and a tail light), but the *plate itself* is
  large and well lit. This is a low-light/dynamic-range stressor for detection,
  **not** a small-plate or blur stressor for recognition. Note the 0.6 MB file size:
  the frame is almost entirely black and compresses to nothing.

## india-01-bhopal-bridge.mp4

- **Difficulty:** INDIAN — plus MEDIUM difficulty overall
- **Source:** https://www.pexels.com/video/traffic-at-indian-bridge-in-urban-intersection-34430025/
- **Author:** Aamir Somewhere
- **Licence:** Pexels License
- **Resolution / duration:** 1920x1080, 60 fps, 14.00 s, 20.4 MB
- **Source resolution:** 3840x2160 → scaled to 1920x1080
- **Location:** Raja Bhoj Setu, Bhopal, Madhya Pradesh
- **Camera:** handheld, near-static with a slow drift — close to a fixed shot
- **Plates:** **Indian format.** `MP 09 WF 8336` on the rear of a white Maruti Swift
  Dzire, square-on to camera, readable **t = 5–8 s** (best at t = 6 s).
  **Plate width ≈ 100 px.** Overcast monsoon light. Several other MP-series plates
  on cars and autos elsewhere in frame at 40–70 px (partly legible).

## india-02-pune-jm-road.mp4

- **Difficulty:** INDIAN — plus MEDIUM/HARD (dense mixed traffic, heavy occlusion)
- **Source:** https://www.pexels.com/video/jungli-maharaj-road-jm-road-pune-19532260/
- **Author:** Prashant Darekar
- **Licence:** Pexels License
- **Resolution / duration:** 1920x1080, 60 fps, 15.00 s, 19.3 MB
- **Source resolution:** 3840x2160 → scaled to 1920x1080 (trimmed from t = 36 s of source)
- **Location:** Jungli Maharaj (JM) Road, Pune, Maharashtra
- **Camera:** **FIXED tripod** on a pavement facing a crosswalk (genuinely CCTV-like)
- **Plates:** **Indian format.** `MH24 BR1519` on the front of a Datsun/Nissan
  crossing right-to-left, readable at **t = 5.5–7 s** (best at t = 6 s).
  **Plate width ≈ 92 px.** Also in this window: a white Maruti WagonR taxi with a
  yellow commercial plate (~70 px, partly legible) and an MH-series scooter plate
  (~50 px, marginal). Pedestrians and two-wheelers occlude plates constantly —
  this is the most realistic Indian-enforcement-scene clip in the set.

---

## Rejected candidates (checked, plates not usable)

Frames were pulled and read for each of these before discarding:

| Pexels ID | Title | Reason |
|---|---|---|
| 3777654 | Footage of the road with vehicle waiting at the stop light | Plate present (~55 px) on a red pickup but characters are **not resolvable** at any timestamp |
| 9100884 | A footage of a covered parking lot | Vehicles too distant, plates < 25 px |
| 8996215 | Time lapse footage of parked vehicles | Parking garage, plates dim and tiny |
| 3695934 | Footage of a man paying at the toll gate | In-car shot — no plate appears at all |
| 6470925 | Video of cars on the road at night | Wet night street, vehicles too far, no readable plate |
| 36330662 | Cars passing on suburban road in autumn | Empty road; the one car is heavily motion-blurred |
| 4064327 / 4064324 | Cars passing by the street (Melbourne) | Rear plate blank/illegible at every timestamp checked |
| 5664970, 27902009 | Intersection footage | Aerial / long lens, plates invisible |
| 3588018 | Cars passing through flood water | Night flood scene, plate area under water spray, unreadable |
| 14517260, 15384734, 16420406, 35262193, 35594377, 34500380 | various | **Vertical (portrait) footage** — 1080x1920 / 2160x3840, rejected on aspect |

## Not included

- **`junction-1080-full.mp4`** in this directory was **not** created by this task —
  it was already present. Left untouched.
- **Indonesian toll-plaza dashcam** (Pexels 5774410, Tom Fisk) was verified to have a
  fully legible truck plate `B 9351 EO` (~125 px at 1080p) if a 9th clip is ever
  wanted. Dropped only to keep the set at 8.
