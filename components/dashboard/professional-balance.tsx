"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useData } from "@/lib/data-context"
import { formatCurrency } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

export function ProfessionalBalance() {
  const { professionals, appointments, settlements } = useData()

  const profStats = professionals.map((prof) => {
    const profAppointments = appointments.filter(
      (a) => a.professionalId === prof.id && (a.status === "attended" || a.status === "closed"),
    )
    const totalRevenue = profAppointments.reduce((sum, a) => sum + a.totalAmount, 0)
    const pendingSettlement = profAppointments.filter((a) => !a.isSettled).reduce((sum, a) => sum + a.totalAmount, 0)
    const commission = pendingSettlement * (prof.commissionRate / 100)

    return {
      id: prof.id,
      name: prof.name,
      totalRevenue,
      pendingSettlement,
      commission,
      commissionRate: prof.commissionRate,
    }
  })

  const maxRevenue = Math.max(...profStats.map((p) => p.totalRevenue), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Saldo por Profesional</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {profStats.map((prof) => (
            <div key={prof.id} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{prof.name}</span>
                <span className="text-muted-foreground">Comisión: {prof.commissionRate}%</span>
              </div>
              <Progress value={(prof.totalRevenue / maxRevenue) * 100} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Facturado: {formatCurrency(prof.totalRevenue)}</span>
                <span>Pendiente: {formatCurrency(prof.commission)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
