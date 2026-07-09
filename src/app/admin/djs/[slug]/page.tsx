import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Save, Headphones, Instagram, Eye, EyeOff } from "lucide-react"
import { getDJBySlug, updateDJ, deleteDJ } from "@/lib/admin-actions"
import Link from "next/link"
import { SuccessToast } from "@/components/admin/success-toast"
import { ImageUpload } from "@/components/admin/image-upload"
import { HighlightsEditor } from "@/components/admin/highlights-editor"

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

function DeleteDJForm({ djId }: { djId: number }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
      <form action={deleteDJ}>
        <input type="hidden" name="djId" value={djId} />
        <Button
          type="submit"
          variant="destructive"
          className="bg-red-600 hover:bg-red-700"
        >
          Delete DJ
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          This action cannot be undone. The DJ will be permanently deleted from the roster.
        </p>
      </form>
    </div>
  )
}

export default async function DJEditPage({ params }: PageProps) {
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

  const dj = await getDJBySlug(slug)

  if (!dj) {
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
                  Edit DJ
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {dj.name}
                </p>
              </div>
            </div>
            
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-sm font-medium rounded-full flex items-center gap-1 ${
                dj.isActive 
                  ? 'bg-green-500/10 text-green-600 border border-green-500/20' 
                  : 'bg-red-500/10 text-red-600 border border-red-500/20'
              }`}>
                {dj.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                {dj.isActive ? 'Active' : 'Hidden'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <form action={updateDJ}>
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column - Form Fields (2/3 width) */}
            <div className="lg:col-span-2 space-y-8">
              <input type="hidden" name="djId" value={dj.id} />
              
              {/* Basic Information */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">DJ Name *</Label>
                      <Input 
                        id="name" 
                        name="name" 
                        defaultValue={dj.name} 
                        required 
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input 
                        id="title" 
                        name="title" 
                        defaultValue={dj.title || ""} 
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Specialty</Label>
                    <Input 
                      id="specialty" 
                      name="specialty" 
                      defaultValue={dj.specialty || ""} 
                      className="bg-background border-border"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="experience">Experience</Label>
                      <Input 
                        id="experience" 
                        name="experience" 
                        defaultValue={dj.experience || ""} 
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="performances">Performances</Label>
                      <Input 
                        id="performances" 
                        name="performances" 
                        defaultValue={dj.performances || ""} 
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
                    defaultValue={dj.bio || ""} 
                    className="bg-background border-border"
                  />
                </div>
              </div>

              {/* Career Highlights */}
              <HighlightsEditor initialHighlights={dj.highlights} />

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
                        defaultValue={dj.instagram || ""} 
                        placeholder="username"
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
                    <Checkbox 
                      id="isActive" 
                      name="isActive" 
                      defaultChecked={dj.isActive} 
                    />
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
                  <ImageUpload defaultImage={dj.image} defaultImageKey={dj.imageKey} name="image" aspectRatio="square" />
                </div>
              </div>

              {/* DJ Info */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">DJ Details</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Headphones className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-foreground font-medium">Profile</p>
                      <p className="text-sm text-muted-foreground">
                        {dj.name}
                        {dj.title && ` - ${dj.title}`}
                      </p>
                    </div>
                  </div>

                  {dj.specialty && (
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 flex items-center justify-center mt-0.5">
                        <div className="w-1 h-1 bg-[--gold] rounded-full" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground font-medium">Specialty</p>
                        <p className="text-sm text-muted-foreground">{dj.specialty}</p>
                      </div>
                    </div>
                  )}
                  
                  {dj.instagram && (
                    <div className="flex items-start gap-2">
                      <Instagram className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-foreground font-medium">Instagram</p>
                        <a 
                          href={`https://instagram.com/${dj.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[--gold] hover:underline"
                        >
                          @{dj.instagram}
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
                      {new Date(dj.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Last Updated</p>
                    <p className="text-foreground">
                      {new Date(dj.updatedAt).toLocaleDateString('en-US', { 
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
          <DeleteDJForm djId={dj.id} />
        </div>
      </div>
    </div>
  )
}
