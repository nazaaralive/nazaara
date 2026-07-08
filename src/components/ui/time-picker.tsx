"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Clock } from "lucide-react"

interface TimePickerProps {
  value?: string
  onChange?: (value: string) => void
  className?: string
}

function TimePicker({ value, onChange, className }: TimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  
  // Generate hour and minute options
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).filter((_, i) => i % 5 === 0) // 5-minute intervals
  
  const [selectedHour, selectedMinute] = (value || "22:00").split(":")
  
  const handleTimeSelect = (hour: string, minute: string) => {
    const timeString = `${hour}:${minute}`
    onChange?.(timeString)
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-input border-border text-foreground hover:bg-input/80",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value || "Select time"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="flex border-b border-border">
          <div className="flex-1 p-2">
            <div className="text-sm font-medium text-center mb-2 text-muted-foreground">Hour</div>
            <div className="h-40 overflow-y-auto">
              <div className="grid gap-1">
                {hours.map((hour) => (
                  <button
                    key={hour}
                    onClick={() => handleTimeSelect(hour, selectedMinute)}
                    className={cn(
                      "w-full text-sm py-1.5 px-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors",
                      selectedHour === hour && "bg-primary text-primary-foreground"
                    )}
                  >
                    {hour}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1 p-2">
            <div className="text-sm font-medium text-center mb-2 text-muted-foreground">Minute</div>
            <div className="h-40 overflow-y-auto">
              <div className="grid gap-1">
                {minutes.map((minute) => (
                  <button
                    key={minute}
                    onClick={() => handleTimeSelect(selectedHour, minute)}
                    className={cn(
                      "w-full text-sm py-1.5 px-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors",
                      selectedMinute === minute && "bg-primary text-primary-foreground"
                    )}
                  >
                    {minute}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { TimePicker }