"use client"

import { useState } from "react"
import { useData } from "@/lib/data-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  formatCurrency,
  formatDate,
  formatTime,
  statusLabels,
  statusColors,
  cn,
  transactionTypeLabels,
  paymentMethodLabels,
} from "@/lib/utils"
import { ArrowLeft, Edit, Calendar, DollarSign, Phone, Mail, FileText, Building2 } from "lucide-react"
import { ClientDialog } from "./client-dialog"
import type { Client } from "@/lib/types"

interface ClientProfileProps {
  client: Client
  onBack: () => void
}

export function ClientProfile({ client, onBack }: ClientProfileProps) {
  const { appointments, transactions, serviceConfigs, professionals, covenants } = useData()
  const [showEditDialog, setShowEditDialog] = useState(false)

  const clientCovenant = covenants?.find(c => c.id === client.covenantId)

  const clientAppointments = (appointments || []).filter((a) => a.clientId === client.id)
  const clientTransactions = (transactions || []).filter((t) => t.clientId === client.id)

  const upcomingAppointments = clientAppointments
    .filter((a) => new Date(a.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const pastAppointments = clientAppointments
    .filter((a) => new Date(a.date) < new Date())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const safeServices = serviceConfigs || []
  const safeProfessionals = professionals || []

  const getService = (id: string) => safeServices.find((s) => s.id === id)
  const getProfessional = (id: string) => safeProfessionals.find((p) => p.id === id)

  const totalSpent = clientTransactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
  const pendingDeposits = clientAppointments
    .filter((a) => a.status === "confirmed" && a.depositAmount > 0 && !a.isPaid)
    .reduce((sum, a) => sum + a.depositAmount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{client.name}</h2>
            {clientCovenant && (
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-indigo-200">
                <Building2 className="mr-1 h-3 w-3" />
                {clientCovenant.name}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">Cliente desde {formatDate(client.createdAt)}</p>
        </div>
        <Button variant="outline" onClick={() => setShowEditDialog(true)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Teléfono</p>
                <p className="font-medium">{client.phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium text-sm">{client.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Saldo</p>
                <p
                  className={cn(
                    "font-medium",
                    client.balance > 0 ? "text-success" : client.balance < 0 ? "text-destructive" : "",
                  )}
                >
                  {client.balance > 0 ? "+" : ""}
                  {formatCurrency(client.balance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{clientAppointments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {clientCovenant && (
          <Card className="border-indigo-100 bg-indigo-50/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500 text-white">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">Convenio Activo</p>
                  <p className="font-bold text-indigo-900">{clientCovenant.discountPercentage}% de Descuento</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Notes */}
      {client.notes && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Notas</p>
                <p className="text-sm">{client.notes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Próximos ({upcomingAppointments.length})</TabsTrigger>
          <TabsTrigger value="past">Historial ({pastAppointments.length})</TabsTrigger>
          <TabsTrigger value="payments">Pagos ({clientTransactions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-2">
          {upcomingAppointments.length === 0 ? (
            <Card>
              <CardContent className="flex h-24 items-center justify-center">
                <p className="text-muted-foreground">No hay turnos próximos</p>
              </CardContent>
            </Card>
          ) : (
            upcomingAppointments.map((apt) => {
              const service = getService(apt.serviceId)
              const professional = getProfessional(apt.professionalId)
              return (
                <div
                  key={apt.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-lg font-bold">{new Date(apt.date).getDate()}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(apt.date).toLocaleDateString("es-AR", { month: "short" })}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">{service?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(apt.startTime)} - {professional?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(apt.finalPrice)}</p>
                      {apt.depositAmount > 0 && (
                        <p className="text-xs text-success">Seña: {formatCurrency(apt.depositAmount)}</p>
                      )}
                    </div>
                    <Badge variant="outline" className={cn(statusColors[apt.status])}>
                      {statusLabels[apt.status]}
                    </Badge>
                  </div>
                </div>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-2">
          {pastAppointments.length === 0 ? (
            <Card>
              <CardContent className="flex h-24 items-center justify-center">
                <p className="text-muted-foreground">No hay turnos anteriores</p>
              </CardContent>
            </Card>
          ) : (
            pastAppointments.slice(0, 10).map((apt) => {
              const service = getService(apt.serviceId)
              const professional = getProfessional(apt.professionalId)
              return (
                <div
                  key={apt.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[40px]">
                      <p className="text-lg font-bold">{new Date(apt.date).getDate()}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(apt.date).toLocaleDateString("es-AR", { month: "short" })}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">{service?.name}</p>
                      <p className="text-sm text-muted-foreground">{professional?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-medium">{formatCurrency(apt.finalPrice)}</p>
                    <Badge variant="outline" className={cn(statusColors[apt.status])}>
                      {statusLabels[apt.status]}
                    </Badge>
                  </div>
                </div>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-2">
          {clientTransactions.length === 0 ? (
            <Card>
              <CardContent className="flex h-24 items-center justify-center">
                <p className="text-muted-foreground">No hay pagos registrados</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Pagado</p>
                      <p className="text-xl font-bold text-success">{formatCurrency(totalSpent)}</p>
                    </div>
                    {pendingDeposits > 0 && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Señas Vigentes</p>
                        <p className="text-xl font-bold text-primary">{formatCurrency(pendingDeposits)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              {clientTransactions.slice(0, 10).map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                >
                  <div>
                    <p className="font-medium">{transactionTypeLabels[txn.type]}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(txn.date)} • {paymentMethodLabels[txn.paymentMethod]}
                      {txn.professionalId && (
                        <> • <span className="text-xs italic">A cargo de: {getProfessional(txn.professionalId)?.name || "Profesional"}</span></>
                      )}
                    </p>
                  </div>
                  <p className={cn("font-semibold", txn.amount > 0 ? "text-success" : "text-destructive")}>
                    {txn.amount > 0 ? "+" : ""}
                    {formatCurrency(txn.amount)}
                  </p>
                </div>
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      {showEditDialog && <ClientDialog client={client} onClose={() => setShowEditDialog(false)} />}
    </div>
  )
}
