import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { GalleryFormV2 } from "@/components/admin/gallery-form-v2"

export default async function NewGalleryPage() {
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
          <div className="flex items-center gap-4">
            <a href="/admin?tab=galleries">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </a>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Create Gallery
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Add a new photo gallery to showcase your events
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <GalleryFormV2 mode="create" />
      </div>
    </div>
  )
}