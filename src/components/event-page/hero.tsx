import Image from "next/image";
import { PublicEvent, getPublicEventStops } from "@/lib/public-actions";

interface EventHeroProps {
  event: PublicEvent;
}

export default async function EventHero({ event }: EventHeroProps) {
  // All artists including the headliner
  const supportingArtists = event.artists ?? [];

  function isUnitedStates(country?: string | null): boolean {
    const c = (country || "").trim().toLowerCase();
    return c === "united states" || c === "united states of america" || c === "usa" || c === "us" || c === "u.s." || c === "u.s";
  }

  const ageLabel = isUnitedStates(event.country) ? "21+" : "19+";

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

    return `${displayHours}${displayMinutes}${ampm} `;
  };

  const startTimeStr = formatTime(event.startTime);
  const endTimeStr = formatTime(event.endTime);

  const stops = await getPublicEventStops(event.id)

  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: 'var(--maroon-red)' }}>
      {/* Gradient darkening towards bottom right */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/25" />
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--gold)]/[0.02] via-transparent to-black/15" />

      {/* Dot matrix pattern - modern and subtle */}
      <div className="absolute inset-0 opacity-[0.02] md:opacity-[0.04]">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <pattern id="dots-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              {/* Gradient of dots getting smaller */}
              <circle cx="10" cy="10" r="0.8" fill="var(--gold)" />
              <circle cx="30" cy="10" r="0.6" fill="var(--gold)" opacity="0.8" />
              <circle cx="10" cy="30" r="0.6" fill="var(--gold)" opacity="0.8" />
              <circle cx="30" cy="30" r="0.4" fill="var(--gold)" opacity="0.6" />
              <circle cx="20" cy="20" r="1" fill="var(--gold)" opacity="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots-pattern)" />
        </svg>
      </div>

      {/* Additional darkening overlay for bottom right corner */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent via-50% to-[var(--dark-green)]/10" />

      {/* Main Container */}
      <div className="relative px-5 sm:px-6 lg:px-12 py-8 sm:py-10 lg:py-16">
        <div className="max-w-[1600px] mx-auto flex items-center">

          {/* Mobile Layout - Sandwich Style */}
          <div className="lg:hidden w-full space-y-8">
            {/* Mobile Title Section - Above Poster */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="h-[1px] w-8 bg-[var(--gold)]/30" />
                <p className="text-[8px] font-neue-haas uppercase tracking-[0.4em] text-[var(--gold)]/50">Nazaara Live Presents</p>
                <div className="h-[1px] w-8 bg-[var(--gold)]/30" />
              </div>
              <h1 className="text-[clamp(2.5rem,10vw,3.5rem)] font-prettywise leading-[0.85] text-[var(--white)] mb-2">
                {event.title}
              </h1>
              {event.tagline && (
                <p className="text-xl font-prettywise text-[var(--gold)]">
                  {event.tagline}
                </p>
              )}
            </div>

            {/* Mobile Poster */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-[320px] sm:max-w-[380px]">
                {/* Enhanced Gold accent frame */}
                <div className="absolute -inset-[2px] bg-gradient-to-br from-[var(--gold)] via-[var(--gold)]/50 to-transparent opacity-60" />
                <div className="absolute -inset-[1px] bg-[var(--maroon-red)]" />

                {/* Main Poster with enhanced presentation */}
                <div className="relative w-full">
                  <div className="relative aspect-[4/5] overflow-hidden bg-[var(--dark-green)]/20">
                    {event.image && (
                      <Image
                        src={event.image}
                        alt={event.title}
                        fill
                        className="object-cover"
                        priority
                        sizes="(max-width: 640px) 320px, 380px"
                      />
                    )}
                    {/* Premium vignette effects */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--maroon-red)]/40 via-transparent to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--dark-green)]/20 via-transparent to-transparent" />
                  </div>

                  {/* Floating gold accent date element - top right */}
                  <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-16 h-16 sm:w-18 sm:h-18 bg-[var(--gold)] flex flex-col items-center justify-center">
                    <p className="text-xl sm:text-2xl font-prettywise text-[var(--maroon-red)]">{event.date.split(' ')[0]}</p>
                    <p className="text-[8px] sm:text-[9px] font-neue-haas uppercase tracking-[0.3em] text-[var(--maroon-red)]">{event.date.split(' ')[1]}</p>
                  </div>

                  {/* Corner accents */}
                  <div className="absolute -bottom-2 -left-2 w-12 h-12 sm:w-14 sm:h-14 border-l-2 border-b-2 border-[var(--gold)]/40" />
                  <div className="absolute -top-2 -left-2 w-12 h-12 sm:w-14 sm:h-14 border-l-2 border-t-2 border-[var(--gold)]/40" />
                </div>
              </div>
            </div>

            {/* Mobile Details Section - Below Poster */}
            <div className="space-y-6">
              {/* Supporting Artists */}
              {supportingArtists.length > 0 && (
                <div className="text-center">
                  <span className="text-[8px] font-neue-haas uppercase tracking-[0.4em] text-[var(--gold)]/50 block mb-1">
                    Featuring
                  </span>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    {supportingArtists.map((artist, index) => {
                      const ig = artist.instagram?.trim();
                      const name = artist.name.trim();
                      const href = ig ? `https://instagram.com/${ig}` : undefined;

                      return (
                        <div key={index} className="flex items-center gap-3">
                          {href ? (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-prettywise text-lg text-[var(--white)] hover:text-[var(--gold)] transition-colors"
                            >
                              {name}
                            </a>
                          ) : (
                            <p className="font-prettywise text-lg text-[var(--white)]">{name}</p>
                          )}
                          {index < supportingArtists.length - 1 && (
                            <div className="w-2 h-2 rotate-45 border border-[var(--gold)]/40" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Event Details - Only for non-tour events */}
              {stops.length === 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-[1px] flex-1 bg-[var(--gold)]/20" />
                    <p className="text-[8px] font-neue-haas uppercase tracking-[0.4em] text-[var(--gold)]/40">Event Details</p>
                    <div className="h-[1px] flex-1 bg-[var(--gold)]/20" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <p className="text-[8px] font-neue-haas uppercase tracking-[0.4em] text-[var(--gold)]/40 mb-1">Venue</p>
                      {(() => {
                        const mapsHref = event.venueAddressUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          event.venueAddress || `${event.venue}, ${event.city}, ${event.country}`
                        )}`;
                        return (
                          <a
                            href={mapsHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-base font-prettywise text-[var(--white)] hover:text-[var(--gold)] transition-colors"
                          >
                            {event.venue}
                          </a>
                        );
                      })()}
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-neue-haas uppercase tracking-[0.4em] text-[var(--gold)]/40 mb-1">Date & Time</p>
                      <div className="space-y-0.5">
                        <p className="text-base font-prettywise text-[var(--white)]">{event.date}</p>
                        <p className="text-sm font-neue-haas text-[var(--white)]/80">{startTimeStr} - {endTimeStr}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tour Stops - FIX: Now a sibling block, not nested inside stops.length === 0 */}
              {stops.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-[1px] flex-1 bg-[var(--gold)]/20" />
                    <p className="text-[8px] font-neue-haas uppercase tracking-[0.4em] text-[var(--gold)]/40">Tour Stops</p>
                    <div className="h-[1px] flex-1 bg-[var(--gold)]/20" />
                  </div>
                  <ul className="space-y-3">
                    {stops.map((s, i) => {
                      // Format date in UTC to avoid timezone conversion
                      const d = new Date(s.startTime)
                      const day = d.getUTCDate().toString().padStart(2, '0')
                      const month = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })
                      const dateStr = `${day} ${month}`
                      const timeStr = formatTime(s.startTime)

                      return (
                        <li key={i} className="flex items-center justify-between gap-3 text-[var(--white)]">
                          <div>
                            <p className="font-prettywise text-base">{s.city}, {s.country}</p>
                            {s.venue && (
                              <p className="text-xs text-[var(--white)]/70">{s.venue}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-sm font-neue-haas block">{dateStr}</span>
                              <span className="text-xs font-neue-haas text-[var(--white)]/70">{timeStr}</span>
                            </div>
                            {s.ticketUrl ? (
                              <a
                                href={s.ticketUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 text-[10px] uppercase tracking-[0.2em] bg-[var(--gold)] text-[var(--maroon-red)]"
                              >
                                Tickets
                              </a>
                            ) : (
                              <span className="px-3 py-1 text-[10px] uppercase tracking-[0.2em] bg-[var(--gold)]/30 text-[var(--gold)]/90">TBA</span>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              {/* CTA Section (hidden for tours) */}
              {stops.length === 0 && (
                <div className="flex justify-center">
                  {event.ticketUrl ? (
                    <a
                      href={event.ticketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative w-full overflow-hidden group block"
                    >
                      {/* Creative button design */}
                      <div className="absolute inset-0" style={{ backgroundColor: 'var(--gold)' }} />
                      <div className="absolute inset-0 flex items-center justify-between px-6">
                        <div className="w-8 h-[1px]" style={{ backgroundColor: 'var(--maroon-red)', opacity: 0.3 }} />
                        <div className="w-8 h-[1px]" style={{ backgroundColor: 'var(--maroon-red)', opacity: 0.3 }} />
                      </div>
                      <div className="relative py-5 flex items-center justify-center">
                        <span className="font-neue-haas text-[11px] uppercase tracking-[0.5em] font-medium"
                              style={{ color: 'var(--maroon-red)' }}>
                          Reserve Your Spot
                        </span>
                      </div>
                    </a>
                  ) : (
                    <button className="relative w-full overflow-hidden group" disabled>
                      {/* Creative button design */}
                      <div className="absolute inset-0" style={{ backgroundColor: 'var(--gold)' }} />
                      <div className="absolute inset-0 flex items-center justify-between px-6">
                        <div className="w-8 h-[1px]" style={{ backgroundColor: 'var(--maroon-red)', opacity: 0.3 }} />
                        <div className="w-8 h-[1px]" style={{ backgroundColor: 'var(--maroon-red)', opacity: 0.3 }} />
                      </div>
                      <div className="relative py-5 flex items-center justify-center">
                        <span className="font-neue-haas text-[11px] uppercase tracking-[0.5em] font-medium"
                              style={{ color: 'var(--maroon-red)' }}>
                          Coming Soon
                        </span>
                      </div>
                    </button>
                  )}
                </div>
              )}

              {/* Minimal info bar */}
              <div className="mt-4 flex items-center justify-center gap-6">
                <span className="font-neue-haas text-[9px] uppercase tracking-[0.3em]"
                      style={{ color: 'var(--gold)', opacity: 0.7 }}>
                  {ageLabel}
                </span>
                <span className="font-neue-haas text-[9px] uppercase tracking-[0.3em]"
                      style={{ color: 'var(--white)', opacity: 0.4 }}>
                  ID Required
                </span>
                <span className="font-neue-haas text-[9px] uppercase tracking-[0.3em]"
                      style={{ color: 'var(--white)', opacity: 0.4 }}>
                  Limited Capacity
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Layout - Content Left, Image Right */}
          <div className="hidden lg:grid lg:grid-cols-2 md:gap-8 xl:gap-0 items-center w-full">

            {/* Desktop Event Information - Now on Left */}
            <div className="flex flex-col justify-center ">
              <div className="space-y-8 max-w-xl mx-auto">
                {/* Title Block */}
                <div>
                  {/* Nazaara Live Presents Label */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-[1px] w-8 bg-[var(--gold)]/30" />
                    <p className="text-[9px] font-neue-haas uppercase tracking-[0.5em] text-[var(--gold)]/50">Nazaara Live Presents</p>
                  </div>

                  <h1 className="text-[clamp(3rem,7vw,6rem)] font-prettywise leading-[0.85] text-[var(--white)] mb-3">
                    {event.title}
                  </h1>
                  {event.tagline && (
                    <p className="text-3xl font-prettywise text-[var(--gold)] mb-4">
                      {event.tagline}
                    </p>
                  )}
                </div>

                {/* Supporting Artists */}
                {supportingArtists.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[8px] font-neue-haas uppercase tracking-[0.4em] text-[var(--gold)]/40">Featuring</p>
                    <p className="text-base font-prettywise text-[var(--white)]">
                      {supportingArtists.map((artist, index) => {
                        const ig = artist.instagram?.trim();
                        const name = artist.name.trim();
                        const href = ig ? `https://instagram.com/${ig}` : undefined;
                        const isLast = index === supportingArtists.length - 1;

                        return (
                          <span key={`artist-${index}`}>
                            {href ? (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-[var(--gold)] transition-colors"
                              >
                                {name}
                              </a>
                            ) : (
                              <span>{name}</span>
                            )}
                            {!isLast && <span>, </span>}
                          </span>
                        );
                      })}
                    </p>
                  </div>
                )}

                {/* Event Details */}
                <div className="space-y-4">
                  {stops.length === 0 && (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="h-[1px] w-8 bg-[var(--gold)]/20" />
                        <p className="text-[9px] font-neue-haas uppercase tracking-[0.5em] text-[var(--gold)]/40">Event Details</p>
                        <div className="h-[1px] flex-1 bg-[var(--gold)]/20" />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-[9px] font-neue-haas uppercase tracking-[0.5em] text-[var(--gold)]/40 mb-1.5">Venue</p>
                          {(() => {
                            const mapsHref = event.venueAddressUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              event.venueAddress || `${event.venue}, ${event.city}, ${event.country}`
                            )}`;
                            return (
                              <a
                                href={mapsHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-lg font-prettywise text-[var(--white)] hover:text-[var(--gold)] transition-colors"
                              >
                                {event.venue}
                              </a>
                            );
                          })()}
                        </div>
                        <div>
                          <p className="text-[9px] font-neue-haas uppercase tracking-[0.5em] text-[var(--gold)]/40 mb-1.5">Date & Time</p>
                          <div className="space-y-0.5">
                            <p className="text-lg font-prettywise text-[var(--white)]">{event.date}</p>
                            <p className="text-sm font-neue-haas text-[var(--white)]/80">{startTimeStr} - {endTimeStr}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {stops.length > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-[1px] w-8 bg-[var(--gold)]/20" />
                        <p className="text-[9px] font-neue-haas uppercase tracking-[0.5em] text-[var(--gold)]/40">Tour Stops</p>
                        <div className="h-[1px] flex-1 bg-[var(--gold)]/20" />
                      </div>
                      <div className="divide-y divide-[var(--gold)]/10 border border-[var(--gold)]/10">
                        {stops.map((s, i) => {
                          // Format date in UTC to avoid timezone conversion
                          const d = new Date(s.startTime)
                          const day = d.getUTCDate().toString().padStart(2, '0')
                          const month = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })
                          const dateStr = `${day} ${month}`
                          const timeStr = formatTime(s.startTime)

                          return (
                            <div key={i} className="flex items-center justify-between p-3">
                              <div className="min-w-0">
                                <p className="font-prettywise text-lg text-[var(--white)] truncate">{s.city}, {s.country}</p>
                                {s.venue && <p className="text-sm text-[var(--white)]/70 truncate">{s.venue}</p>}
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <span className="text-sm font-neue-haas text-[var(--white)]/90 block">{dateStr}</span>
                                  <span className="text-xs font-neue-haas text-[var(--white)]/60">{timeStr}</span>
                                </div>
                                {s.ticketUrl ? (
                                  <a
                                    href={s.ticketUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1 text-[10px] uppercase tracking-[0.2em] bg-[var(--gold)] text-[var(--maroon-red)]"
                                  >
                                    Tickets
                                  </a>
                                ) : (
                                  <span className="px-3 py-1 text-[10px] uppercase tracking-[0.2em] bg-[var(--gold)]/30 text-[var(--gold)]/90">TBA</span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-6 text-[10px] font-neue-haas uppercase tracking-[0.3em] text-[var(--white)]/40">
                    <span className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-[var(--gold)] rounded-full" />
                      {ageLabel} Event
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-[var(--gold)] rounded-full" />
                      ID Required
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-[var(--gold)] rounded-full" />
                      Limited Capacity
                    </span>
                  </div>
                </div>

                {/* CTA Section (hidden for tours) */}
                {stops.length === 0 && (
                  <div>
                    {event.ticketUrl ? (
                      <a
                        href={event.ticketUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full relative overflow-hidden group block"
                      >
                        <div className="absolute inset-0 bg-[var(--gold)]" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[var(--gold)] via-[var(--gold)] to-[var(--dark-gold)] opacity-0 group-hover:opacity-100" />
                        <div className="relative px-8 py-4 mx-auto items-center justify-center flex">
                          <p className="text-[11px] font-neue-haas uppercase tracking-[0.5em] text-[var(--maroon-red)] font-medium">
                            RSVP
                          </p>
                        </div>
                      </a>
                    ) : (
                      <button className="w-full relative overflow-hidden group" disabled>
                        <div className="absolute inset-0 bg-[var(--gold)]" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[var(--gold)] via-[var(--gold)] to-[var(--dark-gold)] opacity-0 group-hover:opacity-100" />
                        <div className="relative px-8 py-4">
                          <p className="text-[11px] font-neue-haas uppercase tracking-[0.5em] text-[var(--maroon-red)] font-medium">
                            COMING SOON
                          </p>
                        </div>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Poster - Now on Right */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-[500px]">
                {/* Enhanced Gold accent frame */}
                <div className="absolute -inset-[2px] bg-gradient-to-br from-[var(--gold)] via-[var(--gold)]/50 to-transparent opacity-60" />
                <div className="absolute -inset-[1px] bg-[var(--maroon-red)]" />

                {/* Main Poster with enhanced presentation */}
                <div className="relative w-full">
                  <div className="relative aspect-[4/5] overflow-hidden bg-[var(--dark-green)]/20">
                    {event.image && (
                      <Image
                        src={event.image}
                        alt={event.title}
                        fill
                        className="object-cover"
                        priority
                        sizes="500px"
                      />
                    )}
                    {/* Premium vignette effects */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--maroon-red)]/40 via-transparent to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--dark-green)]/20 via-transparent to-transparent" />
                  </div>

                  {/* Floating gold accent date element - top right */}
                  <div className="absolute -top-5 -right-5 w-20 h-20 bg-[var(--gold)] flex flex-col items-center justify-center">
                    <p className="text-2xl font-prettywise text-[var(--maroon-red)]">{event.date.split(' ')[0]}</p>
                    <p className="text-[9px] font-neue-haas uppercase tracking-[0.3em] text-[var(--maroon-red)]">{event.date.split(' ')[1]}</p>
                  </div>

                  {/* Corner accents */}
                  <div className="absolute -bottom-2 -left-2 w-16 h-16 border-l-2 border-b-2 border-[var(--gold)]/40" />
                  <div className="absolute -top-2 -left-2 w-16 h-16 border-l-2 border-t-2 border-[var(--gold)]/40" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Border Transition */}
      <div className="relative">
        {/* Decorative border element - fades from right to left */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-l from-[var(--gold)]/30 via-[var(--gold)]/15 to-transparent" />
          <div className="h-px bg-gradient-to-l from-[var(--gold)]/40 to-transparent" />
        </div>
      </div>
    </section>
  )
}
