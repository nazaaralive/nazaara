import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
        port: '',
        pathname: '/**',
      },
    ],
    // Optimised breakpoints – prevents generating 3840 px variants
    // that phones / tablets will never need
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // /dj-roster is merged into /bookings — permanent redirect keeps old
  // links and search results working.
  async redirects() {
    return [
      {
        source: '/dj-roster',
        destination: '/bookings',
        permanent: true,
      },
    ];
  },
  // Branded SMS click-tracker — /r/<token> on nazaara.live proxies through to
  // the redirect endpoint on the nazaara-sms app, which records the click and
  // 302s to the destination stored for that token. A rewrite (not a redirect)
  // keeps the user-visible URL on nazaara.live inside the SMS body.
  //
  // Points at /api/redirect?token= rather than /api/r/<token>: the dynamic
  // [token].js route is not built as a function on that project and returned
  // the SPA for every request, which on 2026-08-04 sent an entire live blast
  // to the SMS admin login page. The static-named endpoint resolves correctly.
  // See nazaara-sms/api/redirect.js for the full write-up.
  //
  // A blanket redirect to one event URL was used as a stopgap during that
  // incident. It is deliberately gone: every recipient gets a unique token, so
  // any hard-coded destination misroutes every other campaign — which is
  // exactly what happened to the Edmonton blast while it was in place.
  async rewrites() {
    return [
      {
        source: '/r/:token',
        destination: 'https://nazaara-sms.vercel.app/api/redirect?token=:token',
      },
    ];
  },
};

export default nextConfig;
