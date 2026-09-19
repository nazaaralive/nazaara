import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { QrCode, ArrowLeft } from "lucide-react"
import { getPosterLinkStats, getRecentScans } from "@/lib/poster-links"
import { getEventOptions } from "@/lib/poster-actions"
import { PosterManager } from "@/components/admin/poster-manager"

export const revalidate = 0

const SITE_ORIGIN = "https://nazaara.live"

export default async function AdminPostersPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    redirect("/admin/auth")
  }

  const [links, eventOptions, recent] = await Promise.all([
    getPosterLinkStats(),
    getEventOptions(),
    getRecentScans(25),
  ])

  const totalScans = links.reduce((sum, l) => sum + l.totalScans, 0)

  const formatDateTime = (d: Date) =>
    new Date(d).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-serif flex items-center gap-3">
            <QrCode className="h-7 w-7 text-[--gold]" />
            QR Tracking Links
          </h1>
          <p className="text-muted-foreground mt-2">
            {totalScans === 0
              ? "Name a link, download its QR, put it on a poster. Scans appear here."
              : `${totalScans} scan${totalScans === 1 ? "" : "s"} across ${links.length} link${
                  links.length === 1 ? "" : "s"
                }.`}
          </p>
        </div>

        <PosterManager links={links} eventOptions={eventOptions} origin={SITE_ORIGIN} />

        {recent.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-foreground mb-3">Recent scans</h2>
            <div className="border border-border rounded-lg divide-y divide-border">
              {recent.map((s, i) => (
                <div
                  key={i}
                  className="px-4 py-2.5 flex items-center justify-between gap-4 text-sm"
                >
                  <span className="font-mono text-xs text-muted-foreground">{s.code}</span>
                  <span className="text-muted-foreground flex-1 truncate">
                    {[s.city, s.region, s.country].filter(Boolean).join(", ") || "Unknown location"}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(s.scannedAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
