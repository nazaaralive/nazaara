import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { MessageSquare, Star, ArrowLeft, AlertTriangle } from "lucide-react"
import { getFeedbackHub } from "@/lib/feedback-actions"
import { CopyLinkButton } from "@/components/admin/feedback-ui"

export const revalidate = 0

export default async function AdminFeedbackPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    redirect("/admin/auth")
  }

  const rows = await getFeedbackHub()
  const totalResponses = rows.reduce((sum, r) => sum + r.responses, 0)
  const eventsWithResponses = rows.filter((r) => r.responses > 0).length

  const formatDate = (date: Date | null) =>
    date
      ? new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "-"

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
            <MessageSquare className="h-7 w-7 text-[--gold]" />
            Event Feedback
          </h1>
          <p className="text-muted-foreground mt-2">
            {totalResponses === 0
              ? "No responses yet. Copy an event link below and send it to attendees."
              : `${totalResponses} response${totalResponses === 1 ? "" : "s"} across ${eventsWithResponses} event${eventsWithResponses === 1 ? "" : "s"}.`}
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="text-center py-20 border border-border rounded-lg">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No events yet.</p>
          </div>
        ) : (
          <div className="border border-border rounded-lg divide-y divide-border">
            {rows.map((row) => (
              <div
                key={row.slug}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground truncate">{row.title}</span>
                    {row.eventPurged && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-amber-500/90 border border-amber-500/40 rounded px-1.5 py-0.5"
                        title="The event record was auto-deleted after 100 days, but its feedback was kept."
                      >
                        <AlertTriangle className="h-3 w-3" />
                        Event purged
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                    <span>{formatDate(row.startTime)}</span>
                    <span className="text-muted-foreground/50">/feedback/{row.slug}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">
                      {row.responses} {row.responses === 1 ? "response" : "responses"}
                    </div>
                    {row.avgOverall !== null && (
                      <div className="text-sm text-muted-foreground flex items-center justify-end gap-1">
                        <Star className="h-3 w-3 fill-[--gold] text-[--gold]" />
                        {row.avgOverall.toFixed(1)}
                      </div>
                    )}
                  </div>

                  <CopyLinkButton url={`https://nazaara.live/feedback/${row.slug}`} />

                  {row.responses > 0 && (
                    <Link
                      href={`/admin/feedback/${row.slug}`}
                      className="text-sm px-3 py-1.5 rounded-md bg-[--gold] text-[--maroon-red] font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
                    >
                      View
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
