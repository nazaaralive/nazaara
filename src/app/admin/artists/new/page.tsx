import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Instagram, Cloud, Save, Music } from "lucide-react"
import Link from "next/link"
import { createArtist } from "@/lib/admin-actions"
import { ImageUpload } from "@/components/admin/image-upload"

export default async function NewArtistPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    redirect("/admin/auth")
  }

  return (
    <div className="min-h-screen bg-background">
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
                  Add New Artist
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Add a new artist to your roster
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <form action={createArtist}>
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column - Form Fields (2/3 width) */}
            <div className="lg:col-span-2 space-y-8">
              {/* Basic Information */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Artist Name *</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      required 
                      placeholder="DJ Name"
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
                        placeholder="username"
                        className="bg-background pl-10 border-border"
                      />
                    </div>
                  </div>
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
                  <ImageUpload name="image" aspectRatio="square" />
                </div>
              </div>

              {/* Artist Info Preview */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Artist Details</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Music className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-foreground font-medium">Profile</p>
                      <p className="text-sm text-muted-foreground">
                        New Artist
                      </p>
                    </div>
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
              Create Artist
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}