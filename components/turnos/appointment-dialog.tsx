"use client"

import { useState } from "react"
import { useData } from "@/lib/data-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import type { AppointmentStatus } from "@/lib/types"

interface AppointmentDialogProps {
  date: Date
  time: string
  professionalId: string
  onClose: () => void
}

export function AppointmentDialog({ date, time, professionalId, onClose }: AppointmentDialogProps) {
  const { clients, services, professionals, addAppointment } = useData()

  const safeClients = clients || []
  const safeServices = services || []
  const safeProfessionals = professionals || []

  const professional = safeProfessionals.find((p) => p.id === professionalId)

  const [clientId, setClientId] = useState("")
  const [serviceId, setServiceId] = useState("")
  const [notes, setNotes] = useState("")
  const [depositAmount, setDepositAmount] = useState(0)

  const selectedService = safeServices.find((s) => s.id === serviceId)
  const selectedClient = safeClients.find((c) => c.id === clientId)

  const calculateEndTime = () => {
    if (!selectedService) return time
    const [hours, minutes] = time.split(":").map(Number)
    const totalMinutes = hours * 60 + minutes + selectedService.duration
    const endHours = Math.floor(totalMinutes / 60)
    const endMins = totalMinutes % 60
    return `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`
  }

  const handleSubmit = () => {
    if (!clientId || !serviceId) return

    const status: AppointmentStatus = depositAmount > 0 ? "confirmed" : "pending_deposit"

    addAppointment({
      professionalId,
      clientId,
      date,
      startTime: time,
      endTime: calculateEndTime(),
      serviceId,
      status,
      notes,
      depositAmount,
      totalAmount: selectedService?.price || 0,
      discountPercent: selectedClient?.specialDiscount || 0,
      paidAmount: depositAmount,
      payments:
        depositAmount > 0
          ? [
              {
                id: `pay-${Date.now()}`,
                amount: depositAmount,
                paymentMethod: "cash",
                createdAt: new Date(),
                notes: "Seña",
              },
            ]
          : [],
      comments: [],
      isPaid: false,
      isSettled: false,
    })

    onClose()
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nuevo Turno</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Fecha y Hora</Label>
            <Input value={`${date.toLocaleDateString("es-AR")} - ${time}`} disabled className="bg-muted" />
          </div>

          <div className="grid gap-2">
            <Label>Profesional</Label>
            <Input value={professional?.name || ""} disabled className="bg-muted" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="client">Cliente</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {safeClients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name} {client.specialDiscount > 0 && `(${client.specialDiscount}% desc.)`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="service">Servicio</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar servicio" />
              </SelectTrigger>
              <SelectContent>
                {safeServices
                  .filter((s) => professional?.services?.includes(s.id))
                  .map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - {formatCurrency(service.price)} ({service.duration} min)
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {selectedService && (
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <div className="flex justify-between text-sm">
                <span>Duración:</span>
                <span>{selectedService.duration} minutos</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Fin del turno:</span>
                <span>{calculateEndTime()}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Precio:</span>
                <span>{formatCurrency(selectedService.price)}</span>
              </div>
              {selectedClient && selectedClient.specialDiscount > 0 && (
                <>
                  <div className="flex justify-between text-sm text-amber-600">
                    <span>Descuento cliente:</span>
                    <span>-{selectedClient.specialDiscount}%</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-green-600">
                    <span>Total con descuento:</span>
                    <span>{formatCurrency(selectedService.price * (1 - selectedClient.specialDiscount / 100))}</span>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="deposit">Seña</Label>
            <Input
              id="deposit"
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(Number(e.target.value))}
              placeholder="0"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas internas..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!clientId || !serviceId}>
            Crear Turno
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
