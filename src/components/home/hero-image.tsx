'use client'
import Image from "next/image";
import { useRouter } from "next/navigation";

interface HeroImageProps {
  eventSlug: string;
  ticketUrl?: string; // TEMPORARY: Added for ticket redirect
  src: string;
  alt: string;
  day: string;
  month: string;
}

export default function HeroImage({ eventSlug, ticketUrl, src, alt, day, month }: HeroImageProps) {
  const router = useRouter();

  const handleClick = () => {
    // TEMPORARY: Redirect to ticket URL instead of event page
    // router.push(`/event/${eventSlug}`); // TEMPORARY: Commented out
    if (ticketUrl) {
      window.open(ticketUrl, '_blank');
    }
  };

  return (
    <div className="relative w-full max-w-[360px] lg:max-w-[420px] cursor-pointer group" onClick={handleClick}>
      {/* Geometric Frame Elements */}
      <div className="absolute -top-6 -right-6 w-28 h-28 border" style={{ borderColor: 'var(--gold)', opacity: 0.2 }} />
      <div className="absolute -bottom-6 -left-6 w-28 h-28 border" style={{ borderColor: 'var(--gold)', opacity: 0.2 }} />
      
      {/* Main Poster — dynamic frame: the box adopts the poster's own aspect
          ratio (w-full h-auto), so nothing is ever cropped regardless of
          whether the artwork is 3:4, 4:5, square, or landscape. max-h guards
          against extremely tall images blowing up the hero. */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 border z-10 pointer-events-none" style={{ borderColor: 'var(--gold)', opacity: 0.3 }} />
        <Image
          src={src}
          alt={alt}
          width={840}
          height={1120}
          sizes="(max-width: 1024px) 360px, 420px"
          className="w-full h-auto max-h-[78vh] object-contain"
          priority
        />
        {/* Subtle Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--maroon-red)]/40 via-transparent to-transparent pointer-events-none" />
      </div>
      
      {/* Floating Date Box - Outside Image */}
      <div className="absolute -top-5 -right-5 w-16 h-16 flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--gold)' }}>
        <p className="text-xl font-serif font-light" style={{ color: 'var(--maroon-red)' }}>{day}</p>
        <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--maroon-red)' }}>{month}</p>
      </div>
      
   
    </div>
  );
}
