"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Heart, AlertCircle, Plus, Minus } from "lucide-react"
import { AdherenceEvaluation } from "@/lib/types"

interface AdherenceInputProps {
    value?: AdherenceEvaluation
    onChange: (value: AdherenceEvaluation) => void
}

export function AdherenceInput({ value, onChange }: AdherenceInputProps) {
    const [points, setPoints] = useState<AdherenceEvaluation>(value || {
        attendancePoints: 10,
        positivePoints: 0,
        negativePoints: 0,
        note: "",
        justification: {},
        showBreakdownToPatient: true,
        showNoteToPatient: false,
        assignedBy: "professional",
        assignedAt: new Date()
    })

    useEffect(() => {
        if (value) setPoints(value)
    }, [value])

    const updatePoints = (updates: Partial<AdherenceEvaluation>) => {
        const newVal = { ...points, ...updates }
        setPoints(newVal)
        onChange(newVal)
    }

    return (
        <div className="space-y-4">
            {/* Positive Points - Improved Readability */}
            <div className="bg-green-50/50 p-2.5 rounded-xl border border-green-100 space-y-2">
                <div className="flex items-center justify-between mb-1">
                    <Label className="text-green-700 font-bold flex items-center gap-1.5 text-xs">
                        <Heart className="h-3.5 w-3.5 fill-green-500 text-green-500" /> Puntos Positivos
                    </Label>
                    <div className="flex items-center gap-2">
                        <Badge className="bg-green-600 text-white font-bold text-sm h-6 px-2 flex items-center justify-center rounded-md">
                            {points.positivePoints}
                        </Badge>
                        <div className="flex gap-1">
                            <Button
                                variant="outline" size="sm"
                                className="h-6 w-6 p-0 bg-white border-green-200 text-green-700 hover:bg-green-100 rounded-md"
                                onClick={() => updatePoints({ positivePoints: points.positivePoints + 5 })}
                            >
                                <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="outline" size="sm"
                                className="h-6 w-6 p-0 bg-white border-green-200 text-green-700 hover:bg-green-100 rounded-md"
                                onClick={() => updatePoints({ positivePoints: Math.max(0, points.positivePoints - 5) })}
                            >
                                <Minus className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                    {[
                        { key: "hydration", label: "Hidratación" },
                        { key: "sleep", label: "Sueño" },
                        { key: "tasks", label: "Tareas" },
                        { key: "training", label: "Entrenamiento" },
                        { key: "progress", label: "Progreso" },
                        { key: "painImproved", label: "Mejora Dolor" }
                    ].map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between gap-2 hover:bg-green-100/30 p-1 rounded transition-colors cursor-pointer"
                            onClick={() => {
                                const current = (points.justification as any)?.[key] || false;
                                updatePoints({ justification: { ...points.justification, [key]: !current } });
                            }}>
                            <Label htmlFor={`pos-${key}`} className="text-[11px] font-semibold text-green-800 cursor-pointer select-none">{label}</Label>
                            <Switch
                                id={`pos-${key}`}
                                checked={(points.justification as any)?.[key] || false}
                                onCheckedChange={(checked) => updatePoints({
                                    justification: { ...points.justification, [key]: checked }
                                })}
                                className="h-3 w-5 data-[state=checked]:bg-green-600 scale-90"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Negative Points - Improved Readability */}
            <div className="bg-red-50/50 p-2.5 rounded-xl border border-red-100 space-y-2">
                <div className="flex items-center justify-between mb-1">
                    <Label className="text-red-700 font-bold flex items-center gap-1.5 text-xs">
                        <AlertCircle className="h-3.5 w-3.5 fill-red-500 text-red-500" /> Descuentos
                    </Label>
                    <div className="flex items-center gap-2">
                        <Badge className="bg-red-600 text-white font-bold text-sm h-6 px-2 flex items-center justify-center rounded-md">
                            {points.negativePoints}
                        </Badge>
                        <div className="flex gap-1">
                            <Button
                                variant="outline" size="sm"
                                className="h-6 w-6 p-0 bg-white border-red-200 text-red-700 hover:bg-red-100 rounded-md"
                                onClick={() => updatePoints({ negativePoints: points.negativePoints + 5 })}
                            >
                                <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="outline" size="sm"
                                className="h-6 w-6 p-0 bg-white border-red-200 text-red-700 hover:bg-red-100 rounded-md"
                                onClick={() => updatePoints({ negativePoints: Math.max(0, points.negativePoints - 5) })}
                            >
                                <Minus className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                    {[
                        { key: "noTasks", label: "Sin Tareas" },
                        { key: "painWorsened", label: "Dolor +" },
                        { key: "noData", label: "Sin Datos" },
                        { key: "others", label: "Otros" }
                    ].map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between gap-2 hover:bg-red-100/30 p-1 rounded transition-colors cursor-pointer"
                            onClick={() => {
                                const current = (points.justification as any)?.[key] || false;
                                updatePoints({ justification: { ...points.justification, [key]: !current } });
                            }}>
                            <Label htmlFor={`neg-${key}`} className="text-[11px] font-semibold text-red-800 cursor-pointer select-none">{label}</Label>
                            <Switch
                                id={`neg-${key}`}
                                checked={(points.justification as any)?.[key] || false}
                                onCheckedChange={(checked) => updatePoints({
                                    justification: { ...points.justification, [key]: checked }
                                })}
                                className="h-3 w-5 data-[state=checked]:bg-red-600 scale-90"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Note - Improved Readability */}
            <div className="space-y-1.5 px-1">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Observaciones de Adherencia</Label>
                <Textarea
                    value={points.note}
                    onChange={(e) => updatePoints({ note: e.target.value })}
                    placeholder="Escriba una nota opcional..."
                    className="min-h-[80px] resize-none bg-white text-sm rounded-xl p-3 border-slate-200 shadow-sm focus:ring-1 focus:ring-primary/20"
                />
            </div>
        </div>
    )
}
