import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getEventBySlug, getAdminVenues, getAdminArtists } from "@/lib/admin-actions"
import Link from "next/link"
import { EventEditForm } from "@/components/admin/event-edit-form"
import { SuccessToast } from "@/components/admin/success-toast"

// Disable caching to always show fresh data after updates
export const revalidate = 0

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

interface EventForForm {
  id: number
  title: string
  slug: string
  tagline: string | null
  description: string | null
  startTime: string | Date
  endTime: string | Date
  venueId: number | null
  venueName: string | null
  image: string | null
  imageKey: string | null
  ticketUrl: string | null
  isTour: boolean
  isPublished: boolean
  artists: { id: number; name: string; orderIndex?: number }[]
  stops?: {
    id: number
    city: string
    country: string
    venueId: number | null
    venueName: string | null
    startTime: string | Date
    endTime: string | Date
    ticketUrl: string | null
    orderIndex: number
  }[]
}

export default async function EventEditPage({ params }: PageProps) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    redirect("/admin/auth")
  }

  const { slug } = await params
  
  if (!slug) {
    redirect("/admin")
  }

  const [event, venues, artists] = await Promise.all([
    getEventBySlug(slug),
    getAdminVenues(),
    getAdminArtists()
  ])

  if (!event) {
    redirect("/admin")
  }

  console.log('🔍 [EVENT PAGE] Raw event from DB:', {
    startTime: event.startTime,
    endTime: event.endTime,
    startTimeType: typeof event.startTime,
    endTimeType: typeof event.endTime,
  })

  const eventForForm: EventForForm = {
    ...event,
    isTour: event.isTour ?? false,
    artists: (event.artists || [])
      .filter((a) => a && a.id !== null && a.name !== null)
      .map((a) => ({
        id: a.id as number,
        name: a.name as string,
        orderIndex: a.orderIndex ?? undefined,
      })),
    stops: (event.stops || []).map((s) => ({
      id: s.id,
      city: s.city,
      country: s.country,
      venueId: s.venueId,
      venueName: s.venueName,
      startTime: s.startTime,
      endTime: s.endTime,
      ticketUrl: s.ticketUrl,
      orderIndex: s.orderIndex ?? 0,
    })),
  }

  console.log('🔍 [EVENT PAGE] eventForForm times:', {
    startTime: eventForForm.startTime,
    endTime: eventForForm.endTime,
  })


  return (
    <div className="min-h-screen bg-background">
      <SuccessToast />
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Edit Event
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {event.title} • {event.venueName || "No venue selected"}
                </p>
              </div>
            </div>
            
            {/* Preview Badge */}
            <div className="flex items-center gap-2">
              {event.isPublished ? (
                <span className="px-3 py-1 bg-green-500/10 text-green-600 text-sm font-medium rounded-full">
                  Published
                </span>
              ) : (
                <span className="px-3 py-1 bg-yellow-500/10 text-yellow-600 text-sm font-medium rounded-full">
                  Draft
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <EventEditForm event={eventForForm} venues={venues} artists={artists} />
      </div>
    </div>
  )
}