import { Outlet } from "react-router";
import type { Route } from "./+types/layout";
import { MarketHeader, SiteFooter } from "~/components/chrome";
import { requireMarket } from "~/lib/http.server";
import { themeStyle } from "~/lib/theme";

export async function loader({ params }: Route.LoaderArgs) {
  return { market: await requireMarket(params.slug) };
}

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: "Market not found" }];
  return [
    { title: loaderData.market.name },
    { name: "description", content: loaderData.market.tagline },
  ];
}

export default function MarketLayout({ loaderData }: Route.ComponentProps) {
  const { market } = loaderData;
  return (
    <div style={themeStyle(market.theme)}>
      <MarketHeader market={market} />
      <main id="main">
        {market.announcement ? (
          <div className="mx-auto max-w-6xl px-4 pt-4">
            <p role="status" className="rounded-2xl bg-accent px-5 py-3 font-semibold text-on-accent">
              {market.announcement}
            </p>
          </div>
        ) : null}
        <Outlet />
      </main>
      <SiteFooter market={market} />
    </div>
  );
}
