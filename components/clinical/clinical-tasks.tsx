"use client"

import type React from "react"

import { useState } from "react"
import { format, differenceInDays, isToday } from "date-fns"
import { es } from "date-fns/locale"
import {
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Calendar,
  Target,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  MessageSquare,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit,
  FileCheck,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { useData } from "@/lib/data-context"
import type { ClinicalTask, Professional } from "@/lib/types"

interface ClinicalTasksProps {
  clientId: string
  professionals: Professional[]
  currentProfessionalId?: string
  isPatient?: boolean
  isSuperAdmin?: boolean
}

const serviceLabels: Record<string, string> = {
  kinesiology: "Kinesiología",
  training: "Entrenamiento",
  nutrition: "Nutrición",
  yoga: "Yoga",
  massage: "Masajes",
  general: "General",
}

const serviceColors: Record<string, string> = {
  kinesiology: "bg-blue-100 text-blue-800",
  training: "bg-orange-100 text-orange-800",
  nutrition: "bg-green-100 text-green-800",
  yoga: "bg-purple-100 text-purple-800",
  massage: "bg-pink-100 text-pink-800",
  general: "bg-gray-100 text-gray-800",
}

const priorityLabels: Record<string, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
}

const priorityColors: Record<string, string> = {
  high: "bg-red-100 text-red-800 border-red-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  low: "bg-green-100 text-green-800 border-green-300",
}

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-yellow-500" />,
  in_progress: <Target className="h-4 w-4 text-blue-500" />,
  completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  overdue: <AlertTriangle className="h-4 w-4 text-red-500" />,
  cancelled: <XCircle className="h-4 w-4 text-gray-500" />,
}

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  in_progress: "En curso",
  completed: "Completada",
  overdue: "Vencida",
  cancelled: "Anulada",
}

