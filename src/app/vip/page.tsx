'use client';

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { getPublicUpcomingEvents, type PublicEvent } from "@/lib/public-actions";

const inclusions = [
  {
    title: "Private VIP Table",
    description: "Your own reserved space for the night",
  },
  {
    title: "VIP Entry",
    description: "Walk past the line, straight in",
  },
  {
    title: "Dedicated Server",
    description: "Looked after from open to close",
  },
  {
    title: "Complimentary Mixers",
    description: "Everything you need, on the table",
  },
  {
    title: "Bottle Show & Custom Marquee Sign*",
    description: "Sparklers and your name in lights",
  },
];

export default function VipPage() {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  interface SubmitState { isSubmitting: boolean; isSuccess: boolean; errorMessage: string | null; }
  const [submit, setSubmit] = useState<SubmitState>({ isSubmitting: false, isSuccess: false, errorMessage: null });
  const web3FormsKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const upcoming = await getPublicUpcomingEvents();
        setEvents(upcoming);
      } catch {
        setEvents([]);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--black-grey)]">
      {/* Hero */}
      <section className="relative min-h-[52vh] lg:min-h-[56vh] flex items-center overflow-hidden">
        {/* Background image — bottle service on the floor */}
        <div className="absolute inset-0">
          <Image
            src="/vip-bg.jpg"
            alt="Bottle service at a Nazaara event"
            fill
            className="object-cover object-[50%_28%] [filter:sepia(0.5)_saturate(1.1)_brightness(0.52)]"
            priority
          />
          <div className="absolute inset-0 bg-[var(--gold)]/15 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--maroon-red)]/85 via-[var(--maroon-red)]/72 to-[var(--dark-green)]/80" />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--maroon-red)]/75 via-transparent to-[var(--black-grey)]/95" />
          <div className="absolute inset-0 bg-black/25" />
        </div>

        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="max-w-4xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px w-12 bg-[var(--gold)]" />
              <span className="text-[10px] font-neue-haas uppercase tracking-[0.5em] text-[var(--gold)]">
                Nazaara Live
              </span>
            </div>

            <h1 className="heading-display text-[var(--off-white)] mb-6 pb-[0.08em] [text-shadow:0_2px_20px_rgba(0,0,0,0.5)]">
              Table
              <span className="block text-gold-metallic">Service</span>
            </h1>

            <p className="text-base lg:text-lg font-neue-haas text-[var(--off-white)]/85 leading-relaxed max-w-2xl [text-shadow:0_1px_12px_rgba(0,0,0,0.5)]">
              Some nights deserve more than a spot on the dance floor. Our hosts handle
              the details so your group can settle in and stay. We accommodate groups
              of 4 to 50.
            </p>
          </div>
        </div>

        {/* Gold accent at the bottom edge */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[9]">
          <div className="relative w-full max-w-7xl mx-auto px-6 lg:px-12">
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[var(--gold)]/18 to-transparent [mask-image:linear-gradient(to_right,transparent,black_35%,black_65%,transparent)]" />
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--gold)] via-60% to-transparent" />
          </div>
        </div>
      </section>

      {/* Request form */}
      <section id="vip-form" className="py-14 lg:py-24">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px w-12 bg-[var(--gold)]" />
              <span className="text-[10px] font-neue-haas uppercase tracking-[0.5em] text-[var(--gold)]">
                Reserve Your Table
              </span>
            </div>

            <h2 className="heading-section text-[var(--off-white)] mb-8 pb-[0.08em]">
              Request a <span className="text-gold-metallic">Table</span>
            </h2>

            {/* Card flip: form on the front, confirmation on the back */}
            <div className="relative [perspective:1400px]">
              <div
                className={`relative transition-transform duration-700 [transform-style:preserve-3d] ${
                  submit.isSuccess ? "[transform:rotateY(180deg)]" : ""
                }`}
              >
                {/* Front — form */}
                <div className="relative [backface-visibility:hidden] bg-gradient-to-br from-[var(--maroon-red)]/10 via-transparent to-[var(--dark-green)]/5 backdrop-blur-sm">
                  <form
                    className="space-y-8"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!web3FormsKey) {
                        setSubmit({ isSubmitting: false, isSuccess: false, errorMessage: "Missing Web3Forms access key." });
                        return;
                      }
                      const form = e.currentTarget as HTMLFormElement;
                      const data = new FormData(form);
                      const payload = {
                        access_key: web3FormsKey,
                        name: data.get("name"),
                        event: data.get("event"),
                        group_size: data.get("group_size"),
                        phone: data.get("phone"),
                        email: data.get("email"),
                        notes: data.get("notes"),
                        subject: "New VIP Table Request via Nazaara",
                      } as Record<string, unknown>;

                      setSubmit({ isSubmitting: true, isSuccess: false, errorMessage: null });
                      try {
                        const res = await fetch("https://api.web3forms.com/submit", {
                          method: "POST",
                          headers: { "Content-Type": "application/json", Accept: "application/json" },
                          body: JSON.stringify(payload),
                        });
                        const json = await res.json();
                        if (json?.success) {
                          setSubmit({ isSubmitting: false, isSuccess: true, errorMessage: null });
                          form.reset();
                        } else {
                          setSubmit({ isSubmitting: false, isSuccess: false, errorMessage: json?.message || "Submission failed." });
                        }
                      } catch (err) {
                        setSubmit({ isSubmitting: false, isSuccess: false, errorMessage: (err as Error).message });
                      }
                    }}
                  >
                    {/* Name + Event */}
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="relative">
                        <label htmlFor="name" className="absolute -top-2 left-0 text-[9px] font-neue-haas uppercase tracking-[0.3em] text-[var(--gold)]">
                          Your Name
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          placeholder="Jane Doe"
                          className="w-full px-0 pt-6 pb-3 bg-transparent border-0 border-b border-[var(--gold)]/30 text-[var(--off-white)] placeholder:text-[var(--off-white)]/20 focus:border-[var(--gold)]/60 focus:outline-none transition-all duration-300 font-neue-haas text-lg"
                        />
                      </div>

                      <div className="relative">
                        <label htmlFor="event" className="absolute -top-2 left-0 text-[9px] font-neue-haas uppercase tracking-[0.3em] text-[var(--gold)]">
                          Event
                        </label>
                        <select
                          id="event"
                          name="event"
                          required
                          defaultValue=""
                          className="peer w-full appearance-none px-0 pr-8 pt-6 pb-3 bg-transparent border-0 border-b border-[var(--gold)]/30 text-[var(--off-white)] focus:border-[var(--gold)] focus:outline-none transition-all duration-300 font-neue-haas text-lg cursor-pointer invalid:text-[var(--off-white)]/40 [&>option]:bg-[var(--black-grey)] [&>option]:text-[var(--off-white)] [&>option]:py-3"
                        >
                          <option value="" disabled>
                            Select an event
                          </option>
                          {events.map((ev) => (
                            <option key={ev.id} value={`${ev.title} — ${ev.city}, ${ev.date}`}>
                              {ev.title} · {ev.city} · {ev.date}
                            </option>
                          ))}
                          <option value="Not listed / general inquiry">
                            Not listed / general inquiry
                          </option>
                        </select>
                        {/* Custom gold chevron */}
                        <svg
                          aria-hidden="true"
                          className="pointer-events-none absolute right-0 bottom-4 h-4 w-4 text-[var(--gold)]/70 peer-focus:text-[var(--gold)] transition-colors"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                        </svg>
                      </div>
                    </div>

                    {/* Group size + Phone */}
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="relative">
                        <label htmlFor="group_size" className="absolute -top-2 left-0 text-[9px] font-neue-haas uppercase tracking-[0.3em] text-[var(--gold)]">
                          Group Size
                        </label>
                        <input
                          id="group_size"
                          name="group_size"
                          type="number"
                          min={1}
                          max={100}
                          required
                          placeholder="12"
                          className="w-full px-0 pt-6 pb-3 bg-transparent border-0 border-b border-[var(--gold)]/30 text-[var(--off-white)] placeholder:text-[var(--off-white)]/20 focus:border-[var(--gold)]/60 focus:outline-none transition-all duration-300 font-neue-haas text-lg"
                        />
                      </div>

                      <div className="relative">
                        <label htmlFor="phone" className="absolute -top-2 left-0 text-[9px] font-neue-haas uppercase tracking-[0.3em] text-[var(--gold)]">
                          Phone Number
                        </label>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          required
                          placeholder="(604) 555-0123"
                          className="w-full px-0 pt-6 pb-3 bg-transparent border-0 border-b border-[var(--gold)]/30 text-[var(--off-white)] placeholder:text-[var(--off-white)]/20 focus:border-[var(--gold)]/60 focus:outline-none transition-all duration-300 font-neue-haas text-lg"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="relative">
                      <label htmlFor="email" className="absolute -top-2 left-0 text-[9px] font-neue-haas uppercase tracking-[0.3em] text-[var(--gold)]">
                        Email Address
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="jane@example.com"
                        className="w-full px-0 pt-6 pb-3 bg-transparent border-0 border-b border-[var(--gold)]/30 text-[var(--off-white)] placeholder:text-[var(--off-white)]/20 focus:border-[var(--gold)]/60 focus:outline-none transition-all duration-300 font-neue-haas text-lg"
                      />
                    </div>

                    {/* Optional notes */}
                    <div className="relative">
                      <label htmlFor="notes" className="absolute -top-2 left-0 text-[9px] font-neue-haas uppercase tracking-[0.3em] text-[var(--gold)]">
                        Anything Else <span className="text-[var(--off-white)]/50">(optional)</span>
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        placeholder="Birthday, bottle preferences, arrival time, anything we should know"
                        className="w-full px-0 pt-6 pb-3 bg-transparent border-0 border-b border-[var(--gold)]/30 text-[var(--off-white)] placeholder:text-[var(--off-white)]/20 focus:border-[var(--gold)]/60 focus:outline-none transition-all duration-300 font-neue-haas text-lg resize-none"
                      />
                    </div>

                    {/* Submit */}
                    <div className="pt-6 space-y-6">
                      <p className="text-[10px] font-neue-haas text-[var(--off-white)]/60 tracking-wider">
                        Your information is used solely to arrange your table and is never shared.
                      </p>

                      <Button
                        type="submit"
                        size="lg"
                        disabled={submit.isSubmitting}
                        className="w-full px-7 py-4 text-xs uppercase tracking-[0.3em] font-light border-0 bg-gold-metallic"
                        style={{ color: 'var(--maroon-red)' }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                      >
                        {submit.isSubmitting ? 'Sending…' : 'Request Table'}
                      </Button>

                      {submit.errorMessage && (
                        <p className="text-sm text-red-500/80 font-neue-haas">{submit.errorMessage}</p>
                      )}
                    </div>
                  </form>
                </div>

                {/* Back — confirmation */}
                <div className="absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden] flex items-center justify-center border border-[var(--gold)]/20 bg-gradient-to-br from-[var(--maroon-red)]/20 via-transparent to-[var(--dark-green)]/10 backdrop-blur-sm">
                  <div className="text-center px-8 space-y-6">
                    <div className="mx-auto w-16 h-16 rounded-full border-2 border-[var(--gold)] flex items-center justify-center">
                      <svg className="w-8 h-8 text-[var(--gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <h3 className="heading-section text-[var(--off-white)] pb-[0.08em]">Table Requested</h3>
                    <p className="font-neue-haas text-[var(--off-white)]/70 max-w-sm mx-auto leading-relaxed">
                      We&apos;ll be in touch within 24 hours to confirm availability and
                      pricing for your night.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSubmit({ isSubmitting: false, isSuccess: false, errorMessage: null })}
                      className="text-[10px] font-neue-haas uppercase tracking-[0.3em] text-[var(--gold)]/60 hover:text-[var(--gold)] transition-colors cursor-pointer"
                    >
                      Request another table
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct contact */}
            <div className="mt-12 pt-8 border-t border-[var(--gold)]/10">
              <p className="text-sm font-neue-haas text-[var(--off-white)]/70 mb-3">
                Prefer to reach out directly?
              </p>
              <a
                href="mailto:contact@nazaara.live"
                className="text-xl font-prettywise text-[var(--gold)] hover:text-[var(--gold)]/80 transition-colors"
              >
                contact@nazaara.live
              </a>
            </div>
          </div>
        </div>
      </section>
      {/* Typical Inclusions */}
      <section className="relative py-14 lg:py-24 border-t border-[var(--gold)]/10 bg-gradient-to-b from-[var(--black-grey)] via-[var(--black-grey)] to-[var(--maroon-red)]/10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]">
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <defs>
              <pattern id="vip-grid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="80" height="80" fill="none" stroke="var(--gold)" strokeWidth="0.5" />
                <rect x="10" y="10" width="60" height="60" fill="none" stroke="var(--gold)" strokeWidth="0.3" />
                <line x1="0" y1="40" x2="80" y2="40" stroke="var(--gold)" strokeWidth="0.2" />
                <line x1="40" y1="0" x2="40" y2="80" stroke="var(--gold)" strokeWidth="0.2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#vip-grid)" />
          </svg>
        </div>

        <div className="relative container mx-auto px-6 lg:px-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-10">
              <div className="h-px w-12 bg-[var(--gold)]" />
              <span className="text-[10px] font-neue-haas uppercase tracking-[0.5em] text-[var(--gold)]">
                Typical Inclusions
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-[var(--gold)]/20 to-transparent" />
            </div>

            <ol className="space-y-0">
              {inclusions.map((item, index) => (
                <li
                  key={item.title}
                  className={`flex items-baseline gap-5 py-5 ${
                    index < inclusions.length - 1 ? "border-b border-[var(--gold)]/10" : ""
                  }`}
                >
                  <span className="font-prettywise text-lg text-[var(--gold)] shrink-0 w-8">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="heading-card text-[var(--off-white)] leading-snug">
                      {item.title}
                    </h3>
                    <p className="mt-1 font-neue-haas text-sm text-[var(--off-white)]/70">
                      {item.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <p className="mt-8 font-neue-haas text-xs text-[var(--off-white)]/60 leading-relaxed">
              * Bottle show and marquee signage depend on the venue. We&apos;ll confirm
              what&apos;s available for your event when we reply.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
