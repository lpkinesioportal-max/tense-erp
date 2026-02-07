"use client"

import { useData } from "@/lib/data-context"
import {
    Users,
    Calendar,
    DollarSign,
    Target,
    Activity,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Tooltip,
} from "recharts"

export function ReportOverview() {
    const { appointments, clients } = useData()

    const stats = [
        {
            title: "Ingresos Mensuales",
            value: formatCurrency(1250400),
            change: "+12.5%",
            trend: "up",
            icon: DollarSign,
        },
        {
            title: "Pacientes Activos",
            value: clients?.length || 0,
            change: "+5 hoy",
            trend: "up",
            icon: Users,
        },
        {
            title: "Agenda Reservada",
            value: appointments?.length || 0,
            change: "+8%",
            trend: "up",
            icon: Calendar,
        },
        {
            title: "Eficiencia Real",
            value: "84%",
            change: "-2%",
            trend: "down",
            icon: Target,
        }
    ]

    const weeklyGrowth = [
        { name: "Sem 1", value: 400 },
        { name: "Sem 2", value: 300 },
        { name: "Sem 3", value: 600 },
        { name: "Sem 4", value: 800 },
    ]

    return (
        <div className="max-w-[1200px] mx-auto space-y-16 py-8 animate-in fade-in duration-700">
            {/* MINIMALIST METRICS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
                {stats.map((stat, i) => (
                    <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.title}</p>
                            <div className={`flex items-center gap-0.5 text-[10px] font-bold ${stat.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                                {stat.trend === 'up' ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                                {stat.change}
                            </div>
                        </div>
                        <h3 className="text-3xl font-light text-slate-900 tracking-tight">{stat.value}</h3>
                        <div className="h-0.5 w-full bg-slate-50 rounded-full">
                            <div className="h-full bg-slate-900 rounded-full w-1/3 opacity-10" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-20 items-start">
                {/* MINIMAL CHART PANEL */}
                <div className="lg:col-span-2 space-y-8">
                    <div>
                        <h3 className="text-lg font-medium text-slate-900">Actividad de Consultorio</h3>
                        <p className="text-xs text-slate-500 mt-1">Volumen de turnos atendidos por semana epidemiológica</p>
                    </div>
                    <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyGrowth}>
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 500, fill: '#94a3b8' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 500, fill: '#94a3b8' }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '11px' }}
                                />
                                <Bar
                                    dataKey="value"
                                    fill="#0f172a"
                                    radius={[2, 2, 0, 0]}
                                    barSize={45}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* MINIMAL PROGRESS CARD */}
                <div className="space-y-12">
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-lg font-medium text-slate-900">Objetivos Anuales</h3>
                            <p className="text-xs text-slate-500 mt-1">Nivel de cumplimiento sobre facturación proyectada</p>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Meta de Ventas</span>
                                    <span className="text-sm font-semibold text-slate-900">78%</span>
                                </div>
                                <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-slate-900 w-[78%] transition-all duration-1000" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Retención</p>
                                    <p className="text-xl font-medium text-slate-800">92%</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nuevos</p>
                                    <p className="text-xl font-medium text-slate-800">+240</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 border border-slate-100 rounded-3xl bg-slate-50/50 space-y-4">
                        <div className="flex items-center gap-3">
                            <Activity className="h-4 w-4 text-slate-400" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Estado del Centro</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed italic">
                            "El centro opera actualmente a un <strong>84%</strong> de su capacidad nominal. Existe margen para optimizar turnos vespertinos."
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
