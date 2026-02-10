"use client"

import { useState } from "react"
import { useData } from "@/lib/data-context"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Search,
  Plus,
  MoreHorizontal,
  Shield,
  UserCog,
  User,
  Pencil,
  Trash2,
  Ban,
  CheckCircle,
  Key,
  Stethoscope,
  Calendar,
  Eye,
  EyeOff,
} from "lucide-react"
import type { User as UserType } from "@/lib/types"

interface UsersListProps {
  onEdit: (user: UserType) => void
  onNew: () => void
  onViewProfile: (user: UserType) => void
  onAssignAppointment?: (user: UserType) => void
}

const roleConfig = {
  super_admin: {
    label: "Super Admin",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    icon: Shield,
  },
  admin: { label: "Admin", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", icon: UserCog },
  profesional: {
    label: "Profesional",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    icon: Stethoscope,
  },
  cliente: { label: "Cliente", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200", icon: User },
}

export function UsersList({ onEdit, onNew, onViewProfile, onAssignAppointment }: UsersListProps) {
  const { users, updateUser, deleteUser } = useData()
  const { user: currentUser } = useAuth()
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("staff")
  const [passwordDialog, setPasswordDialog] = useState<{ open: boolean; user: UserType | null }>({
    open: false,
    user: null,
  })
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({})

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase())

    let matchesRole = false
    if (roleFilter === "all") {
      matchesRole = true
    } else if (roleFilter === "staff") {
      matchesRole = user.role !== "cliente"
    } else {
      matchesRole = user.role === roleFilter
    }

    return matchesSearch && matchesRole
  })

  const toggleUserStatus = (user: UserType) => {
    updateUser(user.id, { status: user.status === "active" ? "inactive" : "active" })
  }

  const handleDelete = (user: UserType) => {
    if (user.id === currentUser?.id) return
    if (confirm(`¿Estás seguro de eliminar a ${user.name}?`)) {
      deleteUser(user.id)
    }
  }

  const canManageUser = (targetUser: UserType) => {
    if (currentUser?.role === "super_admin") return true
    if (currentUser?.role === "admin" && targetUser.role === "cliente") return true
    return false
  }

  const handleChangePassword = () => {
    if (newPassword.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres")
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden")
      return
    }
    if (passwordDialog.user) {
      updateUser(passwordDialog.user.id, { password: newPassword })
      setPasswordDialog({ open: false, user: null })
      setNewPassword("")
      setConfirmPassword("")
      setPasswordError("")
    }
  }

  const openPasswordDialog = (user: UserType) => {
    setPasswordDialog({ open: true, user })
    setNewPassword("")
    setConfirmPassword("")
    setPasswordError("")
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Usuarios del Sistema</CardTitle>
          {currentUser?.role !== "cliente" && (
            <Button onClick={onNew}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={roleFilter === "staff" ? "default" : "outline"}
                size="sm"
                onClick={() => setRoleFilter("staff")}
              >
                Personal
              </Button>
              <Button
                variant={roleFilter === "super_admin" ? "default" : "outline"}
                size="sm"
                onClick={() => setRoleFilter("super_admin")}
              >
                Super Admin
              </Button>
              <Button
                variant={roleFilter === "admin" ? "default" : "outline"}
                size="sm"
                onClick={() => setRoleFilter("admin")}
              >
                Admin
              </Button>
              <Button
                variant={roleFilter === "profesional" ? "default" : "outline"}
                size="sm"
                onClick={() => setRoleFilter("profesional")}
              >
                Profesionales
              </Button>
              <Button
                variant={roleFilter === "cliente" ? "default" : "outline"}
                size="sm"
                onClick={() => setRoleFilter("cliente")}
              >
                Clientes con Acceso
              </Button>
              <Button
                variant={roleFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setRoleFilter("all")}
              >
                Muestra Todos
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Contraseña</TableHead>
                  <TableHead>Profesional</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const config = roleConfig[user.role as keyof typeof roleConfig] || roleConfig.cliente
                  const Icon = config.icon
                  const isActive = user.status === "active"
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            {user.id === currentUser?.id && <p className="text-xs text-muted-foreground">(Tú)</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={config.color}>
                          <Icon className="mr-1 h-3 w-3" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isActive ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600 border-red-600">
                            Inactivo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.password ? (
                          <div className="flex items-center gap-1.5">
                            <code className="text-xs bg-slate-100 px-2 py-0.5 rounded font-mono">
                              {visiblePasswords[user.id] ? user.password : '••••••'}
                            </code>
                            <button
                              onClick={() => setVisiblePasswords(prev => ({ ...prev, [user.id]: !prev[user.id] }))}
                              className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded hover:bg-slate-100"
                              title={visiblePasswords[user.id] ? 'Ocultar' : 'Mostrar'}
                            >
                              {visiblePasswords[user.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">Sin clave</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.professionalId ? (
                          <Badge variant="secondary">Sí</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {canManageUser(user) && user.id !== currentUser?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onViewProfile(user)}>
                                <User className="mr-2 h-4 w-4" />
                                Ver Perfil
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onEdit(user)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              {onAssignAppointment && (
                                <DropdownMenuItem onClick={() => onAssignAppointment(user)}>
                                  <Calendar className="mr-2 h-4 w-4" />
                                  Agendar Turno
                                </DropdownMenuItem>
                              )}
                              {currentUser?.role === "super_admin" && (
                                <DropdownMenuItem onClick={() => openPasswordDialog(user)}>
                                  <Key className="mr-2 h-4 w-4" />
                                  Cambiar Contraseña
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => toggleUserStatus(user)}>
                                {isActive ? (
                                  <>
                                    <Ban className="mr-2 h-4 w-4" />
                                    Desactivar
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Activar
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(user)} className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No se encontraron usuarios
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card >

      <Dialog
        open={passwordDialog.open}
        onOpenChange={(open) => setPasswordDialog({ open, user: open ? passwordDialog.user : null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Cambiar contraseña para: <strong>{passwordDialog.user?.name}</strong>
            </p>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  setPasswordError("")
                }}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setPasswordError("")
                }}
                placeholder="Repetir contraseña"
              />
            </div>
            {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialog({ open: false, user: null })}>
              Cancelar
            </Button>
            <Button onClick={handleChangePassword}>Guardar Contraseña</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
