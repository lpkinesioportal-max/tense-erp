"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Shield, UserCog, User } from "lucide-react"

const permissions = [
  { module: "Dashboard", action: "Ver KPIs completos", super_admin: true, admin: true, cliente: false },
  { module: "Dashboard", action: "Ver solo sus citas", super_admin: true, admin: true, cliente: true },
  { module: "Turnos", action: "Crear citas", super_admin: true, admin: true, cliente: false },
  { module: "Turnos", action: "Modificar cualquier cita", super_admin: true, admin: true, cliente: false },
  { module: "Turnos", action: "Ver todas las citas", super_admin: true, admin: true, cliente: false },
  { module: "Turnos", action: "Ver solo sus citas", super_admin: true, admin: true, cliente: true },
  { module: "Caja", action: "Abrir/Cerrar caja", super_admin: true, admin: true, cliente: false },
  { module: "Caja", action: "Registrar transacciones", super_admin: true, admin: true, cliente: false },
  { module: "Caja", action: "Ver historial completo", super_admin: true, admin: false, cliente: false },
  { module: "Caja", action: "Generar liquidaciones", super_admin: true, admin: false, cliente: false },
  { module: "Clientes", action: "Ver todos los clientes", super_admin: true, admin: true, cliente: false },
  { module: "Clientes", action: "Crear/Editar clientes", super_admin: true, admin: true, cliente: false },
  { module: "Clientes", action: "Ver su propio perfil", super_admin: true, admin: true, cliente: true },
  { module: "Usuarios", action: "Ver todos los usuarios", super_admin: true, admin: false, cliente: false },
  { module: "Usuarios", action: "Crear Super Admin", super_admin: true, admin: false, cliente: false },
  { module: "Usuarios", action: "Crear Admin", super_admin: true, admin: false, cliente: false },
  { module: "Usuarios", action: "Crear Cliente", super_admin: true, admin: true, cliente: false },
  { module: "Usuarios", action: "Configurar profesionales", super_admin: true, admin: false, cliente: false },
]

export function PermissionsMatrix() {
  const modules = [...new Set(permissions.map((p) => p.module))]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Matriz de Permisos</CardTitle>
        <CardDescription>Vista de los permisos asignados a cada rol del sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <Shield className="mr-1 h-3 w-3" />
            Super Admin
          </Badge>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <UserCog className="mr-1 h-3 w-3" />
            Admin
          </Badge>
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            <User className="mr-1 h-3 w-3" />
            Cliente
          </Badge>
        </div>

        <div className="space-y-6">
          {modules.map((module) => (
            <div key={module}>
              <h3 className="font-semibold text-lg mb-3 text-primary">{module}</h3>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Acción</th>
                      <th className="text-center p-3 font-medium w-32">Super Admin</th>
                      <th className="text-center p-3 font-medium w-32">Admin</th>
                      <th className="text-center p-3 font-medium w-32">Cliente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permissions
                      .filter((p) => p.module === module)
                      .map((perm, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-3">{perm.action}</td>
                          <td className="text-center p-3">
                            {perm.super_admin ? (
                              <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-400 mx-auto" />
                            )}
                          </td>
                          <td className="text-center p-3">
                            {perm.admin ? (
                              <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-400 mx-auto" />
                            )}
                          </td>
                          <td className="text-center p-3">
                            {perm.cliente ? (
                              <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-400 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
