import type { ReactNode } from "react";
import { Link, NavLink } from "react-router";
import {
  ApplyIcon,
  HomeIcon,
  ListIcon,
  LockIcon,
  MapIcon,
  StallIcon,
  StatusIcon,
} from "~/components/icons";
import { PLATFORM_NAME } from "~/lib/constants";
import type { MarketDTO } from "~/lib/types";

interface NavItem {
  to: string;
  label: string;
  /** Shorter label for the tab bar on phones. */
  short: string;
  icon: ReactNode;
  /** Only active on exactly this address (used for Home). */
  end?: boolean;
  event?: string;
}

const barLink = ({ isActive }: { isActive: boolean }) =>
  `text-[0.9375rem] ${isActive ? "font-semibold text-ink" : "text-tint"}`;

const tabLink = ({ isActive }: { isActive: boolean }) =>
  `flex flex-col items-center gap-0.5 pb-1 pt-1.5 text-[0.625rem] font-medium hover:no-underline ${
    isActive ? "text-tint" : "text-secondary"
  }`;

function Navigation({ title, home, items }: { title: string; home: string; items: NavItem[] }) {
  return (
    <>
      <header className="bar sticky top-0 z-30 border-b border-black/10">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-2 focus:z-40 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2"
        >
          Skip to main content
        </a>
        <div className="mx-auto flex h-13 max-w-6xl items-center justify-between gap-6 px-5">
          <Link to={home} className="truncate font-semibold text-ink hover:no-underline">
            {title}
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
            {items
              .filter((item) => !item.end)
              .map((item) => (
                <NavLink key={item.to} to={item.to} className={barLink} data-umami-event={item.event}>
                  {item.label}
                </NavLink>
              ))}
          </nav>
        </div>
      </header>

      <nav
        aria-label="Tabs"
        className="bar fixed inset-x-0 bottom-0 z-30 border-t border-black/10 pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="mx-auto grid max-w-lg" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
          {items.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.end} className={tabLink} data-umami-event={item.event}>
                {item.icon}
                {item.short}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

export function MarketHeader({ market }: { market: MarketDTO }) {
  const base = `/markets/${market.slug}`;
  return (
    <Navigation
      title={market.name}
      home={base}
      items={[
        { to: base, label: "Home", short: "Home", icon: <HomeIcon />, end: true },
        { to: `${base}/stalls`, label: "Stalls", short: "Stalls", icon: <StallIcon /> },
        { to: `${base}/map`, label: "Market map", short: "Map", icon: <MapIcon /> },
        {
          to: `${base}/apply`,
          label: "Apply for a pitch",
          short: "Apply",
          icon: <ApplyIcon />,
          event: "Nav: apply",
        },
        { to: "/status", label: "Check an application", short: "Status", icon: <StatusIcon /> },
      ]}
    />
  );
}

export function PlatformHeader() {
  return (
    <Navigation
      title={PLATFORM_NAME}
      home="/markets"
      items={[
        { to: "/markets", label: "All markets", short: "Markets", icon: <ListIcon /> },
        { to: "/status", label: "Check an application", short: "Status", icon: <StatusIcon /> },
        { to: "/admin", label: "Organiser sign in", short: "Organiser", icon: <LockIcon /> },
      ]}
    />
  );
}

export function SiteFooter({ market }: { market?: MarketDTO }) {
  return (
    // Extra space at the bottom on phones so the tab bar never covers it.
    <footer className="mx-auto mt-16 max-w-6xl px-5 pb-28 text-[0.8125rem] text-secondary md:pb-10">
      <div className="flex flex-wrap justify-between gap-x-10 gap-y-4 border-t border-line pt-5">
        <p className="max-w-md">
          {market ? (
            <>
              {market.name}, {market.venue}
              {market.address ? `, ${market.address}` : ""}.{" "}
            </>
          ) : null}
          A student proof of concept for a fictional client. No real bookings are taken.
        </p>
        <ul className="flex flex-wrap gap-x-5 gap-y-1">
          <li>
            <Link to="/privacy">Privacy notice</Link>
          </li>
          <li>
            <Link to="/status">Check or delete your application</Link>
          </li>
          <li>
            <Link to="/markets">Other markets on {PLATFORM_NAME}</Link>
          </li>
          <li>
            <Link to="/admin">Organiser sign in</Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
