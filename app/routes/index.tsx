import { redirect } from "react-router";
import { getFeaturedMarket } from "~/lib/data.server";

export async function loader() {
  const market = await getFeaturedMarket();
  return redirect(market ? `/markets/${market.slug}` : "/markets");
}
