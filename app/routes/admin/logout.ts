import { redirect } from "react-router";
import type { Route } from "./+types/logout";
import { destroyAdminSession } from "~/lib/session.server";

// Signing out is a POST so that a link on another site cannot trigger it.
export async function action({ request }: Route.ActionArgs) {
  return destroyAdminSession(request);
}

export function loader() {
  return redirect("/admin");
}
