"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { useAuth } from "@/lib/auth-context"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Building2, Shield, ArrowRight, Activity, ClipboardList } from "lucide-react"
import Link from "next/link"

const configSections = [
  {
    title: "Fichas Clínicas",
    description: "Personaliza los cuestionarios de cada servicio",
    icon: ClipboardList,
    href: "/configuracion/fichas-clinicas",
    color: "bg-blue-500",
    roles: ["super_admin", "admin"],
  },
  {
    title: "Servicios",
    description: "Gestionar servicios, precios y packs",
    icon: Activity,
    href: "/servicios",
    color: "bg-green-500",
    roles: ["super_admin", "admin"],
  },
  {
    title: "Profesionales",
    description: "Gestionar profesionales y disponibilidad",
    icon: Users,
    href: "/usuarios?tab=professionals",
    color: "bg-purple-500",
    roles: ["super_admin", "admin"],
  },
  {
    title: "Usuarios",
    description: "Gestionar usuarios y permisos",
    icon: Shield,
    href: "/usuarios",
    color: "bg-orange-500",
    roles: ["super_admin"],
  },
  {
    title: "Empresa",
    description: "Datos de la empresa y configuración general",
    icon: Building2,
    href: "/configuracion/empresa",
    color: "bg-slate-500",
    roles: ["super_admin"],
  },
  {
    title: "Convenios",
    description: "Gestionar obras sociales y descuentos",
    icon: Building2,
    href: "/configuracion/convenios",
    color: "bg-indigo-500",
    roles: ["super_admin", "admin", "recebcion"],
  },
]

export default function ConfiguracionPage() {
  const { user } = useAuth()

  const visibleSections = configSections.filter((section) => section.roles.includes(user?.role || ""))

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Configuración</h1>
          <p className="text-muted-foreground">Administra la configuración del sistema</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleSections.map((section) => {
            const Icon = section.icon
            return (
              <Link key={section.href} href={section.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg ${section.color} text-white`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-lg mt-3">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </AppLayout>
  )
}
