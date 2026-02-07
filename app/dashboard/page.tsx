"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { KPICard } from "@/components/dashboard/kpi-card"
import { AppointmentsByStatus } from "@/components/dashboard/appointments-by-status"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { RecentAppointments } from "@/components/dashboard/recent-appointments"
import { ProfessionalBalance } from "@/components/dashboard/professional-balance"
import { useData } from "@/lib/data-context"
import { formatCurrency } from "@/lib/utils"
import { Calendar, Wallet, CheckCircle, AlertCircle } from "lucide-react"

export default function DashboardPage() {
  const { appointments, transactions, cajaAdministrador, cajaTensePorProfesional } = useData()

  const today = new Date()
  const todayAppointments = appointments.filter((a) => new Date(a.date).toDateString() === today.toDateString())

  const attendedToday = todayAppointments.filter((a) => a.status === "asistio").length
  const totalToday = todayAppointments.length
  const attendanceRate = totalToday > 0 ? Math.round((attendedToday / totalToday) * 100) : 0

  const pendingDeposits = appointments.filter((a) => a.status === "pendiente_seña").length

  const todayRevenue = transactions
    .filter((t) => new Date(t.date).toDateString() === today.toDateString() && t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)

  const cajaAdminBalance = cajaAdministrador
    ? cajaAdministrador.openingBalance + cajaAdministrador.transactions.reduce((sum, t) => sum + t.amount, 0)
    : 0

  const cajaProfesionalesBalance = cajaTensePorProfesional
    ? cajaTensePorProfesional.reduce((total, caja) => {
      return total + caja.openingBalance + caja.transactions.reduce((sum, t) => sum + t.amount, 0)
    }, 0)
    : 0

  const totalCajaBalance = cajaAdminBalance + cajaProfesionalesBalance

  const isCajaOpen = cajaAdministrador?.status === "open"

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard - ACTUALIZADO</h1>
          <p className="text-muted-foreground">
            Resumen del día - {today.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Turnos Hoy"
            value={totalToday.toString()}
            subtitle={`${attendedToday} atendidos`}
            icon={Calendar}
          />
          <KPICard
            title="Tasa de Asistencia"
            value={`${attendanceRate}%`}
            subtitle="Hoy"
            icon={CheckCircle}
            variant="success"
          />
          <KPICard
            title="Señas Pendientes"
            value={pendingDeposits.toString()}
            subtitle="Turnos sin seña"
            icon={AlertCircle}
            variant="warning"
          />
          <KPICard title="Facturación Hoy" value={formatCurrency(todayRevenue)} icon={Wallet} />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <RevenueChart />
          <AppointmentsByStatus />
        </div>

        {/* Bottom Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <RecentAppointments />
          <ProfessionalBalance />
        </div>

        {/* Cash Register Status */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${isCajaOpen ? "bg-success" : "bg-muted"}`} />
              <span className="font-medium">Caja Administrador {isCajaOpen ? "Abierta" : "Cerrada"}</span>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Saldo total TENSE</p>
              <p className="text-lg font-semibold">{formatCurrency(totalCajaBalance)}</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
