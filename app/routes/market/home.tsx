import { Link } from "react-router";
import type { Route } from "./+types/home";
import { ChevronIcon } from "~/components/icons";
import { categoryColour } from "~/lib/constants";
import { listPitches, listStalls } from "~/lib/data.server";
import { applicationWindow, formatDate, formatDateRange, formatPrice } from "~/lib/format";
import { requireMarket } from "~/lib/http.server";

export async function loader({ params }: Route.LoaderArgs) {
  const market = await requireMarket(params.slug);
  const [pitches, stalls] = await Promise.all([
    listPitches(market.id),
    listStalls(market.id, {}),
  ]);
  return {
    market,
    pitches: pitches.map((p) => ({ code: p.code, taken: p.taken })),
    stallCounts: market.categories.map((category) => ({
      name: category.name,
      count: stalls.filter((stall) => stall.category === category.name).length,
    })),
    applyWindow: applicationWindow(market),
  };
}

export default function MarketHome({ loaderData }: Route.ComponentProps) {
  const { market, pitches, stallCounts, applyWindow } = loaderData;
  const base = `/markets/${market.slug}`;
  const taken = pitches.filter((p) => p.taken).length;
  const free = pitches.length - taken;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-4">
      <section
        className="relative overflow-hidden rounded-[28px] bg-ground px-6 py-9 text-on-ground sm:px-12 sm:py-14"
        style={{
          backgroundImage:
            "radial-gradient(90% 120% at 100% 0%, color-mix(in srgb, var(--accent) 26%, transparent), transparent 62%)",
        }}
      >
        <p className="font-semibold text-accent">
          {formatDateRange(market.startDate, market.endDate)}, {market.venue}
        </p>
        <h1 className="mt-2 max-w-3xl text-[2.5rem] sm:text-6xl">{market.name}</h1>
        <p className="mt-4 max-w-2xl text-xl opacity-85">{market.tagline}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to={`${base}/stalls`} className="btn btn-accent" data-umami-event="Hero: stalls">
            See who is trading
          </Link>
          <Link to={`${base}/apply`} className="btn btn-glass" data-umami-event="Hero: apply">
            Apply for a pitch
          </Link>
        </div>

        <div className="mt-10 border-t border-on-ground/20 pt-6">
          <ul aria-hidden="true" className="flex flex-wrap gap-1.5">
            {pitches.map((pitch) => (
              <li
                key={pitch.code}
                className={`size-4 rounded-full ${pitch.taken ? "bg-accent" : "bg-on-ground/25"}`}
              />
            ))}
          </ul>
          <p className="mt-3">
            {taken} of {pitches.length} pitches are allocated.{" "}
            {free > 0 && applyWindow === "open" ? (
              <>
                {free} still open to traders until {formatDate(market.applicationsClose)}.{" "}
              </>
            ) : null}
            <Link to={`${base}/map`} className="font-semibold text-inherit underline">
              Open the market map
            </Link>
          </p>
        </div>
      </section>

      <div className="mt-12 space-y-12 px-1">
        <section className="grid gap-8 md:grid-cols-[3fr_2fr]">
          <div>
            <h2 className="text-[1.75rem]">About the market</h2>
            <div className="mt-3 max-w-prose space-y-4">
              {market.description.split(/\n+/).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
          <dl className="group-list h-fit">
            <div className="px-5 py-3.5">
              <dt className="text-[0.8125rem] text-secondary">When</dt>
              <dd>{formatDateRange(market.startDate, market.endDate)}</dd>
            </div>
            <div className="px-5 py-3.5">
              <dt className="text-[0.8125rem] text-secondary">Opening hours</dt>
              <dd>{market.openingHours}</dd>
            </div>
            <div className="px-5 py-3.5">
              <dt className="text-[0.8125rem] text-secondary">Where</dt>
              <dd>
                {market.venue}
                {market.address ? `, ${market.address}` : ""}
              </dd>
            </div>
          </dl>
        </section>

        <div className="grid gap-12 md:grid-cols-2 md:gap-8">
          <section>
            <h2 className="text-[1.75rem]">What you will find</h2>
            <ul className="group-list mt-4">
              {stallCounts.map((category) => (
                <li key={category.name}>
                  <Link
                    to={`${base}/stalls?category=${encodeURIComponent(category.name)}`}
                    className="group-row"
                  >
                    <span className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="size-3 rounded-full"
                        style={{ background: categoryColour(market.categories, category.name) }}
                      />
                      {category.name}
                    </span>
                    <span className="flex items-center gap-3 text-secondary">
                      {category.count === 0
                        ? "Announced soon"
                        : `${category.count} ${category.count === 1 ? "stall" : "stalls"}`}
                      <ChevronIcon />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section id="traders">
            <h2 className="text-[1.75rem]">Trade at the market</h2>
            <div className="group-list mt-4">
            <table className="block w-full text-left">
              <caption className="sr-only">Pitch types and prices</caption>
              <tbody className="block">
                {market.stallTypes.map((type) => (
                  <tr key={type.key} className="flex items-start justify-between gap-4 border-line px-5 py-3.5 not-first:border-t-[0.5px]">
                    <th scope="row" className="font-normal">
                      <span className="font-semibold">{type.label}</span>
                      <span className="block text-[0.9375rem] text-secondary">
                        {type.size}. {type.description}
                      </span>
                    </th>
                    <td className="whitespace-nowrap font-semibold">{formatPrice(type.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            <ol className="mt-5 space-y-2.5 px-1">
              {[
                "Fill in the online application.",
                "The market team reviews it. Follow progress at any time with your reference.",
                "If approved, you are given a numbered pitch on the market map.",
              ].map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-[0.8125rem] font-bold text-on-brand">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>

            <p className="mt-5 px-1 text-secondary">
              {applyWindow === "open" ? (
                <>Applications close on {formatDate(market.applicationsClose)}.</>
              ) : applyWindow === "not-open-yet" ? (
                <>Applications open on {formatDate(market.applicationsOpen)}.</>
              ) : (
                <>Applications closed on {formatDate(market.applicationsClose)}.</>
              )}
            </p>
            {applyWindow === "open" ? (
              <Link
                to={`${base}/apply`}
                className="btn btn-brand mt-4 w-full sm:w-auto"
                data-umami-event="Traders: apply"
              >
                Apply for a pitch
              </Link>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
