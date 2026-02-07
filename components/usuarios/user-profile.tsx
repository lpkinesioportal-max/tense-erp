"use client"

import { useData } from "@/lib/data-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Mail, Shield, UserCog, UserIcon, Calendar, Briefcase } from "lucide-react"
import type { User } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

interface UserProfileProps {
  user: User
  onBack: () => void
}

const roleConfig = {
  super_admin: { label: "Super Admin", color: "bg-red-100 text-red-800", icon: Shield },
  admin: { label: "Admin", color: "bg-blue-100 text-blue-800", icon: UserCog },
  cliente: { label: "Cliente", color: "bg-gray-100 text-gray-800", icon: UserIcon },
}

export function UserProfile({ user, onBack }: UserProfileProps) {
  const { professionals, appointments, transactions } = useData()

  const linkedProfessional = user.professionalId ? professionals.find((p) => p.id === user.professionalId) : null

  const config = roleConfig[user.role]
  const Icon = config.icon

  // Stats for admins/professionals
  const profAppointments = linkedProfessional
    ? appointments.filter((a) => a.professionalId === linkedProfessional.id)
    : []

  const totalRevenue = linkedProfessional
    ? profAppointments.filter((a) => a.paymentStatus === "pagado").reduce((sum, a) => sum + a.price, 0)
    : 0

  const pendingCommission = linkedProfessional
    ? profAppointments
      .filter((a) => a.paymentStatus === "pagado")
      .reduce((sum, a) => sum + a.price * (linkedProfessional.commissionRate / 100), 0)
    : 0

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a Usuarios
      </Button>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold">{user.name}</h2>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <Mail className="h-4 w-4" />
                {user.email}
              </div>
              <Badge variant="secondary" className={`mt-3 ${config.color}`}>
                <Icon className="mr-1 h-3 w-3" />
                {config.label}
              </Badge>
              <Badge
                variant="outline"
                className={`mt-2 ${user.isActive ? "text-green-600 border-green-600" : "text-red-600 border-red-600"}`}
              >
                {user.isActive ? "Activo" : "Inactivo"}
              </Badge>
            </div>

            <Separator className="my-6" />

            {linkedProfessional && (
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Profesional Vinculado
                </h3>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="font-medium">{linkedProfessional.name}</p>
                  <p className="text-sm text-muted-foreground">{linkedProfessional.specialty}</p>
                  <p className="text-sm mt-1">Comisión Prof.: {linkedProfessional.commissionRate}%</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Información del Usuario</CardTitle>
          </CardHeader>
          <CardContent>
            {linkedProfessional ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Total Citas</p>
                    <p className="text-2xl font-bold">{profAppointments.length}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Ingresos Generados</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Comisión Pendiente</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(pendingCommission)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Últimas Citas</h4>
                  <div className="space-y-2">
                    {profAppointments.slice(0, 5).map((apt) => (
                      <div key={apt.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{apt.clientName}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(apt.date).toLocaleDateString("es-AR")} - {apt.time}
                            </p>
                          </div>
                        </div>
                        <Badge variant={apt.status === "completado" ? "default" : "secondary"}>{apt.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <UserIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Este usuario no está vinculado a un profesional</p>
                <p className="text-sm">Los usuarios vinculados pueden ver estadísticas de sus citas</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
