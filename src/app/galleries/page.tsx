import { getPublicGalleries } from "@/lib/public-actions"
import { GalleryGrid } from "@/components/galleries/gallery-grid"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Galleries - Nazaara Live",
  description: "Explore our collection of event photos from Nazaara Live shows across the world.",
  openGraph: {
    title: "Galleries - Nazaara Live",
    description: "Explore our collection of event photos from Nazaara Live shows across the world.",
    url: "https://nazaara.live/galleries",
    siteName: "Nazaara Live",
    locale: "en_US",
    type: "website",
  },
}

export const revalidate = 0

export default async function GalleriesPage() {
  const galleries = await getPublicGalleries()

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-14 lg:py-24 md:py-40 overflow-hidden">
        {/* Background image with overlays */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: 'url(/galleries-bg.jpg)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--maroon-red)]/80 via-[color:var(--maroon-red)]/60 to-[color:var(--dark-green)]/80" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>
        
        <div className="container mx-auto px-6 md:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="heading-display font-light text-[color:var(--off-white)] tracking-tight leading-tight">
              Event
              <span className="block text-[color:var(--gold)] font-medium">Galleries</span>
            </h1>
            <div className="w-24 h-px bg-[color:var(--gold)] mx-auto" />
            <p className="text-xl md:text-2xl text-[color:var(--off-white)]/80 font-light max-w-2xl mx-auto leading-relaxed">
              Relive the moments from our
              <span className="text-[color:var(--gold)] font-medium"> unforgettable events</span>
            </p>
          </div>
        </div>
      </section>

      {/* Gallery Grid Section */}
      <section className="pb-24 md:pb-40 -mt-12 relative z-20">
        <div className="container mx-auto px-6 md:px-8">
          <GalleryGrid galleries={galleries} />
        </div>
      </section>
    </div>
  )
}