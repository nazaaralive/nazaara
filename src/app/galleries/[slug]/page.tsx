import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { getPublicGalleryBySlug } from "@/lib/public-actions"
import { GalleryImageViewer } from "@/components/galleries/gallery-image-viewer"
import { ArrowLeft, Calendar, Camera } from "lucide-react"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const gallery = await getPublicGalleryBySlug(slug)
  
  if (!gallery) {
    return {
      title: "Gallery Not Found - Nazaara Live",
    }
  }

  return {
    title: `${gallery.title} - Nazaara Live`,
    description: gallery.description || `View photos from ${gallery.title}`,
    openGraph: {
      title: `${gallery.title} - Nazaara Live`,
      description: gallery.description || `View photos from ${gallery.title}`,
      url: `https://nazaara.live/galleries/${slug}`,
      siteName: "Nazaara Live",
      images: gallery.firstImage ? [
        {
          url: gallery.firstImage,
          width: 1200,
          height: 630,
          alt: gallery.title,
        },
      ] : [],
      locale: "en_US",
      type: "website",
    },
  }
}

export default async function GalleryPage({ params }: PageProps) {
  const { slug } = await params
  const gallery = await getPublicGalleryBySlug(slug)

  if (!gallery || !gallery.images) {
    notFound()
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const heroImage = gallery.images && gallery.images.length > 0 ? gallery.images[0] : null

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header with Background Image */}
      <section className="relative py-14 lg:py-24 md:py-40 overflow-hidden">
        {/* Background Image */}
        {heroImage && (
          <>
            <div className="absolute inset-0">
              <Image
                src={heroImage.url}
                alt={gallery.title}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
            </div>
            {/* Sophisticated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--maroon-red)]/80 via-[color:var(--maroon-red)]/60 to-[color:var(--dark-green)]/80" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </>
        )}
        
        {/* Fallback background for galleries without images */}
        {!heroImage && (
          <div className="absolute inset-0">
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: 'url(/galleries-bg.jpg)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--maroon-red)]/80 via-[color:var(--maroon-red)]/60 to-[color:var(--dark-green)]/80" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>
        )}

        <div className="container mx-auto px-6 md:px-8 relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Back button */}
            <div className="mb-12">
              <Link 
                href="/galleries"
                className="inline-flex items-center gap-2 text-[color:var(--off-white)]/80 hover:text-[color:var(--gold)] transition-colors group"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                <span className="font-light">Back to Galleries</span>
              </Link>
            </div>

            {/* Gallery info */}
            <div className="space-y-6 max-w-4xl">
              <h1 className="heading-display font-light text-[color:var(--off-white)] tracking-tight leading-tight">
                {gallery.title}
              </h1>
              
              {gallery.description && (
                <div className="w-24 h-px bg-[color:var(--gold)] mb-6" />
              )}
              
              {gallery.description && (
                <p className="text-xl md:text-2xl text-[color:var(--off-white)]/80 font-light max-w-3xl leading-relaxed">
                  {gallery.description}
                </p>
              )}

              <div className="flex items-center gap-2 pt-4">
                <Calendar className="h-4 w-4 text-[color:var(--gold)]/60" />
                <span className="text-lg text-[color:var(--off-white)]/80 font-light tracking-wide">{formatDate(gallery.date)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Images Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          {gallery.images.length > 0 ? (
            <GalleryImageViewer 
              images={gallery.images} 
              title={gallery.title}
            />
          ) : (
            <div className="text-center py-20">
              <Camera className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium text-foreground mb-2">No images in this gallery</h3>
              <p className="text-muted-foreground">Check back soon for updates</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}