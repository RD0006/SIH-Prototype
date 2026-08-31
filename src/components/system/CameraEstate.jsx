import { useMemo } from "react";

const TYPE_LABEL = {
  bop: "Border Out Post",
  road: "Border Road",
  checkpost: "Check Post",
};

const STATUS_STYLE = {
  online: {
    dot: "bg-emerald-400/80",
    text: "text-emerald-300/90",
    label: "Online",
  },
  degraded: {
    dot: "bg-amber-400/80",
    text: "text-amber-300/90",
    label: "Degraded",
  },
  offline: {
    dot: "bg-slate-700",
    text: "text-slate-500",
    label: "Offline",
  },
};

/**
 * The estate, listed model by model.
 *
 * The procurement argument is made by the `model` and `installed` columns
 * rather than by an assertion: these are ordinary fixed bullet cameras, the
 * oldest of them years into service, and not one of them is replaced.
 */
export default function CameraEstate({ cameras }) {
  const summary = useMemo(() => {
    const years = cameras.map((camera) => camera.installed);
    const models = new Set(cameras.map((camera) => camera.model));

    return {
      oldest: Math.min(...years),
      newest: Math.max(...years),
      models: models.size,
    };
  }, [cameras]);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800/70 bg-[#171a1f]">
      <div className="border-b border-slate-800/60 px-5 py-4">
        <h3 className="text-sm font-medium text-slate-200">Camera estate</h3>

        <p className="mt-1 text-[11px] text-slate-600">
          {cameras.length} cameras · {summary.models} distinct models ·
          installed {summary.oldest}–{summary.newest}
        </p>
      </div>

      {/* Nine columns will not fit a narrow window; scroll the table, not the page. */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[64rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-800/60">
              {[
                "ID",
                "Camera",
                "Type",
                "Model",
                "Capabilities",
                "Resolution",
                "FPS",
                "Installed",
                "Status",
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-4 py-2.5 text-[9px] font-normal uppercase tracking-[0.16em] text-slate-600"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {cameras.map((camera) => {
              const status = STATUS_STYLE[camera.status] ?? STATUS_STYLE.offline;

              const reason =
                camera.status === "offline"
                  ? camera.offlineReason
                  : camera.status === "degraded"
                    ? camera.degradedReason
                    : null;

              return (
                <tr
                  key={camera.id}
                  className="border-b border-slate-800/40 align-top last:border-b-0"
                >
                  <td className="px-4 py-3 text-[11px] text-slate-400">
                    {camera.id}
                  </td>

                  <td className="px-4 py-3">
                    <p className="text-[11px] text-slate-300">{camera.name}</p>

                    {reason && (
                      <p className="mt-1 text-[10px] leading-4 text-slate-600">
                        {reason}
                        {camera.offlineSince && ` · since ${camera.offlineSince}`}
                      </p>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-[11px] text-slate-500">
                    {TYPE_LABEL[camera.type] ?? camera.type}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-[11px] text-slate-300">
                    {camera.model}
                  </td>

                  <td className="px-4 py-3 text-[10px] leading-4 text-slate-600">
                    {camera.capabilities}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-[11px] text-slate-500">
                    {camera.resolution}
                  </td>

                  <td className="px-4 py-3 text-[11px] text-slate-500">
                    {camera.fps}
                  </td>

                  <td className="px-4 py-3 text-[11px] text-slate-500">
                    {camera.installed}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="flex items-center gap-2">
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${status.dot}`}
                      />

                      <span className={`text-[11px] ${status.text}`}>
                        {status.label}
                      </span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-800/60 bg-[#14171b] px-5 py-4">
        <p className="text-[11px] leading-5 text-slate-500">
          Every model listed above is a commodity fixed bullet camera with no
          on-board analytics, the oldest in service since {summary.oldest} and
          the newest since {summary.newest}. None of them is replaced, re-cabled
          or re-mounted. Detection, tracking, virtual-fence intrusion,
          night-movement analytics and number-plate recognition are all applied
          in software to the stream each camera already produces, so an offline
          or degraded feed is a link fault, never a capability gap.
        </p>
      </div>
    </div>
  );
}
