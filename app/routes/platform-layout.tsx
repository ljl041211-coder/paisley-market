import { Outlet } from "react-router";
import { PlatformHeader, SiteFooter } from "~/components/chrome";

export default function PlatformLayout() {
  return (
    <>
      <PlatformHeader />
      <main id="main" className="mx-auto max-w-6xl px-5 pt-8">
        <Outlet />
      </main>
      <SiteFooter />
    </>
  );
}
