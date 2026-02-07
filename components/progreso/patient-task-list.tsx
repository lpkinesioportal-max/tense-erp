"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
    CheckCircle2,
    Circle,
    Clock,
    AlertCircle,
    Trophy,
    Calendar,
    MessageSquare,
    Paperclip
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useData } from "@/lib/data-context"
import { PatientTask } from "@/lib/types"
import { toast } from "sonner"

interface PatientTaskListProps {
    clientId: string
    tasks: PatientTask[]
}

export function PatientTaskList({ clientId, tasks }: PatientTaskListProps) {
    const { updatePatientTaskStatus } = useData()
    const [selectedTask, setSelectedTask] = useState<PatientTask | null>(null)
    const [comment, setComment] = useState("")

    const handleComplete = (task: PatientTask) => {
        updatePatientTaskStatus(clientId, task.id, "completed", {
            comment,
            date: new Date()
        })
        toast.success("¡Tarea completada! Has sumado puntos a tu progreso.")
        setSelectedTask(null)
        setComment("")
    }

    const sortedTasks = [...tasks].sort((a, b) => {
        // Show pending first, then by date
        if (a.status === "pending" && b.status !== "pending") return -1
        if (a.status !== "pending" && b.status === "pending") return 1
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
    })

    return (
        <div className="space-y-4">
            {sortedTasks.length === 0 ? (
                <div className="text-center py-10 bg-muted/20 rounded-xl border-2 border-dashed">
                    <Calendar className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-muted-foreground font-medium">No tienes tareas asignadas</p>
                    <p className="text-xs text-muted-foreground mt-1">Tu profesional asignará tareas para tu recuperación</p>
                </div>
            ) : (
                sortedTasks.map((task) => (
                    <Card
                        key={task.id}
                        className={`overflow-hidden border-l-4 transition-all ${task.status === "completed"
                                ? "border-l-emerald-500 bg-emerald-50/10"
                                : task.status === "expired"
                                    ? "border-l-red-500 bg-red-50/10"
                                    : "border-l-blue-500 hover:shadow-md"
                            }`}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                                            {task.type}
                                        </Badge>
                                        {task.status === "completed" && (
                                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 text-[10px]">
                                                COMPLETADA
                                            </Badge>
                                        )}
                                        {task.status === "expired" && (
                                            <Badge variant="destructive" className="text-[10px]">
                                                VENCIDA
                                            </Badge>
                                        )}
                                    </div>
                                    <h4 className={`font-semibold text-lg truncate ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                                        {task.title}
                                    </h4>
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                        {task.description}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-muted-foreground font-medium">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            Límite: {format(new Date(task.endDate), "dd 'de' MMM", { locale: es })}
                                        </div>
                                        <div className="flex items-center gap-1 text-amber-600">
                                            <Trophy className="h-3 w-3" />
                                            +{task.pointsValue} pts
                                        </div>
                                        {task.frequency !== "unica" && (
                                            <div className="flex items-center gap-1 text-blue-600">
                                                <Calendar className="h-3 w-3" />
                                                Frecuencia: {task.frequency === "diaria" ? "Diaria" : "Semanal"}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center pt-1">
                                    {task.status === "pending" ? (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    onClick={() => setSelectedTask(task)}
                                                    size="sm"
                                                    className="bg-primary hover:bg-primary/90 rounded-full"
                                                >
                                                    Completar
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Completar Tarea</DialogTitle>
                                                    <DialogDescription>
                                                        Confirmas que has completado "{task.title}"
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="comment">Comentario (opcional)</Label>
                                                        <Textarea
                                                            id="comment"
                                                            placeholder="Cuéntanos cómo te fue con esta tarea..."
                                                            value={comment}
                                                            onChange={(e) => setComment(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                                        Al marcar esta tarea como completada sumarás {task.pointsValue} puntos a tu progreso acumulado.
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button variant="outline" onClick={() => setSelectedTask(null)}>Cancelar</Button>
                                                    <Button onClick={() => handleComplete(task)}>Confirmar</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    ) : task.status === "completed" ? (
                                        <div className="bg-emerald-100 text-emerald-700 p-2 rounded-full">
                                            <CheckCircle2 className="h-6 w-6" />
                                        </div>
                                    ) : (
                                        <div className="bg-red-100 text-red-700 p-2 rounded-full">
                                            <AlertCircle className="h-6 w-6" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {task.evidence && task.status === "completed" && (
                                <div className="mt-4 pt-4 border-t border-emerald-100 italic text-xs text-muted-foreground flex items-start gap-2">
                                    <MessageSquare className="h-3 w-3 mt-0.5" />
                                    "{task.evidence.comment || "Sin comentarios adicionales"}"
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    )
}
