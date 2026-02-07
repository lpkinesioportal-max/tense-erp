"use client"

import { useState } from "react"
import { useData } from "@/lib/data-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  formatCurrency,
  formatDate,
  formatTime,
  statusLabels,
  statusColors,
  paymentMethodLabels,
  cn,
} from "@/lib/utils"
import type { Appointment, AppointmentStatus, PaymentMethod } from "@/lib/types"
import { Check, X, RefreshCw, DollarSign, Calendar, Clock, User, Briefcase } from "lucide-react"

interface AppointmentActionsProps {
  appointment: Appointment
  onClose: () => void
}

export function AppointmentActions({ appointment, onClose }: AppointmentActionsProps) {
  const { clients, services, professionals, updateAppointmentStatus, updateAppointment, addTransaction } = useData()

  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState(appointment.totalAmount - appointment.depositAmount)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")

  const client = clients.find((c) => c.id === appointment.clientId)
  const service = services.find((s) => s.id === appointment.serviceId)
  const professional = professionals.find((p) => p.id === appointment.professionalId)

  const pendingAmount = appointment.totalAmount - appointment.depositAmount

  const handleStatusChange = (status: AppointmentStatus) => {
    updateAppointmentStatus(appointment.id, status)
    if (status === "attended" || status === "no_show" || status === "closed") {
      onClose()
    }
  }

  const handlePayment = () => {
    addTransaction({
      date: new Date(),
      type: paymentAmount >= pendingAmount ? "full_payment" : "pending_balance",
      amount: paymentAmount,
      paymentMethod,
      appointmentId: appointment.id,
      clientId: appointment.clientId,
      professionalId: appointment.professionalId,
      notes: `Pago turno ${formatDate(appointment.date)}`,
    })

    updateAppointment(appointment.id, {
      isPaid: paymentAmount >= pendingAmount,
      depositAmount: appointment.depositAmount + paymentAmount,
    })

    setShowPaymentForm(false)
  }

  const handleAddDeposit = (amount: number) => {
    addTransaction({
      date: new Date(),
      type: "deposit",
      amount,
      paymentMethod,
      appointmentId: appointment.id,
      clientId: appointment.clientId,
      professionalId: appointment.professionalId,
      notes: `Seña turno ${formatDate(appointment.date)}`,
    })

    updateAppointment(appointment.id, {
      depositAmount: appointment.depositAmount + amount,
      status: "confirmed",
    })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Turno
            <Badge variant="outline" className={cn("ml-2", statusColors[appointment.status])}>
              {statusLabels[appointment.status]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Appointment Details */}
          <div className="grid gap-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{client?.name}</span>
              <span className="text-muted-foreground">({client?.phone})</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span>{professional?.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{formatDate(appointment.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
              </span>
            </div>
          </div>

          <Separator />

          {/* Service & Payment Info */}
          <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Servicio:</span>
              <span className="font-medium">{service?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total:</span>
              <span className="font-medium">{formatCurrency(appointment.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Seña:</span>
              <span className={appointment.depositAmount > 0 ? "text-success font-medium" : "text-muted-foreground"}>
                {formatCurrency(appointment.depositAmount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Pendiente:</span>
              <span className={pendingAmount > 0 ? "text-warning-foreground font-medium" : "text-success font-medium"}>
                {formatCurrency(pendingAmount)}
              </span>
            </div>
            {appointment.isPaid && (
              <div className="flex items-center gap-1 text-sm text-success">
                <Check className="h-4 w-4" />
                <span>Pagado</span>
              </div>
            )}
          </div>

          {appointment.notes && (
            <div className="rounded-lg border border-border p-3">
              <p className="text-sm text-muted-foreground">Notas: {appointment.notes}</p>
            </div>
          )}

          {/* Payment Form */}
          {showPaymentForm && (
            <div className="rounded-lg border border-border bg-card p-4 space-y-4">
              <h4 className="font-medium">Registrar Pago</h4>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label>Monto</Label>
                  <Input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    max={pendingAmount}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Medio de Pago</Label>
                  <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(paymentMethodLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowPaymentForm(false)}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={handlePayment}>
                  Confirmar Pago
                </Button>
              </div>
            </div>
          )}

          <Separator />

          {/* Quick Actions */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Acciones Rápidas</h4>

            <div className="grid grid-cols-2 gap-2">
              {appointment.status === "pending_deposit" && (
                <Button variant="outline" size="sm" onClick={() => handleAddDeposit(1000)} className="justify-start">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Registrar Seña
                </Button>
              )}

              {(appointment.status === "confirmed" || appointment.status === "pending_deposit") && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange("attended")}
                    className="justify-start text-success hover:text-success"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Asistió
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange("no_show")}
                    className="justify-start text-destructive hover:text-destructive"
                  >
                    <X className="mr-2 h-4 w-4" />
                    No Asistió
                  </Button>
                </>
              )}

              {!appointment.isPaid && pendingAmount > 0 && (
                <Button variant="outline" size="sm" onClick={() => setShowPaymentForm(true)} className="justify-start">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Cobrar
                </Button>
              )}

              <Button variant="outline" size="sm" className="justify-start bg-transparent">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reprogramar
              </Button>
            </div>

            {appointment.status === "attended" && !appointment.isSettled && (
              <Button
                variant="default"
                size="sm"
                className="w-full"
                onClick={() => {
                  updateAppointment(appointment.id, { status: "closed", isSettled: true })
                  onClose()
                }}
              >
                Cerrar Turno
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
