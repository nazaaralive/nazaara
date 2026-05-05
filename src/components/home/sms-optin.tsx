"use client";

import { useState, useRef } from "react";
import Link from "next/link";

// Cities available in the opt-in flow, sorted A–Z. "Other" is pinned
// to the bottom as a catch-all fallback.
const CITIES = [
  "Atlanta",
  "Calgary",
  "Chicago",
  "Dallas",
  "Edmonton",
  "Houston",
  "Los Angeles",
  "Miami",
  "New York",
  "San Francisco",
  "Seattle",
  "Toronto",
  "Vancouver",
  "Other",
];

export function SmsOptIn() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  // Two consent states — marketing (the actual SMS opt-in) and terms acceptance.
  // Transactional/informational SMS is handled by our ticketing partners (Eventbrite,
  // Shopify, etc.), NOT through this Twilio campaign, so we don't collect that consent here.
  // Marketing consent is the only thing the backend uses to decide whether to subscribe.
  // T&C must NOT be required to submit per Twilio TCPA compliance guidance.
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "already" | "not_subscribed" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const honeypotRef = useRef<HTMLInputElement>(null);

  const normalizePhone = (raw: string): string | null => {
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 10) return "+1" + digits;
    if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
    if (digits.startsWith("+") && digits.length >= 11) return raw.replace(/[^\d+]/g, "");
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (honeypotRef.current?.value) return;

    if (!name.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }
    if (!city.trim()) {
      setErrorMsg("Please enter your city.");
      return;
    }
    const normalized = normalizePhone(phone);
    if (!normalized) {
      setErrorMsg("Please enter a valid US phone number.");
      return;
    }
    // No client-side gate on marketingOptIn — TCPA forbids conditioning form
    // submission on marketing consent. Backend decides whether to subscribe.

    setStatus("loading");
    try {
      const res = await fetch("https://nazaara-sms.vercel.app/api/optin-public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: normalized,
          city: city.trim(),
          source: "website_footer",
          marketingOptIn,
          acceptedTerms,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.subscribed === false) {
          // Form submitted but marketing consent wasn't given — leave the
          // form populated so the user can re-tick the marketing box and
          // submit again without re-typing.
          setStatus("not_subscribed");
        } else {
          setStatus(data.alreadySubscribed ? "already" : "success");
          setName("");
          setPhone("");
          setCity("");
          setMarketingOptIn(false);
          setAcceptedTerms(false);
        }
      } else {
        setErrorMsg(data.error || "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  };

  if (status === "success" || status === "already") {
    const headline = status === "already" ? "Already Signed Up" : "You\u2019re In";
    const subcopy =
      status === "already"
        ? "Looks like this number is already subscribed to Nazaara Live SMS. We\u2019ll text you when drops and presales go live. Reply STOP at any time to unsubscribe."
        : "Check your phone for a confirmation text from Nazaara Live. We\u2019ll text you when event announcements, presales, and ticket drops go live. Reply STOP at any time to unsubscribe.";
    return (
      <section className="relative py-20 md:py-28 overflow-hidden" style={{ backgroundColor: "var(--black-grey)" }}>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, var(--gold) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        <div className="relative container mx-auto px-6 lg:px-12 text-center">
          <div className="max-w-xl mx-auto">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--gold)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--black-grey)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h3 className="text-3xl md:text-4xl font-prettywise mb-4" style={{ color: "var(--white)" }}>
              {headline}
            </h3>
            <p className="text-base font-neue-haas" style={{ color: "var(--white)", opacity: 0.7 }}>
              {subcopy}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-20 md:py-28 overflow-hidden" style={{ backgroundColor: "var(--black-grey)" }}>
      {/* Subtle dot pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, var(--gold) 1px, transparent 0)", backgroundSize: "40px 40px" }} />

      <div className="relative container mx-auto px-6 lg:px-12">
        <div className="max-w-2xl mx-auto text-center">
          {/* Eyebrow */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-8 h-px" style={{ backgroundColor: "var(--gold)" }} />
            <span className="text-[10px] uppercase tracking-[0.3em] font-neue-haas" style={{ color: "var(--gold)" }}>
              Stay Connected
            </span>
            <div className="w-8 h-px" style={{ backgroundColor: "var(--gold)" }} />
          </div>

          {/* Heading */}
          <h2 className="text-3xl md:text-5xl font-prettywise mb-4" style={{ color: "var(--white)" }}>
            Get SMS Drops
          </h2>
          <p className="text-base md:text-lg font-neue-haas mb-3" style={{ color: "var(--white)", opacity: 0.85 }}>
            Sign up for text messages from Nazaara Live. We&rsquo;ll text you when event announcements, presales, and ticket drops go live.
          </p>
          <p className="text-sm font-neue-haas mb-10" style={{ color: "var(--white)", opacity: 0.6 }}>
            Typically 2&ndash;6 SMS per month. Msg &amp; data rates may apply.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            {/* Honeypot */}
            <input ref={honeypotRef} type="text" name="website" autoComplete="off" tabIndex={-1} style={{ position: "absolute", left: "-9999px" }} />

            <div className="mb-3">
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setStatus("idle"); setErrorMsg(""); }}
                placeholder="Your name"
                autoComplete="name"
                maxLength={200}
                className="w-full px-4 py-3 rounded-lg text-base font-neue-haas outline-none transition-all"
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "var(--white)",
                }}
              />
            </div>

            <div className="mb-3">
              <select
                value={city}
                onChange={(e) => { setCity(e.target.value); setStatus("idle"); setErrorMsg(""); }}
                autoComplete="address-level2"
                className="w-full px-4 py-3 rounded-lg text-base font-neue-haas outline-none transition-all appearance-none"
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: city ? "var(--white)" : "rgba(255,255,255,0.5)",
                  backgroundImage:
                    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 1rem center",
                  paddingRight: "2.5rem",
                }}
              >
                <option value="" disabled style={{ color: "var(--black-grey)" }}>Your city</option>
                {CITIES.map((c) => (
                  <option key={c} value={c} style={{ color: "var(--black-grey)" }}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setStatus("idle"); setErrorMsg(""); }}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-3 rounded-lg text-base font-neue-haas outline-none transition-all"
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "var(--white)",
                }}
              />
            </div>

            {/* Consent checkboxes — two unchecked-by-default boxes (marketing + terms).
                Transactional/informational SMS is fulfilled by our ticketing partners,
                not via this Twilio campaign, so it isn't collected here. */}
            <div className="space-y-4 mb-5">
              {/* 1. Marketing/promotional SMS consent (the only one the backend gates subscription on) */}
              <label className="flex items-start gap-3 text-left cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={(e) => { setMarketingOptIn(e.target.checked); setStatus("idle"); setErrorMsg(""); }}
                  className="mt-1 shrink-0 h-4 w-4"
                  style={{ accentColor: "var(--gold)" }}
                  aria-describedby="marketing-consent-text"
                />
                <span id="marketing-consent-text" className="text-sm font-neue-haas leading-relaxed" style={{ color: "var(--white)", opacity: 0.9 }}>
                  By checking this box, you are allowing Nazaara Live to send you promotional/marketing SMS communications about event announcements, presales, and ticket drops. Frequency varies (typically 2&ndash;6 per month). Msg &amp; data rates may apply. Reply HELP for help, STOP to opt-out.
                </span>
              </label>

              {/* 2. Terms of Service & Privacy Policy (optional per Twilio compliance guidance) */}
              <label className="flex items-start gap-3 text-left cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => { setAcceptedTerms(e.target.checked); setStatus("idle"); setErrorMsg(""); }}
                  className="mt-1 shrink-0 h-4 w-4"
                  style={{ accentColor: "var(--gold)" }}
                  aria-describedby="terms-consent-text"
                />
                <span id="terms-consent-text" className="text-sm font-neue-haas leading-relaxed" style={{ color: "var(--white)", opacity: 0.9 }}>
                  By checking this box, I accept Nazaara Live&rsquo;s{" "}
                  <Link href="/terms" className="underline hover:opacity-80 transition-opacity" style={{ color: "var(--gold)" }}>Terms of Service</Link>
                  {" "}and{" "}
                  <Link href="/privacy" className="underline hover:opacity-80 transition-opacity" style={{ color: "var(--gold)" }}>Privacy Policy</Link>.
                </span>
              </label>
            </div>

            {errorMsg && (
              <p className="text-sm font-neue-haas mb-3" style={{ color: "#f87171" }}>{errorMsg}</p>
            )}

            {status === "not_subscribed" && (
              <div
                role="status"
                className="mb-3 p-3 rounded-lg text-sm font-neue-haas leading-relaxed"
                style={{
                  border: "1px solid rgba(255,255,255,0.2)",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  color: "var(--white)",
                }}
              >
                Almost there. Tick the marketing SMS box above and submit again to receive event drops from Nazaara Live.
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full px-6 py-3 rounded-lg text-sm font-neue-haas font-medium uppercase tracking-wider transition-all"
              style={{
                backgroundColor: "var(--gold)",
                color: "var(--maroon-red)",
                opacity: status === "loading" ? 0.6 : 1,
                cursor: status === "loading" ? "not-allowed" : "pointer",
              }}
              aria-disabled={status === "loading"}
            >
              {status === "loading" ? "Submitting..." : "Sign Up for SMS"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
