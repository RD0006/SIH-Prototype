# ANPR night / low-light / adverse-weather corpus — MANIFEST

**75 clips · 1.22 GB (1.14 GiB, 1167 MiB as `du -sm`) · every clip ≥1080 lines · no audio track**

All clips sourced from **Pexels** under the **Pexels License** (free for commercial and non-commercial use, no attribution required; attribution recorded here anyway). Discovered via the Pexels public video search; original source page linked per clip.

## Processing

- Downloaded as the publisher's 1920x1080 (or wider, full-1080-line) H.264 MP4 rendition.
- Clips longer than 60 s trimmed to the first 60 s with `ffmpeg -nostdin -t 60 -c copy` (stream copy — no re-encode, no quality loss).
- Sources taller than 1080 lines scaled to exactly 1080 lines with Lanczos (`scale=-2:1080`, aspect preserved), re-encoded x264 CRF 20.
- **Nothing was downscaled below 1080 lines.** Any download that probed under 1080 lines was deleted rather than kept.
- Audio stripped (`-an`); `+faststart` applied.

## Condition breakdown

| Condition | Clips | Size |
|---|---:|---:|
| fog | 11 | 97 MB |
| night (dry) | 10 | 150 MB |
| rain (daylight/overcast) | 10 | 187 MB |
| tunnel | 10 | 122 MB |
| rain + night | 9 | 114 MB |
| car park / garage | 9 | 111 MB |
| snow | 8 | 202 MB |
| dusk / twilight | 8 | 185 MB |
| **Total** | **75** | **1167 MB** |

## Plate-visibility key

- **PLATE** — a number plate is resolvable by eye in at least one frame.
- **PARTIAL** — plate region is a distinct bright blob; characters marginal or intermittent.
- **NO PLATE** — vehicles present but plates not facing camera / too distant / occluded.
- **NO VEHICLE** — scene has no usable vehicle rear or front (interior, driver portrait, distant light trails only).
- Unmarked entries were not individually eyeballed (raw corpus).

### How many clips actually show a plate

Every clip was eyeballed on a frame at 45% of its duration; the strongest candidates were additionally checked at native 1:1 resolution.

| Verdict | Clips | Share |
|---|---:|---:|
| PLATE | 10 | 13% |
| PARTIAL | 26 | 35% |
| NO PLATE | 29 | 39% |
| NO VEHICLE | 10 | 13% |

## Clips

