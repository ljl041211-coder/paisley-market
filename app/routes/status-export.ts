import { data, redirect } from "react-router";
import type { Route } from "./+types/status-export";
import { findTraderApplication } from "~/lib/data.server";

/**
 * Right of access and data portability (GDPR Art. 15 and 20): gives a trader
 * a copy of everything held about them as a JSON file. This route has no
 * page, only an action, so the browser treats the answer as a download.
 */
export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const application = await findTraderApplication(
    String(form.get("reference") ?? ""),
    String(form.get("email") ?? ""),
  );
  if (!application) throw data("We could not find that application.", { status: 404 });

  // Internal ids and the team's private notes are not the trader's data.
  const { id, marketId, pitchId, adminNotes, ...personal } = application;
  const body = JSON.stringify({ exportedAt: new Date(), application: personal }, null, 2);

  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="application-${application.reference}.json"`,
      "Cache-Control": "no-store",
    },
  });
}

export function loader() {
  return redirect("/status");
}
