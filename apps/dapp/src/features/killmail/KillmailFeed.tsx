import { SectionCard } from "../../components/SectionCard";
import { useKillmailEvents } from "../../hooks/useKillmailEvents";

export function KillmailFeed() {
  const { data, error, isLoading } = useKillmailEvents();

  return (
    <SectionCard eyebrow="Killmail Feed" title="GraphQL event source">
      {isLoading ? <p className="text-sm text-slate-400">Loading recent killmail events...</p> : null}
      {error ? (
        <p className="text-sm text-orange-300">
          Failed to load killmail events: {error instanceof Error ? error.message : "Unknown error"}
        </p>
      ) : null}
      {!isLoading && !error && data?.nodes.length === 0 ? (
        <p className="text-sm text-slate-400">No killmail events found for the current package filter yet.</p>
      ) : null}
      <div className="space-y-4">
        {data?.nodes.map((event) => (
          <article className="rounded-2xl border border-slate-800 bg-black/30 p-4" key={event.digest ?? event.timestamp}>
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
              <span>{event.lossType ?? event.eventType}</span>
              <span>{event.timestamp ?? "No timestamp"}</span>
            </div>
            <dl className="mt-3 grid gap-3 text-xs text-slate-300 sm:grid-cols-2">
              <div>
                <dt className="uppercase tracking-[0.18em] text-slate-500">Digest</dt>
                <dd className="mt-1 break-all text-slate-300">{event.digest ?? "Unavailable"}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-[0.18em] text-slate-500">Killmail ID</dt>
                <dd className="mt-1 text-white">{event.killmailItemId ?? "Unavailable"}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-[0.18em] text-slate-500">Killer Character</dt>
                <dd className="mt-1 text-white">{event.killerId?.itemId ?? "Unavailable"}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-[0.18em] text-slate-500">Victim Character</dt>
                <dd className="mt-1 text-white">{event.victimId?.itemId ?? "Unavailable"}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-[0.18em] text-slate-500">Solar System</dt>
                <dd className="mt-1 text-white">{event.solarSystemId?.itemId ?? "Unavailable"}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-[0.18em] text-slate-500">Kill Timestamp</dt>
                <dd className="mt-1 text-white">{event.killTimestamp ?? "Unavailable"}</dd>
              </div>
            </dl>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-black/50 p-3 text-xs leading-6 text-slate-300">
              {JSON.stringify(event.contentsJson, null, 2)}
            </pre>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}
