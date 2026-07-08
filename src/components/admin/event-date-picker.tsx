"use client"

import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Label } from "@/components/ui/label"
import { TimePicker } from "@/components/ui/time-picker"

interface EventDatePickerProps {
  startTime?: Date
  endTime?: Date
  startName?: string
  endName?: string
}

export function EventDatePicker({ startTime, endTime, startName = "startTime", endName = "endTime" }: EventDatePickerProps) {
  console.log('🔍 [EVENT DATE PICKER] Received props:', {
    startTime,
    endTime,
    startTimeType: typeof startTime,
    endTimeType: typeof endTime,
  })

  const [startDate, setStartDate] = useState<Date | undefined>(startTime)
  const [endDate, setEndDate] = useState<Date | undefined>(endTime)
  
  // Format times in UTC to preserve exact values without timezone conversion
  const startHourFormatted = startTime ? formatInTimeZone(startTime, "UTC", "HH:mm") : "22:00"
  const endHourFormatted = endTime ? formatInTimeZone(endTime, "UTC", "HH:mm") : "03:00"
  
  console.log('🔍 [EVENT DATE PICKER] Formatted times (UTC):', {
    startHourFormatted,
    endHourFormatted,
    startTimeValid: startTime && !isNaN(startTime.getTime()),
    endTimeValid: endTime && !isNaN(endTime.getTime()),
    startTimeUTC: startTime?.toISOString(),
    endTimeUTC: endTime?.toISOString(),
  })
  
  const [startHour, setStartHour] = useState(startHourFormatted)
  const [endHour, setEndHour] = useState(endHourFormatted)

  const combineDateTime = (date: Date | undefined, time: string) => {
    if (!date) return ""
    const [hours, minutes] = time.split(":")
    
    // Create a UTC date string by treating the selected date as UTC, not local time
    // Extract the local date components (what the user sees in the calendar)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    
    // Return ISO format with explicit UTC timezone: YYYY-MM-DDTHH:mm:ssZ
    // The 'Z' suffix tells the parser this is UTC time, preventing timezone conversion
    const combined = `${year}-${month}-${day}T${hours}:${minutes}:00Z`
    
    console.log('🔍 [COMBINE DATE TIME]:', {
      inputDate: date,
      inputTime: time,
      year,
      month,
      day,
      hours,
      minutes,
      combinedResult: combined,
      parsedAsDate: new Date(combined).toISOString(),
    })
    
    return combined
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date & Time</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <TimePicker
            value={startHour}
            onChange={setStartHour}
          />
          <input 
            type="hidden" 
            name={startName}
            value={combineDateTime(startDate, startHour)} 
          />
        </div>

        <div className="space-y-2">
          <Label>End Date & Time</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <TimePicker
            value={endHour}
            onChange={setEndHour}
          />
          <input 
            type="hidden" 
            name={endName}
            value={combineDateTime(endDate, endHour)} 
          />
        </div>
      </div>
    </div>
  )
}