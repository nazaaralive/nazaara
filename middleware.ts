import { NextRequest, NextResponse } from "next/server";

interface RequestWithGeo extends NextRequest {
  geo?: {
    city?: string;
    country?: string;
    region?: string;
    latitude?: string;
    longitude?: string;
  };
}

const COOKIE_NAME_CITY = "nza_city";
const COOKIE_NAME_COUNTRY = "nza_country";
const MAX_AGE = 60 * 60 * 24 * 3; // 3 days

export function middleware(req: RequestWithGeo) {
  const pathname = req.nextUrl.pathname;

  // Admin route protection
  if (pathname.startsWith("/admin") && pathname !== "/admin/auth") {
    // Check for both secure and non-secure cookie names
    const sessionToken = req.cookies.get("better-auth.session_token")?.value || 
                         req.cookies.get("__Secure-better-auth.session_token")?.value;
    
    if (!sessionToken) {
      return NextResponse.redirect(new URL("/admin/auth", req.url));
    }
    
    // Note: Full role verification is done server-side in the admin pages
    // This is just a basic check for session existence
  }
  


  // If cookie already present, proceed without changes
  const existingCityCookie = req.cookies.get(COOKIE_NAME_CITY)?.value;
  const existingCountryCookie = req.cookies.get(COOKIE_NAME_COUNTRY)?.value;
  
  if (existingCityCookie && existingCountryCookie) {
    return NextResponse.next();
  }

  // Try to read city and country from edge geo data or headers
  const geoCity = req.geo?.city;
  const geoCountry = req.geo?.country;
  const vercelCity = req.headers.get("x-vercel-ip-city");
  const vercelCountry = req.headers.get("x-vercel-ip-country");
  const cfCity = req.headers.get("cf-ipcity");
  const cfCountry = req.headers.get("cf-ipcountry");
  
  // x-vercel-ip-city is URL-encoded (e.g. "New%20York") — decode before
  // storing so city matching downstream works for multi-word cities.
  const rawCity = geoCity || vercelCity || cfCity || "";
  let city = rawCity;
  try {
    city = decodeURIComponent(rawCity);
  } catch {
    // keep raw value if malformed
  }
  const country = geoCountry || vercelCountry || cfCountry || "";

  const res = NextResponse.next();
  
  if (city) {
    res.cookies.set({
      name: COOKIE_NAME_CITY,
      value: city,
      maxAge: MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
    });
  }
  
  if (country) {
    res.cookies.set({
      name: COOKIE_NAME_COUNTRY,
      value: country,
      maxAge: MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
    });
  }

  return res;
}

export const config = {
  runtime: "edge",
  // Run on home, events, admin routes, and the temporarily redirected pages
  matcher: ["/", "/events", "/about", "/bookings", "/admin/:path*"],
};
