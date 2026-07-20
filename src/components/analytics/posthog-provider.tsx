"use client"

import posthog from "posthog-js"
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, Suspense } from "react"

// PostHog analytics: pageviews + click autocapture (which element, what text,
// on which page) using the NEXT_PUBLIC_POSTHOG_KEY / _HOST env vars that were
// already configured on Vercel. If the key is absent this renders nothing.
//
// Admin pages (/admin/*) are excluded so your own dashboard usage doesn't
// pollute visitor stats.

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com"

let initialized = false
function ensureInit() {
  if (initialized || typeof window === "undefined" || !POSTHOG_KEY) return
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // We capture pageviews manually on route change (App Router SPA navs
    // don't reload the page, so the default load-time capture misses them).
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true, // every click: element, text, page — "who clicked where"
    persistence: "localStorage+cookie",
  })
  initialized = true
}

function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!POSTHOG_KEY || !pathname) return
    if (pathname.startsWith("/admin")) return // don't count ourselves
    ensureInit()
    let url = window.origin + pathname
    const qs = searchParams?.toString()
    if (qs) url += `?${qs}`
    posthog.capture("$pageview", { $current_url: url })
  }, [pathname, searchParams])

  return null
}

export function PostHogAnalytics() {
  if (!POSTHOG_KEY) return null
  return (
    <Suspense fallback={null}>
      <PageViewTracker />
    </Suspense>
  )
}
