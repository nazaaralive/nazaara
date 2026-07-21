'use client'
import Image from "next/image";
import { PublicArtist } from "@/lib/public-actions";

interface ArtistShowcaseProps {
  artists?: PublicArtist[];
  // Accept but ignore optional headline to maintain callsite compatibility
  headline?: string;
}

export default function ArtistShowcase({ artists }: ArtistShowcaseProps) {
  if (!artists || artists.length === 0) return null;

  const handleSocialClick = (platform: 'instagram' | 'soundcloud', handle?: string) => {
    if (!handle) return;
    
    if (platform === 'instagram') {
      window.open(`https://instagram.com/${handle.replace('@', '')}`, '_blank');
    } else if (platform === 'soundcloud') {
      window.open(`https://soundcloud.com/${handle.replace('@', '')}`, '_blank');
    }
  };

  return (
    <section className="relative py-12 lg:py-24">
      {/* Geometric Pattern Background */}
      <div className="absolute inset-0 opacity-[0.02]">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <pattern id="artist-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect x="25" y="25" width="50" height="50" fill="none" stroke="var(--gold)" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="2" fill="var(--gold)" opacity="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#artist-pattern)" />
        </svg>
      </div>

      <div className="relative container mx-auto px-4 md:px-6 lg:px-8">
        {/* Editorial Header - Similar to Venue Features */}
        <div className="mb-10 lg:mb-16">
          <div className="grid lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-[1px] w-12 bg-[var(--gold)]/40" />
                <span className="text-[9px] font-neue-haas uppercase tracking-[0.5em] text-[var(--gold)]/50">
                  Artist Lineup
                </span>
              </div>
              <h2 className="heading-section font-prettywise leading-[0.85] text-[var(--white)] mb-6">
                Meet The Artists
              </h2>
              <div className="flex items-baseline gap-6">
                <p className="text-base lg:text-2xl font-neue-haas text-[var(--white)]/70">
                  Live Performances & Special Guests
                </p>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--gold)]/30 to-transparent" />
              </div>
            </div>
          </div>
        </div>

        {/* Artists Grid - Premium Editorial Layout */}
        <div className={`hidden lg:grid gap-8 lg:gap-12 ${
          artists.length === 1 ? 'lg:grid-cols-1 max-w-2xl mx-auto' :
          artists.length === 2 ? 'lg:grid-cols-2 max-w-4xl mx-auto' :
          artists.length === 3 ? 'lg:grid-cols-3' :
          'lg:grid-cols-4'
        }`}>
          {artists.map((artist, index) => (
            <div 
              key={index}
              className="group relative"
            >
              {/* Artist Card - Magazine Style */}
              <div className="relative">
                {/* Geometric Frame Elements */}
                <div 
                  className="absolute -top-4 -left-4 w-8 h-8 border-t border-l" 
                  style={{ borderColor: 'var(--gold)', opacity: 0.3 }} 
                />
                <div 
                  className="absolute -bottom-4 -right-4 w-8 h-8 border-b border-r" 
                  style={{ borderColor: 'var(--gold)', opacity: 0.3 }} 
                />
                
                {/* Artist Image or Placeholder - Square Aspect */}
                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-[var(--maroon-red)]/20 to-[var(--maroon-red)]/5">
                  {artist.image ? (
                    <>
                      <Image
                        src={artist.image}
                        alt={artist.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--maroon-red)]/60 via-transparent to-transparent" />
                    </>
                  ) : (
                    <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105" style={{ backgroundColor: 'var(--black-grey)' }}>
                      {/* Simple border frame */}
                      <div 
                        className="absolute inset-4 border"
                        style={{ borderColor: 'var(--gold)', opacity: 0.1 }}
                      />
                      {/* Minimalist user icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg 
                          className="w-20 h-20" 
                          viewBox="0 0 24 24" 
                          fill="none"
                          style={{ color: 'var(--gold)', opacity: 0.15 }}
                        >
                          <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1" />
                          <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                        </svg>
                      </div>
                    </div>
                  )}
                  
                  {/* Social Media Icons */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:translate-x-0 translate-x-2">
                    {artist.instagram && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSocialClick('instagram', artist.instagram || "");
                        }}
                        className="w-9 h-9 flex items-center justify-center backdrop-blur-sm hover:scale-110 transition-transform duration-200"
                        style={{ backgroundColor: 'var(--gold)' }}
                      >
                        <Image
                          src="/instagram-svgrepo-com.svg"
                          alt="Instagram"
                          width={16}
                          height={16}
                          className="opacity-90"
                          style={{ filter: 'brightness(0) saturate(100%) invert(8%) sepia(46%) saturate(2916%) hue-rotate(316deg) brightness(94%) contrast(99%)' }}
                        />
                      </button>
                    )}
                    {artist.soundcloud && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSocialClick('soundcloud', artist.soundcloud || "");
                        }}
                        className="w-9 h-9 flex items-center justify-center backdrop-blur-sm hover:scale-110 transition-transform duration-200"
                        style={{ backgroundColor: 'var(--gold)' }}
                      >
                        <Image
                          src="/soundcloud-svgrepo-com.svg"
                          alt="SoundCloud"
                          width={16}
                          height={16}
                          className="opacity-90"
                          style={{ filter: 'brightness(0) saturate(100%) invert(8%) sepia(46%) saturate(2916%) hue-rotate(316deg) brightness(94%) contrast(99%)' }}
                        />
                      </button>
                    )}
                  </div>
                </div>

                {/* Artist Info - Typography Block */}
                <div className="mt-6">
                  {/* Name with decorative element */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rotate-45" style={{ backgroundColor: 'var(--gold)' }} />
                    <h3 className="text-2xl font-prettywise text-white group-hover:text-[var(--gold)] transition-colors duration-500">
                      {artist.name}
                    </h3>
                  </div>
                  
                  {/* Social handles if available */}
                  {(artist.instagram || artist.soundcloud) && (
                    <div className="flex items-center gap-2 mt-3 opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="h-px flex-1" style={{ backgroundColor: 'var(--gold)', opacity: 0.2 }} />
                      <div className="flex gap-3 text-[10px] uppercase tracking-[0.3em] text-white/40 group-hover:text-white/60 transition-colors duration-500">
                        {artist.instagram && (
                          <span>@{artist.instagram.replace('@', '')}</span>
                        )}
                        {artist.soundcloud && (
                          <span>SC</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Layout - Uniform rows, tight rhythm */}
        <div className="lg:hidden">
          {artists.map((artist, index) => (
            <div
              key={index}
              className={`flex items-center gap-5 py-5 ${
                index < artists.length - 1 ? "border-b border-[var(--gold)]/10" : ""
              }`}
            >
              {/* Artist Image */}
              <div className="flex-shrink-0 relative w-32 h-32 sm:w-36 sm:h-36 overflow-hidden">
                {artist.image ? (
                  <Image
                    src={artist.image}
                    alt={artist.name}
                    fill
                    sizes="144px"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0" style={{ backgroundColor: 'var(--black-grey)' }}>
                    <div className="absolute inset-2 border" style={{ borderColor: 'var(--gold)', opacity: 0.1 }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--gold)', opacity: 0.15 }}>
                        <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1" />
                        <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              {/* Artist Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-2xl sm:text-3xl font-prettywise text-white truncate">
                  {artist.name}
                </h3>
                {artist.instagram && (
                  <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-white/40 truncate">
                    @{artist.instagram.replace('@', '')}
                  </p>
                )}
              </div>

              {/* Social buttons */}
              <div className="flex-shrink-0 flex gap-2">
                {artist.instagram && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSocialClick('instagram', artist.instagram || "");
                    }}
                    className="w-8 h-8 flex items-center justify-center hover:scale-110 transition-transform duration-200 rounded-sm"
                    style={{ backgroundColor: 'var(--gold)', opacity: 0.85 }}
                  >
                    <Image
                      src="/instagram-svgrepo-com.svg"
                      alt="Instagram"
                      width={14}
                      height={14}
                      style={{ filter: 'brightness(0) saturate(100%) invert(8%) sepia(46%) saturate(2916%) hue-rotate(316deg) brightness(94%) contrast(99%)' }}
                    />
                  </button>
                )}
                {artist.soundcloud && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSocialClick('soundcloud', artist.soundcloud || "");
                    }}
                    className="w-8 h-8 flex items-center justify-center hover:scale-110 transition-transform duration-200 rounded-sm"
                    style={{ backgroundColor: 'var(--gold)', opacity: 0.85 }}
                  >
                    <Image
                      src="/soundcloud-svgrepo-com.svg"
                      alt="SoundCloud"
                      width={14}
                      height={14}
                      style={{ filter: 'brightness(0) saturate(100%) invert(8%) sepia(46%) saturate(2916%) hue-rotate(316deg) brightness(94%) contrast(99%)' }}
                    />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Decorative Element */}
        <div className="mt-8 lg:mt-16 flex justify-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-px" style={{ backgroundColor: 'var(--gold)', opacity: 0.3 }} />
            <div className="w-2 h-2 rotate-45" style={{ backgroundColor: 'var(--gold)', opacity: 0.5 }} />
            <div className="w-12 h-px" style={{ backgroundColor: 'var(--gold)', opacity: 0.3 }} />
          </div>
        </div>
      </div>
    </section>
  );
}
