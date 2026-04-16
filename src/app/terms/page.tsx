import { termsMetadata, termsContent } from "@/content/terms";

export const metadata = termsMetadata;

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--maroon-red)' }}>
      {/* Header Section */}
      <section className="relative pt-32 pb-16 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-px" style={{ backgroundColor: 'var(--gold)' }} />
            <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--gold)' }}>
              Legal
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-prettywise mb-6" style={{ color: 'var(--white)' }}>
            Terms & Conditions
          </h1>

          <p className="text-sm font-neue-haas" style={{ color: 'var(--gold)' }}>
            Last Updated: {termsContent.lastUpdated}
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 px-6 lg:px-12 pb-32">
        <div className="max-w-4xl mx-auto">
          {/* Introduction */}
          <div className="mb-12 pb-12 border-b border-white/20">
            <p className="text-base font-neue-haas leading-relaxed mb-6 text-white">
              {termsContent.introduction}
            </p>
            <p className="text-base font-neue-haas leading-relaxed font-medium" style={{ color: 'var(--gold)' }}>
              {termsContent.agreement}
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-12">
            {termsContent.sections.map((section, index) => (
              <div key={index} className="scroll-mt-32">
                <h2 className="text-2xl font-prettywise mb-6" style={{ color: 'var(--gold)' }}>
                  {section.title}
                </h2>
                <div className="space-y-4">
                  {section.content.map((paragraph, pIndex) => (
                    <p key={pIndex} className="text-base font-neue-haas leading-relaxed" style={{ color: 'var(--white)' }}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Note */}
          <div className="mt-16 pt-12 border-t border-white/20">
            <p className="text-sm font-neue-haas text-center text-white">
              For questions or concerns regarding these Terms, please contact us at contact@nazaara.live
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
