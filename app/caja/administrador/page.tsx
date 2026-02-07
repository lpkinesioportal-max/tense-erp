"use client"

import { useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { useData } from "@/lib/data-context"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { formatCurrency, getDateInISO } from "@/lib/utils"
import {
  Plus,
  Lock,
  Unlock,
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  Building2,
  Calendar,
  Wallet,
  ShieldAlert,
} from "lucide-react"
import type { TransactionType, PaymentMethod } from "@/lib/types"
import Link from "next/link"

export default function CajaAdministradorPage() {
  const { user, hasPermission } = useAuth()
  const { getCashRegister, openCashRegister, closeCashRegister, addTransaction } = useData()

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])

  // Dialog states
  const [showNewTransactionDialog, setShowNewTransactionDialog] = useState(false)
  const [showOpenDialog, setShowOpenDialog] = useState(false)
  const [openingBalance, setOpeningBalance] = useState(10000)

  // Transaction form state
  const [txType, setTxType] = useState<TransactionType>("expense")
  const [txAmount, setTxAmount] = useState("")
  const [txMethod, setTxMethod] = useState<PaymentMethod>("cash")
  const [txDescription, setTxDescription] = useState("")

  if (!hasPermission(["super_admin"])) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="p-4 rounded-full bg-red-100 mb-4">
            <ShieldAlert className="h-12 w-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Acceso Restringido</h1>
          <p className="text-muted-foreground mb-6">
            Solo los Super Administradores pueden acceder a la Caja Administrador.
          </p>
          <Button asChild>
            <Link href="/caja">Volver a Caja</Link>
          </Button>
        </div>
      </AppLayout>
    )
  }

  // Get cash register
  const adminCash = getCashRegister("administrator")
  const transactions = adminCash?.transactions || []

  // Calculate totals
  const todayTransactions = transactions.filter(
    (t) => getDateInISO(t.date) === selectedDate,
  )

  const totalIncome = todayTransactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = Math.abs(todayTransactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0))
  const dailyBalance = totalIncome - totalExpenses

  const getAdminBalance = () => {
    if (!adminCash) return 0
    return adminCash.openingBalance + transactions.reduce((s, t) => s + t.amount, 0)
  }

  const handleOpenCash = () => {
    openCashRegister("administrator", openingBalance)
    setShowOpenDialog(false)
  }

  const handleAddTransaction = () => {
    if (!txAmount || !txDescription) return

    const isExpense = ["expense", "supplier_payment", "salary_payment", "tax_payment", "other_expense"].includes(txType)

    addTransaction({
      type: txType,
      amount: isExpense ? -Math.abs(Number(txAmount)) : Math.abs(Number(txAmount)),
      paymentMethod: txMethod,
      cashRegisterType: "administrator",
      notes: txDescription,
    })

    setTxAmount("")
    setTxDescription("")
    setShowNewTransactionDialog(false)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/caja">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Caja Administrador</h1>
              <p className="text-muted-foreground">Gestión de caja administrativa central</p>
            </div>
          </div>
          <Button onClick={() => setShowNewTransactionDialog(true)} disabled={adminCash?.status !== "open"}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Transacción
          </Button>
        </div>

        {/* Status Bar */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Estado</p>
                    <Badge variant={adminCash?.status === "open" ? "default" : "secondary"}>
                      {adminCash?.status === "open" ? "Abierta" : "Cerrada"}
                    </Badge>
                  </div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div>
                  <p className="text-xs text-muted-foreground">Saldo Inicial</p>
                  <p className="font-semibold">{formatCurrency(adminCash?.openingBalance || 0)}</p>
                </div>
                <div className="h-8 w-px bg-border" />
                <div>
                  <p className="text-xs text-muted-foreground">Saldo Actual</p>
                  <p className="font-semibold text-lg">{formatCurrency(getAdminBalance())}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {adminCash?.status !== "open" ? (
                  <Button size="sm" onClick={() => setShowOpenDialog(true)}>
                    <Unlock className="mr-2 h-4 w-4" />
                    Abrir Caja
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-transparent"
                    onClick={() => closeCashRegister("administrator")}
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Cerrar Caja
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Summary */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Resumen del Día
              </CardTitle>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-emerald-50 p-4 text-center">
                <p className="text-sm text-emerald-600">Ingresos</p>
                <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalIncome)}</p>
              </div>
              <div className="rounded-lg bg-red-50 p-4 text-center">
                <p className="text-sm text-red-600">Egresos</p>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(totalExpenses)}</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-4 text-center">
                <p className="text-sm text-blue-600">Balance</p>
                <p className={`text-2xl font-bold ${dailyBalance >= 0 ? "text-blue-700" : "text-red-700"}`}>
                  {formatCurrency(dailyBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <Wallet className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Efectivo</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {formatCurrency(
                      todayTransactions.filter((t) => t.paymentMethod === "cash").reduce((s, t) => s + t.amount, 0),
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transferencia</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(
                      todayTransactions.filter((t) => t.paymentMethod === "transfer").reduce((s, t) => s + t.amount, 0),
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Movimientos del Día</span>
              <Badge variant="outline">{todayTransactions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayTransactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay movimientos para este día</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {todayTransactions.map((txn) => (
                  <div key={txn.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      {txn.amount > 0 ? (
                        <ArrowDown className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <ArrowUp className="h-4 w-4 text-red-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{txn.notes}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(txn.createdAt).toLocaleTimeString("es-AR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" • "}
                          {txn.paymentMethod === "cash" ? "Efectivo" : "Transferencia"}
                        </p>
                      </div>
                    </div>
                    <span className={`font-semibold ${txn.amount > 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {txn.amount > 0 ? "+" : ""}
                      {formatCurrency(txn.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog: Nueva Transacción */}
        <Dialog open={showNewTransactionDialog} onOpenChange={setShowNewTransactionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Transacción</DialogTitle>
              <DialogDescription>Registrar un movimiento en Caja Administrador</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Movimiento</Label>
                <Select value={txType} onValueChange={(v) => setTxType(v as TransactionType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reception_excess">Excedente de Recepción</SelectItem>
                    <SelectItem value="professional_settlement">Liquidación Profesional</SelectItem>
                    <SelectItem value="other_income">Otro Ingreso</SelectItem>
                    <SelectItem value="supplier_payment">Pago a Proveedor</SelectItem>
                    <SelectItem value="salary_payment">Pago de Sueldo</SelectItem>
                    <SelectItem value="tax_payment">Pago de Impuestos</SelectItem>
                    <SelectItem value="cash_fund">Fondo de Caja Recepción</SelectItem>
                    <SelectItem value="other_expense">Otro Gasto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monto</Label>
                  <Input type="number" placeholder="0" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} />
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
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  placeholder="Detalle del movimiento..."
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
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
        </Dialog>

        {/* Dialog: Abrir Caja */}
        <Dialog open={showOpenDialog} onOpenChange={setShowOpenDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Abrir Caja Administrador</DialogTitle>
              <DialogDescription>Establecer el saldo inicial de la caja administrativa</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Saldo Inicial</Label>
                <Input
                  type="number"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(Number(e.target.value))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="bg-transparent" onClick={() => setShowOpenDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleOpenCash}>Abrir Caja</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
