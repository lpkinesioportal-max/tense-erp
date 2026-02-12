"use client"

import { useMemo } from "react"
import { useData } from "@/lib/data-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Building2, TrendingUp, Users, DollarSign } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    Cell,
    PieChart,
    Pie,
} from "recharts"

export function CovenantsAnalysis() {
    const { covenants, appointments, clients } = useData()

    const stats = useMemo(() => {
        const usages = (covenants || []).map((covenant) => {
            const apptsWithCovenant = (appointments || []).filter(
                (a) => a.covenantId === covenant.id && a.status !== "cancelled"
            )

            const patientsWithCovenant = (clients || []).filter(
                (client) => client.covenantId === covenant.id
            )

            const totalDiscount = apptsWithCovenant.reduce((acc, a) => {
                // basePrice - finalPrice = discountAmount per session
                return acc + (a.basePrice - a.finalPrice)
            }, 0)

            return {
                name: covenant.name,
                usageCount: apptsWithCovenant.length,
                patientCount: patientsWithCovenant.length,
                totalDiscount,
                color: `hsl(${Math.random() * 360}, 70%, 50%)`
            }
        })

        // Sort by usage
        return usages.sort((a, b) => b.usageCount - a.usageCount)
    }, [covenants, appointments, clients])

    const totalDiscountGiven = stats.reduce((acc, s) => acc + s.totalDiscount, 0)
    const totalCovenantUsage = stats.reduce((acc, s) => acc + s.usageCount, 0)

    // Colors for charts
    const CHART_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b", "#10b981", "#06b6d4"]

    return (
        <div className="space-y-8">
            {/* Metrics Row */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-none shadow-sm bg-indigo-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-indigo-600 font-bold text-xs uppercase tracking-wider">Descuentos Totales</CardDescription>
                        <CardTitle className="text-3xl text-indigo-900">{formatCurrency(totalDiscountGiven)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center text-indigo-600/60 text-sm">
                            <DollarSign className="h-4 w-4 mr-1" />
                            Ahorro total para pacientes
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-violet-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-violet-600 font-bold text-xs uppercase tracking-wider">Uso de Convenios</CardDescription>
                        <CardTitle className="text-3xl text-violet-900">{totalCovenantUsage}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center text-violet-600/60 text-sm">
                            <TrendingUp className="h-4 w-4 mr-1" />
                            Turnos con obra social
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-emerald-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-emerald-600 font-bold text-xs uppercase tracking-wider">Pacientes Adheridos</CardDescription>
                        <CardTitle className="text-3xl text-emerald-900">
                            {stats.reduce((acc, s) => acc + s.patientCount, 0)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center text-emerald-600/60 text-sm">
                            <Users className="h-4 w-4 mr-1" />
                            Total de pacientes con convenio
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Usage Chart */}
                <Card className="border-none shadow-md overflow-hidden bg-white">
                    <CardHeader className="bg-slate-50/50 border-b">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-indigo-500" />
                            Uso por Convenio (Turnos)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats} layout="vertical" margin={{ left: 20, right: 20 }}>
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        tick={{ fontSize: 12, fontWeight: 500 }}
                                        width={100}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="usageCount" radius={[0, 4, 4, 0]}>
                                        {stats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Discount Chart */}
                <Card className="border-none shadow-md overflow-hidden bg-white">
                    <CardHeader className="bg-slate-50/50 border-b">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-indigo-500" />
                            Inversión en Descuentos ($)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats}
                                        dataKey="totalDiscount"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                    >
                                        {stats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: any) => formatCurrency(value)}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-4 space-y-2">
                            {stats.slice(0, 4).map((s, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                                        <span className="text-slate-600">{s.name}</span>
                                    </div>
                                    <span className="font-semibold">{formatCurrency(s.totalDiscount)}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Distribution Table */}
            <Card className="border-none shadow-md overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/50 border-b">
                    <CardTitle className="text-lg">Distribución Detallada</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-4 font-bold">Convenio</th>
                                    <th className="px-6 py-4 font-bold text-center">Pacientes</th>
                                    <th className="px-6 py-4 font-bold text-center">Turnos Totales</th>
                                    <th className="px-6 py-4 font-bold text-right">Ahorro Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {stats.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                                            No hay datos de convenios disponibles para el período seleccionado.
                                        </td>
                                    </tr>
                                ) : (
                                    stats.map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-semibold text-slate-900">{row.name}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">
                                                    {row.patientCount}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-slate-600">{row.usageCount}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-indigo-600 font-bold">{formatCurrency(row.totalDiscount)}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
