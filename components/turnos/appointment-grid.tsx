"use client"

import { useState, useMemo } from "react"
import { useData } from "@/lib/data-context"
import { cn, getWeekDays, formatTime, statusLabels, statusColors, getDateInISO, formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, DollarSign, Check, Ban, Plus, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { AppointmentDetailModal } from "./appointment-detail-modal"
import { BookingWizard } from "./booking-wizard"
import { useToast } from "@/hooks/use-toast"
import { ShareAvailabilityDialog } from "./share-availability-dialog"
import { MessageCircle } from "lucide-react"
import type { Appointment } from "@/lib/types"

export function AppointmentGrid() {
  const { appointments: allAppointments, professionals, clients, serviceConfigs, selectedProfessionalId, setSelectedProfessionalId, selectedProfessionalIds, interProfessionalAdjustments } = useData()
  const appointments = allAppointments.filter((a) => a.status !== "follow_up" && a.status !== "cancelled")

  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(today.setDate(diff))
  })
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showBookingWizard, setShowBookingWizard] = useState(false)
  const [preselectedSlot, setPreselectedSlot] = useState<{ date: Date; time: string; professionalId: string } | null>(null)
  const [isOvertimeMode, setIsOvertimeMode] = useState(false)
  const { toast } = useToast()
  const { generateDailySettlement, settlements, deleteSettlement } = useData()
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null)
  const [showShareDialog, setShowShareDialog] = useState(false)

  const activeProfessionals = useMemo(() => {
    if (selectedProfessionalIds.length > 0) {
      return professionals.filter(p => selectedProfessionalIds.includes(p.id))
    }
    const single = professionals.find((p) => p.id === selectedProfessionalId)
    return single ? [single] : []
  }, [professionals, selectedProfessionalIds, selectedProfessionalId])

  const professional = activeProfessionals[0]
  const weekDays = getWeekDays(currentWeekStart)

  console.log(
    "[v0] Week days:",
    weekDays.map((d) => `${d.toLocaleDateString("es-AR", { weekday: "short" })} ${d.getDate()}`),
  )

  const allTimeSlots = useMemo(() => {
    const slots: string[] = []
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < 60; j += 15) {
        const hour = String(i).padStart(2, "0")
        const min = String(j).padStart(2, "0")
        slots.push(`${hour}:${min}`)
      }
    }
    return slots
  }, [])

  const getWorkingHoursRange = useMemo(() => {
    if (!professional) return null
    if (professional.availability?.schedule && professional.availability.schedule.length > 0) {
      const slots = professional.availability.schedule
        .filter((d) => d.isActive && d.slots)
        .flatMap((d) => d.slots || [])
      if (slots.length > 0) {
        return {
          start: slots[0].start,
          end: slots[slots.length - 1].end,
        }
      }
    }
    return {
      start: professional.workingHours.start,
      end: professional.workingHours.end,
    }
  }, [professional])

  const isWithinWorkingHours = (time: string): boolean => {
    if (!getWorkingHoursRange) return false
    return time >= getWorkingHoursRange.start && time < getWorkingHoursRange.end
  }

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number)
    return hours * 60 + minutes
  }

  const getAppointmentForSlot = (date: Date, slotTime: string, profId: string) => {
    const dateStr = date.toDateString()
    const slotMinutes = timeToMinutes(slotTime)

    return appointments.find((apt) => {
      const aptProfId = apt.professionalIdCalendario || apt.professionalId
      if (aptProfId !== profId) return false
      if (new Date(apt.date).toDateString() !== dateStr) return false

      const startMinutes = timeToMinutes(apt.startTime)
      const endMinutes = timeToMinutes(apt.endTime)

      // Check if this slot is within the appointment time range
      return startMinutes <= slotMinutes && slotMinutes < endMinutes
    })
  }

  const isSlotOccupiedByAppointment = (date: Date, slotTime: string, profId: string): boolean => {
    const dateStr = date.toDateString()
    const slotMinutes = timeToMinutes(slotTime)

    return appointments.some((apt) => {
      const aptProfId = apt.professionalIdCalendario || apt.professionalId
      if (aptProfId !== profId) return false
      if (new Date(apt.date).toDateString() !== dateStr) return false

      const startMinutes = timeToMinutes(apt.startTime)
      const endMinutes = timeToMinutes(apt.endTime)

      // Check if this slot is within any appointment's time range
      return slotMinutes >= startMinutes && slotMinutes < endMinutes
    })
  }

  const isSlotOccupiedByAvailability = (date: Date, slotTime: string, profId: string): boolean => {
    const slotMinutes = timeToMinutes(slotTime)
    const dayOfWeek = date.getDay()
    const prof = professionals.find(p => p.id === profId)
    if (!prof?.availability?.schedule) return false

    const daySchedule = prof.availability.schedule.find((d) => d.dayOfWeek === dayOfWeek)
    if (!daySchedule || !daySchedule.isActive || !daySchedule.slots) return false

    return daySchedule.slots.some((slot) => {
      const startMinutes = timeToMinutes(slot.start)
      const duration = getProfessionalDuration(profId)
      const endMinutes = startMinutes + duration
      return slotMinutes > startMinutes && slotMinutes < endMinutes
    })
  }

  const isSpanFree = (date: Date, startTime: string, durationMinutes: number, profId: string): boolean => {
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = startMinutes + durationMinutes
    const dateStr = date.toDateString()

    return !appointments.some((apt) => {
      const aptProfId = apt.professionalIdCalendario || apt.professionalId
      if (aptProfId !== profId) return false
      if (new Date(apt.date).toDateString() !== dateStr) return false

      const aptStart = timeToMinutes(apt.startTime)
      const aptEnd = timeToMinutes(apt.endTime)

      // Overlap: A starts before B ends AND A ends after B starts
      return startMinutes < aptEnd && endMinutes > aptStart
    })
  }

  const settleStatus = useMemo(() => {
    // This is now handled locally in handleSettleDay for each professional
    return { allowed: true, reason: "", items: [] }
  }, [])

  const isToday = (date: Date) => {
    return new Date().toDateString() === date.toDateString()
  }

  const getAppointmentRowSpan = (apt: Appointment): number => {
    const startMinutes = timeToMinutes(apt.startTime)
    const endMinutes = timeToMinutes(apt.endTime)
    const durationMinutes = endMinutes - startMinutes

    // Each row is 15 minutes, so divide by 15 and round up
    return Math.ceil(durationMinutes / 15)
  }

  const getAppointmentsForSlot = (date: Date, slotTime: string, professionalId: string) => {
    const dateStr = date.toDateString()
    const slotMinutes = timeToMinutes(slotTime)

    const matches = appointments.filter((apt) => {
      const aptProfId = apt.professionalIdCalendario || apt.professionalId
      if (aptProfId !== professionalId) return false
      if (new Date(apt.date).toDateString() !== dateStr) return false

      const startMinutes = timeToMinutes(apt.startTime)
      return startMinutes >= slotMinutes && startMinutes < slotMinutes + 15
    })

    return matches
  }

  const getClient = (id: string) => (clients || []).find((c) => c.id === id)
  const getService = (id: string) => (serviceConfigs || []).find((s) => s.id === id)

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentWeekStart((prev) => {
      const newDate = new Date(prev)
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7))
      return newDate
    })
  }

  const handleOpenWizard = () => {
    setPreselectedSlot(null)
    setShowBookingWizard(true)
    setIsOvertimeMode(false)
  }

  const handleOpenOvertimeWizard = () => {
    setPreselectedSlot(null)
    setShowBookingWizard(true)
    setIsOvertimeMode(true)
  }

  const handleCloseWizard = () => {
    setShowBookingWizard(false)
    setPreselectedSlot(null)
    setIsOvertimeMode(false)
  }

  const handleSlotClick = (date: Date, time: string, profId: string) => {
    setPreselectedSlot({ date, time, professionalId: profId })
    setShowBookingWizard(true)
    setIsOvertimeMode(false)
  }

  // --- Settle logic ---
  const handleSettleDay = (profId?: string) => {
    const id = profId || selectedProfessionalId
    if (!id) return

    // Re-calculating status locally for the specific professional
    const today = new Date()
    const todayStr = getDateInISO(today)
    const todayAppointments = allAppointments.filter(
      (a) =>
        getDateInISO(a.date) === todayStr &&
        a.professionalIdCalendario === id &&
        a.status !== "cancelled" &&
        a.status !== "follow_up"
    )

    const pendingApts = todayAppointments.filter(
      (a) => a.status === "confirmed" || a.status === "pending_deposit"
    )

    if (pendingApts.length > 0) {
      toast({
        title: "No se puede liquidar",
        description: `Debe marcar como Asistió o No asistió a todos los pacientes.`,
        variant: "destructive",
      })
      return
    }

    const result = generateDailySettlement(id, new Date())
    if (result) {
      toast({
        title: "Día liquidado",
        description: `Se ha generado el cierre del día correctamente. Total a liquidar: $${result.amountToSettle}`,
      })

      const profObj = professionals.find(p => p.id === id)
      if (profObj && appointments) {
        import("@/lib/pdf-generator").then(({ generateSettlementPDF }) => {
          generateSettlementPDF(result, profObj, appointments, clients)
        })
      }
    } else {
      toast({
        title: "Error",
        description: "No se pudo liquidar el día.",
        variant: "destructive",
      })
    }
  }


  // Calculate Settle Button Positions
  const settleButtonRows = useMemo(() => {
    const result: Record<string, number> = {}

    if (activeProfessionals.length === 0) return result

    activeProfessionals.forEach(prof => {
      weekDays.forEach((day, dayIndex) => {
        if (!isToday(day)) return

        const dayStr = day.toDateString()
        const dayAppointments = appointments.filter(
          (a) =>
            new Date(a.date).toDateString() === dayStr &&
            a.professionalId === prof.id &&
            a.status !== "cancelled" &&
            a.status !== "follow_up"
        )


        let lastSlotIndex = 0

        // 1. Find the end of the working schedule for this day
        const dayOfWeek = day.getDay()
        const daySchedule = prof?.availability?.schedule?.find((d) => d.dayOfWeek === dayOfWeek)

        if (daySchedule && daySchedule.isActive && daySchedule.slots && daySchedule.slots.length > 0) {
          // Get the latest end time
          const sortedSlots = [...daySchedule.slots].sort((a, b) => timeToMinutes(b.end) - timeToMinutes(a.end))
          const lastSlotEndTime = sortedSlots[0].end
          const endMinutes = timeToMinutes(lastSlotEndTime)

          // Find corresponding slot index
          for (let i = 0; i < allTimeSlots.length; i++) {
            if (timeToMinutes(allTimeSlots[i]) < endMinutes) {
              lastSlotIndex = i + 1
            }
          }
        }

        // 2. Check appointments
        if (dayAppointments.length > 0) {
          dayAppointments.forEach((apt) => {
            const startIndex = allTimeSlots.findIndex((t) => t === apt.startTime)
            if (startIndex !== -1) {
              const rowSpan = getAppointmentRowSpan(apt)
              const endIndex = startIndex + rowSpan
              if (endIndex > lastSlotIndex) lastSlotIndex = endIndex
            }
          })
        }

        // Ensure lastSlotIndex is never zero and fits within allTimeSlots
        if (lastSlotIndex === 0) lastSlotIndex = allTimeSlots.length - 6

        result[`${prof.id}-${dayIndex}`] = lastSlotIndex + 1
      })
    })
    return result
  }, [allTimeSlots, appointments, activeProfessionals, weekDays])

  const isNonWorkingDay = (date: Date, profId?: string) => {
    const prof = profId ? professionals.find(p => p.id === profId) : professional
    if (!prof) return false

    if (
      prof.availability &&
      prof.availability.schedule &&
      prof.availability.schedule.length > 0
    ) {
      const dayOfWeek = date.getDay()
      const daySchedule = prof.availability.schedule.find((d) => d.dayOfWeek === dayOfWeek)
      if (daySchedule) {
        return !daySchedule.isActive
      }
    }

    return prof.nonWorkingDays.includes(date.getDay())
  }





  const getProfessionalDuration = (profId: string): number => {
    const prof = professionals.find(p => p.id === profId)
    if (!prof) return 60

    // Try to get duration from service config
    const firstServiceId = prof.services?.[0]
    if (firstServiceId) {
      const service = serviceConfigs.find((s) => s.id === firstServiceId)
      if (service && service.appointmentDuration) {
        return service.appointmentDuration
      }
    }

    // Default to professional's standard duration or 60 minutes
    return prof.standardDuration || 60
  }

  const getAppointmentDurationMinutes = (): number => {
    if (!professional) return 60
    return getProfessionalDuration(professional.id)
  }

  const getFirstAvailableSlotOfDay = (date: Date, slotTime: string, profId: string): boolean => {
    const slotMinutes = timeToMinutes(slotTime)
    const dayOfWeek = date.getDay()

    const prof = professionals.find(p => p.id === profId)
    if (!prof?.availability?.schedule) {
      // Fallback to standard working hours if no detailed schedule
      if (!prof) return false
      const startMin = timeToMinutes(prof.workingHours.start)
      const endMin = timeToMinutes(prof.workingHours.end)
      const duration = prof.standardDuration || 60
      return slotMinutes >= startMin && slotMinutes < endMin && (slotMinutes - startMin) % duration === 0
    }

    const daySchedule = prof.availability.schedule.find((d) => d.dayOfWeek === dayOfWeek)
    if (!daySchedule || !daySchedule.isActive || !daySchedule.slots) return false

    // Check if any slot in this day starts at exactly this time
    return daySchedule.slots.some((slot) => timeToMinutes(slot.start) === slotMinutes)
  }

  if (activeProfessionals.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-border bg-card">
        <p className="text-muted-foreground">Seleccione uno o más profesionales para ver la agenda</p>
      </div>
    )
  }

  const numProfs = activeProfessionals.length
  const gridColumns = `50px repeat(${7 * numProfs}, 1fr)`

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => navigateWeek("prev")}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <h3 className="font-semibold text-foreground">
            {weekDays[0].toLocaleDateString("es-AR", { day: "numeric", month: "short" })} -{" "}
            {weekDays[6].toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleOpenWizard}>
            <Plus className="h-4 w-4 mr-2" />
            Agendar
          </Button>
          <Button variant="outline" onClick={() => setShowShareDialog(true)}>
            <MessageCircle className="h-4 w-4 mr-2" />
            Compartir
          </Button>
          <Button onClick={handleOpenOvertimeWizard} variant="secondary">
            <Plus className="h-4 w-4 mr-2" />
            Sobre Turno
          </Button>
          <Button variant="outline" size="icon" onClick={() => {
            navigateWeek("next");
            setShowConfirmDelete(null);
          }}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <div className="min-w-[900px]">
          {/* Header Row */}
          <div
            className="border-b border-border bg-muted sticky top-0 z-10"
            style={{
              display: "grid",
              gridTemplateColumns: gridColumns,
            }}
          >
            <div className="p-2 text-center text-xs font-medium text-muted-foreground border-r border-border">Hora</div>
            {weekDays.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className={cn(
                  "border-r border-border flex flex-col",
                  isToday(day) && "bg-primary/10",
                )}
                style={{
                  gridColumn: `${(dayIndex * numProfs) + 2} / span ${numProfs}`,
                }}
              >
                <div className="p-2 text-center border-b border-border/50">
                  <div className="text-xs font-medium text-muted-foreground">
                    {day.toLocaleDateString("es-AR", { weekday: "short" })}
                  </div>
                  <div className={cn("text-sm font-semibold", isToday(day) ? "text-primary" : "text-foreground")}>
                    {day.getDate()}
                  </div>
                </div>

                {numProfs > 1 && (
                  <div
                    className="border-t border-border/50 text-[9px] uppercase tracking-tighter"
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${numProfs}, 1fr)`
                    }}
                  >
                    {activeProfessionals.map((prof) => (
                      <div
                        key={prof.id}
                        className="px-1 py-1 text-center truncate border-r border-border last:border-r-0 font-bold opacity-70"
                        title={prof.name}
                      >
                        {prof.name.split(' ')[1] || prof.name.split(' ')[0]}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="max-h-[700px] overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
            <div
              className="grid"
              style={{
                gridTemplateColumns: gridColumns,
                gridAutoRows: "40px",
                gridAutoFlow: "dense",
              }}
            >
              {allTimeSlots.map((slotTime, slotIndex) => {
                const isWorkingHour = isWithinWorkingHours(slotTime)

                return (
                  <div key={`time-${slotTime}`} className="contents">
                    {/* Time label - only show every 4th slot (every hour) */}
                    {slotIndex % 4 === 0 && (
                      <div
                        className={cn(
                          "flex items-center justify-center border-r border-b border-border p-2 text-xs font-medium sticky left-0 z-5",
                          isWorkingHour ? "bg-background text-foreground" : "bg-muted/50 text-muted-foreground",
                        )}
                        style={{
                          gridRow: `${slotIndex + 1} / span 4`, // Hour labels span 4 slots (60 minutes)
                          gridColumn: 1,
                        }}
                      >
                        {formatTime(slotTime)}
                      </div>
                    )}

                    {/* Day columns */}
                    {weekDays.map((day, dayIndex) => {
                      return (
                        <div key={`${dayIndex}-${slotTime}`} className="contents">
                          {activeProfessionals.map((prof, profIndex) => {
                            const slotAppointments = getAppointmentsForSlot(day, slotTime, prof.id)
                            const isNonWorking = isNonWorkingDay(day, prof.id)
                            const now = new Date()
                            const slotDate = new Date(day)
                            const [slotHours, slotMinutes] = slotTime.split(":").map(Number)
                            slotDate.setHours(slotHours, slotMinutes, 0, 0)
                            const isPast = slotDate < now

                            const firstApt = slotAppointments[0]
                            const isAvailable = !firstApt && getFirstAvailableSlotOfDay(day, slotTime, prof.id)
                            const rowSpan = firstApt
                              ? getAppointmentRowSpan(firstApt)
                              : isAvailable
                                ? Math.ceil(getProfessionalDuration(prof.id) / 15)
                                : 1

                            const isOccupiedByApt = isSlotOccupiedByAppointment(day, slotTime, prof.id)
                            const isOccupiedByAvailability = isSlotOccupiedByAvailability(day, slotTime, prof.id)

                            // Si está ocupado por una cita que empezó antes, ocultar esta celda
                            if (isOccupiedByApt && slotAppointments.length === 0) {
                              return null
                            }

                            // Si está ocupado por un bloque de disponibilidad que empezó antes, ocultar esta celda
                            if (isOccupiedByAvailability && !isAvailable) {
                              return null
                            }

                            const colIndex = 2 + (dayIndex * numProfs) + profIndex

                            return (
                              <div
                                key={`${dayIndex}-${prof.id}-${slotTime}`}
                                className={cn(
                                  "border-r border-b border-border p-0.5 transition-colors last:border-r-0 relative cursor-pointer",
                                  isNonWorking && "bg-muted/40 cursor-not-allowed",
                                  isToday(day) && "bg-primary/5",
                                  !firstApt && !isAvailable && "hover:bg-accent",
                                  isPast && !firstApt && "bg-muted/20 cursor-not-allowed",
                                )}
                                style={{
                                  gridColumn: colIndex,
                                  gridRow: `${slotIndex + 1} / span ${rowSpan}`,
                                }}
                                onClick={() => !isNonWorking && !isPast && slotAppointments.length === 0 && handleSlotClick(day, slotTime, prof.id)}
                              >
                                <div className="flex flex-col gap-0.5 h-full w-full">
                                  {slotAppointments.map((apt) => {
                                    const client = getClient(apt.clientId)
                                    return (
                                      <div
                                        key={apt.id}
                                        className={cn(
                                          "rounded border-[1px] p-1 text-[9px] cursor-pointer overflow-hidden flex-1 shadow-sm transition-all hover:brightness-105 active:scale-[0.98] h-full flex flex-col justify-between",
                                          statusColors[apt.status] || "bg-blue-500",
                                          apt.isOvertimeMode && "border-amber-400 bg-amber-50 text-amber-900",
                                          slotAppointments.length > 1 && "border-white/50 border-2"
                                        )}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setSelectedAppointment(apt)
                                        }}
                                      >
                                        <div className="font-bold truncate text-[10px]">{client?.name}</div>
                                        <div className="flex items-center justify-between mt-0.5 pt-0.5 border-t border-white/10">
                                          <span className="opacity-90 font-bold">{apt.startTime}</span>
                                          {apt.status === "attended" && <CheckCircle className="h-3 w-3 text-white" />}
                                        </div>
                                      </div>
                                    )
                                  })}
                                  {isAvailable && (
                                    <div className="rounded border border-emerald-200 bg-emerald-50/20 p-1 text-xs h-full flex flex-col items-center justify-center cursor-default hover:bg-emerald-50/40 transition-colors group">
                                      <Plus className="h-3 w-3 text-emerald-500/50 group-hover:text-emerald-600 transition-colors" />
                                      <span className="text-[7px] font-bold text-emerald-500/50 uppercase tracking-wider group-hover:text-emerald-600">Disp.</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                )
              })}

              {/* Settle Day Button Row */}
              {weekDays.map((day, dayIndex) => {
                if (!isToday(day)) return null

                const targetRow = settleButtonRows[dayIndex]
                if (!targetRow) return null

                return (
                  <div key={`settle-${dayIndex}`} className="contents">
                    {activeProfessionals.map((prof, profIndex) => {
                      const buttonRow = settleButtonRows[`${prof.id}-${dayIndex}`]
                      if (!buttonRow) return null

                      return (
                        <div
                          key={`settle-${prof.id}-${dayIndex}`}
                          className="flex justify-center p-1 mt-4 relative z-50 pointer-events-auto"
                          style={{
                            gridColumn: 2 + (dayIndex * numProfs) + profIndex,
                            gridRow: `${buttonRow} / span 6`,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div
                            className="flex flex-col gap-1 w-full mt-4"
                            style={{
                              gridColumn: `${profIndex + 1} / span 1`,
                            }}
                          >
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all w-full h-8 px-1"
                              onClick={() => {
                                // We need to handle professional context here
                                // Since generateDailySettlement depends on selectedProfessionalId, 
                                // we might need to set it temporarily or update the function
                                setSelectedProfessionalId(prof.id)
                                handleSettleDay()
                              }}
                            >
                              <div className="flex flex-col items-center scale-[0.8]">
                                <CheckCircle className="h-3 w-3" />
                                <span className="text-[8px] font-bold">Liquidar</span>
                              </div>
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Status Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded border-2 border-amber-400 bg-amber-50" />
          <span className="text-muted-foreground">Sobre Turno</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded border border-emerald-300 bg-emerald-50" />
          <span className="text-muted-foreground">Disponible</span>
        </div>
        {Object.entries(statusLabels).map(([status, label]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={cn("h-3 w-3 rounded border", statusColors[status])} />
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment!}
          isOpen={!!selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}

      <BookingWizard
        isOpen={showBookingWizard}
        onClose={handleCloseWizard}
        preselectedProfessionalId={preselectedSlot?.professionalId || selectedProfessionalId || undefined}
        preselectedSlot={preselectedSlot}
        isOvertimeMode={isOvertimeMode}
      />

      <ShareAvailabilityDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        initialProfessionalIds={selectedProfessionalIds.length > 0 ? selectedProfessionalIds : (selectedProfessionalId ? [selectedProfessionalId] : [])}
      />

      {weekDays.some((d) => isToday(d)) && selectedProfessionalId && !settleStatus.allowed && (
        // Optional: keep a toast or indicator if needed, or nothing. 
        // Since we moved the button into the grid, we can remove the fixed one.
        null
      )}
    </div>
  )
}
