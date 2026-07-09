import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, MapPin, Calendar } from "lucide-react"
import { getVenueBySlug, updateVenue, deleteVenue } from "@/lib/admin-actions"
import Link from "next/link"
import { SuccessToast } from "@/components/admin/success-toast"
import { MultiImageUpload } from "@/components/admin/multi-image-upload"

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

function DeleteVenueForm({ venueId, eventCount }: { venueId: number; eventCount: number }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
      <form action={deleteVenue}>
        <input type="hidden" name="venueId" value={venueId} />
        <Button
          type="submit"
          variant="destructive"
          className="bg-red-600 hover:bg-red-700"
        >
          Delete Venue
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          This action cannot be undone. The venue will be permanently deleted.
          {eventCount > 0 && (
            <span className="block mt-1 text-yellow-600">
              Note: {eventCount} event{eventCount !== 1 ? 's' : ''} currently use this venue. They will be updated to have no venue.
            </span>
          )}
        </p>
      </form>
    </div>
  )
}

export default async function VenueEditPage({ params }: PageProps) {
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

  const venue = await getVenueBySlug(slug)

  if (!venue) {
    redirect("/admin")
  }

  return (
    <div className="min-h-screen bg-background">
      <SuccessToast />
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </a>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Edit Venue
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {venue.name} • {venue.city}, {venue.country}
                </p>
              </div>
            </div>
            
            
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <form action={updateVenue}>
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left Column - Form Fields */}
            <div className="space-y-8">
              <input type="hidden" name="venueId" value={venue.id} />
              
              {/* Basic Information */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Venue Name *</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      defaultValue={venue.name} 
                      required 
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      name="description" 
                      defaultValue={venue.description || ""} 
                      rows={3}
                      placeholder="A brief description of the venue"
                      className="bg-background resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Location</h2>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input 
                        id="city" 
                        name="city" 
                        defaultValue={venue.city} 
                        required 
                        className="bg-background"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="country">Country *</Label>
                      <Input 
                        id="country" 
                        name="country" 
                        defaultValue={venue.country} 
                        required 
                        className="bg-background"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input 
                      id="address" 
                      name="address" 
                      defaultValue={venue.address || ""} 
                      placeholder="123 Main Street"
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressUrl">Directions URL</Label>
                    <Input 
                      id="addressUrl" 
                      name="addressUrl" 
                      defaultValue={venue.addressUrl || ""} 
                      placeholder="https://maps.google.com/..."
                      className="bg-background"
                    />
                  </div>
                </div>
              </div>

              {/* Venue Info */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Venue Details</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-foreground font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">
                        {venue.city}, {venue.country}
                      </p>
                      {venue.address && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {venue.address}
                        </p>
                      )}
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>

            {/* Right Column - Images and Timestamps */}
            <div className="space-y-8">
              {/* Media */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Media</h2>
                <MultiImageUpload 
                  defaultImages={venue.images || []} 
                  defaultImageKeys={venue.imageKeys || []}
                  names={["image1", "image2", "image3"]} 
                />
              </div>

              {/* Timestamps */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Timestamps</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Created</p>
                    <p className="text-foreground">
                      {new Date(venue.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Last Updated</p>
                    <p className="text-foreground">
                      {new Date(venue.updatedAt).toLocaleDateString('en-US', { 
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions - Full Width */}
          <div className="flex justify-end gap-3 pt-8 mt-8 border-t border-border">
            <Link href="/admin">
              <Button variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" className="bg-[--gold] text-[--maroon-red] hover:bg-[--gold]/90">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
        
        {/* Delete Section - Outside the form */}
        <div className="mt-8 pt-8 border-t border-border">
          <DeleteVenueForm venueId={venue.id} eventCount={venue.eventCount} />
        </div>
      </div>
    </div>
  )
}