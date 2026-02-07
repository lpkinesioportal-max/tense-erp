"use client"

import { useState } from "react"
import { useData } from "@/lib/data-context"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Calendar, XCircle, Eye } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { getServiceColor, colorClasses } from "@/lib/service-colors"
import { AppointmentDetailModal } from "./appointment-detail-modal"
import { Button } from "@/components/ui/button"
import type { Appointment } from "@/lib/types"


export function CancelledList() {
  const { appointments, clients, professionals, serviceConfigs } = useData()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)


  // Get cancelled appointments
  const cancelledAppointments = (appointments || []).filter((a) => a.status === "cancelled")

  // Filter by search
  const filteredAppointments = cancelledAppointments.filter((apt) => {
    const client = (clients || []).find((c) => c.id === apt.clientId)
    const professional = (professionals || []).find((p) => p.id === apt.professionalId)
    const searchLower = searchTerm.toLowerCase()
    return client?.name.toLowerCase().includes(searchLower) || professional?.name.toLowerCase().includes(searchLower)
  })

  const getClient = (clientId: string) => (clients || []).find((c) => c.id === clientId)
  const getProfessional = (professionalId: string) => (professionals || []).find((p) => p.id === professionalId)
  const getService = (serviceId: string) => (serviceConfigs || []).find((s) => s.id === serviceId)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente o profesional..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha original</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Profesional</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Motivo cancelación</TableHead>
                <TableHead className="text-right">Seña perdida</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay turnos cancelados
                  </TableCell>
                </TableRow>
              ) : (
                filteredAppointments.map((apt) => {
                  const client = getClient(apt.clientId)
                  const professional = getProfessional(apt.professionalId)
                  const service = getService(apt.serviceId)
                  const serviceColor = getServiceColor(service?.color)
                  const colorClass = serviceColor.bg


                  return (
                    <TableRow key={apt.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {format(new Date(apt.date), "EEEE d 'de' MMMM", { locale: es })}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {apt.startTime} - {apt.endTime}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="font-medium">{client?.name || "Cliente no encontrado"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />
                          {professional?.name || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />
                          {service?.name || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm max-w-[200px] truncate text-muted-foreground">
                          {apt.cancelReason || "Sin motivo especificado"}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        {apt.depositAmount > 0 ? (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            {formatCurrency(apt.depositAmount)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedAppointment(apt)}
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4 text-sky-600" />
                        </Button>
                      </TableCell>
                    </TableRow>

                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          isOpen={!!selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
    </div>
  )
}
