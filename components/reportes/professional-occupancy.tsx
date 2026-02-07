"use client"

import { useState, useMemo } from "react"
import { useData } from "@/lib/data-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar, User, Briefcase, ExternalLink, TrendingUp, DollarSign, Users, AlertCircle, Ban, CheckCircle2 } from "lucide-react"
import { formatCurrency, timeToMinutes } from "@/lib/utils"
import { eachDayOfInterval, format, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { OccupancyDonut } from "./occupancy-donut"

export function ProfessionalOccupancy() {
    const { professionals, appointments, serviceConfigs, clients } = useData()

    const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>("all")
    const [selectedServiceId, setSelectedServiceId] = useState<string>("all")
    const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => {
        const today = new Date()
        return {
            start: new Date(today.getFullYear(), today.getMonth(), 1),
            end: new Date(today.getFullYear(), today.getMonth() + 1, 0)
        }
    })

    const stats = useMemo(() => {
        const filteredProfs = selectedProfessionalId === "all"
            ? (professionals || []).filter(p => p.isActive)
            : (professionals || []).filter(p => p.id === selectedProfessionalId)

        let totalCapacity = 0
        let scheduled = 0
        let attended = 0
        let noShow = 0
        let cancelled = 0
        let overtime = 0
        let totalRevenue = 0
        let professionalShare = 0
        let tenseShare = 0
        let newPatients = new Set<string>()

        const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end })

        filteredProfs.forEach(prof => {
            // Calculate Capacity
            days.forEach(day => {
                const dayOfWeek = day.getDay()
                const daySchedule = prof.availability?.schedule?.find(s => s.dayOfWeek === dayOfWeek)

                if (daySchedule?.isActive && daySchedule.slots) {
                    totalCapacity += daySchedule.slots.length
                } else if (!prof.nonWorkingDays?.includes(dayOfWeek)) {
                    const startTimeVal = prof.workingHours?.start || "09:00"
                    const endTimeVal = prof.workingHours?.end || "18:00"
                    const duration = prof.standardDuration || 60
                    const startMin = timeToMinutes(startTimeVal)
                    const endMin = timeToMinutes(endTimeVal)
                    totalCapacity += Math.floor((endMin - startMin) / duration)
                }
            })

            // Appointments
            const profApts = (appointments || []).filter(apt => {
                const aptDate = new Date(apt.date)
                const isDateInRange = aptDate >= dateRange.start && aptDate <= dateRange.end
                const isAptProfessional = apt.professionalId === prof.id
                const isAptService = selectedServiceId === "all" || apt.serviceId === selectedServiceId
                return isDateInRange && isAptProfessional && isAptService
            })

            profApts.forEach(apt => {
                if (apt.status !== "cancelled") {
                    scheduled++
                    if (apt.isOvertimeMode) overtime++
                    if (apt.status === "attended" || apt.status === "closed") attended++
                    if (apt.status === "no_show") noShow++

                    const revenue = apt.amountPaid || 0
                    totalRevenue += revenue
                    const profComm = revenue * ((prof.commissionRate || 0) / 100)
                    professionalShare += profComm
                    tenseShare += (revenue - profComm)

                    // New patients
                    const client = clients.find(c => c.id === apt.clientId)
                    if (client) {
                        const createdAt = new Date(client.createdAt || Date.now())
                        if (createdAt >= dateRange.start && createdAt <= dateRange.end) {
                            newPatients.add(client.id)
                        }
                    }
                } else {
                    cancelled++
                }
            })
        })

        const occupancyRate = totalCapacity > 0 ? (scheduled / totalCapacity) * 100 : 0

        return {
            totalCapacity,
            scheduled,
            attended,
            noShow,
            cancelled,
            overtime,
            totalRevenue,
            professionalShare,
            tenseShare,
            newPatients: newPatients.size,
            occupancyRate
        }
    }, [professionals, appointments, clients, selectedProfessionalId, selectedServiceId, dateRange])

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-wrap items-center gap-4 p-4 bg-card/50 backdrop-blur-md rounded-xl border border-white/20 shadow-xl">
                <div className="flex flex-col gap-1.5 min-w-[200px]">
                    <label className="text-xs font-semibold text-muted-foreground ml-1 uppercase">Buscá por fecha</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <div className="flex items-center h-10 w-full rounded-md border border-input bg-background px-9 py-2 text-sm">
                            {format(dateRange.start, "MMM d", { locale: es })} - {format(dateRange.end, "MMM d, yyyy", { locale: es })}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5 min-w-[200px]">
                    <label className="text-xs font-semibold text-muted-foreground ml-1 uppercase">Buscá por profesional</label>
                    <Select value={selectedProfessionalId} onValueChange={setSelectedProfessionalId}>
                        <SelectTrigger className="bg-background/50 border-white/20">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <SelectValue placeholder="Profesional" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los profesionales</SelectItem>
                            {professionals.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-1.5 min-w-[200px]">
                    <label className="text-xs font-semibold text-muted-foreground ml-1 uppercase">Buscá por servicio</label>
                    <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                        <SelectTrigger className="bg-background/50 border-white/20">
                            <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                                <SelectValue placeholder="Servicio" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Filtrá por servicio</SelectItem>
                            {(serviceConfigs || []).map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Occupancy Donut */}
                <Card className="md:col-span-1 bg-white/40 backdrop-blur-xl border-white/50 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="h-20 w-20 text-sky-600" />
                    </div>
                    <CardHeader className="pb-0">
                        <CardTitle className="text-lg font-bold">Ocupación por profesional</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center pt-6">
                        <OccupancyDonut rate={stats.occupancyRate} />
                    </CardContent>
                </Card>

                {/* Turnos Stats */}
                <div className="md:col-span-1 space-y-4">
                    <h3 className="text-sm font-bold text-muted-foreground/80 uppercase tracking-widest px-1">Turnos</h3>

                    <Card className="hover:shadow-lg transition-shadow border-white/50 bg-white/30 backdrop-blur-md">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm border border-orange-200">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium">Agendados</p>
                                    <p className="text-xl font-bold">{stats.scheduled}<span className="text-sm text-muted-foreground font-normal ml-1">/ {stats.totalCapacity}</span></p>
                                </div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground/30" />
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow border-white/50 bg-white/30 backdrop-blur-md">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600 shadow-sm border border-sky-200">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium">Sobreturnos</p>
                                    <p className="text-xl font-bold">{stats.overtime}</p>
                                </div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground/30" />
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-4">
                        <Card className="hover:shadow-lg transition-shadow border-white/50 bg-white/30 backdrop-blur-md">
                            <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center">
                                <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 shadow-sm border border-violet-200">
                                    <Ban className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold">{stats.noShow}</p>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Ausencias</p>
                                </div>
                                <ExternalLink className="h-3 w-3 text-muted-foreground/30 absolute top-2 right-2" />
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-lg transition-shadow border-white/50 bg-white/30 backdrop-blur-md">
                            <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center">
                                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shadow-sm border border-red-200">
                                    <AlertCircle className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold">{stats.cancelled}</p>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Cancelados</p>
                                </div>
                                <ExternalLink className="h-3 w-3 text-muted-foreground/30 absolute top-2 right-2" />
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="hover:shadow-lg transition-shadow border-emerald-200 bg-emerald-50/30 backdrop-blur-md">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-200">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium">Atendidos</p>
                                    <p className="text-xl font-bold">{stats.attended}<span className="text-sm text-muted-foreground font-normal ml-1">/ {stats.scheduled - stats.noShow}</span></p>
                                </div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground/30" />
                        </CardContent>
                    </Card>
                </div>

                {/* Billing Stats */}
                <div className="md:col-span-1 space-y-4">
                    <h3 className="text-sm font-bold text-muted-foreground/80 uppercase tracking-widest px-1">Facturación</h3>

                    <Card className="bg-white/40 border-white/50 shadow-md">
                        <CardContent className="p-6 flex flex-col items-center text-center gap-2">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner border border-emerald-200 mb-2">
                                <DollarSign className="h-6 w-6" />
                            </div>
                            <p className="text-2xl font-black text-emerald-950">{formatCurrency(stats.totalRevenue)}</p>
                            <p className="text-xs text-emerald-700/70 font-bold uppercase tracking-wider">Dinero generado en total</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/40 border-white/50 shadow-md">
                        <CardContent className="p-6 flex flex-col items-center text-center gap-2">
                            <div className="h-12 w-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-inner border border-orange-200 mb-2">
                                <User className="h-6 w-6" />
                            </div>
                            <p className="text-2xl font-black text-orange-950">{formatCurrency(stats.professionalShare)}</p>
                            <p className="text-xs text-orange-700/70 font-bold uppercase tracking-wider">Profesional</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/40 border-white/50 shadow-md">
                        <CardContent className="p-6 flex flex-col items-center text-center gap-2">
                            <div className="h-12 w-12 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600 shadow-inner border border-sky-200 mb-2">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <p className="text-2xl font-black text-sky-950">{formatCurrency(stats.tenseShare)}</p>
                            <p className="text-xs text-sky-700/70 font-bold uppercase tracking-wider">Tense</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Extra Stats */}
                <div className="md:col-span-1 space-y-4">
                    <h3 className="text-sm font-bold text-muted-foreground/80 uppercase tracking-widest px-1">Extra</h3>

                    <Card className="bg-white/40 border-white/50 shadow-md relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Users className="h-20 w-20" />
                        </div>
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg border-4 border-white">
                                <Users className="h-7 w-7" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <p className="text-lg font-bold">Pacientes nuevos</p>
                                    <p className="text-3xl font-black">{stats.newPatients}</p>
                                </div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground/30 absolute bottom-3 right-3" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
