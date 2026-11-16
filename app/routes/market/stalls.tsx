import { Form, Link } from "react-router";
import type { Route } from "./+types/stalls";
import { categoryColour, PRICE_BANDS, priceBandLabel } from "~/lib/constants";
import { listStalls } from "~/lib/data.server";
import { requireMarket } from "~/lib/http.server";

export async function loader({ params, request }: Route.LoaderArgs) {
  const market = await requireMarket(params.slug);
  // The filters live in the address, so a filtered list can be shared or bookmarked.
  const search = new URL(request.url).searchParams;
  const filters = {
    q: search.get("q")?.trim() ?? "",
    category: search.get("category") ?? "",
    priceBand: search.get("price") ?? "",
  };
  return { market, filters, stalls: await listStalls(market.id, filters) };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `Stalls at ${loaderData?.market.name ?? "the market"}` }];
}

export default function Stalls({ loaderData }: Route.ComponentProps) {
  const { market, filters, stalls } = loaderData;
  const base = `/markets/${market.slug}`;
  const filtered = Boolean(filters.q || filters.category || filters.priceBand);

  return (
    <div className="mx-auto max-w-6xl px-5 pt-8">
      <h1 className="text-[2.125rem] sm:text-5xl">Stalls</h1>
      <p className="mt-2 max-w-prose text-secondary">
        Every trader confirmed so far. Looking for a present? Filter by what they sell and how
        much you want to spend.
      </p>

      <Form
        method="get"
        className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-end"
      >
        <div>
          <label htmlFor="q" className="sr-only">
            Search
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="Search: candles, bratwurst, scarves"
            className="input"
          />
        </div>
        <div>
          <label htmlFor="category" className="sr-only">
            Category
          </label>
          <select id="category" name="category" defaultValue={filters.category} className="input">
            <option value="">All categories</option>
            {market.categories.map((category) => (
              <option key={category.name}>{category.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="price" className="sr-only">
            Typical price
          </label>
          <select id="price" name="price" defaultValue={filters.priceBand} className="input">
            <option value="">Any price</option>
            {PRICE_BANDS.map((band) => (
              <option key={band.key} value={band.key}>
                {band.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="btn btn-brand min-h-[46px]!"
          data-umami-event="Stalls: filter"
        >
          Show stalls
        </button>
      </Form>

      <p className="mt-6 px-1 text-[0.9375rem] text-secondary" role="status">
        {stalls.length === 1 ? "1 stall" : `${stalls.length} stalls`}
        {filtered ? " match your filters. " : ". "}
        {filtered ? <Link to={`${base}/stalls`}>Clear filters</Link> : null}
      </p>

      {stalls.length === 0 ? (
        <div className="panel mt-3 max-w-prose">
          <h2 className="text-xl">
            {filtered ? "No stalls match those filters" : "Traders are still being confirmed"}
          </h2>
          <p className="mt-2 text-secondary">
            {filtered
              ? "Try a different category or price, or clear the filters to see everyone."
              : "Check back soon. If you run a stall yourself, you can apply for a pitch."}
          </p>
        </div>
      ) : (
        <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stalls.map((stall) => (
            <li key={stall.id} className="flex flex-col overflow-hidden rounded-[20px] bg-white">
              <div className="flex-1 p-5">
                <p className="flex items-center gap-2 text-[0.8125rem] font-semibold text-secondary">
                  <span
                    aria-hidden="true"
                    className="size-2.5 rounded-full"
                    style={{ background: categoryColour(market.categories, stall.category) }}
                  />
                  {stall.category}, {priceBandLabel(stall.priceBand).toLowerCase()}
                </p>
                <h2 className="mt-1.5 text-[1.375rem]">{stall.businessName}</h2>
                <p className="mt-2 text-[0.9375rem]">{stall.description}</p>
              </div>
              <p className="flex flex-wrap justify-between gap-3 border-t-[0.5px] border-line px-5 py-3 text-[0.9375rem]">
                {stall.pitchCode ? (
                  <Link
                    to={`${base}/map?pitch=${stall.pitchCode}`}
                    className="font-semibold"
                    data-umami-event="Stalls: find on map"
                  >
                    Pitch {stall.pitchCode} on the map
                  </Link>
                ) : (
                  <span className="text-secondary">Pitch to be confirmed</span>
                )}
                {stall.website ? (
                  <a href={stall.website} rel="noopener noreferrer nofollow">
                    Website
                  </a>
                ) : null}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
