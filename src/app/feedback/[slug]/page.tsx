import { notFound } from "next/navigation"
import Image from "next/image"
import type { Metadata } from "next"
import { Calendar, MapPin } from "lucide-react"
import { getFeedbackEvent } from "@/lib/feedback-actions"
import { FeedbackForm } from "@/components/feedback/feedback-form"

interface PageProps {
  params: Promise<{ slug: string }>
}

/**
 * Unlisted by design: noindex/nofollow, not linked from anywhere in the site
 * navigation. The URL is the access control - it is shareable with attendees
 * but will not surface in search.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const event = await getFeedbackEvent(slug)

  return {
    title: event ? `Feedback - ${event.title} | Nazaara Live` : "Feedback | Nazaara Live",
    description: "Share your feedback on the event.",
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: { index: false, follow: false },
    },
  }
}

// Always read the current event record; feedback links get shared days later.
export const revalidate = 0

export default async function FeedbackPage({ params }: PageProps) {
  const { slug } = await params
  const event = await getFeedbackEvent(slug)

  if (!event) {
    notFound()
  }

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })

  const location = [event.venueName, event.venueCity].filter(Boolean).join(", ")

  return (
    <div className="min-h-screen bg-background">
      {/* Event header */}
      <section className="relative py-14 md:py-20 overflow-hidden">
        {event.image && (
          <>
            <div className="absolute inset-0">
              <Image
                src={event.image}
                alt={event.title}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--maroon-red)]/85 via-[color:var(--maroon-red)]/70 to-[color:var(--dark-green)]/85" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </>
        )}
        {!event.image && (
          <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--maroon-red)] to-[color:var(--dark-green)]" />
        )}

        <div className="container mx-auto px-6 md:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-5">
            <p className="text-xs tracking-[0.25em] uppercase text-[color:var(--gold)] font-light">
              Your feedback
            </p>
            <h1 className="heading-display text-4xl md:text-5xl font-light text-[color:var(--off-white)] tracking-tight leading-tight">
              {event.title}
            </h1>
            {event.tagline && (
              <p className="text-lg text-[color:var(--off-white)]/80 font-light">{event.tagline}</p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-[color:var(--off-white)]/80 font-light text-sm">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[color:var(--gold)]/70" />
                {formatDate(event.startTime)}
              </span>
              {location && (
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[color:var(--gold)]/70" />
                  {location}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-6 md:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-10 text-center">
              <p className="text-muted-foreground font-light leading-relaxed">
                Thanks for coming out. Two minutes of honest feedback helps us make the
                next one better - it is anonymous unless you leave your email.
              </p>
            </div>
            <FeedbackForm slug={event.slug} eventTitle={event.title} />
          </div>
        </div>
      </section>
    </div>
  )
}
