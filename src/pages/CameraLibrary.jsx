/**
 * Camera Library — browse and connect authorised public cameras.
 *
 * A working library rather than a gallery: every entry here was discovered
 * through its provider's documented API, carries that provider's licence and
 * attribution, and can be handed straight to the surveillance engine.
 *
 * Two things are shown on every camera because they decide whether it is
 * useful: whether the browser can read its pixels (and therefore whether
 * analytics can run at all), and which authority published it.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Globe,
  Loader2,
  MapPin,
  ScanEye,
  ShieldCheck,
  Video,
} from "lucide-react";
import { useNavigate } from "react-router";

import {
  listCameras,
  listProviders,
  loadProvider,
  registerProvider,
} from "../lib/cameras/registry";
import {
  adapter as digitrafficAdapter,
  provider as digitrafficProvider,
} from "../lib/cameras/providers/digitraffic";

registerProvider(digitrafficProvider, digitrafficAdapter);

export default function CameraLibrary() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [analysableOnly, setAnalysableOnly] = useState(true);

  // The registry is a module-level store, so React cannot see it change.
  // Hold the discovered set in state and let the registry do what it is for —
  // normalising provider formats — rather than driving render from a global.
  const [discovered, setDiscovered] = useState([]);

  const providers = listProviders();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await loadProvider(digitrafficProvider.id, { limit: 400 });
      setDiscovered(listCameras({}));
      setLoaded(true);
    } catch (caught) {
      setError(caught?.message ?? String(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cameras = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return discovered.filter((camera) => {
      if (analysableOnly && !camera.analysable) {
        return false;
      }

      if (!needle) {
        return true;
      }

      return (
        camera.name.toLowerCase().includes(needle) ||
        (camera.roadName ?? "").toLowerCase().includes(needle) ||
        (camera.region ?? "").toLowerCase().includes(needle)
      );
    });
  }, [discovered, query, analysableOnly]);

  const stats = useMemo(
    () => ({
      providers: providers.length,
      cameras: discovered.length,
      analysable: discovered.filter((camera) => camera.analysable).length,
    }),
    [discovered, providers.length],
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-[1600px]"
    >
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600">
            Authorised sources
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">
            Camera Library
          </h1>

          <p className="mt-1.5 text-xs text-slate-600">
            Cameras published by transport authorities under open licence, and
            connectable to the analytics engine.
          </p>
        </div>

        <div className="flex gap-5 text-right">
          <Stat label="Providers" value={stats.providers} />
          <Stat label="Cameras" value={stats.cameras} />
          <Stat label="Analysable" value={stats.analysable} />
        </div>
      </div>

      {/* Provider provenance — licence and attribution stay visible */}
      <div className="mb-4 space-y-2">
        {providers.map((entry) => (
          <div
            key={entry.id}
            className="flex items-start gap-3 rounded-xl border border-slate-800/70 bg-[#171a1f] p-4"
          >
            <Globe size={14} className="mt-0.5 shrink-0 text-slate-500" />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-200">{entry.name}</span>

                <span className="text-[10px] text-slate-600">
                  {entry.country}
                </span>

                <span className="rounded-full border border-emerald-900/50 bg-emerald-950/20 px-2 py-0.5 text-[9px] tracking-wide text-emerald-400/80">
                  {entry.licence}
                </span>

                {!entry.apiKeyRequired && (
                  <span className="rounded-full border border-slate-800 px-2 py-0.5 text-[9px] text-slate-500">
                    No API key
                  </span>
                )}

                {entry.cors && (
                  <span className="rounded-full border border-slate-800 px-2 py-0.5 text-[9px] text-slate-500">
                    CORS verified
                  </span>
                )}
              </div>

              <p className="mt-1 text-[11px] text-slate-500">
                {entry.organisation}
              </p>

              <p className="mt-1 text-[10px] leading-4 text-slate-600">
                {entry.attribution}
              </p>

              {entry.notes && (
                <p className="mt-1 text-[10px] leading-4 text-slate-600">
                  {entry.notes}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by road, place or camera name…"
          className="min-w-0 flex-1 rounded-lg border border-slate-800/70 bg-[#14171b] px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-700 focus:border-slate-600"
        />

        <button
          onClick={() => setAnalysableOnly((value) => !value)}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] transition ${
            analysableOnly
              ? "border-slate-700/70 bg-slate-800/50 text-slate-200"
              : "border-slate-800/70 text-slate-600 hover:text-slate-400"
          }`}
        >
          <ScanEye size={12} />
          Analysable only
        </button>

        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-800/50 px-3 py-2 text-[11px] text-slate-200 transition hover:bg-slate-700/50 disabled:opacity-40"
        >
          {loading && <Loader2 size={11} className="animate-spin" />}
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-900/50 bg-red-950/20 p-4">
          <p className="text-xs text-red-300">
            Could not reach the provider directory.
          </p>

          <p className="mt-1 text-[10px] text-slate-500">{error}</p>
        </div>
      )}

      {loading && !loaded && (
        <div className="rounded-xl border border-slate-800/70 bg-[#171a1f] p-8 text-center">
          <Loader2 size={18} className="mx-auto animate-spin text-slate-600" />

          <p className="mt-3 text-xs text-slate-500">
            Reading the provider's camera directory…
          </p>
        </div>
      )}

      {loaded && cameras.length === 0 && (
        <div className="rounded-xl border border-slate-800/70 bg-[#171a1f] p-8 text-center">
          <p className="text-xs text-slate-500">
            No camera matches that search.
          </p>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {cameras.slice(0, 60).map((camera) => (
          <CameraCard
            key={camera.id}
            camera={camera}
            onConnect={() =>
              navigate("/surveillance", { state: { camera } })
            }
          />
        ))}
      </div>

      {cameras.length > 60 && (
        <p className="mt-4 text-center text-[10px] text-slate-600">
          Showing 60 of {cameras.length}. Narrow the search to see others.
        </p>
      )}
    </motion.div>
  );
}

function CameraCard({ camera, onConnect }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800/70 bg-[#171a1f]">
      <div className="relative aspect-video bg-black">
        {failed ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-[10px] text-slate-700">No image</p>
          </div>
        ) : (
          <img
            src={camera.accessUrl}
            alt={camera.name}
            loading="lazy"
            crossOrigin="anonymous"
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
          />
        )}

        {camera.analysable && (
          <span className="absolute right-2 top-2 rounded bg-emerald-950/80 px-1.5 py-0.5 text-[8px] tracking-wider text-emerald-300">
            ANALYSABLE
          </span>
        )}
      </div>

      <div className="p-3">
        <p className="truncate text-[11px] text-slate-300">{camera.name}</p>

        <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-600">
          {camera.roadName && <span>{camera.roadName}</span>}

          {camera.location && (
            <span className="flex items-center gap-1">
              <MapPin size={9} />
              {camera.location.lat.toFixed(2)}, {camera.location.lon.toFixed(2)}
            </span>
          )}
        </div>

        <button
          onClick={onConnect}
          className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-700/70 bg-slate-800/50 px-2 py-1.5 text-[10px] text-slate-200 transition hover:bg-slate-700/50"
        >
          <Video size={10} />
          Connect to engine
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-600">
        {label}
      </p>

      <p className="mt-0.5 text-lg font-semibold text-slate-200">{value}</p>
    </div>
  );
}
