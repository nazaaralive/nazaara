import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Star, Mail, ThumbsUp, ThumbsDown } from "lucide-react"
import { getEventFeedbackDetail } from "@/lib/feedback-actions"
import { FeedbackExportButton } from "@/components/admin/feedback-ui"

export const revalidate = 0

interface PageProps {
  params: Promise<{ slug: string }>
}

function Metric({ label, value, suffix }: { label: string; value: number | null; suffix?: string }) {
  return (
    <div className="border border-border rounded-lg p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-2xl font-light text-foreground mt-1">
        {value === null ? "-" : value.toFixed(1)}
        {value !== null && suffix && (
          <span className="text-sm text-muted-foreground ml-1">{suffix}</span>
        )}
      </div>
    </div>
  )
}

function Stars({ n }: { n: number | null }) {
  if (n === null) return <span className="text-muted-foreground text-sm">-</span>
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={
            i <= n ? "h-3.5 w-3.5 fill-[--gold] text-[--gold]" : "h-3.5 w-3.5 text-muted-foreground/30"
          }
        />
      ))}
    </span>
  )
}

export default async function AdminFeedbackDetailPage({ params }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    redirect("/admin/auth")
  }

  const { slug } = await params
  const detail = await getEventFeedbackDetail(slug)

  if (!detail) {
    notFound()
  }

  const a = detail.averages

  const formatDateTime = (d: Date) =>
    new Date(d).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/admin/feedback"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          All feedback
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-serif">
              {detail.eventTitle}
            </h1>
            <p className="text-muted-foreground mt-2">
              {detail.responses.length} response{detail.responses.length === 1 ? "" : "s"}
              {detail.emailsCollected > 0 && (
                <> · {detail.emailsCollected} email{detail.emailsCollected === 1 ? "" : "s"} collected</>
              )}
            </p>
          </div>
          <FeedbackExportButton
            eventTitle={detail.eventTitle}
            slug={detail.eventSlug}
            responses={detail.responses}
          />
        </div>

        {/* Averages */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Metric label="Overall" value={a.overall} suffix="/ 5" />
          <Metric label="NPS" value={a.nps} suffix="/ 10" />
          <Metric label="Music" value={a.music} suffix="/ 5" />
          <Metric label="Venue" value={a.venue} suffix="/ 5" />
          <Metric label="Sound" value={a.sound} suffix="/ 5" />
          <Metric label="Crowd" value={a.crowd} suffix="/ 5" />
          <Metric label="Vibes" value={a.vibes} suffix="/ 5" />
          <div className="border border-border rounded-lg p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Would return</div>
            <div className="text-2xl font-light text-foreground mt-1 flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <ThumbsUp className="h-4 w-4 text-green-500" />
                {detail.wouldReturnYes}
              </span>
              <span className="inline-flex items-center gap-1">
                <ThumbsDown className="h-4 w-4 text-red-400" />
                {detail.wouldReturnNo}
              </span>
            </div>
          </div>
        </div>

        {/* Responses */}
        <div className="space-y-3">
          {detail.responses.map((r) => (
            <div key={r.id} className="border border-border rounded-lg p-4 sm:p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <Stars n={r.overallRating} />
                  {r.attendeeName && (
                    <span className="text-sm font-medium text-foreground">{r.attendeeName}</span>
                  )}
                  {r.npsScore !== null && (
                    <span className="text-xs text-muted-foreground border border-border rounded px-2 py-0.5">
                      NPS {r.npsScore}
                    </span>
                  )}
                  {r.wouldReturn !== null && (
                    <span
                      className={
                        r.wouldReturn
                          ? "text-xs text-green-500 border border-green-500/40 rounded px-2 py-0.5"
                          : "text-xs text-red-400 border border-red-400/40 rounded px-2 py-0.5"
                      }
                    >
                      {r.wouldReturn ? "Would return" : "Would not return"}
                    </span>
                  )}
                  {r.heardFrom && (
                    <span className="text-xs text-muted-foreground border border-border rounded px-2 py-0.5">
                      via {r.heardFrom}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</span>
              </div>

              {(r.highlight || r.improvement) && (
                <div className="space-y-2 text-sm">
                  {r.highlight && (
                    <p className="text-foreground">
                      <span className="text-muted-foreground">Loved: </span>
                      {r.highlight}
                    </p>
                  )}
                  {r.improvement && (
                    <p className="text-foreground">
                      <span className="text-muted-foreground">Improve: </span>
                      {r.improvement}
                    </p>
                  )}
                </div>
              )}

              {/* Category detail, only when at least one was given */}
              {(r.musicRating ?? r.venueRating ?? r.soundRating ?? r.crowdRating ?? r.vibesRating) !==
                null && (
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1.5">Music <Stars n={r.musicRating} /></span>
                  <span className="flex items-center gap-1.5">Venue <Stars n={r.venueRating} /></span>
                  <span className="flex items-center gap-1.5">Sound <Stars n={r.soundRating} /></span>
                  <span className="flex items-center gap-1.5">Crowd <Stars n={r.crowdRating} /></span>
                  <span className="flex items-center gap-1.5">Vibes <Stars n={r.vibesRating} /></span>
                </div>
              )}

              {r.email && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                  <Mail className="h-3.5 w-3.5" />
                  <a href={`mailto:${r.email}`} className="hover:text-foreground underline underline-offset-2">
                    {r.email}
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
