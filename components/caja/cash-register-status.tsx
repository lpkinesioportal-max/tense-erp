"use client"

import { useState } from "react"
import { useData } from "@/lib/data-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"
import { Lock, Unlock, ArrowDown, ArrowUp, Plus } from "lucide-react"
import type { TransactionType, PaymentMethod } from "@/lib/types"

export function CashRegisterStatus() {
  const { cashRegister, openCashRegister, closeCashRegister, addTransaction } = useData()
  const [showOpenDialog, setShowOpenDialog] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [showTransactionDialog, setShowTransactionDialog] = useState(false)
  const [openingBalance, setOpeningBalance] = useState(10000)

  // Transaction form state
  const [txType, setTxType] = useState<TransactionType>("income")
  const [txAmount, setTxAmount] = useState("")
  const [txMethod, setTxMethod] = useState<PaymentMethod>("cash")
  const [txDescription, setTxDescription] = useState("")

  const transactions = cashRegister?.transactions || []
  const openingBalanceValue = cashRegister?.openingBalance || 0
  const status = cashRegister?.status || "closed"

  console.log("[v0] cashRegister:", cashRegister)
  console.log("[v0] status:", status)
  console.log("[v0] showTransactionDialog:", showTransactionDialog)

  const totalIncome = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = Math.abs(transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0))
  const currentBalance = openingBalanceValue + (totalIncome - totalExpenses)

  const handleOpen = () => {
    openCashRegister(openingBalance)
    setShowOpenDialog(false)
  }

  const handleClose = () => {
    closeCashRegister()
    setShowCloseDialog(false)
  }

  const isExpense = txType === "expense" || txType === "deposit_refund" || txType === "adjustment"

  const handleAddTransaction = () => {
    if (!txAmount || !txDescription) return

    addTransaction({
      type: txType,
      amount: isExpense ? -Math.abs(Number(txAmount)) : Math.abs(Number(txAmount)),
      description: txDescription,
      paymentMethod: txMethod,
      createdBy: "admin",
    })

    // Reset form
    setTxAmount("")
    setTxDescription("")
    setTxType("income")
    setTxMethod("cash")
    setShowTransactionDialog(false)
  }

  const handleOpenTransactionDialog = () => {
    console.log("[v0] Botón Nueva Transacción clickeado, status:", status)
    setShowTransactionDialog(true)
  }

  return (
    <>
      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left section: Status */}
          <div className={`flex items-center gap-2 ${status === "open" ? "text-success" : "text-muted-foreground"}`}>
            {status === "open" ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
            <div>
              <p className="text-xs text-muted-foreground">Estado</p>
              <p className="font-semibold">{status === "open" ? "Abierta" : "Cerrada"}</p>
            </div>
          </div>

          {/* Center section: Financial summary */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Saldo Inicial</p>
              <p className="text-lg font-semibold">{formatCurrency(openingBalanceValue)}</p>
            </div>

            <div className="flex items-center gap-2">
              <ArrowDown className="h-4 w-4 text-success" />
              <div>
                <p className="text-xs text-muted-foreground">Ingresos</p>
                <p className="font-semibold text-success">{formatCurrency(totalIncome)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ArrowUp className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-xs text-muted-foreground">Egresos</p>
                <p className="font-semibold text-destructive">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>

            <div className="text-center border-l pl-6">
              <p className="text-xs text-muted-foreground">Saldo Actual</p>
              <p className="text-lg font-bold">{formatCurrency(currentBalance)}</p>
            </div>
          </div>

          {/* Right section: Action buttons */}
          <div className="flex items-center gap-2">
            <Button onClick={handleOpenTransactionDialog} disabled={status === "closed"}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Transacción
            </Button>

            {status === "closed" ? (
              <Button variant="outline" onClick={() => setShowOpenDialog(true)}>
                <Unlock className="mr-2 h-4 w-4" />
                Abrir Caja
              </Button>
            ) : (
              <Button variant="destructive" onClick={() => setShowCloseDialog(true)}>
                <Lock className="mr-2 h-4 w-4" />
                Cerrar Caja
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Open Dialog */}
      <Dialog open={showOpenDialog} onOpenChange={setShowOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir Caja</DialogTitle>
            <DialogDescription>Ingrese el saldo inicial para comenzar el día</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Saldo Inicial</Label>
              <Input type="number" value={openingBalance} onChange={(e) => setOpeningBalance(Number(e.target.value))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOpenDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleOpen}>Abrir Caja</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar Caja</DialogTitle>
            <DialogDescription>Confirme el cierre de caja del día</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-border p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saldo Inicial:</span>
                <span>{formatCurrency(openingBalanceValue)}</span>
              </div>
              <div className="flex justify-between text-success">
                <span>Ingresos:</span>
                <span>+ {formatCurrency(totalIncome)}</span>
              </div>
              <div className="flex justify-between text-destructive">
                <span>Egresos:</span>
                <span>- {formatCurrency(totalExpenses)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-semibold">
                <span>Saldo Final:</span>
                <span>{formatCurrency(currentBalance)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleClose}>
              Confirmar Cierre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showTransactionDialog}
        onOpenChange={(open) => {
          console.log("[v0] Dialog onOpenChange:", open)
          setShowTransactionDialog(open)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Transacción</DialogTitle>
            <DialogDescription>Registrar un nuevo movimiento de caja</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Transacción</Label>
              <Select value={txType} onValueChange={(value: TransactionType) => setTxType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Ingreso</SelectItem>
                  <SelectItem value="expense">Gasto</SelectItem>
                  <SelectItem value="deposit_refund">Devolución de Seña</SelectItem>
                  <SelectItem value="adjustment">Ajuste</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Monto</Label>
              <Input type="number" placeholder="0" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Medio de Pago</Label>
              <Select value={txMethod} onValueChange={(value: PaymentMethod) => setTxMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                placeholder="Detalle del movimiento..."
                value={txDescription}
                onChange={(e) => setTxDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransactionDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddTransaction} disabled={!txAmount || !txDescription}>
              <Plus className="mr-2 h-4 w-4" />
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
