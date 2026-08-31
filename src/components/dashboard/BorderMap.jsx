import {
  Circle,
  CircleMarker,
  MapContainer,
  TileLayer,
  ZoomControl,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

function BorderMap() {
  // Illustrative location only
  const monitoredZone = [28.4595, 77.0266];

  return (
    <div className="border-map relative h-[420px] overflow-hidden rounded-b-2xl bg-[#080d10]">
      <MapContainer
        center={monitoredZone}
        zoom={11}
        zoomControl={false}
        className="h-full w-full"
      >
        {/* OpenStreetMap */}
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ZoomControl position="bottomright" />

        {/* Illustrative surveillance zone */}
        <Circle
          center={monitoredZone}
          radius={9000}
          pathOptions={{
            color: "red",
            weight: 3.5,
            fillColor: "#d6a84f",
            fillOpacity: 0.04,
            dashArray: "8 8",
          }}
        />
        {/* Central alert indicator */}
      <CircleMarker
        center={monitoredZone}
        radius={7}
        pathOptions={{
          color: "#ffffff",
          weight: 2,
          fillColor: "#d95c5c",
          fillOpacity: 1,
        }}
      />
      </MapContainer>

      {/* Live map indicator */}
      <div className="pointer-events-none absolute left-4 top-4 z-[1000]">
        <div className="rounded-xl border border-[#26343b] bg-[#0b1014]/90 px-4 py-3 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#65a982] opacity-60" />

              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#65a982]" />
            </span>

            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#e7ecea]">
              Live surveillance
            </span>
          </div>

          <p className="mt-1 text-[9px] text-[#718087]">
            Regional intelligence overview
          </p>
        </div>
      </div>

      {/* Illustrative notice */}
      <div className="pointer-events-none absolute bottom-4 left-4 z-[1000]">
        <div className="rounded-lg border border-[#26343b] bg-[#0b1014]/90 px-3 py-2 backdrop-blur-md">
          <p className="text-[8px] uppercase tracking-[0.15em] text-[#718087]">
            Illustrative data · Not a real deployment
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="pointer-events-none absolute right-4 top-4 z-[1000]">
        <div className="rounded-lg border border-[#26343b] bg-[#0b1014]/90 p-3 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full border border-[#d6a84f]" />

            <span className="text-[8px] uppercase tracking-wider text-[#829096]">
              Illustrative zone
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BorderMap;