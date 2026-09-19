import { db } from "@/db/drizzle"
import { posterLinks, posterScans } from "@/db/schema"
import { eq, sql, desc } from "drizzle-orm"

/**
 * QR poster tracking.
 *
 * Printed posters outlive campaigns, so every decision here favours the link
 * continuing to work over strict correctness:
 *  - unknown/retired codes fall back to /events rather than 404
 *  - the destination lives in the DB so it can be repointed without reprinting
 *  - redirects are 307 + no-store so browsers never cache them (a cached 301
 *    would silently stop counting scans forever)
 *
 * This is a plain server module, NOT a "use server" file - it is imported by a
 * route handler and by server components, neither of which needs server actions.
 */

export interface PosterLink {
  id: number
  code: string
  label: string
  eventSlug: string
  city: string | null
  placement: string | null
  campaign: string
  destinationOverride: string | null
  isActive: boolean
}

export async function getPosterLink(code: string): Promise<PosterLink | null> {
  const normalized = (code || "").trim().toLowerCase()
  if (!normalized) return null

  const rows = await db
    .select({
      id: posterLinks.id,
      code: posterLinks.code,
      label: posterLinks.label,
      eventSlug: posterLinks.eventSlug,
      city: posterLinks.city,
      placement: posterLinks.placement,
      campaign: posterLinks.campaign,
      destinationOverride: posterLinks.destinationOverride,
      isActive: posterLinks.isActive,
    })
    .from(posterLinks)
    .where(eq(posterLinks.code, normalized))
    .limit(1)

  return rows[0] ?? null
}

/**
 * Build the final URL, tagging it with UTMs so PostHog attributes the session.
 * Existing query params on a destination override are preserved.
 */
export function buildDestination(link: PosterLink, origin: string): string {
  const base = link.destinationOverride?.trim() || `${origin}/event/${link.eventSlug}`

  let url: URL
  try {
    url = new URL(base, origin)
  } catch {
    // A malformed override must not take the poster down with it.
    url = new URL(`${origin}/event/${link.eventSlug}`)
  }

  url.searchParams.set("utm_source", "poster")
  url.searchParams.set("utm_medium", "qr")
  url.searchParams.set("utm_campaign", link.campaign)
  url.searchParams.set("utm_content", link.code)

  return url.toString()
}

/**
 * Link previews and scanners would otherwise inflate every count. Treat a
 * missing user-agent as automated too - real phone browsers always send one.
 */
const BOT_PATTERN =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|slack|twitter|linkedin|embedly|pinterest|curl|wget|python-requests|headless|lighthouse|monitor|uptime|pingdom|semrush|ahrefs/i

export function isLikelyBot(userAgent: string | null): boolean {
  if (!userAgent || !userAgent.trim()) return true
  return BOT_PATTERN.test(userAgent)
}

/** x-vercel-ip-city arrives percent-encoded (e.g. "New%20York"). */
export function decodeGeoValue(value: string | null): string | null {
  if (!value) return null
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export async function recordScan(input: {
  linkId: number
  country: string | null
  region: string | null
  city: string | null
  referrer: string | null
  userAgent: string | null
}): Promise<void> {
  await db.insert(posterScans).values({
    linkId: input.linkId,
    country: input.country?.slice(0, 10) ?? null,
    region: input.region?.slice(0, 100) ?? null,
    city: input.city?.slice(0, 100) ?? null,
    referrer: input.referrer?.slice(0, 2000) ?? null,
    userAgent: input.userAgent?.slice(0, 2000) ?? null,
  })
}

/* ---------------------------------------------------------------------------
 * Admin reporting
 * ------------------------------------------------------------------------ */

export interface PosterLinkStats extends PosterLink {
  totalScans: number
  scansLast7Days: number
  lastScanAt: Date | null
}

export async function getPosterLinkStats(): Promise<PosterLinkStats[]> {
  const rows = await db
    .select({
      id: posterLinks.id,
      code: posterLinks.code,
      label: posterLinks.label,
      eventSlug: posterLinks.eventSlug,
      city: posterLinks.city,
      placement: posterLinks.placement,
      campaign: posterLinks.campaign,
      destinationOverride: posterLinks.destinationOverride,
      isActive: posterLinks.isActive,
      totalScans: sql<number>`COUNT(${posterScans.id})::int`.as("total_scans"),
      scansLast7Days: sql<number>`COUNT(${posterScans.id}) FILTER (WHERE ${posterScans.scannedAt} > NOW() - INTERVAL '7 days')::int`.as(
        "scans_last_7_days"
      ),
      lastScanAt: sql<Date | null>`MAX(${posterScans.scannedAt})`.as("last_scan_at"),
    })
    .from(posterLinks)
    .leftJoin(posterScans, eq(posterScans.linkId, posterLinks.id))
    .groupBy(
      posterLinks.id,
      posterLinks.code,
      posterLinks.label,
      posterLinks.eventSlug,
      posterLinks.city,
      posterLinks.placement,
      posterLinks.campaign,
      posterLinks.destinationOverride,
      posterLinks.isActive
    )
    .orderBy(posterLinks.code)

  return rows.map((r) => ({
    ...r,
    lastScanAt: r.lastScanAt ? new Date(r.lastScanAt) : null,
  }))
}

export interface RecentScan {
  code: string
  label: string
  scannedAt: Date
  city: string | null
  region: string | null
  country: string | null
}

export async function getRecentScans(limit = 25): Promise<RecentScan[]> {
  const rows = await db
    .select({
      code: posterLinks.code,
      label: posterLinks.label,
      scannedAt: posterScans.scannedAt,
      city: posterScans.city,
      region: posterScans.region,
      country: posterScans.country,
    })
    .from(posterScans)
    .innerJoin(posterLinks, eq(posterScans.linkId, posterLinks.id))
    .orderBy(desc(posterScans.scannedAt))
    .limit(limit)

  return rows.map((r) => ({ ...r, scannedAt: new Date(r.scannedAt) }))
}
