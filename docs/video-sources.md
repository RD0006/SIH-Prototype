# Real-world video ingestion

The platform accepts video from four routes, chosen for whether they genuinely
work rather than how many protocol names they add to a slide.

## Authorisation

The platform connects to sources an operator supplies or owns. It does **not**
search for cameras, does not probe address ranges, does not attempt to reach
anything behind authentication, and has no mechanism for doing any of those
things. Legitimate sources are: a camera attached to the machine, a recording
the operator holds, footage shipped with the platform, or a stream address the
operator is authorised to use — their own organisation's, or a feed an authority
publishes for public viewing.

The stream field states this in the interface, next to the input, rather than
burying it in documentation.

## The constraint that determines everything

Detection reads frames through `canvas.getImageData`. A canvas that has had
cross-origin media drawn onto it **without CORS permission is "tainted"** and
the browser refuses that read.

Measured in this application: a cross-origin image with no
`Access-Control-Allow-Origin` header taints the canvas. The video plays
perfectly on screen and the analytics see nothing.

So a source has two independent capabilities, and the platform reports them
separately:

| | Meaning |
| --- | --- |
| **Playable** | The browser can display it |
| **Analysable** | The browser will also let us read its pixels |

A feed can be the first without the second. That case is common with public
authority cameras, and the console says **"Preview only — analytics cannot run
on this source"** rather than appearing to work.

## Supported sources

| Source | Playable | Analysable | Live | Notes |
| --- | --- | --- | --- | --- |
| Demonstration footage | yes | **always** | no | Served from our own origin |
| Uploaded recording | yes | **always** | no | Read as a local blob; the file never leaves the machine |
| Connected camera | yes | **always** | **yes** | `getUserMedia`; needs operator permission and a secure origin |
| HLS (`.m3u8`) | yes | only with CORS | yes | The format most public authority cameras publish |
| HTTP video (`.mp4`/`.webm`) | yes | only with CORS | no | |
| MJPEG | yes | only with CORS | yes | Common on older IP cameras |
| **RTSP** | **no** | **no** | yes | See below |

### Why RTSP is not implemented

No browser can play RTSP. Supporting it requires a gateway that repackages the
stream as HLS or WebRTC — ffmpeg or MediaMTX running on the post's own machine.
That gateway is a server, and this prototype is deliberately serverless so it
can run on the machine already sitting in the control room.

The platform therefore **detects `rtsp://` and explains this**, rather than
appearing to connect and failing silently. For a real deployment the gateway is
the correct answer and is a small piece of work; it is simply not a browser
feature.

## Validation before connection

`probeSource()` answers four questions in order, and stops at the first failure:

1. **Is this a shape we can play?** — URL parsing and format detection
2. **Will the browser permit it?** — mixed content, secure context
3. **Is anything there?** — a CORS request, falling back to `no-cors` to tell
   "nothing at that address" apart from "there but not sharing"
4. **Can we read pixels?** — whether the CORS request succeeded

Verified against live streams:

| Input | Result |
| --- | --- |
| `https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8` | `ready` — HLS stream ready |
| `https://devstreaming-cdn.apple.com/.../master.m3u8` | `ready` |
| `rtsp://192.0.2.1:554/stream` | `unsupported` — with the gateway explanation |
| `https://example.invalid/nope.m3u8` | `unreachable` |
| `not a url` | `unsupported` — not a valid URL |

Headers predict pixel access; the decoded frame proves it. `canReadPixels()`
re-checks once frames actually arrive, because the two can disagree — a
redirect to another host, or a CDN that varies its headers.

One subtlety worth recording: a video with no decoded frames cannot taint a
canvas, so a naive read *succeeds* and reports a dead stream as analysable.
The check requires non-zero `videoWidth` first and reports `pending` otherwise.
That bug was live until a stalled stream exposed it.

## Connection health

Every attachment reports through one callback:

`connecting` → `live` → (`stalled` | `ended` | `error`)

A live source whose `currentTime` stops advancing for six seconds is reported
as **stalled** — a camera that quietly drops mid-shift otherwise looks
identical to one showing a static scene. HLS network and media errors are
retried once through hls.js's own recovery; anything else is reported rather
than looped on.

A declined camera permission is treated as a legitimate answer and stated
plainly, not retried.

## End-to-end verification

The full pipeline was run against a live remote HLS stream — connect, decode,
confirm pixel access, grab a frame, run detection. It returned zero detections,
which is the correct result: that test stream is animation, not traffic. What
it demonstrates is that the path from a remote live stream to the detection
engine is real and unbroken.

## Evaluation data is not training data

Footage the platform ingests is used to **evaluate** robustness. None of it is
used to train or fine-tune anything, and the platform has no training path.
Before any footage were used for model improvement, storage or redistribution,
authorisation, licensing and privacy would each need to be established
separately — a live feed being viewable does not make its contents free to
retain.

The evaluation corpus under `eval/footage/` is freely-licensed stock footage
with per-file provenance recorded in manifests. Live streams are viewed, not
retained: nothing from a stream is written to disk.
