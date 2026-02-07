"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Check } from "lucide-react"
import { useData } from "@/lib/data-context"
import type { TimeSlot } from "@/lib/types"

const DAYS_OF_WEEK = ["DO", "LU", "MA", "MI", "JU", "VI", "SA"]
const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

interface Props {
  professionalId: string
  currentAppointmentId?: string
  currentDate?: Date
  currentTime?: string
  onSelect: (date: Date, startTime: string, endTime: string) => void
  onCancel: () => void
  title?: string
}

export function RescheduleCalendarComponent({
  professionalId,
  currentAppointmentId,
  onSelect,
  onCancel,
  title,
}: Props) {
  const { appointments, professionals } = useData()
  const professional = (professionals || []).find((p) => p.id === professionalId)

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)

  // Get days in current month view
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: (Date | null)[] = []

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null)
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }, [currentMonth])

  // Check if a day has available slots
  const getDayAvailability = (date: Date) => {
    if (!professional || !professional.availability || !professional.availability.schedule) {
      return { hasSlots: false, availableCount: 0 }
    }

    const dayOfWeek = date.getDay()
    const daySchedule = professional.availability.schedule.find((d) => d.dayOfWeek === dayOfWeek)

    if (!daySchedule || !daySchedule.isActive || !daySchedule.slots || daySchedule.slots.length === 0) {
      return { hasSlots: false, availableCount: 0 }
    }

    const dayAppointments = (appointments || []).filter(
      (apt) =>
        apt.professionalId === professional.id &&
        apt.id !== currentAppointmentId &&
        new Date(apt.date).toDateString() === date.toDateString() &&
        apt.status !== "no_show",
    )

    const occupiedSlots = dayAppointments.map((apt) => apt.startTime)
    const availableSlots = daySchedule.slots.filter((slot) => !occupiedSlots.includes(slot.start))

    return {
      hasSlots: availableSlots.length > 0,
      availableCount: availableSlots.length,
      totalSlots: daySchedule.slots.length,
    }
  }

  // Get available slots for selected date
  const availableSlots = useMemo(() => {
    if (!selectedDate || !professional || !professional.availability || !professional.availability.schedule) {
      return []
    }

    const dayOfWeek = selectedDate.getDay()
    const daySchedule = professional.availability.schedule.find((d) => d.dayOfWeek === dayOfWeek)

    if (!daySchedule || !daySchedule.isActive || !daySchedule.slots) return []

    const dayAppointments = (appointments || []).filter(
      (apt) =>
        apt.professionalId === professional.id &&
        apt.id !== currentAppointmentId &&
        new Date(apt.date).toDateString() === selectedDate.toDateString() &&
        apt.status !== "no_show",
    )

    return daySchedule.slots.map((slot) => ({
      ...slot,
      isAvailable: !dayAppointments.some((apt) => apt.startTime === slot.start),
    }))
  }, [selectedDate, professional, appointments, currentAppointmentId])

  const prevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1))
    setSelectedDate(null)
    setSelectedSlot(null)
  }

  const nextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1))
    setSelectedDate(null)
    setSelectedSlot(null)
  }

  const handleConfirm = () => {
    if (selectedDate && selectedSlot) {
      onSelect(selectedDate, selectedSlot.start, selectedSlot.end)
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (!professional) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-muted-foreground">
        <p className="text-sm">Profesional no encontrado</p>
        <Button variant="outline" size="sm" className="mt-4 bg-transparent" onClick={onCancel}>
          Volver
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col p-4 h-full">
      {/* Header - compact */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">{title || "Reprogramar Turno"}</h3>
        <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
          {professional.name}
        </Badge>
      </div>

      {/* Month navigation - compact */}
      <div className="flex items-center justify-between mb-2">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={prevMonth}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="text-xs font-semibold">
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={nextMonth}>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Calendar grid - very compact */}
      <div className="grid grid-cols-7 gap-0.5 mb-2">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="text-center text-[9px] font-semibold text-muted-foreground py-1">
            {day}
          </div>
        ))}

        {calendarDays.map((date, i) => {
          if (!date) {
            return <div key={`empty-${i}`} className="h-9" />
          }

          const isPast = date < today
          const isSelected = selectedDate?.toDateString() === date.toDateString()
          const availability = getDayAvailability(date)

          return (
            <button
              key={date.toISOString()}
              disabled={isPast || !availability.hasSlots}
              onClick={() => {
                setSelectedDate(date)
                setSelectedSlot(null)
              }}
              className={`
                h-9 rounded text-[11px] relative flex flex-col items-center justify-center
                ${isPast ? "text-muted-foreground/30" : ""}
                ${!availability.hasSlots && !isPast ? "text-muted-foreground/50" : ""}
                ${availability.hasSlots && !isPast ? "hover:bg-sky-50 cursor-pointer" : ""}
                ${isSelected ? "bg-sky-500 text-white" : ""}
              `}
            >
              <span className="font-medium leading-none">{date.getDate()}</span>
              {availability.hasSlots && !isPast && (
                <span className={`text-[8px] leading-none ${isSelected ? "text-sky-100" : "text-sky-500"}`}>
                  {availability.availableCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Selected date slots - compact */}
      {selectedDate && availableSlots.length > 0 && (
        <div className="mb-2 p-2 bg-sky-50 rounded border border-sky-100">
          <p className="text-[10px] text-sky-700 font-medium mb-1.5">
            {selectedDate.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })}
          </p>
          <div className="flex flex-wrap gap-1">
            {availableSlots
              .filter((slot) => slot.isAvailable)
              .map((slot, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedSlot(slot)}
                  className={`
                    py-0.5 px-2 rounded text-[10px] font-medium
                    ${
                      selectedSlot?.start === slot.start
                        ? "bg-sky-500 text-white"
                        : "bg-white border border-sky-200 hover:border-sky-400 text-sky-700"
                    }
                  `}
                >
                  {slot.start}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Spacer to push buttons to bottom */}
      <div className="flex-1" />

      {/* Buttons - at bottom */}
      <div className="flex gap-2 pt-2 border-t mt-auto">
        <Button variant="outline" size="sm" className="flex-1 h-9 text-xs bg-transparent" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          size="sm"
          className="flex-1 h-9 text-xs bg-sky-500 hover:bg-sky-600"
          disabled={!selectedDate || !selectedSlot}
          onClick={handleConfirm}
        >
          <Check className="h-3 w-3 mr-1" />
          Confirmar
        </Button>
      </div>
    </div>
  )
}
