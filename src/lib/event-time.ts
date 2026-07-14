// Shared city/region/timezone helpers for event visibility logic.
//
// IMPORTANT — how event times are stored in this codebase:
// The admin date picker (event-date-picker.tsx) stores the event's LOCAL
// wall-clock time with a "Z" suffix, i.e. "10 PM in LA" is saved as
// 2026-07-10T22:00:00Z. Display code formats these back with
// formatInTimeZone(date, "UTC", ...) so they render correctly.
// That means the stored value is NOT a real instant in time — it's a
// wall-clock reading. Comparing it against `new Date()` (real UTC now)
// makes events look "past" hours before they actually start (7h early
// for LA, 5h for Toronto, ...).
//
// The correct comparison partner is "the current wall-clock time in the
// event's city, encoded the same way" — that's what nowInCityWallClock()
// produces. Never compare stored event times against plain new Date().

import { formatInTimeZone } from "date-fns-tz";

// Regional groupings for smart geographical fallback
export const REGIONS = {
  // Canada
  'Vancouver': { country: 'Canada', region: 'Western Canada' },
  'Surrey': { country: 'Canada', region: 'Western Canada' },
  'Burnaby': { country: 'Canada', region: 'Western Canada' },
  'Richmond': { country: 'Canada', region: 'Western Canada' },
  'Calgary': { country: 'Canada', region: 'Western Canada' },
  'Edmonton': { country: 'Canada', region: 'Western Canada' },
  'Toronto': { country: 'Canada', region: 'Eastern Canada' },
  'Ottawa': { country: 'Canada', region: 'Eastern Canada' },
  'Montreal': { country: 'Canada', region: 'Eastern Canada' },
  // USA
  'New York': { country: 'United States', region: 'East Coast' },
  'Boston': { country: 'United States', region: 'East Coast' },
  'Philadelphia': { country: 'United States', region: 'East Coast' },
  'Washington': { country: 'United States', region: 'East Coast' },
  'San Francisco': { country: 'United States', region: 'West Coast' },
  'Los Angeles': { country: 'United States', region: 'West Coast' },
  'Seattle': { country: 'United States', region: 'West Coast' },
  'Portland': { country: 'United States', region: 'West Coast' },
  'Chicago': { country: 'United States', region: 'Midwest' },
  'Detroit': { country: 'United States', region: 'Midwest' },
  'Dallas': { country: 'United States', region: 'South' },
  'Houston': { country: 'United States', region: 'South' },
  'Atlanta': { country: 'United States', region: 'South' },
  // UK
  'London': { country: 'United Kingdom', region: 'UK' },
  'Manchester': { country: 'United Kingdom', region: 'UK' },
  'Birmingham': { country: 'United Kingdom', region: 'UK' },
} as const;

export function getRegionInfo(city: string) {
  return REGIONS[city as keyof typeof REGIONS];
}

// Metro area groupings (priority over regions)
export const METRO_AREAS: Record<string, string[]> = {
  // Canada
  Vancouver: [
    "Vancouver", "Surrey", "Burnaby", "Richmond", "North Vancouver",
    "West Vancouver", "Coquitlam", "Port Coquitlam", "Port Moody",
    "Delta", "Langley", "White Rock", "New Westminster"
  ],
  Calgary: ["Calgary", "Airdrie", "Chestermere", "Okotoks"],
  Toronto: [
    "Toronto", "Mississauga", "Brampton", "Vaughan", "Markham",
    "Richmond Hill", "Oakville", "Burlington", "Milton", "Pickering",
    "Ajax", "Whitby"
  ],
  // USA
  "New York": [
    "New York", "Manhattan", "Brooklyn", "Queens", "Bronx",
    "Staten Island", "Jersey City", "Hoboken", "Newark"
  ],
  Boston: ["Boston", "Cambridge", "Somerville", "Brookline"],
  Miami: ["Miami", "Miami Beach", "Doral", "Hialeah", "Coral Gables"],
};

export function getMetroAnchor(city?: string): string | undefined {
  if (!city) return undefined;
  const entries = Object.entries(METRO_AREAS);
  for (const [anchor, members] of entries) {
    if (members.some(m => m.toLowerCase() === city.toLowerCase())) return anchor;
  }
  return undefined;
}

// IANA timezone per city. Metro members resolve via their anchor, so only
// anchors + standalone cities need entries here.
const CITY_TIMEZONES: Record<string, string> = {
  // Pacific
  "Vancouver": "America/Vancouver",
  "Victoria": "America/Vancouver",
  "Seattle": "America/Los_Angeles",
  "Portland": "America/Los_Angeles",
  "San Francisco": "America/Los_Angeles",
  "Los Angeles": "America/Los_Angeles",
  // Mountain
  "Calgary": "America/Edmonton",
  "Edmonton": "America/Edmonton",
  // Central
  "Chicago": "America/Chicago",
  "Dallas": "America/Chicago",
  "Houston": "America/Chicago",
  "Austin": "America/Chicago",
  // Eastern
  "Toronto": "America/Toronto",
  "Ottawa": "America/Toronto",
  "Montreal": "America/Toronto",
  "Detroit": "America/Detroit",
  "New York": "America/New_York",
  "Boston": "America/New_York",
  "Philadelphia": "America/New_York",
  "Washington": "America/New_York",
  "Atlanta": "America/New_York",
  "Miami": "America/New_York",
  // UK
  "London": "Europe/London",
  "Manchester": "Europe/London",
  "Birmingham": "Europe/London",
};

