"use client"

import { useState } from "react"
import { useData } from "@/lib/data-context"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Calendar, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { getServiceColor, colorClasses } from "@/lib/service-colors"
import type { WaitlistPriority } from "@/lib/types"

export function WaitlistView() {
  const { waitlist, clients, professionals, serviceConfigs, addToWaitlist, removeFromWaitlist } = useData()
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    clientId: "",
    serviceId: "",
    professionalId: "",
    priority: "media" as WaitlistPriority,
    notes: "",
  })

  // Filter by search
  const filteredWaitlist = (waitlist || []).filter((entry) => {
    const client = (clients || []).find((c) => c.id === entry.clientId)
    const searchLower = searchTerm.toLowerCase()
    return client?.name.toLowerCase().includes(searchLower)
  })

  const getClient = (clientId: string) => (clients || []).find((c) => c.id === clientId)
  const getService = (serviceId: string) => (serviceConfigs || []).find((s) => s.id === serviceId)

  const handleSubmit = () => {
    if (!formData.clientId || !formData.serviceId) return

    addToWaitlist({
      clientId: formData.clientId,
      serviceId: formData.serviceId,
      professionalId: formData.professionalId || undefined,
      priority: formData.priority,
      notes: formData.notes,
      requestedAt: new Date(),
    })

    setFormData({
      clientId: "",
      serviceId: "",
      professionalId: "",
      priority: "media",
      notes: "",
    })
    setDialogOpen(false)
  }

  const getPriorityBadge = (priority: WaitlistPriority) => {
    switch (priority) {
      case "alta":
        return <Badge className="bg-red-100 text-red-700 border-red-200">Alta</Badge>
      case "media":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Media</Badge>
      case "baja":
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Baja</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Add button */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar nombre de cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-sky-500 hover:bg-sky-600">
              <Plus className="mr-2 h-4 w-4" />
              Agregar a lista de espera
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar a lista de espera</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {(clients || []).map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Servicio *</Label>
                <Select
                  value={formData.serviceId}
                  onValueChange={(value) => setFormData({ ...formData, serviceId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {(serviceConfigs || [])
                      .filter((s) => s.isActive)
                      .map((service) => {
                        const serviceColor = service.color || "gray"
                        const colorClass = colorClasses[serviceColor] || colorClasses.gray
                        return (
                          <SelectItem key={service.id} value={service.id}>
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />
                              {service.name}
                            </div>
                          </SelectItem>
                        )
                      })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Profesional preferido (opcional)</Label>
                <Select
                  value={formData.professionalId}
                  onValueChange={(value) => setFormData({ ...formData, professionalId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin preferencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin preferencia</SelectItem>
                    {(professionals || [])
                      .filter((p) => p.isActive)
                      .map((prof) => (
                        <SelectItem key={prof.id} value={prof.id}>
                          {prof.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: WaitlistPriority) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="baja">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Condiciones / Comentarios</Label>
                <Textarea
                  placeholder="Ej: Cualquier día, 18:45hs o 20:00hs..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.clientId || !formData.serviceId}
                  className="bg-sky-500 hover:bg-sky-600"
                >
                  Agregar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha y hora</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Último comentario</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWaitlist.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay clientes en lista de espera
                  </TableCell>
                </TableRow>
              ) : (
                filteredWaitlist.map((entry) => {
                  const client = getClient(entry.clientId)
                  const service = getService(entry.serviceId)
                  const serviceColor = getServiceColor(service?.name || "", serviceConfigs || [])
                  const colorClass = colorClasses[serviceColor] || colorClasses.gray

                  return (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {format(new Date(entry.requestedAt), "EEEE d 'de' MMMM", { locale: es })}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              a las {format(new Date(entry.requestedAt), "HH:mm")}hs
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{client?.name || "Cliente no encontrado"}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />
                          {service?.name || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(entry.priority)}</TableCell>
                      <TableCell>
                        <p className="text-sm max-w-[200px] truncate text-muted-foreground">{entry.notes || "-"}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="default" className="bg-sky-500 hover:bg-sky-600">
                            Ver turno
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removeFromWaitlist(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
