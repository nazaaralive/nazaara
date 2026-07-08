import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Music, Calendar, Instagram, Cloud } from "lucide-react"
import { getArtistBySlug, updateArtist, deleteArtist } from "@/lib/admin-actions"
import Link from "next/link"
import { ImageUpload } from "@/components/admin/image-upload"

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

function DeleteArtistForm({ artistId }: { artistId: number }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
      <form action={deleteArtist}>
        <input type="hidden" name="artistId" value={artistId} />
        <Button
          type="submit"
          variant="destructive"
          className="bg-red-600 hover:bg-red-700"
        >
          Delete Artist
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          This action cannot be undone. The artist will be permanently deleted and removed from all events.
        </p>
      </form>
    </div>
  )
}

export default async function ArtistEditPage({ params }: PageProps) {
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

  const artist = await getArtistBySlug(slug)

  if (!artist) {
    redirect("/admin")
  }

  return (
    <div className="min-h-screen bg-background">
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
                  Edit Artist
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {artist.name}
                </p>
              </div>
            </div>
            
            {/* Event Count Badge */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-muted text-foreground text-sm font-medium rounded-full flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {artist.events.length} Event{artist.events.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <form action={updateArtist}>
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column - Form Fields (2/3 width) */}
            <div className="lg:col-span-2 space-y-8">
              <input type="hidden" name="artistId" value={artist.id} />
              
              {/* Basic Information */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Artist Name *</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      defaultValue={artist.name} 
                      required 
                      className="bg-background border-border"
                    />
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Social Media</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram Handle</Label>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="instagram" 
                        name="instagram" 
                        defaultValue={artist.instagram || ""} 
                        placeholder="username"
                        className="bg-background pl-10 border-border"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Enter username without @ symbol</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="soundcloud">SoundCloud Username</Label>
                    <div className="relative">
                      <Cloud className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="soundcloud" 
                        name="soundcloud" 
                        defaultValue={artist.soundcloud || ""} 
                        placeholder="username"
                        className="bg-background pl-10 border-border"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Events */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Events</h3>
                <div className="space-y-2">
                  {artist.events.length > 0 ? (
                    artist.events.map((event) => (
                      <Link 
                        key={event.eventId} 
                        href={`/admin/events/${event.eventSlug}`}
                        className="block p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <p className="text-sm text-foreground font-medium">
                          {event.eventTitle}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.startTime || "").toLocaleDateString('en-US', { 
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </Link>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No events scheduled</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Media and Info (1/3 width) */}
            <div className="lg:col-span-1 space-y-8">
              {/* Media */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Media</h2>
                <div className="space-y-2">
                  <Label>Artist Photo</Label>
                  <ImageUpload defaultImage={artist.image} name="image" aspectRatio="square" />
                </div>
              </div>

              {/* Artist Info */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Artist Details</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Music className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-foreground font-medium">Profile</p>
                      <p className="text-sm text-muted-foreground">
                        {artist.name}
                      </p>
                    </div>
                  </div>
                  
                  {artist.instagram && (
                    <div className="flex items-start gap-2">
                      <Instagram className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-foreground font-medium">Instagram</p>
                        <a 
                          href={`https://instagram.com/${artist.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[--gold] hover:underline"
                        >
                          @{artist.instagram}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {artist.soundcloud && (
                    <div className="flex items-start gap-2">
                      <Cloud className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-foreground font-medium">SoundCloud</p>
                        <a 
                          href={`https://soundcloud.com/${artist.soundcloud}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[--gold] hover:underline"
                        >
                          {artist.soundcloud}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Timestamps</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Created</p>
                    <p className="text-foreground">
                      {new Date(artist.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Last Updated</p>
                    <p className="text-foreground">
                      {new Date(artist.updatedAt).toLocaleDateString('en-US', { 
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
          <DeleteArtistForm artistId={artist.id} />
        </div>
      </div>
    </div>
  )
}