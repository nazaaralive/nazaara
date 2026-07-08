import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Instagram, Save, Headphones } from "lucide-react"
import Link from "next/link"
import { createDJ } from "@/lib/admin-actions"
import { ImageUpload } from "@/components/admin/image-upload"
import { HighlightsEditor } from "@/components/admin/highlights-editor"

export default async function NewDJPage() {
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
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Add New DJ
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Add a new DJ to your internal roster
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <form action={createDJ}>
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column - Form Fields (2/3 width) */}
            <div className="lg:col-span-2 space-y-8">
              {/* Basic Information */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">DJ Name *</Label>
                      <Input 
                        id="name" 
                        name="name" 
                        required 
                        placeholder="DJ RISHI"
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input 
                        id="title" 
                        name="title" 
                        placeholder="The Maestro"
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Specialty</Label>
                    <Input 
                      id="specialty" 
                      name="specialty" 
                      placeholder="Bollywood & House Fusion"
                      className="bg-background border-border"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="experience">Experience</Label>
                      <Input 
                        id="experience" 
                        name="experience" 
                        placeholder="15+ Years"
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="performances">Performances</Label>
                      <Input 
                        id="performances" 
                        name="performances" 
                        placeholder="500+ Events"
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Biography */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Biography</h2>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea 
                    id="bio" 
                    name="bio" 
                    rows={4}
                    placeholder="With over 15 years of experience, this DJ has become synonymous with..."
                    className="bg-background border-border"
                  />
                </div>
              </div>

              {/* Career Highlights */}
              <HighlightsEditor />

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
                        placeholder="djrishi"
                        className="bg-background pl-10 border-border"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Enter username without @ symbol</p>
                  </div>

                </div>
              </div>

              {/* Management Settings */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Management Settings</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="isActive" name="isActive" defaultChecked />
                    <Label htmlFor="isActive">Show on bookings page</Label>
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
                  <Label>DJ Photo</Label>
                  <ImageUpload name="image" aspectRatio="square" />
                </div>
              </div>

              {/* DJ Info Preview */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">DJ Details</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Headphones className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-foreground font-medium">Profile</p>
                      <p className="text-sm text-muted-foreground">
                        New DJ
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
              Create DJ
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
