# Public camera source research

Which officially published camera feeds this platform can legitimately use, and
which it cannot. Every row was tested against the live service; nothing here is
copied from documentation.

## Method

Each candidate was checked on four axes, in this order. A failure at any one
stops it, and the order matters — a feed can be legal and reachable and still
be useless.

1. **Authorisation** — is it deliberately published? Under what terms?
2. **API key** — a serverless browser app cannot hold a secret. A provider
   requiring a private key cannot be integrated client-side at all.
3. **CORS** — detection reads pixels via `canvas.getImageData`. A host that
   omits `Access-Control-Allow-Origin` taints the canvas: the picture displays
   and the engine sees nothing.
4. **Fitness for purpose** — enough resolution for the engine to do anything
   useful with.

```bash
curl -s -o /tmp/p.json -w "%{http_code} %{content_type} %{size_download}B\n" --max-time 20 "<URL>"
curl -s -D- -o /dev/null --max-time 15 -H "Origin: http://localhost:5173" "<URL>" | grep -i access-control
```

Nothing in this study involved scanning, enumeration, device-search engines,
credentials, or any attempt to reach a camera that was not deliberately
published. Sources that could not be confirmed as intentionally public were
dropped without further investigation.

---

## Tier A — integrated

### Fintraffic Digitraffic (Finland)

| | |
| --- | --- |
| Organisation | Fintraffic, Finnish state transport operator |
| API | `https://tie.digitraffic.fi/api/weathercam/v1/stations` |
| Cameras | **812 stations**, ~2,400 presets |
| Metadata | GeoJSON, WGS84 coordinates, road identifiers |
| Imagery | JPEG, **1280×720** |
| API key | **None** |
| CORS | **`allow-origin: *`** on API *and* image host |
| Licence | **CC BY 4.0** |
| Attribution | "Traffic camera imagery: Fintraffic / Digitraffic, licensed under CC BY 4.0" |
| Verified | 2026-08-31 |

The only candidate that cleared all four axes. Requires `Accept-Encoding: gzip`
(returns 406 otherwise, with an error body that says so) and asks clients to
identify themselves with a `Digitraffic-User` header. Both documented and
reasonable.

**Integrated.** See `docs/camera-library.md`.

---

## Tier B — promising, blocked on permission

### Transport for London — JamCams (UK)

| | |
| --- | --- |
| API | `https://api.tfl.gov.uk/Place/Type/JamCam` |
| Cameras | **890**, with lat/lon and view direction |
| Imagery | JPEG **and MP4 video clips**, on S3 |
| CORS | **`allow-origin: *`** on API and both S3 hosts |
| API key | Answers **without** one today |
| Verified | 2026-08-31 |

Technically the strongest source found — 890 London cameras publishing actual
**video**, not just stills, all CORS-enabled.

**Not integrated, deliberately.** TfL's own open-data page states *"You need to
register to gain access to the live feeds"* and directs users to
`api-portal.tfl.gov.uk`. The endpoint currently answers unauthenticated, but
**technical access is not permission**. Relying on an unregistered route that
the provider's terms say requires registration is exactly the assumption this
research exists to prevent.

