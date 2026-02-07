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
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import { format, startOfMonth, endOfMonth, isBefore, addDays } from "date-fns"
import { es } from "date-fns/locale"
import {
  Plus,
  Target,
  TrendingUp,
  Calendar,
  Trash2,
  Edit,
  Award,
  BarChart3,
  DollarSign,
  Users,
  Clock,
  CheckSquare,
  ListTodo,
  MoreHorizontal,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Flag,
  Upload,
  Link,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface Goal {
  id: string
  title: string
  description: string
  professionalId: string
  type: "revenue" | "appointments" | "attendance" | "clients" | "custom"
  targetValue: number
  currentValue: number
  unit: string
  period: "weekly" | "monthly" | "quarterly" | "yearly"
  startDate: string
  endDate: string
  status: "active" | "completed" | "failed" | "cancelled"
  createdBy: string
  createdAt: string
}

interface NotionTask {
  id: string
  title: string
  description: string
  professionalId: string
  status: "backlog" | "todo" | "in_progress" | "done"
  priority: "low" | "medium" | "high" | "urgent"
  dueDate?: string
  tags: string[]
  subtasks: { id: string; title: string; completed: boolean }[]
  createdBy: string
  createdAt: string
  updatedAt: string
  linkedAdjustmentId?: string
  linkedAppointmentId?: string
}

const typeConfig = {
  revenue: { label: "Ingresos", icon: DollarSign, color: "text-green-600", bgColor: "bg-green-100" },
  appointments: { label: "Turnos", icon: Calendar, color: "text-blue-600", bgColor: "bg-blue-100" },
  attendance: { label: "Asistencia", icon: Clock, color: "text-purple-600", bgColor: "bg-purple-100" },
  clients: { label: "Clientes Nuevos", icon: Users, color: "text-orange-600", bgColor: "bg-orange-100" },
  custom: { label: "Personalizado", icon: Target, color: "text-gray-600", bgColor: "bg-gray-100" },
}

const statusConfig = {
  backlog: { label: "Backlog", color: "bg-gray-100 text-gray-700" },
  todo: { label: "Por Hacer", color: "bg-blue-100 text-blue-700" },
  in_progress: { label: "En Progreso", color: "bg-yellow-100 text-yellow-700" },
  done: { label: "Completado", color: "bg-green-100 text-green-700" },
}

const priorityConfig = {
  low: { label: "Baja", color: "text-gray-500", icon: Flag },
  medium: { label: "Media", color: "text-blue-500", icon: Flag },
  high: { label: "Alta", color: "text-orange-500", icon: Flag },
  urgent: { label: "Urgente", color: "text-red-500", icon: AlertCircle },
}

const periodLabels = {
  weekly: "Semanal",
  monthly: "Mensual",
  quarterly: "Trimestral",
  yearly: "Anual",
}

export default function TareasProfesionalesPage() {
  const { user } = useAuth()
  const {
    professionals,
    appointments,
    tasks: staffTasks,
    updateTask: updateStaffTask,
    deleteTask: deleteStaffTask,
    interProfessionalAdjustments,
    markAdjustmentAsDone
  } = useData()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("tareas")

  // Goals state
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: "1",
      title: "Objetivo de facturación mensual",
      description: "Alcanzar meta de ingresos del mes",
      professionalId: "1",
      type: "revenue",
      targetValue: 500000,
      currentValue: 320000,
      unit: "$",
      period: "monthly",
      startDate: startOfMonth(new Date()).toISOString(),
      endDate: endOfMonth(new Date()).toISOString(),
      status: "active",
      createdBy: "1",
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      title: "Turnos atendidos",
      description: "Cantidad de turnos a atender este mes",
      professionalId: "1",
      type: "appointments",
      targetValue: 80,
      currentValue: 52,
      unit: "turnos",
      period: "monthly",
      startDate: startOfMonth(new Date()).toISOString(),
      endDate: endOfMonth(new Date()).toISOString(),
      status: "active",
      createdBy: "1",
      createdAt: new Date().toISOString(),
    },
  ])

  // Tasks state (Notion-like)
  const [localTasks, setLocalTasks] = useState<NotionTask[]>([
    {
      id: "t1",
      title: "Preparar material para taller de postura",
      description: "Crear presentación y ejercicios prácticos para el taller del próximo mes",
      professionalId: "1",
      status: "in_progress",
      priority: "high",
      dueDate: addDays(new Date(), 7).toISOString(),
      tags: ["taller", "educación"],
      subtasks: [
        { id: "s1", title: "Investigar bibliografía", completed: true },
        { id: "s2", title: "Crear slides", completed: false },
        { id: "s3", title: "Preparar ejercicios prácticos", completed: false },
      ],
      createdBy: "1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ])

  // Combine local mock tasks with global staff tasks
  const combinedTasks = useMemo(() => {
    const mappedGlobalTasks: NotionTask[] = (staffTasks || []).map(st => ({
      id: st.id,
      title: st.title,
      description: st.description,
      professionalId: st.assignedTo,
      status: st.status === "completed" ? "done" : "todo", // Simplifying mapping
      priority: "high", // Defaulting for global tasks
      dueDate: st.dueDate.toISOString(),
      tags: st.linkedAdjustmentId ? ["Finanzas", "Transferencia"] : ["Global"],
      subtasks: [],
      createdBy: "system",
      createdAt: st.createdAt.toISOString(),
      updatedAt: st.updatedAt?.toISOString() || st.createdAt.toISOString(),
      linkedAdjustmentId: st.linkedAdjustmentId,
      linkedAppointmentId: st.linkedAppointmentId,
    }))

    return [...localTasks, ...mappedGlobalTasks]
  }, [localTasks, staffTasks])

  const [showGoalDialog, setShowGoalDialog] = useState(false)
  const [showTaskDialog, setShowTaskDialog] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [editingTask, setEditingTask] = useState<NotionTask | null>(null)
  const [selectedProfessional, setSelectedProfessional] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban")
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())

  const [goalForm, setGoalForm] = useState({
    title: "",
    description: "",
    professionalId: "",
    type: "revenue" as Goal["type"],
    targetValue: 0,
    unit: "$",
    period: "monthly" as Goal["period"],
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    endDate: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  })

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    professionalId: "",
    status: "todo" as NotionTask["status"],
    priority: "medium" as NotionTask["priority"],
    dueDate: "",
    tags: "",
    subtasks: [] as { id: string; title: string; completed: boolean }[],
  })
  const [newSubtask, setNewSubtask] = useState("")

  const isSuperAdmin = user?.role === "super_admin"
  const isProfessional = user?.role === "profesional"

  const { goals: visibleGoals, tasks: visibleTasks } = useMemo(() => {
    if (isProfessional) {
      const profId = user?.professionalId
      return {
        goals: goals.filter((g) => profId && g.professionalId === profId),
        tasks: combinedTasks.filter((t) => profId && t.professionalId === profId),
      }
    }
    if (selectedProfessional === "all") {
      return { goals, tasks: combinedTasks }
    }
    return {
      goals: goals.filter((g) => g.professionalId === selectedProfessional),
      tasks: combinedTasks.filter((t) => t.professionalId === selectedProfessional),
    }
  }, [goals, combinedTasks, isProfessional, user, selectedProfessional])

  const activeGoals = visibleGoals.filter((g) => g.status === "active")

  // Task handlers
  const handleSaveTask = () => {
    if (!taskForm.title || !taskForm.professionalId) return

    const taskData = {
      ...taskForm,
      tags: taskForm.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).toISOString() : undefined,
    }

    if (editingTask) {
      setLocalTasks(
        localTasks.map((t) => (t.id === editingTask.id ? { ...t, ...taskData, updatedAt: new Date().toISOString() } : t)),
      )
    } else {
      const newTask: NotionTask = {
        id: Date.now().toString(),
        ...taskData,
        createdBy: user?.id || "1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setLocalTasks([newTask, ...localTasks])
    }

    setShowTaskDialog(false)
    setEditingTask(null)
    resetTaskForm()
  }

  const resetTaskForm = () => {
    setTaskForm({
      title: "",
      description: "",
      professionalId: "",
      status: "todo",
      priority: "medium",
      dueDate: "",
      tags: "",
      subtasks: [],
    })
    setNewSubtask("")
  }

  const handleEditTask = (task: NotionTask) => {
    setEditingTask(task)
    setTaskForm({
      title: task.title,
      description: task.description,
      professionalId: task.professionalId,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "",
      tags: task.tags.join(", "),
      subtasks: [...task.subtasks],
    })
    setShowTaskDialog(true)
  }

  const handleDeleteTask = (taskId: string) => {
    if (taskId.startsWith("task-")) {
      deleteStaffTask(taskId)
    } else {
      setLocalTasks(localTasks.filter((t) => t.id !== taskId))
    }
  }

  const handleStatusChange = (taskId: string, newStatus: NotionTask["status"]) => {
    if (taskId.startsWith("task-")) {
      updateStaffTask(taskId, { status: newStatus === "done" ? "completed" : "pending" })
    } else {
      setLocalTasks(
        localTasks.map((t) => (t.id === taskId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t)),
      )
    }
  }

  const handleCompleteAdjustment = (adjustmentId: string, taskId: string) => {
    // In a real app, this would open a file picker and upload
    const evidenceUrl = "https://example.com/comprobante-transferencia.pdf"
    markAdjustmentAsDone(adjustmentId, evidenceUrl)
    updateStaffTask(taskId, { status: "completed" })
    toast({
      title: "Transferencia notificada",
      description: "Se ha adjuntado el comprobante y notificado a recepción.",
    })
  }

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setLocalTasks(
      localTasks.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            subtasks: t.subtasks.map((s) => (s.id === subtaskId ? { ...s, completed: !s.completed } : s)),
            updatedAt: new Date().toISOString(),
          }
        }
        return t
      }),
    )
  }

  const addSubtaskToForm = () => {
    if (!newSubtask.trim()) return
    setTaskForm({
      ...taskForm,
      subtasks: [...taskForm.subtasks, { id: Date.now().toString(), title: newSubtask, completed: false }],
    })
    setNewSubtask("")
  }

  const removeSubtaskFromForm = (subtaskId: string) => {
    setTaskForm({
      ...taskForm,
      subtasks: taskForm.subtasks.filter((s) => s.id !== subtaskId),
    })
  }

  const toggleTaskExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks)
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId)
    } else {
      newExpanded.add(taskId)
    }
    setExpandedTasks(newExpanded)
  }

  // Goal handlers
  const handleSaveGoal = () => {
    if (!goalForm.title || !goalForm.professionalId || goalForm.targetValue <= 0) return

    if (editingGoal) {
      setGoals(
        goals.map((g) =>
          g.id === editingGoal.id
            ? {
              ...g,
              ...goalForm,
              startDate: new Date(goalForm.startDate).toISOString(),
              endDate: new Date(goalForm.endDate).toISOString(),
            }
            : g,
        ),
      )
    } else {
      const newGoal: Goal = {
        id: Date.now().toString(),
        ...goalForm,
        currentValue: 0,
        startDate: new Date(goalForm.startDate).toISOString(),
        endDate: new Date(goalForm.endDate).toISOString(),
        status: "active",
        createdBy: user?.id || "1",
        createdAt: new Date().toISOString(),
      }
      setGoals([newGoal, ...goals])
    }

    setShowGoalDialog(false)
    setEditingGoal(null)
    setGoalForm({
      title: "",
      description: "",
      professionalId: "",
      type: "revenue",
      targetValue: 0,
      unit: "$",
      period: "monthly",
      startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
      endDate: format(endOfMonth(new Date()), "yyyy-MM-dd"),
    })
  }

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal)
    setGoalForm({
      title: goal.title,
      description: goal.description,
      professionalId: goal.professionalId,
      type: goal.type,
      targetValue: goal.targetValue,
      unit: goal.unit,
      period: goal.period,
      startDate: format(new Date(goal.startDate), "yyyy-MM-dd"),
      endDate: format(new Date(goal.endDate), "yyyy-MM-dd"),
    })
    setShowGoalDialog(true)
  }

  const handleUpdateProgress = (goalId: string, newValue: number) => {
    setGoals(
      goals.map((g) => {
        if (g.id === goalId) {
          const updated = { ...g, currentValue: newValue }
          if (newValue >= g.targetValue) updated.status = "completed"
          return updated
        }
        return g
      }),
    )
  }

  const handleDeleteGoal = (goalId: string) => {
    setGoals(goals.filter((g) => g.id !== goalId))
  }

  const getProfessionalName = (profId: string) => {
    const prof = professionals.find((p) => p.id === profId)
    return prof?.name || "Sin asignar"
  }

  const getProgress = (goal: Goal) => Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))

  // Kanban columns
  const kanbanColumns: { status: NotionTask["status"]; title: string }[] = [
    { status: "backlog", title: "Backlog" },
    { status: "todo", title: "Por Hacer" },
    { status: "in_progress", title: "En Progreso" },
    { status: "done", title: "Completado" },
  ]

  const TaskCard = ({ task }: { task: NotionTask }) => {
    const isExpanded = expandedTasks.has(task.id)
    const completedSubtasks = task.subtasks.filter((s) => s.completed).length
    const PriorityIcon = priorityConfig[task.priority].icon
    const isOverdue = task.dueDate && isBefore(new Date(task.dueDate), new Date()) && task.status !== "done"

    return (
      <Card className={`mb-2 hover:shadow-md transition-shadow ${isOverdue ? "border-red-300" : ""}`}>
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            {task.subtasks.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 shrink-0 mt-0.5"
                onClick={() => toggleTaskExpanded(task.id)}
              >
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </Button>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditTask(task)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {kanbanColumns
                      .filter((c) => c.status !== task.status)
                      .map((col) => (
                        <DropdownMenuItem key={col.status} onClick={() => handleStatusChange(task.id, col.status)}>
                          Mover a {col.title}
                        </DropdownMenuItem>
                      ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDeleteTask(task.id)} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {!isProfessional && (
                <p className="text-xs text-muted-foreground mt-1">{getProfessionalName(task.professionalId)}</p>
              )}

              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <PriorityIcon className={`h-3.5 w-3.5 ${priorityConfig[task.priority].color}`} />
                {task.dueDate && (
                  <span className={`text-xs ${isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                    {format(new Date(task.dueDate), "dd MMM", { locale: es })}
                  </span>
                )}
                {task.subtasks.length > 0 && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckSquare className="h-3 w-3" />
                    {completedSubtasks}/{task.subtasks.length}
                  </span>
                )}
              </div>

              {task.linkedAdjustmentId && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-100 rounded-md">
                  <p className="text-[10px] font-semibold text-blue-700 uppercase mb-1 flex items-center gap-1">
                    <Link className="h-2 w-2" /> Turno Asociado
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Monto a transferir:</span>
                    <span className="text-xs font-bold text-blue-800">
                      {formatCurrency(interProfessionalAdjustments.find(a => a.id === task.linkedAdjustmentId)?.amount || 0)}
                    </span>
                  </div>
                  {task.status !== "done" && (
                    <Button
                      size="sm"
                      className="w-full mt-2 h-7 text-[10px] bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleCompleteAdjustment(task.linkedAdjustmentId!, task.id)}
                    >
                      <Upload className="h-3 w-3 mr-1" /> Adjuntar Comprobante
                    </Button>
                  )}
                  {task.status === "done" && (
                    <div className="mt-2 text-center">
                      {interProfessionalAdjustments.find(a => a.id === task.linkedAdjustmentId)?.status === "waiting_reception_validation" ? (
                        <div className="text-[10px] text-blue-600 font-medium flex items-center justify-center gap-1 bg-blue-100/50 py-1 rounded">
                          <Clock className="h-3 w-3 animate-pulse" /> Esperando validación de recepción
                        </div>
                      ) : (
                        <div className="text-[10px] text-green-600 font-medium flex items-center justify-center gap-1 bg-green-100/50 py-1 rounded">
                          <CheckSquare className="h-3 w-3" /> Transferencia Confirmada
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {task.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {isExpanded && task.subtasks.length > 0 && (
                <div className="mt-3 space-y-1.5 border-t pt-2">
                  {task.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={subtask.completed}
                        onCheckedChange={() => handleToggleSubtask(task.id, subtask.id)}
                        className="h-3.5 w-3.5"
                      />
                      <span className={`text-xs ${subtask.completed ? "line-through text-muted-foreground" : ""}`}>
                        {subtask.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tareas y Objetivos Profesionales</h1>
            <p className="text-muted-foreground">
              {isProfessional ? "Tus tareas y objetivos" : "Gestión de tareas y objetivos para profesionales"}
            </p>
          </div>
          {!isProfessional && (
            <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
              <SelectTrigger className="w-60">
                <SelectValue placeholder="Todos los profesionales" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los profesionales</SelectItem>
                {professionals.map((prof) => (
                  <SelectItem key={prof.id} value={prof.id}>
                    {prof.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="tareas" className="gap-2">
              <ListTodo className="h-4 w-4" />
              Tareas
            </TabsTrigger>
            <TabsTrigger value="objetivos" className="gap-2">
              <Target className="h-4 w-4" />
              Objetivos
            </TabsTrigger>
          </TabsList>

          {/* TAREAS TAB */}
          <TabsContent value="tareas" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "kanban" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("kanban")}
                >
                  Kanban
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  Lista
                </Button>
              </div>
              {isSuperAdmin && (
                <Button onClick={() => setShowTaskDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Tarea
                </Button>
              )}
            </div>

            {viewMode === "kanban" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kanbanColumns.map((column) => {
                  const columnTasks = visibleTasks.filter((t) => t.status === column.status)
                  return (
                    <div key={column.status} className="space-y-2">
                      <div className="flex items-center justify-between px-2">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <Badge className={statusConfig[column.status].color}>{column.title}</Badge>
                          <span className="text-muted-foreground">({columnTasks.length})</span>
                        </h3>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-2 min-h-[200px]">
                        {columnTasks.map((task) => (
                          <TaskCard key={task.id} task={task} />
                        ))}
                        {columnTasks.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-8">Sin tareas</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="p-3 font-medium">Tarea</th>
                        <th className="p-3 font-medium">Profesional</th>
                        <th className="p-3 font-medium">Estado</th>
                        <th className="p-3 font-medium">Prioridad</th>
                        <th className="p-3 font-medium">Fecha límite</th>
                        <th className="p-3 font-medium text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleTasks.map((task) => {
                        const PriorityIcon = priorityConfig[task.priority].icon
                        const isOverdue =
                          task.dueDate && isBefore(new Date(task.dueDate), new Date()) && task.status !== "done"
                        return (
                          <tr key={task.id} className="border-b hover:bg-muted/50">
                            <td className="p-3">
                              <div>
                                <p className="font-medium">{task.title}</p>
                                {task.tags.length > 0 && (
                                  <div className="flex gap-1 mt-1">
                                    {task.tags.map((tag) => (
                                      <Badge key={tag} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-sm">{getProfessionalName(task.professionalId)}</td>
                            <td className="p-3">
                              <Badge className={statusConfig[task.status].color}>
                                {statusConfig[task.status].label}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <span
                                className={`flex items-center gap-1 text-sm ${priorityConfig[task.priority].color}`}
                              >
                                <PriorityIcon className="h-4 w-4" />
                                {priorityConfig[task.priority].label}
                              </span>
                            </td>
                            <td className={`p-3 text-sm ${isOverdue ? "text-red-600 font-medium" : ""}`}>
                              {task.dueDate ? format(new Date(task.dueDate), "dd MMM yyyy", { locale: es }) : "-"}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleEditTask(task)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="text-red-500"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* OBJETIVOS TAB */}
          <TabsContent value="objetivos" className="space-y-4">
            <div className="flex justify-end">
              {isSuperAdmin && (
                <Button onClick={() => setShowGoalDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Objetivo
                </Button>
              )}
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Target className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{activeGoals.length}</p>
                      <p className="text-sm text-muted-foreground">Objetivos Activos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Award className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {visibleGoals.filter((g) => g.status === "completed").length}
                      </p>
                      <p className="text-sm text-muted-foreground">Completados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {activeGoals.length > 0
                          ? Math.round(activeGoals.reduce((acc, g) => acc + getProgress(g), 0) / activeGoals.length)
                          : 0}
                        %
                      </p>
                      <p className="text-sm text-muted-foreground">Progreso Promedio</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{visibleGoals.length}</p>
                      <p className="text-sm text-muted-foreground">Total Objetivos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Objetivos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {visibleGoals.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No hay objetivos definidos</p>
                  </CardContent>
                </Card>
              ) : (
                visibleGoals.map((goal) => {
                  const config = typeConfig[goal.type]
                  const Icon = config.icon
                  const progress = getProgress(goal)

                  return (
                    <Card
                      key={goal.id}
                      className={goal.status === "completed" ? "border-green-300 bg-green-50/30" : ""}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${config.bgColor}`}>
                              <Icon className={`h-5 w-5 ${config.color}`} />
                            </div>
                            <div>
                              <CardTitle className="text-base">{goal.title}</CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {getProfessionalName(goal.professionalId)}
                              </p>
                            </div>
                          </div>
                          {isSuperAdmin && (
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEditGoal(goal)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteGoal(goal.id)}
                                className="text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {goal.description && <p className="text-sm text-muted-foreground">{goal.description}</p>}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progreso</span>
                            <span className="font-medium">
                              {goal.currentValue.toLocaleString()} / {goal.targetValue.toLocaleString()} {goal.unit}
                            </span>
                          </div>
                          <Progress value={progress} className="h-3" />
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{progress}% completado</span>
                            <span>{periodLabels[goal.period]}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(goal.startDate), "dd MMM", { locale: es })} -{" "}
                            {format(new Date(goal.endDate), "dd MMM yyyy", { locale: es })}
                          </span>
                          {goal.status === "completed" ? (
                            <Badge className="bg-green-100 text-green-700">Completado</Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-700">Activo</Badge>
                          )}
                        </div>
                        {goal.status === "active" && (isSuperAdmin || isProfessional) && (
                          <div className="flex gap-2 pt-2 border-t">
                            <Input
                              type="number"
                              placeholder="Nuevo valor"
                              className="w-32"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  const input = e.target as HTMLInputElement
                                  if (input.value) {
                                    handleUpdateProgress(goal.id, Number(input.value))
                                    input.value = ""
                                  }
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement
                                if (input?.value) {
                                  handleUpdateProgress(goal.id, Number(input.value))
                                  input.value = ""
                                }
                              }}
                            >
                              Actualizar
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialog Nueva/Editar Tarea */}
        <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingTask ? "Editar Tarea" : "Nueva Tarea"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="Ej: Preparar material para taller"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Detalles de la tarea..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Profesional *</Label>
                  <Select
                    value={taskForm.professionalId}
                    onValueChange={(v) => setTaskForm({ ...taskForm, professionalId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {professionals.map((prof) => (
                        <SelectItem key={prof.id} value={prof.id}>
                          {prof.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select
                    value={taskForm.status}
                    onValueChange={(v) => setTaskForm({ ...taskForm, status: v as NotionTask["status"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {kanbanColumns.map((col) => (
                        <SelectItem key={col.status} value={col.status}>
                          {col.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prioridad</Label>
                  <Select
                    value={taskForm.priority}
                    onValueChange={(v) => setTaskForm({ ...taskForm, priority: v as NotionTask["priority"] })}
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
                <div className="space-y-2">
                  <Label>Fecha límite</Label>
                  <Input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Etiquetas (separadas por coma)</Label>
                <Input
                  value={taskForm.tags}
                  onChange={(e) => setTaskForm({ ...taskForm, tags: e.target.value })}
                  placeholder="Ej: taller, educación, importante"
                />
              </div>
              <div className="space-y-2">
                <Label>Subtareas</Label>
                <div className="flex gap-2">
                  <Input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    placeholder="Nueva subtarea"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSubtaskToForm())}
                  />
                  <Button type="button" variant="outline" onClick={addSubtaskToForm}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {taskForm.subtasks.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {taskForm.subtasks.map((subtask) => (
                      <div key={subtask.id} className="flex items-center justify-between bg-muted/50 rounded px-2 py-1">
                        <span className="text-sm">{subtask.title}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeSubtaskFromForm(subtask.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowTaskDialog(false)
                  setEditingTask(null)
                  resetTaskForm()
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveTask} disabled={!taskForm.title || !taskForm.professionalId}>
                {editingTask ? "Guardar Cambios" : "Crear Tarea"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Nuevo/Editar Objetivo */}
        <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingGoal ? "Editar Objetivo" : "Nuevo Objetivo"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                  placeholder="Ej: Objetivo de facturación mensual"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={goalForm.description}
                  onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                  placeholder="Detalles del objetivo..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Profesional *</Label>
                  <Select
                    value={goalForm.professionalId}
                    onValueChange={(v) => setGoalForm({ ...goalForm, professionalId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {professionals.map((prof) => (
                        <SelectItem key={prof.id} value={prof.id}>
                          {prof.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Objetivo</Label>
                  <Select
                    value={goalForm.type}
                    onValueChange={(v) => {
                      const type = v as Goal["type"]
                      let unit = "$"
                      if (type === "appointments") unit = "turnos"
                      else if (type === "attendance") unit = "%"
                      else if (type === "clients") unit = "clientes"
                      setGoalForm({ ...goalForm, type, unit })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">Ingresos</SelectItem>
                      <SelectItem value="appointments">Turnos</SelectItem>
                      <SelectItem value="attendance">Asistencia</SelectItem>
                      <SelectItem value="clients">Clientes Nuevos</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Meta *</Label>
                  <Input
                    type="number"
                    value={goalForm.targetValue || ""}
                    onChange={(e) => setGoalForm({ ...goalForm, targetValue: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unidad</Label>
                  <Input
                    value={goalForm.unit}
                    onChange={(e) => setGoalForm({ ...goalForm, unit: e.target.value })}
                    placeholder="$"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Período</Label>
                  <Select
                    value={goalForm.period}
                    onValueChange={(v) => setGoalForm({ ...goalForm, period: v as Goal["period"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha inicio</Label>
                  <Input
                    type="date"
                    value={goalForm.startDate}
                    onChange={(e) => setGoalForm({ ...goalForm, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha fin</Label>
                  <Input
                    type="date"
                    value={goalForm.endDate}
                    onChange={(e) => setGoalForm({ ...goalForm, endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowGoalDialog(false)
                  setEditingGoal(null)
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveGoal}
                disabled={!goalForm.title || !goalForm.professionalId || goalForm.targetValue <= 0}
              >
                {editingGoal ? "Guardar Cambios" : "Crear Objetivo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
