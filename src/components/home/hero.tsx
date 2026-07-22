import { cookies } from "next/headers";
import { getPublicEventForCity, getPublicFeaturedEvent } from "@/lib/public-actions";
import HeroMobile from "./hero-mobile";
import HeroWrapper from "./hero-wrapper";
import HeroCtaWrapper from "./hero-cta-wrapper";

import HeroImage from "./hero-image";
import HeroButton from "./hero-button";

export default async function Hero() {
  const cookieStore = await cookies();
  const city = cookieStore.get("nza_city")?.value;
  const country = cookieStore.get("nza_country")?.value;
  
  const cityEvent = await getPublicEventForCity(city || "");
  const fallbackEvent = cityEvent ? null : await getPublicFeaturedEvent();
  const featuredEvent = cityEvent || fallbackEvent;

  if (!featuredEvent) {
    return (
      <>
        {/* Mobile Empty State */}
        <div className="md:hidden">
          <section className="relative min-h-[60dvh] overflow-hidden flex items-center justify-center" style={{ backgroundColor: 'var(--maroon-red)' }}>
            {/* Shadow Overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/50" />
            
            {/* Geometric Pattern Overlay */}
            <div className="absolute inset-0 opacity-10">
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <defs>
                  <pattern id="hero-pattern-empty" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                    <circle cx="30" cy="30" r="1" fill="var(--gold)" />
                    <path d="M0 30 L30 0 L60 30 L30 60 Z" stroke="var(--gold)" strokeWidth="0.5" fill="none" opacity="0.35" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#hero-pattern-empty)" />
              </svg>
            </div>
            
            <div className="relative text-center px-6 space-y-6">
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-[1px]" style={{ backgroundColor: 'var(--gold)', opacity: 0.6 }} />
                <span className="font-neue-haas text-[10px] uppercase tracking-[0.5em]" style={{ color: 'var(--gold)' }}>
                  Nazaara Live
                </span>
                <div className="w-12 h-[1px]" style={{ backgroundColor: 'var(--gold)', opacity: 0.6 }} />
              </div>
              
              <h2 className="font-prettywise text-5xl text-white leading-tight">
                New Events<br />Coming Soon
              </h2>
              
              <p className="font-neue-haas text-sm text-white/60 max-w-xs mx-auto">
                We&apos;re curating the next unforgettable experience. Stay tuned.
              </p>
            </div>
          </section>
        </div>
        
        {/* Desktop Empty State */}
        <div className="hidden md:block relative min-h-[60dvh] overflow-hidden" style={{ backgroundColor: 'var(--maroon-red)' }}>
          <section className="absolute inset-0">
            {/* Shadow Overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/50" />
            
            {/* Geometric Pattern Overlay */}
            <div className="absolute inset-0 opacity-10">
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <defs>
                  <pattern id="hero-pattern-empty-desktop" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                    <circle cx="30" cy="30" r="1" fill="var(--gold)" />
                    <path d="M0 30 L30 0 L60 30 L30 60 Z" stroke="var(--gold)" strokeWidth="0.5" fill="none" opacity="0.35" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#hero-pattern-empty-desktop)" />
              </svg>
            </div>
            
            <div className="relative container mx-auto px-4 md:px-6 lg:px-8">
              <div className="min-h-[60dvh] flex flex-col justify-center items-center text-center py-12">
                <div className="space-y-8 max-w-2xl">
                  <div className="flex items-center justify-center gap-4">
                    <div className="h-px w-16" style={{ backgroundColor: 'var(--gold)' }} />
                    <span className="text-[10px] uppercase tracking-[0.4em] font-light" style={{ color: 'var(--gold)' }}>
                      Nazaara Live
                    </span>
                    <div className="h-px w-16" style={{ backgroundColor: 'var(--gold)' }} />
                  </div>
                  
                  <h2 className="font-serif font-thin text-6xl lg:text-7xl xl:text-8xl leading-[0.9] text-white">
                    New Events<br />Coming Soon
                  </h2>
                  
                  <div className="flex items-center justify-center gap-6">
                    <div className="h-px w-24" style={{ backgroundColor: 'var(--gold)', opacity: 0.3 }} />
                    <p className="font-serif text-lg text-white/60 italic">
                      Stay tuned for our next experience
                    </p>
                    <div className="h-px w-24" style={{ backgroundColor: 'var(--gold)', opacity: 0.3 }} />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </>
    );
  }
  function isUnitedStates(country?: string | null): boolean {
    const c = (country || "").trim().toLowerCase();
    return c === "united states" || c === "united states of america" || c === "usa" || c === "us" || c === "u.s." || c === "u.s";
  }
  const ageLabel = isUnitedStates(featuredEvent.country) ? "21+" : "19+";

  // All artists including the headliner
  const featuringArtists = featuredEvent.artists || [];

  // Parse date for display
  const [day, month] = featuredEvent.date.split(' ');

  return (
    <>
      {/* Mobile Hero */}
      <div className="md:hidden">
        <HeroMobile />
      </div>
      
      {/* Desktop Hero */}
      <HeroWrapper 
        eventSlug={featuredEvent.slug} 
        className="hidden md:block relative min-h-[80dvh] overflow-hidden group cursor-pointer" 
        style={{ backgroundColor: 'var(--maroon-red)' }}
      >
        <section className="absolute inset-0">
      {/* Shadow Overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/50" />
      <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-transparent" />
      
      {/* Geometric Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <pattern id="hero-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="1" fill="var(--gold)" />
              <path d="M0 30 L30 0 L60 30 L30 60 Z" stroke="var(--gold)" strokeWidth="0.5" fill="none" opacity="0.35" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-pattern)" />
        </svg>
      </div>
      
      <div className="relative container mx-auto px-4 md:px-6 lg:px-8">
        <div className="min-h-[80dvh] flex flex-col justify-center py-8 lg:py-0">
          {/* Editorial Composition */}
          <div className="relative">
            {/* Asymmetric Content Layout */}
            <div className="relative grid lg:grid-cols-12 gap-8 lg:gap-0 items-center">
              {/* Left Content - Editorial Style */}
              <div className="lg:col-span-6 space-y-3 lg:space-y-4 z-20 lg:pr-12">
                {/* Nazaara Live Presents Label */}
                <div className="flex items-center gap-4">
                  <div className="h-px w-12" style={{ backgroundColor: 'var(--gold)' }} />
                  <span className="text-[10px] uppercase tracking-[0.4em] font-light" style={{ color: 'var(--gold)' }}>
                    Nazaara Live Presents
                  </span>
                </div>
                
                {/* Dynamic Title Composition */}
                <div className="space-y-0">
                  <div className="overflow-visible">
                    <h1 className={`font-serif font-thin leading-[1.02] pb-[0.08em] text-white md:py-2 ${
                      featuredEvent.tagline
                        ? 'text-[12vw] sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl'
                        : 'text-[14vw] sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl'
                    }`}>
                      {featuredEvent.title}
                    </h1>
                  </div>
                  {featuredEvent.tagline && (
                    <div className="flex items-baseline gap-4 mt-3">
                      <span className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-serif italic" style={{ color: 'var(--gold)' }}>
                        {featuredEvent.tagline}
                      </span>
                      <div className="h-px flex-1" style={{ backgroundColor: 'var(--gold)', opacity: 0.3 }} />
                    </div>
                  )}
                </div>
                
                {/* Featured Artists Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] uppercase tracking-[0.4em]" style={{ color: 'var(--gold)/60' }}>Featuring</span>
                    <div className="h-px flex-1" style={{ backgroundColor: 'var(--gold)', opacity: 0.2 }} />
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {featuringArtists.map((artist, index) => {
                      const ig = artist.instagram?.trim();
                      const name = artist.name.trim();
                      const href = ig ? `https://instagram.com/${ig}` : undefined;
                      return (
                        <div key={index} className="flex items-baseline gap-2">
                          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--gold)' }} />
                          {href ? (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-base font-serif text-white hover:text-[var(--gold)] transition-colors"
                            >
                              {name}
                            </a>
                          ) : (
                            <p className="text-base font-serif text-white">{name}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Event Details - Editorial Layout */}
                <div className="relative">
                  {/* Top accent line */}
                  <div className="absolute top-0 left-0 w-16 h-px" style={{ backgroundColor: 'var(--gold)' }} />
                  
                  <div className="pt-5 space-y-3">
                    {/* Venue */}
                    <div className="flex items-start gap-8">
                      <div className="flex-1">
                        {(() => {
                          const mapsHref =
                            featuredEvent.venueAddressUrl ||
                            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              featuredEvent.venueAddress || `${featuredEvent.venue}, ${featuredEvent.city}, ${featuredEvent.country}`
                            )}`;
                          return (
                            <>
                              <a
                                href={mapsHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-lg font-serif text-white mb-1 inline-block hover:text-[var(--gold)] transition-colors"
                              >
                                {featuredEvent.venue}
                              </a>
                              <a
                                href={mapsHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-xs uppercase tracking-[0.2em] text-white/40 hover:text-[var(--gold)]/80 transition-colors"
                              >
                                {featuredEvent.city}, {featuredEvent.country}
                              </a>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    
                    {/* Bottom details strip */}
                    <div className="flex items-center gap-4 text-xs uppercase tracking-[0.3em] text-white/60">
                      <span style={{ color: 'var(--gold)' }}>{ageLabel}</span>
                      <div className="w-px h-3" style={{ backgroundColor: 'var(--gold)', opacity: 0.4 }} />
                      <span>ID Required</span>
                    </div>
                  </div>
                </div>

                {/* CTA Section */}
                <HeroCtaWrapper className="flex items-center gap-6 pt-1">
                  {/* TEMPORARY: Pass ticketUrl for redirect */}
                  <HeroButton eventSlug={featuredEvent.slug} ticketUrl={featuredEvent.ticketUrl || ""} />
                </HeroCtaWrapper>
              </div>
              
              {/* Right - Creative Poster Layout */}
              <div className="lg:col-span-6 relative flex justify-center lg:justify-center">
                {/* TEMPORARY: Pass ticketUrl for redirect */}
                <HeroImage 
                  eventSlug={featuredEvent.slug}
                  ticketUrl={featuredEvent.ticketUrl || ""}
                  src={featuredEvent.image || ""}
                  alt={featuredEvent.title}
                  day={day}
                  month={month}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
        </section>
      </HeroWrapper>
    </>
  )
}
