"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// Venue form fields with Google Places autocomplete.
//
// Renders the "Basic Information" and "Location" sections of the venue forms
// as CONTROLLED inputs (same `name` attributes as before, so the server
// actions are untouched). If NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set, a
// "Search Google Maps" box appears above the fields: picking a place fills
// venue name, street address, city, country, and a Google Maps directions
// URL automatically. Without a key everything works as plain manual inputs.
//
// Uses the new PlaceAutocompleteElement (legacy Autocomplete is unavailable
// to API keys created after March 2025). Requires "Places API (New)" to be
// enabled on the key in Google Cloud Console.

interface VenueDefaults {
  name?: string
  description?: string
  city?: string
  country?: string
  address?: string
  addressUrl?: string
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { google?: any }
}

// Official Google Maps JS bootstrap loader (importLibrary), guarded so it
// only ever runs once per page.
function loadGoogleMaps(apiKey: string) {
  if (typeof window === "undefined") return
  if (window.google?.maps?.importLibrary) return
  /* eslint-disable */
  ;((g: any) => {
    var h: any, a: any, k: any, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__", m = document, b: any = window
    b = b[c] || (b[c] = {})
    var d = b.maps || (b.maps = {}), r = new Set(), e = new URLSearchParams(), u = () => h || (h = new Promise(async (f, n) => {
      await (a = m.createElement("script"))
      e.set("libraries", [...r] + "")
      for (k in g) e.set(k.replace(/[A-Z]/g, (t: string) => "_" + t[0].toLowerCase()), g[k])
      e.set("callback", c + ".maps." + q)
      a.src = `https://maps.${c}apis.com/maps/api/js?` + e
      d[q] = f
      a.onerror = () => (h = n(Error(p + " could not load.")))
      a.nonce = (m.querySelector("script[nonce]") as any)?.nonce || ""
      m.head.append(a)
    }))
    d[l] ? console.warn(p + " only loads once. Ignoring:", g) : (d[l] = (f: any, ...n: any[]) => r.add(f) && u().then(() => d[l](f, ...n)))
  })({ key: apiKey, v: "weekly" })
  /* eslint-enable */
}

export function VenueLocationFields({ defaults = {} }: { defaults?: VenueDefaults }) {
  const [name, setName] = useState(defaults.name || "")
  const [description, setDescription] = useState(defaults.description || "")
  const [city, setCity] = useState(defaults.city || "")
  const [country, setCountry] = useState(defaults.country || "")
  const [address, setAddress] = useState(defaults.address || "")
  const [addressUrl, setAddressUrl] = useState(defaults.addressUrl || "")
  const [autofilled, setAutofilled] = useState(false)
  const [placesError, setPlacesError] = useState(false)
  const searchSlotRef = useRef<HTMLDivElement>(null)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  useEffect(() => {
    if (!apiKey || !searchSlotRef.current) return
    let cancelled = false

    async function init() {
      try {
        loadGoogleMaps(apiKey as string)
        const { PlaceAutocompleteElement } = await window.google.maps.importLibrary("places")
        if (cancelled || !searchSlotRef.current) return
        searchSlotRef.current.innerHTML = ""
        const el = new PlaceAutocompleteElement()
        el.style.width = "100%"
        el.style.colorScheme = "dark"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        el.addEventListener("gmp-select", async (ev: any) => {
          try {
            const place = ev.placePrediction.toPlace()
            await place.fetchFields({ fields: ["displayName", "formattedAddress", "addressComponents", "id"] })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const comps: any[] = place.addressComponents || []
            const comp = (type: string) => {
              const c = comps.find(x => (x.types || []).includes(type))
              return c ? (c.longText || c.long_name || "") : ""
            }
            const street = [comp("street_number"), comp("route")].filter(Boolean).join(" ")
            const displayName = place.displayName || ""
            const formatted = place.formattedAddress || ""
            setName(displayName)
            setAddress(street || formatted)
            setCity(comp("locality") || comp("postal_town") || comp("sublocality") || comp("administrative_area_level_2"))
            setCountry(comp("country"))
            // Universal Google Maps directions deep link, pinned to the exact place.
            setAddressUrl(
              `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${displayName} ${formatted}`.trim())}` +
              (place.id ? `&destination_place_id=${place.id}` : "")
            )
            setAutofilled(true)
          } catch (err) {
            console.error("Place selection failed:", err)
          }
        })
        searchSlotRef.current.appendChild(el)
      } catch (err) {
        console.error("Google Places failed to load:", err)
        if (!cancelled) setPlacesError(true)
      }
    }
    init()
    return () => { cancelled = true }
  }, [apiKey])

  return (
    <>
      {/* Basic Information */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
        <div className="space-y-4">
          {apiKey && !placesError && (
            <div className="space-y-2">
              <Label>Search Google Maps</Label>
              <div ref={searchSlotRef} />
              <p className="text-xs text-muted-foreground">
                Start typing a venue name — selecting a result fills the name, address, city, country, and directions link below.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Venue Name *</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="Fortune Sound Club"
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              placeholder="A premier nightclub known for its state-of-the-art sound system..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="bg-background resize-none"
            />
          </div>
        </div>
      </div>

      {/* Location */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Location
          {autofilled && <span className="ml-2 text-xs font-normal text-green-500">✓ filled from Google Maps</span>}
        </h2>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                name="city"
                required
                placeholder="Vancouver"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                name="country"
                required
                placeholder="Canada"
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="bg-background"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              name="address"
              placeholder="147 E Pender St"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressUrl">Directions URL</Label>
            <Input
              id="addressUrl"
              name="addressUrl"
              placeholder="https://maps.google.com/..."
              value={addressUrl}
              onChange={e => setAddressUrl(e.target.value)}
              className="bg-background"
            />
          </div>
        </div>
      </div>
    </>
  )
}
