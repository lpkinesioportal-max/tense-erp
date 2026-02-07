"use client"

import { useState, useMemo } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency } from "@/lib/utils"
import { Calendar, FileText, ArrowRight, AlertCircle, CheckCircle, Download, Check, Trash2, Pencil } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"
import type { CashTransfer, Settlement } from "@/lib/types"
import jsPDF from "jspdf"
import { generateSettlementPDF, generateMonthlySettlementPDF } from "@/lib/pdf-generator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog"

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

export default function LiquidationsPage() {
  const { user, hasPermission } = useAuth()
  const {
    settlements,
    professionals,
    generateSettlement,
    updateSettlementStatus,
    cashTransfers,
    confirmCashTransfer,
    setCashTransfers,
    generateDailySettlement,
    appointments,
    clients,
    serviceConfigs,
    setSettlements, // Assuming setSettlements is available in your data context
    deleteCashTransfer,
    updateCashTransfer,
    addSettlementPayment,
  } = useData()

  const [selectedTab, setSelectedTab] = useState("daily")
  const [selectedProfessionalId, setSelectedProfessionalId] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  // Monthly filters
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedMonthProfId, setSelectedMonthProfId] = useState(() => {
    return professionals.length > 0 ? professionals[0].id : ""
  })

  // Transfer dialog
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [selectedTransferId, setSelectedTransferId] = useState("")
  const [isLoadingTransfer, setIsLoadingTransfer] = useState(false)

  // State for selected daily date and handler function
  const [selectedDailyDate, setSelectedDailyDate] = useState<Date>(new Date())

  // State for selected settlement details dialog
  const [selectedSettlement, setSelectedSettlement] = useState<any>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  // State for delete confirmation dialog
  const [settlementToDelete, setSettlementToDelete] = useState<any>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const [settlementToConfirm, setSettlementToConfirm] = useState<any>(null)
  const [showConfirmStatusDialog, setShowConfirmStatusDialog] = useState(false)

  // Transfer edit/delete state
  const [editingTransfer, setEditingTransfer] = useState<CashTransfer | null>(null)
  const [showEditTransferDialog, setShowEditTransferDialog] = useState(false)
  const [transferToDelete, setTransferToDelete] = useState<CashTransfer | null>(null)
  const [showDeleteTransferDialog, setShowDeleteTransferDialog] = useState(false)

  // Payment dialog state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [settlementToPay, setSettlementToPay] = useState<any>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentNotes, setPaymentNotes] = useState("")

  const handleChargePayment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!settlementToPay || !paymentAmount) return

    const amount = Number(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "El monto debe ser un número válido mayor a 0",
        variant: "destructive",
      })
      return
    }

    addSettlementPayment(settlementToPay.id, amount, paymentNotes)

    toast({
      title: "Pago registrado",
      description: `Se registró el pago de ${formatCurrency(amount)}`,
    })

    setShowPaymentDialog(false)
    setSettlementToPay(null)
    setPaymentAmount("")
    setPaymentNotes("")
  }

  const handleGenerateDailyLiquidation = () => {
    if (!selectedProfessionalId || selectedProfessionalId === "all") {
      toast({
        title: "Error",
        description: "Por favor selecciona un profesional",
        variant: "destructive",
      })
      return
    }

    const result = generateDailySettlement(selectedProfessionalId, selectedDailyDate)
    if (result) {
      toast({
        title: "Éxito",
        description: `Liquidación diaria generada para ${formatDate(selectedDailyDate)}`,
      })
    } else {
      toast({
        title: "Error",
        description: "No se pudo generar la liquidación diaria",
        variant: "destructive",
      })
    }
  }

  const handleGenerateMonthly = () => {
    if (!selectedMonthProfId || dailySettlementsForMonth.length === 0) {
      return
    }

    const newSettlement = generateSettlement(selectedMonthProfId, Number(selectedMonth), Number(selectedYear))
    if (newSettlement) {
      toast({
        title: "Éxito",
        description: `Liquidación mensual generada para ${months[Number(selectedMonth)]} ${selectedYear}`,
      })
      const transferMonth = Number(selectedMonth) + 1
      const transferYear = Number(selectedYear)
      const totalComisionTENSE = dailySettlementsForMonth.reduce((sum, d) => sum + (d.totalTenseCommission || 0), 0)

      const existingIndex = cashTransfers.findIndex(
        (t) => t.profesionalId === selectedMonthProfId && t.month === transferMonth && t.year === transferYear && t.status === "pendiente",
      )

      if (existingIndex >= 0) {
        // Update existing pending transfer
        const updated = [...cashTransfers]
        updated[existingIndex] = {
          ...updated[existingIndex],
          monto: totalComisionTENSE,
          fechaCreacion: new Date()
        }
        setCashTransfers(updated)
      } else {
        // Create new transfer
        const newTransfer: CashTransfer = {
          id: `transfer-${Date.now()}`,
          profesionalId: selectedMonthProfId,
          month: transferMonth,
          year: transferYear,
          monto: totalComisionTENSE,
          status: "pendiente",
          fechaCreacion: new Date(),
        }
        setCashTransfers((prev) => [...prev, newTransfer])
      }

      // Download PDF - pass dailySettlementsForMonth as parameter
      handleDownloadMonthlyLiquidationPdf(newSettlement, dailySettlementsForMonth)
    } else {
      toast({
        title: "Error",
        description: "No se pudo generar la liquidación mensual. Verifique si ya existe una para este periodo.",
        variant: "destructive",
      })
    }
  }

  const handleConfirmTransfer = async (transfer: any) => {
    setIsLoadingTransfer(true)
    try {
      confirmCashTransfer(transfer.id)
      setShowTransferDialog(false)
      setSelectedTransferId("")
    } catch (error) {
      console.error("Error confirming transfer:", error)
    } finally {
      setIsLoadingTransfer(false)
    }
  }

  const handleStatusToggle = (settlement: any) => {
    const newStatus = settlement.status === "pending" ? "paid" : "pending"
    updateSettlementStatus(settlement.id, newStatus)
  }

  const handleDeleteTransfer = (transfer: CashTransfer) => {
    deleteCashTransfer(transfer.id)
    toast({
      title: "Traspaso eliminado",
      description: "El registro de traspaso ha sido eliminado",
    })
    setShowDeleteTransferDialog(false)
    setTransferToDelete(null)
  }

  const handleUpdateTransfer = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTransfer) return

    updateCashTransfer(editingTransfer.id, editingTransfer)
    toast({
      title: "Traspaso actualizado",
      description: "Los datos del traspaso han sido guardados",
    })
    setShowEditTransferDialog(false)
    setEditingTransfer(null)
  }

  const handleDownloadDailyPdf = (settlement: Settlement) => {
    if (!settlement) return

    const professional = professionals.find((p) => p.id === settlement.professionalId)
    if (!professional) return

    generateSettlementPDF(settlement, professional, appointments, clients, serviceConfigs)
  }

  const handleDownloadMonthlyLiquidationPdf = (settlement: Settlement, dailySettlements: Settlement[]) => {
    const professional = professionals.find((p) => p.id === settlement.professionalId)
    if (!professional) return

    generateMonthlySettlementPDF(settlement, professional, dailySettlements)
  }

  // Function to handle settlement deletion
  const handleDeleteSettlement = (settlement: any) => {
    const updatedSettlements = settlements.filter((s) => s.id !== settlement.id)

    // Get the setSettlements function from context - but wait, we need to check if it's exported
    // For now, manually update by filtering and re-saving
    const settlementsToKeep = settlements.filter((s) => s.id !== settlement.id)

    // Save to localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("settlements", JSON.stringify(settlementsToKeep))
    }

    // Force a re-render by updating local state that impacts the displayed settlements
    // We need to trigger a state update - let's use a different approach

    // Update the context state using the provided setter function
    if (setSettlements) {
      setSettlements(settlementsToKeep)
    }

    toast({
      title: "Liquidación eliminada",
      description: "La liquidación diaria ha sido eliminada exitosamente",
    })
    setShowDeleteDialog(false)
    setSettlementToDelete(null)

    // Reload the page to reflect changes
    // window.location.reload() // Removed as it's a disruptive way to update state
  }

  const filteredDailySettlements = useMemo(() => {
    return settlements
      .filter((s) => {
        const isProfMatch = selectedProfessionalId === "all" || s.professionalId === selectedProfessionalId
        const isStatusMatch = filterStatus === "all" || s.status === filterStatus
        const isDaily = s.type === "daily" || (s.type === undefined && s.date !== undefined)
        return isProfMatch && isStatusMatch && isDaily
      })
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0
        const dateB = b.date ? new Date(b.date).getTime() : 0
        return dateB - dateA
      })
  }, [settlements, selectedProfessionalId, filterStatus])

  const filteredMonthlySettlements = useMemo(() => {
    const month = Number(selectedMonth)
    const year = Number(selectedYear)

    return settlements.filter((s) => {
      const isMonthly = s.type === "monthly"
      const isProfMatch =
        selectedMonthProfId === "all" || selectedMonthProfId === "" || s.professionalId === selectedMonthProfId
      const isMonthYearMatch = s.month === month && s.year === year
      return isMonthly && isProfMatch && isMonthYearMatch
    })
  }, [settlements, selectedMonth, selectedYear, selectedMonthProfId])

  const dailySettlementsForMonth = useMemo(() => {
    const month = Number(selectedMonth)
    const year = Number(selectedYear)
    const profId = selectedMonthProfId

    return settlements.filter((s) => {
      const isDaily = s.type === "daily" || (s.type === undefined && s.date !== undefined)
      const isMonthYearMatch = s.month === month && s.year === year
      const isProfMatch = s.professionalId === profId
      return isDaily && isMonthYearMatch && isProfMatch
    })
  }, [settlements, selectedMonth, selectedYear, selectedMonthProfId])

  const transfersForMonth = useMemo(() => {
    const month = Number(selectedMonth) + 1 // Fix: Store uses 1-12
    const year = Number(selectedYear)
    return cashTransfers.filter((t) => Number(t.month) === month && Number(t.year) === year)
  }, [cashTransfers, selectedMonth, selectedYear])

  const getProfessionalName = (id: string) => {
    return professionals.find((p) => p.id === id)?.name || "Desconocido"
  }

  const getStatusBadge = (status: string, settlement?: any) => {
    const isMonthly = settlement?.type === "monthly"

    switch (status) {
      case "pending":
        if (isMonthly) {
          return (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-semibold border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
              onClick={() => {
                setSettlementToPay(settlement)
                setPaymentAmount(((settlement.totalTenseCommission || 0) - (settlement.totalPaid || 0)).toString())
                setPaymentNotes("")
                setShowPaymentDialog(true)
              }}
            >
              Cargar Pago
            </Button>
          )
        }
        return (
          <button
            onClick={() => {
              setSettlementToConfirm(settlement)
              setShowConfirmStatusDialog(true)
            }}
            className="cursor-pointer hover:opacity-75 transition-opacity"
          >
            <Badge variant="outline">Pendiente</Badge>
          </button>
        )
      case "reviewed":
        return <Badge variant="secondary">Revisada</Badge>
      case "paid":
        return <Badge className="bg-green-600">Pagada</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const handleConfirmSettlementStatus = () => {
    if (!settlementToConfirm) return

    // Update settlement status to paid
    updateSettlementStatus(settlementToConfirm.id, "paid")

    const transferMonth = (settlementToConfirm.month || 0) + 1
    const transferYear = settlementToConfirm.year
    const monto = settlementToConfirm.totalTenseCommission || 0

    const existingIndex = cashTransfers.findIndex(
      (t) => t.profesionalId === settlementToConfirm.professionalId && t.month === transferMonth && t.year === transferYear && t.status === "pendiente",
    )

    if (existingIndex >= 0) {
      // Update existing
      const updated = [...cashTransfers]
      updated[existingIndex] = { ...updated[existingIndex], monto, fechaCreacion: new Date() }
      setCashTransfers(updated)
    } else {
      // Create new
      const newTransfer: CashTransfer = {
        id: `transfer-${Date.now()}`,
        profesionalId: settlementToConfirm.professionalId,
        month: transferMonth,
        year: transferYear,
        monto: monto,
        status: "pendiente",
        fechaCreacion: new Date(),
      }
      setCashTransfers((prev) => [...prev, newTransfer])
    }

    toast({
      title: "Liquidación Confirmada",
      description: "La liquidación ha sido confirmada y movida a Traspasos de Caja",
    })

    setShowConfirmStatusDialog(false)
    setSettlementToConfirm(null)
  }

  if (!hasPermission(["super_admin", "admin"])) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">No tienes permiso para acceder a esta página</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Liquidaciones</h1>
          <p className="text-muted-foreground">Gestiona liquidaciones diarias, mensuales y traspasos de caja</p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily">
              <Calendar className="mr-2 h-4 w-4" />
              Liquidaciones Diarias
            </TabsTrigger>
            <TabsTrigger value="monthly">
              <FileText className="mr-2 h-4 w-4" />
              Liquidaciones Mensuales
            </TabsTrigger>
            <TabsTrigger value="transfers">
              <ArrowRight className="mr-2 h-4 w-4" />
              Traspasos de Caja
            </TabsTrigger>
          </TabsList>

          {/* DAILY LIQUIDATIONS TAB */}
          <TabsContent value="daily" className="space-y-6">
            {/* Daily liquidation generation section */}
            <div className="rounded-lg border p-6 space-y-4">
              <h3 className="font-semibold text-lg">Generar Liquidación Diaria</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Profesional</label>
                  <Select value={selectedProfessionalId} onValueChange={setSelectedProfessionalId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {professionals.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Fecha</label>
                  <input
                    type="date"
                    value={selectedDailyDate.toISOString().split("T")[0]}
                    onChange={(e) => setSelectedDailyDate(new Date(e.target.value))}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>

              <Button onClick={handleGenerateDailyLiquidation} className="w-full">
                Generar Liquidación Diaria
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Filtrar Liquidaciones Diarias</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Profesional</Label>
                    <Select value={selectedProfessionalId} onValueChange={setSelectedProfessionalId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar profesional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {professionals.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="reviewed">Revisada</SelectItem>
                        <SelectItem value="paid">Pagada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {filteredDailySettlements.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No hay liquidaciones diarias registradas</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Liquidaciones Diarias Registradas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Profesional</TableHead>
                          <TableHead className="text-right">Turnos Atendidos</TableHead>
                          <TableHead className="text-right">Inasistencias</TableHead>
                          <TableHead className="text-right">Total Facturado</TableHead>
                          <TableHead className="text-right">Comisión Prof.</TableHead>
                          <TableHead className="text-right">Comisión TENSE (Inf.)</TableHead>
                          {/* Acciones column header */}
                          <TableHead className="text-center">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDailySettlements.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium">
                              {s.date ? new Date(s.date).toLocaleDateString("es-AR") : "N/A"}
                            </TableCell>
                            <TableCell>{getProfessionalName(s.professionalId)}</TableCell>
                            <TableCell className="text-right">{s.attendedAppointments || 0}</TableCell>
                            <TableCell className="text-right">{s.noShowAppointments || 0}</TableCell>
                            <TableCell className="text-right text-emerald-600 font-semibold">
                              {formatCurrency(s.baseRevenue || 0)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(s.professionalEarningsAttended || 0)}
                            </TableCell>
                            <TableCell className="text-right text-sky-600 font-semibold">
                              {formatCurrency(s.tenseCommissionAttended || 0)}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSettlement(s)
                                    setShowDetailsDialog(true)
                                  }}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  Ver Detalles
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownloadDailyPdf(s)}
                                  className="text-green-600 hover:text-green-800"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant={s.status === "paid" ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleStatusToggle(s)}
                                  className={s.status === "paid" ? "bg-green-600 hover:bg-green-700" : ""}
                                >
                                  {s.status === "paid" ? <Check className="w-4 h-4" /> : "Pendiente"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSettlementToDelete(s)
                                    setShowDeleteDialog(true)
                                  }}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* MONTHLY LIQUIDATIONS TAB */}
          <TabsContent value="monthly" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Generar Liquidación Mensual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Profesional</Label>
                    <Select value={selectedMonthProfId} onValueChange={setSelectedMonthProfId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar profesional" />
                      </SelectTrigger>
                      <SelectContent>
                        {professionals.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Mes</Label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((m, idx) => (
                          <SelectItem key={idx} value={idx.toString()}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Año</Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2026">2026</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {dailySettlementsForMonth.length === 0 ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                    <AlertCircle className="inline mr-2 h-4 w-4" />
                    No hay liquidaciones diarias para este período
                  </div>
                ) : (
                  <>
                    <Card className="bg-blue-50">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Liquidaciones Diarias</p>
                            <p className="text-2xl font-bold">
                              {dailySettlementsForMonth.length}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Turnos</p>
                            <p className="text-2xl font-bold">
                              {dailySettlementsForMonth.reduce(
                                (sum, d) => sum + (d.attendedAppointments || 0) + (d.noShowAppointments || 0),
                                0,
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Facturación Total</p>
                            <p className="text-2xl font-bold text-green-600">
                              {formatCurrency(
                                dailySettlementsForMonth.reduce((sum, d) => sum + (d.baseRevenue || 0), 0),
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Comisión TENSE</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {formatCurrency(
                                dailySettlementsForMonth.reduce((sum, d) => sum + (d.totalTenseCommission || 0), 0),
                              )}
                            </p>
                          </div>
                        </div>

                        {/* List of included daily settlements */}
                        <div className="mt-6 pt-6 border-t border-blue-200">
                          <p className="text-xs font-bold uppercase text-blue-800 mb-3 flex items-center gap-2">
                            Detalle de días incluídos
                          </p>
                          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                            {dailySettlementsForMonth
                              .sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime())
                              .map((s) => (
                                <div key={s.id} className="flex items-center justify-between bg-white/50 p-2 rounded text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{s.date ? new Date(s.date).toLocaleDateString("es-AR") : "N/A"}</span>
                                    <Badge variant="outline" className="text-[10px] h-4">
                                      {s.attendedAppointments || 0} turnos
                                    </Badge>
                                  </div>
                                  <div className="flex gap-4">
                                    <span className="text-muted-foreground">Fact: {formatCurrency(s.baseRevenue || 0)}</span>
                                    <span className="text-blue-700 font-medium">Tense: {formatCurrency(s.totalTenseCommission || 0)}</span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Button onClick={handleGenerateMonthly} size="lg" className="w-full">
                      Generar Liquidación Mensual
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {filteredMonthlySettlements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Liquidaciones Generadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Profesional</TableHead>
                          <TableHead>Período</TableHead>
                          <TableHead>Fecha Generación</TableHead>
                          <TableHead className="text-right">Facturado</TableHead>
                          <TableHead className="text-right">Comisión Prof.</TableHead>
                          <TableHead className="text-right">Comisión TENSE</TableHead>
                          <TableHead className="text-right">Abonado</TableHead>
                          <TableHead className="text-right font-bold">Saldo</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-center">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMonthlySettlements.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium">{getProfessionalName(s.professionalId)}</TableCell>
                            <TableCell>
                              {months[s.month || 0]} {s.year}
                            </TableCell>
                            <TableCell>
                              {s.createdAt
                                ? new Date(s.createdAt).toLocaleDateString("es-AR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(s.totalFacturado || s.attendedRevenue || 0)}
                            </TableCell>
                            <TableCell className="text-right text-green-600">
                              {formatCurrency(s.professionalEarningsAttended || 0)}
                            </TableCell>
                            <TableCell className="text-right text-blue-600 font-medium">
                              {formatCurrency(s.totalTenseCommission || 0)}
                            </TableCell>
                            <TableCell className="text-right text-emerald-600">
                              {formatCurrency(s.totalPaid || 0)}
                            </TableCell>
                            <TableCell className="text-right font-bold text-slate-900">
                              {formatCurrency(Math.max(0, (s.totalTenseCommission || 0) - (s.totalPaid || 0)))}
                            </TableCell>
                            <TableCell>{getStatusBadge(s.status, s)}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSettlement(s)
                                    setShowDetailsDialog(true)
                                  }}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  Ver Detalles
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    // Calculate dailySettlements for this specific settlement
                                    const dailySettlements = settlements.filter((settlement) => {
                                      const isDaily = settlement.type === "daily" || (settlement.type === undefined && settlement.date !== undefined)
                                      const isMonthYearMatch = settlement.month === s.month && settlement.year === s.year
                                      const isProfMatch = settlement.professionalId === s.professionalId
                                      return isDaily && isMonthYearMatch && isProfMatch
                                    })
                                    handleDownloadMonthlyLiquidationPdf(s, dailySettlements)
                                  }}
                                  className="text-green-600 hover:text-green-800"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSettlementToDelete(s)
                                    setShowDeleteDialog(true)
                                  }}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TRANSFERS TAB */}
          <TabsContent value="transfers" className="space-y-6">
            {transfersForMonth.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No hay traspasos de caja para este período</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Traspasos Pendientes de Confirmar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Profesional</TableHead>
                          <TableHead>Fecha Creación</TableHead>
                          <TableHead>Mes Liquidado</TableHead>
                          <TableHead className="text-right">Monto</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transfersForMonth.map((t) => (
                          <TableRow key={t.id}>
                            <TableCell className="font-medium">{getProfessionalName(t.profesionalId)}</TableCell>
                            <TableCell className="text-muted-foreground italic">
                              {t.fechaCreacion ? formatDate(t.fechaCreacion) : "-"}
                            </TableCell>
                            <TableCell>
                              {months[(Number(t.month) || 1) - 1]} {t.year}
                            </TableCell>
                            <TableCell className="text-right font-bold">{formatCurrency(t.monto)}</TableCell>
                            <TableCell>
                              {t.status === "pendiente" ? (
                                <Badge variant="outline">Pendiente</Badge>
                              ) : (
                                <Badge className="bg-green-600 flex items-center gap-1 w-fit">
                                  <CheckCircle className="h-3 w-3" />
                                  Confirmado
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {t.status === "pendiente" ? (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setSelectedTransferId(t.id)
                                        setShowTransferDialog(true)
                                      }}
                                    >
                                      Confirmar
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-blue-600"
                                      onClick={() => {
                                        setEditingTransfer(t)
                                        setShowEditTransferDialog(true)
                                      }}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <span className="text-sm text-green-600 font-medium mr-2">✓ Confirmado</span>
                                )}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-red-600"
                                  onClick={() => {
                                    setTransferToDelete(t)
                                    setShowDeleteTransferDialog(true)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Transfer Confirmation Dialog */}
        <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Traspaso de Caja</DialogTitle>
            </DialogHeader>
            {selectedTransferId && cashTransfers.find((t) => t.id === selectedTransferId) && (
              <>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Profesional</p>
                    <p className="text-lg font-semibold">
                      {getProfessionalName(cashTransfers.find((t) => t.id === selectedTransferId)?.profesionalId || "")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monto a traspasar</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(cashTransfers.find((t) => t.id === selectedTransferId)?.monto || 0)}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Este monto será trasladado de Caja Profesional a Caja Administrador
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => handleConfirmTransfer(cashTransfers.find((t) => t.id === selectedTransferId))}
                    disabled={isLoadingTransfer}
                  >
                    {isLoadingTransfer ? "Confirmando..." : "Confirmar Operación"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Settlement Details Dialog */}
        {showDetailsDialog && selectedSettlement && (
          <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Detalles de Liquidación Diaria</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Profesional</p>
                    <p className="font-semibold">{getProfessionalName(selectedSettlement.professionalId)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fecha</p>
                    <p className="font-semibold">{new Date(selectedSettlement.date).toLocaleDateString("es-AR")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Turnos Atendidos</p>
                    <p className="font-semibold">{selectedSettlement.attendedAppointments || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Inasistencias</p>
                    <p className="font-semibold">{selectedSettlement.noShowAppointments || 0}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="font-semibold mb-2">Detalles Financieros</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Precio Base Total:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(selectedSettlement.baseRevenue || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Descuentos TENSE:</span>
                      <span className="font-semibold text-red-600">
                        -{formatCurrency(selectedSettlement.discountAmount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Facturado:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(selectedSettlement.attendedRevenue || (selectedSettlement.baseRevenue || 0) - (selectedSettlement.discountAmount || 0))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        Comisión Profesional ({selectedSettlement.professionalPercentage || 65}%):
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(selectedSettlement.professionalEarningsAttended || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-dashed pt-2">
                      <span className="font-medium text-blue-800">COMISIÓN TENSE NETO:</span>
                      <span className="font-bold text-blue-600">
                        {formatCurrency(selectedSettlement.totalTenseCommission || 0)}
                      </span>
                    </div>
                    <p className="text-[10px] text-blue-500 italic mt-1">
                      * TENSE absorbe el 100% de los descuentos aplicados.
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500 mb-2">Estado</p>
                  <p className="font-semibold">
                    {selectedSettlement.status === "paid" ? (
                      <span className="text-green-600">✓ Pagada</span>
                    ) : (
                      <span className="text-yellow-600">Pendiente</span>
                    )}
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Cerrar
                </Button>
                <Button onClick={() => handleDownloadDailyPdf(selectedSettlement)}>
                  <Download className="w-4 h-4 mr-2" />
                  Descargar PDF
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar Liquidación</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de que deseas eliminar esta liquidación diaria? Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteSettlement(settlementToDelete)}
                className="bg-red-600 hover:bg-red-700"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Settlement Status Confirmation Dialog */}
        <AlertDialog open={showConfirmStatusDialog} onOpenChange={setShowConfirmStatusDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Liquidación</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Deseas confirmar esta liquidación? Se creará un movimiento de traspaso de caja del profesional a caja
                administrador.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {settlementToConfirm && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Profesional:</span>
                  <span className="font-semibold">{getProfessionalName(settlementToConfirm.professionalId)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Período:</span>
                  <span className="font-semibold">
                    {months[settlementToConfirm.month || 0]} {settlementToConfirm.year}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monto a Traspasar:</span>
                  <span className="font-semibold text-blue-600">
                    {formatCurrency(settlementToConfirm.totalTenseCommission || 0)}
                  </span>
                </div>
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmSettlementStatus}>Confirmar y Traspasar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {/* Edit Transfer Dialog */}
        <Dialog open={showEditTransferDialog} onOpenChange={setShowEditTransferDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Traspaso de Caja</DialogTitle>
            </DialogHeader>
            {editingTransfer && (
              <form onSubmit={handleUpdateTransfer} className="space-y-4">
                <div className="space-y-2">
                  <Label>Monto</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-8 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={editingTransfer.monto}
                      onChange={(e) => setEditingTransfer({ ...editingTransfer, monto: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mes</Label>
                    <Select
                      value={editingTransfer.month.toString()}
                      onValueChange={(v) => setEditingTransfer({ ...editingTransfer, month: Number(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((m, i) => (
                          <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Año</Label>
                    <input
                      type="number"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={editingTransfer.year}
                      onChange={(e) => setEditingTransfer({ ...editingTransfer, year: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowEditTransferDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Guardar Cambios
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Transfer Confirmation */}
        <AlertDialog open={showDeleteTransferDialog} onOpenChange={setShowDeleteTransferDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar traspaso?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará el registro de traspaso. Si el traspaso ya fue confirmado,
                no se revertirán los movimientos en las cajas automáticas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => transferToDelete && handleDeleteTransfer(transferToDelete)}
                className="bg-red-600 hover:bg-red-700"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {/* PAYMENT DIALOG */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Registrar Pago de Liquidación</DialogTitle>
            </DialogHeader>
            {settlementToPay && (
              <form onSubmit={handleChargePayment} className="space-y-4 pt-4">
                <div className="bg-slate-50 p-4 rounded-lg space-y-2 border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total a Liquidar:</span>
                    <span className="font-semibold">{formatCurrency(settlementToPay.totalTenseCommission || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Abonado hasta ahora:</span>
                    <span className="font-semibold text-emerald-600">{formatCurrency(settlementToPay.totalPaid || 0)}</span>
                  </div>
                  <div className="flex justify-between text-base border-t pt-2 mt-2">
                    <span className="font-bold">Saldo Pendiente:</span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency((settlementToPay.totalTenseCommission || 0) - (settlementToPay.totalPaid || 0))}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Monto que abona el profesional</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="amount"
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="pl-7"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">
                    Si el monto es menor al saldo, la liquidación seguirá pendiente con el saldo restante.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas / Comentarios (Opcional)</Label>
                  <Textarea
                    id="notes"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Ej: Pago en efectivo parte 1..."
                    rows={2}
                  />
                </div>

                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowPaymentDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                    Confirmar Pago
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
