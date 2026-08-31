# Demo Footage — Credits & Licensing

Footage used for the SIH 2026 PS 26187 border-surveillance video-analytics prototype.

All four clips come from **Pexels** and are covered by the
[Pexels License](https://www.pexels.com/license/): free for personal and commercial
use, no attribution required. Attribution is recorded here anyway, for honesty.

Each file was re-encoded locally from the original 1920x1080 Pexels source to
854x480 H.264 / yuv420p, 24 fps, audio removed, `+faststart` for browser playback.
No other modification (no crops, overlays, colour grading, or speed changes).

---

## `perimeter-day.mp4`

- **Source page:** https://www.pexels.com/video/backside-of-people-walking-on-a-street-sidewalk-2836342/
- **Original file:** https://videos.pexels.com/video-files/2836342/2836342-hd_1920_1080_24fps.mp4
- **Author:** Kelly ("K", Pexels contributor `@kelly`)
- **Licence:** Pexels License (free to use, no attribution required)
- **Notes:** Fixed elevated camera looking down a city street. Two subjects in the
  near field are large in frame; further pedestrians and traffic recede up the road.
  Full 18 s of the original used.

## `road-vehicles.mp4`

- **Source page:** https://www.pexels.com/video/vehicles-on-driving-at-an-intersection-5030848/
- **Original file:** https://videos.pexels.com/video-files/5030848/5030848-hd_1920_1080_30fps.mp4
- **Author:** George Morina
- **Licence:** Pexels License (free to use, no attribution required)
- **Notes:** Fixed camera at a UK road junction. Used for licence-plate OCR. Encoded
  at a lower CRF (20) than the other clips to preserve plate detail. The clearest
  rear plate is a white Audi at roughly **t = 12.0–13.0 s** (UK plate `LS15 CXH`,
  approx. 44 px wide in the 854x480 output — readable, but the OCR stage will want
  upscaling on the crop). Other vehicles' plates are smaller or motion-blurred.
  Full 20 s of the original used.

## `night-movement.mp4`

- **Source page:** https://www.pexels.com/video/a-man-walking-in-the-street-on-a-foggy-night-11792112/
- **Original file:** https://videos.pexels.com/video-files/11792112/11792112-hd_1920_1080_25fps.mp4
- **Author:** Sergei Skrynnik (Pexels contributor `@screeny42`)
- **Licence:** Pexels License (free to use, no attribution required)
- **Notes:** Fixed camera, foggy sodium-lit street at night. A single person walks
  from far background toward the camera across the whole clip — a good scale sweep
  for a night-time person detector. First 20 s of a 26.8 s original.

## `checkpost.mp4`

- **Source page:** https://www.pexels.com/video/people-walking-on-street-13575199/
- **Original file:** https://videos.pexels.com/video-files/13575199/13575199-hd_1920_1080_30fps.mp4
- **Author:** M P (Pexels contributor)
- **Licence:** Pexels License (free to use, no attribution required)
- **Notes:** Fixed camera under a gate-like canopy overlooking a car park entrance.
  Both pedestrians and vehicles are present; a white Renault drives through the
  frame early in the clip. Segment `-ss 18 -t 20` of a 94 s original.

---

## Reproducing the encodes

```sh
ffmpeg -i <source>.mp4 -t 20 \
  -vf "scale=854:480:flags=lanczos,fps=24" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -preset slow -crf 22 \
  -an -movflags +faststart <out>.mp4
```

(`road-vehicles.mp4` used `-crf 20 -maxrate 3000k -bufsize 6000k`;
`checkpost.mp4` additionally used `-ss 18`; `perimeter-day.mp4` used `-t 18`.)
