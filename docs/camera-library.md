# Camera Library — architecture and first provider

A registry of camera feeds that authorities **publish deliberately**, normalised
so the surveillance engine can consume any of them through one interface.

## Authorisation boundary

The platform has no camera discovery mechanism and no way to acquire one. It
does not scan address ranges, does not query device-search engines, does not
try default or guessed credentials, and does not attempt to reach anything
behind authentication. There is no code path for any of that.

A feed is eligible only if at least one holds:

1. The operator intentionally publishes it for public viewing
2. It comes from an official government or transport authority
3. It has a documented public API
4. It is released through an open-data programme
5. The provider explicitly permits public reuse under stated terms
6. We hold authorisation from the operator

**Public viewability does not imply a right to ingest, retain or redistribute.**
Licence and terms are recorded per provider and shown in the interface, not
assumed from the fact that a picture loads in a browser.

## The two fields that decide everything

Every provider record carries:

| Field | Why it decides eligibility |
| --- | --- |
| `apiKeyRequired` | This is a serverless browser application. It cannot hold a secret, so a provider requiring a private key cannot be integrated client-side at all. |
| `cors` | Detection reads pixels via `canvas.getImageData`. A host that omits CORS headers taints the canvas: the picture displays and the engine sees nothing. |

Both are recorded from **observed** responses, not from documentation claims.

## Architecture

```
Provider (Digitraffic, …)
      │
      ▼
Provider adapter          discover / expandStation / checkHealth
      │                   the only place a provider's format is known
      ▼
Normalised registry       one Camera shape, whatever the provider sends
      │
      ▼
Camera Library UI         browse, search, filter, preview
      │
      ▼
Ingestion layer           snapshot poller → canvas → MediaStream
      │
      ▼
Surveillance engine       unchanged; sees an ordinary video element
```

The adapter boundary is the point of the design. Adding a provider means
writing one adapter that returns the normalised shape — nothing in the library
UI, the ingestion layer or the engine changes.

### Snapshot cameras

Most authority cameras publish a JPEG at a fixed URL, replaced every minute or
so, rather than a video stream. Rather than teach every downstream stage about
images, the snapshot source polls the URL, paints each frame onto a canvas, and
exposes that canvas through `captureStream()`. The analytics loop, tracker and
plate engine receive an ordinary `MediaStream` and needed no modification.

Polling uses the **provider's** stated interval, never faster. Requesting a
public authority's camera more often than it updates gains nothing and is
precisely what gets a client blocked.

## First integrated provider — Fintraffic Digitraffic

Verified against the live service, not from documentation:

| | |
| --- | --- |
| Organisation | Fintraffic, Finnish state transport operator |
| API | `https://tie.digitraffic.fi/api/weathercam/v1/stations` |
| Stations | **812**, roughly 2,400 individual camera presets |
| Metadata | GeoJSON, WGS84 coordinates, road identifiers |
| Imagery | Direct JPEG, **1280×720** |
| API key | **None** |
| CORS | `access-control-allow-origin: *` on the API **and** the image host |
| Licence | **CC BY 4.0** |
| Attribution | "Traffic camera imagery: Fintraffic / Digitraffic, licensed under CC BY 4.0" |

Two requirements are easy to mistake for refusals, and both are documented and
reasonable:

- The service returns **406** unless the request carries
  `Accept-Encoding: gzip`. The error body says exactly that.
- It asks every client to identify itself with a `Digitraffic-User` header.

### Verified end to end

Discovery through detection, against the live service:

```
251 cameras discovered in 9.4s, all analysable, with coordinates
  ↓
attach camera C0150301 (kt51_Inkoo)
  ↓
1280x720 still, refreshed every 60s — pixels readable
  ↓
detection engine → 2 Cars, 1 Traffic light
```

The frame was a wet Finnish road at dusk with headlights on — genuinely
realistic conditions rather than a clean benchmark image.

### The important negative result

The **plate detector found zero plates** on that camera, and that is correct
rather than a failure. Highway monitoring cameras are sited to watch traffic
flow, not to read registrations: vehicles sit far from the lens and a plate
occupies a handful of pixels, well under the 42px floor the ALPR engine
measured as its limit.

So this class of source is:

- **Excellent** for evaluating vehicle and person detection under real weather,
  lighting, distance and compression
- **Not usable** for evaluating ANPR

That distinction should be stated whenever these feeds are demonstrated. A
public highway camera proves the platform ingests real authorised infrastructure;
it does not prove plate recognition.

## Health monitoring

`checkHealth` issues a single ranged GET per camera and maps the outcome to
`available` / `unavailable` / `rate-limited` / `unknown`. It is deliberately
minimal: health checking must never become the reason a provider rate-limits
us. Cameras are checked on demand, not on a sweep.

The library requests thumbnails with `loading="lazy"` for the same reason —
sixty eager thumbnails would mean sixty simultaneous requests to the provider
on every page view.

## Evaluation is not training

Imagery from these feeds is used to **evaluate** the engine's robustness.
Nothing from a live feed is written to disk, and the platform has no training
path at all. Using any of it for training, fine-tuning or redistribution would
require separately establishing licence, privacy and retention permission — CC
BY 4.0 permits reuse with attribution, but privacy and retention are distinct
questions from copyright and would need answering on their own terms.

## Demonstration mode

Never present recorded footage as live. The console labels its source:

| Source | Label |
| --- | --- |
| Authority camera | live, with provider and refresh interval |
| Connected camera | live |
| Uploaded file | recorded |
| Bundled clip | recorded, demonstration footage |

For a demonstration, bundled clips are the reliable primary and a live
authority camera is the proof that real ingestion works — not the other way
round. An external feed can go down mid-demo; the platform should show that
honestly rather than the demo depending on it.

## Risks

| Risk | Mitigation |
| --- | --- |
| Provider withdraws or changes the API | Adapter isolates the change to one file |
| Feed disappears | Health status per camera; library keeps working |
| Licence terms change | Licence recorded per provider and displayed; re-check before relying on it |
| Rate limiting | Provider's own refresh interval respected; lazy thumbnails; no sweeps |
| CORS removed | Camera drops to preview-only and says so, rather than silently detecting nothing |
| Single-provider dependency | Adapter architecture exists precisely so a second provider is cheap |

## Adding a provider

Implement `discover()`, optionally `checkHealth()`, return the normalised
`Camera` shape from `src/lib/cameras/registry.js`, and register it. Record
`apiKeyRequired` and `cors` from observation. If either is unfavourable, the
provider belongs in Tier B or C — say so in the source research rather than
integrating it and discovering the problem in front of an evaluator.
