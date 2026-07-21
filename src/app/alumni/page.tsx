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
      <section className="relative py-24 bg-gradient-to-b from-[var(--maroon-red)]/20 to-[var(--black-grey)]">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-16 h-px bg-[var(--gold)]/20" />
              <span className="text-[10px] font-neue-haas uppercase tracking-[0.5em] text-[var(--gold)]/40">
                The Family
              </span>
              <div className="w-16 h-px bg-[var(--gold)]/20" />
            </div>
            <h1 className="text-[clamp(4rem,8vw,8rem)] font-prettywise leading-[0.9] text-[var(--off-white)] mb-6">
              <span className="text-[var(--gold)]">Alumni</span>
            </h1>
            <p className="text-lg font-neue-haas text-[var(--off-white)]/60 max-w-2xl mx-auto">
              The artists and DJs who have graced Nazaara stages around the world
            </p>
          </div>
        </div>
      </section>

      {/* Alumni Grid */}
      <section className="relative py-24 bg-gradient-to-b from-[var(--black-grey)] via-[var(--black-grey)] to-[var(--maroon-red)]/10 overflow-hidden">
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {alumni.map((artist) => {
                  const ig = artist.instagram?.trim();
                  const href = ig ? `https://instagram.com/${ig}` : undefined;

                  const card = (
                    <div className="group relative overflow-hidden bg-gradient-to-b from-[var(--maroon-red)]/10 to-[var(--black-grey)]">
                      {/* Portrait image */}
                      <div className="relative aspect-[3/4] overflow-hidden">
                        {artist.image ? (
                          <Image
                            src={artist.image}
                            alt={artist.name}
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
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

                        {/* Bottom gradient for legibility */}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[var(--black-grey)] via-[var(--black-grey)]/60 to-transparent" />

                        {/* Name overlaid on image */}
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="font-prettywise text-xl md:text-2xl text-white leading-tight [text-shadow:0_1px_8px_rgba(0,0,0,0.8)]">
                            {artist.name}
                          </h3>
                        </div>

                        {/* Gold hairline on hover */}
                        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--gold)]/0 to-transparent group-hover:via-[var(--gold)]/60 transition-all duration-500" />
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
