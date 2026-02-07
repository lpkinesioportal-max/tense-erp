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
        <div className="space-y-2">
            {/* Positive Points - Ultra Compact */}
            <div className="bg-green-50/30 p-1.5 rounded-lg border border-green-100/30 space-y-1">
                <div className="flex items-center justify-between">
                    <Label className="text-green-700 font-bold flex items-center gap-1 text-[9px]">
                        <Heart className="h-2.5 w-2.5 fill-green-500 text-green-500" /> Puntos Extra
                    </Label>
                    <div className="flex items-center gap-1">
                        <Badge className="bg-green-600 text-white font-bold text-[10px] h-5 w-5 flex items-center justify-center p-0 rounded">
                            {points.positivePoints}
                        </Badge>
                        <div className="flex gap-0.5">
                            <Button
                                variant="outline" size="sm"
                                className="h-4 w-4 p-0 bg-white border-green-200 text-green-700 hover:bg-green-100 rounded"
                                onClick={() => updatePoints({ positivePoints: points.positivePoints + 5 })}
                            >
                                <Plus className="h-2 w-2" />
                            </Button>
                            <Button
                                variant="outline" size="sm"
                                className="h-4 w-4 p-0 bg-white border-green-200 text-green-700 hover:bg-green-100 rounded"
                                onClick={() => updatePoints({ positivePoints: Math.max(0, points.positivePoints - 5) })}
                            >
                                <Minus className="h-2 w-2" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-x-1 gap-y-0.5">
                    {[
                        { key: "hydration", label: "Hidra" },
                        { key: "sleep", label: "Sueño" },
                        { key: "tasks", label: "Tarea" },
                        { key: "training", label: "Entr" },
                        { key: "progress", label: "Prog" },
                        { key: "painImproved", label: "Dolor" }
                    ].map(({ key, label }) => (
                        <div key={key} className="flex items-center gap-0.5 hover:bg-green-100/30 px-0.5 rounded transition-colors cursor-pointer"
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
                                className="h-2.5 w-4 data-[state=checked]:bg-green-600 scale-[0.6]"
                            />
                            <Label htmlFor={`pos-${key}`} className="text-[8px] font-semibold text-green-800 cursor-pointer select-none">{label}</Label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Negative Points - Ultra Compact */}
            <div className="bg-red-50/30 p-1.5 rounded-lg border border-red-100/30 space-y-1">
                <div className="flex items-center justify-between">
                    <Label className="text-red-700 font-bold flex items-center gap-1 text-[9px]">
                        <AlertCircle className="h-2.5 w-2.5 fill-red-500 text-red-500" /> Descuentos
                    </Label>
                    <div className="flex items-center gap-1">
                        <Badge className="bg-red-600 text-white font-bold text-[10px] h-5 w-5 flex items-center justify-center p-0 rounded">
                            {points.negativePoints}
                        </Badge>
                        <div className="flex gap-0.5">
                            <Button
                                variant="outline" size="sm"
                                className="h-4 w-4 p-0 bg-white border-red-200 text-red-700 hover:bg-red-100 rounded"
                                onClick={() => updatePoints({ negativePoints: points.negativePoints + 5 })}
                            >
                                <Plus className="h-2 w-2" />
                            </Button>
                            <Button
                                variant="outline" size="sm"
                                className="h-4 w-4 p-0 bg-white border-red-200 text-red-700 hover:bg-red-100 rounded"
                                onClick={() => updatePoints({ negativePoints: Math.max(0, points.negativePoints - 5) })}
                            >
                                <Minus className="h-2 w-2" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-1 gap-y-0.5">
                    {[
                        { key: "noTasks", label: "No Tarea" },
                        { key: "painWorsened", label: "Dolor +" },
                        { key: "noData", label: "Sin Dato" },
                        { key: "others", label: "Otros" }
                    ].map(({ key, label }) => (
                        <div key={key} className="flex items-center gap-0.5 hover:bg-red-100/30 px-0.5 rounded transition-colors cursor-pointer"
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
                                className="h-2.5 w-4 data-[state=checked]:bg-red-600 scale-[0.6]"
                            />
                            <Label htmlFor={`neg-${key}`} className="text-[8px] font-semibold text-red-800 cursor-pointer select-none">{label}</Label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Note - Compact */}
            <div className="space-y-0.5">
                <Label className="text-[8px] font-bold text-slate-400 uppercase">Nota</Label>
                <Textarea
                    value={points.note}
                    onChange={(e) => updatePoints({ note: e.target.value })}
                    placeholder="Opcional..."
                    className="h-10 resize-none bg-slate-50/50 text-[10px] rounded-lg p-1.5"
                />
            </div>
        </div>
    )
}
