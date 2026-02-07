"use client"

import { useState } from "react"
import { Plus, Trash2, Calendar, Trophy, AlertCircle, Eye, EyeOff } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useData } from "@/lib/data-context"
import { PatientTask, PatientTaskType, PatientTaskFrequency } from "@/lib/types"
import { toast } from "sonner"

interface ProfessionalTaskManagerProps {
    clientId: string
    professionalId: string
    tasks: PatientTask[]
}

export function ProfessionalTaskManager({ clientId, professionalId, tasks }: ProfessionalTaskManagerProps) {
    const { addPatientTask } = useData() // I need to make sure this is exported/available
    const [showAddDialog, setShowAddDialog] = useState(false)

    const [newTask, setNewTask] = useState({
        title: "",
        description: "",
        type: "habitos" as PatientTaskType,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
        frequency: "diaria" as PatientTaskFrequency,
        pointsValue: 10,
        visibleToPatient: true,
    })

    const handleAddTask = () => {
        if (!newTask.title) {
            toast.error("El título es obligatorio")
            return
        }

        addPatientTask(clientId, {
            ...newTask,
            clientId,
            professionalId,
            status: "pending",
            startDate: new Date(newTask.startDate),
            endDate: new Date(newTask.endDate),
        })

        toast.success("Tarea asignada con éxito")
        setShowAddDialog(false)
        setNewTask({
            title: "",
            description: "",
            type: "habitos",
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
            frequency: "diaria",
            pointsValue: 10,
            visibleToPatient: true,
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold">Tareas y Seguimiento</h3>
                    <p className="text-sm text-muted-foreground">Asigna tareas activas al paciente para su recuperación</p>
                </div>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary">
                            <Plus className="h-4 w-4 mr-2" />
                            Asignar Tarea
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Nueva Tarea para Paciente</DialogTitle>
                            <DialogDescription>
                                Define objetivos claros para que el paciente realice fuera de la sesión.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Título de la Tarea *</Label>
                                <Input
                                    id="title"
                                    placeholder="Ej: Tomar 2L de agua"
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="desc">Descripción / Instrucciones</Label>
                                <Textarea
                                    id="desc"
                                    placeholder="Detalla cómo debe realizar esta tarea..."
                                    value={newTask.description}
                                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Tipo de Tarea</Label>
                                    <Select
                                        value={newTask.type}
                                        onValueChange={(v: any) => setNewTask({ ...newTask, type: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="habitos">Hábitos</SelectItem>
                                            <SelectItem value="salud">Salud</SelectItem>
                                            <SelectItem value="recuperacion">Recuperación</SelectItem>
                                            <SelectItem value="nutricion">Nutrición</SelectItem>
                                            <SelectItem value="sueño">Sueño</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Frecuencia</Label>
                                    <Select
                                        value={newTask.frequency}
                                        onValueChange={(v: any) => setNewTask({ ...newTask, frequency: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unica">Única</SelectItem>
                                            <SelectItem value="diaria">Diaria</SelectItem>
                                            <SelectItem value="semanal">Semanal</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Vence en</Label>
                                    <Input
                                        type="date"
                                        value={newTask.endDate}
                                        onChange={(e) => setNewTask({ ...newTask, endDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Valor (pts)</Label>
                                    <Input
                                        type="number"
                                        value={newTask.pointsValue}
                                        onChange={(e) => setNewTask({ ...newTask, pointsValue: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-2 border rounded-lg bg-muted/30">
                                <div className="flex flex-col">
                                    <Label className="text-sm font-medium">Visible para el paciente</Label>
                                    <p className="text-[10px] text-muted-foreground">Si se desactiva, solo tú verás esta tarea</p>
                                </div>
                                <Switch
                                    checked={newTask.visibleToPatient}
                                    onCheckedChange={(v) => setNewTask({ ...newTask, visibleToPatient: v })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
                            <Button onClick={handleAddTask}>Asignar Tarea</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-3">
                {tasks.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed rounded-xl">
                        <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground italic">No hay tareas asignadas para este paciente</p>
                    </div>
                ) : (
                    tasks.map((task) => (
                        <Card key={task.id} className="shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="outline" className="text-[10px] uppercase">
                                                {task.type}
                                            </Badge>
                                            {task.status === "completed" ? (
                                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 text-[10px]">
                                                    CUMPLIDA
                                                </Badge>
                                            ) : task.status === "expired" ? (
                                                <Badge variant="destructive" className="text-[10px]">VENCIDA</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-[10px]">PENDIENTE</Badge>
                                            )}
                                            {task.visibleToPatient ? (
                                                <Eye className="h-3 w-3 text-emerald-500" />
                                            ) : (
                                                <EyeOff className="h-3 w-3 text-slate-400" />
                                            )}
                                        </div>
                                        <h4 className="font-bold underline md:no-underline">{task.title}</h4>
                                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                                        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                Fin: {new Date(task.endDate).toLocaleDateString()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Trophy className="h-3 w-3 text-amber-500" />
                                                {task.pointsValue} pts
                                            </span>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-destructive h-8 w-8">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
