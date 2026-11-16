import { Link } from "react-router";
import type { Route } from "./+types/map";
import { MapLegend, PitchMap } from "~/components/PitchMap";
import { listPitches } from "~/lib/data.server";
import { applicationWindow } from "~/lib/format";
import { requireMarket } from "~/lib/http.server";

export async function loader({ params, request }: Route.LoaderArgs) {
  const market = await requireMarket(params.slug);
  const pitches = await listPitches(market.id);
  const wanted = new URL(request.url).searchParams.get("pitch")?.toUpperCase() ?? null;
  return {
    market,
    pitches,
    selected: pitches.find((pitch) => pitch.code.toUpperCase() === wanted) ?? null,
    applyWindow: applicationWindow(market),
  };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `Map of ${loaderData?.market.name ?? "the market"}` }];
}

export default function MarketMap({ loaderData }: Route.ComponentProps) {
  const { market, pitches, selected, applyWindow } = loaderData;
  const base = `/markets/${market.slug}`;
  const stallType = selected
    ? market.stallTypes.find((type) => type.key === selected.stallType)
    : undefined;

  return (
    <div className="mx-auto max-w-6xl px-5 pt-8">
      <h1 className="text-[2.125rem] sm:text-5xl">Market map</h1>
      <p className="mt-2 max-w-prose text-secondary">
        Choose a pitch to see who trades there. Pitches with a dashed outline are still available.
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[2fr_1fr]">
        <div>
          <PitchMap
            market={market}
            pitches={pitches}
            selectedCode={selected?.code ?? null}
            hrefFor={(pitch) => `${base}/map?pitch=${pitch.code}`}
          />
          <div className="mt-4 px-1">
            <MapLegend market={market} />
          </div>
        </div>

        <aside aria-live="polite" className="panel h-fit">
          {selected ? (
            <>
              <h2 className="text-[1.75rem]">Pitch {selected.code}</h2>
              <p className="mt-1 text-secondary">
                {selected.zone}
                {stallType ? `, ${stallType.label.toLowerCase()}` : ""}
                {selected.hasPower ? ", with power" : ""}
              </p>
              {selected.occupant ? (
                <>
                  <p className="mt-4 text-xl font-semibold">{selected.occupant.businessName}</p>
                  <p className="text-secondary">{selected.occupant.category}</p>
                  <p className="mt-2">{selected.occupant.description}</p>
                </>
              ) : selected.taken ? (
                <p className="mt-4">This pitch has been allocated. The trader will be announced soon.</p>
              ) : (
                <>
                  <p className="mt-4">This pitch is available.</p>
                  {applyWindow === "open" ? (
                    <Link
                      to={`${base}/apply`}
                      className="btn btn-brand mt-4 w-full"
                      data-umami-event="Map: apply"
                    >
                      Apply for a pitch
                    </Link>
                  ) : null}
                </>
              )}
            </>
          ) : (
            <>
              <h2 className="text-xl">No pitch selected</h2>
              <p className="mt-2 text-secondary">
                Choose any pitch on the map. With a keyboard, press Tab to move between pitches and
                Enter to select one.
              </p>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
