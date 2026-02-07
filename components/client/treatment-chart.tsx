"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Target,
  CheckCircle,
  XCircle,
  FileText,
  Flag,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Droplets,
  Moon,
  Dumbbell,
  Activity,
  CalendarDays,
} from "lucide-react"
import { format, subDays, differenceInDays, isAfter, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import type { DailyLog, Appointment } from "@/lib/types"

interface TreatmentEvent {
  id: string
  date: Date
  type: "goal" | "session" | "missed" | "task" | "milestone" | "alert"
  title: string
  description?: string
  professional?: string
  points?: number
}

interface PatientGoal {
  id: string
  name: string
  targetDate: Date
  status: "active" | "completed" | "expired"
  createdAt: Date
}

interface TreatmentChartProps {
  dailyLogs: DailyLog[]
  appointments: Appointment[]
  goals?: PatientGoal[]
  events?: TreatmentEvent[]
  compact?: boolean
  onEventClick?: (event: TreatmentEvent) => void
}

// Función para calcular puntos de evolución
function calculateEvolutionPoints(
  dailyLogs: DailyLog[],
  appointments: Appointment[],
  date: Date,
): { points: number; breakdown: Record<string, number> } {
  const log = dailyLogs.find((l) => isSameDay(new Date(l.date), date))
  const dayAppointments = appointments.filter((a) => isSameDay(new Date(a.date), date))

  let points = 0
  const breakdown: Record<string, number> = {}

  // Puntos por sesiones asistidas (+10)
  const attendedSessions = dayAppointments.filter((a) => a.status === "completed").length
  if (attendedSessions > 0) {
    points += attendedSessions * 10
    breakdown["Sesiones asistidas"] = attendedSessions * 10
  }

  // Penalización por faltas (-15)
  const missedSessions = dayAppointments.filter((a) => a.status === "no-show").length
  if (missedSessions > 0) {
    points -= missedSessions * 15
    breakdown["Faltas"] = -missedSessions * 15
  }

  if (log) {
    if (log.waterGlasses && log.waterGlasses > 0) {
      const waterPoints = Math.min(log.waterGlasses, 8)
      points += waterPoints
      breakdown["Agua"] = waterPoints
    }

    if (log.sleepHours && log.sleepHours >= 7) {
      points += 3
      breakdown["Sueño"] = 3
    } else if (log.sleepHours && log.sleepHours > 0) {
      points += 1
      breakdown["Sueño"] = 1
    }

    // Puntos por entrenar (+5)
    if (log.trainingDone) {
      points += 5
      breakdown["Entrenamiento"] = 5
    }

    // Puntos por registrar ánimo (+1)
    if (log.mood) {
      points += 1
      breakdown["Ánimo"] = 1
    }

    // Puntos por mejorar dolor (si bajó respecto al día anterior)
    if (log.painLevel !== undefined && log.painLevel < 5) {
      points += 2
      breakdown["Dolor bajo"] = 2
    } else if (log.painLevel !== undefined && log.painLevel >= 7) {
      points -= 2
      breakdown["Dolor alto"] = -2
    }

    // Puntos por registrar comidas (+2)
    if (log.meals && log.meals.length > 0) {
      points += 2
      breakdown["Comidas"] = 2
    }
  }

  return { points, breakdown }
}

export function TreatmentChart({
  dailyLogs,
  appointments,
  goals = [],
  events = [],
  compact = false,
  onEventClick,
}: TreatmentChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<TreatmentEvent | null>(null)

  // Generar datos para los últimos 30 días (o 90 si no es compact)
  const days = compact ? 30 : 90
  const chartData = useMemo(() => {
    const data: {
      date: Date
      points: number
      cumulativePoints: number
      breakdown: Record<string, number>
      events: TreatmentEvent[]
    }[] = []

    let cumulative = 50 // Comenzar en 50% para tener margen de bajada

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const { points, breakdown } = calculateEvolutionPoints(dailyLogs, appointments, date)

      // Los puntos afectan el acumulado
      cumulative = Math.max(0, Math.min(100, cumulative + points * 0.5))

      // Encontrar eventos del día
      const dayEvents = events.filter((e) => isSameDay(new Date(e.date), date))

      // Agregar eventos de citas
      const dayAppointments = appointments.filter((a) => isSameDay(new Date(a.date), date))
      dayAppointments.forEach((apt) => {
        if (apt.status === "completed") {
          dayEvents.push({
            id: apt.id,
            date: new Date(apt.date),
            type: "session",
            title: "Sesión completada",
            description: apt.service,
            professional: apt.professionalName,
          })
        } else if (apt.status === "no-show") {
          dayEvents.push({
            id: apt.id,
            date: new Date(apt.date),
            type: "missed",
            title: "Falta a sesión",
            description: apt.service,
            professional: apt.professionalName,
          })
        }
      })

      // Agregar eventos de objetivos
      goals.forEach((goal) => {
        if (isSameDay(new Date(goal.targetDate), date)) {
          dayEvents.push({
            id: goal.id,
            date: new Date(goal.targetDate),
            type: goal.status === "completed" ? "milestone" : "goal",
            title: goal.name,
            description: goal.status === "completed" ? "Objetivo cumplido" : "Fecha objetivo",
          })
        }
      })

      data.push({
        date,
        points,
        cumulativePoints: cumulative,
        breakdown,
        events: dayEvents,
      })
    }

    return data
  }, [dailyLogs, appointments, events, goals, days])

  // Calcular estadísticas
  const currentValue = chartData[chartData.length - 1]?.cumulativePoints || 50
  const previousValue = chartData[Math.max(0, chartData.length - 8)]?.cumulativePoints || 50
  const trend = currentValue - previousValue
  const trendPercent = previousValue > 0 ? ((trend / previousValue) * 100).toFixed(1) : 0

  // Encontrar próximos turnos (múltiples)
  const upcomingAppointments = appointments
    .filter((a) => isAfter(new Date(a.date), new Date()) && a.status === "scheduled")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5) // Máximo 5 próximos turnos

  const nextAppointment = upcomingAppointments[0]

  // Último registro
  const lastLogDate = dailyLogs.length > 0 ? new Date(dailyLogs[dailyLogs.length - 1].date) : null
  const daysSinceLastLog = lastLogDate ? differenceInDays(new Date(), lastLogDate) : null

  // Dimensiones del gráfico
  const width = compact ? 600 : 900
  const height = compact ? 200 : 280
  const padding = { top: 30, right: 20, bottom: 40, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Escalar datos al gráfico
  const xScale = (index: number) => padding.left + (index / (chartData.length - 1)) * chartWidth
  const yScale = (value: number) => padding.top + chartHeight - (value / 100) * chartHeight

  // Generar path de la línea
  const linePath = chartData
    .map((d, i) => {
      const x = xScale(i)
      const y = yScale(d.cumulativePoints)
      return `${i === 0 ? "M" : "L"} ${x} ${y}`
    })
    .join(" ")

  // Generar path del área
  const areaPath = `${linePath} L ${xScale(chartData.length - 1)} ${yScale(0)} L ${xScale(0)} ${yScale(0)} Z`

  // Iconos de eventos
  const getEventIcon = (type: TreatmentEvent["type"]) => {
    switch (type) {
      case "goal":
        return <Target className="h-3 w-3" />
      case "session":
        return <CheckCircle className="h-3 w-3" />
      case "missed":
        return <XCircle className="h-3 w-3" />
      case "task":
        return <FileText className="h-3 w-3" />
      case "milestone":
        return <Flag className="h-3 w-3" />
      case "alert":
        return <AlertTriangle className="h-3 w-3" />
      default:
        return <Activity className="h-3 w-3" />
    }
  }

  const getEventColor = (type: TreatmentEvent["type"]) => {
    switch (type) {
      case "goal":
        return "bg-amber-500"
      case "session":
        return "bg-green-500"
      case "missed":
        return "bg-red-500"
      case "task":
        return "bg-blue-500"
      case "milestone":
        return "bg-purple-500"
      case "alert":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  if (compact) {
    // Versión compacta para el Welcome Card
    return (
      <div className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-4 text-white">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-lg font-bold text-cyan-400">EVOLUCIÓN DEL TRATAMIENTO</h3>
            <p className="text-xs text-slate-400">Tu progreso en el tiempo</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1">
              {trend >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-400" />
              )}
              <span className={`text-sm font-bold ${trend >= 0 ? "text-green-400" : "text-red-400"}`}>
                {trend >= 0 ? "+" : ""}
                {trendPercent}%
              </span>
            </div>
            <p className="text-xs text-slate-400">vs semana anterior</p>
          </div>
        </div>

        {upcomingAppointments.length > 0 && (
          <div className="mb-4 p-3 bg-gradient-to-r from-cyan-900/50 to-sky-900/50 rounded-lg border border-cyan-700/50">
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="h-4 w-4 text-cyan-400" />
              <h4 className="text-sm font-semibold text-cyan-300">Próximos Turnos</h4>
              <Badge className="bg-cyan-500/20 text-cyan-300 text-xs">{upcomingAppointments.length}</Badge>
            </div>
            <div className="space-y-2">
              {upcomingAppointments.slice(0, 3).map((apt, idx) => {
                const aptDate = new Date(apt.date)
                const isToday = isSameDay(aptDate, new Date())
                const isTomorrow = isSameDay(aptDate, new Date(Date.now() + 86400000))
                const daysUntil = differenceInDays(aptDate, new Date())

                return (
                  <div
                    key={apt.id}
                    className={`flex items-center justify-between p-2 rounded-md ${
                      idx === 0 ? "bg-cyan-500/20 border border-cyan-500/40" : "bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg ${
                          isToday ? "bg-green-500" : isTomorrow ? "bg-amber-500" : "bg-slate-700"
                        }`}
                      >
                        <span className="text-xs font-medium uppercase">{format(aptDate, "MMM", { locale: es })}</span>
                        <span className="text-lg font-bold leading-none">{format(aptDate, "d")}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{apt.service}</p>
                        <p className="text-xs text-slate-400">
                          {apt.professionalName} - {apt.time}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {isToday ? (
                        <Badge className="bg-green-500 text-white text-xs">HOY</Badge>
                      ) : isTomorrow ? (
                        <Badge className="bg-amber-500 text-white text-xs">MAÑANA</Badge>
                      ) : (
                        <span className="text-xs text-slate-400">En {daysUntil} días</span>
                      )}
                    </div>
                  </div>
                )
              })}
              {upcomingAppointments.length > 3 && (
                <p className="text-xs text-center text-slate-400 pt-1">+{upcomingAppointments.length - 3} turnos más</p>
              )}
            </div>
          </div>
        )}
        {/* End upcoming appointments section */}

        <ScrollArea className="w-full">
          <svg width={width} height={height} className="overflow-visible">
            <defs>
              <linearGradient id="lineGradientCompact" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#67e8f9" />
              </linearGradient>
              <linearGradient id="areaGradientCompact" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
              </linearGradient>
              <filter id="glowCompact">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((val) => (
              <g key={val}>
                <line
                  x1={padding.left}
                  y1={yScale(val)}
                  x2={width - padding.right}
                  y2={yScale(val)}
                  stroke="#334155"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
                <text x={padding.left - 8} y={yScale(val) + 4} fill="#64748b" fontSize="10" textAnchor="end">
                  {val}%
                </text>
              </g>
            ))}

            {/* Eje Y label */}
            <text
              x={15}
              y={height / 2}
              fill="#94a3b8"
              fontSize="10"
              textAnchor="middle"
              transform={`rotate(-90, 15, ${height / 2})`}
            >
              MEJORÍA
            </text>

            {/* Area fill */}
            <path d={areaPath} fill="url(#areaGradientCompact)" />

            {/* Main line */}
            <path
              d={linePath}
              fill="none"
              stroke="url(#lineGradientCompact)"
              strokeWidth="3"
              filter="url(#glowCompact)"
            />

            {/* Data points with events */}
            {chartData.map((d, i) => {
              const hasEvents = d.events.length > 0
              const x = xScale(i)
              const y = yScale(d.cumulativePoints)

              // Only show every 5th date label
              const showLabel = i % 5 === 0 || i === chartData.length - 1

              return (
                <g key={i}>
                  {showLabel && (
                    <text x={x} y={height - 10} fill="#64748b" fontSize="9" textAnchor="middle">
                      {format(d.date, "d/M")}
                    </text>
                  )}

                  {/* Event markers */}
                  {hasEvents && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <g className="cursor-pointer" onClick={() => setSelectedEvent(d.events[0])}>
                          <circle cx={x} cy={y} r="8" fill="#0f172a" stroke="#22d3ee" strokeWidth="2" />
                          <circle cx={x} cy={y} r="4" fill="#22d3ee" />
                        </g>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3" side="top">
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">
                            {format(d.date, "d MMMM yyyy", { locale: es })}
                          </p>
                          {d.events.map((event, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <div className={`p-1 rounded ${getEventColor(event.type)} text-white`}>
                                {getEventIcon(event.type)}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{event.title}</p>
                                {event.description && (
                                  <p className="text-xs text-muted-foreground">{event.description}</p>
                                )}
                              </div>
                            </div>
                          ))}
                          <div className="pt-2 border-t">
                            <p className="text-xs font-medium">
                              Puntos del día: {d.points > 0 ? "+" : ""}
                              {d.points}
                            </p>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </g>
              )
            })}

            {/* Current value indicator */}
            <g>
              <circle
                cx={xScale(chartData.length - 1)}
                cy={yScale(currentValue)}
                r="6"
                fill="#22d3ee"
                filter="url(#glowCompact)"
              />
              <text
                x={xScale(chartData.length - 1) + 12}
                y={yScale(currentValue) + 5}
                fill="#22d3ee"
                fontSize="12"
                fontWeight="bold"
              >
                {currentValue.toFixed(0)}%
              </text>
            </g>

            {/* Eje X label */}
            <text x={width / 2} y={height - 2} fill="#94a3b8" fontSize="10" textAnchor="middle">
              TIEMPO
            </text>
          </svg>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Quick stats row - updated */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-xs text-slate-400">Sesiones asistidas</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-400"></div>
              <span className="text-xs text-slate-400">Faltas</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-400"></div>
              <span className="text-xs text-slate-400">Objetivos</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Progreso actual</p>
            <p className="text-sm font-medium text-cyan-400">{currentValue.toFixed(0)}%</p>
          </div>
        </div>
      </div>
    )
  }

  // Versión completa para la sección Progreso
  return (
    <div className="space-y-4">
      {/* Header con estado actual */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Progreso General</p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-3xl font-bold text-cyan-400">{currentValue.toFixed(0)}%</span>
              <div className="flex items-center gap-1 mb-1">
                {trend >= 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-green-400">
                      {trend >= 0 ? "+" : ""}
                      {trendPercent}%
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-red-400">
                      {trend >= 0 ? "+" : ""}
                      {trendPercent}%
                    </span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Tendencia</p>
            <div className="flex items-center gap-2 mt-1">
              {trend > 5 ? (
                <>
                  <TrendingUp className="h-6 w-6 text-green-400" />
                  <span className="text-xl font-bold text-green-400">En alza</span>
                </>
              ) : trend < -5 ? (
                <>
                  <TrendingDown className="h-6 w-6 text-red-400" />
                  <span className="text-xl font-bold text-red-400">En riesgo</span>
                </>
              ) : (
                <>
                  <Minus className="h-6 w-6 text-amber-400" />
                  <span className="text-xl font-bold text-amber-400">Estable</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Último Registro</p>
            <p className="text-xl font-bold text-cyan-400 mt-1">
              {daysSinceLastLog !== null
                ? daysSinceLastLog === 0
                  ? "Hoy"
                  : `Hace ${daysSinceLastLog} días`
                : "Sin datos"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Próximo Turno</p>
            <p className="text-xl font-bold text-cyan-400 mt-1">
              {nextAppointment
                ? `${format(new Date(nextAppointment.date), "d/M")} ${nextAppointment.time}`
                : "Sin turnos"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico principal */}
      <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-0 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-cyan-400">GRÁFICO DE TRATAMIENTO</h3>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span>Sesión</span>
              </div>
              <div className="flex items-center gap-1">
                <XCircle className="h-3 w-3 text-red-400" />
                <span>Falta</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3 text-amber-400" />
                <span>Objetivo</span>
              </div>
              <div className="flex items-center gap-1">
                <Flag className="h-3 w-3 text-purple-400" />
                <span>Hito</span>
              </div>
            </div>
          </div>

          <ScrollArea className="w-full">
            <svg width={width} height={height} className="overflow-visible">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="50%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#67e8f9" />
                </linearGradient>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((val) => (
                <g key={val}>
                  <line
                    x1={padding.left}
                    y1={yScale(val)}
                    x2={width - padding.right}
                    y2={yScale(val)}
                    stroke="#334155"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                  <text x={padding.left - 10} y={yScale(val) + 4} fill="#64748b" fontSize="11" textAnchor="end">
                    {val}%
                  </text>
                </g>
              ))}

              {/* Eje Y label */}
              <text
                x={15}
                y={height / 2}
                fill="#94a3b8"
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle"
                transform={`rotate(-90, 15, ${height / 2})`}
              >
                MEJORÍA
              </text>

              {/* Area fill */}
              <path d={areaPath} fill="url(#areaGradient)" />

              {/* Main line */}
              <path d={linePath} fill="none" stroke="url(#lineGradient)" strokeWidth="3" filter="url(#glow)" />

              {/* Data points and events */}
              {chartData.map((d, i) => {
                const hasEvents = d.events.length > 0
                const x = xScale(i)
                const y = yScale(d.cumulativePoints)
                const isHovered = hoveredPoint === i
                const showLabel = i % 7 === 0 || i === chartData.length - 1

                return (
                  <g key={i} onMouseEnter={() => setHoveredPoint(i)} onMouseLeave={() => setHoveredPoint(null)}>
                    {showLabel && (
                      <text x={x} y={height - 8} fill="#64748b" fontSize="10" textAnchor="middle">
                        {format(d.date, "d/M")}
                      </text>
                    )}

                    {/* Event markers */}
                    {hasEvents &&
                      d.events.map((event, idx) => (
                        <Popover key={idx}>
                          <PopoverTrigger asChild>
                            <g className="cursor-pointer">
                              <circle
                                cx={x}
                                cy={y - 20 - idx * 15}
                                r="10"
                                fill={
                                  event.type === "session"
                                    ? "#22c55e"
                                    : event.type === "missed"
                                      ? "#ef4444"
                                      : event.type === "goal"
                                        ? "#f59e0b"
                                        : event.type === "milestone"
                                          ? "#a855f7"
                                          : "#3b82f6"
                                }
                                stroke="#0f172a"
                                strokeWidth="2"
                              />
                            </g>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 p-4" side="top">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Badge
                                  variant="secondary"
                                  className={
                                    event.type === "session"
                                      ? "bg-green-100 text-green-700"
                                      : event.type === "missed"
                                        ? "bg-red-100 text-red-700"
                                        : event.type === "goal"
                                          ? "bg-amber-100 text-amber-700"
                                          : "bg-purple-100 text-purple-700"
                                  }
                                >
                                  {event.type === "session"
                                    ? "Sesión"
                                    : event.type === "missed"
                                      ? "Falta"
                                      : event.type === "goal"
                                        ? "Objetivo"
                                        : "Hito"}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(event.date, "d MMM yyyy", { locale: es })}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-semibold">{event.title}</h4>
                                {event.description && (
                                  <p className="text-sm text-muted-foreground">{event.description}</p>
                                )}
                                {event.professional && (
                                  <p className="text-xs text-muted-foreground mt-1">Prof: {event.professional}</p>
                                )}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      ))}

                    {/* Hover tooltip for daily breakdown */}
                    {isHovered && !hasEvents && (
                      <g>
                        <rect x={x - 60} y={y - 80} width="120" height="70" rx="6" fill="#1e293b" stroke="#334155" />
                        <text x={x} y={y - 62} fill="#94a3b8" fontSize="10" textAnchor="middle">
                          {format(d.date, "d MMM", { locale: es })}
                        </text>
                        <text x={x} y={y - 45} fill="#22d3ee" fontSize="14" fontWeight="bold" textAnchor="middle">
                          {d.cumulativePoints.toFixed(0)}%
                        </text>
                        <text
                          x={x}
                          y={y - 28}
                          fill={d.points >= 0 ? "#22c55e" : "#ef4444"}
                          fontSize="11"
                          textAnchor="middle"
                        >
                          {d.points >= 0 ? "+" : ""}
                          {d.points} pts
                        </text>
                      </g>
                    )}
                  </g>
                )
              })}

              {/* Current value indicator */}
              <g>
                <circle
                  cx={xScale(chartData.length - 1)}
                  cy={yScale(currentValue)}
                  r="8"
                  fill="#22d3ee"
                  filter="url(#glow)"
                />
                <text
                  x={xScale(chartData.length - 1) + 15}
                  y={yScale(currentValue) + 5}
                  fill="#22d3ee"
                  fontSize="14"
                  fontWeight="bold"
                >
                  {currentValue.toFixed(0)}%
                </text>
              </g>

              {/* Eje X label */}
              <text x={width / 2} y={height - 2} fill="#94a3b8" fontSize="12" fontWeight="bold" textAnchor="middle">
                TIEMPO
              </text>
            </svg>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Objetivos acordados */}
      {goals.length > 0 && (
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-0">
          <CardContent className="p-4">
            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Objetivos Acordados</h4>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className={`p-3 rounded-lg border ${
                    goal.status === "completed"
                      ? "bg-green-950/50 border-green-800"
                      : goal.status === "expired"
                        ? "bg-red-950/50 border-red-800"
                        : "bg-slate-800/50 border-slate-700"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Target
                      className={`h-4 w-4 mt-0.5 ${
                        goal.status === "completed"
                          ? "text-green-400"
                          : goal.status === "expired"
                            ? "text-red-400"
                            : "text-amber-400"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{goal.name}</p>
                      <p className="text-xs text-slate-400">
                        {format(new Date(goal.targetDate), "d MMM yyyy", { locale: es })}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        goal.status === "completed"
                          ? "bg-green-900 text-green-300"
                          : goal.status === "expired"
                            ? "bg-red-900 text-red-300"
                            : "bg-amber-900 text-amber-300"
                      }
                    >
                      {goal.status === "completed" ? "Cumplido" : goal.status === "expired" ? "Vencido" : "Activo"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Qué suma y qué resta puntos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-green-950/50 to-slate-900 border-green-900/50">
          <CardContent className="p-4">
            <h4 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Suma puntos
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-400" /> Asistir a sesiones
                </span>
                <span className="text-green-400">+10 pts</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <Dumbbell className="h-3 w-3 text-green-400" /> Entrenar
                </span>
                <span className="text-green-400">+5 pts</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <Moon className="h-3 w-3 text-green-400" /> Dormir 7+ horas
                </span>
                <span className="text-green-400">+3 pts</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <Droplets className="h-3 w-3 text-green-400" /> Registrar agua
                </span>
                <span className="text-green-400">+1-8 pts</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-950/50 to-slate-900 border-red-900/50">
          <CardContent className="p-4">
            <h4 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Resta puntos
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <XCircle className="h-3 w-3 text-red-400" /> Faltar a sesión
                </span>
                <span className="text-red-400">-15 pts</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-red-400" /> No registrar datos
                </span>
                <span className="text-red-400">0 pts</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <Activity className="h-3 w-3 text-red-400" /> Dolor alto (7+)
                </span>
                <span className="text-red-400">-2 pts</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
