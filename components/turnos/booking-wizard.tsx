"use client"

import { useState, useMemo, useEffect } from "react"
import { useData } from "@/lib/data-context"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn, formatCurrency, generateTimeSlots } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  UserPlus,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Copy,
  MessageCircle,
  X,
  Check,
  Clock,
  CreditCard,
  Banknote,
  User,
  Package,
  Wallet,
  AlertTriangle,
} from "lucide-react"
import type { Client, ServicePack, Appointment, AppointmentPayment } from "@/lib/types"

interface BookingWizardProps {
  isOpen: boolean
  onClose: () => void
  preselectedProfessionalId?: string
  preselectedSlot?: { date: Date; time: string } | null
  isOvertimeMode?: boolean
}

type BookingType = "single" | "pack"
type Step = 1 | 2 | 3 | 4

interface SelectedSlot {
  date: Date
  time: string
}

export function BookingWizard({
  isOpen,
  onClose,
  preselectedProfessionalId,
  preselectedSlot,
  isOvertimeMode = false,
}: BookingWizardProps) {
  const { user } = useAuth()
  const { clients, professionals, serviceConfigs, servicePacks, appointments, addClient, addAppointment, covenants } = useData()

  // Wizard state
  const [step, setStep] = useState<Step>(1)

  // Step 1 state
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showNewClientForm, setShowNewClientForm] = useState(false)
  const [newClientData, setNewClientData] = useState({
    name: "",
    dni: "",
    email: "",
    phone: "",
    notes: "",
  })
  const [bookingType, setBookingType] = useState<BookingType>("single")
  const [selectedPack, setSelectedPack] = useState<ServicePack | null>(null)

  // Step 2 state - Initialize with preselected slot if available
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([])
  const [calendarDate, setCalendarDate] = useState(preselectedSlot?.date || new Date())
  const [validityError, setValidityError] = useState<string | null>(null)
  const [manualTimeInput, setManualTimeInput] = useState("")
  const [manualTimeError, setManualTimeError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && preselectedSlot) {
      setSelectedSlots([{ date: preselectedSlot.date, time: preselectedSlot.time }])
      setCalendarDate(preselectedSlot.date)
      // Optionally, move to step 2 if preselectedSlot is provided
      // setStep(2)
    }
  }, [isOpen, preselectedSlot])

  // Step 3 state
  const [paymentOption, setPaymentOption] = useState<"reserve" | "deposit" | "full">("reserve")
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">("cash")
  const [depositAmount, setDepositAmount] = useState(0)

  // Step 4 state
  const [whatsappSent, setWhatsappSent] = useState(false)

  // Get professional
  const professional = (professionals || []).find((p) => p.id === preselectedProfessionalId)

  // Get service for professional
  const service = useMemo(() => {
    if (!professional) return null
    return (serviceConfigs || []).find((s) => s.name === professional.specialty)
  }, [professional, serviceConfigs])

  // Get packs for service
  const availablePacks = useMemo(() => {
    if (!service) return []
    return (servicePacks || []).filter((p) => p.serviceId === service.id && p.isActive)
  }, [service, servicePacks])

  // Filter clients by search
  const filteredClients = useMemo(() => {
    if (!searchTerm) return []
    const term = searchTerm.toLowerCase()
    return (clients || [])
      .filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.dni?.toLowerCase().includes(term) ||
          c.phone?.toLowerCase().includes(term) ||
          c.email?.toLowerCase().includes(term),
      )
      .slice(0, 5)
  }, [searchTerm, clients])

  // Calculate pricing
  const pricing = useMemo(() => {
    if (!service) return { basePrice: 0, discount: 0, discountPercent: 0, finalPrice: 0, depositSuggested: 0, sessionsCount: 1 }

    let basePrice = 0
    let sessionsCount = 1

    if (bookingType === "pack" && selectedPack) {
      basePrice = selectedPack.totalPrice
      sessionsCount = selectedPack.sessionsCount
    } else {
      basePrice = service.basePrice
    }

    // Calcular descuento. Si hay convenio, tiene prioridad o se suma? 
    // Usuario pide: "al agregar la etiqueta de convenio, agregar el desciento que tiene ese convenio"
    const clientCovenant = covenants?.find(c => c.id === selectedClient?.covenantId)
    const covenantDiscount = clientCovenant?.isActive ? clientCovenant.discountPercentage : 0

    // El "specialDiscount" es lo que ya tenia el cliente. 
    // Sumamos los descuentos o usamos el mayor? Usualmente se usa el mayor o el convenio manda.
    // Usaremos el mayor para beneficio del paciente.
    const discountPercent = Math.max(selectedClient?.specialDiscount || 0, covenantDiscount)

    const discountAmount = basePrice * (discountPercent / 100)
    const finalPrice = basePrice - discountAmount

    let depositSuggested = 0
    if (bookingType === "pack" && selectedPack) {
      // Packs suggest 50% deposit by default
      depositSuggested = selectedPack.totalPrice * 0.5
    } else if (service.requiresDeposit) {
      depositSuggested = finalPrice * (service.recommendedDepositPercentage / 100)
    }

    return { basePrice, discount: discountAmount, discountPercent, finalPrice, depositSuggested, sessionsCount }
  }, [service, bookingType, selectedPack, selectedClient, covenants])

  const isDateWithinPackValidity = (date: Date): boolean => {
    if (bookingType !== "pack" || !selectedPack) return true

    // Pack validity starts from today (purchase date)
    const purchaseDate = new Date()
    purchaseDate.setHours(0, 0, 0, 0)

    const expirationDate = new Date(purchaseDate)
    expirationDate.setDate(expirationDate.getDate() + selectedPack.validityDays)

    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)

    return checkDate <= expirationDate
  }

  const getPackExpirationDate = (): Date | null => {
    if (!selectedPack) return null
    const purchaseDate = new Date()
    const expirationDate = new Date(purchaseDate)
    expirationDate.setDate(expirationDate.getDate() + selectedPack.validityDays)
    return expirationDate
  }

  // Get available time slots for a day
  const getAvailableSlotsForDay = (date: Date) => {
    if (!professional) return []

    const dayOfWeek = date.getDay()
    if (!isOvertimeMode && professional.nonWorkingDays.includes(dayOfWeek)) return []

    const allSlots = isOvertimeMode
      ? generateTimeSlots("00:00", "23:45", professional.standardDuration || 60)
      : generateTimeSlots(
        professional.workingHours.start,
        professional.workingHours.end,
        professional.standardDuration || 60,
      )

    const bookedSlots = (appointments || [])
      .filter(
        (a) =>
          a.professionalId === professional.id &&
          new Date(a.date).toDateString() === date.toDateString() &&
          a.status !== "cancelled",
      )
      .map((a) => a.startTime)

    const selectedTimes = selectedSlots.filter((s) => s.date.toDateString() === date.toDateString()).map((s) => s.time)

    return allSlots.filter((slot) => !bookedSlots.includes(slot) && !selectedTimes.includes(slot))
  }

  // Calendar navigation
  const calendarDays = useMemo(() => {
    const days: Date[] = []
    const start = new Date(calendarDate)
    start.setDate(start.getDate() - start.getDay() + 1)

    for (let i = 0; i < 7; i++) {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      days.push(day)
    }
    return days
  }, [calendarDate])

  // Handle slot selection
  const handleSlotClick = (date: Date, time: string) => {
    if (bookingType === "pack" && selectedPack) {
      if (!isDateWithinPackValidity(date)) {
        const expDate = getPackExpirationDate()
        setValidityError(
          `No se puede agendar este turno. El pack "${selectedPack.name}" tiene una vigencia de ${selectedPack.validityDays} días y vence el ${expDate?.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}. Por favor selects una fecha dentro de la vigencia del pack.`,
        )
        return
      }
    }

    // Clear any previous validity error
    setValidityError(null)

    const existing = selectedSlots.find((s) => s.date.toDateString() === date.toDateString() && s.time === time)

    const maxSlots = bookingType === "pack" && selectedPack ? selectedPack.sessionsCount : 1

    if (existing) {
      setSelectedSlots((prev) => prev.filter((s) => s !== existing))
    } else if (selectedSlots.length < maxSlots) {
      setSelectedSlots((prev) => [...prev, { date, time }])
    }
  }

  const handleManualTimeSubmit = (date: Date) => {
    if (!manualTimeInput.trim()) {
      setManualTimeError("Ingresa un horario válido")
      return
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(manualTimeInput)) {
      setManualTimeError("Formato inválido. Usa HH:MM (ej: 14:30)")
      return
    }

    if (!isOvertimeMode) {
      const allSlots = generateTimeSlots("00:00", "23:45", professional?.standardDuration || 60)
      if (!allSlots.includes(manualTimeInput)) {
        setManualTimeError(`El horario ${manualTimeInput} no coincide con los intervalos de duración`)
        return
      }
    }

    const bookedSlots = (appointments || [])
      .filter(
        (a) =>
          a.professionalId === professional?.id &&
          new Date(a.date).toDateString() === date.toDateString() &&
          a.status !== "cancelled",
      )
      .map((a) => a.startTime)

    if (bookedSlots.includes(manualTimeInput)) {
      setManualTimeError("Este horario ya está reservado")
      return
    }

    const alreadySelected = selectedSlots.some(
      (s) => s.date.toDateString() === date.toDateString() && s.time === manualTimeInput,
    )

    if (alreadySelected) {
      setManualTimeError("Este horario ya está seleccionado")
      return
    }

    // Add the manual time slot
    setSelectedSlots((prev) => [...prev, { date, time: manualTimeInput }])
    setManualTimeInput("")
    setManualTimeError(null)
  }

  // Create new client
  const handleCreateClient = () => {
    if (!newClientData.name || !newClientData.phone) return

    const newClient: Client = {
      id: `client-${Date.now()}`,
      ...newClientData,
      balance: 0,
      specialDiscount: 0,
      createdAt: new Date(),
    }

    addClient(newClient)
    setSelectedClient(newClient)
    setShowNewClientForm(false)
    setNewClientData({ name: "", dni: "", email: "", phone: "", notes: "" })
  }

  // Handle booking confirmation
  const handleConfirmBooking = () => {
    if (!selectedClient || !professional || !service || selectedSlots.length === 0) return

    const sortedSlots = [...selectedSlots].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.time.localeCompare(b.time),
    )

    const pricePerSession = pricing.finalPrice / pricing.sessionsCount
    const depositPerSession = depositAmount / selectedSlots.length

    sortedSlots.forEach((slot, index) => {
      const endTime = calculateEndTime(slot.time, professional.standardDuration || 60)

      const payment: AppointmentPayment | undefined =
        paymentOption !== "reserve" && index === 0
          ? {
            id: `pay-${Date.now()}-${index}`,
            amount: paymentOption === "full" ? pricing.finalPrice : depositAmount,
            paymentMethod,
            receivedByProfessionalId: professional.id,
            isDeposit: paymentOption === "deposit",
            createdAt: new Date(),
            notes: paymentOption === "deposit" ? "Seña inicial" : "Pago completo",
          }
          : undefined

      const paidAmount = payment ? payment.amount / selectedSlots.length : 0

      const appointment: Omit<Appointment, "id" | "createdAt"> = {
        professionalId: professional.id,
        clientId: selectedClient.id,
        serviceId: service.id,
        date: slot.date,
        startTime: slot.time,
        endTime,
        basePrice: service.basePrice,
        discountPercent: pricing.discountPercent,
        covenantId: selectedClient.covenantId,
        finalPrice: pricePerSession,
        professionalPercentage: professional.commissionRate,
        professionalEarnings: service.basePrice * (professional.commissionRate / 100),
        recommendedDeposit: pricing.depositSuggested / pricing.sessionsCount,
        depositAmount: depositPerSession,
        isDepositComplete: depositPerSession >= pricing.depositSuggested / pricing.sessionsCount,
        paidAmount,
        payments: payment ? [payment] : [],
        status: paymentOption === "reserve" ? "pending_deposit" : "confirmed",
        isPaid: paymentOption === "full",
        cashCollected: payment?.paymentMethod === "cash" ? paidAmount : 0,
        transferCollected: payment?.paymentMethod === "transfer" ? paidAmount : 0,
        cashInTense: payment?.paymentMethod === "cash" ? paidAmount : 0,
        transfersToProfessional: payment?.paymentMethod === "transfer" ? paidAmount : 0,
        notes: bookingType === "pack" ? `Pack: ${selectedPack?.name}` : "",
        comments: [],
        isOvertimeMode,
      }

      addAppointment(appointment)
    })

    setStep(4)
  }

  // Calculate end time
  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    const [hours, minutes] = startTime.split(":").map(Number)
    const totalMinutes = hours * 60 + minutes + durationMinutes
    const endHours = Math.floor(totalMinutes / 60)
    const endMinutes = totalMinutes % 60
    return `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`
  }

  // Generate WhatsApp message
  const whatsappMessage = useMemo(() => {
    if (!selectedClient || !professional || !service) return ""

    const sortedSlots = [...selectedSlots].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const slotsText = sortedSlots
      .map((slot) => {
        const dateStr = slot.date.toLocaleDateString("es-AR", {
          weekday: "long",
          day: "numeric",
          month: "numeric",
        })
        return `• ${dateStr} - ${slot.time} hs`
      })
      .join("\n")

    const paidAmount = paymentOption === "full" ? pricing.finalPrice : paymentOption === "deposit" ? depositAmount : 0
    const pendingAmount = pricing.finalPrice - paidAmount

    return `Hola ${selectedClient.name.split(" ")[0]} 👋

Te confirmamos tus turnos en *TENSE* con el profesional *${professional.name}*

📍 *Servicio:* ${service.name}
${bookingType === "pack" && selectedPack ? `🎫 *Modalidad:* ${selectedPack.name}\n` : ""}
🗓️ *Turnos agendados:*
${slotsText}

💰 *Total:* ${formatCurrency(pricing.finalPrice)}
${paidAmount > 0 ? `✅ *Abonado:* ${formatCurrency(paidAmount)}\n` : ""}${pendingAmount > 0 ? `🔷 *Saldo pendiente:* ${formatCurrency(pendingAmount)}\n` : ""}
📍 Av. Hipólito Yrigoyen 3930, Lanús
📞 11 2750 7251

¡Gracias por elegir TENSE!`
  }, [
    selectedClient,
    professional,
    service,
    selectedSlots,
    bookingType,
    selectedPack,
    pricing,
    paymentOption,
    depositAmount,
  ])

  // Open WhatsApp
  const openWhatsApp = () => {
    if (!selectedClient?.phone) return
    const phone = selectedClient.phone.replace(/\D/g, "")
    const phoneWithCountry = phone.startsWith("54") ? phone : `54${phone}`
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(whatsappMessage)}`
    window.open(url, "_blank")
    setWhatsappSent(true)
  }

  // Copy message
  const copyMessage = () => {
    navigator.clipboard.writeText(whatsappMessage)
  }

  // Reset wizard
  const resetWizard = () => {
    setStep(1)
    setSearchTerm("")
    setSelectedClient(null)
    setShowNewClientForm(false)
    setNewClientData({ name: "", dni: "", email: "", phone: "", notes: "" })
    setBookingType("single")
    setSelectedPack(null)
    setSelectedSlots([])
    setPaymentOption("reserve")
    setPaymentMethod("cash")
    setDepositAmount(0)
    setWhatsappSent(false)
    setValidityError(null) // Reset validity error
    setManualTimeInput("") // Reset manual time input
    setManualTimeError(null) // Reset manual time error
  }

  // Handle close
  const handleClose = () => {
    resetWizard()
    onClose()
  }

  if (!isOpen) return null

  if (!professional) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <div className="bg-background rounded-lg p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Error</h3>
          <p className="text-muted-foreground mb-6">Debe seleccionar un profesional primero.</p>
          <Button onClick={handleClose}>Cerrar</Button>
        </div>
      </div>
    )
  }

  const stepIcons = {
    1: User,
    2: Calendar,
    3: Wallet,
    4: CheckCircle2,
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <div className="fixed inset-3 bg-background rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-8 py-5 border-b bg-gradient-to-r from-primary/5 to-primary/10 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h2 className="text-2xl font-bold">Agendar Turno</h2>
              <Badge variant="outline" className="text-base px-4 py-1">
                {professional.name} • {service?.name || professional.specialty}
              </Badge>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-1">
              {[
                { num: 1, label: "Cliente" },
                { num: 2, label: "Horarios" },
                { num: 3, label: "Pago" },
                { num: 4, label: "Listo" },
              ].map((s, i) => {
                const Icon = stepIcons[s.num as keyof typeof stepIcons]
                return (
                  <div key={s.num} className="flex items-center">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                          step > s.num
                            ? "bg-green-500 text-white"
                            : step === s.num
                              ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        {step > s.num ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium",
                          step >= s.num ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {s.label}
                      </span>
                    </div>
                    {i < 3 && (
                      <div
                        className={cn(
                          "w-12 h-1 mx-2 mb-5 rounded-full transition-colors",
                          step > s.num ? "bg-green-500" : "bg-muted",
                        )}
                      />
                    )}
                  </div>
                )
              })}
            </div>

            <Button variant="ghost" size="icon" onClick={handleClose} className="h-10 w-10">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* STEP 1: Client + Service/Pack Selection */}
          {step === 1 && (
            <div className="grid grid-cols-12 gap-8 h-full">
              {/* Left: Client Selection - 4 columns */}
              <div className="col-span-4">
                <Card className="h-full">
                  <CardContent className="p-6 space-y-5">
                    <div className="flex items-center gap-3 pb-4 border-b">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Seleccionar Cliente</h3>
                        <p className="text-sm text-muted-foreground">Busca o crea uno nuevo</p>
                      </div>
                    </div>

                    {!showNewClientForm ? (
                      <>
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            placeholder="Buscar por nombre, DNI, teléfono..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 h-14 text-base"
                          />
                        </div>

                        {filteredClients.length > 0 && !selectedClient && (
                          <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                            {filteredClients.map((client) => (
                              <button
                                key={client.id}
                                onClick={() => {
                                  setSelectedClient(client)
                                  setSearchTerm("")
                                }}
                                className="w-full p-4 text-left hover:bg-accent transition-colors"
                              >
                                <div className="font-medium text-base">{client.name}</div>
                                <div className="text-sm text-muted-foreground flex gap-3 mt-1">
                                  <span>{client.phone}</span>
                                  {client.specialDiscount > 0 && (
                                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                      -{client.specialDiscount}%
                                    </Badge>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {selectedClient && (
                          <div className="p-5 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                                <div>
                                  <div className="font-semibold text-lg text-green-800">{selectedClient.name}</div>
                                  <div className="text-sm text-green-600">{selectedClient.phone}</div>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedClient(null)}>
                                <X className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>
                        )}

                        <Button
                          variant="outline"
                          className="w-full h-14 text-base bg-transparent"
                          onClick={() => setShowNewClientForm(true)}
                        >
                          <UserPlus className="mr-3 h-5 w-5" />
                          Crear Nuevo Cliente
                        </Button>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm">Nombre *</Label>
                            <Input
                              value={newClientData.name}
                              onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                              className="h-12 mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">DNI</Label>
                            <Input
                              value={newClientData.dni}
                              onChange={(e) => setNewClientData({ ...newClientData, dni: e.target.value })}
                              className="h-12 mt-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm">Teléfono *</Label>
                          <Input
                            value={newClientData.phone}
                            onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                            className="h-12 mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Email</Label>
                          <Input
                            value={newClientData.email}
                            onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                            className="h-12 mt-1"
                          />
                        </div>
                        <div className="flex gap-3 pt-2">
                          <Button
                            variant="outline"
                            className="flex-1 h-12 bg-transparent"
                            onClick={() => setShowNewClientForm(false)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            className="flex-1 h-12"
                            onClick={handleCreateClient}
                            disabled={!newClientData.name || !newClientData.phone}
                          >
                            Crear Cliente
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Center: Booking Type - 5 columns */}
              <div className="col-span-5">
                <Card className="h-full">
                  <CardContent className="p-6 space-y-5">
                    <div className="flex items-center gap-3 pb-4 border-b">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Tipo de Reserva</h3>
                        <p className="text-sm text-muted-foreground">Sesión individual o pack</p>
                      </div>
                    </div>

                    <RadioGroup
                      value={bookingType}
                      onValueChange={(v) => {
                        setBookingType(v as BookingType)
                        setSelectedPack(null)
                        setSelectedSlots([])
                        setValidityError(null) // Reset validity error on booking type change
                      }}
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <Label
                          htmlFor="single"
                          className={cn(
                            "flex flex-col items-center gap-3 p-6 border-2 rounded-xl cursor-pointer transition-all",
                            bookingType === "single" ? "border-primary bg-primary/5" : "hover:bg-accent",
                          )}
                        >
                          <RadioGroupItem value="single" id="single" className="sr-only" />
                          <User className="h-10 w-10 text-primary" />
                          <div className="text-center">
                            <div className="font-semibold text-lg">Sesión Individual</div>
                            <div className="text-sm text-muted-foreground mt-1">Una sola sesión</div>
                          </div>
                          {bookingType === "single" && <Check className="h-6 w-6 text-primary" />}
                        </Label>

                        <Label
                          htmlFor="pack"
                          className={cn(
                            "flex flex-col items-center gap-3 p-6 border-2 rounded-xl cursor-pointer transition-all",
                            bookingType === "pack" ? "border-primary bg-primary/5" : "hover:bg-accent",
                          )}
                        >
                          <RadioGroupItem value="pack" id="pack" className="sr-only" />
                          <Package className="h-10 w-10 text-primary" />
                          <div className="text-center">
                            <div className="font-semibold text-lg">Pack de Sesiones</div>
                            <div className="text-sm text-muted-foreground mt-1">Múltiples sesiones con descuento</div>
                          </div>
                          {bookingType === "pack" && <Check className="h-6 w-6 text-primary" />}
                        </Label>
                      </div>
                    </RadioGroup>

                    {bookingType === "pack" && (
                      <div className="space-y-3 pt-2">
                        <Label className="text-base font-medium">Seleccionar Pack</Label>
                        {availablePacks.length === 0 ? (
                          <p className="text-muted-foreground p-4 bg-muted rounded-lg text-center">
                            No hay packs disponibles para este servicio.
                          </p>
                        ) : (
                          <div className="grid gap-3">
                            {availablePacks.map((pack) => (
                              <Card
                                key={pack.id}
                                className={cn(
                                  "cursor-pointer transition-all",
                                  selectedPack?.id === pack.id ? "ring-2 ring-primary bg-primary/5" : "hover:bg-accent",
                                )}
                                onClick={() => {
                                  setSelectedPack(pack)
                                  setSelectedSlots([])
                                  setValidityError(null) // Reset validity error when changing pack
                                }}
                              >
                                <CardContent className="p-4 flex items-center justify-between">
                                  <div>
                                    <div className="font-semibold text-base">{pack.name}</div>
                                    <div className="text-sm text-muted-foreground">{pack.sessionsCount} sesiones</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-lg text-primary">{formatCurrency(pack.totalPrice)}</div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right: Summary - 3 columns */}
              <div className="col-span-3">
                <Card className="h-full bg-slate-50">
                  <CardContent className="p-6 space-y-5">
                    <div className="flex items-center gap-3 pb-4 border-b">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Resumen</h3>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Profesional</span>
                        <span className="font-medium">{professional.name}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Servicio</span>
                        <span className="font-medium">{service?.name}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Cliente</span>
                        <span className="font-medium">{selectedClient?.name || "—"}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Modalidad</span>
                        <span className="font-medium">
                          {bookingType === "pack" && selectedPack ? selectedPack.name : "Sesión individual"}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Precio base</span>
                        <span className="font-medium">{formatCurrency(pricing.basePrice)}</span>
                      </div>
                      {pricing.discount > 0 && (
                        <div className="flex justify-between py-2 border-b text-green-600">
                          <span>Descuento ({pricing.discountPercent}%)</span>
                          <span>-{formatCurrency(pricing.discount)}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total</span>
                        <span className="text-2xl font-bold text-primary">{formatCurrency(pricing.finalPrice)}</span>
                      </div>
                      {pricing.depositSuggested > 0 && (
                        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                          <span>Seña sugerida:</span>
                          <span>{formatCurrency(pricing.depositSuggested)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* STEP 2: Calendar Selection */}
          {step === 2 && (
            <div className="grid grid-cols-12 gap-8 h-full">
              {validityError && (
                <Alert variant="destructive" className="col-span-12 mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Fecha fuera de vigencia</AlertTitle>
                  <AlertDescription>{validityError}</AlertDescription>
                </Alert>
              )}

              {/* Week Calendar */}
              <Card className="col-span-9">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Seleccionar Horarios</h3>
                        <p className="text-sm text-muted-foreground">
                          {bookingType === "pack" && selectedPack
                            ? `Selecciona ${selectedPack.sessionsCount} horarios para tu pack`
                            : "Selecciona un horario disponible"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const newDate = new Date(calendarDate)
                          newDate.setDate(newDate.getDate() - 7)
                          setCalendarDate(newDate)
                        }}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <span className="font-medium text-lg min-w-[200px] text-center">
                        {calendarDays[0].toLocaleDateString("es-AR", { day: "numeric", month: "short" })} -{" "}
                        {calendarDays[6].toLocaleDateString("es-AR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const newDate = new Date(calendarDate)
                          newDate.setDate(newDate.getDate() + 7)
                          setCalendarDate(newDate)
                        }}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-3">
                    {calendarDays.map((day) => {
                      const slots = getAvailableSlotsForDay(day)
                      const isNonWorking = professional.nonWorkingDays.includes(day.getDay())
                      const isPast = day < new Date(new Date().setHours(0, 0, 0, 0))

                      return (
                        <div key={day.toISOString()} className="text-center">
                          <div
                            className={cn(
                              "p-3 rounded-lg mb-2 font-medium",
                              day.toDateString() === new Date().toDateString()
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted",
                            )}
                          >
                            <div className="text-xs uppercase">
                              {day.toLocaleDateString("es-AR", { weekday: "short" })}
                            </div>
                            <div className="text-xl">{day.getDate()}</div>
                          </div>
                          <div className="space-y-1 max-h-[400px] overflow-y-auto">
                            {isPast || isNonWorking ? (
                              <div className="text-xs text-muted-foreground py-4">
                                {isPast ? "Pasado" : "No laboral"}
                              </div>
                            ) : slots.length === 0 ? (
                              <div className="text-xs text-muted-foreground py-4">Sin horarios</div>
                            ) : (
                              <>
                                {isOvertimeMode && day.toDateString() === calendarDate.toDateString() && (
                                  <div className="p-2 border-2 border-dashed border-primary/20 rounded-lg mb-4 bg-primary/5 flex flex-col gap-2">
                                    <div className="text-xs font-medium text-primary text-center">Horario:</div>
                                    <div className="grid grid-cols-2 gap-1 items-center">
                                      <Select
                                        value={manualTimeInput.split(":")[0] || ""}
                                        onValueChange={(val) => {
                                          const minute = manualTimeInput.split(":")[1] || "00"
                                          setManualTimeInput(`${val}:${minute}`)
                                          setManualTimeError(null)
                                        }}
                                      >
                                        <SelectTrigger className="h-8 p-1 text-xs justify-center">
                                          <SelectValue placeholder="HH" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {Array.from({ length: 24 }).map((_, i) => {
                                            const h = i.toString().padStart(2, "0")
                                            return (
                                              <SelectItem key={h} value={h} className="text-xs">
                                                {h}
                                              </SelectItem>
                                            )
                                          })}
                                        </SelectContent>
                                      </Select>

                                      <Select
                                        value={manualTimeInput.split(":")[1] || ""}
                                        onValueChange={(val) => {
                                          const hour = manualTimeInput.split(":")[0] || "12"
                                          setManualTimeInput(`${hour}:${val}`)
                                          setManualTimeError(null)
                                        }}
                                      >
                                        <SelectTrigger className="h-8 p-1 text-xs justify-center">
                                          <SelectValue placeholder="MM" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[15rem]">
                                          {Array.from({ length: 60 }).map((_, i) => {
                                            const m = i.toString().padStart(2, "0")
                                            return (
                                              <SelectItem key={m} value={m} className="text-xs">
                                                {m}
                                              </SelectItem>
                                            )
                                          })}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <Button size="sm" onClick={() => handleManualTimeSubmit(day)} className="h-7 w-full text-xs">
                                      <Check className="h-3 w-3 mr-1" /> Confirmar
                                    </Button>
                                    {manualTimeError && <p className="text-[10px] text-red-600 font-medium text-center leading-tight">{manualTimeError}</p>}
                                  </div>
                                )}
                                {slots.map((time) => {
                                  const isSelected = selectedSlots.some(
                                    (s) => s.date.toDateString() === day.toDateString() && s.time === time,
                                  )
                                  return (
                                    <button
                                      key={time}
                                      onClick={() => handleSlotClick(day, time)}
                                      className={cn(
                                        "w-full py-2 px-1 text-sm rounded transition-all",
                                        isSelected
                                          ? "bg-primary text-primary-foreground font-medium"
                                          : "bg-green-100 text-green-700 hover:bg-green-200",
                                      )}
                                    >
                                      {time}
                                    </button>
                                  )
                                })}
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Selected Slots - 3 columns */}
              <div className="col-span-3">
                {bookingType === "pack" && selectedPack && (
                  <div className="col-span-12 mb-2">
                    <Alert className="bg-amber-50 border-amber-200">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800">
                        <strong>Vigencia del pack:</strong> {selectedPack.validityDays} días desde la compra.
                        {getPackExpirationDate() && (
                          <span>
                            {" "}
                            Vence el{" "}
                            <strong>
                              {getPackExpirationDate()?.toLocaleDateString("es-AR", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              })}
                            </strong>
                          </span>
                        )}
                        {selectedPack.maxReschedules !== undefined && (
                          <span className="ml-2">
                            | <strong>Reprogramaciones:</strong> {selectedPack.maxReschedules} por sesión
                          </span>
                        )}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                <Card className="h-full bg-slate-50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 pb-4 border-b mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Clock className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Horarios Seleccionados</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedSlots.length} / {pricing.sessionsCount}
                        </p>
                      </div>
                    </div>

                    {selectedSlots.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Haz clic en los horarios disponibles para seleccionar</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {[...selectedSlots]
                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                          .map((slot, index) => (
                            <div
                              key={`${slot.date.toISOString()}-${slot.time}`}
                              className="flex items-center justify-between p-3 bg-white rounded-lg border"
                            >
                              <div>
                                <div className="font-medium">
                                  {slot.date.toLocaleDateString("es-AR", {
                                    weekday: "short",
                                    day: "numeric",
                                    month: "short",
                                  })}
                                </div>
                                <div className="text-sm text-muted-foreground">{slot.time} hs</div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setSelectedSlots((prev) => prev.filter((_, i) => i !== index))}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* STEP 3: Payment */}
          {step === 3 && (
            <div className="max-w-3xl mx-auto">
              <Card>
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 pb-6 border-b mb-6">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <Wallet className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Opciones de Pago</h3>
                      <p className="text-muted-foreground">Selecciona cómo desea pagar el cliente</p>
                    </div>
                  </div>

                  <RadioGroup
                    value={paymentOption}
                    onValueChange={(v) => setPaymentOption(v as any)}
                    className="space-y-4"
                  >
                    <Label
                      htmlFor="reserve"
                      className={cn(
                        "flex items-center gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all",
                        paymentOption === "reserve" ? "border-primary bg-primary/5" : "hover:bg-accent",
                      )}
                    >
                      <RadioGroupItem value="reserve" id="reserve" />
                      <div className="flex-1">
                        <div className="font-semibold text-lg">Solo Reservar</div>
                        <div className="text-sm text-muted-foreground">Sin pago ahora, queda pendiente</div>
                      </div>
                    </Label>

                    <Label
                      htmlFor="deposit"
                      className={cn(
                        "flex items-center gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all",
                        paymentOption === "deposit" ? "border-primary bg-primary/5" : "hover:bg-accent",
                      )}
                    >
                      <RadioGroupItem value="deposit" id="deposit" />
                      <div className="flex-1">
                        <div className="font-semibold text-lg">Registrar Seña</div>
                        <div className="text-sm text-muted-foreground">
                          Sugerido: {formatCurrency(pricing.depositSuggested)}
                        </div>
                      </div>
                    </Label>

                    <Label
                      htmlFor="full"
                      className={cn(
                        "flex items-center gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all",
                        paymentOption === "full" ? "border-primary bg-primary/5" : "hover:bg-accent",
                      )}
                    >
                      <RadioGroupItem value="full" id="full" />
                      <div className="flex-1">
                        <div className="font-semibold text-lg">Pago Total</div>
                        <div className="text-sm text-muted-foreground">{formatCurrency(pricing.finalPrice)}</div>
                      </div>
                    </Label>
                  </RadioGroup>

                  {paymentOption === "deposit" && (
                    <div className="mt-6 p-4 bg-muted rounded-lg">
                      <Label className="text-sm font-medium">Monto de la seña</Label>
                      <Input
                        type="number"
                        value={depositAmount || ""}
                        onChange={(e) => setDepositAmount(Number(e.target.value))}
                        placeholder={`Sugerido: ${pricing.depositSuggested}`}
                        className="mt-2 h-12 text-lg"
                      />
                    </div>
                  )}

                  {paymentOption !== "reserve" && (
                    <div className="mt-6">
                      <Label className="text-base font-medium mb-3 block">Medio de Pago</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          type="button"
                          variant={paymentMethod === "cash" ? "default" : "outline"}
                          className="h-14 text-base"
                          onClick={() => setPaymentMethod("cash")}
                        >
                          <Banknote className="mr-3 h-5 w-5" />
                          Efectivo
                        </Button>
                        <Button
                          type="button"
                          variant={paymentMethod === "transfer" ? "default" : "outline"}
                          className="h-14 text-base"
                          onClick={() => setPaymentMethod("transfer")}
                        >
                          <CreditCard className="mr-3 h-5 w-5" />
                          Transferencia
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="mt-8 p-5 bg-slate-50 rounded-xl">
                    <h4 className="font-semibold mb-4">Resumen de la Reserva</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cliente:</span>
                        <span className="font-medium">{selectedClient?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Turnos:</span>
                        <span className="font-medium">{selectedSlots.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-medium">{formatCurrency(pricing.finalPrice)}</span>
                      </div>
                      {paymentOption !== "reserve" && (
                        <div className="flex justify-between text-green-600">
                          <span>A pagar ahora:</span>
                          <span className="font-medium">
                            {formatCurrency(paymentOption === "full" ? pricing.finalPrice : depositAmount)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* STEP 4: WhatsApp Confirmation */}
          {step === 4 && (
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold mb-3">¡Turno Agendado!</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Se ha registrado correctamente la reserva para {selectedClient?.name}
              </p>

              <Card className="text-left mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                    Mensaje de WhatsApp
                  </h3>
                  <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg font-sans">{whatsappMessage}</pre>
                </CardContent>
              </Card>

              <div className="flex gap-4 justify-center">
                <Button variant="outline" size="lg" className="h-14 px-8 bg-transparent" onClick={copyMessage}>
                  <Copy className="mr-2 h-5 w-5" />
                  Copiar Mensaje
                </Button>
                <Button size="lg" className="h-14 px-8 bg-green-600 hover:bg-green-700" onClick={openWhatsApp}>
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Enviar por WhatsApp
                </Button>
              </div>

              {whatsappSent && <p className="text-green-600 mt-4">WhatsApp abierto en nueva pestaña</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t bg-muted/30 shrink-0">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-6 bg-transparent"
              onClick={() => {
                if (step === 1) handleClose()
                else setStep((prev) => (prev - 1) as Step)
              }}
            >
              <ChevronLeft className="mr-2 h-5 w-5" />
              {step === 1 ? "Cancelar" : "Anterior"}
            </Button>

            <span className="text-sm text-muted-foreground">Paso {step} de 4</span>

            {step < 4 ? (
              <Button
                size="lg"
                className="h-12 px-8"
                disabled={
                  (step === 1 && !selectedClient) ||
                  (step === 1 && bookingType === "pack" && !selectedPack) ||
                  (step === 2 && selectedSlots.length === 0) ||
                  (step === 3 && paymentOption === "deposit" && depositAmount <= 0) ||
                  (step === 2 && validityError !== null) // Disable next button if there's a validity error
                }
                onClick={() => {
                  if (step === 3) handleConfirmBooking()
                  else setStep((prev) => (prev + 1) as Step)
                }}
              >
                {step === 3 ? "Confirmar Reserva" : "Siguiente"}
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <Button size="lg" className="h-12 px-8" onClick={handleClose}>
                Cerrar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
