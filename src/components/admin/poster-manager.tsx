"use client"

import { useState, useEffect, useTransition, useCallback } from "react"
import type React from "react"
import {
  QrCode,
  Loader2,
  Plus,
  Download,
  Check,
  Link as LinkIcon,
  Trash2,
  EyeOff,
  Eye,
  AlertCircle,
} from "lucide-react"
import {
  createPosterLink,
  setPosterLinkActive,
  deletePosterLink,
  type EventOption,
} from "@/lib/poster-actions"
import { cn } from "@/lib/utils"

/**
 * QR generation runs entirely in the browser.
 *
 * The library is pulled from cdnjs at runtime rather than added to
 * package.json, because the lockfile cannot be regenerated in this workflow.
 * It loads only on this admin page, and every QR button stays disabled until
 * it is confirmed present - so a CDN failure degrades to "no downloads"
 * rather than a broken page.
 */
const QR_CDN = "https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"

// Error-correction level H recovers ~30% of the symbol. Worth the extra
// density for print: posters get rained on, torn and scanned at an angle.
const QR_ERROR_CORRECTION = "H"
const PNG_SIZE = 2000 // ~6.7in at 300dpi

declare global {
  interface Window {
    qrcode?: (typeNumber: number, errorCorrectionLevel: string) => {
      addData: (data: string) => void
      make: () => void
      getModuleCount: () => number
      isDark: (row: number, col: number) => boolean
      createSvgTag: (opts: { cellSize?: number; margin?: number; scalable?: boolean }) => string
    }
  }
}

export interface PosterLinkRow {
  id: number
  code: string
  label: string
  eventSlug: string
  city: string | null
  placement: string | null
  campaign: string
  destinationOverride: string | null
  isActive: boolean
  totalScans: number
  scansLast7Days: number
  lastScanAt: Date | null
}

interface PosterManagerProps {
  links: PosterLinkRow[]
  eventOptions: EventOption[]
  origin: string
}

