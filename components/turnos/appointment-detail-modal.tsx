"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useData } from "@/lib/data-context"
import { useAuth } from "@/lib/auth-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatCurrency } from "@/lib/utils"
import { PaymentResolutionModal } from "./payment-resolution-modal"
import type { Appointment, AppointmentStatus, PaymentMethod, Professional, AppointmentPayment } from "@/lib/types"
import { Calendar, X, MessageCircle, Phone, Ban, ExternalLink, Check } from "lucide-react"
import { RescheduleCalendarComponent } from "./reschedule-calendar"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"

interface AppointmentDetailModalProps {
  appointment: Appointment
  isOpen: boolean
  onClose: () => void
  defaultMode?: "detail" | "reschedule"
}

const statusOptions: { value: AppointmentStatus; label: string; color: string }[] = [
  { value: "pending_deposit", label: "Sin seña", color: "bg-amber-500" },
  { value: "confirmed", label: "Confirmado", color: "bg-blue-500" },
  { value: "attended", label: "Asistió", color: "bg-green-500" },
  { value: "no_show", label: "No asistió", color: "bg-red-500" },
  { value: "follow_up", label: "Seguimiento", color: "bg-orange-500" },
  { value: "cancelled", label: "Cancelado", color: "bg-gray-500" },
]

