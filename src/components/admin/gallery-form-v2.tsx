"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Save, Trash2, Image, Calendar, CheckCircle2, XCircle } from "lucide-react"
import { GalleryUploadThingUpload } from "@/components/admin/gallery-uploadthing-upload"
import { GalleryDatePicker } from "@/components/admin/gallery-date-picker"
import { createGallery, updateGallery, deleteGallery, checkGallerySlug } from "@/lib/admin-actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ImageData {
  id?: number
  url: string
  key: string
  caption?: string | null
  orderIndex: number | null
}

interface GalleryFormProps {
  gallery?: {
    id: number
    title: string
    slug: string
    description: string | null
    date: Date
    city: string | null
    coverImage: string | null
    images: ImageData[]
  } | null
  mode: "create" | "edit"
}

export function GalleryFormV2({ gallery, mode }: GalleryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [images, setImages] = useState<ImageData[]>(gallery?.images || [])
  const [title, setTitle] = useState(gallery?.title || "")
  const [slug, setSlug] = useState(gallery?.slug || "")
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(mode === "edit")

  // Live slug availability: idle | checking | available | taken
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle")
  const [slugSuggestion, setSlugSuggestion] = useState<string | null>(null)

  // Debounced availability check against the DB whenever the slug changes.
  // If the slug was AUTO-generated and is already taken, silently adopt the
  // suggested free variant (e.g. "diwali-2") so the default is always usable.
  // If the user typed it manually, show the conflict and a clickable suggestion.
  // In edit mode the gallery id is excluded, so re-saving without renaming
  // never reports a false conflict against itself.
  useEffect(() => {
    if (!slug.trim()) {
      setSlugStatus("idle")
      setSlugSuggestion(null)
      return
    }
    let cancelled = false
    setSlugStatus("checking")
    const t = setTimeout(async () => {
      try {
        const result = await checkGallerySlug(slug, gallery?.id)
        if (cancelled) return
        if (result.available) {
          setSlugStatus("available")
          setSlugSuggestion(null)
        } else if (!isSlugManuallyEdited && result.suggestion) {
          // Auto-generated default collided - swap in the free variant.
          setSlug(result.suggestion)
        } else {
          setSlugStatus("taken")
          setSlugSuggestion(result.suggestion)
        }
      } catch {
        if (!cancelled) setSlugStatus("idle") // never block the form on a failed check
      }
    }, 400)
    return () => { cancelled = true; clearTimeout(t) }
  }, [slug, isSlugManuallyEdited, gallery?.id])

  // Auto-generate slug from title
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  // Handle title change and auto-generate slug
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    
    if (!isSlugManuallyEdited && mode === "create") {
      setSlug(generateSlug(newTitle))
    }
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSlug = e.target.value
    setSlug(newSlug)
    setIsSlugManuallyEdited(true)
  }

  const handleImagesChange = (newImages: ImageData[]) => {
    setImages(newImages)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Block save while the slug is known-taken. The server also guards this,
    // but failing here is friendlier than a surprise rename on save.
    if (slugStatus === "taken") return

    setIsSubmitting(true)
    
    const formData = new FormData(e.currentTarget)
    
    // Clear existing image inputs and add updated ones
    let index = 0
    while (formData.has(`images[${index}][url]`)) {
      formData.delete(`images[${index}][url]`)
      formData.delete(`images[${index}][key]`)
      index++
    }
    
    // Add current images to formData
    images.forEach((image, idx) => {
      formData.append(`images[${idx}][url]`, image.url)
      formData.append(`images[${idx}][key]`, image.key)
    })
    
    // Add controlled input values to formData (title and slug use controlled inputs)
    formData.set("title", title)
    formData.set("slug", slug)
    
    try {
      if (mode === "create") {
        await createGallery(formData)
      } else if (gallery) {
        formData.append("galleryId", gallery.id.toString())
        await updateGallery(formData)
      }
    } catch (error) {
      // Check if this is a redirect error (expected behavior)
      if (error && typeof error === 'object' && 'digest' in error && 
          typeof error.digest === 'string' && error.digest.includes('NEXT_REDIRECT')) {
        // This is a successful redirect, don't show error
        return
      }
      
      console.error("Error submitting form:", error)
      alert("Failed to save gallery. Please try again.")
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!gallery) return
    
    setIsDeleting(true)
    const formData = new FormData()
    formData.append("galleryId", gallery.id.toString())
    
    try {
      await deleteGallery(formData)
    } catch (error) {
      // Check if this is a redirect error (expected behavior)
      if (error && typeof error === 'object' && 'digest' in error && 
          typeof error.digest === 'string' && error.digest.includes('NEXT_REDIRECT')) {
        // This is a successful redirect, don't show error
        return
      }
      
      console.error("Error deleting gallery:", error)
      alert("Failed to delete gallery. Please try again.")
      setIsDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - Main Form Fields (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-foreground">Basic Information</h2>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Gallery Title *</Label>
                  <Input 
                    id="title" 
                    name="title" 
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="e.g., Summer Festival 2024"
                    required 
                    disabled={isSubmitting}
                    className="bg-background"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="slug">
                    URL Slug *
                    {!isSlugManuallyEdited && mode === "create" && title && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (auto-generated)
                      </span>
                    )}
                  </Label>
                  <Input 
                    id="slug" 
                    name="slug" 
                    value={slug}
                    onChange={handleSlugChange}
                    required 
                    disabled={isSubmitting}
                    className={cn(
                      "bg-background",
                      !isSlugManuallyEdited && mode === "create" && title ? "text-muted-foreground" : ""
                    )}
                  />
                  <p className="text-xs text-muted-foreground">
                    nazaara.live/galleries/{slug || "your-gallery-slug"}
                  </p>
                  {/* Live availability indicator */}
                  {slug && slugStatus === "checking" && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Checking availability...
                    </p>
                  )}
                  {slug && slugStatus === "available" && (
                    <p className="text-xs text-green-500 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Slug is available
                    </p>
                  )}
                  {slug && slugStatus === "taken" && (
                    <p className="text-xs text-red-400 flex items-center gap-1 flex-wrap">
                      <XCircle className="h-3 w-3" /> Already used by another gallery.
                      {slugSuggestion && (
                        <button
                          type="button"
                          className="underline underline-offset-2 text-[--gold] hover:opacity-80"
                          onClick={() => { setSlug(slugSuggestion); setIsSlugManuallyEdited(true) }}
                        >
                          Use &ldquo;{slugSuggestion}&rdquo; instead
                        </button>
                      )}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  defaultValue={gallery?.city || ""}
                  placeholder="e.g., Vancouver"
                  disabled={isSubmitting}
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  Shown as a tag on the album card — no need to put the city in the title anymore
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  defaultValue={gallery?.description || ""} 
                  placeholder="Brief description of the gallery (optional)"
                  rows={4}
                  disabled={isSubmitting}
                  className="bg-background resize-none"
                />
              </div>
            </div>
          </div>

          {/* Date */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              Gallery Date
            </h2>
            <div className="space-y-2">
              <Label>Date *</Label>
              <GalleryDatePicker 
                defaultDate={gallery?.date ? new Date(gallery.date) : undefined}
                name="date"
              />
            </div>
          </div>

          {/* Images */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
              <Image className="h-5 w-5 text-muted-foreground" />
              Gallery Images
            </h2>
            <GalleryUploadThingUpload 
              defaultImages={gallery?.images || []}
              onImagesChange={handleImagesChange}
            />
          </div>
        </div>

        {/* Right Column - Actions (1/3 width) */}
        <div className="lg:col-span-1 space-y-8">
          {/* Save Actions */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-foreground">Actions</h2>
            <div className="space-y-3">
              <Button
                type="submit"
                disabled={isSubmitting || isDeleting || slugStatus === "taken"}
                className="w-full bg-[--gold] text-[--maroon-red] hover:bg-[--gold]/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {mode === "create" ? "Create Gallery" : "Save Changes"}
                  </>
                )}
              </Button>

              {mode === "edit" && gallery && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-destructive text-destructive hover:bg-destructive hover:text-white"
                      disabled={isDeleting || isSubmitting}
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Gallery
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Gallery</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete &quot;{gallery.title}&quot;? This will permanently delete the gallery and all its images. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Delete Gallery
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          {/* Gallery Info */}
          {mode === "edit" && gallery && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Gallery Information</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Images:</span>
                  <span className="font-medium">{images.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">
                    {new Date(gallery.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </form>
  )
}

// Import cn utility
import { cn } from "@/lib/utils"
