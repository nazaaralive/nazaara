import Image from "next/image";
import { PublicEvent } from "@/lib/public-actions";

interface VenueFeaturesProps {
  event: PublicEvent;
}

export default function VenueFeatures({ event }: VenueFeaturesProps) {
  // Intentionally simplified: feature details may be added later

  return (
    <section className="relative py-16 sm:py-20 lg:py-32 overflow-hidden">
      {/* Subtle Pattern Background */}
      <div className="absolute inset-0 opacity-[0.01]">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <pattern id="venue-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="1" fill="var(--gold)" />
              <path d="M0 30 L30 0 L60 30 L30 60 Z" stroke="var(--gold)" strokeWidth="0.5" fill="none" opacity="0.35" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#venue-pattern)" />
        </svg>
      </div>

      <div className="relative container mx-auto px-6 sm:px-6 md:px-6 lg:px-8">
        {/* Minimal Header */}
        <div className="mb-12 sm:mb-16 lg:mb-20">
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="h-px w-8 sm:w-12" style={{ backgroundColor: 'var(--gold)', opacity: 0.4 }} />
            <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.35em] sm:tracking-[0.4em] font-light" style={{ color: 'var(--gold)', opacity: 0.6 }}>
              The Venue
            </span>
          </div>
          <h2 className="text-[2rem] sm:heading-section font-serif font-thin leading-[0.95] sm:leading-[0.9] text-white mb-3 sm:mb-4">
            {event.venue}
          </h2>
          {(() => {
            const addressText = event.venueAddress ?? `${event.city}, ${event.country}`;
            if (event.venueAddressUrl) {
              return (
                <a
                  href={event.venueAddressUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base sm:text-lg font-light text-white/60 hover:text-[var(--gold)]/80 transition-colors underline-offset-4 hover:underline"
                >
                  {addressText}
                </a>
              );
            }
            return (
              <p className="text-base sm:text-lg font-light text-white/60">{addressText}</p>
            );
          })()}
        </div>

        {/* Venue Description */}
        {event.venueDescription && (
          <div className="relative mb-10 sm:mb-12 lg:mb-16 ml-6 sm:ml-8">
            {/* Subtle left accent */}
            <div className="absolute -left-6 sm:-left-8 top-0 bottom-0 w-px bg-gradient-to-b from-[var(--gold)]/30 via-[var(--gold)]/10 to-transparent" />
            
            <div className="max-w-2xl">
              <p className="text-[13px] sm:text-sm lg:text-base font-light text-white/60 leading-[1.7] sm:leading-relaxed italic">
                {event.venueDescription}
              </p>
            </div>
          </div>
        )}

        {/* Mobile-optimized Image Grid */}
        <div className="space-y-3 sm:space-y-4 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-6">
          {/* Large feature image - full width on mobile */}
          <div className="lg:col-span-7 relative aspect-[16/10] sm:aspect-[4/3] lg:aspect-auto lg:h-full overflow-hidden rounded-sm">
            {/* Frame accents */}
            <div className="absolute -top-2 -left-2 sm:-top-4 sm:-left-4 w-12 sm:w-16 h-12 sm:h-16 border-t border-l" style={{ borderColor: 'var(--gold)', opacity: 0.2 }} />
            {event.venueImages?.[0] ? (
              <>
                <Image
                  src={event.venueImages[0]}
                  alt={`${event.venue} interior 1`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--gold)]/10 via-transparent to-[var(--dark-green)]/30" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--gold)]/20 via-[var(--maroon-red)]/30 to-[var(--dark-green)]/40" />
            )}
          </div>
          
          {/* Mobile: Side-by-side smaller images */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-1 lg:col-span-5 lg:gap-6">
            <div className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden rounded-sm">
              <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 w-10 sm:w-12 h-10 sm:h-12 border-t border-r" style={{ borderColor: 'var(--turquoise)', opacity: 0.2 }} />
              {event.venueImages?.[1] ? (
                <>
                  <Image
                    src={event.venueImages[1]}
                    alt={`${event.venue} interior 2`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 40vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--turquoise)]/10 to-[var(--dark-green)]/20" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--turquoise)]/20 to-[var(--dark-green)]/30" />
              )}
            </div>
            <div className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden rounded-sm">
              <div className="absolute -bottom-2 -right-2 sm:-bottom-4 sm:-right-4 w-10 sm:w-12 h-10 sm:h-12 border-b border-r" style={{ borderColor: 'var(--gold)', opacity: 0.2 }} />
              {event.venueImages?.[2] ? (
                <>
                  <Image
                    src={event.venueImages[2]}
                    alt={`${event.venue} interior 3`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 40vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--maroon-red)]/10 to-[var(--gold)]/10" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--maroon-red)]/20 to-[var(--gold)]/10" />
              )}
            </div>
          </div>
        </div>

        {/* Bottom accent */}
        <div className="mt-12 sm:mt-16 flex justify-center">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 sm:w-16 h-px" style={{ backgroundColor: 'var(--gold)', opacity: 0.3 }} />
            <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rotate-45" style={{ backgroundColor: 'var(--gold)', opacity: 0.5 }} />
            <div className="w-12 sm:w-16 h-px" style={{ backgroundColor: 'var(--gold)', opacity: 0.3 }} />
          </div>
        </div>
      </div>
    </section>
  );
}
