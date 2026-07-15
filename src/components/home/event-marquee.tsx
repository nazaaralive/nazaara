"use client";

const CITIES = [
  "Atlanta",
  "Austin",
  "Boston",
  "Calgary",
  "Chicago",
  "Dallas",
  "Edmonton",
  "Houston",
  "Miami",
  "Montreal",
  "New York",
  "San Francisco",
  "Toronto",
  "Vancouver",
  "Victoria",
];

// Seamless loop: the track animates to -50% of its own width, so the second
// half must be pixel-identical to the first. We repeat the list an EVEN
// number of times (6) so half the track is 3 full list-copies (~5000px) —
// wider than any viewport. Previously only 2 copies were rendered, so on
// wide screens the content's right edge slid past the screen edge near the
// end of each cycle, showing a blank strip until the loop reset.
const REPEATS = 6;

export function EventMarquee() {
  return (
    <div className="relative py-3 border-y border-[var(--gold)]/20 bg-[var(--dark-green)]/50">
      <div className="flex overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {Array.from({ length: REPEATS }).flatMap((_, r) =>
            CITIES.map((city, i) => (
              <div
                key={`${r}-${city}-${i}`}
                className="mx-8 flex items-center gap-3 text-[var(--white)]/70 transition-all duration-300 ease-out"
              >
                <span className="text-[12px] font-prettywise text-[var(--white)]/70">
                  {city}
                </span>
                <span className="w-1 h-1 bg-[var(--gold)]/30 rounded-full" />
              </div>
            ))
          )}
        </div>
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 160s linear infinite;
        }
      `}</style>
    </div>
  );
}
