"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useData } from "@/lib/data-context"
import { formatCurrency } from "@/lib/utils"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export function RevenueChart() {
  const { transactions } = useData()

  // Group transactions by day for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date
  })

  const data = last7Days.map((date) => {
    const dayTransactions = transactions.filter(
      (t) => new Date(t.date).toDateString() === date.toDateString() && t.amount > 0,
    )
    const total = dayTransactions.reduce((sum, t) => sum + t.amount, 0)

    return {
      day: date.toLocaleDateString("es-AR", { weekday: "short" }),
      ingresos: total,
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Ingresos Últimos 7 Días</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 250)" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="oklch(0.5 0.02 250)" />
              <YAxis tick={{ fontSize: 12 }} stroke="oklch(0.5 0.02 250)" tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Ingresos"]}
                contentStyle={{
                  backgroundColor: "oklch(1 0 0)",
                  border: "1px solid oklch(0.9 0.01 250)",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="ingresos" fill="oklch(0.45 0.15 250)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