export function PosterManager({ links, eventOptions, origin }: PosterManagerProps) {
  const [qrReady, setQrReady] = useState(false)
  const [qrFailed, setQrFailed] = useState(false)

  useEffect(() => {
    if (typeof window.qrcode === "function") {
      setQrReady(true)
      return
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${QR_CDN}"]`)
    const script = existing ?? document.createElement("script")
    const onLoad = () => setQrReady(typeof window.qrcode === "function")
    const onError = () => setQrFailed(true)
    script.addEventListener("load", onLoad)
    script.addEventListener("error", onError)
    if (!existing) {
      script.src = QR_CDN
      script.async = true
      document.head.appendChild(script)
    }
    return () => {
      script.removeEventListener("load", onLoad)
      script.removeEventListener("error", onError)
    }
  }, [])

  const buildQr = useCallback((text: string) => {
    if (typeof window.qrcode !== "function") return null
    const qr = window.qrcode(0, QR_ERROR_CORRECTION)
    qr.addData(text)
    qr.make()
    return qr
  }, [])

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadPng = (code: string) => {
    const qr = buildQr(`${origin}/p/${code}`)
    if (!qr) return
    const count = qr.getModuleCount()
    const margin = 4
    const scale = Math.max(1, Math.floor(PNG_SIZE / (count + margin * 2)))
    const size = (count + margin * 2) * scale

    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = "#000000"
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (qr.isDark(r, c)) {
          ctx.fillRect((c + margin) * scale, (r + margin) * scale, scale, scale)
        }
      }
    }
    canvas.toBlob((blob) => {
      if (blob) triggerDownload(blob, `qr-${code}.png`)
    }, "image/png")
  }

  const downloadSvg = (code: string) => {
    const qr = buildQr(`${origin}/p/${code}`)
    if (!qr) return
    const tag = qr.createSvgTag({ cellSize: 8, margin: 4, scalable: true })
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n${tag}`
    triggerDownload(new Blob([svg], { type: "image/svg+xml" }), `qr-${code}.svg`)
  }

  return (
    <div className="space-y-8">
      <CreateForm eventOptions={eventOptions} />

      {qrFailed && (
        <p className="text-sm text-amber-500 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          QR generator could not load. Links still work and still track - only the
          download buttons are unavailable. Refreshing usually fixes it.
        </p>
      )}

      {links.length === 0 ? (
        <div className="text-center py-16 border border-border rounded-lg">
          <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No tracking links yet. Create one above and download its QR code.
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-lg divide-y divide-border">
          {links.map((link) => (
            <LinkRow
              key={link.id}
              link={link}
              origin={origin}
              qrReady={qrReady}
              onDownloadPng={() => downloadPng(link.code)}
              onDownloadSvg={() => downloadSvg(link.code)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function CreateForm({ eventOptions }: { eventOptions: EventOption[] }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setCreated(null)
    const form = e.currentTarget
    const formData = new FormData(form)

    startTransition(async () => {
      const result = await createPosterLink(formData)
      if (result.ok) {
        setCreated(result.code ?? null)
        form.reset()
      } else {
        setError(result.error ?? "Something went wrong.")
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-border rounded-lg p-4 sm:p-5 space-y-4"
    >
      <h2 className="text-base font-medium text-foreground">New tracking link</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="name" className="text-sm text-foreground font-light">
            Name <span className="text-[--gold]">*</span>
          </label>
          <input
            id="name"
            name="name"
            required
            maxLength={255}
            placeholder="Toronto - campus posters"
            disabled={isPending}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[--gold]"
          />
          <p className="text-xs text-muted-foreground">
            The short URL is generated from this name, e.g. &ldquo;Toronto - campus
            posters&rdquo; becomes /p/toronto-campus-posters.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="eventSlug" className="text-sm text-foreground font-light">
            Event <span className="text-[--gold]">*</span>
          </label>
          <select
            id="eventSlug"
            name="eventSlug"
            required
            defaultValue=""
            disabled={isPending}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[--gold]"
          >
            <option value="">Select an event</option>
            {eventOptions.map((e) => (
              <option key={e.slug} value={e.slug}>
                {e.title}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="campaign" className="text-sm text-foreground font-light">
            Campaign <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            id="campaign"
            name="campaign"
            maxLength={100}
            placeholder="king-tour-2026"
            disabled={isPending}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[--gold]"
          />
          <p className="text-xs text-muted-foreground">
            Groups links together in PostHog as utm_campaign.
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
      {created && (
        <p className="text-sm text-green-500 flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0" />
          Created /p/{created} - download its QR below.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="px-5 py-2 rounded-md bg-[--gold] text-[--maroon-red] font-medium hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-2"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Create link
      </button>
    </form>
  )
}

/* ------------------------------------------------------------------ */

function LinkRow({
  link,
  origin,
  qrReady,
  onDownloadPng,
  onDownloadSvg,
}: {
  link: PosterLinkRow
  origin: string
  qrReady: boolean
  onDownloadPng: () => void
  onDownloadSvg: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const url = `${origin}/p/${link.code}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable - the URL is shown in full below anyway */
    }
  }

  const toggleActive = () =>
    startTransition(async () => {
      await setPosterLinkActive(link.id, !link.isActive)
    })

  const remove = () => {
    if (
      !window.confirm(
        `Delete "${link.label}"? Its ${link.totalScans} recorded scan${
          link.totalScans === 1 ? "" : "s"
        } will be deleted too, and any printed QR pointing here will fall back to the events page.`
      )
    ) {
      return
    }
    startTransition(async () => {
      await deletePosterLink(link.id)
    })
  }

  const formatDate = (d: Date | null) =>
    d
      ? new Date(d).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : "Never"

  return (
    <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-foreground">{link.label}</span>
          {!link.isActive && (
            <span className="text-[10px] uppercase tracking-wide text-amber-500/90 border border-amber-500/40 rounded px-1.5 py-0.5">
              Retired
            </span>
          )}
          {link.destinationOverride && (
            <span
              className="text-[10px] uppercase tracking-wide text-sky-400/90 border border-sky-400/40 rounded px-1.5 py-0.5"
              title={link.destinationOverride}
            >
              Redirected
            </span>
          )}
        </div>
        <div className="text-sm text-muted-foreground mt-1 font-mono break-all">{url}</div>
        <div className="text-xs text-muted-foreground/70 mt-0.5">
          {link.eventSlug} · last scan {formatDate(link.lastScanAt)}
        </div>
      </div>

      <div className="flex items-center gap-5 shrink-0">
        <div className="text-right">
          <div className="text-xl font-light text-foreground">{link.totalScans}</div>
          <div className="text-xs text-muted-foreground">total</div>
        </div>
        <div className="text-right">
          <div className="text-xl font-light text-foreground">{link.scansLast7Days}</div>
          <div className="text-xs text-muted-foreground">7 days</div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap shrink-0">
        <button
          type="button"
          onClick={copy}
          className={cn(
            "text-sm px-3 py-1.5 rounded-md border transition-colors inline-flex items-center gap-1.5",
            copied
              ? "border-green-500/50 text-green-500"
              : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
          )}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <LinkIcon className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>

        <button
          type="button"
          onClick={onDownloadSvg}
          disabled={!qrReady}
          title="Vector - best for print"
          className="text-sm px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="h-3.5 w-3.5" />
          SVG
        </button>

        <button
          type="button"
          onClick={onDownloadPng}
          disabled={!qrReady}
          title="2000px PNG"
          className="text-sm px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="h-3.5 w-3.5" />
          PNG
        </button>

        <button
          type="button"
          onClick={toggleActive}
          disabled={isPending}
          title={link.isActive ? "Retire this link" : "Reactivate"}
          className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors disabled:opacity-40"
        >
          {link.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>

        <button
          type="button"
          onClick={remove}
          disabled={isPending}
          title="Delete"
          className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-red-400 hover:border-red-400/40 transition-colors disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
