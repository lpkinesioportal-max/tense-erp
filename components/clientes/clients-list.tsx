"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useData } from "@/lib/data-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Search, Plus, User, Phone, Mail, ChevronRight } from "lucide-react"
import { ClientDialog } from "./client-dialog"
import { ClientProfile } from "./client-profile"
import type { Client } from "@/lib/types"

export function ClientsList() {
  const { clients, appointments } = useData()
  const [searchTerm, setSearchTerm] = useState("")
  const [showNewClientDialog, setShowNewClientDialog] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const search = searchParams.get("search")
    const clientId = searchParams.get("id")

    if (search) {
      setSearchTerm(search)
    }

    if (clientId && clients.length > 0) {
      const client = clients.find(c => c.id === clientId)
      if (client) setSelectedClient(client)
    } else if (search && clients.length > 0) {
      // If we only have search and it's a perfect match for one client, auto-select
      const matches = clients.filter(c =>
        c.name.toLowerCase() === search.toLowerCase() ||
        c.dni === search ||
        c.phone === search
      )
      if (matches.length === 1) {
        setSelectedClient(matches[0])
      }
    }
  }, [searchParams, clients])

  const filteredClients = clients.filter((c) => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      c.name.toLowerCase().includes(searchLower) ||
      c.email.toLowerCase().includes(searchLower) ||
      c.phone.includes(searchTerm)
    )
  })

  const getClientStats = (clientId: string) => {
    const clientAppointments = appointments.filter((a) => a.clientId === clientId)
    const upcomingCount = clientAppointments.filter((a) => new Date(a.date) >= new Date()).length
    const lastAppointment = clientAppointments
      .filter((a) => new Date(a.date) < new Date())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

    return { upcomingCount, lastAppointment }
  }

  if (selectedClient) {
    return <ClientProfile client={selectedClient} onBack={() => setSelectedClient(null)} />
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setShowNewClientDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Clientes</p>
            <p className="text-2xl font-bold">{clients.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Con Saldo a Favor</p>
            <p className="text-2xl font-bold text-success">{clients.filter((c) => c.balance > 0).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Con Deuda</p>
            <p className="text-2xl font-bold text-destructive">{clients.filter((c) => c.balance < 0).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Clients List */}
      <div className="space-y-2">
        {filteredClients.length === 0 ? (
          <Card>
            <CardContent className="flex h-32 items-center justify-center">
              <p className="text-muted-foreground">No se encontraron clientes</p>
            </CardContent>
          </Card>
        ) : (
          filteredClients.map((client) => {
            const stats = getClientStats(client.id)
            return (
              <div
                key={client.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => setSelectedClient(client)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {client.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {client.email}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    {client.balance !== 0 && (
                      <Badge
                        variant="outline"
                        className={
                          client.balance > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                        }
                      >
                        {client.balance > 0 ? "A favor" : "Deuda"}: {formatCurrency(Math.abs(client.balance))}
                      </Badge>
                    )}
                    {stats.upcomingCount > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">{stats.upcomingCount} turnos próximos</p>
                    )}
                    {stats.lastAppointment && (
                      <p className="text-xs text-muted-foreground">
                        Última visita: {formatDate(stats.lastAppointment.date)}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* New Client Dialog */}
      {showNewClientDialog && <ClientDialog onClose={() => setShowNewClientDialog(false)} />}
    </div>
  )
}
