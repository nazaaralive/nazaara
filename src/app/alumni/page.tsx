import Image from "next/image";
import { getPublicAlumni } from "@/lib/public-actions";

export const revalidate = 0;

export const metadata = {
  title: "Alumni | Nazaara Live",
  description:
    "Artists and DJs who have performed at Nazaara Live events worldwide.",
};

export default async function AlumniPage() {
  const alumni = await getPublicAlumni();

  return (
    <div className="min-h-screen bg-[var(--black-grey)]">
      {/* Hero Section */}
      <section className="relative pt-12 pb-8 md:pt-16 md:pb-10 bg-gradient-to-b from-[var(--maroon-red)]/20 to-[var(--black-grey)]">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-px bg-[var(--gold)]/20" />
              <span className="text-[10px] font-neue-haas uppercase tracking-[0.5em] text-[var(--gold)]/40">
                The Family
              </span>
              <div className="w-16 h-px bg-[var(--gold)]/20" />
            </div>
            <h1 className="heading-display text-[var(--off-white)] mb-4">
              <span className="text-[var(--gold)]">Alumni</span>
            </h1>
            <p className="text-xs md:text-sm font-neue-haas uppercase tracking-[0.3em] text-[var(--off-white)]/60 max-w-2xl mx-auto">
              A collection of artists that have graced our stage
            </p>
          </div>
        </div>
      </section>

      {/* Alumni Grid */}
      <section className="relative pt-6 pb-24 bg-gradient-to-b from-[var(--black-grey)] via-[var(--black-grey)] to-[var(--maroon-red)]/10 overflow-hidden">
        {/* Art Deco inspired grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <defs>
              <pattern id="alumni-grid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="80" height="80" fill="none" stroke="var(--gold)" strokeWidth="0.5" />
                <rect x="10" y="10" width="60" height="60" fill="none" stroke="var(--gold)" strokeWidth="0.3" />
                <line x1="0" y1="40" x2="80" y2="40" stroke="var(--gold)" strokeWidth="0.2" />
                <line x1="40" y1="0" x2="40" y2="80" stroke="var(--gold)" strokeWidth="0.2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#alumni-grid)" />
          </svg>
        </div>

        <div className="relative container mx-auto px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            {alumni.length === 0 ? (
              <p className="text-center font-neue-haas text-[var(--off-white)]/50">
                Alumni coming soon.
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-8 md:gap-x-6 md:gap-y-10">
                {alumni.map((artist) => {
                  const ig = artist.instagram?.trim();
                  const href = ig ? `https://instagram.com/${ig}` : undefined;

                  const card = (
                    <div className="group">
                      {/* Portrait image — clean, nothing overlaid */}
                      <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-b from-[var(--maroon-red)]/10 to-[var(--black-grey)]">
                        {artist.image ? (
                          <Image
                            src={artist.image}
                            alt={artist.name}
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            quality={60}
                            loading="eager"
                            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="absolute inset-0">
                            {/* Geometric pattern placeholder */}
                            <div className="absolute inset-0 opacity-5">
                              <div className="absolute inset-8 border border-[var(--gold)]" />
                              <div className="absolute inset-12 border border-[var(--gold)] rotate-45" />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <svg className="w-16 h-16 text-[var(--gold)]/10" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1" />
                                <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                              </svg>
                            </div>
                          </div>
                        )}

                        {/* Gold hairline on hover */}
                        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--gold)]/0 to-transparent group-hover:via-[var(--gold)]/60 transition-all duration-500" />
                      </div>

                      {/* Name below the image */}
                      <div className="pt-3 flex items-baseline justify-between gap-2">
                        <h3 className="font-neue-haas text-[11px] md:text-xs uppercase tracking-[0.2em] text-[var(--off-white)]/90 group-hover:text-[var(--gold)] transition-colors leading-snug">
                          {artist.name}
                        </h3>
                        {ig && (
                          <span className="shrink-0 text-[var(--gold)]/40 group-hover:text-[var(--gold)] transition-colors">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" clipRule="evenodd" d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"/>
                              <path d="M18 5C17.4477 5 17 5.44772 17 6C17 6.55228 17.4477 7 18 7C18.5523 7 19 6.55228 19 6C19 5.44772 18.5523 5 18 5Z"/>
                              <path fillRule="evenodd" clipRule="evenodd" d="M1.65396 4.27606C1 5.55953 1 7.23969 1 10.6V13.4C1 16.7603 1 18.4405 1.65396 19.7239C2.2292 20.8529 3.14708 21.7708 4.27606 22.346C5.55953 23 7.23969 23 10.6 23H13.4C16.7603 23 18.4405 23 19.7239 22.346C20.8529 21.7708 21.7708 20.8529 22.346 19.7239C23 18.4405 23 16.7603 23 13.4V10.6C23 7.23969 23 5.55953 22.346 4.27606C21.7708 3.14708 20.8529 2.2292 19.7239 1.65396C18.4405 1 16.7603 1 13.4 1H10.6C7.23969 1 5.55953 1 4.27606 1.65396C3.14708 2.2292 2.2292 3.14708 1.65396 4.27606ZM13.4 3H10.6C8.88684 3 7.72225 3.00156 6.82208 3.0751C5.94524 3.14674 5.49684 3.27659 5.18404 3.43597C4.43139 3.81947 3.81947 4.43139 3.43597 5.18404C3.27659 5.49684 3.14674 5.94524 3.0751 6.82208C3.00156 7.72225 3 8.88684 3 10.6V13.4C3 15.1132 3.00156 16.2777 3.0751 17.1779C3.14674 18.0548 3.27659 18.5032 3.43597 18.816C3.81947 19.5686 4.43139 20.1805 5.18404 20.564C5.49684 20.7234 5.94524 20.8533 6.82208 20.9249C7.72225 20.9984 8.88684 21 10.6 21H13.4C15.1132 21 16.2777 20.9984 17.1779 20.9249C18.0548 20.8533 18.5032 20.7234 18.816 20.564C19.5686 20.1805 20.1805 19.5686 20.564 18.816C20.7234 18.5032 20.8533 18.0548 20.9249 17.1779C20.9984 16.2777 21 15.1132 21 13.4V10.6C21 8.88684 20.9984 7.72225 20.9249 6.82208C20.8533 5.94524 20.7234 5.49684 20.564 5.18404C20.1805 4.43139 19.5686 3.81947 18.816 3.43597C18.5032 3.27659 18.0548 3.14674 17.1779 3.0751C16.2777 3.00156 15.1132 3 13.4 3Z"/>
                            </svg>
                          </span>
                        )}
                      </div>
                    </div>
                  );

                  return href ? (
                    <a
                      key={artist.id}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${artist.name} on Instagram`}
                    >
                      {card}
                    </a>
                  ) : (
                    <div key={artist.id}>{card}</div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
