import { data } from "react-router";
import { getMarket } from "./data.server";

export async function requireMarket(slug: string | undefined) {
  const market = slug ? await getMarket(slug) : null;
  if (!market) throw data("We could not find that market.", { status: 404 });
  return market;
}
