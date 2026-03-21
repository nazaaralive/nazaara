import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { 
  getPublicEvents, 
  getPublicUpcomingEvents, 
  getPublicEventForCity, 
  getPublicFeaturedEvent,
  type PublicEvent
} from "@/lib/public-actions";
import SectionHeader from "@/components/ui/section-header";
import TicketButton from "@/components/home/ticket-button";

export default async function UpcomingEvents() {
  // Get the city and country cookies to determine which event is featured in hero
  const cookieStore = await cookies();
  const city = cookieStore.get("nza_city")?.value;
  const country = cookieStore.get("nza_country")?.value;
  
  console.log("=== UPCOMING EVENTS COMPONENT START ===");
  console.log("[UpcomingEvents] City from cookie:", city);
  console.log("[UpcomingEvents] Country from cookie:", country);
  
  // Determine the event shown in the hero (mirrors logic used by Hero component exactly)
  const cityEvent = await getPublicEventForCity(city || "");
  const fallbackEvent = cityEvent ? null : await getPublicFeaturedEvent();
  const heroEvent = cityEvent || fallbackEvent;
  const heroSlug = heroEvent?.slug;
  
  console.log("[UpcomingEvents] City event result:", cityEvent ? {
    slug: cityEvent.slug,
    title: cityEvent.title,
    city: cityEvent.city,
    startTime: cityEvent.startTime
  } : "No city match - will use fallback");
  
  if (!cityEvent) {
    console.log("[UpcomingEvents] Fallback event result:", fallbackEvent ? {
      slug: fallbackEvent.slug,
      title: fallbackEvent.title,
      city: fallbackEvent.city,
      startTime: fallbackEvent.startTime
    } : "No fallback event");
  }
  
  console.log("[UpcomingEvents] Final hero event:", heroEvent ? {
    slug: heroEvent.slug,
    title: heroEvent.title,
    city: heroEvent.city,
    startTime: heroEvent.startTime,
    source: cityEvent ? "city-specific" : "fallback"
  } : "No hero event");
  
  // Get all upcoming events
  const upcomingEvents = await getPublicUpcomingEvents();
  
  console.log("[UpcomingEvents] All upcoming events from getPublicUpcomingEvents():", upcomingEvents.length, "events");
  console.log("[UpcomingEvents] Upcoming events details:", upcomingEvents.map(e => ({
    slug: e.slug,
    title: e.title,
    city: e.city,
    startTime: e.startTime,
    isFeatured: e.isFeatured
  })));
  
  // Filter out the hero event (if known)
  const filteredEvents = heroSlug
    ? upcomingEvents.filter((event) => event.slug !== heroSlug)
    : upcomingEvents;
  
  console.log("[UpcomingEvents] Filtered events (after removing hero):", filteredEvents.length, "events");
  console.log("[UpcomingEvents] Filtered events details:", filteredEvents.map(e => ({
    slug: e.slug,
    title: e.title,
    city: e.city,
    startTime: e.startTime
  })));
  
  if (heroSlug) {
    const excludedHero = upcomingEvents.filter((event) => event.slug === heroSlug);
    if (excludedHero.length > 0) {
      console.log("[UpcomingEvents][Filter] Excluded hero event from Next Up", excludedHero.map((e: PublicEvent) => ({ slug: e.slug, title: e.title })));
    }
  }

  // Build a chronologically sorted list of upcoming events only for the Complete Schedule
  // Show events until noon UTC the day after their start date
  const allEvents = await getPublicEvents();
  const now = new Date();
  
  console.log("[UpcomingEvents] All events from getPublicEvents():", allEvents.length, "events");
  console.log("[UpcomingEvents] All events details:", allEvents.map(e => ({
    slug: e.slug,
    title: e.title,
    city: e.city,
    startTime: e.startTime,
    isFeatured: e.isFeatured
  })));
  console.log("[UpcomingEvents] Current time (now):", now.toISOString());
  
  const upcomingEventsOnly = allEvents.filter(event => {
    const eventStartTime = new Date(event.startTime);
    const nextDayNoon = new Date(eventStartTime);
    nextDayNoon.setUTCDate(nextDayNoon.getUTCDate() + 1);
    nextDayNoon.setUTCHours(12, 0, 0, 0);
    const isUpcoming = nextDayNoon >= now;
    
    console.log(`[UpcomingEvents][DateFilter] Event: ${event.slug} | Start: ${eventStartTime.toISOString()} | Cutoff: ${nextDayNoon.toISOString()} | Now: ${now.toISOString()} | Include: ${isUpcoming}`);
    
    return isUpcoming;
  });
  {
    // Log past events excluded from the complete schedule list
    const excludedByNextDayNoon = allEvents.filter(event => {
      const eventStartTime = new Date(event.startTime);
      const nextDayNoon = new Date(eventStartTime);
      nextDayNoon.setUTCDate(nextDayNoon.getUTCDate() + 1);
      nextDayNoon.setUTCHours(12, 0, 0, 0);
      return nextDayNoon < now;
    });
    if (excludedByNextDayNoon.length > 0) {
      console.log("[UpcomingEvents][Filter] Excluded past events (schedule)", excludedByNextDayNoon.map((e: PublicEvent) => {
        const eventStartTime = new Date(e.startTime);
        const nextDayNoon = new Date(eventStartTime);
        nextDayNoon.setUTCDate(nextDayNoon.getUTCDate() + 1);
        nextDayNoon.setUTCHours(12, 0, 0, 0);
        return {
          slug: e.slug,
          title: e.title,
          startTime: eventStartTime.toISOString(),
          cutoffTime: nextDayNoon.toISOString(),
          nowTime: now.toISOString(),
          comparison: `${nextDayNoon.toISOString()} < ${now.toISOString()}`,
          reason: 'Past noon UTC on day after start date'
        };
      }));
    }
  }
  
  console.log("[UpcomingEvents] Upcoming events after date filter:", upcomingEventsOnly.length, "events");
  console.log("[UpcomingEvents] Upcoming events after date filter details:", upcomingEventsOnly.map(e => ({
    slug: e.slug,
    title: e.title,
    city: e.city,
    startTime: e.startTime
  })));
  
  const allEventsChrono = upcomingEventsOnly.sort((a, b) => {
    let dateA: string;
    let dateB: string;
    if (typeof a.startTime === 'string') {
      dateA = a.startTime;
    } else {
      dateA = new Date(a.startTime).toISOString();
    }
    if (typeof b.startTime === 'string') {
      dateB = b.startTime;
    } else {
      dateB = new Date(b.startTime).toISOString();
    }
    return dateA.localeCompare(dateB);
  });

  console.log("[UpcomingEvents] Chronologically sorted events for schedule:", allEventsChrono.length, "events");
  console.log("[UpcomingEvents] Chronologically sorted events details:", allEventsChrono.map(e => ({
    slug: e.slug,
    title: e.title,
    city: e.city,
    startTime: e.startTime
  })));

  // Determine Next Up grid items and log any excluded by the cap
  const nextUpEvents = filteredEvents.slice(0, 3);
  
  console.log("[UpcomingEvents] Next Up events (first 3 after filtering):", nextUpEvents.length, "events");
  console.log("[UpcomingEvents] Next Up events details:", nextUpEvents.map(e => ({
    slug: e.slug,
    title: e.title,
    city: e.city,
    startTime: e.startTime
  })));
  
  const excludedByCap = filteredEvents.slice(3);
  if (excludedByCap.length > 0) {
    console.log("[UpcomingEvents][Filter] Excluded by Next Up cap (limit 3)", excludedByCap.map((e: PublicEvent) => ({ slug: e.slug, title: e.title })));
  }
  
  console.log("=== UPCOMING EVENTS COMPONENT END ===");

  // Check if there are no events to display
  const hasNoEvents = nextUpEvents.length === 0 && allEventsChrono.length === 0;

  if (hasNoEvents) {
    return (
      <section className="relative bg-[var(--black-grey)] overflow-hidden">
        {/* Art Deco inspired grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <defs>
              <pattern id="upcoming-grid-empty" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="80" height="80" fill="none" stroke="var(--gold)" strokeWidth="0.5" />
                <rect x="10" y="10" width="60" height="60" fill="none" stroke="var(--gold)" strokeWidth="0.3" />
                <line x1="0" y1="40" x2="80" y2="40" stroke="var(--gold)" strokeWidth="0.2" />
                <line x1="40" y1="0" x2="40" y2="80" stroke="var(--gold)" strokeWidth="0.2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#upcoming-grid-empty)" />
          </svg>
        </div>

        {/* Empty State */}
        <div className="relative container mx-auto px-4 md:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
          <div className="flex flex-col items-center justify-center text-center space-y-6 md:space-y-8 max-w-2xl mx-auto">
            {/* Decorative header */}
            <div className="flex items-center gap-4 md:gap-6">
              <div className="h-[1px] w-12 md:w-16 bg-[var(--gold)]/30" />
              <span className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] md:tracking-[0.5em] font-light text-[var(--gold)]/60">
                Season 2026/27
              </span>
              <div className="h-[1px] w-12 md:w-16 bg-[var(--gold)]/30" />
            </div>

            {/* Main heading */}
            <h2 className="font-prettywise text-4xl md:text-5xl lg:text-6xl text-[var(--white)] leading-tight">
              More Shows<br />Coming Soon
            </h2>

            {/* Subtext */}
            <p className="font-neue-haas text-sm md:text-base text-[var(--white)]/50 max-w-md leading-relaxed">
              We&apos;re curating exceptional experiences across the globe. Check back soon for upcoming events.
            </p>

            {/* Decorative footer */}
            <div className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-1 rounded-full bg-[var(--gold)]/40" />
                <div className="w-2 h-2 rounded-full bg-[var(--gold)]/40" />
                <div className="w-1 h-1 rounded-full bg-[var(--gold)]/40" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative bg-[var(--black-grey)] overflow-hidden">
      {/* Art Deco inspired grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <pattern id="upcoming-grid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="80" height="80" fill="none" stroke="var(--gold)" strokeWidth="0.5" />
              <rect x="10" y="10" width="60" height="60" fill="none" stroke="var(--gold)" strokeWidth="0.3" />
              <line x1="0" y1="40" x2="80" y2="40" stroke="var(--gold)" strokeWidth="0.2" />
              <line x1="40" y1="0" x2="40" y2="80" stroke="var(--gold)" strokeWidth="0.2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#upcoming-grid)" />
        </svg>
      </div>

      {/* Main Content - More Compact */}
      <div className="relative container mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
          
          {/* Header - Editorial Style */}
          <SectionHeader eyebrow="Season 2026/27" title="Next Up" className="mb-8 md:mb-12" />

          {/* Three Event Layout - Compact Container */}
          <div className="mb-8 md:mb-12">
            
            
            {/* Three Column Premium Layout */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-6 lg:gap-8">
              {nextUpEvents.map((event, index) => (
                <Link
                  key={event.id} 
                  href={`/event/${event.slug}`}
                  className="group cursor-pointer relative"
                >
                  <div className="relative">
                    {/* The Poster - Enhanced presentation */}
                    <div className="relative ">
                      {/* Main poster with refined aspect ratio */}
                      <div className="relative aspect-[3/4]  bg-[var(--maroon-red)]/5">
                        {event.image && (
                          <Image
                            src={event.image}
                            alt={event.artist}
                            fill
                            className="object-cover group-hover:scale-102 transition-transform duration-300"
                            priority={index === 0}
                          />
                        )}
                        
                        {/* Subtle gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--black-grey)]/90 via-transparent to-transparent" />
                        
                        {/* Floating Date Box - Similar to Hero */}
                        <div className="absolute -top-2 -right-2 md:-top-3 md:-right-3 w-14 h-14 md:w-16 md:h-16 flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--gold)' }}>
                          <p className="text-lg md:text-xl font-serif font-light" style={{ color: 'var(--maroon-red)' }}>
                            {event.date.split(' ')[0]}
                          </p>
                          <p className="text-[8px] md:text-[9px] uppercase tracking-[0.2em]" style={{ color: 'var(--maroon-red)' }}>
                            {event.date.split(' ')[1]}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Content - Compact typography and spacing */}
                    <div className="pt-4 md:pt-6 pb-2">
                      {/* Event title */}
                      <h3 className="font-prettywise text-[var(--white)] text-xl md:text-2xl lg:text-3xl mb-2 leading-tight group-hover:text-[var(--gold)] transition-colors duration-500">
                        {event.title}
                      </h3>
                      
                      {/* Artist names */}
                      <p className="text-sm md:text-base font-prettywise text-[var(--gold)]/60 mb-3 md:mb-4">
                        {event.artists && event.artists.length > 0
                          ? event.artists.map(artist => artist.name).join(', ')
                          : event.artist}
                      </p>
                      
                      {/* Venue and pricing - Compact */}
                      <div className="space-y-3">
                        {/* Divider */}
                        <div className="h-[1px] bg-gradient-to-r from-[var(--gold)]/20 via-[var(--gold)]/10 to-transparent" />
                        
                        {/* Venue information */}
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-sm font-prettywise text-[var(--white)]/80">
                              {event.venue}
                            </p>
                            <p className="text-xs font-neue-haas text-[var(--white)]/50">
                              {event.city}
                            </p>
                          </div>
                          
                          {/* Ticket Button */}
                          {event.ticketUrl && (
                            <TicketButton
                              ticketUrl={event.ticketUrl}
                              className="px-4 py-2 bg-[var(--gold)] text-[var(--maroon-red)] font-prettywise text-sm uppercase tracking-wider hover:bg-[var(--gold)]/80 hover:text-[var(--white)] transition-colors duration-300"
                            >
                              Get Tickets
                            </TicketButton>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
           
          </div>

          {/* Schedule List - Playbill Style */}
          <div className="relative">
            {/* Section Title */}
            <div className="flex items-center gap-4 md:gap-6 mb-8 md:mb-12">
              <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-[var(--gold)]/20" />
              <h3 className="text-lg md:text-xl font-prettywise text-[var(--gold)] whitespace-nowrap">Upcoming Shows</h3>
              <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-[var(--gold)]/20" />
            </div>

            {/* Events Table - Theater Program Style */}
            <div className="space-y-0">
              {allEventsChrono.map((event) => (
                <Link
                  key={event.id} 
                  href={`/event/${event.slug}`}
                  className="group cursor-pointer border-b border-[var(--gold)]/10 hover:bg-[var(--gold)]/5 transition-all duration-500 block"
                >
                  {/* Mobile Layout */}
                  <div className="md:hidden py-6 px-4">
                    <div className="flex gap-4">
                      {/* Date - Mobile */}
                      <div className="flex-shrink-0">
                        <div className="w-12 text-center">
                          <p className="text-2xl font-prettywise text-[var(--gold)]/30 group-hover:text-[var(--gold)]/50 transition-colors">
                            {event.date.split(' ')[0]}
                          </p>
                          <p className="text-[8px] font-neue-haas uppercase tracking-[0.2em] text-[var(--white)]/30">
                            {event.date.split(' ')[1]}
                          </p>
                        </div>
                      </div>
                      
                      {/* Content - Mobile */}
                      <div className="flex-1 min-w-0">
                        <div className="mb-2">
                          <h4 className="text-lg font-prettywise text-[var(--white)] group-hover:text-[var(--gold)] transition-colors truncate">
                            {event.title}
                          </h4>
                          <p className="text-xs font-prettywise text-[var(--gold)]/60 truncate">
                            {event.artists && event.artists.length > 0 
                              ? event.artists.map(artist => artist.name).join(', ') 
                              : event.artist}
                          </p>
                        </div>
                        <p className="text-[10px] font-neue-haas text-[var(--white)]/40 uppercase tracking-wider truncate">
                          {event.venue} · {event.city}
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                          {/* TEMPORARY: Learn More button hidden
                          <a 
                            href={event.ticketUrl || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              if (!event.ticketUrl) e.preventDefault();
                              else e.stopPropagation();
                            }}
                            className="text-[var(--gold)]/60 font-neue-haas text-[10px] uppercase tracking-wider hover:text-[var(--gold)] transition-colors duration-300 underline underline-offset-2 decoration-[var(--gold)]/20"
                          >
                            Learn More
                          </a>
                          */}
                          {event.ticketUrl && (
                            <TicketButton
                              ticketUrl={event.ticketUrl}
                              className="px-3 py-1.5 bg-[var(--gold)] text-[var(--maroon-red)] font-neue-haas text-xs uppercase tracking-wider hover:bg-[var(--gold)]/80 hover:text-[var(--white)] transition-all duration-300"
                            >
                              Tickets
                            </TicketButton>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Desktop Layout */}
                  <div className="hidden md:grid grid-cols-12 gap-4 py-8 px-4">
                    {/* Date Column */}
                    <div className="col-span-2 lg:col-span-1">
                      <div className="text-center">
                        <p className="text-3xl font-prettywise text-[var(--gold)]/20 group-hover:text-[var(--gold)]/40 transition-colors">
                          {event.date.split(' ')[0]}
                        </p>
                        <p className="text-[9px] font-neue-haas uppercase tracking-[0.3em] text-[var(--white)]/30">
                          {event.date.split(' ')[1]}
                        </p>
                      </div>
                    </div>

                    {/* Main Info */}
                    <div className="col-span-7 lg:col-span-8 flex items-center">
                      <div>
                        <div className="flex items-baseline gap-4 mb-2">
                          <h4 className="text-2xl font-prettywise text-[var(--white)] group-hover:text-[var(--gold)] transition-colors">
                            {event.title}
                          </h4>
                          <span className="text-sm font-prettywise text-[var(--gold)]/60">
                            {event.artists && event.artists.length > 0
                              ? event.artists.map(artist => artist.name).join(', ')
                              : event.artist}
                          </span>
                        </div>
                        <p className="text-[11px] font-neue-haas text-[var(--white)]/40 uppercase tracking-wider">
                          {event.venue} · {event.city}, {event.country}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="col-span-3 lg:col-span-3 flex items-center justify-end gap-3">
                      {/* TEMPORARY: Learn More button hidden
                      <a 
                        href={event.ticketUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          if (!event.ticketUrl) e.preventDefault();
                          else e.stopPropagation();
                        }}
                        className="text-[var(--gold)]/60 font-neue-haas text-[10px] uppercase tracking-[0.2em] hover:text-[var(--gold)] transition-colors duration-300 underline underline-offset-4 decoration-[var(--gold)]/20"
                      >
                        Learn More
                      </a>
                      */}
                      {event.ticketUrl && (
                        <TicketButton
                          ticketUrl={event.ticketUrl}
                          className="px-4 py-2 bg-[var(--gold)] text-[var(--maroon-red)] font-neue-haas text-[11px] uppercase tracking-[0.2em] hover:bg-[var(--gold)]/80 hover:text-[var(--white)] transition-all duration-300"
                        >
                          Tickets
                        </TicketButton>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
      </div>

    </section>
  );
}
