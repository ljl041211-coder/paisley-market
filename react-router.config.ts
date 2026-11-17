import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,

  // React Router refuses form submissions whose Origin header does not match
  // the request URL (protection against cross-site request forgery). On
  // Render, HTTPS ends at Render's proxy and the app receives plain HTTP, so
  // the browser's "https://" origin never matches the app's "http://" URL.
  // Listing the site's own host here allows its forms again; submissions from
  // any other site are still refused.
  allowedActionOrigins: ["paisley-market.onrender.com"],
} satisfies Config;
