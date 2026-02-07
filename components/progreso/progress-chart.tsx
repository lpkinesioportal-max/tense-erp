"use client"

import { useMemo } from "react"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    ReferenceLine,
} from "recharts"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { ProgressPoint } from "@/lib/types"

interface ProgressChartProps {
    data: ProgressPoint[]
}

export function ProgressChart({ data }: ProgressChartProps) {
    const chartData = useMemo(() => {
        return data.map((point) => ({
            ...point,
            formattedDate: format(new Date(point.date), "dd/MM", { locale: es }),
            // For stock-like feeling, ensure we use numeric values
            score: Number(point.score),
        }))
    }, [data])

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg border-2 border-dashed">
                <p className="text-muted-foreground">No hay datos de progreso suficientes</p>
            </div>
        )
    }

    const minScore = Math.min(...chartData.map((d) => d.score)) - 50
    const maxScore = Math.max(...chartData.map((d) => d.score)) + 50

    return (
        <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                        dataKey="formattedDate"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#6B7280" }}
                        minTickGap={30}
                    />
                    <YAxis
                        domain={[minScore, maxScore]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#6B7280" }}
                    />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload as ProgressPoint
                                const details = data.adherenceDetails

                                return (
                                    <div className="bg-white dark:bg-slate-900 p-4 border rounded-xl shadow-2xl min-w-[200px]">
                                        <div className="flex justify-between items-start mb-2 border-b pb-2">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {format(new Date(data.date), "dd MMMM yyyy", { locale: es })}
                                                </p>
                                                <p className="text-sm font-bold text-slate-800">{data.event || "Actualización de Progreso"}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-black text-emerald-600 leading-none">
                                                    {data.score}
                                                </p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Pts</p>
                                            </div>
                                        </div>

                                        {details && (
                                            <div className="space-y-2 mb-2">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-slate-500">Asistencia:</span>
                                                    <span className={`font-bold ${details.attendance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {details.attendance >= 0 ? `+${details.attendance}` : details.attendance}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-slate-500">Evaluación (+):</span>
                                                    <span className="font-bold text-emerald-600">+{details.positive}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-slate-500">Evaluación (-):</span>
                                                    <span className="font-bold text-rose-600">-{details.negative}</span>
                                                </div>

                                                {details.note && details.showToPatient && (
                                                    <div className="mt-2 pt-2 border-t border-slate-100">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Nota del Profesional:</p>
                                                        <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg">
                                                            "{details.note}"
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {!details && data.event && (
                                            <p className="text-xs font-medium p-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg">
                                                {data.event}
                                            </p>
                                        )}
                                    </div>
                                )
                            }
                            return null
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorScore)"
                        animationDuration={1500}
                    />
                    {/* Milestones as points */}
                    {chartData.map((entry, index) => (
                        entry.event ? (
                            <ReferenceLine
                                key={index}
                                x={entry.formattedDate}
                                stroke="#10b981"
                                strokeDasharray="3 3"
                                label={{ position: 'top', value: '📍', fontSize: 14 }}
                            />
                        ) : null
                    ))}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
