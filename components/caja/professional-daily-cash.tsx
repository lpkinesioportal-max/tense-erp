"use client"

import { useState } from "react"
import { useData } from "@/lib/data-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
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
    const aptDate = new Date(a.date).toISOString().split("T")[0]
    return a.professionalId === selectedProfessionalId && aptDate === selectedDate && (a.status === "attended" || a.status === "closed")
  })

  // 2. BLOCK B: COBROS (Collections) - Based on collection date
  const dailyPayments: any[] = []
  let totalCash = 0
  let totalTransfers = 0

  appointments.forEach((apt: Appointment) => {
    (apt.payments || []).forEach((p: AppointmentPayment) => {
      if (p.receivedByProfessionalId === selectedProfessionalId) {
        const pDate = p.paymentDate ? new Date(p.paymentDate).toISOString().split("T")[0] : new Date(p.createdAt).toISOString().split("T")[0]
        if (pDate === selectedDate) {
          if (p.paymentMethod === "cash") totalCash += p.amount
          else if (p.paymentMethod === "transfer") totalTransfers += p.amount

          const client = clients.find(c => c.id === apt.clientId)
          dailyPayments.push({
            ...p,
            clientName: client?.name || "Paciente",
            aptTime: apt.startTime
          })
        }
      }
    })
  })

  // Subtract withdrawals to show real-time balance
  const profTransactions = (transactions || []).filter((t: any) => {
    if (t.professionalId !== selectedProfessionalId) return false
    const tDate = new Date(t.date).toISOString().split("T")[0]
    return tDate === selectedDate && t.type === "professional_withdrawal"
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
                  <span className="text-xs font-medium">Efectivo (Entregado al Prof.)</span>
                </div>
                <div className="text-xl font-bold text-emerald-700">{formatCurrency(totalCash)}</div>

                {totalCash > 0 && selectedDate === new Date().toISOString().split("T")[0] && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="w-full mt-2 h-7 text-[10px] border-emerald-300 text-emerald-700 hover:bg-emerald-100">
                        <HandCoins className="h-3 w-3 mr-1" />
                        Dar efectivo al Prof.
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar entrega de efectivo?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Se registrará que has entregado físicamente {formatCurrency(totalCash)} a {professional?.name}.
                          Este movimiento dejará la caja de hoy en $0.
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
                  <span className="text-xs font-medium">Transferencia (Directo al Prof.)</span>
                </div>
                <div className="text-xl font-bold text-blue-700">{formatCurrency(totalTransfers)}</div>
              </div>
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