export function ClinicalTasks({
  clientId,
  professionals,
  currentProfessionalId,
  isPatient = false,
  isSuperAdmin = false,
}: ClinicalTasksProps) {
  const {
    getClientClinicalTasks,
    addClinicalTask,
    updateClinicalTask,
    deleteClinicalTask,
    completeClinicalTask,
    validateClinicalTask,
  } = useData()

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingTask, setEditingTask] = useState<ClinicalTask | null>(null)
  const [showEvidenceDialog, setShowEvidenceDialog] = useState(false)
  const [selectedTaskForEvidence, setSelectedTaskForEvidence] = useState<ClinicalTask | null>(null)
  const [evidenceType, setEvidenceType] = useState<"photo" | "comment">("comment")
  const [evidenceContent, setEvidenceContent] = useState("")
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [filterStatus, setFilterStatus] = useState<string>("active")

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    service: "general" as ClinicalTask["service"],
    priority: "medium" as ClinicalTask["priority"],
    impactType: "positive" as ClinicalTask["impactType"],
    points: 10,
    frequency: "once" as ClinicalTask["frequency"],
    customFrequency: "",
    startDate: format(new Date(), "yyyy-MM-dd"),
    dueDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    assignedProfessionalId: currentProfessionalId || "",
    internalNotes: "",
    visibleToPatient: true,
  })

  const tasks = getClientClinicalTasks(clientId)

  const filteredTasks = tasks.filter((task) => {
    if (isPatient && !task.visibleToPatient) return false
    if (filterStatus === "active") return ["pending", "in_progress"].includes(task.status)
    if (filterStatus === "completed") return task.status === "completed"
    if (filterStatus === "overdue") return task.status === "overdue"
    return true
  })

  const activeTasks = tasks.filter((t) => ["pending", "in_progress"].includes(t.status))
  const completedTasks = tasks.filter((t) => t.status === "completed")
  const overdueTasks = tasks.filter((t) => t.status === "overdue")

  const toggleExpanded = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  const handleSubmit = () => {
    if (!formData.title.trim()) return

    if (editingTask) {
      updateClinicalTask(editingTask.id, {
        title: formData.title,
        description: formData.description,
        service: formData.service,
        priority: formData.priority,
        impactType: formData.impactType,
        points: formData.points,
        frequency: formData.frequency,
        customFrequency: formData.customFrequency,
        startDate: new Date(formData.startDate),
        dueDate: new Date(formData.dueDate),
        assignedProfessionalId: formData.assignedProfessionalId,
        internalNotes: formData.internalNotes,
        visibleToPatient: formData.visibleToPatient,
      })
    } else {
      addClinicalTask({
        clientId,
        title: formData.title,
        description: formData.description,
        service: formData.service,
        priority: formData.priority,
        impactType: formData.impactType,
        points: formData.points,
        frequency: formData.frequency,
        customFrequency: formData.customFrequency,
        startDate: new Date(formData.startDate),
        dueDate: new Date(formData.dueDate),
        status: "pending",
        assignedProfessionalId: formData.assignedProfessionalId,
        assignedByProfessionalId: currentProfessionalId || "",
        internalNotes: formData.internalNotes,
        visibleToPatient: formData.visibleToPatient,
      })
    }

    setShowAddDialog(false)
    setEditingTask(null)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      service: "general",
      priority: "medium",
      impactType: "positive",
      points: 10,
      frequency: "once",
      customFrequency: "",
      startDate: format(new Date(), "yyyy-MM-dd"),
      dueDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      assignedProfessionalId: currentProfessionalId || "",
      internalNotes: "",
      visibleToPatient: true,
    })
  }

  const handleEdit = (task: ClinicalTask) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description,
      service: task.service,
      priority: task.priority,
      impactType: task.impactType,
      points: task.points,
      frequency: task.frequency,
      customFrequency: task.customFrequency || "",
      startDate: format(new Date(task.startDate), "yyyy-MM-dd"),
      dueDate: format(new Date(task.dueDate), "yyyy-MM-dd"),
      assignedProfessionalId: task.assignedProfessionalId,
      internalNotes: task.internalNotes || "",
      visibleToPatient: task.visibleToPatient,
    })
    setShowAddDialog(true)
  }

  const handleCompleteWithEvidence = (task: ClinicalTask) => {
    setSelectedTaskForEvidence(task)
    setShowEvidenceDialog(true)
  }

  const submitEvidence = () => {
    if (selectedTaskForEvidence && evidenceContent.trim()) {
      completeClinicalTask(selectedTaskForEvidence.id, {
        type: evidenceType,
        content: evidenceContent,
      })
      setShowEvidenceDialog(false)
      setSelectedTaskForEvidence(null)
      setEvidenceContent("")
    }
  }

  const handleQuickComplete = (task: ClinicalTask) => {
    completeClinicalTask(task.id)
  }

  const getDaysRemaining = (dueDate: Date) => {
    return differenceInDays(new Date(dueDate), new Date())
  }

  const getTaskUrgency = (task: ClinicalTask) => {
    if (task.status === "completed") return "completed"
    if (task.status === "overdue") return "overdue"
    const days = getDaysRemaining(task.dueDate)
    if (days <= 0) return "overdue"
    if (days <= 2) return "urgent"
    if (days <= 5) return "warning"
    return "normal"
  }

  const getProfessionalName = (id: string) => {
    const prof = professionals.find((p) => p.id === id)
    return prof?.name || "Profesional"
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{activeTasks.length}</p>
                <p className="text-xs text-blue-600">Tareas activas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">{completedTasks.length}</p>
                <p className="text-xs text-green-600">Completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-700">{overdueTasks.length}</p>
                <p className="text-xs text-red-600">Vencidas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700">
                  {completedTasks.reduce((sum, t) => sum + (t.impactType === "positive" ? t.points : -t.points), 0)}
                </p>
                <p className="text-xs text-purple-600">Puntos ganados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activas</SelectItem>
              <SelectItem value="completed">Completadas</SelectItem>
              <SelectItem value="overdue">Vencidas</SelectItem>
              <SelectItem value="all">Todas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!isPatient && (
          <Button
            onClick={() => {
              resetForm()
              setShowAddDialog(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarea
          </Button>
        )}
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay tareas en esta categoría</p>
            </div>
          </Card>
        ) : (
          filteredTasks.map((task) => {
            const urgency = getTaskUrgency(task)
            const daysRemaining = getDaysRemaining(task.dueDate)
            const isExpanded = expandedTasks.has(task.id)

            return (
              <Card
                key={task.id}
                className={cn(
                  "transition-all",
                  urgency === "urgent" && "border-red-300 bg-red-50/50",
                  urgency === "warning" && "border-yellow-300 bg-yellow-50/50",
                  urgency === "overdue" && "border-red-500 bg-red-100/50",
                  urgency === "completed" && "border-green-300 bg-green-50/50",
                )}
              >
                <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(task.id)}>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="pt-1">{statusIcons[task.status]}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="font-semibold">{task.title}</h4>
                            <Badge className={serviceColors[task.service]} variant="secondary">
                              {serviceLabels[task.service]}
                            </Badge>
                            <Badge className={priorityColors[task.priority]} variant="outline">
                              {priorityLabels[task.priority]}
                            </Badge>
                            {!task.visibleToPatient && !isPatient && (
                              <Badge variant="outline" className="text-xs">
                                <EyeOff className="h-3 w-3 mr-1" />
                                Oculta
                              </Badge>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>

                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(task.dueDate), "dd/MM/yyyy", { locale: es })}
                            </span>
                            {task.status !== "completed" && task.status !== "cancelled" && (
                              <span
                                className={cn(
                                  "flex items-center gap-1 font-medium",
                                  daysRemaining <= 0 && "text-red-600",
                                  daysRemaining > 0 && daysRemaining <= 2 && "text-orange-600",
                                  daysRemaining > 2 && "text-green-600",
                                )}
                              >
                                {daysRemaining <= 0
                                  ? isToday(new Date(task.dueDate))
                                    ? "Vence hoy"
                                    : `Vencida hace ${Math.abs(daysRemaining)} días`
                                  : `${daysRemaining} días restantes`}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              {task.impactType === "positive" ? (
                                <TrendingUp className="h-3 w-3 text-green-600" />
                              ) : (
                                <TrendingDown className="h-3 w-3 text-red-600" />
                              )}
                              {task.impactType === "positive" ? "+" : "-"}
                              {task.points} pts
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Actions based on role */}
                        {task.status === "pending" || task.status === "in_progress" ? (
                          <>
                            {isPatient ? (
                              <>
                                <Button size="sm" variant="outline" onClick={() => handleCompleteWithEvidence(task)}>
                                  <Camera className="h-4 w-4 mr-1" />
                                  Adjuntar
                                </Button>
                                <Button size="sm" onClick={() => handleQuickComplete(task)}>
                                  <Check className="h-4 w-4 mr-1" />
                                  Completar
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => handleEdit(task)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600"
                                  onClick={() => deleteClinicalTask(task.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </>
                        ) : task.status === "completed" && !task.validatedByProfessional && !isPatient ? (
                          <Button size="sm" variant="outline" onClick={() => validateClinicalTask(task.id)}>
                            <FileCheck className="h-4 w-4 mr-1" />
                            Validar
                          </Button>
                        ) : null}

                        <CollapsibleTrigger asChild>
                          <Button size="sm" variant="ghost">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </div>
                  </div>

                  <CollapsibleContent>
                    <Separator />
                    <div className="p-4 bg-muted/30 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Frecuencia</p>
                          <p className="font-medium">
                            {task.frequency === "once" && "Una vez"}
                            {task.frequency === "daily" && "Diaria"}
                            {task.frequency === "weekly" && "Semanal"}
                            {task.frequency === "custom" && task.customFrequency}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Fecha inicio</p>
                          <p className="font-medium">{format(new Date(task.startDate), "dd/MM/yyyy")}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Asignado a</p>
                          <p className="font-medium">{getProfessionalName(task.assignedProfessionalId)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Estado</p>
                          <div className="flex items-center gap-1">
                            {statusIcons[task.status]}
                            <span className="font-medium">{statusLabels[task.status]}</span>
                          </div>
                        </div>
                      </div>

                      {/* Evidence */}
                      {task.evidence && task.evidence.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Evidencia adjunta</p>
                          <div className="space-y-2">
                            {task.evidence.map((ev, idx) => (
                              <div key={idx} className="flex items-start gap-2 p-2 bg-white rounded border">
                                {ev.type === "photo" ? (
                                  <Camera className="h-4 w-4 text-blue-500 mt-0.5" />
                                ) : (
                                  <MessageSquare className="h-4 w-4 text-green-500 mt-0.5" />
                                )}
                                <div className="flex-1">
                                  <p className="text-sm">{ev.content}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(ev.submittedAt), "dd/MM/yyyy HH:mm")}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Internal notes (only for professionals) */}
                      {!isPatient && task.internalNotes && (
                        <div>
                          <p className="text-sm font-medium mb-1 flex items-center gap-1">
                            <EyeOff className="h-3 w-3" />
                            Notas internas
                          </p>
                          <p className="text-sm text-muted-foreground bg-yellow-50 p-2 rounded border border-yellow-200">
                            {task.internalNotes}
                          </p>
                        </div>
                      )}

                      {task.validatedByProfessional && (
                        <div className="flex items-center gap-2 text-green-600 text-sm">
                          <FileCheck className="h-4 w-4" />
                          <span>
                            Validada por profesional el {format(new Date(task.validatedAt!), "dd/MM/yyyy HH:mm")}
                          </span>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )
          })
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Editar Tarea" : "Nueva Tarea Clínica"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Título de la tarea *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej: Realizar ejercicios de estiramiento"
                />
              </div>

              <div className="col-span-2">
                <Label>Descripción detallada</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe la tarea con detalle..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Servicio</Label>
                <Select
                  value={formData.service}
                  onValueChange={(v: ClinicalTask["service"]) => setFormData({ ...formData, service: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kinesiology">Kinesiología</SelectItem>
                    <SelectItem value="training">Entrenamiento</SelectItem>
                    <SelectItem value="nutrition">Nutrición</SelectItem>
                    <SelectItem value="yoga">Yoga</SelectItem>
                    <SelectItem value="massage">Masajes</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Prioridad</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v: ClinicalTask["priority"]) => setFormData({ ...formData, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="low">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Impacto en progreso</Label>
                <Select
                  value={formData.impactType}
                  onValueChange={(v: ClinicalTask["impactType"]) => setFormData({ ...formData, impactType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">Positivo (suma puntos)</SelectItem>
                    <SelectItem value="negative">Negativo (resta puntos)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Puntos</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: Number.parseInt(e.target.value) || 10 })}
                />
              </div>

              <div>
                <Label>Frecuencia</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(v: ClinicalTask["frequency"]) => setFormData({ ...formData, frequency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Una vez</SelectItem>
                    <SelectItem value="daily">Diaria</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="custom">Personalizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.frequency === "custom" && (
                <div>
                  <Label>Frecuencia personalizada</Label>
                  <Input
                    value={formData.customFrequency}
                    onChange={(e) => setFormData({ ...formData, customFrequency: e.target.value })}
                    placeholder="Ej: 3 veces por semana"
                  />
                </div>
              )}

              <div>
                <Label>Fecha inicio</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div>
                <Label>Fecha límite</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>

              <div>
                <Label>Profesional asignado</Label>
                <Select
                  value={formData.assignedProfessionalId}
                  onValueChange={(v) => setFormData({ ...formData, assignedProfessionalId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.visibleToPatient}
                  onCheckedChange={(v) => setFormData({ ...formData, visibleToPatient: v })}
                />
                <Label className="flex items-center gap-1">
                  {formData.visibleToPatient ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {formData.visibleToPatient ? "Visible para paciente" : "Oculta para paciente"}
                </Label>
              </div>

              <div className="col-span-2">
                <Label>Observaciones internas (solo profesionales)</Label>
                <Textarea
                  value={formData.internalNotes}
                  onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                  placeholder="Notas que solo verán los profesionales..."
                  rows={2}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false)
                setEditingTask(null)
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.title.trim()}>
              {editingTask ? "Guardar cambios" : "Crear tarea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Evidence Dialog */}
      <Dialog open={showEvidenceDialog} onOpenChange={setShowEvidenceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjuntar evidencia</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Tipo de evidencia</Label>
              <Select value={evidenceType} onValueChange={(v: "photo" | "comment") => setEvidenceType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comment">Comentario</SelectItem>
                  <SelectItem value="photo">Foto (URL)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{evidenceType === "photo" ? "URL de la imagen" : "Tu comentario"}</Label>
              <Textarea
                value={evidenceContent}
                onChange={(e) => setEvidenceContent(e.target.value)}
                placeholder={evidenceType === "photo" ? "https://..." : "Describe cómo realizaste la tarea..."}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEvidenceDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={submitEvidence} disabled={!evidenceContent.trim()}>
              Enviar y completar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
