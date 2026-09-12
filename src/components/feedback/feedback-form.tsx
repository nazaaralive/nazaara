"use client"

import { useState, useTransition } from "react"
import type React from "react"
import { Star, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { submitEventFeedback } from "@/lib/feedback-actions"
import { cn } from "@/lib/utils"

interface FeedbackFormProps {
  slug: string
  eventTitle: string
}

const CATEGORIES = [
  { name: "musicRating", label: "Music & DJ's" },
  { name: "venueRating", label: "Venue" },
  { name: "soundRating", label: "Sound and Production" },
  { name: "crowdRating", label: "Crowd and Atmosphere" },
  { name: "vibesRating", label: "Vibes" },
] as const

const HEARD_FROM_OPTIONS = [
  "Instagram",
  "A friend",
  "TikTok",
  "WhatsApp group",
  "Email from Nazaara",
  "Flyer or poster",
  "Other",
]

/** 1-5 star control. */
function StarRating({
  value,
  onChange,
  label,
}: {
  value: number | null
  onChange: (v: number) => void
  label: string
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const active = hovered ?? value ?? 0

  return (
    <div className="flex items-center gap-1" role="group" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(null)}
          aria-label={`${n} out of 5`}
          aria-pressed={value === n}
          className="p-1 -m-1 transition-transform hover:scale-110 active:scale-95"
        >
          <Star
            className={cn(
              "h-7 w-7 sm:h-6 sm:w-6 transition-colors",
              n <= active
                ? "fill-[color:var(--gold)] text-[color:var(--gold)]"
                : "text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  )
}

export function FeedbackForm({ slug, eventTitle }: FeedbackFormProps) {
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [overallRating, setOverallRating] = useState<number | null>(null)
  const [categoryRatings, setCategoryRatings] = useState<Record<string, number | null>>({})
  const [npsScore, setNpsScore] = useState<number | null>(null)
  const [wouldReturn, setWouldReturn] = useState<"yes" | "no" | null>(null)

  const setCategory = (name: string, v: number) =>
    setCategoryRatings((prev) => ({ ...prev, [name]: v }))

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (overallRating === null) {
      setError("Please give an overall rating before submitting.")
      return
    }

    const formData = new FormData(e.currentTarget)
    formData.set("slug", slug)
    formData.set("overallRating", String(overallRating))
    for (const { name } of CATEGORIES) {
      const v = categoryRatings[name]
      if (v != null) formData.set(name, String(v))
    }
    if (npsScore !== null) formData.set("npsScore", String(npsScore))
    if (wouldReturn !== null) formData.set("wouldReturn", wouldReturn)

    startTransition(async () => {
      const result = await submitEventFeedback(formData)
      if (result.ok) {
        setSubmitted(true)
        window.scrollTo({ top: 0, behavior: "smooth" })
      } else {
        setError(result.error ?? "Something went wrong. Please try again.")
      }
    })
  }

  if (submitted) {
    return (
      <div className="text-center py-16 px-6">
        <CheckCircle2 className="h-14 w-14 mx-auto text-[color:var(--gold)] mb-6" />
        <h2 className="heading-display text-3xl md:text-4xl font-light text-foreground mb-4">
          Thank you
        </h2>
        <p className="text-muted-foreground font-light max-w-md mx-auto leading-relaxed">
          Your feedback on {eventTitle} has been received. It genuinely shapes how we
          plan the next one.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-12">
      {/* Honeypot - hidden from humans, catches naive bots */}
      <div className="absolute w-px h-px overflow-hidden -left-[9999px]" aria-hidden="true">
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {/* Optional name */}
      <section className="space-y-2">
        <label htmlFor="attendeeName" className="text-lg font-medium text-foreground block">
          Your name <span className="text-sm text-muted-foreground font-normal">(optional)</span>
        </label>
        <input
          id="attendeeName"
          name="attendeeName"
          type="text"
          maxLength={200}
          placeholder="So we know who to thank"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[color:var(--gold)]/60"
        />
      </section>

      {/* Overall */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-medium text-foreground">
            How was the night overall? <span className="text-[color:var(--gold)]">*</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Required - everything else is optional.</p>
        </div>
        <StarRating value={overallRating} onChange={setOverallRating} label="Overall rating" />
      </section>

      {/* Categories */}
      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-medium text-foreground">Rate the details</h2>
          <p className="text-sm text-muted-foreground mt-1">Skip anything you have no strong view on.</p>
        </div>
        <div className="space-y-4">
          {CATEGORIES.map(({ name, label }) => (
            <div
              key={name}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-border/60 last:border-0"
            >
              <span className="text-sm text-foreground font-light">{label}</span>
              <StarRating
                value={categoryRatings[name] ?? null}
                onChange={(v) => setCategory(name, v)}
                label={label}
              />
            </div>
          ))}
        </div>
      </section>

      {/* NPS */}
      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-medium text-foreground">
            How likely are you to recommend a Nazaara event to a friend?
          </h2>
          <p className="text-sm text-muted-foreground mt-1">0 = not at all, 10 = absolutely.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 11 }, (_, i) => i).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNpsScore(n)}
              aria-pressed={npsScore === n}
              className={cn(
                "h-10 w-10 rounded-full border text-sm font-light transition-colors",
                npsScore === n
                  ? "bg-[color:var(--gold)] text-[color:var(--maroon-red)] border-[color:var(--gold)] font-medium"
                  : "border-border text-muted-foreground hover:border-[color:var(--gold)]/60 hover:text-foreground"
              )}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="pt-2">
          <span className="text-sm text-foreground font-light block mb-3">
            Would you come to another Nazaara event?
          </span>
          <div className="flex gap-3">
            {(["yes", "no"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setWouldReturn(v)}
                aria-pressed={wouldReturn === v}
                className={cn(
                  "px-6 py-2 rounded-full border text-sm transition-colors capitalize",
                  wouldReturn === v
                    ? "bg-[color:var(--gold)] text-[color:var(--maroon-red)] border-[color:var(--gold)] font-medium"
                    : "border-border text-muted-foreground hover:border-[color:var(--gold)]/60 hover:text-foreground"
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Open text */}
      <section className="space-y-5">
        <h2 className="text-lg font-medium text-foreground">Tell us more</h2>

        <div className="space-y-2">
          <label htmlFor="highlight" className="text-sm text-foreground font-light">
            What did you love most?
          </label>
          <textarea
            id="highlight"
            name="highlight"
            rows={4}
            maxLength={2000}
            placeholder="The set at 1am, the lighting, the crowd..."
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-[color:var(--gold)]/60"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="improvement" className="text-sm text-foreground font-light">
            What could we do better?
          </label>
          <textarea
            id="improvement"
            name="improvement"
            rows={4}
            maxLength={2000}
            placeholder="Be honest - this is the part we actually act on."
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-[color:var(--gold)]/60"
          />
        </div>
      </section>

      {/* How they heard */}
      <section className="space-y-5">
        <h2 className="text-lg font-medium text-foreground">
          How did you hear about this event?
        </h2>

        <div className="space-y-2">
          <select
            id="heardFrom"
            name="heardFrom"
            defaultValue=""
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[color:var(--gold)]/60"
          >
            <option value="">Select one</option>
            {HEARD_FROM_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </section>

      {error && (
        <p className="text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="w-full sm:w-auto px-10 py-3 rounded-full bg-[color:var(--gold)] text-[color:var(--maroon-red)] font-medium tracking-wide transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Send feedback"
          )}
        </button>
      </div>
    </form>
  )
}
