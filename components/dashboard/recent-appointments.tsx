"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useData } from "@/lib/data-context"
import { formatTime, statusLabels, statusColors, cn } from "@/lib/utils"

export function RecentAppointments() {
  const { appointments, clients, professionals, serviceConfigs } = useData()

  const today = new Date()
  const todayAppointments = (appointments || [])
    .filter((apt) => new Date(apt.date).toDateString() === today.toDateString())
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .slice(0, 5)

  const getClient = (id: string) => (clients || []).find((c) => c.id === id)
  const getProfessional = (id: string) => (professionals || []).find((p) => p.id === id)
  const getService = (id: string) => (serviceConfigs || []).find((s) => s.id === id)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Turnos de Hoy</CardTitle>
      </CardHeader>
      <CardContent>
        {todayAppointments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay turnos programados para hoy</p>
        ) : (
          <div className="space-y-4">
            {todayAppointments.map((apt) => {
              const client = getClient(apt.clientId)
              const professional = getProfessional(apt.professionalId)
              const service = getService(apt.serviceId)

              return (
                <div key={apt.id} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium text-muted-foreground">{formatTime(apt.startTime)}</div>
                    <div>
                      <p className="text-sm font-medium">{client?.name || "Cliente"}</p>
                      <p className="text-xs text-muted-foreground">
                        {professional?.name} - {service?.name}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("text-xs", statusColors[apt.status] || "")}>
                    {statusLabels[apt.status] || apt.status}
                  </Badge>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
