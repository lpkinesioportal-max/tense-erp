"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useData } from "@/lib/data-context"
import { useAuth } from "@/lib/auth-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { User, UserRole } from "@/lib/types"

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
}

export function UserDialog({ open, onOpenChange, user }: UserDialogProps) {
  const { professionals, addUser, updateUser } = useData()
  const { user: currentUser } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    dni: "",
    address: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "cliente" as UserRole,
    professionalId: "",
    isActive: true,
  })
  const [error, setError] = useState("")

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        dni: user.dni || "",
        address: user.address || "",
        phone: user.phone || "",
        password: "",
        confirmPassword: "",
        role: user.role,
        professionalId: user.professionalId || "",
        isActive: user.isActive ?? true,
      })
    } else {
      setFormData({
        name: "",
        email: "",
        dni: "",
        address: "",
        phone: "",
        password: "",
        confirmPassword: "",
        role: "cliente",
        professionalId: "",
        isActive: true,
      })
    }
    setError("")
  }, [user, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      if (formData.password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres")
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Las contraseñas no coinciden")
        return
      }
    }

    if (user) {
      updateUser(user.id, {
        name: formData.name,
        email: formData.email,
        dni: formData.dni,
        address: formData.address,
        phone: formData.phone,
        role: formData.role,
        professionalId: formData.professionalId || undefined,
        isActive: formData.isActive,
      })
    } else {
      addUser({
        name: formData.name,
        email: formData.email,
        dni: formData.dni,
        address: formData.address,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
        professionalId: formData.professionalId || undefined,
        isActive: formData.isActive,
        status: formData.isActive ? "active" : "inactive",
      })
    }

    onOpenChange(false)
  }

  const canAssignRole = (role: string) => {
    if (currentUser?.role === "super_admin") return true
    if (currentUser?.role === "admin" && role === "cliente") return true
    return false
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre Completo</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dni">DNI</Label>
              <Input
                id="dni"
                value={formData.dni}
                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Calle, Número, Depto, Localidad (Opcional)"
            />
          </div>

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

          {!user && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!user}
                  placeholder="Min. 6 caracteres"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required={!user}
                  placeholder="Repetir contraseña"
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select
              value={formData.role}
              onValueChange={(value: "super_admin" | "admin" | "cliente") => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {canAssignRole("super_admin") && <SelectItem value="super_admin">Super Admin</SelectItem>}
                {canAssignRole("admin") && <SelectItem value="admin">Admin</SelectItem>}
                {canAssignRole("super_admin") && <SelectItem value="profesional">Profesional</SelectItem>}
                <SelectItem value="cliente">Cliente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(formData.role === "admin" || formData.role === "super_admin") && (
            <div className="space-y-2">
              <Label htmlFor="professional">Vincular a Profesional</Label>
              <Select
                value={formData.professionalId}
                onValueChange={(value) => setFormData({ ...formData, professionalId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar profesional (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin vincular</SelectItem>
                  {professionals.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.name} - {prof.specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">Usuario Activo</Label>
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
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {user ? "Guardar Cambios" : "Crear Usuario"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
