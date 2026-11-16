import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import { loadEnv } from "./lib/env.server";

// Apple devices use their own system typeface. Inter is the fallback for
// other devices, and it is served from this site so visitors' IP addresses
// are not shared with a font provider.
import "@fontsource-variable/inter";
import "./app.css";

export function loader() {
  loadEnv();
  const websiteId = process.env.UMAMI_WEBSITE_ID;
  return {
    // Cookieless analytics (Umami). Left out entirely unless it is configured.
    umami: websiteId
      ? {
          websiteId,
          scriptUrl: process.env.UMAMI_SCRIPT_URL || "https://cloud.umami.is/script.js",
        }
      : null,
  };
}

export function meta() {
  return [{ title: "Marktplatz" }];
}

export function Layout({ children }: { children: React.ReactNode }) {
  const rootData = useRouteLoaderData<typeof loader>("root");
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#f2f2f7" />
        <Meta />
        <Links />
        {rootData?.umami ? (
          <script
            defer
            src={rootData.umami.scriptUrl}
            data-website-id={rootData.umami.websiteId}
            data-do-not-track="true"
          />
        ) : null}
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let heading = "Something went wrong";
  let details = "Please try again in a moment.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      heading = "Page not found";
      details =
        typeof error.data === "string" && error.data
          ? error.data
          : "Check the address, or go back to the list of markets.";
    } else {
      details = typeof error.data === "string" && error.data ? error.data : details;
    }
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-20">
      <h1 className="text-[2.125rem]">{heading}</h1>
      <p className="mt-3 text-secondary">{details}</p>
      <p className="mt-6">
        <Link to="/markets" className="btn btn-brand">
          See all markets
        </Link>
      </p>
      {stack ? (
        <pre className="mt-8 overflow-x-auto rounded-2xl bg-white p-4 text-sm">
          <code>{stack}</code>
        </pre>
      ) : null}
    </main>
  );
}
