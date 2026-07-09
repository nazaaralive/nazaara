"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface Venue {
  id: number
  name: string
  city: string
}

interface VenueSelectorProps {
  venues: Venue[]
  defaultVenueId?: number | null
  name?: string
}

// Searchable single-select venue picker (combobox). Replaces the plain
// dropdown in the event forms — type to filter by venue name or city.
// Submits the selected id via a hidden input so it works with server actions.
export function VenueSelector({ venues, defaultVenueId = null, name = "venueId" }: VenueSelectorProps) {
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(defaultVenueId)

  const selected = venues.find(v => v.id === selectedId)

  return (
    <>
      <input type="hidden" name={name} value={selectedId?.toString() ?? ""} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-background border-border font-normal"
          >
            <span className={cn(!selected && "text-muted-foreground")}>
              {selected ? `${selected.name} - ${selected.city}` : "Select a venue"}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search venues by name or city..." />
            <CommandList>
              <CommandEmpty>No venue found.</CommandEmpty>
              <CommandGroup>
                {venues.map(venue => (
                  <CommandItem
                    key={venue.id}
                    value={`${venue.name} ${venue.city}`}
                    onSelect={() => {
                      setSelectedId(venue.id === selectedId ? null : venue.id)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedId === venue.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {venue.name} - {venue.city}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  )
}
