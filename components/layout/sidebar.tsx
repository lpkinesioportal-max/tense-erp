"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Calendar,
  Users,
  Wallet,
  LayoutDashboard,
  UserCog,
  Settings,
  ChevronLeft,
  ChevronRight,
  Package,
  Briefcase,
  ShoppingBag,
  ClipboardList,
  BarChart3,
  Newspaper,
  CheckSquare,
  Target,
  Receipt,
  Database,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["super_admin", "admin"] },
  { name: "Turnos", href: "/turnos", icon: Calendar, roles: ["super_admin", "admin", "profesional"] },
  { name: "Pacientes", href: "/clientes", icon: Users, roles: ["super_admin", "admin"] },
  { name: "Historia Clínica", href: "/historia-clinica", icon: ClipboardList, roles: ["super_admin", "profesional"] },
  { name: "Caja", href: "/caja", icon: Wallet, roles: ["super_admin", "admin"] },
  { name: "Liquidaciones", href: "/caja/liquidaciones", icon: Receipt, roles: ["super_admin", "admin"] },
  { name: "Productos", href: "/productos", icon: Package, roles: ["super_admin", "admin"] },
  { name: "Tienda", href: "/tienda", icon: ShoppingBag, roles: ["super_admin", "admin"] },
  { name: "Servicios", href: "/servicios", icon: Briefcase, roles: ["super_admin", "admin"] },
  { name: "Equipo", href: "/usuarios", icon: UserCog, roles: ["super_admin", "admin"] },
  { name: "Tareas Recepción", href: "/tareas-recepcion", icon: CheckSquare, roles: ["super_admin", "admin"] },
  { name: "Tareas Profesionales", href: "/tareas-profesionales", icon: Target, roles: ["super_admin", "profesional"] },
  { name: "Noticias", href: "/noticias", icon: Newspaper, roles: ["super_admin", "admin", "profesional"] },
  { name: "Reportes", href: "/reportes", icon: BarChart3, roles: ["super_admin"] },
  { name: "Configuración", href: "/configuracion", icon: Settings, roles: ["super_admin"] },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, hasPermission } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const filteredNavigation = navigation.filter((item) => hasPermission(item.roles as any))

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {!collapsed && <h1 className="text-lg font-semibold text-foreground">Turnos ERP</h1>}
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="ml-auto">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {filteredNavigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {!collapsed && user && (
        <div className="border-t border-border p-4">
          <div className="text-sm">
            <p className="font-medium text-foreground">{user.name}</p>
            <p className="text-muted-foreground capitalize">{user.role.replace("_", " ")}</p>
          </div>
        </div>
      )}
    </aside>
  )
}
