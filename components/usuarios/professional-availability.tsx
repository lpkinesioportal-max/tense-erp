"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X, Clock, Calendar, Settings } from "lucide-react"
import type { Professional, ProfessionalAvailability } from "@/lib/types"

interface TimeSlot {
  start: string
  end: string
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo", short: "Dom" },
  { value: 1, label: "Lunes", short: "Lun" },
  { value: 2, label: "Martes", short: "Mar" },
  { value: 3, label: "Miércoles", short: "Mié" },
  { value: 4, label: "Jueves", short: "Jue" },
  { value: 5, label: "Viernes", short: "Vie" },
  { value: 6, label: "Sábado", short: "Sáb" },
]

const DURATION_OPTIONS = [
  { value: 30, label: "30 minutos" },
  { value: 45, label: "45 minutos" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1 hora 30 min" },
  { value: 120, label: "2 horas" },
]

interface Props {
  professional: Professional
  onSave: (availability: ProfessionalAvailability) => void
}

export function ProfessionalAvailabilityConfig({ professional, onSave }: Props) {
  const defaultAvailability: ProfessionalAvailability = {
    slotDuration: professional.standardDuration || 60,
    schedule: DAYS_OF_WEEK.map((day) => ({
      dayOfWeek: day.value,
      isActive: !professional.nonWorkingDays.includes(day.value),
      slots: [],
    })),
  }

  const [availability, setAvailability] = useState<ProfessionalAvailability>(
    professional.availability || defaultAvailability,
  )
  const [editingDay, setEditingDay] = useState<number | null>(null)
  const [newSlot, setNewSlot] = useState<TimeSlot>({ start: "09:00", end: "10:00" })

  const toggleDayActive = (dayOfWeek: number) => {
    setAvailability((prev) => ({
      ...prev,
      schedule: prev.schedule.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, isActive: !day.isActive } : day)),
    }))
  }

  const addSlot = (dayOfWeek: number) => {
    if (newSlot.start >= newSlot.end) return

    setAvailability((prev) => ({
      ...prev,
      schedule: prev.schedule.map((day) =>
        day.dayOfWeek === dayOfWeek
          ? { ...day, slots: [...day.slots, newSlot].sort((a, b) => a.start.localeCompare(b.start)) }
          : day,
      ),
    }))

    // Calculate next slot based on duration
    const [hours, mins] = newSlot.end.split(":").map(Number)
    const endMinutes = hours * 60 + mins + availability.slotDuration
    const nextStart = newSlot.end
    const nextEnd = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`
    setNewSlot({ start: nextStart, end: nextEnd })
  }

  const removeSlot = (dayOfWeek: number, slotIndex: number) => {
    setAvailability((prev) => ({
      ...prev,
      schedule: prev.schedule.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, slots: day.slots.filter((_, i) => i !== slotIndex) } : day,
      ),
    }))
  }

  const generateSlotsForDay = (dayOfWeek: number, startTime: string, endTime: string) => {
    const slots: TimeSlot[] = []
    const [startH, startM] = startTime.split(":").map(Number)
    const [endH, endM] = endTime.split(":").map(Number)

    let currentMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    while (currentMinutes + availability.slotDuration <= endMinutes) {
      const slotStart = `${String(Math.floor(currentMinutes / 60)).padStart(2, "0")}:${String(currentMinutes % 60).padStart(2, "0")}`
      currentMinutes += availability.slotDuration
      const slotEnd = `${String(Math.floor(currentMinutes / 60)).padStart(2, "0")}:${String(currentMinutes % 60).padStart(2, "0")}`
      slots.push({ start: slotStart, end: slotEnd })
    }

    setAvailability((prev) => ({
      ...prev,
      schedule: prev.schedule.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, slots } : day)),
    }))
  }

  const copyToAllDays = (fromDay: number) => {
    const sourceDay = availability.schedule.find((d) => d.dayOfWeek === fromDay)
    if (!sourceDay) return

    setAvailability((prev) => ({
      ...prev,
      schedule: prev.schedule.map((day) => (day.isActive ? { ...day, slots: [...sourceDay.slots] } : day)),
    }))
  }

  const handleSave = () => {
    onSave(availability)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4" />
          Disponibilidad de Turnos - {professional.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Duration Setting */}
        <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm">Duración del turno:</Label>
          <Select
            value={String(availability.slotDuration)}
            onValueChange={(v) => setAvailability((prev) => ({ ...prev, slotDuration: Number(v) }))}
          >
            <SelectTrigger className="w-[150px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Days Schedule */}
        <div className="space-y-2">
          {availability.schedule.map((day) => {
            const dayInfo = DAYS_OF_WEEK.find((d) => d.value === day.dayOfWeek)!
            return (
              <div key={day.dayOfWeek} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Switch checked={day.isActive} onCheckedChange={() => toggleDayActive(day.dayOfWeek)} />
                    <span className={`font-medium ${!day.isActive ? "text-muted-foreground" : ""}`}>
                      {dayInfo.label}
                    </span>
                    {day.isActive && (
                      <Badge variant="outline" className="text-xs">
                        {day.slots.length} turnos
                      </Badge>
                    )}
                  </div>
                  {day.isActive && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => setEditingDay(editingDay === day.dayOfWeek ? null : day.dayOfWeek)}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Configurar
                      </Button>
                      {day.slots.length > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => copyToAllDays(day.dayOfWeek)}
                        >
                          Copiar a todos
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {day.isActive && (
                  <>
                    {/* Slots display */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {day.slots.map((slot, i) => (
                        <Badge key={i} variant="secondary" className="text-xs font-normal gap-1">
                          {slot.start} - {slot.end}
                          {editingDay === day.dayOfWeek && (
                            <button
                              type="button"
                              className="ml-1 p-0.5 rounded-full hover:bg-destructive hover:text-white transition-colors focus:outline-none"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeSlot(day.dayOfWeek, i)
                              }}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </Badge>
                      ))}
                      {day.slots.length === 0 && (
                        <span className="text-xs text-muted-foreground">Sin turnos configurados</span>
                      )}
                    </div>

                    {/* Edit mode */}
                    {editingDay === day.dayOfWeek && (
                      <div className="pt-2 border-t space-y-2">
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <Label className="text-xs">Desde</Label>
                            <Input
                              type="time"
                              value={newSlot.start}
                              onChange={(e) => setNewSlot((prev: TimeSlot) => ({ ...prev, start: e.target.value }))}
                              className="h-8"
                            />
                          </div>
                          <div className="flex-1">
                            <Label className="text-xs">Hasta</Label>
                            <Input
                              type="time"
                              value={newSlot.end}
                              onChange={(e) => setNewSlot((prev: TimeSlot) => ({ ...prev, end: e.target.value }))}
                              className="h-8"
                            />
                          </div>
                          <Button size="sm" onClick={() => addSlot(day.dayOfWeek)} className="h-8">
                            <Plus className="h-3 w-3 mr-1" />
                            Agregar
                          </Button>
                        </div>

                        {/* Quick generate */}
                        <div className="flex gap-2 items-center">
                          <span className="text-xs text-muted-foreground">Generar automático:</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs bg-transparent"
                            onClick={() => generateSlotsForDay(day.dayOfWeek, "09:00", "13:00")}
                          >
                            Mañana (9-13)
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs bg-transparent"
                            onClick={() => generateSlotsForDay(day.dayOfWeek, "14:00", "18:00")}
                          >
                            Tarde (14-18)
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs bg-transparent"
                            onClick={() => generateSlotsForDay(day.dayOfWeek, "09:00", "18:00")}
                          >
                            Día completo
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>

        <Button onClick={handleSave} className="w-full">
          Guardar Disponibilidad
        </Button>
      </CardContent>
    </Card>
  )
}
