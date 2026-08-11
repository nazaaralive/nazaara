"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationProps {
  hideAbout?: boolean;
  hideBookings?: boolean;
  useExternalGallery?: boolean;
  externalGalleryUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
}

export function Navigation({
  hideAbout = false,
  hideBookings = false,
  useExternalGallery = false,
  externalGalleryUrl,
  instagramUrl = "https://www.instagram.com/nazaara.live/",
  tiktokUrl = "https://www.tiktok.com/@nazaara.live"
}: NavigationProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isCurrent = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // Close on route change and on Escape; lock body scroll when open
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    if (open) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("overflow-hidden");
    };
  }, [open]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/75 backdrop-blur-md border-b border-border/30">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16 lg:h-24">
          {/* Logo */}
          <Link href="/" className="flex items-center group" aria-label="Nazaara Live home">
            <Image
              src="/Logos/Logo - Gold.png"
              alt="Nazaara Live"
              width={180}
              height={72}
              priority
              className="h-42 -ml-4 w-auto lg:h-60 transition-all duration-300 group-hover:scale-105 group-hover:brightness-0 group-hover:saturate-100 group-hover:sepia group-hover:hue-rotate-15 group-hover:contrast-150"
              style={{
                filter:
                  "brightness(1) saturate(1) sepia(0) hue-rotate(0deg) contrast(1)",
              }}
            />
          </Link>

          {/* Right Side Navigation (Desktop) */}
          <div className="hidden lg:flex items-center gap-8">
            <Link
              href="/vip"
              aria-current={isCurrent("/vip") ? "page" : undefined}
              className={cn(
                "relative group text-sm uppercase tracking-[0.2em] font-light transition-colors",
                isCurrent("/vip")
                  ? "text-primary"
                  : "text-foreground/80 hover:text-primary"
              )}
            >
              <span>VIP</span>
              <span
                className={cn(
                  "pointer-events-none absolute -bottom-1 left-0 h-px bg-primary transition-all duration-300",
                  isCurrent("/vip")
                    ? "w-full opacity-90"
                    : "w-0 opacity-0 group-hover:w-full group-hover:opacity-100"
                )}
              />
            </Link>
            {!hideAbout && (
              <Link
                href="/about"
                aria-current={isCurrent("/about") ? "page" : undefined}
                className={cn(
                  "relative group text-sm uppercase tracking-[0.2em] font-light transition-colors",
                  isCurrent("/about")
                    ? "text-primary"
                    : "text-foreground/80 hover:text-primary"
                )}
              >
                <span>About</span>
                <span
                  className={cn(
                    "pointer-events-none absolute -bottom-1 left-0 h-px bg-primary transition-all duration-300",
                    isCurrent("/about")
                      ? "w-full opacity-90"
                      : "w-0 opacity-0 group-hover:w-full group-hover:opacity-100"
                  )}
                />
              </Link>
            )}
            {!hideBookings && (
              <Link
                href="/bookings"
                aria-current={isCurrent("/bookings") ? "page" : undefined}
                className={cn(
                  "relative group text-sm uppercase tracking-[0.2em] font-light transition-colors",
                  isCurrent("/bookings")
                    ? "text-primary"
                    : "text-foreground/80 hover:text-primary"
                )}
              >
                <span>Bookings</span>
                <span
                  className={cn(
                    "pointer-events-none absolute -bottom-1 left-0 h-px bg-primary transition-all duration-300",
                    isCurrent("/bookings")
                      ? "w-full opacity-90"
                      : "w-0 opacity-0 group-hover:w-full group-hover:opacity-100"
                  )}
                />
              </Link>
            )}
            <Link
              href="/alumni"
              aria-current={isCurrent("/alumni") ? "page" : undefined}
              className={cn(
                "relative group text-sm uppercase tracking-[0.2em] font-light transition-colors",
                isCurrent("/alumni")
                  ? "text-primary"
                  : "text-foreground/80 hover:text-primary"
              )}
            >
              <span>Alumni</span>
              <span
                className={cn(
                  "pointer-events-none absolute -bottom-1 left-0 h-px bg-primary transition-all duration-300",
                  isCurrent("/alumni")
                    ? "w-full opacity-90"
                    : "w-0 opacity-0 group-hover:w-full group-hover:opacity-100"
                )}
              />
            </Link>
            {useExternalGallery ? (
              <a
                href={externalGalleryUrl || "https://tamasha.myportfolio.com/"}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "relative group text-sm uppercase tracking-[0.2em] font-light transition-colors text-foreground/80 hover:text-primary"
                )}
              >
                <span>Gallery</span>
              </a>
            ) : (
              <Link
                href="/galleries"
                aria-current={isCurrent("/galleries") ? "page" : undefined}
                className={cn(
                  "relative group text-sm uppercase tracking-[0.2em] font-light transition-colors",
                  isCurrent("/galleries")
                    ? "text-primary"
                    : "text-foreground/80 hover:text-primary"
                )}
              >
                <span>Gallery</span>
                <span
                  className={cn(
                    "pointer-events-none absolute -bottom-1 left-0 h-px bg-primary transition-all duration-300",
                    isCurrent("/galleries")
                      ? "w-full opacity-90"
                      : "w-0 opacity-0 group-hover:w-full group-hover:opacity-100"
                  )}
                />
              </Link>
            )}
            
            {/* Social Media Icons */}
            <div className="flex items-center gap-4 ml-2">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-foreground/60 hover:text-primary transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a
                href={tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="text-foreground/60 hover:text-primary transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-controls="mobile-menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden text-foreground/80 hover:text-primary transition-colors p-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            {open ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
            <span className="sr-only">Toggle navigation</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <div
        id="mobile-menu"
        className={cn(
          "lg:hidden fixed left-0 right-0 top-16 lg:top-24 origin-top border-b border-border/30 bg-background/95 backdrop-blur-md shadow-lg transition-all duration-200",
          open ? "opacity-100 scale-y-100" : "pointer-events-none opacity-0 scale-y-95"
        )}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-2 py-2">
            <Link
              href="/vip"
              onClick={() => setOpen(false)}
              className={cn(
                "block rounded-md px-3 py-3 text-base uppercase tracking-[0.18em] transition-colors",
                isCurrent("/vip")
                  ? "text-primary bg-primary/10"
                  : "text-foreground/90 hover:bg-muted/30 hover:text-primary"
              )}
              aria-current={isCurrent("/vip") ? "page" : undefined}
            >
              VIP
            </Link>
            {!hideAbout && (
              <Link
                href="/about"
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-md px-3 py-3 text-base uppercase tracking-[0.18em] transition-colors",
                  isCurrent("/about")
                    ? "text-primary bg-primary/10"
                    : "text-foreground/90 hover:bg-muted/30 hover:text-primary"
                )}
                aria-current={isCurrent("/about") ? "page" : undefined}
              >
                About
              </Link>
            )}
            {!hideBookings && (
              <Link
                href="/bookings"
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-md px-3 py-3 text-base uppercase tracking-[0.18em] transition-colors",
                  isCurrent("/bookings")
                    ? "text-primary bg-primary/10"
                    : "text-foreground/90 hover:bg-muted/30 hover:text-primary"
                )}
                aria-current={isCurrent("/bookings") ? "page" : undefined}
              >
                Bookings
              </Link>
            )}
            <Link
              href="/alumni"
              onClick={() => setOpen(false)}
              className={cn(
                "block rounded-md px-3 py-3 text-base uppercase tracking-[0.18em] transition-colors",
                isCurrent("/alumni")
                  ? "text-primary bg-primary/10"
                  : "text-foreground/90 hover:bg-muted/30 hover:text-primary"
              )}
              aria-current={isCurrent("/alumni") ? "page" : undefined}
            >
              Alumni
            </Link>
            {useExternalGallery ? (
              <a
                href={externalGalleryUrl || "https://tamasha.myportfolio.com/"}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-md px-3 py-3 text-base uppercase tracking-[0.18em] transition-colors text-foreground/90 hover:bg-muted/30 hover:text-primary"
                )}
              >
                Galleries
              </a>
            ) : (
              <Link
                href="/galleries"
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-md px-3 py-3 text-base uppercase tracking-[0.18em] transition-colors",
                  isCurrent("/galleries")
                    ? "text-primary bg-primary/10"
                    : "text-foreground/90 hover:bg-muted/30 hover:text-primary"
                )}
                aria-current={isCurrent("/galleries") ? "page" : undefined}
              >
                Galleries
              </Link>
            )}
            
            {/* Social Media Icons in Mobile Menu */}
            <div className="flex items-center gap-6 px-3 py-4 border-t border-border/30 mt-2">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-foreground/60 hover:text-primary transition-colors"
                onClick={() => setOpen(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a
                href={tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="text-foreground/60 hover:text-primary transition-colors"
                onClick={() => setOpen(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
