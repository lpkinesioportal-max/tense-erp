"use client"

import { useState, useRef } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { useData } from "@/lib/data-context"
import { useAuth } from "@/lib/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, getDateInISO, parseISODate } from "@/lib/utils"

import {
  Lock,
  Building2,
  Users,
  ShoppingBag,
  Calendar,
  Wallet,
  FileText,
  Download,
  Check,
  Clock,
  AlertCircle,
  CheckCircle,
  Package,
  Eye,
  User,
  Trash2,
  Info,
  HandCoins,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { TransactionType, PaymentMethod, Settlement, SettlementStatus } from "@/lib/types"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { generateSettlementPDF, generateMonthlySettlementPDF } from "@/lib/pdf-generator"
import { DateRange } from "react-day-picker"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { isWithinInterval, startOfDay, endOfDay } from "date-fns"
// CHANGE: Removed import of generateDailyLiquidation since table doesn't exist in BD

export default function CajaPage() {
  const { toast } = useToast() // Initialize toast - FIX: Changed useUseToast to useToast

  const { user, hasPermission } = useAuth()
  const {
    cashRegisters,
    getCashRegister,
    openCashRegister,
    closeCashRegister,
    professionals,
    appointments,
    clients,
    transactions,
    settlements,
    addTransaction,
    generateSettlement,
    generateDailySettlement, // CHANGE: Imported generateDailySettlement
    updateSettlementStatus,
    productSales,
    products,
    receptionDailyCloses,
    receptionMonthlyCloses,
    closeReceptionDaily,
    closeReceptionMonthly,
    getReceptionProductSalesToday,
    getReceptionProductSalesMonth,
    isLastDayOfMonth,
    canCloseReceptionDaily,
    canCloseReceptionMonthly,
    serviceConfigs, // Added serviceConfigs
    updateSettlement,
    deleteSettlement,
    deliverCashToProfessional,
  } = useData()

  const isSuperAdmin = hasPermission(["super_admin"])
  const isAdminOrSuperAdmin = hasPermission(["super_admin", "admin"])

  const [selectedTab, setSelectedTab] = useState("recepcion")
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  })

  const [filterByDate, setFilterByDate] = useState(true)

  // Dialog states
  const [showNewTransactionDialog, setShowNewTransactionDialog] = useState(false)
  const [showOpenReceptionDialog, setShowOpenReceptionDialog] = useState(false)
  const [showSettlementPreviewDialog, setShowSettlementPreviewDialog] = useState(false)
  const [showMonthlySettlementDialog, setShowMonthlySettlementDialog] = useState(false)
  const [showDailyCloseDialog, setShowDailyCloseDialog] = useState(false)
  const [showMonthlyCloseDialog, setShowMonthlyCloseDialog] = useState(false)
  const [dailyCloseResult, setDailyCloseResult] = useState<any>(null)
  const [monthlyCloseResult, setMonthlyCloseResult] = useState<any>(null)
  const [receptionFixedFund, setReceptionFixedFund] = useState(5000) // Use a more descriptive name
  const [settlementMonth, setSettlementMonth] = useState(new Date().getMonth())
  const [settlementYear, setSettlementYear] = useState(new Date().getFullYear())
  const [generatedSettlement, setGeneratedSettlement] = useState<Settlement | null>(null)

  // Transaction form state
  const [txType, setTxType] = useState<TransactionType>("expense")
  const [txAmount, setTxAmount] = useState("")
  const [txMethod, setTxMethod] = useState<PaymentMethod>("cash")
  const [txDescription, setTxDescription] = useState("")

  // New state for reception fund
  const [receptionFund, setReceptionFund] = useState(5000)

  // PDF ref
  const settlementPdfRef = useRef<HTMLDivElement>(null)

  // Get cash registers
  const receptionCash = getCashRegister("reception")

  const todaySales = getReceptionProductSalesToday()
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthSales = getReceptionProductSalesMonth(currentMonth, currentYear)

  const handleDailyClose = () => {
    if (!user) return
    const result = closeReceptionDaily(user.id, user.name)
    if (result) {
      setDailyCloseResult(result)
    }
  }

  const handleMonthlyClose = () => {
    if (!user || !isSuperAdmin) return
    const result = closeReceptionMonthly(user.id, user.name, receptionFixedFund)
    if (result) {
      setMonthlyCloseResult(result)
      setShowMonthlyCloseDialog(false)
    }
  }

  const handleTransferToAdmin = (settlement: Settlement) => {
    if (!hasPermission(["super_admin"])) return

    // Mark settlement as paid
    updateSettlementStatus(settlement.id, "paid")

    // Add transaction to admin cash (the amount TENSE earned goes to admin)
    addTransaction({
      date: new Date(),
      type: "settlement_transfer",
      amount: settlement.totalTenseCommission || 0,
      paymentMethod: "transfer",
      cashRegisterType: "administrator",
      notes: `Liquidación mensual - ${(professionals || []).find((p) => p.id === settlement.professionalId)?.name} - ${settlement.month !== undefined ? `${settlement.month + 1}/${settlement.year}` : ""}`,
    })

    alert(`Liquidación transferida a Caja Administrador: ${formatCurrency(settlement.totalTenseCommission || 0)}`)
  }

  // Calculate totals for reception
  const receptionTransactions = (receptionCash?.transactions || []).filter((t) => {
    const tDate = new Date(t.date)
    if (!filterByDate || !dateRange?.from) return true

    if (dateRange.to) {
      return isWithinInterval(tDate, {
        start: startOfDay(dateRange.from),
        end: endOfDay(dateRange.to),
      })
    } else {
      return tDate.toDateString() === dateRange.from.toDateString()
    }
  })

  const totalIncome = receptionTransactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = Math.abs(
    receptionTransactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0),
  )
  const dailyBalance = totalIncome - totalExpenses

  // Professional cash totals
  const professionalCashTotal = (cashRegisters || [])
    .filter((cr) => cr.type === "professional")
    .reduce((sum, cr) => {
      const balance = cr.openingBalance + (cr.transactions || []).reduce((s, t) => s + t.amount, 0)
      return sum + balance
    }, 0)

  const getReceptionBalance = () => {
    if (!receptionCash) return 0
    return receptionCash.openingBalance + (receptionCash.transactions || []).reduce((s, t) => s + t.amount, 0)
  }

  const handleOpenReception = () => {
    openCashRegister("reception", receptionFund)
    setShowOpenReceptionDialog(false)
  }

  const handleAddTransaction = () => {
    if (!txAmount || !txDescription) return

    const isExpense = ["expense", "supplier_payment", "cash_fund"].includes(txType)

    addTransaction({
      date: new Date(),
      type: txType,
      amount: isExpense ? -Math.abs(Number(txAmount)) : Math.abs(Number(txAmount)),
      paymentMethod: txMethod,
      cashRegisterType: "reception",
      notes: txDescription,
    })

    setTxAmount("")
    setTxDescription("")
    setShowNewTransactionDialog(false)
  }

  const handleCloseReception = () => {
    closeCashRegister("reception")
    alert(`Cierre de Caja Recepción completado.`)
  }

  const getProfessionalDayData = (professionalId: string, rangeOrDate?: DateRange | Date) => {
    // Convert Date to DateRange if needed
    const range: DateRange | undefined = rangeOrDate instanceof Date
      ? { from: rangeOrDate, to: rangeOrDate }
      : rangeOrDate

    const targetDate = range?.from || new Date()
    const allAppointments = appointments || []

    // 1. BLOCK A: ATENCIÓN DEL DÍA (Appointments performed on this date)
    const attendedAppointments = allAppointments.filter((apt) => {
      const profId = apt.professionalIdAtencion || apt.professionalIdCalendario || apt.professionalId
      if (profId !== professionalId) return false

      const aptDateISO = apt.date ? getDateInISO(apt.date) : null
      if (!aptDateISO) return false

      if (range?.to) {
        const aptDate = parseISODate(aptDateISO)
        return isWithinInterval(aptDate, {
          start: startOfDay(range.from!),
          end: endOfDay(range.to),
        })
      } else {
        return aptDateISO === getDateInISO(targetDate)
      }
    })

    // Filter to those that were actually attended or are confirmed (to count towards billing)
    const attended = attendedAppointments.filter((a) => a.status === "attended" || a.status === "closed")
    const noShow = attendedAppointments.filter((a) => a.status === "no_show")

    const totalRevenue = attended.reduce((sum: number, a: any) => sum + (a.finalPrice || 0), 0)
    const totalBaseRevenue = attended.reduce((sum: number, a: any) => sum + (a.basePrice || a.finalPrice || 0), 0)

    // 2. BLOCK B: COBROS DEL DÍA (Payments collected on this date, regardless of appointment date)
    let totalCash = 0 // This will be the NET cash (payments - withdrawals)
    let totalCashCollected = 0 // This will be the GROSS cash (payments only)
    let totalTransfer = 0
    const dailyPayments: any[] = []

    allAppointments.forEach((apt) => {
      (apt.payments || []).forEach((payment) => {
        if (payment.receivedByProfessionalId !== professionalId) return

        const pDateISO = payment.paymentDate ? getDateInISO(payment.paymentDate) : getDateInISO(payment.createdAt)
        const isSameDate = range?.to
          ? isWithinInterval(parseISODate(pDateISO), { start: startOfDay(range.from!), end: endOfDay(range.to) })
          : pDateISO === getDateInISO(targetDate)

        if (isSameDate) {
          const method = (payment.paymentMethod || "").trim().toLowerCase()
          const amt = Number(payment.amount) || 0
          if (method === "cash" || method === "efectivo") {
            totalCash += amt
            totalCashCollected += amt
          } else if (method === "transfer" || method === "transferencia") {
            totalTransfer += amt
          }
          dailyPayments.push({
            ...payment,
            appointmentDate: apt.date,
            appointmentTime: apt.startTime,
            clientName: (clients || []).find(c => c.id === apt.clientId)?.name || "Cliente"
          })
        }
      })

      // Fallback: If no cash payments found in array but fields exist, trust fields
      const aptDateISO = apt.date ? getDateInISO(apt.date) : null
      const isToday = range?.to
        ? (aptDateISO ? isWithinInterval(parseISODate(aptDateISO), { start: startOfDay(range.from!), end: endOfDay(range.to) }) : false)
        : aptDateISO === getDateInISO(targetDate)

      if (isToday && (apt.status === "attended" || apt.status === "closed")) {
        const profId = apt.professionalIdAtencion || apt.professionalIdCalendario || apt.professionalId
        if (profId === professionalId) {
          // Check if we already counted cash for this appointment via the payments array
          const cashInPayments = (apt.payments || []).some(p =>
            p.receivedByProfessionalId === professionalId &&
            (p.paymentMethod || "").trim().toLowerCase() === "cash" &&
            (p.paymentDate ? getDateInISO(p.paymentDate) : getDateInISO(p.createdAt)) === (aptDateISO || getDateInISO(targetDate))
          )

          if (!cashInPayments && (Number(apt.cashCollected) || 0) > 0) {
            totalCash += Number(apt.cashCollected)
            totalCashCollected += Number(apt.cashCollected)
          }

          // Same for transfers as a safety measure
          const transferInPayments = (apt.payments || []).some(p =>
            (p.paymentMethod || "").trim().toLowerCase() === "transfer" &&
            (p.paymentDate ? getDateInISO(p.paymentDate) : getDateInISO(p.createdAt)) === (aptDateISO || getDateInISO(targetDate))
          )
          if (!transferInPayments && Number(apt.transferCollected || 0) > 0) {
            totalTransfer += Number(apt.transferCollected)
          }
        }
      }
    })

    // 3. MOVIMIENTOS DE CAJA (Withdrawals/Deliveries)
    const profTransactions = (transactions || []).filter((t: any) => {
      if (t.professionalId !== professionalId) return false

      const tDateISO = getDateInISO(t.date)
      const isSameDate = range?.to
        ? isWithinInterval(parseISODate(tDateISO), { start: startOfDay(range.from!), end: endOfDay(range.to) })
        : tDateISO === getDateInISO(targetDate)

      return isSameDate && t.type === "professional_withdrawal"
    })

    profTransactions.forEach((t) => {
      totalCash += Number(t.amount) || 0 // Amount is negative for withdrawals
    })

    return {
      dayAppointments: attendedAppointments,
      attended,
      noShow,
      totalCash: Math.max(0, totalCash),
      totalCashCollected,
      totalTransfer,
      totalRevenue,
      totalBaseRevenue,
      dailyPayments,
      dayAppointmentsCount: attendedAppointments.length,
      attendedCount: attended.length,
    }
  }

  const selectedProfessional = (professionals || []).find((p) => p.id === selectedProfessionalId)
  const dayData = selectedProfessionalId ? getProfessionalDayData(selectedProfessionalId, dateRange) : null

  console.log("[v0] professionalData", dayData)

  const handleGenerateDailySettlement = async () => {
    console.log("[v0] handleGenerateDailySettlement called", {
      dayData,
      selectedProfessional,
    })

    if (!dayData || !selectedProfessional) {
      toast({
        description: "No data available",
        variant: "destructive",
      })
      return
    }

    try {
      const totalBasePrices = dayData.totalBaseRevenue || 0
      const totalFacturado = dayData.totalRevenue || 0
      const tenseDiscounts = (dayData.totalBaseRevenue || 0) - (dayData.totalRevenue || 0)
      const commissionRate = selectedProfessional?.commissionRate
      if (commissionRate === undefined) {
        console.warn("Professional commissionRate is undefined, defaulting to 65%", selectedProfessional?.name)
      }
      const effectiveCommissionRate = commissionRate ?? 65

      const professionalCommission = (totalBasePrices * effectiveCommissionRate) / 100
      const tenseCommissionPortion = (totalBasePrices * (100 - effectiveCommissionRate)) / 100

      // The settlement is generated and displayed in memory, which works correctly for the current system

      // Generate settlement preview
      const newSettlement = {
        id: `settlement-${Date.now()}`,
        professionalId: selectedProfessional.id,
        date: dateRange?.from || new Date(),
        totalFacturado: totalFacturado,
        baseRevenue: totalBasePrices,
        professionalEarningsAttended: professionalCommission,
        tenseCommissionAttended: tenseCommissionPortion,
        totalTenseCommission: tenseCommissionPortion, // Added for clarity
        amountToSettle: tenseCommissionPortion - tenseDiscounts,
        saldo_prof_debe: 0,
        saldo_tense_debe: tenseCommissionPortion - tenseDiscounts,
        totalDiscounts: tenseDiscounts,
        discountedRevenue: totalFacturado,
        attendedRevenue: totalBasePrices, // Ensure this is set for preview if needed
        // Added fields for PDF generation consistency
        type: "daily" as const,
        attendedAppointments: dayData.attendedCount,
        noShowAppointments: dayData.noShow.length,
        professionalPercentage: effectiveCommissionRate,
        discountAmount: tenseDiscounts, // Ensure discountAmount is set
        cashCollected: dayData.totalCash,
        transferCollected: dayData.totalTransfer,
        // These might need to be calculated if not directly available in dayData
        // but for preview, using calculated values is fine.
        // professionalEarningsAttended: professionalCommission, // Redundant, already set
        // tenseCommissionAttended: tenseCommissionPortion, // Redundant, already set
        // These fields are for monthly settlements, not strictly needed for daily preview, but can be set to 0 if not applicable
        noShowDepositsLost: 0,
        discountPercentageAbsorbed: 0,
        createdAt: new Date(), // Add createdAt for PDF generation consistency
        status: "pending" as const, // Default status
      }

      setGeneratedSettlement(newSettlement as Settlement)
      setShowSettlementPreviewDialog(true)
      toast({
        description: "Liquidación diaria generada correctamente",
      })
    } catch (error) {
      console.error("[v0] Error generating daily settlement:", error)
      toast({
        description: "Error generating daily settlement",
        variant: "destructive",
      })
    }
  }

  const handleDownloadPdf = async (customProf?: any, customRange?: DateRange) => {
    const prof = customProf || selectedProfessional
    const range = customRange || dateRange

    if (!prof) {
      toast({
        title: "Error",
        description: "Selecciona un profesional",
        variant: "destructive",
      })
      return
    }

    const targetDate = range?.from ? new Date(range.from) : new Date()

    // Check if a settlement already exists for this date/professional
    const existingSettlement = settlements?.find(
      (s) =>
        s.type === "daily" &&
        s.professionalId === prof.id &&
        (typeof s.date === 'string' ? parseISODate(s.date) : new Date(s.date || new Date())).toDateString() === targetDate.toDateString(),
    )

    if (existingSettlement) {
      await handleDownloadSettlementPdf(existingSettlement)
      return
    }

    // Capture current day data for preview
    const dayData = getProfessionalDayData(prof.id, targetDate)
    if (!dayData || dayData.attendedCount === 0) {
      toast({
        title: "Error",
        description: "No hay turnos para descargar en la fecha seleccionada",
        variant: "destructive",
      })
      return
    }

    // Construct a temporary settlement object for the preview PDF
    const rate = prof.commissionRate ?? (prof as any).commissionPercentage ?? 65
    const baseRevenue = dayData.totalBaseRevenue || 0
    const totalFacturado = dayData.totalRevenue || 0
    const discounts = baseRevenue - totalFacturado

    const tempSettlement: any = {
      id: `preview-${Date.now()}`,
      professionalId: prof.id,
      date: targetDate,
      type: "daily",
      baseRevenue: baseRevenue,
      basePriceTotal: baseRevenue,
      totalFacturado: totalFacturado,
      attendedRevenue: totalFacturado,
      discountAmount: discounts,
      professionalEarningsAttended: (baseRevenue * rate) / 100,
      tenseCommissionAttended: (baseRevenue * (100 - rate)) / 100,
      totalTenseCommission: Math.max(0, ((baseRevenue * (100 - rate)) / 100) - discounts),
      cashInTenseProfessional: dayData.totalCash,
      transfersToProfessional: dayData.totalTransfer,
      amountToSettle: dayData.totalCash - Math.max(0, ((baseRevenue * (100 - rate)) / 100) - discounts),
      attendedAppointments: dayData.attendedCount,
      professionalPercentage: rate,
      noShowAppointments: dayData.noShow.length,
      createdAt: new Date(),
    }

    generateSettlementPDF(tempSettlement, prof, appointments, clients, serviceConfigs)

    toast({
      title: "Vista previa generada",
      description: `Liquidación de ${prof.name} descargada exitosamente`,
    })
  }

  const handleDownloadSettlementPdf = async (settlement: Settlement) => {
    const prof = (professionals || []).find((p) => p.id === settlement.professionalId)
    if (!prof) {
      toast({ title: "Error", description: "Profesional no encontrado", variant: "destructive" })
      return
    }

    if (settlement.type === "daily") {
      generateSettlementPDF(settlement, prof, appointments, clients, serviceConfigs)
    } else if (settlement.type === "monthly") {
      const dailySettlements = (settlements || []).filter(
        (s) =>
          s.type === "daily" &&
          s.professionalId === settlement.professionalId &&
          (typeof s.date === 'string' ? parseISODate(s.date) : new Date(s.date || new Date())).getMonth() === settlement.month &&
          (typeof s.date === 'string' ? parseISODate(s.date) : new Date(s.date || new Date())).getFullYear() === settlement.year,
      )
      generateMonthlySettlementPDF(settlement, prof, dailySettlements)
    }

    toast({
      title: "PDF Generado",
      description: `Liquidación ${settlement.type === "daily" ? "diaria" : "mensual"} generada correctamente`,
    })
  }

  const handleGenerateMonthlySettlement = () => {
    if (!selectedProfessionalId) return

    const settlement = generateSettlement(selectedProfessionalId, settlementMonth, settlementYear)
    if (settlement) {
      setGeneratedSettlement(settlement)
      setShowMonthlySettlementDialog(false)
      setShowSettlementPreviewDialog(true)
    }
  }

  const getStatusBadge = (status: SettlementStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Clock className="mr-1 h-3 w-3" />
            Pendiente
          </Badge>
        )
      case "reviewed":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <AlertCircle className="mr-1 h-3 w-3" />
            Revisada
          </Badge>
        )
      case "paid":
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            <Check className="mr-1 h-3 w-3" />
            Pagada
          </Badge>
        )
    }
  }

  const handleConfirmSettlement = async () => {
    if (!generatedSettlement) return

    try {
      // 1. Save DAILY settlement to context (it was only a preview)
      if (generatedSettlement.type === "daily" && selectedProfessional && dateRange?.from) {
        generateDailySettlement(selectedProfessional.id, dateRange.from)
      }

      // 2. Handle MONTHLY settlement (already in context, needs status update and transaction)
      if (generatedSettlement.type === "monthly" && selectedProfessional) {
        // Mark as paid/confirmed in context
        updateSettlementStatus(generatedSettlement.id, "paid")

        // Add transaction for TENSE commission (Income for Admin)
        addTransaction({
          date: new Date(),
          type: "settlement_transfer",
          amount: generatedSettlement.amountToSettle || 0,
          paymentMethod: "transfer",
          cashRegisterType: "administrator",
          professionalId: selectedProfessional.id,
          settlementId: generatedSettlement.id,
          notes: `Liquidación mensual - ${selectedProfessional.name} (${generatedSettlement.month! + 1}/${generatedSettlement.year})`,
        })
      }

      toast({
        title: "Liquidación guardada",
        description: generatedSettlement.type === "daily"
          ? `La liquidación diaria informativa para ${selectedProfessional?.name} ha sido registrada.`
          : `La liquidación mensual para ${selectedProfessional?.name} ha sido confirmada y se registró el ingreso en Caja Administrador.`,
        variant: "default",
      })

      // Close dialog and reset
      setShowSettlementPreviewDialog(false)
      setGeneratedSettlement(null)
      setDateRange({ from: new Date(), to: new Date() })
      setSelectedProfessionalId("")
    } catch (error) {
      console.error("Error saving settlement:", error)
      toast({
        title: "Error",
        description: "Hubo un error al guardar la liquidación",
        variant: "destructive",
      })
    }
  }

  const canGenerateMonthlySettlement = (professionalId: string, month: number, year: number) => {
    const today = new Date()
    const isCurrentMonth = month === today.getMonth() && year === today.getFullYear()

    if (!isCurrentMonth) return true // Past months can always be settled

    // Check if there are pending appointments for this month
    const pendingAppointments = (appointments || []).filter((apt) => {
      const aptDate = parseISODate(typeof apt.date === 'string' ? apt.date : (apt.date as any).toISOString())
      return (
        apt.professionalIdCalendario === professionalId &&
        aptDate.getMonth() === month &&
        aptDate.getFullYear() === year &&
        aptDate >= today &&
        !["attended", "no_show", "cancelled"].includes(apt.status)
      )
    })

    return pendingAppointments.length === 0
  }

  const handleDeliverCash = () => {
    if (!selectedProfessional || !dayData) return
    deliverCashToProfessional(selectedProfessional.id, dayData.totalCash)
    toast({
      title: "Efectivo entregado",
      description: `Se registró la entrega de ${formatCurrency(dayData.totalCash)} a ${selectedProfessional.name}.`,
    })
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Caja</h1>
            <p className="text-muted-foreground">Gestión de movimientos y liquidaciones</p>
          </div>
          {isSuperAdmin && (
            <Link href="/caja/administrador">
              <Button variant="outline" className="gap-2 bg-transparent">
                <Lock className="h-4 w-4" />
                Caja Administrador
              </Button>
            </Link>
          )}
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="recepcion">Caja Recepción</TabsTrigger>
            <TabsTrigger value="professionals">Caja Profesionales</TabsTrigger>
          </TabsList>

          {/* TAB 1: CAJA RECEPCIÓN */}
          <TabsContent value="recepcion" className="space-y-6">
            {/* Reception Cash Status Bar */}
            <Card className="bg-gradient-to-r from-sky-50 to-blue-50 border-sky-200">
              <CardContent className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-sky-600" />
                      <span className="font-medium">Caja Recepción</span>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Fondo Fijo</p>
                      <p className="font-semibold">{formatCurrency(receptionCash?.fixedFund || 5000)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Saldo Actual</p>
                      <p className="font-semibold text-sky-600">
                        {formatCurrency(
                          (receptionCash?.openingBalance || 0) +
                          (receptionCash?.transactions || []).reduce((sum, t) => sum + t.amount, 0),
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdminOrSuperAdmin && (
                      <Button
                        variant="outline"
                        onClick={() => setShowDailyCloseDialog(true)}
                        disabled={!canCloseReceptionDaily(new Date())}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Cerrar Caja del Día
                      </Button>
                    )}
                    {isSuperAdmin && isLastDayOfMonth() && (
                      <Button
                        onClick={() => setShowMonthlyCloseDialog(true)}
                        disabled={!canCloseReceptionMonthly(currentMonth, currentYear)}
                        className="bg-amber-500 hover:bg-amber-600"
                      >
                        <Lock className="mr-2 h-4 w-4" />
                        Cerrar Caja del Mes
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Sales Summary - Today */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-5 w-5 text-sky-500" />
                    Ventas de Productos - Hoy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Efectivo</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(todaySales.cashTotal)}</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Transferencias</p>
                      <p className="text-xl font-bold text-blue-600">{formatCurrency(todaySales.transferTotal)}</p>
                    </div>
                    <div className="text-center p-3 bg-sky-50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-xl font-bold text-sky-600">{formatCurrency(todaySales.total)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3 text-center">
                    {todaySales.count} operaciones realizadas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-sky-500" />
                    Ventas del Mes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Efectivo</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(monthSales.cashTotal)}</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Transferencias</p>
                      <p className="text-xl font-bold text-blue-600">{formatCurrency(monthSales.transferTotal)}</p>
                    </div>
                    <div className="text-center p-3 bg-sky-50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-xl font-bold text-sky-600">{formatCurrency(monthSales.total)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3 text-center">
                    {monthSales.count} operaciones este mes
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Today's Product Sales List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ingresos por Ventas de Productos - Hoy</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hora</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Productos</TableHead>
                      <TableHead>Medio de Pago</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productSales
                      .filter((sale) => new Date(sale.date).toDateString() === new Date().toDateString())
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>
                            {new Date(sale.date).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                          </TableCell>
                          <TableCell>{sale.clientName || "Cliente anónimo"}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {sale.items.map((item, idx) => {
                                const product = products.find((p) => p.id === item.productId)
                                return (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {product?.name || "?"} x{item.quantity}
                                  </Badge>
                                )
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={sale.paymentMethod === "cash" ? "default" : "secondary"}>
                              {sale.paymentMethod === "cash" ? "Efectivo" : "Transferencia"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(sale.totalAmount)}</TableCell>
                        </TableRow>
                      ))}
                    {productSales.filter((sale) => new Date(sale.date).toDateString() === new Date().toDateString())
                      .length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No hay ventas de productos hoy
                          </TableCell>
                        </TableRow>
                      )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Daily Closes History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Historial de Cierres Diarios</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cerrado por</TableHead>
                      <TableHead className="text-right">Ventas Efectivo</TableHead>
                      <TableHead className="text-right">Ventas Transferencia</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-center">Operaciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receptionDailyCloses
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 10)
                      .map((close) => (
                        <TableRow key={close.id}>
                          <TableCell>{new Date(close.date).toLocaleDateString("es-AR")}</TableCell>
                          <TableCell>{close.closedByName}</TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatCurrency(close.totalCashSales)}
                          </TableCell>
                          <TableCell className="text-right text-blue-600">
                            {formatCurrency(close.totalTransferSales)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(close.totalProductSales)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{close.operationsCount}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: CAJA PROFESIONALES */}
          <TabsContent value="professionals" className="space-y-6">
            {/* Summary Card */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Profesionales Activos</p>
                        <p className="font-semibold">{(professionals || []).filter((p) => p.isActive).length}</p>
                      </div>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div>
                      <p className="text-xs text-muted-foreground">Total en Cajas</p>
                      <p className="font-semibold text-lg">{formatCurrency(professionalCashTotal)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left: Professional Selector and Summary */}
              <div className="lg:col-span-2 space-y-4">
                {/* Filters */}
                {/* Move filters to the top */}
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs">Profesional</Label>
                        <Select value={selectedProfessionalId} onValueChange={setSelectedProfessionalId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar profesional" />
                          </SelectTrigger>
                          <SelectContent>
                            {/* Add specialty to select item */}
                            {(professionals || []).map((prof) => (
                              <SelectItem key={prof.id} value={prof.id}>
                                {prof.name} - {prof.specialty}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <Label className="text-xs">
                            <input
                              type="checkbox"
                              checked={filterByDate}
                              onChange={(e) => setFilterByDate(e.target.checked)}
                              className="mr-2"
                            />
                            Filtrar por fecha
                          </Label>
                        </div>
                      </div>
                      {filterByDate && (
                        <div className="md:col-span-2">
                          <Label className="text-xs">Rango de Fechas</Label>
                          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {selectedProfessional && dayData && (
                  <>
                    {/* Cash Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-100">
                              <Wallet className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Efectivo Cobrado (Hoy)</p>
                              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(dayData.totalCash)}</p>
                            </div>
                          </div>
                          {dayData.totalCash > 0 && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline" className="w-full mt-4 h-8 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                                  <HandCoins className="h-4 w-4 mr-2" />
                                  Entregar efectivo
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Confirmar entrega de efectivo?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Se registrará que has entregado físicamente {formatCurrency(dayData.totalCash)} a {selectedProfessional.name}.
                                    Este monto se sumará a su "Efectivo en Mano" acumulado.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDeliverCash} className="bg-emerald-600 hover:bg-emerald-700">
                                    Confirmar Entrega
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="bg-amber-50 border-amber-200">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-100">
                              <HandCoins className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                              <p className="text-sm text-amber-800 font-medium">Efectivo Acumulado (En Mano)</p>
                              <p className="text-2xl font-bold text-amber-700">
                                {formatCurrency(selectedProfessional.cashInHand || 0)}
                              </p>
                            </div>
                          </div>
                          <p className="text-[10px] text-amber-600 mt-2 italic">
                            Total entregado al profesional pendiente de liquidación.
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100">
                              <Building2 className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Transferencias (Hoy)</p>
                              <p className="text-2xl font-bold text-blue-600">
                                {formatCurrency(dayData.totalTransfer)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Turnos Atendidos</p>
                            <p className="text-2xl font-bold">{dayData.attendedCount}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Descuentos</p>
                            <p className="text-2xl font-bold text-red-500">
                              -{formatCurrency(dayData.totalBaseRevenue - dayData.totalRevenue)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Facturación Neta</p>
                            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(dayData.totalRevenue)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Appointments Table */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span>Turnos del Día</span>
                          <Badge variant="outline">{dayData.attended.length} atendidos</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {dayData.dayAppointments.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">No hay turnos para este día</p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Hora</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">En Caja Prof.</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {dayData.dayAppointments.map((apt) => {
                                const client = (clients || []).find((c) => c.id === apt.clientId)
                                return (
                                  <TableRow key={apt.id}>
                                    <TableCell>{apt.startTime}</TableCell>
                                    <TableCell>{client?.name || "Cliente"}</TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={
                                          apt.status === "attended"
                                            ? "default"
                                            : apt.status === "no_show"
                                              ? "destructive"
                                              : "secondary"
                                        }
                                      >
                                        {apt.status === "attended"
                                          ? "Atendido"
                                          : apt.status === "no_show"
                                            ? "No asistió"
                                            : apt.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{formatCurrency(apt.finalPrice)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(apt.cashCollected || 0)}</TableCell>
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Detalle de Pagos Realizados</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const allPayments = dayData.dayAppointments.flatMap((apt) =>
                            (apt.payments || []).map((payment) => ({
                              ...payment,
                              appointmentId: apt.id,
                              clientName: (clients || []).find((c) => c.id === apt.clientId)?.name || "Cliente",
                              appointmentTime: apt.startTime,
                            })),
                          )

                          if (allPayments.length === 0) {
                            return <p className="text-center text-muted-foreground py-8">Sin pagos registrados</p>
                          }

                          return (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Hora</TableHead>
                                  <TableHead>Cliente</TableHead>
                                  <TableHead>Método</TableHead>
                                  <TableHead>Tipo</TableHead>
                                  <TableHead className="text-right">Monto</TableHead>
                                  <TableHead className="text-right">Fecha</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {allPayments.map((payment) => (
                                  <TableRow key={payment.id}>
                                    <TableCell>{payment.appointmentTime}</TableCell>
                                    <TableCell>{payment.clientName}</TableCell>
                                    <TableCell className="capitalize">{payment.paymentMethod}</TableCell>
                                    <TableCell className="capitalize">{(payment as any).type || "pago"}</TableCell>
                                    <TableCell className="text-right font-medium">
                                      {formatCurrency(payment.amount)}
                                    </TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                      {new Date((payment as any).date || Date.now()).toLocaleDateString("es-AR")}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )
                        })()}
                      </CardContent>
                    </Card>
                  </>
                )}

                {!selectedProfessionalId && (
                  <Card>
                    <CardContent className="py-12">
                      <p className="text-center text-muted-foreground">
                        Selecciona un profesional para ver su caja del día
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right: Settlement Summary */}
              <div className="space-y-4">
                {selectedProfessional && dayData && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        {dateRange?.to && dateRange.to.toDateString() !== dateRange.from?.toDateString()
                          ? "Liquidación del Período"
                          : "Liquidación del Día"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Facturado</span>
                          <span className="font-medium">{formatCurrency(dayData.totalRevenue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Comisión Prof. ({100 - (selectedProfessional.commissionRate || 35)}%)
                          </span>
                          <span className="font-medium">
                            {formatCurrency(
                              dayData.totalBaseRevenue * ((100 - (selectedProfessional.commissionRate || 35)) / 100),
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Comisión TENSE Neta ({selectedProfessional.commissionRate || 35}%)
                          </span>
                          <span className="font-medium">
                            {formatCurrency(
                              Math.max(0, (dayData.totalBaseRevenue * ((selectedProfessional.commissionRate || 35) / 100)) - (dayData.totalBaseRevenue - dayData.totalRevenue)),
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="border-t pt-3 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-semibold">Total Cobrado por Profesional</span>
                          <span className="font-bold text-lg">{formatCurrency(dayData.totalCash + dayData.totalTransfer)}</span>
                        </div>
                        <div className="flex justify-between pl-4 text-sm">
                          <span className="text-muted-foreground italic">• Efectivo cobrado</span>
                          <span className="font-medium text-emerald-600">{formatCurrency(dayData.totalCash)}</span>
                        </div>
                        <div className="flex justify-between pl-4 text-sm">
                          <span className="text-muted-foreground italic">• Transferencia recibida</span>
                          <span className="font-medium text-blue-600">{formatCurrency(dayData.totalTransfer)}</span>
                        </div>

                        {dayData.totalCash > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                                  <HandCoins className="h-4 w-4 mr-2" />
                                  Registrar Entrega de Efectivo
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Confirmar entrega de efectivo?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Confirmas que el profesional ha entregado {formatCurrency(dayData.totalCash)} en efectivo hoy.
                                    Este movimiento se registrará como un retiro de su caja operativa.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDeliverCash} className="bg-emerald-600 hover:bg-emerald-700">
                                    Confirmar y Poner Caja en $0
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>

                      <div className="border-t pt-4 space-y-2">
                        {(() => {
                          const isMonthly = generatedSettlement?.type === "monthly" || (dateRange?.to && dateRange.to.toDateString() !== dateRange.from?.toDateString())

                          if (!isMonthly) {
                            const tenseRate = selectedProfessional.commissionRate ?? 35
                            const dailyCommission = (dayData.totalBaseRevenue * tenseRate) / 100
                            const dailyCommissionNet = Math.max(0, dailyCommission - (dayData.totalBaseRevenue - dayData.totalRevenue))

                            return (
                              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                                <p className="text-sm text-blue-800 italic mb-1 uppercase font-bold">
                                  Comisión TENSE del Día (Informativa)
                                </p>
                                <p className="text-2xl font-bold text-blue-700">{formatCurrency(dailyCommissionNet)}</p>
                                <p className="text-xs text-blue-600 mt-2">
                                  Esta comisión se acumula para la liquidación mensual. No genera pago hoy.
                                </p>
                              </div>
                            )
                          }

                          let profOwesToTense = 0
                          let tenseOwesProf = 0

                          const isSingleDay = !dateRange?.to || dateRange.to.toDateString() === dateRange.from?.toDateString()
                          const existingSettlement = isSingleDay ? settlements?.find(
                            (s) =>
                              s.type === "daily" &&
                              s.professionalId === selectedProfessional.id &&
                              new Date(s.date || new Date()).toDateString() === (dateRange?.from?.toDateString() || ""),
                          ) : null

                          const tenseRate = selectedProfessional.commissionRate ?? 35
                          const totalTenseCommission = Math.max(0, (dayData.totalBaseRevenue * (tenseRate / 100)) - (dayData.totalBaseRevenue - dayData.totalRevenue))

                          const amountToSettle = existingSettlement
                            ? (existingSettlement.amountToSettle || totalTenseCommission)
                            : totalTenseCommission

                          if (amountToSettle > 0) {
                            return (
                              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                                <p className="text-sm text-amber-800 italic mb-1 uppercase font-bold">
                                  BALANCE A ABONAR A TENSE
                                </p>
                                <p className="text-3xl font-bold text-amber-700">{formatCurrency(amountToSettle)}</p>
                                <p className="text-xs text-amber-600 mt-2 uppercase font-medium">PROFESIONAL DEBE PAGAR COMISIÓN ACUMULADA</p>
                              </div>
                            )
                          } else {
                            return (
                              <div className="p-3 rounded-lg bg-gray-50 border">
                                <p className="text-sm text-gray-600 text-center font-medium">Cuentas equilibradas</p>
                              </div>
                            )
                          }
                        })()}
                      </div>

                      <div className="border-t pt-4 space-y-2">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowSettlementPreviewDialog(true)}
                            disabled={!dayData || dayData.attendedCount === 0}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalles
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full flex-1"
                            onClick={handleDownloadPdf}
                            disabled={!generatedSettlement && !dayData}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Descargar Informe PDF
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                )}
              </div>
            </div>
          </TabsContent >

        </Tabs >

        {/* Dialog: Open Reception */}
        < Dialog open={showOpenReceptionDialog} onOpenChange={setShowOpenReceptionDialog} >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Abrir Caja Recepción</DialogTitle>
              <DialogDescription>Ingrese el monto del fondo fijo para iniciar la caja</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Fondo Fijo</Label>
                <Input
                  type="number"
                  value={receptionFund}
                  onChange={(e) => setReceptionFund(Number(e.target.value))}
                  placeholder="5000"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="bg-transparent" onClick={() => setShowOpenReceptionDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleOpenReception}>Abrir Caja</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog >

        {/* Dialog: New Transaction */}
        < Dialog open={showNewTransactionDialog} onOpenChange={setShowNewTransactionDialog} >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Transacción</DialogTitle>
              <DialogDescription>Registrar un movimiento en Caja Recepción</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={txType} onValueChange={(v) => setTxType(v as TransactionType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product_sale">Venta de Producto</SelectItem>
                    <SelectItem value="expense">Gasto</SelectItem>
                    <SelectItem value="supplier_payment">Pago a Proveedor</SelectItem>
                    <SelectItem value="cash_fund">Fondeo de Caja</SelectItem>
                    <SelectItem value="adjustment">Ajuste</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Monto</Label>
                <Input type="number" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Medio de Pago</Label>
                <Select value={txMethod} onValueChange={(v) => setTxMethod(v as PaymentMethod)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  placeholder="Detalle del movimiento..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="bg-transparent" onClick={() => setShowNewTransactionDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddTransaction}>Registrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog >

        <Dialog open={showMonthlySettlementDialog} onOpenChange={setShowMonthlySettlementDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generar Liquidación Mensual</DialogTitle>
              <DialogDescription>Seleccione el mes y año para generar la liquidación</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mes</Label>
                  <Select value={String(settlementMonth)} onValueChange={(v) => setSettlementMonth(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[
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
                      ].map((m, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Año</Label>
                  <Select value={String(settlementYear)} onValueChange={(v) => setSettlementYear(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }).map((_, i) => {
                        const year = new Date().getFullYear() - i
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {selectedProfessionalId &&
                !canGenerateMonthlySettlement(selectedProfessionalId, settlementMonth, settlementYear) && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-sm text-amber-800">
                      <AlertCircle className="inline h-4 w-4 mr-1" />
                      Aún hay turnos pendientes para este mes. Solo se puede generar la liquidación mensual después de
                      atender al último paciente del mes.
                    </p>
                  </div>
                )}
            </div>
            <DialogFooter>
              <Button variant="outline" className="bg-transparent" onClick={() => setShowMonthlyCloseDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleGenerateMonthlySettlement}
                disabled={!canGenerateMonthlySettlement(selectedProfessionalId, settlementMonth, settlementYear)}
              >
                Generar Liquidación
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showSettlementPreviewDialog} onOpenChange={setShowSettlementPreviewDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-2xl">
                Liquidación {generatedSettlement?.type === "daily" ? "Diaria" : "Mensual"}
              </DialogTitle>
              <div className="text-base mt-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{selectedProfessional?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {generatedSettlement?.date
                        ? new Date(generatedSettlement.date).toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })
                        : `${(generatedSettlement?.month || 0) + 1}/${generatedSettlement?.year}`}
                    </p>
                  </div>
                </div>
              </div>
            </DialogHeader>

            {generatedSettlement && (
              <div ref={settlementPdfRef} className="space-y-6 py-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="text-3xl font-bold text-blue-900">{generatedSettlement.attendedAppointments}</div>
                    <div className="text-sm text-blue-700 mt-1">Turnos Atendidos</div>
                  </div>
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                    <div className="text-3xl font-bold text-green-900">
                      {formatCurrency(generatedSettlement.baseRevenue || 0)}
                    </div>
                    <div className="text-sm text-green-700 mt-1">Facturado</div>
                  </div>
                  <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                    <div className="text-3xl font-bold text-orange-900">{generatedSettlement.noShowAppointments}</div>
                    <div className="text-sm text-orange-700 mt-1">No Asistieron</div>
                  </div>
                </div>

                {/* Block A: Performance */}
                <div className="space-y-3 p-4 rounded-lg bg-muted/50">
                  <h3 className="font-semibold text-lg mb-1 uppercase text-emerald-900">Bloque A: Atención del Día</h3>
                  <p className="text-xs text-muted-foreground mb-3 italic">Prestaciones realizadas en esta fecha para el cálculo de comisión.</p>

                  <div className="space-y-2">
                    <div className="flex justify-between p-3 rounded bg-white border">
                      <span className="font-medium">
                        Honorarios Profesional ({generatedSettlement.professionalPercentage || 65}%)
                      </span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(generatedSettlement.professionalEarningsAttended || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 rounded bg-blue-50 border border-blue-200">
                      <span className="font-semibold text-blue-900">
                        Comisión TENSE ({100 - (generatedSettlement.professionalPercentage || 65)}%)
                      </span>
                      <span className="font-bold text-blue-600">
                        {formatCurrency(generatedSettlement.tenseCommissionAttended || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 rounded bg-amber-50 border border-amber-200">
                      <span className="font-semibold text-amber-900 italic">
                        Descuentos TENSE Absorbidos
                      </span>
                      <span className="font-bold text-amber-600">
                        -{formatCurrency(generatedSettlement.discountAmount || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Block B: Collections */}
                <div className="space-y-3 p-4 rounded-lg bg-muted/50">
                  <h3 className="font-semibold text-lg mb-1 uppercase text-blue-900">Bloque B: Cobros del Día (Dinero Físico)</h3>
                  <p className="text-xs text-muted-foreground mb-3 italic">Pagos recibidos hoy, independientemente de la fecha del turno.</p>
                  <div className="space-y-2">
                    <div className="flex justify-between p-3 rounded bg-white border">
                      <span className="font-medium">Efectivo (Entregado al Profesional)</span>
                      <span className="text-green-600 font-bold">
                        {formatCurrency(generatedSettlement.cashCollected || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 rounded bg-white border">
                      <span className="font-medium">Transferencia (Directo al Profesional)</span>
                      <span className="text-blue-600 font-bold">
                        {formatCurrency(generatedSettlement.transferCollected || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Settlement Amount */}
                {generatedSettlement.type === "daily" ? (
                  <div className="p-4 rounded-lg border-2 bg-blue-50 border-blue-300">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <span className="font-semibold text-lg text-blue-900 uppercase">
                          Comisión TENSE Estimada (Informativa)
                        </span>
                        <p className="text-sm text-blue-700">Este monto se acumula para la liquidación mensual</p>
                      </div>
                      <span className="text-3xl font-bold text-blue-700">
                        {formatCurrency(Math.abs(generatedSettlement.amountToSettle || 0))}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className={`p-4 rounded-lg border-2 ${generatedSettlement.amountToSettle! >= 0 ? "bg-emerald-50 border-emerald-300" : "bg-amber-50 border-amber-300"}`}>
                    <div className="flex justify-between items-center">
                      <span className={`font-semibold text-lg ${generatedSettlement.amountToSettle! >= 0 ? "text-emerald-900" : "text-amber-900"}`}>
                        {generatedSettlement.amountToSettle! >= 0 ? "PROFESIONAL debe abonar a TENSE (Saldo real):" : "TENSE debe abonar al PROFESIONAL:"}
                      </span>
                      <span className={`text-3xl font-bold ${generatedSettlement.amountToSettle! >= 0 ? "text-emerald-700" : "text-amber-700"}`}>
                        {formatCurrency(Math.abs(generatedSettlement.amountToSettle || 0))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="border-t pt-4">
              <Button variant="outline" onClick={() => setShowSettlementPreviewDialog(false)}>
                Cerrar
              </Button>
              <Button variant="outline" onClick={handleDownloadPdf}>
                <FileText className="mr-2 h-4 w-4" />
                Descargar PDF
              </Button>
              <Button onClick={handleConfirmSettlement} className="bg-green-600 hover:bg-green-700">
                <Check className="mr-2 h-4 w-4" />
                Confirmar Liquidación
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDailyCloseDialog} onOpenChange={setShowDailyCloseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cerrar Caja del Día</DialogTitle>
              <DialogDescription>
                Consolidar las ventas de productos del día. Este cierre es solo informativo y no mueve dinero a otra
                caja.
              </DialogDescription>
            </DialogHeader>

            {!dailyCloseResult ? (
              <>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Ventas en Efectivo</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(todaySales.cashTotal)}</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Ventas en Transferencia</p>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(todaySales.transferTotal)}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-sky-50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Total del Día</p>
                    <p className="text-3xl font-bold text-sky-600">{formatCurrency(todaySales.total)}</p>
                    <p className="text-sm text-muted-foreground mt-1">{todaySales.count} operaciones</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDailyCloseDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleDailyClose}>
                    <Check className="mr-2 h-4 w-4" />
                    Confirmar Cierre
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <div className="py-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Cierre Completado</h3>
                <p className="text-muted-foreground mb-4">El cierre del día ha sido registrado exitosamente.</p>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium">Total cerrado: {formatCurrency(dailyCloseResult.totalProductSales)}</p>
                  <p className="text-sm text-muted-foreground">{dailyCloseResult.operationsCount} operaciones</p>
                </div>
                <Button
                  className="mt-4"
                  onClick={() => {
                    setShowDailyCloseDialog(false)
                    setDailyCloseResult(null)
                  }}
                >
                  Cerrar
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showMonthlyCloseDialog} onOpenChange={setShowMonthlyCloseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-amber-500" />
                Cerrar Caja del Mes
              </DialogTitle>
              <DialogDescription>
                Este cierre transferirá el excedente sobre el fondo fijo a la Caja Administrador.
              </DialogDescription>
            </DialogHeader>

            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Esta acción solo puede realizarse por el Super Administrador el último día del mes.
              </AlertDescription>
            </Alert>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Ventas en Efectivo del Mes</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(monthSales.cashTotal)}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Ventas en Transferencia del Mes</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(monthSales.transferTotal)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fondo Fijo a Mantener</Label>
                <Input
                  type="number"
                  value={receptionFixedFund}
                  onChange={(e) => setReceptionFixedFund(Number(e.target.value))}
                />
              </div>

              <div className="p-4 bg-amber-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span>Saldo actual en caja:</span>
                  <span className="font-medium">
                    {formatCurrency(
                      (receptionCash?.openingBalance || 0) +
                      (receptionCash?.transactions || []).reduce((sum, t) => sum + t.amount, 0),
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span>Fondo fijo:</span>
                  <span className="font-medium">{formatCurrency(receptionFixedFund)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-medium">Excedente a transferir:</span>
                  <span className="text-xl font-bold text-amber-600">
                    {formatCurrency(
                      Math.max(
                        0,
                        (receptionCash?.openingBalance || 0) +
                        (receptionCash?.transactions || []).reduce((sum, t) => sum + t.amount, 0) -
                        receptionFixedFund,
                      ),
                    )}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMonthlyCloseDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleMonthlyClose} className="bg-amber-500 hover:bg-amber-600">
                <Lock className="mr-2 h-4 w-4" />
                Ejecutar Cierre Mensual
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!monthlyCloseResult} onOpenChange={() => setMonthlyCloseResult(null)}>
          <DialogContent>
            <div className="py-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Cierre Mensual Completado</h3>
              <p className="text-muted-foreground mb-4">La liquidación mensual ha sido procesada exitosamente.</p>
              {monthlyCloseResult && (
                <div className="p-4 bg-muted rounded-lg text-left space-y-2">
                  <div className="flex justify-between">
                    <span>Ventas en efectivo:</span>
                    <span className="font-medium">{formatCurrency(monthlyCloseResult.totalProductSalesCash)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ventas en transferencia:</span>
                    <span className="font-medium">{formatCurrency(monthlyCloseResult.totalProductSalesTransfer)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium">Excedente transferido a Caja Admin:</span>
                    <span className="font-bold text-amber-600">
                      {formatCurrency(monthlyCloseResult.excessTransferred)}
                    </span>
                  </div>
                </div>
              )}
              <Button className="mt-4" onClick={() => setMonthlyCloseResult(null)}>
                Cerrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div >
    </AppLayout >
  )
}
