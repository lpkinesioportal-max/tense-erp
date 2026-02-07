"use client"

import { useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { AppointmentGrid } from "@/components/turnos/appointment-grid"
import { AppointmentsList } from "@/components/turnos/appointments-list"
import { RescheduleList } from "@/components/turnos/reschedule-list"
import { WaitlistView } from "@/components/turnos/waitlist-view"
import { CancelledList } from "@/components/turnos/cancelled-list"
import { Button } from "@/components/ui/button"
import { CalendarDays, List, Clock, Users, XCircle, Calendar } from "lucide-react"
import { useData } from "@/lib/data-context"
import { cn } from "@/lib/utils"

type TabType = "agenda" | "reprogramaciones" | "lista-espera" | "cancelados"

export default function TurnosPage() {
  const [view, setView] = useState<"grid" | "list">("grid")
  const [activeTab, setActiveTab] = useState<TabType>("agenda")
  const { appointments, waitlist } = useData()

  // Count appointments by status
  const followUpCount = (appointments || []).filter((a) => a.status === "follow_up").length
  const waitlistCount = (waitlist || []).length
  const cancelledCount = (appointments || []).filter((a) => a.status === "cancelled").length

  const tabs = [
    { id: "agenda" as TabType, label: "Agenda", icon: Calendar, count: null },
    { id: "reprogramaciones" as TabType, label: "Reprogramaciones", icon: Clock, count: followUpCount },
    { id: "lista-espera" as TabType, label: "Lista de espera", icon: Users, count: waitlistCount },
    { id: "cancelados" as TabType, label: "Turnos cancelados", icon: XCircle, count: cancelledCount },
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Turnos</h1>
            <p className="text-muted-foreground">Gestiona la agenda de turnos</p>
          </div>
          {activeTab === "agenda" && (
            <div className="flex items-center gap-2">
              <div className="rounded-lg border border-border p-1">
                <Button variant={view === "grid" ? "secondary" : "ghost"} size="sm" onClick={() => setView("grid")}>
                  <CalendarDays className="h-4 w-4" />
                </Button>
                <Button variant={view === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setView("list")}>
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative",
                  activeTab === tab.id
                    ? "text-primary border-b-2 border-primary -mb-px"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span
                    className={cn(
                      "ml-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                      tab.id === "reprogramaciones"
                        ? "bg-orange-100 text-orange-700"
                        : tab.id === "lista-espera"
                          ? "bg-violet-100 text-violet-700"
                          : "bg-red-100 text-red-700",
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Content */}
        {activeTab === "agenda" && (view === "grid" ? <AppointmentGrid /> : <AppointmentsList />)}
        {activeTab === "reprogramaciones" && <RescheduleList />}
        {activeTab === "lista-espera" && <WaitlistView />}
        {activeTab === "cancelados" && <CancelledList />}
      </div>
    </AppLayout>
  )
}
