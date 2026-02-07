"use client"

import { useState, useMemo } from "react"
import { useData } from "@/lib/data-context"
import { cn, getWeekDays, formatTime, statusLabels, statusColors, getDateInISO, formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, DollarSign, Check, Ban, Plus, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { AppointmentDetailModal } from "./appointment-detail-modal"
import { BookingWizard } from "./booking-wizard"
import { useToast } from "@/hooks/use-toast"
import type { Appointment } from "@/lib/types"

export function AppointmentGrid() {
  const { appointments: allAppointments, professionals, clients, serviceConfigs, selectedProfessionalId, interProfessionalAdjustments } = useData()
  const appointments = allAppointments.filter((a) => a.status !== "follow_up" && a.status !== "cancelled")

  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(today.setDate(diff))
  })
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showBookingWizard, setShowBookingWizard] = useState(false)
  const [preselectedSlot, setPreselectedSlot] = useState<{ date: Date; time: string } | null>(null)
  const [isOvertimeMode, setIsOvertimeMode] = useState(false)
  const { toast } = useToast()
  const { generateDailySettlement, settlements, deleteSettlement } = useData()
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null)

  const professional = professionals.find((p) => p.id === selectedProfessionalId)
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

  const getAppointmentForSlot = (date: Date, slotTime: string) => {
    const dateStr = date.toDateString()
    const slotMinutes = timeToMinutes(slotTime)

    return appointments.find((apt) => {
      if (apt.professionalIdCalendario !== selectedProfessionalId) return false
      if (new Date(apt.date).toDateString() !== dateStr) return false

      const startMinutes = timeToMinutes(apt.startTime)
      const endMinutes = timeToMinutes(apt.endTime)

      // Check if this slot is within the appointment time range
      return startMinutes <= slotMinutes && slotMinutes < endMinutes
    })
  }



  const isSlotOccupiedByAppointment = (date: Date, slotTime: string): boolean => {
    const dateStr = date.toDateString()
    const slotMinutes = timeToMinutes(slotTime)

    return appointments.some((apt) => {
      if (apt.professionalIdCalendario !== selectedProfessionalId) return false
      if (new Date(apt.date).toDateString() !== dateStr) return false

      const startMinutes = timeToMinutes(apt.startTime)
      const endMinutes = timeToMinutes(apt.endTime)

      // Check if this slot is within any appointment's time range
      return startMinutes <= slotMinutes && slotMinutes < endMinutes
    })
  }

  const isSpanFree = (date: Date, startTime: string, durationMinutes: number): boolean => {
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = startMinutes + durationMinutes
    const dateStr = date.toDateString()

    return !appointments.some((apt) => {
      if (apt.professionalIdCalendario !== selectedProfessionalId) return false
      if (new Date(apt.date).toDateString() !== dateStr) return false

      const aptStart = timeToMinutes(apt.startTime)
      const aptEnd = timeToMinutes(apt.endTime)

      // Overlap: A starts before B ends AND A ends after B starts
      return startMinutes < aptEnd && endMinutes > aptStart
    })
  }

  // --- Settle logic ---
  const today = new Date()
  const isTodayVisible = weekDays.some(d => d.toDateString() === today.toDateString())

  const settleStatus = useMemo(() => {
    if (!isTodayVisible) return { allowed: false, reason: "Solo se pueden liquidar días actuales." }
    if (!selectedProfessionalId) return { allowed: false, reason: "Seleccione un profesional para liquidar." }

    // 1. Check if there are any pending appointments for today
    const todayStr = getDateInISO(today)

    const todayAppointments = allAppointments.filter(
      (a) =>
        getDateInISO(a.date) === todayStr &&
        a.professionalIdCalendario === selectedProfessionalId &&
        a.status !== "cancelled" &&
        a.status !== "follow_up"
    )

    const pendingApts = todayAppointments.filter(
      (a) => a.status === "confirmed" || a.status === "pending_deposit"
    )

    if (pendingApts.length > 0) {
      const clientStatuses = pendingApts
        .map((a) => {
          const clientName = clients.find((c) => c.id === a.clientId)?.name || "Cliente desconocido"
          const statusLabel = statusLabels[a.status] || a.status
          return `${clientName} - ${a.startTime} hs (${statusLabel})`
        })
        .slice(0, 3)
        .join(", ")
      const moreSuffix = pendingApts.length > 3 ? "..." : ""

      return {
        allowed: false,
        reason: `Debe marcar como Asistió o No asistió: ${clientStatuses}${moreSuffix}`,
        items: pendingApts
      }
    }

    return { allowed: true, reason: "", items: [] }
  }, [allAppointments, selectedProfessionalId, isTodayVisible, clients])

  const existingSettlementToday = useMemo(() => {
    if (!selectedProfessionalId) return null;
    return settlements.find(s =>
      s.type === 'daily' &&
      s.professionalId === selectedProfessionalId &&
      new Date(s.date || new Date()).toDateString() === today.toDateString()
    );
  }, [settlements, selectedProfessionalId, today]);

  const pendingItems = settleStatus.items || []



  const handleSettleDay = () => {
    if (!selectedProfessionalId) return

    if (!settleStatus.allowed) {
      toast({
        title: "No se puede liquidar",
        description: settleStatus.reason,
        variant: "destructive",
      })
      return
    }

    const result = generateDailySettlement(selectedProfessionalId, new Date())
    if (result) {
      toast({
        title: "Día liquidado",
        description: `Se ha generado el cierre del día correctamente. Total a liquidar: $${result.amountToSettle}`,
      })

      // Generate PDF
      if (professional && appointments) {
        import("@/lib/pdf-generator").then(({ generateSettlementPDF }) => {
          generateSettlementPDF(result, professional, appointments, clients)
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

  const getAppointmentRowSpan = (apt: Appointment): number => {
    const startMinutes = timeToMinutes(apt.startTime)
    const endMinutes = timeToMinutes(apt.endTime)
    const durationMinutes = endMinutes - startMinutes

    // Each row is 15 minutes, so divide by 15 and round up
    return Math.ceil(durationMinutes / 15)
  }

  const getAppointmentsForSlot = (date: Date, slotTime: string) => {
    const dateStr = date.toDateString()
    const slotMinutes = timeToMinutes(slotTime)

    const matches = appointments.filter((apt) => {
      if (apt.professionalIdCalendario !== selectedProfessionalId) return false
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

  const handleSlotClick = (date: Date, time: string) => {
    const apt = getAppointmentForSlot(date, time)
    if (apt) {
      setSelectedAppointment(apt)
    } else {
      setPreselectedSlot({ date, time })
      setShowBookingWizard(true)
    }
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

  const isToday = (date: Date) => {
    return new Date().toDateString() === date.toDateString()
  }

  // Calculate Settle Button Positions
  const settleButtonRows = useMemo(() => {
    const result: Record<number, number> = {}

    if (!selectedProfessionalId || !professional) return result

    weekDays.forEach((day, dayIndex) => {
      if (!isToday(day)) return

      const dayStr = day.toDateString()
      const dayAppointments = appointments.filter(
        (a) =>
          new Date(a.date).toDateString() === dayStr &&
          a.professionalId === selectedProfessionalId &&
          a.status !== "cancelled" &&
          a.status !== "follow_up"
      )


      let lastSlotIndex = 0

      // 1. Find the end of the working schedule for this day
      const dayOfWeek = day.getDay()
      const daySchedule = professional?.availability?.schedule?.find((d) => d.dayOfWeek === dayOfWeek)

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

      result[dayIndex] = lastSlotIndex + 1
    })
    return result
  }, [allTimeSlots, appointments, professional, selectedProfessionalId, weekDays])

  const isNonWorkingDay = (date: Date) => {
    if (!professional) return false

    if (
      professional.availability &&
      professional.availability.schedule &&
      professional.availability.schedule.length > 0
    ) {
      const dayOfWeek = date.getDay()
      const daySchedule = professional.availability.schedule.find((d) => d.dayOfWeek === dayOfWeek)
      if (daySchedule) {
        return !daySchedule.isActive
      }
    }

    return professional.nonWorkingDays.includes(date.getDay())
  }





  const getAppointmentDurationMinutes = (): number => {
    if (!professional) return 60 // Default to 1 hour

    // Try to get duration from service config
    const firstServiceId = professional.services?.[0]
    if (firstServiceId) {
      const service = serviceConfigs.find((s) => s.id === firstServiceId)
      if (service && service.appointmentDuration) {
        return service.appointmentDuration
      }
    }

    // Default to 60 minutes (1 hour)
    return 60
  }

  const getFirstAvailableSlotOfDay = (date: Date, slotTime: string): boolean => {
    const dateStr = date.toDateString()
    const slotMinutes = timeToMinutes(slotTime)
    const dayOfWeek = date.getDay()

    if (!professional?.availability?.schedule) return false

    const daySchedule = professional.availability.schedule.find((d) => d.dayOfWeek === dayOfWeek)
    if (!daySchedule || !daySchedule.isActive || !daySchedule.slots) return false

    // Check if any slot in this day starts at exactly this time
    return daySchedule.slots.some((slot) => timeToMinutes(slot.start) === slotMinutes)
  }

  if (!professional) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-border bg-card">
        <p className="text-muted-foreground">Seleccione un profesional para ver la agenda</p>
      </div>
    )
  }

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
              gridTemplateColumns: "50px repeat(7, 1fr)",
            }}
          >
            <div className="p-2 text-center text-xs font-medium text-muted-foreground border-r border-border">Hora</div>
            {weekDays.map((day, i) => (
              <div
                key={i}
                className={cn(
                  "p-2 text-center border-r border-border",
                  isToday(day) && "bg-primary/10",
                  isNonWorkingDay(day) && "bg-muted text-muted-foreground",
                )}
              >
                <div className="text-xs font-medium text-muted-foreground">
                  {day.toLocaleDateString("es-AR", { weekday: "short" })}
                </div>
                <div className={cn("text-sm font-semibold", isToday(day) ? "text-primary" : "text-foreground")}>
                  {day.getDate()}
                </div>
              </div>
            ))}
          </div>

          <div className="max-h-[700px] overflow-y-auto">
            <div
              className="grid"
              style={{
                gridTemplateColumns: "50px repeat(7, 1fr)",
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
                      const slotAppointments = getAppointmentsForSlot(day, slotTime)

                      const isNonWorking = isNonWorkingDay(day)
                      const now = new Date()
                      const slotDate = new Date(day)
                      const [slotHours, slotMinutes] = slotTime.split(":").map(Number)
                      slotDate.setHours(slotHours, slotMinutes, 0, 0)
                      const isPast = slotDate < now

                      // If there's an appointment, we'll only use the record from the FIRST one for the rowSpan check
                      // but we'll render ALL of them in the div
                      const firstApt = slotAppointments[0]
                      const rowSpan = firstApt ? getAppointmentRowSpan(firstApt) : 1
                      const isOccupied = isSlotOccupiedByAppointment(day, slotTime)
                      const appointmentDurationMinutes = getAppointmentDurationMinutes()
                      const isFirstAvailableSlot = slotAppointments.length === 0 && !isOccupied && getFirstAvailableSlotOfDay(day, slotTime) && isSpanFree(day, slotTime, appointmentDurationMinutes)
                      const availabilityRowSpan = Math.ceil(appointmentDurationMinutes / 15)

                      // Check cover-up for button - cover more rows to prevent overflow click-through
                      const buttonRow = settleButtonRows[dayIndex]
                      const currentRow = slotIndex + 1
                      if (buttonRow && currentRow >= buttonRow && currentRow < buttonRow + 6) {
                        return null
                      }

                      // Skip rendering this cell if it's part of an appointment's span started earlier
                      if (isOccupied && slotAppointments.length === 0) {
                        return null
                      }

                      return (
                        <div
                          key={`${dayIndex}-${slotTime}`}
                          className={cn(
                            "border-r border-b border-border p-0.5 transition-colors last:border-r-0 relative cursor-pointer",
                            isNonWorking && "bg-muted/40 cursor-not-allowed",
                            isToday(day) && "bg-primary/5",
                            !firstApt && !isWorkingHour && "bg-slate-50/30",
                            isWorkingHour && !firstApt && !isPast && !isOccupied && "hover:bg-accent",
                            isPast && !firstApt && "bg-muted/20 cursor-not-allowed",
                          )}
                          style={{
                            gridColumn: `${dayIndex + 2}`,
                            gridRow: firstApt
                              ? `${slotIndex + 1} / span ${rowSpan}`
                              : isFirstAvailableSlot
                                ? `${slotIndex + 1} / span ${availabilityRowSpan}`
                                : `${slotIndex + 1}`,
                          }}
                          onClick={() => !isNonWorking && !isPast && slotAppointments.length === 0 && handleSlotClick(day, slotTime)}
                        >
                          <div className="flex flex-col gap-0.5 h-full w-full">
                            {slotAppointments.map((apt) => {
                              const client = getClient(apt.clientId)
                              const service = getService(apt.serviceId)
                              return (
                                <div
                                  key={apt.id}
                                  className={cn(
                                    "rounded border-[1px] p-2 text-[10px] cursor-pointer overflow-hidden flex-1 shadow-sm transition-all hover:brightness-105 active:scale-[0.98] h-full flex flex-col justify-between",
                                    apt.status === "attended" || apt.status === "closed" || apt.status === "no_show"
                                      ? statusColors[apt.status]
                                      : apt.isOvertimeMode
                                        ? "border-amber-400 bg-amber-50 text-amber-900"
                                        : statusColors[apt.status],
                                    slotAppointments.length > 1 && "border-white/50 border-2"
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedAppointment(apt)
                                  }}
                                >
                                  <div className="flex flex-col">
                                    <div className="font-bold truncate text-[11px]">{client?.name}</div>
                                    <div className="truncate opacity-80 text-[10px] italic">{service?.name}</div>
                                  </div>
                                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/10">
                                    <span className="opacity-90 font-bold">{apt.startTime}</span>
                                    <div className="flex gap-1.5 items-center">
                                      {apt.status === "attended" && <CheckCircle className="h-3.5 w-3.5 text-white" />}
                                      {apt.paidAmount > 0 && <DollarSign className="h-2.5 w-2.5 text-white" />}
                                      {apt.isPaid && <Check className="h-2.5 w-2.5 text-white" />}
                                    </div>
                                  </div>
                                  {apt.paymentResolutionStatus === "pending_resolution" && (
                                    <div className="mt-1 flex items-center gap-1 px-1 bg-amber-100 text-amber-700 rounded-sm font-bold text-[8px] border border-amber-200 animate-pulse">
                                      <AlertCircle className="h-2 w-2" />
                                      <span className="truncate">
                                        Pendiente Transferencia: {formatCurrency(
                                          interProfessionalAdjustments.find(a => a.id === apt.adjustmentId)?.amount || 0
                                        )}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                            {isFirstAvailableSlot && (
                              <div className="rounded border border-emerald-200 bg-emerald-50/20 p-1 text-xs h-full flex flex-col items-center justify-center cursor-default hover:bg-emerald-50/40 transition-colors group">
                                <Plus className="h-4 w-4 text-emerald-500/50 group-hover:text-emerald-600 transition-colors" />
                                <span className="text-[9px] font-bold text-emerald-500/50 uppercase tracking-wider group-hover:text-emerald-600">Disp.</span>
                              </div>
                            )}
                          </div>
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
                  <div
                    key={`settle-${dayIndex}`}
                    className="flex justify-center p-2 mt-4 relative z-50 pointer-events-auto"
                    style={{
                      gridColumn: `${dayIndex + 2}`,
                      gridRow: `${targetRow} / span 6`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-col gap-2 w-full mt-4">
                      {!settleStatus.allowed && pendingItems.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2 space-y-2 animate-in fade-in slide-in-from-bottom-2">
                          <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider px-1">Turnos a procesar:</p>
                          <div className="space-y-1 max-h-[120px] overflow-y-auto">
                            {pendingItems.map(apt => {
                              const client = getClient(apt.clientId)
                              return (
                                <button
                                  key={apt.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedAppointment(apt);
                                  }}
                                  className="w-full text-left p-1.5 rounded bg-white hover:bg-red-100 border border-red-100 transition-colors flex items-center justify-between"
                                >
                                  <div>
                                    <div className="font-semibold text-[10px]">{client?.name}</div>
                                    <div className="text-[9px] text-muted-foreground">{apt.startTime} hs • {statusLabels[apt.status] || apt.status}</div>
                                  </div>
                                  <ChevronRight className="h-3 w-3 text-red-400" />
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {existingSettlementToday ? (
                        <div className="space-y-2">
                          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                            <CheckCircle className="mx-auto h-6 w-6 text-emerald-600 mb-1" />
                            <p className="text-[10px] font-bold text-emerald-800 uppercase">Día Liquidado</p>
                            <p className="text-[9px] text-emerald-700 italic">ID: {existingSettlementToday.displayId}</p>
                          </div>
                          <Button
                            size="sm"
                            variant={showConfirmDelete === existingSettlementToday.id ? "destructive" : "outline"}
                            className={cn(
                              "w-full text-xs transition-all active:scale-95 shadow-md",
                              showConfirmDelete === existingSettlementToday.id ? "bg-red-600 hover:bg-red-700 text-white animate-pulse" : "border-red-200 text-red-600 hover:bg-red-50"
                            )}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (showConfirmDelete === existingSettlementToday.id) {
                                console.log("Executing deleteSettlement for:", existingSettlementToday.id);
                                deleteSettlement(existingSettlementToday.id);
                                setShowConfirmDelete(null);
                                toast({
                                  title: "Liquidación Eliminada",
                                  description: "Se ha liberado el día. Ahora puedes realizar cambios y volver a liquidar.",
                                });
                              } else {
                                setShowConfirmDelete(existingSettlementToday.id);
                                // Reset after 4 seconds of inactivity
                                setTimeout(() => setShowConfirmDelete(null), 4000);
                              }
                            }}
                          >
                            {showConfirmDelete === existingSettlementToday.id ? (
                              <div className="flex items-center gap-2">
                                <Check className="h-4 w-4" />
                                <span>¡CLICK PARA BORRAR!</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Ban className="h-3 w-3" />
                                <span>Eliminar para Actualizar</span>
                              </div>
                            )}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className={cn(
                            "shadow-sm transition-all w-full py-6",
                            settleStatus.allowed
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                              : "bg-muted text-muted-foreground opacity-60"
                          )}
                          // We don't disable it so that the click can trigger the feedback toast
                          onClick={handleSettleDay}
                        >
                          <div className="flex flex-col items-center">
                            <div className="flex items-center">
                              <CheckCircle className="mr-2 h-4 w-4" />
                              <span className="font-bold">Liquidar Día</span>
                            </div>
                            <span className="text-[9px] opacity-70 mt-0.5">Cerrar caja y generar PDF</span>
                          </div>
                        </Button>
                      )}
                    </div>
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
        preselectedProfessionalId={selectedProfessionalId || undefined}
        preselectedSlot={preselectedSlot}
        isOvertimeMode={isOvertimeMode}
      />

      {weekDays.some((d) => isToday(d)) && selectedProfessionalId && !settleStatus.allowed && (
        // Optional: keep a toast or indicator if needed, or nothing. 
        // Since we moved the button into the grid, we can remove the fixed one.
        null
      )}
    </div>
  )
}
