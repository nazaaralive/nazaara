import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { getPublicEventForCity, getPublicFeaturedEvent } from "@/lib/public-actions";
import HeroMobileButton from "./hero-mobile-button";
import HeroMobileTitle from "./hero-mobile-title";

export default async function HeroMobile() {
  const cookieStore = await cookies();
  const city = cookieStore.get("nza_city")?.value;
  const country = cookieStore.get("nza_country")?.value;
  console.log("[HeroMobile] geo cookies:", { city: city || "<not set>", country: country || "<not set>" });
  
  const cityEvent = await getPublicEventForCity(city || "");
  const fallbackEvent = cityEvent ? null : await getPublicFeaturedEvent();
  const featuredEvent = cityEvent || fallbackEvent;

  if (cityEvent) {
    console.log("[HeroMobile][Selection] Chose event from getPublicEventForCity", {
      city,
      slug: cityEvent.slug,
      title: cityEvent.title,
      eventCity: cityEvent.city,
      startTime: cityEvent.startTime,
      reason: "City-specific event match or tour stop"
    });
  } else if (fallbackEvent) {
    console.log("[HeroMobile][Selection] Chose event from getPublicFeaturedEvent (fallback)", {
      city: city || "none",
      slug: fallbackEvent.slug,
      title: fallbackEvent.title,
      eventCity: fallbackEvent.city,
      startTime: fallbackEvent.startTime,
      reason: "No city match - using first upcoming event"
    });
  }

  if (!featuredEvent) {
    console.log("[HeroMobile] no event – showing empty state");
    return (
      <section className="relative min-h-[60dvh] overflow-hidden flex items-center justify-center" style={{ backgroundColor: 'var(--maroon-red)' }}>
        {/* Shadow Overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/50" />
        
        {/* Geometric Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <defs>
              <pattern id="hero-pattern-mobile-empty" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="1" fill="var(--gold)" />
                <path d="M0 30 L30 0 L60 30 L30 60 Z" stroke="var(--gold)" strokeWidth="0.5" fill="none" opacity="0.35" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-pattern-mobile-empty)" />
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
    );
  }

  console.log("[HeroMobile] chosen event:", featuredEvent.slug);
  function isUnitedStates(country?: string | null): boolean {
    const c = (country || "").trim().toLowerCase();
    return c === "united states" || c === "united states of america" || c === "usa" || c === "us" || c === "u.s." || c === "u.s";
  }
  const ageLabel = isUnitedStates(featuredEvent.country) ? "21+" : "19+";
  
  // Format time in UTC without timezone conversion - extract time components directly from ISO string
  const formatTime = (dateString: string | Date) => {
    const dateStr = typeof dateString === 'string' ? dateString : dateString.toISOString();
    // Extract HH:mm from the ISO string (e.g., "2025-10-16T15:00:00Z" -> 15:00)
    const match = dateStr.match(/T(\d{2}):(\d{2})/);
    if (!match) return '';
    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes === 0 ? '' : `:${minutes.toString().padStart(2, '0')}`;
    return `${displayHours}${displayMinutes}${ampm}`;
  };
  
  const startTimeStr = formatTime(featuredEvent.startTime);
  
  // All artists including the headliner
  const featuringArtists = featuredEvent.artists || [];
  const [day, month] = featuredEvent.date.split(' ');

  return (
    <section className="relative min-h-[100dvh] overflow-hidden" style={{ backgroundColor: 'var(--maroon-red)' }}>
      {/* Shadow Overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/50" />
      <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-transparent" />
      
      {/* Geometric Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <pattern id="hero-pattern-mobile" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="1" fill="var(--gold)" />
              <path d="M0 30 L30 0 L60 30 L30 60 Z" stroke="var(--gold)" strokeWidth="0.5" fill="none" opacity="0.35" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-pattern-mobile)" />
        </svg>
      </div>
      
      <div className="relative flex flex-col min-h-[100dvh]">
        {/* Elevated header */}
        <div className="relative px-6 pt-8 pb-6">
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 h-[1px]" style={{ backgroundColor: 'var(--gold)', opacity: 0.6 }} />
            <span className="font-neue-haas text-[10px] uppercase tracking-[0.5em]" style={{ color: 'var(--gold)' }}>
              Nazaara Live Presents
            </span>
            <div className="w-8 h-[1px]" style={{ backgroundColor: 'var(--gold)', opacity: 0.6 }} />
          </div>
        </div>
        
        {/* Creative poster layout */}
        <div className="relative px-6 pb-6">
          <div className="relative">
            {/* Artistic torn paper effect background */}
            <div className="absolute inset-0 -rotate-1 scale-105" style={{ backgroundColor: 'var(--white)', opacity: 0.03 }} />
            <div className="absolute inset-0 rotate-1 scale-102" style={{ backgroundColor: 'var(--gold)', opacity: 0.02 }} />
            
            {/* Main poster container */}
            <Link href={`/event/${featuredEvent.slug}`}>
              <div className="relative aspect-[3/4] overflow-hidden shadow-2xl cursor-pointer">
                <Image 
                  src={featuredEvent.image || ""}
                  alt={featuredEvent.title}
                  fill
                  className="object-cover"
                  priority
                />
                
                {/* Vintage photo corner tabs */}
                <div className="absolute -top-1 left-4 w-4 h-3 rotate-12" style={{ 
                  backgroundColor: 'var(--gold)', 
                  opacity: 0.15,
                  clipPath: 'polygon(0% 0%, 100% 0%, 85% 100%, 15% 100%)'
                }} />
                <div className="absolute -top-1 right-4 w-4 h-3 -rotate-12" style={{ 
                  backgroundColor: 'var(--gold)', 
                  opacity: 0.15,
                  clipPath: 'polygon(0% 0%, 100% 0%, 85% 100%, 15% 100%)'
                }} />
                
                {/* Floating date element - separate from image */}
                <div className="absolute -bottom-4 -right-4 w-16 h-16 flex items-center justify-center" style={{ 
                  backgroundColor: 'var(--maroon-red)',
                  border: '2px solid var(--gold)',
                  borderRadius: '50%'
                }}>
                  <div className="text-center">
                    <p className="font-prettywise text-xl leading-none" style={{ color: 'var(--gold)' }}>
                      {day}
                    </p>
                    <p className="font-neue-haas text-[7px] uppercase tracking-wider" style={{ color: 'var(--white)', opacity: 0.7 }}>
                      {month}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
        
        {/* Content section with creative typography */}
        <div className="relative flex-1 px-6 pb-8">
          <div className="space-y-8">
            {/* Title composition */}
            <div className="relative">
              <HeroMobileTitle title={featuredEvent.title} />
              {featuredEvent.tagline && (
                <p className="font-neue-haas text-sm leading-relaxed mt-4 pl-8" style={{ color: 'var(--white)', opacity: 0.7 }}>
                  {featuredEvent.tagline}
                </p>
              )}
            </div>
            
            {/* Artists showcase - asymmetric layout */}
            {featuringArtists.length > 0 && (
              <div className="relative pl-8">
                <div className="absolute left-0 top-0 bottom-0 w-[1px]" style={{ backgroundColor: 'var(--gold)', opacity: 0.4 }} />
                <span className="font-neue-haas text-[9px] uppercase tracking-[0.5em]" style={{ color: 'var(--gold)', opacity: 0.8 }}>
                  Featuring
                </span>
                <div className="mt-3 space-y-1">
                  {featuringArtists.map((artist, index) => {
                    const ig = artist.instagram?.trim();
                    const name = artist.name.trim();
                    const href = ig ? `https://instagram.com/${ig}` : undefined;
                    return href ? (
                      <a
                        key={index}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block font-prettywise text-2xl hover:text-[var(--gold)] transition-colors"
                        style={{ color: 'var(--white)', opacity: 0.9 - index * 0.1 }}
                      >
                        {name}
                      </a>
                    ) : (
                      <p
                        key={index}
                        className="font-prettywise text-2xl"
                        style={{ color: 'var(--white)', opacity: 0.9 - index * 0.1 }}
                      >
                        {name}
                      </p>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Venue & time - minimalist approach */}
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
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
                          className="font-prettywise text-xl hover:text-[var(--gold)] transition-colors"
                          style={{ color: 'var(--white)' }}
                        >
                          {featuredEvent.venue}
                        </a>
                        <a
                          href={mapsHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-neue-haas text-[10px] uppercase tracking-[0.3em] mt-1 block hover:text-[var(--gold)]/80 transition-colors"
                          style={{ color: 'var(--white)', opacity: 0.5 }}
                        >
                          {featuredEvent.city}, {featuredEvent.country}
                        </a>
                      </>
                    );
                  })()}
                </div>
                <div className="text-right">
                  <p className="font-prettywise text-3xl" style={{ color: 'var(--gold)' }}>
                    {startTimeStr}
                  </p>
                  <p className="font-neue-haas text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--white)', opacity: 0.5 }}>
                    Doors Open
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Elevated CTA section */}
        <div className="sticky bottom-0 px-6 pb-8 pt-6 relative">
          {/* Subtle pattern overlay for CTA section */}
          <div className="absolute inset-0 opacity-5">
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <defs>
                <pattern id="hero-pattern-cta" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                  <circle cx="30" cy="30" r="1" fill="var(--gold)" />
                  <path d="M0 30 L30 0 L60 30 L30 60 Z" stroke="var(--gold)" strokeWidth="0.5" fill="none" opacity="0.35" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hero-pattern-cta)" />
            </svg>
          </div>
          <HeroMobileButton eventSlug={featuredEvent.slug} ticketUrl={featuredEvent.ticketUrl || ""} asChild>
            <button className="relative w-full overflow-hidden group">
              {/* Creative button design */}
              <div className="absolute inset-0" style={{ backgroundColor: 'var(--gold)' }} />
              <div className="absolute inset-0 flex items-center justify-between px-6">
                <div className="w-8 h-[1px]" style={{ backgroundColor: 'var(--maroon-red)', opacity: 0.3 }} />
                <div className="w-8 h-[1px]" style={{ backgroundColor: 'var(--maroon-red)', opacity: 0.3 }} />
              </div>
              <div className="relative py-5 flex items-center justify-center">
                <span className="font-neue-haas text-[11px] uppercase tracking-[0.5em] font-medium" style={{ color: 'var(--maroon-red)' }}>
                  Reserve Your Spot
                </span>
              </div>
            </button>
          </HeroMobileButton>
          
          {/* Minimal info bar */}
          <div className="mt-4 flex items-center justify-center gap-6">
            <span className="font-neue-haas text-[9px] uppercase tracking-[0.3em]" style={{ color: 'var(--gold)', opacity: 0.7 }}>
              {ageLabel}
            </span>
            <span className="font-neue-haas text-[9px] uppercase tracking-[0.3em]" style={{ color: 'var(--white)', opacity: 0.4 }}>
              Limited Capacity
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
