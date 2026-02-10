"use client"

import { useState, useMemo } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { useToast } from "@/hooks/use-toast"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns"
import {
  Plus,
  CheckSquare,
  Clock,
  AlertCircle,
  Calendar,
  User,
  Trash2,
  Edit,
  CheckCircle2,
  Circle,
  Filter,
  Target,
  TrendingUp,
  Award,
  Briefcase,
  Users,
  ChevronDown,
  X,
  Link,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface Task {
  id: string
  title: string
  description: string
  assignedTo: string
  assignedBy: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "pending" | "in_progress" | "completed" | "cancelled"
  dueDate: string
  createdAt: string
  completedAt?: string
  category: "administrative" | "client" | "inventory" | "financial" | "other"
  linkedAdjustmentId?: string
  linkedAppointmentId?: string
  linkedTaskId?: string
}

interface OccupationGoal {
  id: string
  serviceId: string
  serviceName: string
  targetOccupation: number // percentage 0-100
  period: "monthly" | "weekly"
  month: number // 0-11
  year: number
  createdAt: string
  createdBy: string
}

const priorityColors = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
}

const priorityLabels = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-700",
}

const statusLabels = {
  pending: "Pendiente",
  in_progress: "En Progreso",
  completed: "Completada",
  cancelled: "Cancelada",
}

const categoryLabels = {
  administrative: "Administrativa",
  client: "Clientes",
  inventory: "Inventario",
  financial: "Financiera",
  other: "Otra",
}

