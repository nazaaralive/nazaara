import { NextRequest, NextResponse } from "next/server"
import {
  getPosterLink,
  buildDestination,
  recordScan,
  isLikelyBot,
  decodeGeoValue,
} from "@/lib/poster-links"

// Always run fresh: this route exists to count, so it must never be cached
// or statically optimised.
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * QR poster redirect: /p/<code>
 *
 * Deliberately uses 307 (temporary) and no-store. A 301 would be cached by the
 * browser and by intermediaries, which would (a) stop future scans from ever
 * reaching us, so counts flatline, and (b) permanently freeze the destination
 * in the browser of anyone who scanned once - the opposite of the whole point.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params
  const origin = request.nextUrl.origin

  const link = await getPosterLink(code)

  // A printed poster outlives its campaign. An unknown or retired code sends
  // people to the events listing rather than dead-ending on a 404.
  if (!link || !link.isActive) {
    const miss = NextResponse.redirect(`${origin}/events`, { status: 307 })
    miss.headers.set("Cache-Control", "no-store, no-cache, must-revalidate")
    return miss
  }

  const destination = buildDestination(link, origin)
  const userAgent = request.headers.get("user-agent")

  if (!isLikelyBot(userAgent)) {
    try {
      await recordScan({
        linkId: link.id,
        country: request.headers.get("x-vercel-ip-country"),
        region: request.headers.get("x-vercel-ip-country-region"),
        city: decodeGeoValue(request.headers.get("x-vercel-ip-city")),
        referrer: request.headers.get("referer"),
        userAgent,
      })
    } catch (error) {
      // Never let a logging failure stop someone reaching the event page.
      console.error("poster scan logging failed:", error)
    }
  }

  const res = NextResponse.redirect(destination, { status: 307 })
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate")
  return res
}
