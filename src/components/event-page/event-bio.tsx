interface EventBioProps {
  bio?: string;
}

export default function EventBio({ bio }: EventBioProps) {
  if (!bio) return null;

  return (
    <section className="relative px-5 py-16 sm:px-6 lg:px-12 lg:py-24">
      {/* Subtle decorative elements */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent" />
      </div>
      
      <div className="relative mx-auto max-w-3xl">
        {/* Section header with decorative elements */}
        <div className="mb-10 flex items-center justify-center gap-4">
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[var(--gold)]/20" />
          <p className="text-[9px] font-neue-haas uppercase tracking-[0.5em] text-[var(--gold)]/40">
            About This Event
          </p>
          <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[var(--gold)]/20" />
        </div>
        
        {/* Bio content — preserves the line breaks exactly as written in the
            admin, styled light so it reads editorial rather than bold. */}
        <div className="space-y-6">
          {bio.split(/\n{2,}/).map((paragraph, index) => {
            // Check if this paragraph contains special formatting for venue/date info
            const isHighlight = paragraph.includes('📍') || paragraph.includes('📅') || paragraph.includes('⏰');

            if (isHighlight) {
              // Special formatting for ticket/venue info
              return (
                <div key={index} className="mt-8 border-t border-[var(--gold)]/10 pt-8">
                  <div className="space-y-2 text-center">
                    {paragraph.split('\n').map((line, lineIndex) => (
                      <p key={lineIndex} className="font-neue-haas text-sm uppercase tracking-[0.15em] text-[var(--gold)]/60">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <p
                key={index}
                className="whitespace-pre-line font-neue-haas font-light text-base leading-[1.9] text-[var(--white)]/75 lg:text-lg"
              >
                {paragraph}
              </p>
            );
          })}
        </div>
        
        {/* Bottom decorative element */}
        <div className="mt-12 flex justify-center">
          <div className="flex items-center gap-3">
            <div className="h-1 w-1 rotate-45 bg-[var(--gold)]/30" />
            <div className="h-1.5 w-1.5 rotate-45 bg-[var(--gold)]/40" />
            <div className="h-1 w-1 rotate-45 bg-[var(--gold)]/30" />
          </div>
        </div>
      </div>
    </section>
  );
}