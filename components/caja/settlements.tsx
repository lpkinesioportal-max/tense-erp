"use client"

import { useState } from "react"
import { useData } from "@/lib/data-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"
import { Plus, Check, FileText, DollarSign } from "lucide-react"

const months = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

export function Settlements() {
  const { settlements, professionals, appointments, generateSettlement } = useData()
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [selectedProfessional, setSelectedProfessional] = useState("")
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString())
  const [selectedYear] = useState(new Date().getFullYear())

  const handleGenerate = () => {
    if (!selectedProfessional) return
    generateSettlement(selectedProfessional, Number(selectedMonth), selectedYear)
    setShowGenerateDialog(false)
    setSelectedProfessional("")
  }

  const getProfessional = (id: string) => professionals.find((p) => p.id === id)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "generated":
        return "bg-warning/20 text-warning-foreground border-warning"
      case "reviewed":
        return "bg-primary/20 text-primary border-primary"
      case "paid":
        return "bg-success/20 text-success border-success"
      default:
        return ""
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "generated":
        return "Generada"
      case "reviewed":
        return "Revisada"
      case "paid":
        return "Pagada"
      default:
        return status
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Liquidaciones</CardTitle>
          <Button size="sm" onClick={() => setShowGenerateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Generar
          </Button>
        </CardHeader>
        <CardContent>
          {settlements.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No hay liquidaciones</p>
          ) : (
            <div className="space-y-3">
              {settlements.map((s) => {
                const professional = getProfessional(s.professionalId)
                return (
                  <div key={s.id} className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{professional?.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {months[s.month]} {s.year}
                        </p>
                      </div>
                      <Badge variant="outline" className={getStatusColor(s.status)}>
                        {getStatusLabel(s.status)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{s.totalAppointments} turnos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>Facturado: {formatCurrency(s.totalRevenue)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Comisión profesional</p>
                        <p className="font-semibold text-primary">{formatCurrency(s.commissionAmount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Margen negocio</p>
                        <p className="font-semibold text-success">{formatCurrency(s.businessMargin)}</p>
                      </div>
                    </div>

                    {s.status !== "paid" && (
                      <div className="flex gap-2 pt-2">
                        {s.status === "generated" && (
                          <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                            <Check className="mr-2 h-4 w-4" />
                            Marcar Revisada
                          </Button>
                        )}
                        {s.status === "reviewed" && (
                          <Button size="sm" className="flex-1">
                            <DollarSign className="mr-2 h-4 w-4" />
                            Marcar Pagada
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar Liquidación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Profesional</label>
              <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar profesional" />
                </SelectTrigger>
                <SelectContent>
                  {professionals.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.commissionRate}% comisión)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Mes</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground">
                Se calcularán los turnos atendidos/cerrados del período seleccionado y se aplicará la comisión
                configurada para el profesional.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGenerate} disabled={!selectedProfessional}>
              Generar Liquidación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
