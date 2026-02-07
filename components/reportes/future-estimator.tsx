"use client"

import { useState, useMemo } from "react"
import { useData } from "@/lib/data-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
    Target,
    TrendingUp,
    DollarSign,
    Calculator,
    ArrowUpRight,
    Users,
    Calendar,
    Sparkles,
    Zap,
    ShieldCheck,
    ZapOff
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { format, getDaysInMonth } from "date-fns"
import { es } from "date-fns/locale"

export function FutureEstimator() {
    const { professionals, serviceConfigs, transactions } = useData()

    const [estimatorMonth, setEstimatorMonth] = useState(new Date().getMonth().toString())
    const [estimatorYear, setEstimatorYear] = useState(new Date().getFullYear().toString())
    const [occupationRates, setOccupationRates] = useState<Record<string, number>>({})

    // Scenarios logic
    const applyScenario = (rate: number) => {
        const newRates: Record<string, number> = {}
        professionals.forEach(p => {
            newRates[p.id] = rate
        })
        setOccupationRates(newRates)
    }

    // Calculate Average Monthly Expenses
    const avgExpenses = useMemo(() => {
        const totalExpenses = (transactions || [])
            .filter(tx => tx.type === "expense" || tx.type === "supplier_payment")
            .reduce((sum, tx) => sum + tx.amount, 0)

        // Simple average based on current data
        return totalExpenses || 150000 // Fallback
    }, [transactions])

    const estimatorData = useMemo(() => {
        const targetMonth = Number.parseInt(estimatorMonth)
        const targetYear = Number.parseInt(estimatorYear)
        const daysInMonth = getDaysInMonth(new Date(targetYear, targetMonth))

        return (professionals || [])
            .filter((p) => p.isActive)
            .map((prof) => {
                const rate = occupationRates[prof.id] ?? 70 // Default 70%

                // Calculate working days
                const workingDays = Array.from({ length: daysInMonth }, (_, i) => {
                    const date = new Date(targetYear, targetMonth, i + 1)
                    const dayOfWeek = date.getDay()
                    return !prof.nonWorkingDays?.includes(dayOfWeek)
                }).filter(Boolean).length

                const startTimeStr = prof.workingHours?.start || "09:00"
                const endTimeStr = prof.workingHours?.end || "18:00"
                const [startH, startM] = startTimeStr.split(":").map(Number)
                const [endH, endM] = endTimeStr.split(":").map(Number)
                const hoursPerDay = (endH + endM / 60) - (startH + startM / 60)

                const slotDuration = prof.standardDuration || 60
                const slotsPerDay = Math.floor((hoursPerDay * 60) / slotDuration)

                const totalSlots = workingDays * slotsPerDay
                const estimatedAppointments = Math.round(totalSlots * (rate / 100))

                const profServices = (serviceConfigs || []).filter((s) => prof.services?.includes(s.id))
                const avgPrice = profServices.length > 0
                    ? profServices.reduce((sum, s) => sum + s.basePrice, 0) / profServices.length
                    : 12000

                const estimatedRevenue = estimatedAppointments * avgPrice
                const professionalEarnings = estimatedRevenue * (prof.commissionRate / 100)
                const tenseEarnings = estimatedRevenue - professionalEarnings

                return {
                    professional: prof,
                    occupationRate: rate,
                    workingDays,
                    slotsPerDay,
                    totalSlots,
                    estimatedAppointments,
                    avgPrice,
                    estimatedRevenue,
                    professionalEarnings,
                    tenseEarnings,
                }
            })
    }, [professionals, serviceConfigs, occupationRates, estimatorMonth, estimatorYear])

    const totalEstimatedRevenue = estimatorData.reduce((sum, d) => sum + d.estimatedRevenue, 0)
    const totalTenseEarnings = estimatorData.reduce((sum, d) => sum + d.tenseEarnings, 0)
    const projectedProfit = totalTenseEarnings - avgExpenses

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
            {/* Configuration Header */}
            <Card className="bg-gradient-to-br from-white to-sky-50/50 border-white/50 shadow-xl overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Calculator className="h-32 w-32" />
                </div>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-black flex items-center gap-2">
                                <Sparkles className="h-6 w-6 text-sky-500" />
                                Estimador de Ingresos Futuros
                            </CardTitle>
                            <CardDescription className="text-base">
                                Proyecta el crecimiento de Tense ajustando la ocupación de las agendas
                            </CardDescription>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Label className="font-bold text-muted-foreground">PERÍODO:</Label>
                                <div className="flex items-center gap-1">
                                    <Select value={estimatorMonth} onValueChange={setEstimatorMonth}>
                                        <SelectTrigger className="w-[130px] bg-white/50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: 12 }, (_, i) => (
                                                <SelectItem key={i} value={i.toString()}>
                                                    {format(new Date(2024, i), "MMMM", { locale: es })}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={estimatorYear} onValueChange={setEstimatorYear}>
                                        <SelectTrigger className="w-[100px] bg-white/50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="2025">2025</SelectItem>
                                            <SelectItem value="2026">2026</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mr-2">Escenarios rápidos:</span>
                        <Button variant="outline" size="sm" onClick={() => applyScenario(40)} className="rounded-full bg-white hover:bg-slate-50 border-slate-200">
                            <ShieldCheck className="h-4 w-4 mr-2 text-slate-500" />
                            Defensivo (40%)
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => applyScenario(70)} className="rounded-full bg-white hover:bg-sky-50 border-sky-200 text-sky-700">
                            <TrendingUp className="h-4 w-4 mr-2 text-sky-500" />
                            Equilibrado (70%)
                        </Button>
                        <Button variant="default" size="sm" onClick={() => applyScenario(95)} className="rounded-full bg-orange-600 hover:bg-orange-700 shadow-orange-200 shadow-lg">
                            <Zap className="h-4 w-4 mr-2" />
                            Agresivo (95%)
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* KPI Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-emerald-600 text-white shadow-emerald-200 shadow-lg border-emerald-500 overflow-hidden relative group">
                    <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-white/10 rounded-full group-hover:scale-110 transition-transform" />
                    <CardHeader className="pb-2">
                        <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest">Facturación Total Est.</p>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{formatCurrency(totalEstimatedRevenue)}</div>
                        <p className="text-emerald-100/70 text-[10px] mt-1">Suma de todos los ingresos de servicios</p>
                    </CardContent>
                </Card>

                <Card className="bg-sky-600 text-white shadow-sky-200 shadow-lg border-sky-500 overflow-hidden relative group font-sans">
                    <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-white/10 rounded-full group-hover:scale-110 transition-transform" />
                    <CardHeader className="pb-2">
                        <p className="text-sky-100 text-xs font-bold uppercase tracking-widest">Comisión TENSE Est.</p>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{formatCurrency(totalTenseEarnings)}</div>
                        <p className="text-sky-100/70 text-[10px] mt-1">Ingresos netos post comisiones profesionales</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800 text-white shadow-slate-200 shadow-lg border-slate-700 overflow-hidden relative group">
                    <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-white/5 rounded-full" />
                    <CardHeader className="pb-2">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Gastos Proyectados</p>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{formatCurrency(avgExpenses)}</div>
                        <p className="text-slate-400/70 text-[10px] mt-1">Estimación basada en meses anteriores</p>
                    </CardContent>
                </Card>

                <Card className={`text-white shadow-lg overflow-hidden relative group ${projectedProfit >= 0 ? "bg-indigo-600 shadow-indigo-200" : "bg-red-600 shadow-red-200"}`}>
                    <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-white/10 rounded-full" />
                    <CardHeader className="pb-2">
                        <p className="text-white/80 text-xs font-bold uppercase tracking-widest">Ganancia proyectada</p>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{formatCurrency(projectedProfit)}</div>
                        <div className="flex items-center gap-1 mt-1">
                            <ArrowUpRight className="h-3 w-3" />
                            <p className="text-white/70 text-[10px]">Margen: {totalEstimatedRevenue > 0 ? ((projectedProfit / totalEstimatedRevenue) * 100).toFixed(1) : 0}%</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Grid of Professional Sliders */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {estimatorData.map((data) => (
                    <Card key={data.professional.id} className="group hover:border-sky-300 transition-all border-white/50 bg-white/60 backdrop-blur-md shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-white font-black text-lg shadow-sky-200 shadow-lg">
                                        {data.professional.name.charAt(0)}
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">{data.professional.name}</CardTitle>
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">{data.professional.specialty}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge className="bg-sky-50 text-sky-700 border-sky-100 font-black text-base px-3">
                                        {data.occupationRate}%
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-2">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    <span>Tasa de Ocupación Objetivo</span>
                                </div>
                                <Slider
                                    value={[data.occupationRate]}
                                    onValueChange={([value]) =>
                                        setOccupationRates((prev) => ({
                                            ...prev,
                                            [data.professional.id]: value,
                                        }))
                                    }
                                    min={0}
                                    max={100}
                                    step={5}
                                    className="py-1"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-white/50 rounded-xl border border-white/80 shadow-sm flex flex-col justify-between">
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Turnos Est.</p>
                                    <div className="flex items-baseline gap-1">
                                        <p className="text-xl font-black">{data.estimatedAppointments}</p>
                                        <p className="text-[10px] text-muted-foreground">de {data.totalSlots}</p>
                                    </div>
                                </div>
                                <div className="p-3 bg-white/50 rounded-xl border border-white/80 shadow-sm flex flex-col justify-between">
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Facturación</p>
                                    <p className="text-xl font-black text-emerald-600">{formatCurrency(data.estimatedRevenue)}</p>
                                </div>
                            </div>

                            <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-100/50 space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground font-medium italic">Ganancia Profesional ({data.professional.commissionRate}%):</span>
                                    <span className="font-bold text-slate-700">{formatCurrency(data.professionalEarnings)}</span>
                                </div>
                                <Separator className="bg-sky-100" />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-black text-sky-800">Ganancia TENSE:</span>
                                    <span className="text-lg font-black text-sky-600">{formatCurrency(data.tenseEarnings)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
