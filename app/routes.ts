import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),

  layout("routes/platform-layout.tsx", [
    route("markets", "routes/markets.tsx"),
    route("status", "routes/status.tsx"),
    route("privacy", "routes/privacy.tsx"),
  ]),
  route("status/export", "routes/status-export.ts"),

  route("markets/:slug", "routes/market/layout.tsx", [
    index("routes/market/home.tsx"),
    route("stalls", "routes/market/stalls.tsx"),
    route("map", "routes/market/map.tsx"),
    route("apply", "routes/market/apply.tsx"),
    route("apply/success/:reference", "routes/market/apply-success.tsx"),
  ]),

  // Organiser area. Every loader and action here checks the session.
  route("admin/login", "routes/admin/login.tsx"),
  route("admin/logout", "routes/admin/logout.ts"),
  route("admin", "routes/admin/layout.tsx", [
    index("routes/admin/dashboard.tsx"),
    route("applications/:id", "routes/admin/application.tsx"),
    route("markets/new", "routes/admin/market-new.tsx"),
    route("markets/:slug/edit", "routes/admin/market-edit.tsx"),
  ]),

  route("healthz", "routes/healthz.ts"),
] satisfies RouteConfig;
