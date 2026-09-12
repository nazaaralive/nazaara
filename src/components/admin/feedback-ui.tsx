"use client"

import { useState } from "react"
import { Check, Link as LinkIcon, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FeedbackResponse } from "@/lib/feedback-actions"

/* -------------------------------------------------------------------------
 * Copy feedback link
 * ---------------------------------------------------------------------- */

/**
 * Copies a feedback URL to the clipboard. Falls back to a temporary input +
 * execCommand on browsers/contexts where the async clipboard API is
 * unavailable (non-HTTPS origins, older Safari).
 */
export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const input = document.createElement("input")
      input.value = url
      document.body.appendChild(input)
      input.select()
      try {
        document.execCommand("copy")
      } catch {
        // Nothing more we can do - leave `copied` false so the label does not lie.
        document.body.removeChild(input)
        return
      }
      document.body.removeChild(input)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy feedback link: ${url}`}
      className={cn(
        "text-sm px-3 py-1.5 rounded-md border transition-colors inline-flex items-center gap-1.5 whitespace-nowrap",
        copied
          ? "border-green-500/50 text-green-500"
          : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <LinkIcon className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy link"}
    </button>
  )
}

/* -------------------------------------------------------------------------
 * CSV export
 * ---------------------------------------------------------------------- */

/** RFC 4180 escaping: wrap in quotes, double any embedded quotes. */
function csvCell(value: string | number | boolean | null | Date): string {
  if (value === null) return ""
  const s = value instanceof Date ? value.toISOString() : String(value)
  return `"${s.replace(/"/g, '""')}"`
}

const COLUMNS: {
  header: string
  get: (r: FeedbackResponse) => string | number | boolean | null | Date
}[] = [
  { header: "Submitted", get: (r) => r.createdAt },
  { header: "Overall", get: (r) => r.overallRating },
  { header: "Music", get: (r) => r.musicRating },
  { header: "Venue", get: (r) => r.venueRating },
  { header: "Sound", get: (r) => r.soundRating },
  { header: "Crowd", get: (r) => r.crowdRating },
  { header: "Value", get: (r) => r.valueRating },
  { header: "NPS", get: (r) => r.npsScore },
  { header: "Would return", get: (r) => (r.wouldReturn === null ? null : r.wouldReturn ? "Yes" : "No") },
  { header: "Loved", get: (r) => r.highlight },
  { header: "Improve", get: (r) => r.improvement },
  { header: "Email", get: (r) => r.email },
  { header: "Heard from", get: (r) => r.heardFrom },
]

export function FeedbackExportButton({
  eventTitle,
  slug,
  responses,
}: {
  eventTitle: string
  slug: string
  responses: FeedbackResponse[]
}) {
  const download = () => {
    const rows = [
      COLUMNS.map((c) => csvCell(c.header)).join(","),
      ...responses.map((r) => COLUMNS.map((c) => csvCell(c.get(r))).join(",")),
    ]
    // Leading BOM so Excel opens UTF-8 correctly
    const blob = new Blob(["﻿" + rows.join("\r\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `feedback-${slug}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (responses.length === 0) return null

  return (
    <button
      type="button"
      onClick={download}
      aria-label={`Download feedback for ${eventTitle} as CSV`}
      className="text-sm px-4 py-2 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors inline-flex items-center gap-2 whitespace-nowrap"
    >
      <Download className="h-4 w-4" />
      Export CSV
    </button>
  )
}
