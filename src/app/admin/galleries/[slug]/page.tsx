import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getGalleryBySlug } from "@/lib/admin-actions"
import { SuccessToast } from "@/components/admin/success-toast"
import { GalleryFormV2 } from "@/components/admin/gallery-form-v2"

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export const revalidate = 0

export default async function GalleryEditPage({ params }: PageProps) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    redirect("/admin/auth")
  }

  const { slug } = await params
  
  if (!slug) {
    redirect("/admin?tab=galleries")
  }

  const gallery = await getGalleryBySlug(slug)

  if (!gallery) {
    redirect("/admin?tab=galleries")
  }

  return (
    <div className="min-h-screen bg-background">
      <SuccessToast />
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/admin?tab=galleries">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </a>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Edit Gallery
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {gallery.title} • {gallery.images.length} image{gallery.images.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            {/* Image count badge */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-muted text-muted-foreground text-sm font-medium rounded-full">
                {gallery.images.length} Image{gallery.images.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <GalleryFormV2 
          mode="edit" 
          gallery={gallery}
        />
      </div>
    </div>
  )
}