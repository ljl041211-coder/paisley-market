import { Form, Link, Outlet } from "react-router";
import type { Route } from "./+types/layout";
import { PLATFORM_NAME } from "~/lib/constants";
import { requireAdmin } from "~/lib/session.server";

export async function loader({ request }: Route.LoaderArgs) {
  return { admin: await requireAdmin(request) };
}

export function meta() {
  return [{ title: `Organiser area, ${PLATFORM_NAME}` }];
}

export default function AdminLayout({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <header className="bar sticky top-0 z-30 border-b border-black/10">
        <div className="mx-auto flex min-h-13 max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-1 px-5 py-2">
          <Link to="/admin" className="font-semibold text-ink hover:no-underline">
            {PLATFORM_NAME} organiser area
          </Link>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[0.9375rem]">
            <span className="text-secondary">Signed in as {loaderData.admin.name}</span>
            <Link to="/markets">Public site</Link>
            <Form method="post" action="/admin/logout">
              <button type="submit" className="cursor-pointer font-semibold text-tint hover:underline">
                Sign out
              </button>
            </Form>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-5 pb-16 pt-8">
        <Outlet />
      </main>
    </>
  );
}
