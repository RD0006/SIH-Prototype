/**
 * What the operator sees on top of the video.
 *
 * Fences are drawn in SVG (they are true polygons and must follow the frame's
 * aspect), while boxes and labels are HTML positioned in percentages so text
 * stays crisp and level — an SVG stretched with preserveAspectRatio="none"
 * would shear any text inside it.
 */

import { DOMAIN_COLOR } from "../../lib/analytics/classes";
import { polygonCentroid, polygonToPoints } from "../../lib/analytics/geometry";

const ZONE_TINT = {
  fence: "#f87171",
  restricted: "#fb923c",
  tripwire: "#facc15",
};

export default function DetectionOverlay({
  tracks,
  zones,
  showZones = true,
  showTrails = true,
}) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {showZones &&
          zones.map((zone) => {
            const tint = ZONE_TINT[zone.kind] ?? "#fb923c";

            return (
              <polygon
                key={zone.id}
                points={polygonToPoints(zone.polygon)}
                fill={tint}
                fillOpacity="0.07"
                stroke={tint}
                strokeOpacity="0.55"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

        {showTrails &&
          tracks.map((track) =>
            track.trail.length < 2 ? null : (
              <polyline
                key={`trail-${track.id}`}
                points={track.trail
                  .map((point) => `${point.x * 100},${point.y * 100}`)
                  .join(" ")}
                fill="none"
                stroke={DOMAIN_COLOR[track.domain]}
                strokeOpacity="0.4"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
            ),
          )}
      </svg>

      {/* Zone names */}
      {showZones &&
        zones.map((zone) => {
          const centre = polygonCentroid(zone.polygon);
          const tint = ZONE_TINT[zone.kind] ?? "#fb923c";

          return (
            <span
              key={`label-${zone.id}`}
              className="absolute -translate-x-1/2 whitespace-nowrap rounded px-1.5 py-0.5 text-[9px] tracking-wide backdrop-blur-sm"
              style={{
                left: `${centre.x * 100}%`,
                top: `${centre.y * 100}%`,
                color: tint,
                background: "rgba(17,20,24,0.55)",
              }}
            >
              {zone.name.toUpperCase()}
            </span>
          );
        })}

      {/* Detection boxes */}
      {tracks.map((track) => {
        const colour = DOMAIN_COLOR[track.domain];
        const left = track.box.xmin * 100;
        const top = track.box.ymin * 100;
        const width = (track.box.xmax - track.box.xmin) * 100;
        const height = (track.box.ymax - track.box.ymin) * 100;

        const alarming = Object.values(track.zoneState).some(
          (state) => state.inside,
        );

        return (
          <div
            key={track.id}
            className="absolute transition-all duration-150 ease-linear"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${width}%`,
              height: `${height}%`,
              border: `1.5px solid ${colour}`,
              boxShadow: alarming ? `0 0 14px ${colour}66` : "none",
              background: alarming ? `${colour}12` : "transparent",
            }}
          >
            <span
              className="absolute -top-[17px] left-0 flex items-center gap-1 whitespace-nowrap rounded-sm px-1.5 py-[2px] text-[9px] font-medium"
              style={{ background: colour, color: "#0b0d10" }}
            >
              {track.id} · {track.display}
              <span className="opacity-70">
                {(track.confidence * 100).toFixed(0)}%
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
