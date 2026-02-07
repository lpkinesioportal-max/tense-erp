"use client"

import { useState, useMemo } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { useData } from "@/lib/data-context"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Users, Activity, AlertCircle, ChevronRight, Filter } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function HistoriaClinicaPage() {
  const { clients, medicalRecords, serviceConfigs } = useData()
  const { hasPermission } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterService, setFilterService] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const safeClients = clients || []
  const safeMedicalRecords = medicalRecords || []
  const safeServices = serviceConfigs || []

  // Get health status for a client
  const getClientHealthStatus = (clientId: string) => {
    const record = safeMedicalRecords.find((r) => r.clientId === clientId)
    return record?.healthStatus || "green"
  }

  // Get last activity date
  const getLastActivity = (clientId: string) => {
    const record = safeMedicalRecords.find((r) => r.clientId === clientId)
    if (record?.lastUpdated) {
      return new Date(record.lastUpdated).toLocaleDateString("es-AR")
    }
    return "Sin actividad"
  }

  // Filter clients
  const filteredClients = useMemo(() => {
    return safeClients.filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.dni?.includes(searchTerm) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase())

      const healthStatus = getClientHealthStatus(client.id)
      const matchesStatus = filterStatus === "all" || healthStatus === filterStatus

      return matchesSearch && matchesStatus
    })
  }, [safeClients, searchTerm, filterStatus, safeMedicalRecords])

  // Stats
  const totalClients = safeClients.length
  const clientsWithRecords = safeMedicalRecords.length
  const alertClients = safeMedicalRecords.filter((r) => r.healthStatus === "red").length
  const warningClients = safeMedicalRecords.filter((r) => r.healthStatus === "yellow").length

  const statusColors = {
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  }

  const statusLabels = {
    green: "Estable",
    yellow: "Atención",
    red: "Alerta",
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Historia Clínica Digital</h1>
            <p className="text-muted-foreground">Gestión integral de fichas clínicas por paciente</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Pacientes</p>
                  <p className="text-2xl font-bold">{totalClients}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-green-500/10 p-3">
                  <Activity className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Con Historia Clínica</p>
                  <p className="text-2xl font-bold">{clientsWithRecords}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-yellow-500/10 p-3">
                  <AlertCircle className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Requieren Atención</p>
                  <p className="text-2xl font-bold">{warningClients}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-red-500/10 p-3">
                  <AlertCircle className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">En Alerta</p>
                  <p className="text-2xl font-bold">{alertClients}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[250px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, DNI o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="green">Estables</SelectItem>
                  <SelectItem value="yellow">Requieren atención</SelectItem>
                  <SelectItem value="red">En alerta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Patients List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => {
            const healthStatus = getClientHealthStatus(client.id)
            const lastActivity = getLastActivity(client.id)
            const hasRecord = safeMedicalRecords.some((r) => r.clientId === client.id)

            return (
              <Link key={client.id} href={`/historia-clinica/${client.id}`}>
                <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {client.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{client.name}</h3>
                          <span className={`h-3 w-3 rounded-full ${statusColors[healthStatus]}`} />
                        </div>

                        <p className="text-sm text-muted-foreground">DNI: {client.dni || "—"}</p>

                        <div className="flex items-center gap-2 mt-2">
                          {hasRecord ? (
                            <Badge variant="outline" className="text-xs">
                              Historia activa
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Sin historia
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">Últ. actividad: {lastActivity}</span>
                        </div>
                      </div>

                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}

          {filteredClients.length === 0 && (
            <div className="col-span-full">
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium">No se encontraron pacientes</h3>
                  <p className="text-sm text-muted-foreground mt-1">Intenta con otros términos de búsqueda</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
