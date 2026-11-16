import { data, Link } from "react-router";
import type { Route } from "./+types/market-edit";
import { MarketForm } from "~/components/MarketForm";
import { updateMarket } from "~/lib/data.server";
import { requireMarket } from "~/lib/http.server";
import { requireAdmin } from "~/lib/session.server";
import { parseMarketForm } from "~/lib/validation";

export async function loader({ params, request }: Route.LoaderArgs) {
  await requireAdmin(request);
  return { market: await requireMarket(params.slug) };
}

export async function action({ params, request }: Route.ActionArgs) {
  await requireAdmin(request);
  const market = await requireMarket(params.slug);
  const result = parseMarketForm(await request.formData());
  if (!result.ok) {
    return data({ saved: false, errors: result.errors, values: result.values }, { status: 400 });
  }
  await updateMarket(market.slug, result.data);
  return { saved: true, errors: undefined, values: undefined };
}

export default function MarketEdit({ loaderData, actionData }: Route.ComponentProps) {
  const { market } = loaderData;
  return (
    <>
      <p>
        <Link to={`/admin?market=${market.slug}`}>Back to {market.name}</Link>
      </p>
      <h1 className="mt-3 text-[2.125rem]">Edit market details</h1>
      {actionData?.saved ? (
        <p role="status" className="notice mt-6 max-w-2xl">
          Changes saved. <Link to={`/markets/${market.slug}`}>View the public pages</Link>
        </p>
      ) : null}
      <MarketForm
        market={market}
        errors={actionData?.errors}
        values={actionData?.values}
        submitLabel="Save changes"
      />
    </>
  );
}
