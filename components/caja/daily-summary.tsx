"use client"

import { useData } from "@/lib/data-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, paymentMethodLabels } from "@/lib/utils"
import { Banknote, CreditCard, Building, Wallet } from "lucide-react"
import type { PaymentMethod } from "@/lib/types"

export function DailySummary() {
  const { transactions } = useData()

  const today = new Date()
  const todayTransactions = transactions.filter((t) => new Date(t.date).toDateString() === today.toDateString())

  const byPaymentMethod = todayTransactions.reduce(
    (acc, t) => {
      if (!acc[t.paymentMethod]) {
        acc[t.paymentMethod] = { income: 0, expense: 0 }
      }
      if (t.amount > 0) {
        acc[t.paymentMethod].income += t.amount
      } else {
        acc[t.paymentMethod].expense += Math.abs(t.amount)
      }
      return acc
    },
    {} as Record<PaymentMethod, { income: number; expense: number }>,
  )

  const totalIncome = todayTransactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = todayTransactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const getPaymentIcon = (method: PaymentMethod) => {
    switch (method) {
      case "cash":
        return <Banknote className="h-5 w-5" />
      case "debit":
      case "credit":
        return <CreditCard className="h-5 w-5" />
      case "transfer":
        return <Building className="h-5 w-5" />
      default:
        return <Wallet className="h-5 w-5" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Resumen del Día</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Totals */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-success/10 p-3 text-center">
            <p className="text-xs text-muted-foreground">Ingresos</p>
            <p className="text-lg font-bold text-success">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="rounded-lg bg-destructive/10 p-3 text-center">
            <p className="text-xs text-muted-foreground">Egresos</p>
            <p className="text-lg font-bold text-destructive">{formatCurrency(totalExpense)}</p>
          </div>
          <div className="rounded-lg bg-primary/10 p-3 text-center">
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className="text-lg font-bold text-primary">{formatCurrency(totalIncome - totalExpense)}</p>
          </div>
        </div>

        {/* By Payment Method */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Por Medio de Pago</h4>
          {Object.entries(byPaymentMethod).length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay movimientos hoy</p>
          ) : (
            Object.entries(byPaymentMethod).map(([method, data]) => (
              <div key={method} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <div className="text-muted-foreground">{getPaymentIcon(method as PaymentMethod)}</div>
                  <span className="font-medium">{paymentMethodLabels[method as PaymentMethod]}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-success">+{formatCurrency(data.income)}</span>
                  {data.expense > 0 && <span className="text-destructive">-{formatCurrency(data.expense)}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