**To promote to Tier A:** register for a TfL API key, confirm the attribution
wording for this feed (TfL varies it per feed; the general form is "Powered by
TfL Open Data"), and confirm automated retrieval is permitted at our polling
rate. That is a form to fill in, not an engineering problem.

---

## Tier C — do not integrate

| Source | Result | Reason |
| --- | --- | --- |
| **Hong Kong** `tdcctv.data.one.gov.hk` | 200, CORS **yes**, JPEG | **320×240.** Legally fine and technically open, but far too small — a vehicle is a smudge and a plate is invisible. Fails fitness for purpose. |
| **Singapore** LTA DataMall | 404 without `AccountKey` | Requires a registered account key. Cannot be held client-side. |
| **Sweden** Trafikverket | No response to GET | POST-based API requiring an authentication key. |
| **Netherlands** NDW | 200 HTML, CORS **no** | Portal, not an API, at the path tested. Needs deeper research; no CORS on the index. |
| **Norway** Statens vegvesen | 404 at path tested | Endpoint moved or restructured. Worth re-checking. |
| **Ireland** TII | 404 at path tested | Portal-only at that address. |
| **Australia** NSW livetraffic | No response | Endpoint did not answer; may have moved. |

None of these were pursued further. Several are probably viable with more work
— they are listed as "not integrated", not as "unusable".

---

## India — the honest finding

**No public live traffic-camera API was found.**

This matters, because India is the problem statement's target
(SIH26187, MHA / Sashastra Seema Bal).

What exists on `data.gov.in` (which *is* open, CORS-enabled and key-free for
catalogue queries) is **statistics about cameras, not camera feeds**:

| Query | Results | What they actually are |
| --- | --- | --- |
| `cctv` | 8 | "Zone-wise List of Installation of CCTV Cameras under Nirbhaya Fund", subsidiary-wise CCTV counts |
| `camera` | 2 | State/UT-wise availability of CCTV cameras |
| `surveillance` | 22 | Health surveillance, audit surveillance — unrelated |

These are counts and budget lines. Useful for a policy argument about how much
CCTV already exists in India — which is, incidentally, the premise of the whole
problem statement — but they contain no imagery.

City traffic police portals (Delhi, Bengaluru and others) do publish live
junction views through their own web interfaces. Those were **not** pursued
here: they are viewer applications rather than documented APIs, and using them
programmatically would mean inferring endpoints from a page never offered for
that purpose. That is the wrong side of the line this project draws, regardless
of how public the pictures are.

**Consequence for the project:** Indian real-world evaluation data has to come
from footage rather than live feeds — which is what the `eval/footage/corpus/`
work is for, and why the Indian clips in it matter more than their file size
suggests.

---

## What the sources are actually good for

A finding that applies to every traffic camera tested, and is worth stating
plainly because it is easy to oversell:

**Highway and traffic cameras are excellent for evaluating detection, and
useless for evaluating plate recognition.**

They are sited to watch traffic *flow*. Vehicles sit far from the lens, and a
plate occupies a handful of pixels — well under the 42px floor the ALPR engine
measured as its limit. Confirmed directly: on a live Digitraffic camera the
detection engine found 2 cars and 1 traffic light, and the plate detector found
**zero plates**, correctly.

So:

| Capability | These feeds |
| --- | --- |
| Vehicle / person detection under real weather, light, distance, compression | **Strong** — this is exactly the realistic input the engine needs |
| Virtual fence and intrusion logic | **Strong** |
| Night and adverse-weather robustness | **Strong** |
| ANPR | **Not usable** — wrong camera geometry entirely |

A public highway camera proves the platform ingests real authorised
infrastructure. It does not prove plate recognition, and should never be
presented as if it does.

---

## Priority for future integration

1. **Register with TfL** — highest value per unit of effort. 890 cameras, real
   video, CORS already verified. Blocked only on a registration form.
2. **Re-check Norway, Ireland, Netherlands** at current endpoints. All three
   are national authorities with open-data mandates; the 404s look like moved
   paths rather than closed doors.
3. **US state 511 systems** — many publish documented APIs, though most require
   a developer key, which pushes them to Tier B for a browser-only client.
4. **Do not chase Indian live feeds.** The evidence says they are not published
   as APIs. Effort is better spent on Indian footage.

## Risks

| Risk | Mitigation |
| --- | --- |
| Single Tier A provider | Adapter architecture makes a second provider cheap; TfL is one form away |
| Provider withdraws or changes API | Change is isolated to one adapter file |
| Licence terms change | Licence recorded per provider and displayed in the library; re-check before relying |
| Unregistered access silently revoked | Precisely why TfL sits in Tier B rather than being integrated on a technicality |
| Feed goes down mid-demonstration | Bundled clips are the demo primary; a live camera is the proof, not the dependency |
