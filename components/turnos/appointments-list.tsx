"use client"

import { useState } from "react"
import { useData } from "@/lib/data-context"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDate, formatTime, formatCurrency, statusLabels, statusColors, cn } from "@/lib/utils"
import { AppointmentActions } from "./appointment-actions"
import type { Appointment, AppointmentStatus } from "@/lib/types"
import { Search, Calendar, Clock, User } from "lucide-react"

export function AppointmentsList() {
  const { appointments, clients, services, professionals, selectedProfessionalId } = useData()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all")
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  const filteredAppointments = appointments
    .filter((apt) => {
      if (selectedProfessionalId && apt.professionalId !== selectedProfessionalId) return false
      if (statusFilter === "all") {
        if (apt.status === "cancelled" || apt.status === "follow_up") return false
      } else if (apt.status !== statusFilter) {
        return false
      }

      const client = clients.find((c) => c.id === apt.clientId)
      if (searchTerm && !client?.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
      return true
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const waitlistAppointments = appointments.filter(
    (apt) => apt.status === "pending_deposit" && selectedProfessionalId === apt.professionalId,
  )

  const canceledAppointments = appointments.filter(
    (apt) => apt.status === "no_show" && selectedProfessionalId === apt.professionalId,
  )

  const getClient = (id: string) => clients.find((c) => c.id === id)
  const getService = (id: string) => services.find((s) => s.id === id)
  const getProfessional = (id: string) => professionals.find((p) => p.id === id)

  const AppointmentCard = ({ apt }: { apt: Appointment }) => {
    const client = getClient(apt.clientId)
    const service = getService(apt.serviceId)
    const professional = getProfessional(apt.professionalId)

    return (
      <div
        className="flex items-center justify-between rounded-lg border border-border bg-card p-4 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setSelectedAppointment(apt)}
      >
        <div className="flex items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{client?.name}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(apt.date)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(apt.startTime)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{service?.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-medium">{formatCurrency(apt.totalAmount)}</p>
            {apt.depositAmount > 0 && <p className="text-xs text-success">Seña: {formatCurrency(apt.depositAmount)}</p>}
          </div>
          <Badge variant="outline" className={cn(statusColors[apt.status])}>
            {statusLabels[apt.status]}
          </Badge>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pending">Señas Pendientes ({waitlistAppointments.length})</TabsTrigger>
          <TabsTrigger value="canceled">No Asistidos ({canceledAppointments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Appointments List */}
          <div className="space-y-2">
            {filteredAppointments.length === 0 ? (
              <Card>
                <CardContent className="flex h-32 items-center justify-center">
                  <p className="text-muted-foreground">No se encontraron turnos</p>
                </CardContent>
              </Card>
            ) : (
              filteredAppointments.map((apt) => <AppointmentCard key={apt.id} apt={apt} />)
            )}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-2">
          {waitlistAppointments.length === 0 ? (
            <Card>
              <CardContent className="flex h-32 items-center justify-center">
                <p className="text-muted-foreground">No hay turnos con seña pendiente</p>
              </CardContent>
            </Card>
          ) : (
            waitlistAppointments.map((apt) => <AppointmentCard key={apt.id} apt={apt} />)
          )}
        </TabsContent>

        <TabsContent value="canceled" className="space-y-2">
          {canceledAppointments.length === 0 ? (
            <Card>
              <CardContent className="flex h-32 items-center justify-center">
                <p className="text-muted-foreground">No hay turnos cancelados</p>
              </CardContent>
            </Card>
          ) : (
            canceledAppointments.map((apt) => <AppointmentCard key={apt.id} apt={apt} />)
          )}
        </TabsContent>
      </Tabs>

      {/* Appointment Actions Dialog */}
      {selectedAppointment && (
        <AppointmentActions appointment={selectedAppointment} onClose={() => setSelectedAppointment(null)} />
      )}
    </div>
  )
}
