"use client"

import { useState } from "react"
import { useData } from "@/lib/data-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency, formatDate, transactionTypeLabels, paymentMethodLabels } from "@/lib/utils"
import type { TransactionType, PaymentMethod } from "@/lib/types"
import { Search, ArrowDownLeft, ArrowUpRight, CreditCard, Banknote, Building, Wallet } from "lucide-react"

export function TransactionsList() {
  const { transactions, clients, professionals } = useData()
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<TransactionType | "all">("all")
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | "all">("all")

  const filteredTransactions = transactions
    .filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false
      if (methodFilter !== "all" && t.paymentMethod !== methodFilter) return false

      if (searchTerm) {
        const client = t.clientId ? clients.find((c) => c.id === t.clientId) : null
        const professional = t.professionalId ? professionals.find((p) => p.id === t.professionalId) : null
        const searchLower = searchTerm.toLowerCase()
        return (
          client?.name.toLowerCase().includes(searchLower) ||
          professional?.name.toLowerCase().includes(searchLower) ||
          t.notes.toLowerCase().includes(searchLower)
        )
      }
      return true
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const getClient = (id?: string) => (id ? clients.find((c) => c.id === id) : null)
  const getProfessional = (id?: string) => (id ? professionals.find((p) => p.id === id) : null)

  const getPaymentIcon = (method: PaymentMethod) => {
    switch (method) {
      case "cash":
        return <Banknote className="h-4 w-4" />
      case "debit":
      case "credit":
        return <CreditCard className="h-4 w-4" />
      case "transfer":
        return <Building className="h-4 w-4" />
      default:
        return <Wallet className="h-4 w-4" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Movimientos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(transactionTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={methodFilter} onValueChange={(v) => setMethodFilter(v as any)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Medio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(paymentMethodLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Transactions */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filteredTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No hay movimientos</p>
          ) : (
            filteredTransactions.map((t) => {
              const client = getClient(t.clientId)
              const professional = getProfessional(t.professionalId)
              const isIncome = t.amount > 0

              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-full p-2 ${isIncome ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}
                    >
                      {isIncome ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{transactionTypeLabels[t.type]}</span>
                        <Badge variant="outline" className="text-xs">
                          {getPaymentIcon(t.paymentMethod)}
                          <span className="ml-1">{paymentMethodLabels[t.paymentMethod]}</span>
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(t.date)}
                        {client && ` • ${client.name}`}
                        {professional && ` • ${professional.name}`}
                      </p>
                      {t.notes && <p className="text-xs text-muted-foreground truncate max-w-[300px]">{t.notes}</p>}
                    </div>
                  </div>
                  <span className={`font-semibold ${isIncome ? "text-success" : "text-destructive"}`}>
                    {isIncome ? "+" : ""}
                    {formatCurrency(t.amount)}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
