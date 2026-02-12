"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useData } from "@/lib/data-context"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Pencil, Trash2, Percent, Calendar, Eye, EyeOff, Lock } from "lucide-react"
import type { Professional, ProfessionalAvailability } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { ProfessionalAvailabilityConfig } from "./professional-availability"
import { getServiceColor, SERVICE_COLOR_MAP } from "@/lib/service-colors"

export function ProfessionalsConfig() {
  const { users, professionals, appointments, serviceConfigs, addProfessional, updateProfessional, deleteProfessional } =
    useData()
  const { user } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false)
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null)
  const [configuringAvailability, setConfiguringAvailability] = useState<Professional | null>(null)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({})
  const [showFormPassword, setShowFormPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialty: "",
    commissionRate: 35,
    isActive: true,
    password: "",
  })

  const canManagePasswords = user?.role === "super_admin" || user?.role === "admin"

  useEffect(() => {
    console.log(
      "[v0] ProfessionalsConfig - user:",
      user?.name,
      "role:",
      user?.role,
      "canManagePasswords:",
      canManagePasswords,
    )
  }, [user, canManagePasswords])

  const getColorForService = (serviceName: string) => {
    if (!serviceName || !serviceConfigs || serviceConfigs.length === 0) return getServiceColor(undefined)
    const service = serviceConfigs.find((s) => s.name.toLowerCase().trim() === serviceName.toLowerCase().trim())
    return getServiceColor(service?.color)
  }

  const openNewDialog = () => {
    setEditingProfessional(null)
    setFormData({ name: "", email: "", phone: "", specialty: "", commissionRate: 35, isActive: true, password: "" })
    setShowFormPassword(false)
    setDialogOpen(true)
  }

  const openEditDialog = (prof: Professional) => {
    setEditingProfessional(prof)
    setFormData({
      name: prof.name,
      email: prof.email,
      phone: prof.phone,
      specialty: prof.specialty,
      commissionRate: prof.commissionRate,
      isActive: prof.isActive,
      password: prof.password || "",
    })
    setShowFormPassword(false)
    setDialogOpen(true)
  }

  const openAvailabilityDialog = (prof: Professional) => {
    setConfiguringAvailability(prof)
    setAvailabilityDialogOpen(true)
  }

  const handleSaveAvailability = (availability: ProfessionalAvailability) => {
    if (configuringAvailability) {
      updateProfessional(configuringAvailability.id, { availability })
    }
    setAvailabilityDialogOpen(false)
    setConfiguringAvailability(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingProfessional) {
      updateProfessional(editingProfessional.id, {
        ...formData,
        password: formData.password || editingProfessional.password,
      })
    } else {
      addProfessional({
        ...formData,
        password: formData.password,
        workingHours: { start: "09:00", end: "18:00" },
        standardDuration: 60,
        nonWorkingDays: [0, 6],
        services: [],
        status: formData.isActive ? "active" : "inactive",
        availability: {
          slotDuration: 60,
          schedule: [1, 2, 3, 4, 5].map((day) => ({
            dayOfWeek: day,
            isActive: true,
            slots: [],
          })),
        },
      })
    }
    setDialogOpen(false)
  }

  const handleDelete = (prof: Professional) => {
    if (confirm(`¿Estás seguro de eliminar a ${prof.name}?`)) {
      deleteProfessional(prof.id)
    }
  }

  const getProfessionalStats = (profId: string) => {
    const profAppointments = (appointments || []).filter((a) => a.professionalId === profId)
    const completed = profAppointments.filter((a) => a.status === "attended").length
    const revenue = profAppointments.filter((a) => a.isPaid).reduce((sum, a) => sum + (a.finalPrice || 0), 0)
    return { appointments: profAppointments.length, completed, revenue }
  }

  const getAvailabilityCount = (prof: Professional) => {
    if (!prof.availability) return 0
    return prof.availability.schedule.reduce((total, day) => {
      if (day.isActive) {
        return total + day.slots.length
      }
      return total
    }, 0)
  }

  const togglePasswordVisibility = (profId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [profId]: !prev[profId],
    }))
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Configuración de Profesionales</CardTitle>
          <Button onClick={openNewDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Profesional
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profesional</TableHead>
                  <TableHead>Especialidad</TableHead>
                  {canManagePasswords && <TableHead>Contraseña</TableHead>}
                  <TableHead>Comisión TENSE</TableHead>
                  <TableHead>Turnos Configurados</TableHead>
                  <TableHead>Citas</TableHead>
                  <TableHead>Ingresos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(professionals || [])
                  .map((prof) => {
                    const stats = getProfessionalStats(prof.id)
                    const availabilityCount = getAvailabilityCount(prof)
                    const color = getColorForService(prof.specialty)
                    return (
                      <TableRow key={prof.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${color.bg} shrink-0`} />
                            <div>
                              <div className="font-medium">{prof.name}</div>
                              <div className="text-xs text-muted-foreground">{prof.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${color.bg} shrink-0`} />
                            <span>{prof.specialty || "Sin asignar"}</span>
                          </div>
                        </TableCell>
                        {canManagePasswords && (
                          <TableCell>
                            {prof.password ? (
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                  {visiblePasswords[prof.id] ? prof.password : "••••••••"}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => togglePasswordVisibility(prof.id)}
                                >
                                  {visiblePasswords[prof.id] ? (
                                    <EyeOff className="h-3 w-3" />
                                  ) : (
                                    <Eye className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Sin contraseña</span>
                            )}
                          </TableCell>
                        )}
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            <Percent className="mr-1 h-3 w-3" />
                            {prof.commissionRate}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1 bg-transparent"
                            onClick={() => openAvailabilityDialog(prof)}
                          >
                            <Calendar className="h-3 w-3" />
                            {availabilityCount > 0 ? `${availabilityCount} turnos/semana` : "Configurar"}
                          </Button>
                        </TableCell>
                        <TableCell>
                          {stats.completed}/{stats.appointments}
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">{formatCurrency(stats.revenue)}</TableCell>
                        <TableCell>
                          {prof.isActive ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Activo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600 border-red-600">
                              Inactivo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(prof)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(prof)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProfessional ? "Editar Profesional" : "Nuevo Profesional"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              {!editingProfessional ? (
                <Select
                  value={formData.email} // Usamos email como valor único para identificar al usuario
                  onValueChange={(email) => {
                    const selectedUser = users.find(u => u.email === email)
                    if (selectedUser) {
                      setFormData({
                        ...formData,
                        name: selectedUser.name,
                        email: selectedUser.email,
                        phone: selectedUser.phone || "",
                      })
                    }
                  }}
                >
                  <SelectTrigger id="name">
                    <SelectValue placeholder="Seleccionar usuario profesional" />
                  </SelectTrigger>
                  <SelectContent>
                    {(users || [])
                      .filter((u) => u.role === "profesional" && !professionals.some(p => p.email === u.email))
                      .map((u) => (
                        <SelectItem key={u.id} value={u.email}>
                          {u.name} ({u.email})
                        </SelectItem>
                      ))}
                    {(users || []).filter((u) => u.role === "profesional" && !professionals.some(p => p.email === u.email)).length === 0 && (
                      <p className="text-xs text-center p-2 text-muted-foreground">No hay usuarios profesionales disponibles</p>
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña para Iniciar Sesión</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showFormPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-9 pr-10"
                  placeholder={editingProfessional ? "Dejar vacío para mantener actual" : "Contraseña"}
                  required={!editingProfessional}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowFormPassword(!showFormPassword)}
                >
                  {showFormPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                El profesional usará esta contraseña junto con su email para iniciar sesión
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty">Servicio / Especialidad</Label>
              <Select
                value={formData.specialty}
                onValueChange={(value) => setFormData({ ...formData, specialty: value })}
              >
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    {formData.specialty && (
                      <span className={`w-3 h-3 rounded-full ${getColorForService(formData.specialty).bg} shrink-0`} />
                    )}
                    <SelectValue placeholder="Seleccionar servicio" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {(serviceConfigs || [])
                    .filter((s) => s.isActive)
                    .map((service) => {
                      const serviceColor =
                        service.color && SERVICE_COLOR_MAP[service.color]
                          ? SERVICE_COLOR_MAP[service.color]
                          : getServiceColor(undefined)
                      return (
                        <SelectItem key={service.id} value={service.name}>
                          <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${serviceColor.bg} shrink-0`} />
                            <span>{service.name}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="commission">Comisión TENSE (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="commission"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.commissionRate}
                  onChange={(e) => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
                  required
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Porcentaje que cobra TENSE. El profesional recibe el {100 - formData.commissionRate}%
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Profesional Activo</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                {editingProfessional ? "Guardar" : "Crear"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={availabilityDialogOpen} onOpenChange={setAvailabilityDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurar Disponibilidad</DialogTitle>
          </DialogHeader>
          {configuringAvailability && (
            <ProfessionalAvailabilityConfig professional={configuringAvailability} onSave={handleSaveAvailability} />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