| # | File | Condition | Res | Dur | Size | Author | Source | Plate visibility |
|---|---|---|---|---:|---:|---|---|---|
| 1 | `night-001-cars-road.mp4` | night (dry) | 1998x1080 | 6 s | 3.9 MB | Alex Mesel | [link](https://www.pexels.com/video/cars-on-the-road-10039006/) | **PARTIAL** — night dashcam, side/oncoming vehicles; plate region present but motion-blurred |
| 2 | `night-002-nighttime-rainy-urban-traffic-scene.mp4` | rain + night | 1920x1080 | 38 s | 17.9 MB | Bahadır D. | [link](https://www.pexels.com/video/nighttime-rainy-urban-traffic-scene-33743353/) | **PARTIAL** — wet night road, vehicles mid-distance; retroreflective plates read as bright blobs |
| 3 | `night-003-person-driving-car-while-raining.mp4` | rain (daylight/overcast) | 1920x1080 | 20 s | 10.7 MB | Lars Mai | [link](https://www.pexels.com/video/a-person-driving-a-car-while-raining-wipers-on-working-on-the-windshield-3913495/) | **NO VEHICLE** — in-car dashboard POV with rain on the glass — useful as rain-on-lens texture only |
| 4 | `night-004-woman-driving-car-street.mp4` | car park / garage | 1920x1080 | 35 s | 23.3 MB | KoolShooters | [link](https://www.pexels.com/video/a-woman-driving-a-car-on-the-street-8101862/) | **PARTIAL** — garage/underpass, single vehicle at distance under sodium light |
| 5 | `night-005-car-driving-through-tunnel-cars.mp4` | tunnel | 1920x1080 | 8 s | 11.6 MB | Patrick | [link](https://www.pexels.com/video/a-car-driving-through-a-tunnel-with-cars-on-the-road-27288183/) | **PARTIAL** — tunnel dashcam, van rear ahead; plate small but present |
| 6 | `night-006-car-road-foggy-day.mp4` | fog | 1920x1080 | 7 s | 1.3 MB | Rafael Fernanz | [link](https://www.pexels.com/video/car-on-road-in-foggy-day-13707149/) | **NO PLATE** — near-black dusk road, one distant headlight pair |
| 7 | `night-007-snow-covered-road.mp4` | snow | 1920x1080 | 60 s | 38.2 MB | Lars H Knudsen | [link](https://www.pexels.com/video/a-snow-covered-road-7080152/) | **NO PLATE** — elevated snow highway, vehicles far too distant |
| 8 | `night-008-cars-road.mp4` | dusk / twilight | 1920x1080 | 42 s | 28.3 MB | Bogdan Krupin | [link](https://www.pexels.com/video/cars-on-the-road-9829780/) | **NO PLATE** — dusk aerial highway, vehicles only a few px wide |
| 9 | `night-009-nighttime-highway-drive-vehicle-lights.mp4` | night (dry) | 1920x1080 | 29 s | 5.6 MB | Altaf Shah | [link](https://www.pexels.com/video/nighttime-highway-drive-with-vehicle-lights-31858030/) | **NO PLATE** — very dark highway, distant oncoming headlights only |
| 10 | `night-010-nighttime-highway-drive-headlights.mp4` | rain + night | 1920x1080 | 20 s | 12.0 MB | Ingo Joseph | [link](https://www.pexels.com/video/nighttime-highway-drive-with-headlights-863860/) | **NO PLATE** — dark motorway, distant taillights |
| 11 | `night-011-person-driving-car-while-raining.mp4` | rain (daylight/overcast) | 1920x1080 | 10 s | 5.7 MB | Andrew Kota | [link](https://www.pexels.com/video/a-person-driving-a-car-while-raining-wipers-on-working-on-the-windshield-3914583/) | **NO VEHICLE** — wing-mirror / water view from a moving car |
| 12 | `night-012-car-driving-underground.mp4` | car park / garage | 2048x1080 | 5 s | 3.5 MB | Emre Vonal | [link](https://www.pexels.com/video/car-driving-underground-11260162/) | **PARTIAL** — underground car park; plate occluded by pillar at the sampled frame |
| 13 | `night-013-cars-driving-under-overpass-night.mp4` | tunnel | 1920x1080 | 21 s | 12.8 MB | Mary Moss | [link](https://www.pexels.com/video/cars-driving-under-an-overpass-at-night-17613996/) | **PLATE** — airport terminal roadway at night, close vehicle rears; plate readable |
| 14 | `night-014-car-driving-highway-during-fog.mp4` | fog | 1920x1080 | 11 s | 6.8 MB | Ms. Jade | [link](https://www.pexels.com/video/car-driving-on-highway-during-fog-10268547/) | **NO VEHICLE** — fog highway, empty carriageway |
| 15 | `night-015-night-winter-road.mp4` | snow | 2542x1080 *(scaled from 2730x1160)* | 17 s | 24.3 MB | binary Ego | [link](https://www.pexels.com/video/night-winter-road-16230097/) | **NO PLATE** — night snow, oncoming headlight glare washes out the plate |
| 16 | `night-016-car-driving-down-street-sunset.mp4` | dusk / twilight | 1920x1080 | 8 s | 5.2 MB | Aneesh Prodduturu | [link](https://www.pexels.com/video/a-car-driving-down-a-street-at-sunset-27036553/) | **PARTIAL** — dusk street, near vehicle rear at bottom of frame |
| 17 | `night-017-cars-driving-night.mp4` | night (dry) | 1920x1080 | 6 s | 3.3 MB | El Jundi | [link](https://www.pexels.com/video/cars-driving-at-night-9689475/) | **NO PLATE** — night elevated highway, vehicles distant |
| 18 | `night-018-car-drives-through-flooded-street.mp4` | rain + night | 1920x1080 | 13 s | 8.1 MB | Lone  Pictures | [link](https://www.pexels.com/video/a-car-drives-through-a-flooded-street-at-night-9481660/) | **PARTIAL** — flooded night street, rickshaw and cars, strong wet reflections |
| 19 | `night-019-car-driving-rainy-day.mp4` | rain (daylight/overcast) | 1920x1080 | 24 s | 15.7 MB | K | [link](https://www.pexels.com/video/car-driving-on-a-rainy-day-3999392/) | **PLATE** — wet road, SUV passing side-on; front plate clearly resolved |
| 20 | `night-020-woman-driving-car-street.mp4` | car park / garage | 1920x1080 | 30 s | 19.8 MB | KoolShooters | [link](https://www.pexels.com/video/a-woman-driving-a-car-on-the-street-8101854/) | **NO PLATE** — garage corridor, vehicle only at the far end |
| 21 | `night-021-car-driving-through-tunnel-view.mp4` | tunnel | 1920x1080 | 9 s | 6.5 MB | Kmeel.com Videos | [link](https://www.pexels.com/video/a-car-driving-through-a-tunnel-with-a-view-of-the-water-19698650/) | **NO VEHICLE** — empty tunnel |
| 22 | `night-022-nighttime-foggy-street-city-neon.mp4` | fog | 1920x1080 | 26 s | 15.9 MB | Matthias Groeneveld | [link](https://www.pexels.com/video/nighttime-foggy-street-with-city-neon-lights-34964495/) | **PARTIAL** — fog night forecourt/junction, vehicles mid-distance |
| 23 | `night-023-scenic-winter-drive-snowy-country.mp4` | snow | 1920x1080 | 12 s | 20.9 MB | Yussuf Muradov | [link](https://www.pexels.com/video/scenic-winter-drive-on-snowy-country-road-35735160/) | **PLATE** — snow road, oncoming car front plate visible |
| 24 | `night-024-busy-freeway-traffic-dusk-trucks.mp4` | dusk / twilight | 1920x1080 | 34 s | 90.4 MB | Eyes2Soul Eyes2Soul | [link](https://www.pexels.com/video/busy-freeway-traffic-at-dusk-with-trucks-and-cars-29089174/) | **PARTIAL** — elevated dusk highway, trucks and cars, plates small |
| 25 | `night-025-time-lapse-car-driving-road.mp4` | night (dry) | 1920x1080 | 60 s | 39.9 MB | RJ Shelton | [link](https://www.pexels.com/video/time-lapse-of-car-driving-on-road-in-city-at-evening-9832350/) | **PLATE** — night city dashcam, near car rear; plate a bright rectangle with characters |
| 26 | `night-026-driving-road-rain-night.mp4` | rain + night | 1920x1080 | 14 s | 4.1 MB | Özge  Kurban | [link](https://www.pexels.com/video/driving-on-road-in-rain-at-night-11785816/) | **PARTIAL** — rain night, taillights plus retroreflective plate blob |
| 27 | `night-027-close-up-video-car-wipers.mp4` | rain (daylight/overcast) | 1920x1080 | 60 s | 38.5 MB | Klaus | [link](https://www.pexels.com/video/close-up-video-of-car-wipers-5378927/) | **PARTIAL** — wiper-swept windscreen, lead vehicle rear |
| 28 | `night-028-bmw-driving-parking-lot.mp4` | car park / garage | 1920x1080 | 10 s | 6.0 MB | Emre Vonal | [link](https://www.pexels.com/video/bmw-driving-in-a-parking-lot-7700793/) | **PLATE** — car park, red saloon rear; plate characters resolvable at frame edge |
| 29 | `night-029-slow-motion-video-driving-city.mp4` | tunnel | 1920x1080 | 54 s | 34.9 MB | Andrew Pakho | [link](https://www.pexels.com/video/slow-motion-video-of-driving-on-city-road-5103753/) | **PARTIAL** — tunnel, lead vehicles ahead |
| 30 | `night-030-highway-cars-driving-it-fog.mp4` | fog | 1920x1080 | 5 s | 3.4 MB | Orhan Pergel | [link](https://www.pexels.com/video/a-highway-with-cars-driving-on-it-in-the-fog-19107642/) | **PARTIAL** — fog motorway, trucks and cars, plates small |
| 31 | `night-031-highway-traffic-winter-night.mp4` | snow | 1920x1080 | 16 s | 11.1 MB | Konsta Nurkkala | [link](https://www.pexels.com/video/highway-traffic-on-a-winter-night-14614732/) | **NO PLATE** — night road, no near vehicle |
| 32 | `night-032-cars-road-city.mp4` | dusk / twilight | 1920x1080 | 13 s | 7.4 MB | George Morina | [link](https://www.pexels.com/video/cars-on-the-road-in-the-city-5122482/) | **PARTIAL** — dusk street, kerbside vehicles |
| 33 | `night-033-nighttime-highway-drive-passing-traffic.mp4` | night (dry) | 1920x1080 | 28 s | 7.9 MB | Altaf Shah | [link](https://www.pexels.com/video/nighttime-highway-drive-with-passing-traffic-31842064/) | **NO PLATE** — dark highway, distant lights only |
| 34 | `night-034-time-lapse-video-person-riding.mp4` | rain + night | 1920x1080 | 5 s | 2.7 MB | Igor Siqueira | [link](https://www.pexels.com/video/time-lapse-video-of-a-person-riding-a-bus-5969988/) | **PARTIAL** — truck cab POV over a night rain queue |
| 35 | `night-035-raindrops-vehicle-windshield.mp4` | rain (daylight/overcast) | 1920x1080 | 11 s | 3.2 MB | Aleks BM | [link](https://www.pexels.com/video/raindrops-on-a-vehicle-windshield-10541023/) | **NO VEHICLE** — rain-blurred glass, no vehicle resolvable |
| 36 | `night-036-roundabout-road-many-intersection.mp4` | car park / garage | 1920x1080 | 13 s | 9.0 MB | Marian Croitoru | [link](https://www.pexels.com/video/a-roundabout-road-with-many-intersection-5607785/) | **NO PLATE** — aerial night roundabout, vehicles tiny |
| 37 | `night-037-view-car-interior-driving-tunnel.mp4` | tunnel | 1920x1080 | 6 s | 2.8 MB | Boris Ivas | [link](https://www.pexels.com/video/view-from-car-interior-driving-in-tunnel-11269279/) | **PARTIAL** — in-car tunnel POV, lead vehicle ahead |
| 38 | `night-038-misty-nighttime-city-street-headlights.mp4` | fog | 1920x1080 | 18 s | 12.5 MB | Sketch Benjamin | [link](https://www.pexels.com/video/misty-nighttime-city-street-with-headlights-in-fog-30339954/) | **NO PLATE** — fog night, headlight glare dominates |
| 39 | `night-039-road-city-winter-night.mp4` | snow | 1920x1080 | 60 s | 33.5 MB | Dmitry Marchenkov | [link](https://www.pexels.com/video/road-in-city-in-winter-at-night-11067515/) | **NO PLATE** — snow city street, vehicles distant |
| 40 | `night-040-car-driving-highway-sunset.mp4` | dusk / twilight | 1920x1080 | 16 s | 16.9 MB | Sergen Yetimoğlu | [link](https://www.pexels.com/video/a-car-driving-on-a-highway-at-sunset-27622908/) | **PARTIAL** — dusk highway, near vehicle rear |
| 41 | `night-041-driving-night-highway.mp4` | night (dry) | 1920x1080 | 60 s | 39.5 MB | Nelson Axigoth | [link](https://www.pexels.com/video/driving-at-night-in-a-highway-5938339/) | **PARTIAL** — Mini rear very close at night; plate is a blown-out retroreflective rectangle ~180 px wide, characters NOT resolvable — textbook ANPR hard case |
| 42 | `night-042-video-car-wiping-windshield-while.mp4` | rain (daylight/overcast) | 1920x1080 | 11 s | 6.8 MB | sol bittencourt | [link](https://www.pexels.com/video/video-in-a-car-wiping-the-windshield-while-raining-6194746/) | **NO PLATE** — rain windscreen over an empty road |
| 43 | `night-043-drone-footage-cars-road.mp4` | tunnel | 1920x1080 | 22 s | 14.9 MB | K | [link](https://www.pexels.com/video/drone-footage-of-cars-on-the-road-4042762/) | **NO PLATE** — aerial wet roundabout, vehicles small |
| 44 | `night-044-scenic-rainy-autumn-drive-country.mp4` | fog | 1920x1080 | 15 s | 7.7 MB | Luke Miller | [link](https://www.pexels.com/video/scenic-rainy-autumn-drive-on-country-road-29052723/) | **PARTIAL** — rain, SUV rear at mid-distance |
| 45 | `night-045-aerial-winter-traffic-urban-intersection.mp4` | snow | 1920x1080 | 15 s | 13.2 MB | Efrem  Efre | [link](https://www.pexels.com/video/aerial-winter-traffic-at-urban-intersection-36418720/) | **NO PLATE** — top-down snow intersection — plates not in view from directly above |
| 46 | `night-046-time-lapse-video-cars-road.mp4` | night (dry) | 1920x1080 | 11 s | 6.7 MB | Alan W | [link](https://www.pexels.com/video/time-lapse-video-of-cars-on-the-road-10161880/) | **PARTIAL** — elevated night traffic, many vehicle rears, plates small but retroreflective |
| 47 | `night-047-nighttime-rain-drive-city-lights.mp4` | rain + night | 1920x1080 | 16 s | 17.9 MB | Gera Cejas | [link](https://www.pexels.com/video/nighttime-rain-drive-with-city-lights-31940807/) | **NO PLATE** — rain night dashcam, no near vehicle |
| 48 | `night-048-man-driving-rain-highway.mp4` | rain (daylight/overcast) | 1920x1080 | 46 s | 49.8 MB | Nothing Ahead | [link](https://www.pexels.com/video/a-man-driving-in-the-rain-on-a-highway-27432832/) | **NO VEHICLE** — fogged interior glass |
| 49 | `night-049-traffic-highway-bridge.mp4` | fog | 1920x1080 | 27 s | 9.3 MB | Prime Media Photography | [link](https://www.pexels.com/video/traffic-on-a-highway-bridge-15860304/) | **NO PLATE** — dusk bridge, vehicles distant |
| 50 | `night-050-cars-road.mp4` | snow | 1920x1080 | 30 s | 20.3 MB | Olavi Anttila | [link](https://www.pexels.com/video/cars-on-the-road-14939703/) | **PLATE** — snow, parked cars rear; plates legible |
| 51 | `night-051-sunset-driving-community-road.mp4` | dusk / twilight | 1920x1080 | 35 s | 18.3 MB | WeStarMoney  Rec | [link](https://www.pexels.com/video/sunset-driving-at-a-community-road-4833483/) | **NO PLATE** — motion-blurred night frame |
| 52 | `night-052-cars-driving-night.mp4` | night (dry) | 1920x1080 | 30 s | 16.9 MB | Jonathan 8@ | [link](https://www.pexels.com/video/cars-driving-at-night-7007979/) | **PARTIAL** — wet night street, van and cars |
| 53 | `night-053-night-street-slow-motion.mp4` | rain + night | 1920x1080 | 33 s | 21.3 MB | nathan murphy | [link](https://www.pexels.com/video/night-street-slow-motion-19924296/) | **NO PLATE** — tram — carries no number plate |
| 54 | `night-054-view-inside-car-rainy-day.mp4` | rain (daylight/overcast) | 1920x1080 | 23 s | 15.6 MB | Nothing Ahead | [link](https://www.pexels.com/video/a-view-from-inside-a-car-on-a-rainy-day-15814789/) | **NO PLATE** — rain truck POV, road ahead empty |
| 55 | `night-055-drone-landing-car-parking-lot.mp4` | car park / garage | 1920x1080 | 28 s | 6.3 MB | Jaxon Matthew Willis | [link](https://www.pexels.com/video/drone-landing-by-a-car-in-a-parking-lot-at-night-13591136/) | **NO PLATE** — very dark, vehicle barely separable from background |
| 56 | `night-056-scenic-drive-through-illuminated-tunnel.mp4` | tunnel | 1920x1080 | 11 s | 16.5 MB | Dubang chang | [link](https://www.pexels.com/video/scenic-drive-through-illuminated-tunnel-29256507/) | **NO VEHICLE** — tunnel motion blur |
| 57 | `night-057-foggy-night-street-scene-car.mp4` | fog | 1920x1080 | 28 s | 11.5 MB | Matthias Groeneveld | [link](https://www.pexels.com/video/foggy-night-street-scene-with-car-lights-34964488/) | **PARTIAL** — fog night street, kerbside car rear |
| 58 | `night-058-car-driving-along-road-winter.mp4` | snow | 1920x1080 | 60 s | 39.9 MB | I Am Sorin | [link](https://www.pexels.com/video/car-driving-along-road-in-winter-11006033/) | **NO VEHICLE** — empty snow road |
| 59 | `night-059-nighttime-traffic-car-bus-lights.mp4` | night (dry) | 1920x1080 | 21 s | 11.7 MB | Evgenij Mikhailov | [link](https://www.pexels.com/video/nighttime-traffic-with-car-and-bus-lights-32147070/) | **PLATE** — night rain, near vehicle rear; plate characters visible though soft |
| 60 | `night-060-nighttime-rain-drive-through-city.mp4` | rain + night | 1920x1080 | 20 s | 21.2 MB | Gera Cejas | [link](https://www.pexels.com/video/nighttime-rain-drive-through-city-streets-31940805/) | **NO PLATE** — rain night windscreen, oncoming glare |
| 61 | `night-061-driving-across-mackinac-bridge-rain.mp4` | rain (daylight/overcast) | 1920x1080 | 25 s | 22.9 MB | fish socks | [link](https://www.pexels.com/video/driving-across-mackinac-bridge-in-rain-34622576/) | **NO PLATE** — fog bridge, vehicles distant |
| 62 | `night-062-footage-car-moving-backwards.mp4` | car park / garage | 1920x1080 | 38 s | 24.7 MB | KoolShooters | [link](https://www.pexels.com/video/a-footage-of-a-car-moving-backwards-8101848/) | **NO PLATE** — garage corridor with pedestrian, no plate facing camera |
| 63 | `night-063-blurry-nighttime-urban-traffic-scene.mp4` | tunnel | 1920x1080 | 60 s | 10.2 MB | Engin Akyurt | [link](https://www.pexels.com/video/blurry-nighttime-urban-traffic-scene-32173275/) | **NO VEHICLE** — heavy defocus bokeh of city lights |
| 64 | `night-064-car-driving-down-foggy-street.mp4` | fog | 1920x1080 | 16 s | 10.8 MB | Huu Huynh | [link](https://www.pexels.com/video/a-car-is-driving-down-a-foggy-street-20330096/) | **PLATE** — fog road, white car front; Japanese plate resolved |
| 65 | `night-065-aerial-evening-traffic-highway-twilight.mp4` | dusk / twilight | 1920x1080 | 15 s | 12.8 MB | Piotr Wojnowski | [link](https://www.pexels.com/video/aerial-evening-traffic-on-highway-at-twilight-29374299/) | **NO PLATE** — aerial dusk interchange, vehicles tiny |
| 66 | `night-066-parking-lot.mp4` | car park / garage | 1920x1080 | 30 s | 15.9 MB | Oleh Budurov | [link](https://www.pexels.com/video/parking-lot-18320892/) | **PLATE** — underground car park, parked vehicle rears under even light |
| 67 | `night-067-busy-street-tunnel-seen-inside.mp4` | tunnel | 1920x1080 | 10 s | 6.1 MB | Francesco Navarro | [link](https://www.pexels.com/video/busy-street-tunnel-seen-from-inside-vehicle-6138874/) | **PARTIAL** — underpass traffic queue, plates small |
| 68 | `night-068-night-traffic-fog.mp4` | fog | 1920x1080 | 20 s | 5.2 MB | Sergei Skrynnik | [link](https://www.pexels.com/video/night-traffic-in-fog-11789203/) | **PARTIAL** — fog night, kerbside cars |
| 69 | `night-069-time-lapse-footage-moving-vehicles.mp4` | dusk / twilight | 1920x1080 | 9 s | 5.5 MB | Antoni Shkraba | [link](https://www.pexels.com/video/time-lapse-footage-of-moving-vehicles-on-the-road-8064158/) | **NO PLATE** — aerial sunset traffic, vehicles tiny |
| 70 | `night-070-cars-road.mp4` | night (dry) | 1920x1080 | 22 s | 14.5 MB | 宋 小天 | [link](https://www.pexels.com/video/cars-on-the-road-5518089/) | **PARTIAL** — night street, red car and scooter mid-distance |
| 71 | `night-071-night-drive-neon-lights.mp4` | rain + night | 1920x1080 | 13 s | 8.9 MB | Nathan J Hilton | [link](https://www.pexels.com/video/night-drive-and-neon-lights-19058370/) | **NO PLATE** — bokeh rain, nothing in focus |
| 72 | `night-072-automobile-italia-ponte-milano.mp4` | rain (daylight/overcast) | 1920x1080 | 29 s | 17.7 MB | Ambient_Nature_ Atmosphere | [link](https://www.pexels.com/video/automobile-italia-ponte-milano-4009570/) | **NO PLATE** — rain window over passing traffic |
| 73 | `night-073-person-walking-parking-lot.mp4` | car park / garage | 1920x1080 | 4 s | 2.4 MB | Emre Vonal | [link](https://www.pexels.com/video/person-walking-in-a-parking-lot-7700719/) | **PARTIAL** — car park, red car partly occluded by a person |
| 74 | `night-074-moody-night-drive-through-dimly.mp4` | tunnel | 1920x1080 | 15 s | 5.5 MB | 정규송 Nui MALAMA | [link](https://www.pexels.com/video/moody-night-drive-through-a-dimly-lit-tunnel-33938673/) | **NO VEHICLE** — empty tunnel |
| 75 | `night-075-truck-driving-foggy-road.mp4` | fog | 1920x1080 | 19 s | 12.5 MB | Huu Huynh | [link](https://www.pexels.com/video/a-truck-is-driving-on-a-foggy-road-20330099/) | **PLATE** — fog road, light truck front; plate resolved |

## Licence

Every file above is under the [Pexels License](https://www.pexels.com/license/): free to use, no attribution required, for commercial and non-commercial purposes. Redistribution of the clips as stock content, and identifiable-person / trademark uses, remain restricted by that licence — evaluation use of the kind this corpus exists for is permitted.

## Note on other files in this directory

Files matching `night-px<id>.mp4` were written into this directory by a different process while this corpus was being built. They are **not part of this manifest**: they are unprocessed (untrimmed, not resolution-checked) and several are portrait orientation, which is unusable for plate recognition. Their provenance and licence were not verified here. Only the `night-NNN-<description>.mp4` files listed above are covered by this manifest.
