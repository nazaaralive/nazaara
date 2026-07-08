"use client"

import { useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"

export function SuccessToast() {
  const searchParams = useSearchParams()
  const hasShownToast = useRef(new Set<string>())
  
  useEffect(() => {
    const success = searchParams.get("success")
    
    if (!success || hasShownToast.current.has(success)) {
      return
    }
    
    hasShownToast.current.add(success)
    
    if (success === "event-updated") {
      toast.success("Event saved successfully", {
        description: "Your changes have been saved.",
        duration: 3000,
      })
    } else if (success === "event-created") {
      toast.success("Event created successfully", {
        description: "Your new event has been created.",
        duration: 3000,
      })
    } else if (success === "venue-updated") {
      toast.success("Venue saved successfully", {
        description: "Your changes have been saved.",
        duration: 3000,
      })
    } else if (success === "venue-created") {
      toast.success("Venue created successfully", {
        description: "Your new venue has been created.",
        duration: 3000,
      })
    } else if (success === "artist-updated") {
      toast.success("Artist saved successfully", {
        description: "Your changes have been saved.",
        duration: 3000,
      })
    } else if (success === "artist-created") {
      toast.success("Artist created successfully", {
        description: "Your new artist has been created.",
        duration: 3000,
      })
    } else if (success === "gallery-updated") {
      toast.success("Gallery saved successfully", {
        description: "Your changes have been saved.",
        duration: 3000,
      })
    } else if (success === "gallery-created") {
      toast.success("Gallery created successfully", {
        description: "Your new gallery has been created.",
        duration: 3000,
      })
    } else if (success === "dj-updated") {
      toast.success("DJ saved successfully", {
        description: "Your changes have been saved.",
        duration: 3000,
      })
    } else if (success === "dj-created") {
      toast.success("DJ created successfully", {
        description: "Your new DJ has been created.",
        duration: 3000,
      })
    } else if (success === "gallery-deleted") {
      toast.success("Gallery deleted successfully", {
        description: "The gallery has been deleted.",
        duration: 3000,
      })
    }
  }, [searchParams])
  
  return null
}