const DEFAULT_TIMEZONE = "America/Toronto";

export function getCityTimeZone(city?: string): string {
  if (!city) return DEFAULT_TIMEZONE;
  // Exact (case-insensitive) match
  const direct = Object.keys(CITY_TIMEZONES).find(
    k => k.toLowerCase() === city.toLowerCase()
  );
  if (direct) return CITY_TIMEZONES[direct];
  // Resolve suburbs via their metro anchor (e.g. Brooklyn → New York)
  const anchor = getMetroAnchor(city);
  if (anchor && CITY_TIMEZONES[anchor]) return CITY_TIMEZONES[anchor];
  return DEFAULT_TIMEZONE;
}

// Current wall-clock time in the given city, encoded in the same
// "wall-clock labeled as UTC" convention as stored event times, so the two
// can be compared directly.
export function nowInCityWallClock(city?: string): Date {
  const tz = getCityTimeZone(city);
  return new Date(formatInTimeZone(new Date(), tz, "yyyy-MM-dd'T'HH:mm:ss'Z'"));
}

// The moment an event stops being shown: its END time in its own city.
// Guard for legacy data where the end date wasn't bumped past midnight
// (e.g. start 22:00, end "03:00 the same day" → end <= start): fall back
// to start + 6 hours so a night event stays visible through the night.
export function effectiveEventEnd(startTime: Date | string, endTime?: Date | string | null): Date {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : null;
  if (end && end > start) return end;
  return new Date(start.getTime() + 6 * 60 * 60 * 1000);
}

// True until the event has ENDED in its own city (upcoming OR ongoing).
// Events stay in the hero and listings for their entire duration — a party
// that starts at 22:00 remains featured until close (e.g. 03:00), not
// hidden the second doors open.
export function isEventUpcoming(
  startTime: Date | string,
  endTime?: Date | string | null,
  city?: string
): boolean {
  return effectiveEventEnd(startTime, endTime) > nowInCityWallClock(city);
}

// True from the start of the event's calendar day (in its own city) onward —
// used by the marquee so an event stays listed for the whole day it happens.
export function isEventTodayOrLater(startTime: Date | string, city?: string): boolean {
  const tz = getCityTimeZone(city);
  const eventDay = formatInTimeZone(new Date(startTime), "UTC", "yyyy-MM-dd");
  const todayInCity = formatInTimeZone(new Date(), tz, "yyyy-MM-dd");
  return eventDay >= todayInCity;
}

// Geo-IP headers (x-vercel-ip-city) arrive URL-encoded ("New%20York").
// Decode defensively — old cookies may still hold encoded values.
export function decodeCityName(city?: string): string {
  if (!city) return "";
  try {
    return decodeURIComponent(city);
  } catch {
    return city;
  }
}

// ── City inference from event text ──────────────────────────────
// Events have no city column of their own — city normally comes from the
// joined venue. When the venue is still TBA the event becomes invisible to
// geo-targeting ("Mango Szn: Vancouver" showed a NYC event to Vancouver
// visitors). Event naming is consistent ("<name>: <City>", taglines like
// "Live In Vancouver"), so as a fallback we scan the title + tagline for a
// known city name.
const KNOWN_CITIES: string[] = (() => {
  const set = new Set<string>();
  Object.keys(REGIONS).forEach(c => set.add(c));
  Object.entries(METRO_AREAS).forEach(([anchor, members]) => {
    set.add(anchor);
    members.forEach(m => set.add(m));
  });
  ["Victoria", "Austin", "Miami", "Winnipeg", "Denver"].forEach(c => set.add(c));
  // Longest first so "North Vancouver" wins over "Vancouver" when present.
  return Array.from(set).sort((a, b) => b.length - a.length);
})();

export function inferCityFromText(text?: string | null): string | undefined {
  if (!text) return undefined;
  const lower = text.toLowerCase();
  for (const city of KNOWN_CITIES) {
    const cl = city.toLowerCase();
    const idx = lower.indexOf(cl);
    if (idx === -1) continue;
    // Word-boundary check so "Yorkville" doesn't match "York" etc.
    const before = idx === 0 ? "" : lower[idx - 1];
    const after = idx + cl.length >= lower.length ? "" : lower[idx + cl.length];
    const isBoundary = (ch: string) => ch === "" || !/[a-z0-9]/.test(ch);
    if (isBoundary(before) && isBoundary(after)) return city;
  }
  return undefined;
}
