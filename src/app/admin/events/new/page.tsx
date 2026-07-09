import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getAdminVenues, getAdminArtists } from "@/lib/admin-actions"
import { EventForm } from "@/components/admin/event-form"

export default async function NewEventPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    redirect("/admin/auth")
  }

  const [venues, artists] = await Promise.all([
    getAdminVenues(),
    getAdminArtists()
  ])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Plain <a> (full page load) — guarantees Back always lands on
                  nazaara.live/admin regardless of client-router history state */}
              <a href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </a>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Create New Event
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Add a new event to your catalog
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <EventForm venues={venues} artists={artists} />
      </div>
    </div>
  )
}