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
        <div className="space-y-6">
            <div className="space-y-4">
                {/* Positive Points */}
                <div className="bg-green-50/50 p-3 rounded-xl border border-green-100/50 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-0">
                            <Label className="text-green-700 font-bold flex items-center gap-1.5 text-xs">
                                <Heart className="h-3.5 w-3.5 fill-green-500 text-green-500" /> Puntos Extra
                            </Label>
                            <span className="text-[9px] text-green-600/70 font-medium uppercase tracking-wider ml-5">Bonificaciones</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className="bg-green-600 text-white hover:bg-green-700 font-bold text-base h-7 w-7 flex items-center justify-center p-0 rounded-md shadow-sm">
                                {points.positivePoints}
                            </Badge>
                            <div className="flex flex-col gap-1">
                                <Button
                                    variant="outline" size="sm"
                                    className="h-5 w-5 p-0 bg-white border-green-200 text-green-700 hover:bg-green-100 rounded-md"
                                    onClick={() => updatePoints({ positivePoints: points.positivePoints + 5 })}
                                >
                                    <Plus className="h-2.5 w-2.5" />
                                </Button>
                                <Button
                                    variant="outline" size="sm"
                                    className="h-5 w-5 p-0 bg-white border-green-200 text-green-700 hover:bg-green-100 rounded-md"
                                    onClick={() => updatePoints({ positivePoints: Math.max(0, points.positivePoints - 5) })}
                                >
                                    <Minus className="h-2 w-2" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-2 pt-1 border-t border-green-100/30">
                        {["hydration", "sleep", "tasks", "training", "progress", "painImproved"].map(key => (
                            <div key={key} className="flex items-center gap-2 hover:bg-green-100/30 p-1 rounded-md transition-colors cursor-pointer"
                                onClick={() => {
                                    const current = (points.justification as any)?.[key] || false;
                                    updatePoints({ justification: { ...points.justification, [key]: !current } });
                                }}>
                                <Switch
                                    id={`pos-${key}`}
                                    checked={(points.justification as any)?.[key] || false}
                                    onCheckedChange={(checked) => updatePoints({
                                        justification: { ...points.justification, [key]: checked }
                                    })}
                                    className="h-3 w-5 data-[state=checked]:bg-green-600 scale-75"
                                />
                                <Label htmlFor={`pos-${key}`} className="text-[10px] font-semibold text-green-800 cursor-pointer select-none leading-tight">
                                    {key === "hydration" ? "Hidra" :
                                        key === "sleep" ? "Sueño" :
                                            key === "tasks" ? "Tarea" :
                                                key === "training" ? "Entr" :
                                                    key === "progress" ? "Prog" :
                                                        key === "painImproved" ? "Dolor" : key}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Negative Points */}
                <div className="bg-red-50/50 p-3 rounded-xl border border-red-100/50 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-0">
                            <Label className="text-red-700 font-bold flex items-center gap-1.5 text-xs">
                                <AlertCircle className="h-3.5 w-3.5 fill-red-500 text-red-500" /> Descuentos
                            </Label>
                            <span className="text-[9px] text-red-600/70 font-medium uppercase tracking-wider ml-5">Penalizaciones</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className="bg-red-600 text-white hover:bg-red-700 font-bold text-base h-7 w-7 flex items-center justify-center p-0 rounded-md shadow-sm">
                                {points.negativePoints}
                            </Badge>
                            <div className="flex flex-col gap-1">
                                <Button
                                    variant="outline" size="sm"
                                    className="h-5 w-5 p-0 bg-white border-red-200 text-red-700 hover:bg-red-100 rounded-md"
                                    onClick={() => updatePoints({ negativePoints: points.negativePoints + 5 })}
                                >
                                    <Plus className="h-2.5 w-2.5" />
                                </Button>
                                <Button
                                    variant="outline" size="sm"
                                    className="h-5 w-5 p-0 bg-white border-red-200 text-red-700 hover:bg-red-100 rounded-md"
                                    onClick={() => updatePoints({ negativePoints: Math.max(0, points.negativePoints - 5) })}
                                >
                                    <Minus className="h-2 w-2" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-2 pt-1 border-t border-red-100/30">
                        {["noTasks", "painWorsened", "noData", "others"].map(key => (
                            <div key={key} className="flex items-center gap-2 hover:bg-red-100/30 p-1 rounded-md transition-colors cursor-pointer"
                                onClick={() => {
                                    const current = (points.justification as any)?.[key] || false;
                                    updatePoints({ justification: { ...points.justification, [key]: !current } });
                                }}>
                                <Switch
                                    id={`neg-${key}`}
                                    checked={(points.justification as any)?.[key] || false}
                                    onCheckedChange={(checked) => updatePoints({
                                        justification: { ...points.justification, [key]: checked }
                                    })}
                                    className="h-3 w-5 data-[state=checked]:bg-red-600 scale-75"
                                />
                                <Label htmlFor={`neg-${key}`} className="text-[10px] font-semibold text-red-800 cursor-pointer select-none leading-tight">
                                    {key === "noTasks" ? "No Tarea" :
                                        key === "painWorsened" ? "Dolor +" :
                                            key === "noData" ? "Sin Dato" : "Otros"}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Nota Interna</Label>
                <Textarea
                    value={points.note}
                    onChange={(e) => updatePoints({ note: e.target.value })}
                    placeholder="Nota opcional..."
                    className="h-16 resize-none bg-slate-50 text-xs"
                />
            </div>
        </div>
    )
}
