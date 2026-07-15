import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { VenueLocationFields } from "@/components/admin/venue-location-fields"
import Link from "next/link"
import { createVenue } from "@/lib/admin-actions"
import { MultiImageUpload } from "@/components/admin/multi-image-upload"

export default async function NewVenuePage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    redirect("/admin/auth")
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <a href="/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </a>
          <div>
            <h1 className="text-3xl font-bold text-foreground font-serif">
              Add New Venue
            </h1>
            <p className="text-muted-foreground mt-1">
              Add a new venue to your location catalog
            </p>
          </div>
        </div>

        <form action={createVenue}>
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left Column - Form Fields (with Google Places autocomplete) */}
            <div className="space-y-8">
              <VenueLocationFields />
            </div>

            {/* Right Column - Images */}
            <div className="space-y-8">
              {/* Media */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Media</h2>
                <MultiImageUpload 
                  names={["image1", "image2", "image3"]} 
                />
              </div>
            </div>
          </div>

          {/* Actions - Full Width */}
          <div className="flex gap-4 pt-8 mt-8 border-t border-border">
            <Button type="submit" className="bg-[--gold] text-[--maroon-red] hover:bg-[--gold]/90">
              Create Venue
            </Button>
            <Link href="/admin">
              <Button variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}