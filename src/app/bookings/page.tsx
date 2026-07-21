'use client';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { getBookingsDJs } from "@/lib/admin-actions";
import { Users, Star, Crown } from "lucide-react";
import { useState, useEffect } from "react";
import {
  heroContent,
  privateEventsContent,
  djRosterContent,
  contactFormContent
} from "@/content/bookings";

// export const revalidate = 0;

interface DJ {
  id: number;
  name: string;
  title: string | null;
  specialty: string | null;
  experience: string | null;
  performances: string | null;
  bio: string | null;
  highlights: string[] | null;
  instagram: string | null;
  image: string | null;
}

// Helper function to map icon names to components
function getIcon(iconName: string) {
  const icons = {
    Star,
    Crown,
    Users
  };
  return icons[iconName as keyof typeof icons];
}

export default function BookingsPage() {
  const [djRoster, setDjRoster] = useState<DJ[]>([]);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [expandedDj, setExpandedDj] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  interface SubmitState { isSubmitting: boolean; isSuccess: boolean; errorMessage: string | null; }
  const [contactSubmit, setContactSubmit] = useState<SubmitState>({ isSubmitting: false, isSuccess: false, errorMessage: null });
  const web3FormsKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;

  useEffect(() => {
    const fetchDJs = async () => {
      const djs = await getBookingsDJs();
      setDjRoster(djs);
    };
    fetchDJs();
  }, []);

  const inquireAbout = (dj: DJ) => {
    setMessage(`I'd like to inquire about booking ${dj.name} for a private event.\n\n`);
    const formSection = document.getElementById('contact-form');
    formSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[var(--black-grey)]">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src={heroContent.backgroundImage}
            alt="DJ performing with dramatic lighting"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--maroon-red)]/80 via-[var(--maroon-red)]/60 to-[var(--dark-green)]/70" />
        </div>

        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="max-w-5xl">

            {/* Main Title */}
            <h1 className="heading-display text-[var(--off-white)] mb-8">
              {heroContent.title}
              <span className="block text-[var(--gold)]">{heroContent.subtitle}</span>
            </h1>

            <p className="text-lg font-neue-haas text-[var(--off-white)]/70 leading-relaxed max-w-2xl mb-12">
              {heroContent.description}
            </p>

          </div>
        </div>

        {/* Gold accent at the exact bottom edge */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[9]">
          <div className="relative w-full max-w-7xl mx-auto px-6 lg:px-12">
            {/* Upward glow from the edge (fades horizontally) */}
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[var(--gold)]/18 to-transparent [mask-image:linear-gradient(to_right,transparent,black_35%,black_65%,transparent)]" />
            {/* Hairline sits exactly on the bottom edge */}
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--gold)] via-60% to-transparent" />
          </div>
        </div>

      </section>

      {/* Artist Roster — leads the page */}
      <section className="relative py-14 lg:py-24 bg-gradient-to-b from-[var(--black-grey)] via-[var(--black-grey)] to-[var(--maroon-red)]/10 overflow-hidden">
        {/* Art Deco inspired grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <defs>
              <pattern id="dj-roster-grid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="80" height="80" fill="none" stroke="var(--gold)" strokeWidth="0.5" />
                <rect x="10" y="10" width="60" height="60" fill="none" stroke="var(--gold)" strokeWidth="0.3" />
                <line x1="0" y1="40" x2="80" y2="40" stroke="var(--gold)" strokeWidth="0.2" />
                <line x1="40" y1="0" x2="40" y2="80" stroke="var(--gold)" strokeWidth="0.2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dj-roster-grid)" />
          </svg>
        </div>

        <div className="relative container mx-auto px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            {/* Section heading */}
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="w-16 h-px bg-[var(--gold)]/20" />
                <span className="text-[10px] font-neue-haas uppercase tracking-[0.5em] text-[var(--gold)]/40">
                  {djRosterContent.sectionTitle}
                </span>
                <div className="w-16 h-px bg-[var(--gold)]/20" />
              </div>
              <h2 className="heading-section mb-6">
                <span className="text-[var(--gold)]">{djRosterContent.heading}</span>
              </h2>
              <p className="text-lg font-neue-haas text-[var(--off-white)]/60 max-w-2xl mx-auto">
                {djRosterContent.description}
              </p>
            </div>

            <div className="space-y-8">
              {/* Group DJs into rows of 3 for desktop */}
              {[0, 3].map((startIdx) => (
                <div key={startIdx} className="space-y-8">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {djRoster.slice(startIdx, startIdx + 3).map((dj) => (
                      <div key={dj.id} className="group relative">
                        {/* Card */}
                        <div
                          className="relative cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
                          onClick={() => setExpandedDj(expandedDj === dj.id ? null : dj.id)}
                        >
                          {/* Click indicator */}
                          <div className="absolute top-4 right-4 z-10 bg-[var(--black-grey)]/80 backdrop-blur-sm px-3 py-1.5 border border-[var(--gold)]/20">
                            <span className="text-[9px] font-neue-haas uppercase tracking-[0.3em] text-[var(--gold)]/60">
                              {expandedDj === dj.id ? 'Close' : 'View Bio'}
                            </span>
                          </div>

                    {/* Square Image Container */}
                    <div className="relative aspect-square overflow-hidden bg-gradient-to-b from-[var(--maroon-red)]/5 to-[var(--black-grey)]">
                      {dj.image && !imageErrors[dj.id] ? (
                        <>
                          <Image
                            src={dj.image}
                            alt={dj.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                            onError={() => {
                              setImageErrors(prev => ({ ...prev, [dj.id]: true }));
                            }}
                          />
                          {/* Enhanced gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-[var(--black-grey)] via-[var(--black-grey)]/30 to-transparent" />
                          {/* Gold accent line at bottom */}
                          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--gold)]/30 to-transparent" />
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-b from-[var(--maroon-red)]/10 to-[var(--black-grey)]">
                          {/* Geometric pattern background */}
                          <div className="absolute inset-0 opacity-5">
                            <div className="absolute inset-8 border border-[var(--gold)]" />
                            <div className="absolute inset-12 border border-[var(--gold)] rotate-45" />
                          </div>
                          {/* Minimalist user icon */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg
                              className="w-20 h-20 text-[var(--gold)]/10"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1" />
                              <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content - Refined Layout */}
                    <div className="relative">
                      {/* Name and specialty */}
                      <div className="border-t border-[var(--gold)]/10 pt-6 pb-4">
                        <h3 className="heading-card text-[var(--off-white)] mb-3">
                          {dj.name}
                        </h3>
                        <p className="text-sm font-neue-haas text-[var(--gold)]/60 tracking-wide">
                          {dj.specialty}
                        </p>
                      </div>

                      {/* Social + Book row */}
                      <div className="flex items-center justify-between pt-4 border-t border-[var(--gold)]/5">
                        <a
                          href={dj.instagram ? `https://instagram.com/${dj.instagram}` : '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="group flex items-center justify-center w-9 h-9 border border-[var(--gold)]/10 hover:border-[var(--gold)]/30 hover:bg-[var(--gold)]/5 transition-all duration-300"
                        >
                          <svg
                            className="w-4 h-4 text-[var(--gold)]/40 group-hover:text-[var(--gold)]/80 transition-all duration-300"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"/>
                            <path d="M18 5C17.4477 5 17 5.44772 17 6C17 6.55228 17.4477 7 18 7C18.5523 7 19 6.55228 19 6C19 5.44772 18.5523 5 18 5Z"/>
                            <path fillRule="evenodd" clipRule="evenodd" d="M1.65396 4.27606C1 5.55953 1 7.23969 1 10.6V13.4C1 16.7603 1 18.4405 1.65396 19.7239C2.2292 20.8529 3.14708 21.7708 4.27606 22.346C5.55953 23 7.23969 23 10.6 23H13.4C16.7603 23 18.4405 23 19.7239 22.346C20.8529 21.7708 21.7708 20.8529 22.346 19.7239C23 18.4405 23 16.7603 23 13.4V10.6C23 7.23969 23 5.55953 22.346 4.27606C21.7708 3.14708 20.8529 2.2292 19.7239 1.65396C18.4405 1 16.7603 1 13.4 1H10.6C7.23969 1 5.55953 1 4.27606 1.65396C3.14708 2.2292 2.2292 3.14708 1.65396 4.27606ZM13.4 3H10.6C8.88684 3 7.72225 3.00156 6.82208 3.0751C5.94524 3.14674 5.49684 3.27659 5.18404 3.43597C4.43139 3.81947 3.81947 4.43139 3.43597 5.18404C3.27659 5.49684 3.14674 5.94524 3.0751 6.82208C3.00156 7.72225 3 8.88684 3 10.6V13.4C3 15.1132 3.00156 16.2777 3.0751 17.1779C3.14674 18.0548 3.27659 18.5032 3.43597 18.816C3.81947 19.5686 4.43139 20.1805 5.18404 20.564C5.49684 20.7234 5.94524 20.8533 6.82208 20.9249C7.72225 20.9984 8.88684 21 10.6 21H13.4C15.1132 21 16.2777 20.9984 17.1779 20.9249C18.0548 20.8533 18.5032 20.7234 18.816 20.564C19.5686 20.1805 20.1805 19.5686 20.564 18.816C20.7234 18.5032 20.8533 18.0548 20.9249 17.1779C20.9984 16.2777 21 15.1132 21 13.4V10.6C21 8.88684 20.9984 7.72225 20.9249 6.82208C20.8533 5.94524 20.7234 5.49684 20.564 5.18404C20.1805 4.43139 19.5686 3.81947 18.816 3.43597C18.5032 3.27659 18.0548 3.14674 17.1779 3.0751C16.2777 3.00156 15.1132 3 13.4 3Z"/>
                          </svg>
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            inquireAbout(dj);
                          }}
                          className="px-4 py-2 text-[9px] font-neue-haas uppercase tracking-[0.3em] text-[var(--gold)]/70 border border-[var(--gold)]/20 hover:border-[var(--gold)]/50 hover:text-[var(--gold)] hover:bg-[var(--gold)]/5 transition-all duration-300 cursor-pointer"
                        >
                          Book
                        </button>
                      </div>
                    </div>
                  </div>
                      </div>
                    ))}
                  </div>

                  {/* Expandable Bio Section for this row */}
                  {djRoster.slice(startIdx, startIdx + 3).some(dj => expandedDj === dj.id) && (
                    <div className="mt-8">
                      {djRoster.slice(startIdx, startIdx + 3).map(dj => {
                        if (expandedDj !== dj.id) return null;
                        return (
                          <div key={`bio-${dj.id}`} className="relative bg-[var(--black-grey)] border border-[var(--gold)]/10 overflow-hidden">
                            {/* Decorative accent */}
                            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--gold)]/50 to-transparent" />

                            <div className="p-8 lg:p-12">
                              <div className="grid lg:grid-cols-3 gap-8">
                                {/* Bio Text */}
                                <div className="lg:col-span-2 space-y-6">
                                  <div>
                                    <h3 className="heading-card text-[var(--gold)] mb-4">
                                      About {dj.name}
                                    </h3>
                                    <p className="text-base font-neue-haas text-[var(--off-white)]/70 leading-relaxed">
                                      {dj.bio}
                                    </p>
                                  </div>

                                  {/* Highlights */}
                                  <div>
                                    <h4 className="text-sm font-neue-haas uppercase tracking-[0.3em] text-[var(--gold)]/60 mb-4">
                                      Career Highlights
                                    </h4>
                                    <ul className="space-y-2">
                                      {dj.highlights?.map((highlight, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                          <div className="w-1 h-1 bg-[var(--gold)]/60 rounded-full mt-2" />
                                          <span className="text-sm font-neue-haas text-[var(--off-white)]/60">
                                            {highlight}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>

                                {/* Contact/Booking CTA */}
                                <div className="lg:border-l border-[var(--gold)]/10 lg:pl-8">
                                  <div className="space-y-6">
                                    <div>
                                      <h4 className="text-sm font-neue-haas uppercase tracking-[0.3em] text-[var(--gold)]/60 mb-2">
                                        Booking Status
                                      </h4>
                                      <p className="text-lg font-prettywise text-[var(--off-white)]">
                                        Available for Booking
                                      </p>
                                    </div>

                                    <div className="pt-4">
                                      <Button
                                        size="sm"
                                        className="w-full px-6 py-3 text-xs uppercase tracking-[0.3em] font-light border-0"
                                        style={{
                                          backgroundColor: 'var(--gold)',
                                          color: 'var(--maroon-red)'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          inquireAbout(dj);
                                        }}
                                      >
                                        Inquire About {dj.name}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Close button */}
                              <div
                                className="absolute top-4 right-4 text-[var(--gold)]/40 hover:text-[var(--gold)]/60 cursor-pointer transition-colors"
                                onClick={() => setExpandedDj(null)}
                              >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Private Events Introduction */}
      <section className="py-14 lg:py-24 bg-gradient-to-b from-[var(--black-grey)] to-[var(--maroon-red)]/5 border-t border-[var(--gold)]/10">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-8">
                <div className="w-8 h-px bg-[var(--gold)]/40" />
                <span className="text-[10px] font-neue-haas uppercase tracking-[0.5em] text-[var(--gold)]/60">
                  {privateEventsContent.sectionTitle}
                </span>
                <div className="w-8 h-px bg-[var(--gold)]/40" />
              </div>

              <h2 className="heading-section text-[var(--off-white)] mb-8">
                {privateEventsContent.heading}
                <span className="block text-[var(--gold)]">{privateEventsContent.subHeading}</span>
              </h2>

              <div className="space-y-6 text-[var(--off-white)]/70 font-neue-haas leading-relaxed mb-12 max-w-3xl mx-auto">
                <p>
                  {privateEventsContent.description}
                </p>
              </div>

              {/* Service Details */}
              <div className="space-y-6 mb-12 max-w-2xl mx-auto">
                {privateEventsContent.services.map((service, index) => {
                  const IconComponent = getIcon(service.icon);
                  return (
                    <div key={index} className="flex items-start gap-4 text-left">
                      <IconComponent className="w-5 h-5 text-[var(--gold)] mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="text-lg font-prettywise text-[var(--off-white)] mb-2">{service.title}</h3>
                        <p className="text-sm font-neue-haas text-[var(--off-white)]/50">
                          {service.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact-form" className="py-14 lg:py-24 border-t border-[var(--gold)]/10">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              {/* Left Content */}
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-px bg-[var(--gold)]/20" />
                  <span className="text-[10px] font-neue-haas uppercase tracking-[0.5em] text-[var(--gold)]/40">
                    {contactFormContent.sectionTitle}
                  </span>
                </div>

                <h2 className="heading-section text-[var(--off-white)] mb-8">
                  {contactFormContent.heading}
                  <span className="block text-[var(--gold)]">{contactFormContent.subHeading}</span>
                </h2>

                <p className="text-lg font-neue-haas text-[var(--off-white)]/60 leading-relaxed mb-12">
                  {contactFormContent.description}
                </p>

                <div className="space-y-8 mb-12">
                  {contactFormContent.contactInfo.map((info, index) => (
                    <div key={index}>
                      <h3 className="text-xl font-prettywise text-[var(--off-white)] mb-2">{info.title}</h3>
                      <p className="text-sm font-neue-haas text-[var(--off-white)]/50">
                        {info.description}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-8 border-t border-[var(--gold)]/10">
                  <p className="text-sm font-neue-haas text-[var(--off-white)]/40 mb-4">
                    {contactFormContent.contactEmail.label}
                  </p>
                  <a
                    href={`mailto:${contactFormContent.contactEmail.email}`}
                    className="text-xl font-prettywise text-[var(--gold)] hover:text-[var(--gold)]/80 transition-colors"
                  >
                    {contactFormContent.contactEmail.email}
                  </a>
                </div>
              </div>

              {/* Right Form - Enhanced Design */}
              <div className="relative">
                {/* Card flip container: form on the front, thank-you on the back */}
                <div className="relative [perspective:1400px]">
                  <div
                    className={`relative transition-transform duration-700 [transform-style:preserve-3d] ${
                      contactSubmit.isSuccess ? "[transform:rotateY(180deg)]" : ""
                    }`}
                  >
                {/* Front — premium form container with subtle gradient background */}
                <div className="relative [backface-visibility:hidden] bg-gradient-to-br from-[var(--maroon-red)]/10 via-transparent to-[var(--dark-green)]/5 sm:p-12 backdrop-blur-sm">

                  <form
                    className="space-y-8"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!web3FormsKey) {
                        setContactSubmit({ isSubmitting: false, isSuccess: false, errorMessage: "Missing Web3Forms access key." });
                        return;
                      }
                      const form = e.currentTarget as HTMLFormElement;
                      const data = new FormData(form);
                      const payload = {
                        access_key: web3FormsKey,
                        name: data.get("name"),
                        email: data.get("email"),
                        event_type: data.get("event_type"),
                        event_date: data.get("event_date"),
                        event_location: data.get("event_location"),
                        expected_guests: data.get("expected_guests"),
                        message: data.get("message"),
                        subject: "New Booking Inquiry via Nazaara",
                      } as Record<string, unknown>;

                      setContactSubmit({ isSubmitting: true, isSuccess: false, errorMessage: null });
                      try {
                        const res = await fetch("https://api.web3forms.com/submit", {
                          method: "POST",
                          headers: { "Content-Type": "application/json", Accept: "application/json" },
                          body: JSON.stringify(payload),
                        });
                        const json = await res.json();
                        if (json?.success) {
                          setContactSubmit({ isSubmitting: false, isSuccess: true, errorMessage: null });
                          form.reset();
                          setMessage("");
                        } else {
                          setContactSubmit({ isSubmitting: false, isSuccess: false, errorMessage: json?.message || "Submission failed." });
                        }
                      } catch (err) {
                        setContactSubmit({ isSubmitting: false, isSuccess: false, errorMessage: (err as Error).message });
                      }
                    }}
                  >
                    {/* Personal Information Row */}
                    <div className="grid md:grid-cols-2 gap-8">
                      {contactFormContent.formFields.personalInfo.map((field, index) => (
                        <div key={index} className="relative">
                          <label className="absolute -top-2 left-0 text-[9px] font-neue-haas uppercase tracking-[0.3em] text-[var(--gold)]/40">
                            {field.label}
                          </label>
                          <input
                            name={index === 0 ? "name" : "email"}
                            type={field.type}
                            required={index === 0 || index === 1}
                            className="w-full px-0 pt-6 pb-3 bg-transparent border-0 border-b border-[var(--gold)]/30 text-[var(--off-white)] placeholder:text-[var(--off-white)]/20 focus:border-[var(--gold)]/60 focus:outline-none transition-all duration-300 font-neue-haas text-lg"
                            placeholder={field.placeholder}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Event Details Row */}
                    <div className="grid md:grid-cols-2 gap-8">
                      {contactFormContent.formFields.eventDetails.map((field, index) => (
                        <div key={index} className="relative">
                          <label className="absolute -top-2 left-0 text-[9px] font-neue-haas uppercase tracking-[0.3em] text-[var(--gold)]/40">
                            {field.label}
                          </label>
                          <input
                            name={index === 0 ? "event_type" : "event_date"}
                            type={field.type}
                            required
                            className="w-full px-0 pt-6 pb-3 bg-transparent border-0 border-b border-[var(--gold)]/30 text-[var(--off-white)] placeholder:text-[var(--off-white)]/20 focus:border-[var(--gold)]/60 focus:outline-none transition-all duration-300 font-neue-haas text-lg"
                            placeholder={field.placeholder}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Location and Scale Row */}
                    <div className="grid md:grid-cols-2 gap-8">
                      {contactFormContent.formFields.locationAndScale.map((field, index) => (
                        <div key={index} className="relative">
                          <label className="absolute -top-2 left-0 text-[9px] font-neue-haas uppercase tracking-[0.3em] text-[var(--gold)]/40">
                            {field.label}
                          </label>
                          <input
                            name={index === 0 ? "event_location" : "expected_guests"}
                            type={field.type}
                            required
                            className="w-full px-0 pt-6 pb-3 bg-transparent border-0 border-b border-[var(--gold)]/30 text-[var(--off-white)] placeholder:text-[var(--off-white)]/20 focus:border-[var(--gold)]/60 focus:outline-none transition-all duration-300 font-neue-haas text-lg"
                            placeholder={field.placeholder}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Vision Section */}
                    <div className="relative">
                      <label className="absolute -top-2 left-0 text-[9px] font-neue-haas uppercase tracking-[0.3em] text-[var(--gold)]/40">
                        {contactFormContent.formFields.vision.label}
                      </label>
                      <textarea
                        name="message"
                        rows={contactFormContent.formFields.vision.rows}
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-0 pt-6 pb-3 bg-transparent border-0 border-b border-[var(--gold)]/30 text-[var(--off-white)] placeholder:text-[var(--off-white)]/20 focus:border-[var(--gold)]/60 focus:outline-none transition-all duration-300 font-neue-haas text-lg resize-none"
                        placeholder={contactFormContent.formFields.vision.placeholder}
                      />
                    </div>

                    {/* Submit Section with Enhanced Design */}
                    <div className="pt-8 space-y-6">
                      {/* Privacy Note */}
                      <p className="text-[10px] font-neue-haas text-[var(--off-white)]/30 tracking-wider">
                        {contactFormContent.privacyNote}
                      </p>

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        size="lg"
                        disabled={contactSubmit.isSubmitting}
                        className="w-full px-7 py-4 text-xs uppercase tracking-[0.3em] font-light border-0"
                        style={{
                          backgroundColor: 'var(--gold)',
                          color: 'var(--maroon-red)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                      >
                        {contactSubmit.isSubmitting ? 'Submitting…' : contactFormContent.submitButtonText}
                      </Button>
                      {contactSubmit.errorMessage && (
                        <p className="text-sm text-red-500/80 font-neue-haas">{contactSubmit.errorMessage}</p>
                      )}
                    </div>
                  </form>
                </div>

                {/* Back — thank-you card */}
                <div className="absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden] flex items-center justify-center border border-[var(--gold)]/20 bg-gradient-to-br from-[var(--maroon-red)]/20 via-transparent to-[var(--dark-green)]/10 backdrop-blur-sm">
                  <div className="text-center px-8 space-y-6">
                    <div className="mx-auto w-16 h-16 rounded-full border-2 border-[var(--gold)] flex items-center justify-center">
                      <svg className="w-8 h-8 text-[var(--gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <h3 className="heading-section text-[var(--off-white)]">Thank You</h3>
                    <p className="font-neue-haas text-[var(--off-white)]/70 max-w-sm mx-auto leading-relaxed">
                      Your inquiry is in. We&apos;ll come back within 24 hours with availability and ideas.
                    </p>
                    <button
                      type="button"
                      onClick={() => setContactSubmit({ isSubmitting: false, isSuccess: false, errorMessage: null })}
                      className="text-[10px] font-neue-haas uppercase tracking-[0.3em] text-[var(--gold)]/60 hover:text-[var(--gold)] transition-colors cursor-pointer"
                    >
                      Send another inquiry
                    </button>
                  </div>
                </div>
                  </div>
                </div>

                {/* Subtle background pattern */}
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                  <div className="absolute top-1/4 right-1/4 w-64 h-64 border border-[var(--gold)] rotate-45" />
                  <div className="absolute bottom-1/4 left-1/3 w-48 h-48 border border-[var(--gold)] rotate-12" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
