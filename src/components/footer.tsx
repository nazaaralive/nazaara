import Link from "next/link";

interface FooterProps {
  hideAbout?: boolean;
  hideBookings?: boolean;
  useExternalGallery?: boolean;
  externalGalleryUrl?: string;
}

export function Footer({ hideAbout = false, hideBookings = false, useExternalGallery = false, externalGalleryUrl }: FooterProps) {
  return (
    <footer className="relative overflow-hidden" style={{ backgroundColor: 'var(--black-grey)' }}>
      {/* Geometric Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <pattern id="footer-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <circle cx="40" cy="40" r="1" fill="var(--gold)" />
              <path d="M0 40 L40 0 L80 40 L40 80 Z" stroke="var(--gold)" strokeWidth="0.3" fill="none" opacity="0.2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#footer-pattern)" />
        </svg>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

      <div className="relative">
        {/* Main Footer Content */}
        <div className="px-6 lg:px-12 pt-20">
          <div className="max-w-[1600px] mx-auto">
            
            {/* Editorial Header */}
            <div className="mb-16">
              <div className="flex items-baseline gap-8 mb-4">
                <div className="h-px w-16" style={{ backgroundColor: 'var(--gold)' }} />
                <span className="text-[9px] font-neue-haas uppercase tracking-[0.5em] text-white/40">
                  Est. 2022
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-[var(--gold)]/20 to-transparent" />
              </div>
              
              <div className="grid lg:grid-cols-12 gap-8 items-end">
                <div className="lg:col-span-6">
                  <h2 className="text-[clamp(3rem,6vw,6rem)] font-prettywise leading-[0.8] text-white mb-4">
                    Nazaara Live
                  </h2>
                  <p className="text-lg font-neue-haas text-[var(--gold)] font-light max-w-lg">
                    The Premier Name in South Asian Entertainment Excellence
                  </p>
                </div>
                
                <div className="lg:col-span-6 lg:text-right">
                  <p className="text-sm font-neue-haas text-white/60 leading-relaxed max-w-md lg:ml-auto">
                    Orchestrating unforgettable experiences across continents, 
                    bringing the pulse of South Asian culture to global audiences.
                  </p>
                </div>
              </div>
            </div>

            {/* Main Footer Grid */}
            <div className="grid lg:grid-cols-12 gap-12 mb-16">
              
              {/* Navigation */}
              <div className="lg:col-span-3">
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-[9px] font-neue-haas uppercase tracking-[0.4em] text-[var(--gold)]/60">Navigation</span>
                    <div className="flex-1 h-px" style={{ backgroundColor: 'var(--gold)', opacity: 0.2 }} />
                  </div>
                  <nav className="space-y-4">
                    <Link 
                      href="/" 
                      className="block text-white font-neue-haas font-light hover:text-[var(--gold)] transition-colors"
                    >
                      Home
                    </Link>
                    {!hideAbout && (
                      <Link 
                        href="/about" 
                        className="block text-white font-neue-haas font-light hover:text-[var(--gold)] transition-colors"
                      >
                        About Us
                      </Link>
                    )}
                    {!hideBookings && (
                      <Link 
                        href="/bookings" 
                        className="block text-white font-neue-haas font-light hover:text-[var(--gold)] transition-colors"
                      >
                        Private Bookings
                      </Link>
                    )}
                   
                    {useExternalGallery ? (
                      <a 
                        href={externalGalleryUrl || "https://tamasha.myportfolio.com/"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-white font-neue-haas font-light hover:text-[var(--gold)] transition-colors"
                      >
                        Gallery
                      </a>
                    ) : (
                      <Link 
                        href="/gallery" 
                        className="block text-white font-neue-haas font-light hover:text-[var(--gold)] transition-colors"
                      >
                        Gallery
                      </Link>
                    )}
                  </nav>
                </div>
              </div>

              {/* Contact Information */}
              <div className="lg:col-span-3">
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-[9px] font-neue-haas uppercase tracking-[0.4em] text-[var(--gold)]/60">Contact</span>
                    <div className="flex-1 h-px" style={{ backgroundColor: 'var(--gold)', opacity: 0.2 }} />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-neue-haas uppercase tracking-[0.2em] text-white/40 mb-1">General Inquiries</p>
                      <a 
                        href="mailto:info@nazaara.live" 
                        className="text-white font-neue-haas font-light hover:text-[var(--gold)] transition-colors"
                      >
                        info@nazaara.live
                      </a>
                    </div>
                    <div>
                      <p className="text-xs font-neue-haas uppercase tracking-[0.2em] text-white/40 mb-1">Bookings</p>
                      <a 
                        href="mailto:bookings@nazaara.live" 
                        className="text-white font-neue-haas font-light hover:text-[var(--gold)] transition-colors"
                      >
                        bookings@nazaara.live
                      </a>
                    </div>
                    <div>
                      <p className="text-xs font-neue-haas uppercase tracking-[0.2em] text-white/40 mb-1">Press</p>
                      <a 
                        href="mailto:press@nazaara.live" 
                        className="text-white font-neue-haas font-light hover:text-[var(--gold)] transition-colors"
                      >
                        press@nazaara.live
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Brands */}
              <div className="lg:col-span-3">
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-[9px] font-neue-haas uppercase tracking-[0.4em] text-[var(--gold)]/60">Our Brands</span>
                    <div className="flex-1 h-px" style={{ backgroundColor: 'var(--gold)', opacity: 0.2 }} />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-white font-prettywise text-lg mb-1">Nazaara</h3>
                      <p className="text-xs font-neue-haas text-white/60">Premium Events and Tours Worldwide</p>
                    </div>
                    <div>
                      <h3 className="text-white font-prettywise text-lg mb-1">TAMASHA</h3>
                      <p className="text-xs font-neue-haas text-white/60">Event Series</p>
                    </div>
                    <div>
                      <h3 className="text-white/40 font-prettywise text-lg mb-1">Coming 2026</h3>
                      <p className="text-xs font-neue-haas text-white/30">Next Chapter</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Newsletter & Social */}
              <div className="lg:col-span-3">
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-[9px] font-neue-haas uppercase tracking-[0.4em] text-[var(--gold)]/60">Stay Connected</span>
                    <div className="flex-1 h-px" style={{ backgroundColor: 'var(--gold)', opacity: 0.2 }} />
                  </div>
                  

                  {/* Social Links */}
                  <div>
                    <p className="text-xs font-neue-haas uppercase tracking-[0.2em] text-white/40 mb-4">Follow Us</p>
                    <div className="space-y-3">
                      <a 
                        href="https://www.instagram.com/nazaara.live/" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-white/60 hover:text-[var(--gold)] transition-colors"
                        aria-label="Instagram"
                      >
                        <span className="text-xs font-neue-haas uppercase tracking-wider">Instagram</span>
                      </a>
                      <a 
                        href="https://www.tiktok.com/@nazaara.live" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-white/60 hover:text-[var(--gold)] transition-colors"
                        aria-label="TikTok"
                      >
                        <span className="text-xs font-neue-haas uppercase tracking-wider">TikTok</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

           
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[var(--gold)]/10">
          <div className="px-6 lg:px-12 py-8">
            <div className="max-w-[1600px] mx-auto">
              <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
                
                <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-8">
                  <p className="text-xs font-neue-haas text-white/40">
                    © 2026 Nazaara Live. All rights reserved.
                  </p>
                  <div className="flex items-center gap-6 text-xs font-neue-haas text-white/40">
                    <Link href="/privacy" className="hover:text-[var(--gold)] transition-colors">
                      Privacy Policy
                    </Link>
                    <span className="w-px h-3 bg-white/20" />
                    <Link href="/terms" className="hover:text-[var(--gold)] transition-colors">
                      Terms of Service
                    </Link>
                  </div>
                </div>

                {/* Intentionally left blank */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}