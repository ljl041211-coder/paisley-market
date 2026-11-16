import { Link } from "react-router";
import type { Route } from "./+types/markets";
import { PLATFORM_NAME } from "~/lib/constants";
import { listMarkets } from "~/lib/data.server";
import { applicationWindow, formatDate, formatDateRange } from "~/lib/format";
import { themeStyle } from "~/lib/theme";

export async function loader() {
  const markets = await listMarkets();
  return {
    markets: markets.map((market) => ({ ...market, applyWindow: applicationWindow(market) })),
  };
}

export function meta() {
  return [{ title: `Markets on ${PLATFORM_NAME}` }];
}

export default function Markets({ loaderData }: Route.ComponentProps) {
  const { markets } = loaderData;
  return (
    <>
      <h1 className="text-[2.125rem] sm:text-5xl">Markets</h1>
      <p className="mt-2 max-w-prose text-secondary">
        Choose a market to see its dates, stalls and pitch applications.
      </p>

      {markets.length === 0 ? (
        <div className="panel mt-8 max-w-prose">
          <h2 className="text-xl">No markets yet</h2>
          <p className="mt-2">
            An organiser can <Link to="/admin">sign in</Link> and add the first one.
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-5 md:grid-cols-2">
          {markets.map((market) => (
            <li
              key={market.id}
              style={themeStyle(market.theme)}
              className="overflow-hidden rounded-[24px] bg-white"
            >
              <div
                className="bg-ground px-6 pb-6 pt-7 text-on-ground"
                style={{
                  backgroundImage:
                    "radial-gradient(90% 140% at 100% 0%, color-mix(in srgb, var(--accent) 26%, transparent), transparent 62%)",
                }}
              >
                <p className="text-[0.9375rem] font-semibold text-accent">
                  {formatDateRange(market.startDate, market.endDate)}
                </p>
                <h2 className="mt-1 text-[1.75rem]">
                  <Link to={`/markets/${market.slug}`} className="text-inherit">
                    {market.name}
                  </Link>
                </h2>
                <p className="mt-1 opacity-85">{market.venue}</p>
              </div>
              <div className="px-6 pb-5 pt-4">
                <p>{market.tagline}</p>
                <p className="mt-2 text-[0.9375rem] text-secondary">
                  {market.applyWindow === "open"
                    ? `Trader applications open until ${formatDate(market.applicationsClose)}`
                    : market.applyWindow === "closed"
                      ? "Trader applications have closed"
                      : `Trader applications open on ${formatDate(market.applicationsOpen)}`}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