export default function TareasPage() {
  const { user } = useAuth()
  const {
    users,
    appointments,
    professionals,
    serviceConfigs,
    tasks: staffTasks,
    updateTask,
    deleteTask,
    interProfessionalAdjustments,
    confirmAdjustmentResolution,
    goals: staffGoals,
    addGoal,
    updateGoal,
    deleteGoal: deleteStaffGoal
  } = useData()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("tareas")
  const [localTasks, setLocalTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Llamar a pacientes para confirmar turnos de mañana",
      description: "Confirmar asistencia de todos los pacientes agendados para mañana",
      assignedTo: "2",
      assignedBy: "1",
      priority: "high",
      status: "pending",
      dueDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      category: "client",
    },
  ])

  // Combine local mock tasks with global staff tasks
  const combinedTasks = useMemo(() => {
    const mappedGlobalTasks: Task[] = (staffTasks || []).map((st: any) => ({
      id: st.id,
      title: st.title,
      description: st.description,
      assignedTo: st.assignedTo,
      assignedBy: "system",
      status: st.status as any,
      priority: "high",
      dueDate: st.dueDate.toISOString(),
      createdAt: st.createdAt.toISOString(),
      category: "financial",
      linkedAdjustmentId: st.linkedAdjustmentId,
      linkedAppointmentId: st.linkedAppointmentId,
      linkedTaskId: st.linkedTaskId,
    }))

    return [...localTasks, ...mappedGlobalTasks]
  }, [localTasks, staffTasks])

  const [showDialog, setShowDialog] = useState(false)
  const [showGoalDialog, setShowGoalDialog] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedProfessionalIds, setSelectedProfessionalIds] = useState<string[]>([])
  const [profFilterOpen, setProfFilterOpen] = useState(false)
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    priority: "medium" as Task["priority"],
    dueDate: format(new Date(), "yyyy-MM-dd"),
    category: "other" as Task["category"],
  })
  const [goalForm, setGoalForm] = useState({
    serviceId: "",
    targetOccupation: 70,
  })

  const adminUsers = users.filter((u) => u.role === "super_admin" || u.role === "admin")
  const isSuperAdmin = user?.role === "super_admin"

  const toggleProfessional = (profId: string) => {
    setSelectedProfessionalIds((prev) =>
      prev.includes(profId) ? prev.filter((id) => id !== profId) : [...prev, profId],
    )
  }

  const clearProfessionalFilter = () => {
    setSelectedProfessionalIds([])
  }

  const selectAllProfessionals = () => {
    setSelectedProfessionalIds(professionals.map((p) => p.id))
  }

  const filteredProfessionals = useMemo(() => {
    if (selectedProfessionalIds.length === 0) return professionals
    return professionals.filter((p) => selectedProfessionalIds.includes(p.id))
  }, [professionals, selectedProfessionalIds])

  // Calculate occupation rate per service for the selected month
  const serviceOccupationData = useMemo(() => {
    const monthStart = startOfMonth(new Date(selectedYear, selectedMonth))
    const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth))
    const today = new Date()
    const effectiveEnd = monthEnd > today ? today : monthEnd

    const results: {
      serviceId: string
      serviceName: string
      currentOccupation: number
      targetOccupation: number
      totalSlots: number
      bookedSlots: number
      progress: number
      professionals: { id: string; name: string; occupation: number; bookedSlots: number; totalSlots: number }[]
    }[] = []

    // Get unique service names from both professional specialties and service configurations
    const uniqueServiceNames = Array.from(new Set([
      ...filteredProfessionals.map(p => p.specialty).filter(Boolean),
      ...serviceConfigs.map(s => s.name)
    ]))

    uniqueServiceNames.forEach((serviceName) => {
      // Find IDs from serviceConfigs that match this service name
      const matchingConfigIds = serviceConfigs
        .filter(s => s.name === serviceName)
        .map(s => s.id)

      // Find professionals for this service (filtered by selection)
      const serviceProfessionals = filteredProfessionals.filter(
        (p) =>
          p.specialty === serviceName ||
          (p.services && p.services.some(sId => matchingConfigIds.includes(sId)))
      )

      if (serviceProfessionals.length === 0) return

      let totalSlots = 0
      let bookedSlots = 0
      const professionalsData: {
        id: string
        name: string
        occupation: number
        bookedSlots: number
        totalSlots: number
      }[] = []

      serviceProfessionals.forEach((prof) => {
        // Calculate working days in the month for this professional
        const daysInRange = eachDayOfInterval({ start: monthStart, end: effectiveEnd })
        const workingDays = prof.nonWorkingDays ? [0, 1, 2, 3, 4, 5, 6].filter(d => !prof.nonWorkingDays.includes(d)) : [1, 2, 3, 4, 5]

        const profWorkingDays = daysInRange.filter((day) => {
          const dayOfWeek = getDay(day)
          return workingDays.includes(dayOfWeek)
        })

        // Calculate slots per day based on working hours
        const startHour = prof.workingHours?.start ? Number.parseInt(prof.workingHours.start.split(":")[0]) : 9
        const endHour = prof.workingHours?.end ? Number.parseInt(prof.workingHours.end.split(":")[0]) : 18
        const slotsPerDay = endHour - startHour

        const profTotalSlots = profWorkingDays.length * slotsPerDay
        totalSlots += profTotalSlots

        // Count booked appointments for this professional in this month
        const profAppointments = appointments.filter((apt) => {
          const aptDate = new Date(apt.date)
          return (
            apt.professionalId === prof.id &&
            aptDate >= monthStart &&
            aptDate <= effectiveEnd &&
            apt.status !== "cancelled"
          )
        })
        const profBookedSlots = profAppointments.length
        bookedSlots += profBookedSlots

        const profOccupation = profTotalSlots > 0 ? Math.round((profBookedSlots / profTotalSlots) * 100) : 0

        professionalsData.push({
          id: prof.id,
          name: prof.name,
          occupation: profOccupation,
          bookedSlots: profBookedSlots,
          totalSlots: profTotalSlots,
        })
      })

      const currentOccupation = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0

      // Map global staff goals to local OccupationGoal format for calculation
      const goal = (staffGoals || []).find(
        (g) => g.title.includes(serviceName) && new Date(g.startDate).getMonth() === selectedMonth
      )
      const targetOccupation = goal?.targetValue || 0

      const progress =
        targetOccupation > 0 ? Math.min(100, Math.round((currentOccupation / targetOccupation) * 100)) : 0

      results.push({
        serviceId: serviceName, // Use name as ID for consolidation
        serviceName,
        currentOccupation,
        targetOccupation,
        totalSlots,
        bookedSlots,
        progress,
        professionals: professionalsData,
      })
    })

    return results
  }, [appointments, filteredProfessionals, serviceConfigs, staffGoals, selectedMonth, selectedYear])

  // Overall occupation
  const overallOccupation = useMemo(() => {
    const totalSlots = serviceOccupationData.reduce((sum, s) => sum + s.totalSlots, 0)
    const bookedSlots = serviceOccupationData.reduce((sum, s) => sum + s.bookedSlots, 0)
    return totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0
  }, [serviceOccupationData])

  const handleSaveTask = () => {
    if (!taskForm.title || !taskForm.assignedTo) return

    if (editingTask) {
      setLocalTasks(
        localTasks.map((t) =>
          t.id === editingTask.id
            ? {
              ...t,
              ...taskForm,
              dueDate: new Date(taskForm.dueDate).toISOString(),
            }
            : t,
        ),
      )
    } else {
      const newTask: Task = {
        id: Date.now().toString(),
        ...taskForm,
        dueDate: new Date(taskForm.dueDate).toISOString(),
        assignedBy: user?.id || "1",
        status: "pending",
        createdAt: new Date().toISOString(),
      }
      setLocalTasks([newTask, ...localTasks])
    }

    setShowDialog(false)
    setEditingTask(null)
    setTaskForm({
      title: "",
      description: "",
      assignedTo: "",
      priority: "medium",
      dueDate: format(new Date(), "yyyy-MM-dd"),
      category: "other",
    })
  }

  const handleSaveGoal = () => {
    if (!goalForm.serviceId) return

    const serviceName = goalForm.serviceId // Selection is now the name directly

    const existingGoal = (staffGoals || []).find(
      (g) => g.title === `Ocupación ${serviceName}` &&
        new Date(g.startDate).getMonth() === selectedMonth &&
        new Date(g.startDate).getFullYear() === selectedYear
    )

    if (existingGoal) {
      updateGoal(existingGoal.id, { targetValue: goalForm.targetOccupation })
    } else {
      addGoal({
        title: `Ocupación ${serviceName}`,
        description: `Objetivo de ocupación para ${serviceName} en ${months[selectedMonth]} ${selectedYear}`,
        targetValue: goalForm.targetOccupation,
        currentValue: 0,
        unit: "%",
        startDate: startOfMonth(new Date(selectedYear, selectedMonth)),
        endDate: endOfMonth(new Date(selectedYear, selectedMonth)),
        status: "active"
      })
    }

    setShowGoalDialog(false)
    setGoalForm({ serviceId: "", targetOccupation: 70 })
  }

  const handleEditTask = (task: Task) => {
    if (task.id.startsWith("task-")) return // Cannot edit global tasks from here yet
    setEditingTask(task)
    setTaskForm({
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo,
      priority: task.priority,
      dueDate: format(new Date(task.dueDate), "yyyy-MM-dd"),
      category: task.category,
    })
    setShowDialog(true)
  }

  const toggleTaskStatus = (task: Task) => {
    if (task.id.startsWith("task-")) {
      const globalTask = (staffTasks || []).find((t: any) => t.id === task.id)
      updateTask(task.id, { status: globalTask?.status === "completed" ? "pending" : "completed" })
    } else {
      const newStatus = task.status === "completed" ? "pending" : "completed"
      setLocalTasks(
        localTasks.map((t) =>
          t.id === task.id
            ? {
              ...t,
              status: newStatus,
              completedAt: newStatus === "completed" ? new Date().toISOString() : undefined,
            }
            : t,
        ),
      )
    }
  }

  const handleConfirmAdjustment = (adjustmentId: string, taskId: string) => {
    confirmAdjustmentResolution(adjustmentId)
    updateTask(taskId, { status: "completed" })
    toast({
      title: "Resolución confirmada",
      description: "El pago inter-profesional ha sido resuelto y la tarea marcada como completada.",
    })
  }

  const handleDeleteTask = (taskId: string) => {
    if (taskId.startsWith("task-")) {
      deleteTask(taskId)
    } else {
      setLocalTasks(localTasks.filter((t) => t.id !== taskId))
    }
  }

  const handleDeleteGoal = (goalId: string) => {
    deleteStaffGoal(goalId)
  }

  const filteredTasks = useMemo(() => {
    return combinedTasks.filter((task) => {
      if (filterStatus !== "all" && task.status !== filterStatus) return false
      if (filterPriority !== "all" && task.priority !== filterPriority) return false
      return true
    })
  }, [combinedTasks, filterStatus, filterPriority])

  const pendingTasksCount = filteredTasks.filter((t) => t.status === "pending" || t.status === "in_progress").length
  const completedTasksCount = filteredTasks.filter((t) => t.status === "completed").length
  const urgentTasksCount = filteredTasks.filter((t) => t.priority === "urgent" && t.status !== "completed").length

  const getUserName = (userId: string) => {
    const u = users.find((u) => u.id === userId)
    return u?.name || "Sin asignar"
  }

  const getOccupationColor = (current: number, target: number) => {
    if (target === 0) return "text-gray-500"
    const ratio = current / target
    if (ratio >= 1) return "text-green-600"
    if (ratio >= 0.7) return "text-yellow-600"
    return "text-red-600"
  }

  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tareas y Objetivos de Recepción</h1>
            <p className="text-muted-foreground">Gestión de tareas y objetivos de ocupación por servicio</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="tareas" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Tareas
            </TabsTrigger>
            <TabsTrigger value="ocupacion" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Objetivos de Ocupación
            </TabsTrigger>
          </TabsList>

          {/* TAREAS TAB */}
          <TabsContent value="tareas" className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Tarea
              </Button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{pendingTasksCount}</p>
                      <p className="text-sm text-muted-foreground">Pendientes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{completedTasksCount}</p>
                      <p className="text-sm text-muted-foreground">Completadas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{urgentTasksCount}</p>
                      <p className="text-sm text-muted-foreground">Urgentes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CheckSquare className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{combinedTasks.length}</p>
                      <p className="text-sm text-muted-foreground">Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filtros */}
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Filtrar:</span>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="in_progress">En Progreso</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las prioridades</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="low">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lista de Tareas */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Tareas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredTasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No hay tareas que coincidan con los filtros</p>
                    </div>
                  ) : (
                    filteredTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-4 border rounded-lg flex items-start gap-4 ${task.status === "completed" ? "bg-gray-50 opacity-75" : ""
                          }`}
                      >
                        <button onClick={() => toggleTaskStatus(task)} className="mt-1 flex-shrink-0">
                          {task.status === "completed" ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400 hover:text-green-500" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3
                              className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""
                                }`}
                            >
                              {task.title}
                            </h3>
                            <div className="flex gap-2 flex-shrink-0">
                              <Badge className={priorityColors[task.priority]}>{priorityLabels[task.priority]}</Badge>
                              <Badge className={statusColors[task.status]}>{statusLabels[task.status]}</Badge>
                            </div>
                          </div>
                          {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}

                          {task.linkedAdjustmentId && (
                            <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-md">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Link className="h-3 w-3 text-amber-700" />
                                  <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Transferencia Pendiente</span>
                                </div>
                                <span className="text-xs font-bold text-amber-900">{formatCurrency(interProfessionalAdjustments.find(a => a.id === task.linkedAdjustmentId)?.amount || 0)}</span>
                              </div>

                              {interProfessionalAdjustments.find(a => a.id === task.linkedAdjustmentId)?.professionalMarkedAsDone ? (
                                <div className="space-y-2">
                                  <div className="text-[10px] text-green-700 bg-green-100/50 px-2 py-1 rounded border border-green-200 flex items-center gap-1.5">
                                    <CheckCircle2 className="h-3 w-3" /> El profesional ya notificó la transferencia
                                  </div>
                                  {task.status !== "completed" && (
                                    <Button
                                      size="sm"
                                      className="w-full bg-amber-600 hover:bg-amber-700 h-8 text-xs font-medium shadow-sm"
                                      onClick={() => handleConfirmAdjustment(task.linkedAdjustmentId!, task.id)}
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-1.5" /> Confirmar Recepción
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 p-2 bg-white/50 rounded border border-dashed border-amber-200">
                                  <Clock className="h-3 w-3 text-amber-600 animate-pulse" />
                                  <span className="text-[10px] text-amber-700 italic font-medium">Esperando comprobante del profesional...</span>
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {getUserName(task.assignedTo)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(task.dueDate), "dd/MM/yyyy")}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {categoryLabels[task.category]}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEditTask(task)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* OCUPACION TAB */}
          <TabsContent value="ocupacion" className="space-y-6">
            {/* Month/Year selector, Professional filter, and Add Goal button */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number.parseInt(v))}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number.parseInt(v))}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Popover open={profFilterOpen} onOpenChange={setProfFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="min-w-[200px] justify-between bg-transparent">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {selectedProfessionalIds.length === 0
                          ? "Todos los profesionales"
                          : selectedProfessionalIds.length === professionals.length
                            ? "Todos seleccionados"
                            : `${selectedProfessionalIds.length} profesional(es)`}
                      </div>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-0" align="start">
                    <div className="p-3 border-b">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">Filtrar por profesional</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={selectAllProfessionals}>
                            Todos
                          </Button>
                          <Button variant="ghost" size="sm" onClick={clearProfessionalFilter}>
                            Limpiar
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="max-h-60 overflow-auto p-2">
                      {professionals.map((prof) => (
                        <div
                          key={prof.id}
                          className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                          onClick={() => toggleProfessional(prof.id)}
                        >
                          <Checkbox checked={selectedProfessionalIds.includes(prof.id)} />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{prof.name}</p>
                            <p className="text-xs text-muted-foreground">{prof.specialty}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Selected professionals badges */}
                {selectedProfessionalIds.length > 0 && selectedProfessionalIds.length <= 3 && (
                  <div className="flex gap-1 flex-wrap">
                    {selectedProfessionalIds.map((id) => {
                      const prof = professionals.find((p) => p.id === id)
                      return prof ? (
                        <Badge key={id} variant="secondary" className="gap-1">
                          {prof.name}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-red-500"
                            onClick={() => toggleProfessional(id)}
                          />
                        </Badge>
                      ) : null
                    })}
                  </div>
                )}
              </div>

              {isSuperAdmin && (
                <Button onClick={() => setShowGoalDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Objetivo
                </Button>
              )}
            </div>

            {/* Overall Occupation */}
            <Card className="bg-gradient-to-r from-sky-50 to-blue-50 border-sky-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-sky-800">
                      Ocupación General - {months[selectedMonth]} {selectedYear}
                    </h2>
                    <p className="text-sm text-sky-600">
                      {selectedProfessionalIds.length === 0
                        ? "Todos los profesionales"
                        : `${selectedProfessionalIds.length} profesional(es) seleccionado(s)`}
                    </p>
                  </div>
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="56" fill="none" stroke="#e0e7ff" strokeWidth="12" />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke={overallOccupation >= 70 ? "#22c55e" : overallOccupation >= 50 ? "#eab308" : "#ef4444"}
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${(overallOccupation / 100) * 352} 352`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-sky-800">{overallOccupation}%</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-white/50 rounded-lg">
                  {overallOccupation >= 80 ? (
                    <p className="text-green-700 flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Excelente ocupación! Sigan así!
                    </p>
                  ) : overallOccupation >= 60 ? (
                    <p className="text-yellow-700 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Buena ocupación. Pueden mejorar un poco más!
                    </p>
                  ) : (
                    <p className="text-red-700 flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      La ocupación está baja. Es momento de impulsar las ventas!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Occupation by Service with Professional breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceOccupationData.map((service) => {
                const slotsNeeded =
                  service.targetOccupation > 0
                    ? Math.max(
                      0,
                      Math.ceil((service.targetOccupation / 100) * service.totalSlots) - service.bookedSlots,
                    )
                    : 0

                return (
                  <Card key={service.serviceId}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          {service.serviceName}
                        </CardTitle>
                        {isSuperAdmin && service.targetOccupation > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              const goal = (staffGoals || []).find(
                                (g) =>
                                  g.title.includes(service.serviceName) &&
                                  g.startDate.getMonth() === selectedMonth
                              )
                              if (goal) handleDeleteGoal(goal.id)
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-end justify-between">
                        <div>
                          <p
                            className={`text-3xl font-bold ${getOccupationColor(service.currentOccupation, service.targetOccupation)}`}
                          >
                            {service.currentOccupation}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {service.bookedSlots} / {service.totalSlots} turnos
                          </p>
                        </div>
                        {service.targetOccupation > 0 && (
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Objetivo: {service.targetOccupation}%</p>
                            <p className="text-xs text-muted-foreground">
                              Faltan <span className="font-semibold">{slotsNeeded}</span> turnos
                            </p>
                          </div>
                        )}
                      </div>
                      {service.targetOccupation > 0 && (
                        <Progress
                          value={service.progress}
                          className={`h-2 ${service.progress >= 100
                            ? "[&>div]:bg-green-500"
                            : service.progress >= 70
                              ? "[&>div]:bg-yellow-500"
                              : "[&>div]:bg-red-500"
                            }`}
                        />
                      )}

                      {service.professionals.length > 0 && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Por profesional:</p>
                          {service.professionals.map((prof) => (
                            <div key={prof.id} className="flex items-center justify-between text-sm">
                              <span className="truncate">{prof.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {prof.bookedSlots}/{prof.totalSlots}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={
                                    prof.occupation >= 70
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : prof.occupation >= 50
                                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                        : "bg-red-50 text-red-700 border-red-200"
                                  }
                                >
                                  {prof.occupation}%
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {serviceOccupationData.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay datos de ocupación para los profesionales seleccionados</p>
                  {selectedProfessionalIds.length > 0 && (
                    <Button variant="link" onClick={clearProfessionalFilter}>
                      Limpiar filtro de profesionales
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Task Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTask ? "Editar Tarea" : "Nueva Tarea"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="Título de la tarea"
                />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Descripción de la tarea"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Asignar a</Label>
                  <Select
                    value={taskForm.assignedTo}
                    onValueChange={(v) => setTaskForm({ ...taskForm, assignedTo: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar usuario" />
                    </SelectTrigger>
                    <SelectContent>
                      {adminUsers.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prioridad</Label>
                  <Select
                    value={taskForm.priority}
                    onValueChange={(v) => setTaskForm({ ...taskForm, priority: v as Task["priority"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha límite</Label>
                  <Input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Categoría</Label>
                  <Select
                    value={taskForm.category}
                    onValueChange={(v) => setTaskForm({ ...taskForm, category: v as Task["category"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="administrative">Administrativa</SelectItem>
                      <SelectItem value="client">Clientes</SelectItem>
                      <SelectItem value="inventory">Inventario</SelectItem>
                      <SelectItem value="financial">Financiera</SelectItem>
                      <SelectItem value="other">Otra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveTask} disabled={!taskForm.title || !taskForm.assignedTo}>
                {editingTask ? "Guardar Cambios" : "Crear Tarea"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Goal Dialog */}
        <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Objetivo de Ocupación</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Servicio</Label>
                <Select value={goalForm.serviceId} onValueChange={(v) => setGoalForm({ ...goalForm, serviceId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set([
                      ...professionals.map((p) => p.specialty).filter(Boolean),
                      ...serviceConfigs.map((s) => s.name)
                    ])).sort().map((serviceName) => (
                      <SelectItem key={serviceName} value={serviceName}>
                        {serviceName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Objetivo de ocupación: {goalForm.targetOccupation}%</Label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={goalForm.targetOccupation}
                  onChange={(e) => setGoalForm({ ...goalForm, targetOccupation: Number.parseInt(e.target.value) })}
                  className="w-full mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Para: {months[selectedMonth]} {selectedYear}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGoalDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveGoal} disabled={!goalForm.serviceId}>
                Guardar Objetivo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
