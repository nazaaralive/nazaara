import "./globals.css";
import localFont from "next/font/local";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { PostHogAnalytics } from "@/components/analytics/posthog-provider";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import { Toaster } from "@/components/ui/sonner";
import { getSiteSettings } from "@/lib/site-settings";

const prettywise = localFont({
  src: [
    {
      path: "../../public/fonts/Prettywise/Prettywise-ExtraLight.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../../public/fonts/Prettywise/Prettywise-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/Prettywise/Prettywise-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Prettywise/Prettywise-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/Prettywise/Prettywise-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/Prettywise/Prettywise-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/Prettywise/Prettywise-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../public/fonts/Prettywise/Prettywise-Black.ttf",
      weight: "900",
      style: "normal",
    },
    {
      path: "../../public/fonts/Prettywise/Prettywise-Heavy.ttf",
      weight: "950",
      style: "normal",
    },
  ],
  variable: "--font-prettywise",
});

const neueHaas = localFont({
  src: [
    {
      path: "../../public/fonts/Neue Haas/NeueHaasDisplayXXThin.ttf",
      weight: "50",
      style: "normal",
    },
    {
      path: "../../public/fonts/Neue Haas/NeueHaasDisplayXXThinItalic.ttf",
      weight: "50",
      style: "italic",
    },
    {
      path: "../../public/fonts/Neue Haas/NeueHaasDisplayXThin.ttf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../../public/fonts/Neue Haas/NeueHaasDisplayXThinItalic.ttf",
      weight: "100",
      style: "italic",
    },
    {
      path: "../../public/fonts/Neue Haas/NeueHaasDisplayThin.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../../public/fonts/Neue Haas/NeueHaasDisplayThinItalic.ttf",
      weight: "200",
      style: "italic",
    },
    {
      path: "../../public/fonts/Neue Haas/NeueHaasDisplayLight.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/Neue Haas/NeueHaasDisplayLightItalic.ttf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../../public/fonts/Neue Haas/NeueHaasDisplayRoman.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Neue Haas/NeueHaasDisplayRomanItalic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../public/fonts/Neue Haas/NeueHaasDisplayMediu.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/Neue Haas/NeueHaasDisplayMediumItalic.ttf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../../public/fonts/Neue Haas/NeueHaasDisplayBold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/Neue Haas/NeueHaasDisplayBoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
    {
      path: "../../public/fonts/Neue Haas/NeueHaasDisplayBlack.ttf",
      weight: "900",
      style: "normal",
    },
    {
      path: "../../public/fonts/Neue Haas/NeueHaasDisplayBlackItalic.ttf",
      weight: "900",
      style: "italic",
    },
  ],
  variable: "--font-neue-haas",
});

export const metadata: Metadata = {
  title: "Nazaara Live",
  description: "South Asian nightlife and culture, worldwide. Artist tours, events, and activations by Nazaara Live.",
  openGraph: {
    title: "Nazaara Live",
    description: "South Asian nightlife and culture, worldwide. Artist tours, events, and activations by Nazaara Live.",
    images: [
      {
        url: "/OG.png",
        width: 1200,
        height: 630,
        alt: "Nazaara Live",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nazaara Live",
    description: "South Asian nightlife and culture, worldwide. Artist tours, events, and activations by Nazaara Live.",
    images: ["/OG.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();
  return (
    <html lang="en">
      <body className={`${prettywise.variable} ${neueHaas.variable}`}>
        <NextSSRPlugin
          /**
           * The `extractRouterConfig` will extract **only** the route configs
           * from the router to prevent additional information from being
           * leaked to the client. The data passed to the client is the same
           * as if you were to fetch `/api/uploadthing` directly.
           */
          routerConfig={extractRouterConfig(ourFileRouter)}
        />
        <Navigation 
          hideAbout={settings.hideAbout} 
          hideBookings={settings.hideBookings}
          useExternalGallery={settings.useExternalGallery}
          externalGalleryUrl={settings.externalGalleryUrl}
        />
        <main className="pt-16 md:pt-24">
          {children}
        </main>
        <Footer 
          hideAbout={settings.hideAbout} 
          hideBookings={settings.hideBookings}
          useExternalGallery={settings.useExternalGallery}
          externalGalleryUrl={settings.externalGalleryUrl}
        />
        <Analytics />
        <PostHogAnalytics />
        <Toaster />
      </body>
    </html>
  );
}