export function AppointmentDetailModal({
  appointment: initialAppointment,
  isOpen,
  onClose,
  defaultMode = "detail",
}: AppointmentDetailModalProps) {
  const {
    clients,
    professionals,
    serviceConfigs,
    updateAppointment,
    addTransaction,
    appointments,
    addPaymentToAppointment,
    deletePaymentFromAppointment,
    deleteAppointment,
    addInterProfessionalAdjustment,
  } = useData()
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [stagedProfessionalChange, setStagedProfessionalChange] = useState<{
    professional: Professional
    date: Date
    startTime: string
    endTime: string
  } | null>(null)

  const [showResolutionModal, setShowResolutionModal] = useState(false)
  const [paymentsToResolve, setPaymentsToResolve] = useState<AppointmentPayment[]>([])
  const [stagedResolution, setStagedResolution] = useState<any>(null)

  const appointment = (appointments || []).find((a) => a.id === initialAppointment.id) || initialAppointment

  const [activeTab, setActiveTab] = useState<"detail" | "payments" | "info">("detail")
  const [status, setStatus] = useState<AppointmentStatus>(appointment.status)
  const [price, setPrice] = useState(appointment.finalPrice)
  const [discountPercent, setDiscountPercent] = useState(appointment.discountPercent)
  const [reason, setReason] = useState(appointment.cancelReason || "")
  const [reasonError, setReasonError] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")
  const [showReschedule, setShowReschedule] = useState(defaultMode === "reschedule")
  const [showChangeProfessional, setShowChangeProfessional] = useState(false)
  const [selectedNewProfessional, setSelectedNewProfessional] = useState<any | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentToDeleteId, setPaymentToDeleteId] = useState<string | null>(null)
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null) // Added state to manage appointment deletion confirmation

  const client = (clients || []).find((c) => c.id === appointment.clientId)
  const professional = (professionals || []).find((p) => p.id === appointment.professionalId)
  const service = (serviceConfigs || []).find((s) => s.id === appointment.serviceId)

  const remaining = appointment.finalPrice - (appointment.paidAmount || 0)

  const formatDateDisplay = (date: Date) => {
    return new Date(date).toLocaleDateString("es-AR", { day: "numeric", month: "long" }).toUpperCase()
  }

  const sendWhatsAppConfirmation = (paymentAmt: number, method: PaymentMethod) => {
    if (!client?.phone) return

    const phoneNumber = client.phone.replace(/\D/g, "")
    const formattedDate = new Date(appointment.date).toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })

    const message = encodeURIComponent(
      `✅ *Pago Registrado - TENSE*\n\n` +
      `Hola ${client.name}!\n\n` +
      `Tu pago ha sido registrado exitosamente:\n\n` +
      `💰 *Monto:* ${formatCurrency(paymentAmt)}\n` +
      `💳 *Método:* ${method === "cash" ? "Efectivo" : "Transferencia"}\n\n` +
      `📅 *Datos del turno:*\n` +
      `• Servicio: ${service?.name}\n` +
      `• Profesional: ${professional?.name}\n` +
      `• Fecha: ${formattedDate}\n` +
      `• Horario: ${appointment.startTime} - ${appointment.endTime}\n\n` +
      `${remaining - paymentAmt > 0 ? `⚠️ Resta abonar: ${formatCurrency(remaining - paymentAmt)}\n\n` : ""}` +
      `¡Gracias por confiar en TENSE!`,
    )

    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank")
  }

  const sendGeneralWhatsApp = () => {
    if (!client?.phone) {
      toast({
        title: "Error",
        description: "El cliente no tiene un teléfono registrado.",
        variant: "destructive"
      })
      return
    }

    // Normalize phone: remove non-digits
    let phoneNumber = client.phone.replace(/\D/g, "")
    // If it doesn't start with 54 and has 10 digits (local AR number), add 54
    if (phoneNumber.length === 10 && !phoneNumber.startsWith("54")) {
      phoneNumber = "54" + phoneNumber
    }

    const message = encodeURIComponent(`Hola ${client.name}! Te escribo desde TENSE por tu turno de ${service?.name}.`)
    const url = `https://wa.me/${phoneNumber}?text=${message}`

    toast({
      title: "Abriendo WhatsApp",
      description: `Contactando a ${client.name}...`
    })

    window.open(url, "_blank")
  }

  const sendWhatsAppReminder = () => {
    if (!client?.phone) {
      toast({
        title: "Error",
        description: "El cliente no tiene un teléfono registrado.",
        variant: "destructive"
      })
      return
    }

    const now = new Date()
    const aptDate = new Date(appointment.date)
    const [hours, minutes] = appointment.startTime.split(":").map(Number)
    aptDate.setHours(hours, minutes, 0, 0)

    const diffMs = aptDate.getTime() - now.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    let phoneNumber = client.phone.replace(/\D/g, "")
    // Normalize for AR if needed
    if (phoneNumber.length === 10 && !phoneNumber.startsWith("54")) {
      phoneNumber = "54" + phoneNumber
    }
    const formattedDate = new Date(appointment.date).toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })

    let message = ""

    if (diffHours <= 0) {
      toast({
        title: "No enviado",
        description: "El turno ya ha pasado o está comenzando.",
        variant: "destructive"
      })
      return
    }

    if (diffHours <= 24) {
      // Last call reminder (loss of deposit)
      message = encodeURIComponent(
        `🚨 *RECORDATORIO IMPORTANTE - TENSE*\n\n` +
        `Hola ${client.name}, te recordamos tu turno de *mañana*:\n\n` +
        `📅 *Fecha:* ${formattedDate}\n` +
        `⏰ *Hora:* ${appointment.startTime}\n` +
        `👤 *Profesional:* ${professional?.name}\n\n` +
        `⚠️ Te recordamos que al faltar menos de 24hs, en caso de cancelación o reprogramación, *se pierde el valor de la seña* abonada según nuestras políticas.\n\n` +
        `¡Te esperamos!`
      )
    } else {
      // 48hs or more reminder
      message = encodeURIComponent(
        `📅 *RECORDATORIO DE TURNO - TENSE*\n\n` +
        `Hola ${client.name}, queríamos recordarte tu próximo turno:\n\n` +
        `✅ *Servicio:* ${service?.name}\n` +
        `📅 *Fecha:* ${formattedDate}\n` +
        `⏰ *Hora:* ${appointment.startTime}\n` +
        `👤 *Profesional:* ${professional?.name}\n\n` +
        `En caso de necesitar reprogramar, por favor avisanos con al menos 24hs de anticipación para conservar tu seña.\n\n` +
        `¡Nos vemos pronto!`
      )
    }

    const url = `https://wa.me/${phoneNumber}?text=${message}`

    toast({
      title: "Enviando recordatorio",
      description: `Mensaje de WhatsApp preparado para ${client.name}.`
    })

    window.open(url, "_blank")
  }

  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split("T")[0])

  const handleAddPayment = () => {
    if (paymentAmount <= 0) return

    addPaymentToAppointment(appointment.id, {
      amount: paymentAmount,
      paymentMethod: paymentMethod,
      collectedMethod: paymentMethod === "cash" ? "cash_professional" : "transfer_professional",
      receivedByProfessionalId: appointment.professionalIdCobro || appointment.professionalId,
      isDeposit: !appointment.isDepositComplete,
      paymentDate: new Date(paymentDate + "T12:00:00"), // Set to noon to avoid timezone issues
      notes: "",
    })

    setPaymentSuccess(true)

    toast({
      title: "Pago registrado",
      description: `${formatCurrency(paymentAmount)} registrado como ${paymentMethod === "cash" ? "Efectivo (Profesional)" : "Transferencia (Profesional)"}`,
    })

    setTimeout(() => {
      setShowPaymentForm(false)
      setPaymentAmount(0)
      setPaymentSuccess(false)
    }, 2000)
  }

  const handleAddComment = () => {
    if (!newComment.trim() || !user) return

    const comment = {
      id: `comment-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      text: newComment,
      createdAt: new Date(),
    }

    const currentComments = appointment.comments || []
    updateAppointment(appointment.id, {
      ...appointment,
      status, // Sync status if changed
      comments: [...currentComments, comment],
    })

    setNewComment("")
  }

  const handleSave = () => {
    if (status === "follow_up" && !reason.trim()) {
      setReasonError(true)
      toast({
        title: "Requerido",
        description: "Debe ingresar un motivo para el seguimiento",
        variant: "destructive",
      })
      return
    }

    if (status === "attended" && remainingAmount > 0) {
      toast({
        title: "Acceso denegado",
        description: `No se puede marcar como "Asistió" si el turno tiene un saldo pendiente de ${formatCurrency(remainingAmount)}. Por favor registre el pago completo.`,
        variant: "destructive",
      })
      return
    }

    commitSave(stagedResolution)
  }

  const commitSave = (resolution?: any) => {
    let adjustment = null
    if (resolution) {
      adjustment = addInterProfessionalAdjustment({
        fromProfessionalId: resolution.fromProfessionalId,
        toProfessionalId: resolution.toProfessionalId,
        amount: resolution.amount,
        mode: resolution.mode,
        status: resolution.mode === "neteo_liquidacion" ? "resolved" : "pending",
        appointmentId: appointment.id,
        sourcePaymentIds: resolution.sourcePaymentIds,
        collectedByProfessionalId: resolution.fromProfessionalId,
        notes: resolution.notes,
      })
    }

    const dataToUpdate: Partial<Appointment> = {
      status,
      finalPrice: price,
      discountPercent,
      cancelReason: status === "follow_up" ? reason : undefined,
    }

    if (stagedProfessionalChange) {
      const oldProfessionalId = appointment.professionalId
      const newProfessionalId = stagedProfessionalChange.professional.id

      dataToUpdate.professionalId = newProfessionalId
      dataToUpdate.professionalIdCalendario = newProfessionalId
      dataToUpdate.professionalIdAtencion = newProfessionalId
      dataToUpdate.date = stagedProfessionalChange.date
      dataToUpdate.startTime = stagedProfessionalChange.startTime
      dataToUpdate.endTime = stagedProfessionalChange.endTime

      const autoComment = {
        id: `comment-${Date.now()}`,
        userId: user?.id || "system",
        userName: user?.name || "Sistema",
        text: `Cambio de profesional: de ${professional?.name || "Sin profesional"} a ${stagedProfessionalChange.professional.name}${adjustment ? ` (Resuelto vía ${adjustment.mode === "neteo_liquidacion" ? "Compensación" : "Transferencia"})` : ""}`,
        createdAt: new Date(),
      }

      dataToUpdate.comments = [...(appointment.comments || []), autoComment]

      if (adjustment) {
        dataToUpdate.paymentResolutionStatus = adjustment.status === "resolved" ? "ok" : "pending_resolution"
        dataToUpdate.paymentResolutionMode = adjustment.mode
        dataToUpdate.adjustmentId = adjustment.id
        dataToUpdate.professionalPreviousId = oldProfessionalId
        dataToUpdate.professionalNewId = newProfessionalId
        dataToUpdate.changedBy = user?.id
        dataToUpdate.changedAt = new Date()
      }
    }

    updateAppointment(appointment.id, dataToUpdate)
    onClose()
  }

  const handleConfirmResolution = (resolution: any) => {
    setStagedResolution(resolution)
    setShowResolutionModal(false)
    toast({
      title: "Resolución preparada",
      description: "Se ha configurado la resolución. Guarde los cambios para confirmar.",
    })
  }

  const handleReschedule = (date: Date, time: string) => {
    const [hours, minutes] = time.split(":").map(Number)
    const slotDuration = professional?.standardDuration || 60
    const endHours = hours + Math.floor((minutes + slotDuration) / 60)
    const endMinutes = (minutes + slotDuration) % 60

    updateAppointment(appointment.id, {
      date,
      startTime: time,
      endTime: `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`,
    })

    setShowReschedule(false)
  }

  const handleChangeProfessional = (newProfessional: any, date: Date, time: string) => {
    const slotDuration = newProfessional.standardDuration || 60
    const [hours, minutes] = time.split(":").map(Number)
    const endHours = hours + Math.floor((minutes + slotDuration) / 60)
    const endMinutes = (minutes + slotDuration) % 60

    const nextStagedChange = {
      professional: newProfessional,
      date,
      startTime: time,
      endTime: `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`,
    }

    setStagedProfessionalChange(nextStagedChange)
    setStagedResolution(null) // Reset in case a previous professional change staged one
    setShowChangeProfessional(false)
    setSelectedNewProfessional(null)

    // Check if we need resolution
    const professionalPayments = (appointment.payments || []).filter((p) => {
      const isProfessionalPayment =
        p.collectedMethod === "cash_professional" ||
        p.collectedMethod === "transfer_professional" ||
        (!p.collectedMethod && (p.paymentMethod === "cash" || p.paymentMethod === "transfer"))

      return isProfessionalPayment && p.receivedByProfessionalId !== newProfessional.id
    })

    if (professionalPayments.length > 0) {
      setPaymentsToResolve(professionalPayments)
      setShowResolutionModal(true)
    }
  }

  const handleDeleteClick = () => {
    setAppointmentToDelete(appointment.id)
  }

  const handleConfirmDelete = () => {
    if (appointmentToDelete) {
      deleteAppointment(appointmentToDelete)
      toast({
        title: "Turno eliminado",
        description: "El turno ha sido eliminado correctamente",
      })
      setAppointmentToDelete(null)
      onClose()
    }
  }

  const handleDeletePaymentClick = (paymentId: string) => {
    setPaymentToDeleteId(paymentId)
  }

  const handleConfirmDeletePayment = () => {
    if (paymentToDeleteId) {
      deletePaymentFromAppointment(appointment.id, paymentToDeleteId)

      toast({
        title: "Pago eliminado",
        description: "El pago ha sido removido correctamente",
      })
    }
    setPaymentToDeleteId(null)
  }

  const tabs = [
    { id: "detail" as const, label: "Detalle del turno" },
    { id: "payments" as const, label: "Pagos realizados" },
    { id: "info" as const, label: "Información" },
  ]

  const paidAmount = appointment.paidAmount || 0
  const finalPrice = appointment.finalPrice || 0
  const remainingAmount = finalPrice - paidAmount

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="p-0 gap-0 overflow-hidden border-0 shadow-2xl [&>button]:hidden flex flex-col bg-trasparent"
        style={{ width: "950px", maxWidth: "95vw", height: "90vh", maxHeight: "90vh" }}
      >
        {/* Header */}
        <DialogHeader className="border-b pb-4 px-6 py-3 shrink-0 bg-background rounded-t-lg">
          <DialogTitle className="text-base">
            {client?.name} - {formatDateDisplay(appointment.date)} a las {appointment.startTime} | {service?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden min-h-0 bg-background rounded-b-lg">
          {/* Left Panel */}
          <div
            className="border-r bg-muted/30 flex flex-col shrink-0 overflow-y-auto"
            style={{ width: showReschedule || showChangeProfessional ? "380px" : "300px" }}
          >
            {showReschedule ? (
              <RescheduleCalendarComponent
                professionalId={appointment.professionalIdCalendario || appointment.professionalId}
                currentDate={appointment.date}
                currentTime={appointment.startTime}
                onSelect={handleReschedule}
                onCancel={() => setShowReschedule(false)}
              />
            ) : showChangeProfessional ? (
              selectedNewProfessional ? (
                <RescheduleCalendarComponent
                  professionalId={selectedNewProfessional.id}
                  currentDate={appointment.date}
                  currentTime={appointment.startTime}
                  onSelect={(date, time) => handleChangeProfessional(selectedNewProfessional, date, time)}
                  onCancel={() => {
                    setSelectedNewProfessional(null)
                    setShowChangeProfessional(false)
                  }}
                  title="Cambiar Profesional"
                />
              ) : (
                <div className="p-4 flex flex-col h-full">
                  <h3 className="font-semibold mb-3 text-sm">Seleccionar Profesional</h3>
                  <p className="text-xs text-muted-foreground mb-3">Profesionales de {service?.name}</p>
                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {(professionals || [])
                      .filter(
                        (p) =>
                          p.id !== appointment.professionalIdCalendario && p.isActive && p.specialty === service?.name,
                      )
                      .map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setSelectedNewProfessional(p)}
                          className="w-full text-left p-3 hover:bg-primary/5 rounded-lg border border-transparent hover:border-primary/20 transition-all"
                        >
                          <div className="font-medium text-sm">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.specialty}</div>
                          <div className="text-xs text-muted-foreground mt-1">Comisión TENSE: {p.commissionRate}%</div>
                        </button>
                      ))}
                    {(professionals || []).filter(
                      (p) =>
                        p.id !== appointment.professionalIdCalendario && p.isActive && p.specialty === service?.name,
                    ).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No hay otros profesionales de {service?.name} disponibles
                        </p>
                      )}
                  </div>
                  <Button
                    variant="outline"
                    className="mt-3 bg-transparent"
                    onClick={() => setShowChangeProfessional(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              )
            ) : (
              <div className="p-4 flex flex-col h-full">
                {/* Client Info Table */}
                <div className="border rounded-lg bg-background mb-3">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b">
                        <td className="px-3 py-2 text-muted-foreground font-medium">Nombre</td>
                        <td className="px-3 py-2">{client?.name}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-3 py-2 text-muted-foreground font-medium">DNI</td>
                        <td className="px-3 py-2">{client?.dni || "-"}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-3 py-2 text-muted-foreground font-medium">Email</td>
                        <td className="px-3 py-2 text-xs">{client?.email}</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-muted-foreground font-medium">Teléfono</td>
                        <td className="px-3 py-2">{client?.phone}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Client Special Discount Badge */}
                {client?.specialDiscount && client.specialDiscount > 0 && (
                  <Badge variant="outline" className="mb-3 border-red-300 text-red-600 bg-red-50 w-fit">
                    {client.specialDiscount}% OFF
                  </Badge>
                )}

                {/* Action Buttons */}
                <Button
                  className="w-full mb-2 bg-emerald-500 hover:bg-emerald-600 text-white"
                  size="sm"
                  onClick={() => {
                    onClose()
                    router.push(`/clientes?id=${client?.id}`)
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ir al perfil del cliente
                </Button>
                <Button
                  variant="outline"
                  className="w-full mb-2 bg-background hover:bg-muted"
                  size="sm"
                  onClick={sendGeneralWhatsApp}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contactar por WhatsApp
                </Button>
                <Button
                  variant="outline"
                  className="w-full bg-background hover:bg-muted"
                  size="sm"
                  onClick={sendWhatsAppReminder}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Enviar Recordatorio
                </Button>

                <div className="flex-1" />

                {/* Delete Button */}
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive mt-4 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  size="sm"
                  onClick={handleDeleteClick}
                  disabled={paidAmount > 0}
                  title={paidAmount > 0 ? "No se puede eliminar un turno con pagos cargados" : "Eliminar este turno"}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Eliminar Turno
                </Button>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            {/* Payment Summary */}
            <div className="flex items-center gap-3 p-4 border-b">
              <div className="flex-1 text-center border-r">
                <div className="text-xs text-muted-foreground">Total del turno:</div>
                <div className="text-lg font-bold">{formatCurrency(finalPrice)}</div>
              </div>
              <div className="flex-1 text-center border-r">
                <div className="text-xs text-muted-foreground">Total pagado:</div>
                <div className="text-lg font-bold">{formatCurrency(paidAmount)}</div>
              </div>
              <div className="flex-1 text-center border-r">
                <div className="text-xs text-muted-foreground">Resta abonar:</div>
                <div className={`text-lg font-bold ${remainingAmount > 0 ? "text-red-500" : "text-green-500"}`}>
                  {formatCurrency(remainingAmount)}
                </div>
              </div>
              <Button
                size="sm"
                className="bg-sky-500 hover:bg-sky-600 whitespace-nowrap"
                onClick={() => setShowPaymentForm(true)}
              >
                Nuevo Pago
              </Button>
            </div>

            {/* Tabs */}
            <div className="border-b px-4">
              <div className="flex gap-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                      ? "border-sky-500 text-sky-600"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-4 overflow-y-auto">
              {activeTab === "detail" && (
                <div className="space-y-4">
                  {/* Payment Form */}
                  {showPaymentForm && (
                    <div
                      className={`border rounded-lg p-3 ${paymentSuccess ? "bg-green-50 border-green-300" : "bg-muted/30"}`}
                    >
                      {paymentSuccess ? (
                        <div className="flex items-center justify-center gap-2 py-4">
                          <Check className="h-6 w-6 text-green-600" />
                          <span className="text-green-600 font-medium">Pago registrado correctamente</span>
                        </div>
                      ) : (
                        <>
                          <h4 className="font-medium mb-2 text-sm">Registrar Pago</h4>
                          <div className="flex flex-col gap-3">
                            <div className="flex gap-2 items-end">
                              <div className="w-[120px]">
                                <label className="text-xs text-muted-foreground block mb-1">Monto</label>
                                <Input
                                  type="number"
                                  value={paymentAmount}
                                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                  className="h-8"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="text-xs text-muted-foreground block mb-1">Método</label>
                                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="cash">Efectivo (Profesional)</SelectItem>
                                    <SelectItem value="transfer">Transferencia (Profesional)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex-1">
                                <label className="text-xs text-muted-foreground block mb-1">Fecha de Cobro</label>
                                <Input
                                  type="date"
                                  value={paymentDate}
                                  onChange={(e) => setPaymentDate(e.target.value)}
                                  className="h-8"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button size="sm" variant="outline" onClick={() => setShowPaymentForm(false)} className="h-8">
                                Cancelar
                              </Button>
                              <Button size="sm" className="bg-sky-500 hover:bg-sky-600 h-8" onClick={handleAddPayment}>
                                Registrar
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Date and Actions */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">{formatDateDisplay(appointment.date)}</div>
                        <div className="text-xs text-muted-foreground">
                          {appointment.startTime} - {appointment.endTime}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-auto">
                      <Button size="sm" variant="secondary" onClick={() => setShowReschedule(true)}>
                        Reprogramar
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setShowChangeProfessional(true)}>
                        Cambiar de profesional
                      </Button>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Estado de la reserva</label>
                    <Select value={status} onValueChange={(v) => setStatus(v as AppointmentStatus)}>
                      <SelectTrigger className="w-56">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${statusOptions.find((s) => s.value === status)?.color}`}
                          />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((opt) => {
                          const isDisabled = opt.value === "attended" && remainingAmount > 0
                          return (
                            <SelectItem key={opt.value} value={opt.value} disabled={isDisabled}>
                              <div className="flex items-center justify-between w-full gap-2">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${opt.color}`} />
                                  {opt.label}
                                </div>
                                {isDisabled && (
                                  <span className="text-[10px] text-red-500 font-bold ml-2 italic">Bloqueado: Deuda pendiente</span>
                                )}
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    {status !== "attended" && remainingAmount > 0 && (
                      <p className="text-[10px] text-red-600 mt-1 font-medium animate-pulse">
                        ⚠️ No podrá marcar como "Asistió" hasta que se complete el pago de {formatCurrency(remainingAmount)}
                      </p>
                    )}
                  </div>

                  {status === "follow_up" && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <label className="text-sm text-orange-800 font-medium mb-1 block">Motivo de seguimiento <span className="text-red-500">*</span></label>
                      <Textarea
                        value={reason}
                        onChange={(e) => {
                          setReason(e.target.value)
                          if (e.target.value.trim()) setReasonError(false)
                        }}
                        placeholder="Indique por qué este turno requiere seguimiento..."
                        className={`bg-white min-h-[80px] ${reasonError ? "border-red-500 ring-1 ring-red-500" : ""}`}
                      />
                      {reasonError && (
                        <p className="text-xs text-red-600 mt-1 font-medium">
                          Este campo es obligatorio para guardar el turno en seguimiento.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Price and Discount */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Precio</label>
                      <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Descuento %</label>
                      <Input
                        type="number"
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  {/* Comments */}
                  <div className="border rounded-lg p-3 bg-muted/20">
                    {(appointment.comments || []).length > 0 && (
                      <div className="space-y-2 mb-3">
                        {(appointment.comments || []).map((comment) => (
                          <div key={comment.id} className="flex items-start gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-xs">
                                {comment.userName
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">{comment.userName}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(comment.createdAt).toLocaleDateString("es-AR")}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">{comment.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <Textarea
                      placeholder="Añadir comentario"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[60px] text-sm resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleAddComment()
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              {activeTab === "payments" && (
                <div className="space-y-3">
                  {(appointment.payments || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No hay pagos registrados</p>
                  ) : (
                    (appointment.payments || []).map((payment) => {
                      const paymentReceivedBy = (professionals || []).find(
                        (p) => p.id === payment.receivedByProfessionalId,
                      )
                      return (
                        <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{formatCurrency(payment.amount)}</div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div>
                                {payment.paymentMethod === "cash"
                                  ? "Efectivo (Caja TENSE)"
                                  : "Transferencia (Profesional)"}
                                {payment.isDeposit && " - Seña"}
                              </div>
                              <div className="text-xs">
                                <span className="font-medium">Profesional:</span>{" "}
                                {paymentReceivedBy?.name || "Desconocido"}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-xs text-muted-foreground">
                              {new Date(payment.createdAt).toLocaleDateString("es-AR")}
                            </div>
                            {user?.role === "super_admin" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeletePaymentClick(payment.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {activeTab === "info" && (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Desglose Financiero</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Precio base:</span>
                        <span>{formatCurrency(appointment.basePrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Descuento cliente ({appointment.discountPercent}%):
                        </span>
                        <span className="text-red-500">
                          -{formatCurrency((appointment.basePrice * appointment.discountPercent) / 100)}
                        </span>
                      </div>
                      <div className="flex justify-between font-medium border-t pt-2">
                        <span>Precio final:</span>
                        <span>{formatCurrency(appointment.finalPrice)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Distribución</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Honorarios profesional ({appointment.professionalPercentage}%):
                        </span>
                        <span>{formatCurrency(appointment.professionalEarnings)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Comisión TENSE:</span>
                        <span>{formatCurrency(appointment.basePrice - appointment.professionalEarnings)}</span>
                      </div>
                      <div className="flex justify-between text-red-500">
                        <span>Descuento absorbido por TENSE:</span>
                        <span>-{formatCurrency((appointment.basePrice * appointment.discountPercent) / 100)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Fondos Recibidos</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Efectivo en Caja TENSE:</span>
                        <span>{formatCurrency(appointment.cashInTense || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transferencias al profesional:</span>
                        <span>{formatCurrency(appointment.transfersToProfessional || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t p-4 pb-6">
              <Button className="w-full bg-sky-500 hover:bg-sky-600 font-semibold" onClick={handleSave}>
                Guardar turno
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
      {/* Payment Deletion Confirmation Dialog */}
      <AlertDialog open={!!paymentToDeleteId} onOpenChange={(open) => !open && setPaymentToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pago?</AlertDialogTitle>
            <div className="space-y-3 text-muted-foreground text-sm">
              <div>Esta acción no se puede deshacer.</div>
              {paidAmount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-amber-900">⚠️ Advertencia</div>
                  <div className="text-sm text-amber-800 mt-1">
                    Este turno tiene {formatCurrency(paidAmount)} pagado. Al eliminarlo se perderán los registros de
                    pago.
                  </div>
                </div>
              )}
              <div className="text-sm text-red-600 font-medium">¿Estás seguro de que deseas eliminar este pago?</div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeletePayment} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Delete Appointment Confirmation Dialog */}
      <AlertDialog open={appointmentToDelete !== null} onOpenChange={() => setAppointmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {paidAmount > 0 ? "No se puede eliminar este turno" : "¿Confirmar eliminación?"}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div>
            {paidAmount > 0 ? (
              <div className="text-sm text-muted-foreground">
                <p>Este turno tiene pagos registrados por {formatCurrency(paidAmount)}.</p>
                <p className="mt-2">Para eliminar el turno, primero debes eliminar todos los pagos asociados.</p>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                <p>¿Estás seguro de que deseas eliminar este turno?</p>
                <p className="mt-2">Esta acción no se puede deshacer.</p>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            {paidAmount === 0 && (
              <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleConfirmDelete}>
                Eliminar
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {stagedProfessionalChange && professional && (
        <PaymentResolutionModal
          isOpen={showResolutionModal}
          onClose={() => setShowResolutionModal(false)}
          onConfirm={handleConfirmResolution}
          appointment={appointment}
          paymentsToResolve={paymentsToResolve}
          fromProfessional={professional}
          toProfessional={stagedProfessionalChange.professional}
        />
      )}
    </Dialog>
  )
}
