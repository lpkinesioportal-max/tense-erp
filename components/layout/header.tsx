"use client"

import { Bell, LogOut, User, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter, usePathname } from "next/navigation"
import { getServiceColor, SERVICE_COLOR_MAP } from "@/lib/service-colors"

export function Header() {
  const { user, logout, hasPermission } = useAuth()
  const { users, professionals, selectedProfessionalId, setSelectedProfessionalId, selectedProfessionalIds, setSelectedProfessionalIds, toggleProfessionalSelection, serviceConfigs } = useData()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const isProfessional = user?.role === "profesional"
  const isOnPortal = pathname === "/mi-portal"

  const getColorForProfessional = (specialty: string) => {
    if (!specialty || !serviceConfigs || serviceConfigs.length === 0) {
      return getServiceColor(undefined)
    }

    // Find the service that matches the professional's specialty
    const service = serviceConfigs.find((s) => s.name.toLowerCase().trim() === specialty.toLowerCase().trim())

    // Debug log to verify matching
    console.log("[v0] Header getColorForProfessional:", {
      specialty,
      foundService: service?.name,
      serviceColor: service?.color,
      allServices: serviceConfigs.map((s) => ({ name: s.name, color: s.color })),
    })

    // Return the color from the service, or default
    if (service?.color && SERVICE_COLOR_MAP[service.color]) {
      return SERVICE_COLOR_MAP[service.color]
    }
    return getServiceColor(undefined)
  }

  const selectedProfessional = (professionals || []).find((p) => p.id === selectedProfessionalId)
  const selectedColor = selectedProfessional ? getColorForProfessional(selectedProfessional.specialty) : null

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-4">
        {isProfessional && !isOnPortal && (
          <Button
            variant="default"
            size="sm"
            className="bg-sky-600 hover:bg-sky-700"
            onClick={() => router.push("/mi-portal")}
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Panel del Profesional
          </Button>
        )}

        {hasPermission(["super_admin", "admin"]) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-[250px] justify-between">
                <div className="flex items-center gap-2 truncate">
                  {selectedProfessionalIds.length === 0 ? (
                    <span className="text-muted-foreground">Seleccionar profesionales</span>
                  ) : selectedProfessionalIds.length === 1 ? (
                    <>
                      {selectedColor && <span className={`w-3 h-3 rounded-full ${selectedColor.bg} shrink-0`} />}
                      <span className="truncate">{selectedProfessional?.name}</span>
                    </>
                  ) : (
                    <span className="font-medium text-primary">
                      {selectedProfessionalIds.length} profesionales seleccionados
                    </span>
                  )}
                </div>
                <Bell className="h-4 w-4 opacity-50 ml-2 rotate-90" /> {/* Placeholder icon for arrow */}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[300px] max-h-[400px] overflow-y-auto" align="start">
              <DropdownMenuLabel>Profesionales activos</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(professionals || [])
                .filter((prof) => prof.status === "active" && prof.isActive)
                .map((prof) => {
                  const color = getColorForProfessional(prof.specialty)
                  const isChecked = selectedProfessionalIds.includes(prof.id)
                  return (
                    <div
                      key={prof.id}
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-accent transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleProfessionalSelection(prof.id);
                      }}
                    >
                      <div className="pointer-events-none">
                        <Checkbox checked={isChecked} />
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <span className={`w-3 h-3 rounded-full ${color.bg} shrink-0`} />
                        <span className="text-sm font-medium">{prof.name}</span>
                        <span className={`text-[10px] ${color.text} ml-auto`}>({prof.specialty})</span>
                      </div>
                    </div>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
            3
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user?.name}</span>
                <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
