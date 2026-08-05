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
  // links and search results working. (Now handled in the redirects() block
  // below, which also carries the incident override.)
  //
  // ── INCIDENT OVERRIDE 2026-08-04 ────────────────────────────────────────
  // The click-tracker on nazaara-sms is NOT serving: both /r/<token> and
  // /api/r/<token> fall through to that app's SPA catch-all and render its
  // admin login page instead of redirecting. Every short link in the live
  // Calgary blast was therefore landing customers on a sign-in screen.
  //
  // This sends every /r/<token> straight to the Calgary ticket page so the
  // links already sitting in people's phones work right now. Click attribution
  // is sacrificed for the duration — a working link beats a tracked dead one.
  //
  // TO REVERT once the nazaara-sms function is fixed: delete this redirects()
  // entry for '/r/:token' and re-enable the rewrite block below it. Do NOT
  // leave this in place for a future campaign — it hard-codes one event URL
  // and would misroute every later blast.
  async redirects() {
    return [
      {
        source: '/dj-roster',
        destination: '/bookings',
        permanent: true,
      },
      {
        source: '/r/:token',
        destination: 'https://www.showpass.com/tamasha-calgary-3/',
        permanent: false, // 307 — must stay temporary so it can be undone
      },
    ];
  },
};

export default nextConfig;
