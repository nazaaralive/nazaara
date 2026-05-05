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
  // Branded SMS click-tracker — /r/<token> on nazaara.live proxies through to
  // the redirect endpoint on the nazaara-sms app, which records the click in
  // its DB and 302-redirects to the destination URL. We use rewrites (not
  // redirects) so the user-visible URL stays nazaara.live in the SMS body.
  async rewrites() {
    return [
      {
        source: '/r/:token',
        destination: 'https://nazaara-sms.vercel.app/r/:token',
      },
    ];
  },
};

export default nextConfig;
