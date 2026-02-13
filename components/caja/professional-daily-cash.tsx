"use client"

import { useState } from "react"
import { useData } from "@/lib/data-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency, getDateInISO } from "@/lib/utils"
import { Calendar, DollarSign, CheckCircle, ArrowRight, HandCoins } from "lucide-react"
import type { Appointment, AppointmentPayment } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

export function ProfessionalDailyCash() {
  const { professionals, appointments, clients, deliverCashToProfessional, transactions, getCashRegister } = useData()
  const { toast } = useToast()
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>(professionals[0]?.id || "")
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])

  const professional = professionals.find((p) => p.id === selectedProfessionalId)

  // 1. BLOCK A: ATENCIÓN (Performance) - Based on appointment date
  const atendidosDelDia = appointments.filter((a) => {
    return a.professionalId === selectedProfessionalId && getDateInISO(a.date) === selectedDate && (a.status === "attended" || a.status === "closed")
  })

  // 2. BLOCK B: COBROS (Collections) - Based on collection date
  const dailyPayments: any[] = []
  let totalCash = 0
  let totalTransfers = 0

  appointments.forEach((apt: Appointment) => {
    (apt.payments || []).forEach((p: AppointmentPayment) => {
      if (p.receivedByProfessionalId === selectedProfessionalId) {
        const pDateISO = p.paymentDate ? getDateInISO(p.paymentDate) : getDateInISO(p.createdAt)

        if (pDateISO === selectedDate) {
          const method = (p.paymentMethod || "").trim().toLowerCase()
          const amt = Number(p.amount) || 0
          if (method === "cash" || method === "efectivo") totalCash += amt
          else if (method === "transfer" || method === "transferencia") totalTransfers += amt

          const client = clients.find(c => c.id === apt.clientId)
          dailyPayments.push({
            ...p,
            clientName: client?.name || "Paciente",
            aptTime: apt.startTime
          })
        }
      }
    })

    // Fallback: If no cash payments found in array but fields exist, trust fields
    if (getDateInISO(apt.date) === selectedDate && (apt.status === "attended" || apt.status === "closed")) {
      const profId = apt.professionalIdAtencion || apt.professionalIdCalendario || apt.professionalId
      if (profId === selectedProfessionalId) {
        const cashInPayments = (apt.payments || []).some(p =>
          p.receivedByProfessionalId === selectedProfessionalId &&
          (p.paymentMethod || "").trim().toLowerCase() === "cash" &&
          (p.paymentDate ? getDateInISO(p.paymentDate) : getDateInISO(p.createdAt)) === selectedDate
        )
        if (!cashInPayments && (Number(apt.cashCollected) || 0) > 0) {
          totalCash += Number(apt.cashCollected)
        }

        const transferInPayments = (apt.payments || []).some(p =>
          (p.paymentMethod || "").trim().toLowerCase() === "transfer" &&
          (p.paymentDate ? getDateInISO(p.paymentDate) : getDateInISO(p.createdAt)) === selectedDate
        )
        if (!transferInPayments && Number(apt.transferCollected || 0) > 0) {
          totalTransfers += Number(apt.transferCollected)
        }
      }
    }
  })

  // Subtract withdrawals to show real-time balance
  const profTransactions = (transactions || []).filter((t: any) => {
    if (t.professionalId !== selectedProfessionalId) return false
    return getDateInISO(t.date) === selectedDate && t.type === "professional_withdrawal"
  })

  profTransactions.forEach(t => {
    totalCash += t.amount // Amount is negative for withdrawals
  })

  // Calcular comisión de TENSE (Informativa - Neta)
  const commissionRate = professional?.commissionRate || 35
  const totalBaseRevenue = atendidosDelDia.reduce((sum, a) => sum + (a.basePrice || a.finalPrice || 0), 0)
  const tenseDiscounts = atendidosDelDia.reduce((sum, a) => sum + Math.max(0, (a.basePrice || a.finalPrice || 0) - (a.finalPrice || 0)), 0)
  const tenseCommissionInformativa = Math.max(0, (totalBaseRevenue * commissionRate) / 100 - tenseDiscounts)

  // Arqueo real de la caja (balance actual)
  const cashRegister = getCashRegister("professional", selectedProfessionalId)
  const currentCashBalance = (cashRegister?.openingBalance || 0) + (cashRegister?.transactions || []).reduce((sum: number, t: any) => sum + t.amount, 0)

  const handleDeliverCash = () => {
    deliverCashToProfessional(selectedProfessionalId, totalCash) // Or currentCashBalance if we want real time
    toast({
      title: "Efectivo entregado",
      description: `Se registró la entrega de ${formatCurrency(totalCash)} a ${professional?.name}.`,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Resumen Diario (Caja del Prof.)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Profesional</label>
            <Select value={selectedProfessionalId} onValueChange={setSelectedProfessionalId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar profesional" />
              </SelectTrigger>
              <SelectContent>
                {professionals.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Fecha de Cobro</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full h-10 px-3 border rounded-md text-sm"
            />
          </div>
        </div>

        {professional && (
          <>
            {/* Resumen del día - BLOCK B */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border rounded-md bg-emerald-50 border-emerald-200">
                <div className="flex items-center gap-2 text-emerald-700 mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs font-medium">Cobrado Hoy (Efectivo)</span>
                </div>
                <div className="text-xl font-bold text-emerald-700">{formatCurrency(totalCash)}</div>

                {totalCash > 0 && selectedDate === new Date().toISOString().split("T")[0] && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="w-full mt-2 h-7 text-[10px] border-emerald-300 text-emerald-700 hover:bg-emerald-100">
                        <HandCoins className="h-3 w-3 mr-1" />
                        Entregar efectivo
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar entrega de efectivo?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Se registrará que has entregado físicamente {formatCurrency(totalCash)} a {professional?.name}.
                          Este monto se sumará a su "Efectivo en Mano" acumulado.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeliverCash} className="bg-emerald-600 hover:bg-emerald-700">
                          Confirmar Entrega
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>

              <div className="p-3 border rounded-md bg-blue-50 border-blue-200">
                <div className="flex items-center gap-2 text-blue-700 mb-1">
                  <ArrowRight className="h-4 w-4" />
                  <span className="text-xs font-medium">Cobrado Hoy (Transf.)</span>
                </div>
                <div className="text-xl font-bold text-blue-700">{formatCurrency(totalTransfers)}</div>
              </div>
            </div>

            {/* Efectivo en Mano Acumulado */}
            <div className="p-3 border rounded-md bg-amber-50 border-amber-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-amber-100 italic">
                  <HandCoins className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-800 uppercase">Efectivo Acumulado (En Mano)</span>
                  <p className="text-[10px] text-amber-600 italic">Total entregado pendiente de liquidar</p>
                </div>
              </div>
              <div className="text-xl font-bold text-amber-700">{formatCurrency(professional?.cashInHand || 0)}</div>
            </div>

            {/* Comisión Informativa - BLOCK A */}
            <div className="p-4 bg-sky-50 border border-sky-200 rounded-md">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-sky-800 font-bold uppercase">Comisión TENSE (Informativa)</span>
                  <p className="text-xs text-sky-600">Basado en {atendidosDelDia.length} turnos atendidos. Se liquida mensualmente.</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-sky-700">{formatCurrency(tenseCommissionInformativa)}</div>
                </div>
              </div>
            </div>

            {/* Turnos Atendidos (Block A) */}
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-emerald-800">
                <Calendar className="h-4 w-4" />
                Turnos Prestados hoy ({atendidosDelDia.length})
              </h4>
              <div className="space-y-2 max-h-[150px] overflow-y-auto mb-4">
                {atendidosDelDia.map((apt: Appointment) => {
                  const client = clients.find(c => c.id === apt.clientId)
                  return (
                    <div key={apt.id} className="flex justify-between items-center p-2 border rounded text-xs bg-emerald-50/30">
                      <div>
                        <span className="font-medium">{apt.startTime}</span>
                        <span className="text-muted-foreground ml-2">{client?.name || "Paciente"}</span>
                      </div>
                      <span className="font-bold">{formatCurrency(apt.finalPrice || 0)}</span>
                    </div>
                  )
                })}
                {atendidosDelDia.length === 0 && (
                  <p className="text-center text-muted-foreground text-xs py-2">No hay prestaciones hoy</p>
                )}
              </div>
            </div>

            {/* Cobros Realizados (Block B) */}
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-blue-800">
                <DollarSign className="h-4 w-4" />
                Cobros realizados hoy ({dailyPayments.length})
              </h4>
              <div className="space-y-2 max-h-[150px] overflow-y-auto">
                {dailyPayments.map((p: any) => (
                  <div key={p.id} className="flex justify-between items-center p-2 border rounded text-xs bg-blue-50/30">
                    <div>
                      <span className="font-medium">{p.aptTime || "--:--"}</span>
                      <span className="text-muted-foreground ml-2">{p.clientName}</span>
                      <Badge variant="outline" className="ml-2 scale-75 origin-left">
                        {p.paymentMethod === "cash" ? "EF" : "TR"}
                      </Badge>
                    </div>
                    <span className={`font-bold ${p.paymentMethod === "cash" ? "text-emerald-600" : "text-blue-600"}`}>
                      {formatCurrency(p.amount)}
                    </span>
                  </div>
                ))}
                {dailyPayments.length === 0 && (
                  <p className="text-center text-muted-foreground text-xs py-2">No se registraron cobros hoy</p>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
