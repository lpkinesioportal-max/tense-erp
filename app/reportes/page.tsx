"use client"

import { useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { useAuth } from "@/lib/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Download, LayoutDashboard, TrendingUp, Users, ShoppingBag, MessageCircle, BarChart3 } from "lucide-react"
import { redirect } from "next/navigation"

// New Components
import { ReportOverview } from "@/components/reportes/report-overview"
import { ProfessionalOccupancy } from "@/components/reportes/professional-occupancy"
import { FutureEstimator } from "@/components/reportes/future-estimator"
import { FinancialAnalysis } from "@/components/reportes/financial-analysis"
import { ProductAnalysis } from "@/components/reportes/product-analysis"
import { ChatAnalysis } from "@/components/reportes/chat-analysis"

export default function ReportesPage() {
  const { hasPermission } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")

  // Redirect if not super_admin
  if (!hasPermission(["super_admin"])) {
    redirect("/dashboard")
  }

  const tabs = [
    { id: "overview", label: "General", icon: LayoutDashboard },
    { id: "occupancy", label: "Ocupación", icon: Users },
    { id: "finances", label: "Finanzas", icon: BarChart3 },
    { id: "products", label: "Productos", icon: ShoppingBag },
    { id: "estimator", label: "Proyecciones", icon: TrendingUp },
    { id: "chats", label: "Auditoría", icon: MessageCircle },
  ]

  return (
    <AppLayout>
      <div className="min-h-screen pb-20 space-y-12 max-w-[1200px] mx-auto px-4">
        {/* Minimalist Professional Header */}
        <div className="pt-12 pb-6 border-b border-slate-100 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-light tracking-tight text-slate-900">Reportes de Tense</h1>
            <p className="text-slate-400 font-medium font-mono text-xs uppercase tracking-widest">Panel gerencial & auditoría de crecimiento</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-slate-900 font-semibold rounded-xl h-11 px-6 transition-all">
              <Download className="h-4 w-4 mr-2" />
              EXPORTAR PDF
            </Button>
          </div>
        </div>

        {/* Modular Tabs Structure - Cleaner Minimalist List */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-12">
          <TabsList className="bg-slate-100/50 p-1.5 rounded-2xl h-auto flex-wrap border border-slate-200/50 w-fit">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="rounded-xl px-6 py-2.5 text-xs font-bold text-slate-400 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all flex items-center gap-2"
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-8">
            <TabsContent value="overview">
              <ReportOverview />
            </TabsContent>

            <TabsContent value="occupancy">
              <ProfessionalOccupancy />
            </TabsContent>

            <TabsContent value="estimator">
              <FutureEstimator />
            </TabsContent>

            <TabsContent value="finances">
              <FinancialAnalysis />
            </TabsContent>

            <TabsContent value="products">
              <ProductAnalysis />
            </TabsContent>

            <TabsContent value="chats">
              <ChatAnalysis />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AppLayout>
  )
}
