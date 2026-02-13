"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    Plus, Trash2, ChevronDown, ChevronUp, Copy,
    Utensils, FileText, Video, MoreHorizontal
} from "lucide-react"
import { MediaUploadField } from "@/components/ui/media-upload-field"
import { cn } from "@/lib/utils"
import type { MealPlanItem, MealOption } from "@/lib/types"
import { MealTemplateSelector } from "./meal-template-selector"
import { MealTemplateSaveDialog } from "./meal-template-save-dialog"

interface MealPlanEditorProps {
    value: MealPlanItem[]
    onChange: (val: MealPlanItem[]) => void
}

export function MealPlanEditor({ value, onChange }: MealPlanEditorProps) {
    const meals = Array.isArray(value) ? value : []
    const [expandedMeal, setExpandedMeal] = useState<string | null>(meals[0]?.id || null)

    const updateMeal = (index: number, field: keyof MealPlanItem, val: any) => {
        const updated = [...meals]
        updated[index] = { ...updated[index], [field]: val }
        onChange(updated)
    }

    const addMeal = () => {
        const newMeal: MealPlanItem = {
            id: Date.now().toString(),
            name: "",
            options: [] // Empty options initially
        }
        onChange([...meals, newMeal])
        setExpandedMeal(newMeal.id)
    }

    const removeMeal = (index: number) => {
        if (confirm("¿Borrar esta comida?")) {
            onChange(meals.filter((_, i) => i !== index))
        }
    }

    // --- Option Management ---

    const addOption = (mealIndex: number) => {
        const updated = [...meals]
        const meal = updated[mealIndex]
        const newOption: MealOption = {
            id: Date.now().toString(),
            name: `Opción ${(meal.options?.length || 0) + 1}`,
            description: ""
        }

        updated[mealIndex] = {
            ...meal,
            options: [...(meal.options || []), newOption]
        }
        onChange(updated)
    }

    const updateOption = (mealIndex: number, optionIndex: number, field: keyof MealOption, val: any) => {
        const updated = [...meals]
        const options = [...updated[mealIndex].options]
        options[optionIndex] = { ...options[optionIndex], [field]: val }
        updated[mealIndex] = { ...updated[mealIndex], options }
        onChange(updated)
    }

    const removeOption = (mealIndex: number, optionIndex: number) => {
        const updated = [...meals]
        const options = [...updated[mealIndex].options]
        options.splice(optionIndex, 1)
        updated[mealIndex] = { ...updated[mealIndex], options }
        onChange(updated)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-end gap-2 mb-2">
                <MealTemplateSelector onSelect={onChange} />
                <MealTemplateSaveDialog content={meals} />
            </div>

            {meals.map((meal, mIdx) => {
                const isExpanded = expandedMeal === meal.id

                return (
                    <div key={meal.id} className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
                        {/* Meal Header */}
                        <div
                            className={cn("flex items-center gap-3 p-3 cursor-pointer transition-colors",
                                isExpanded ? "bg-slate-50" : "hover:bg-slate-50")}
                            onClick={() => setExpandedMeal(isExpanded ? null : meal.id)}
                        >
                            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                <Utensils className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                                <Input
                                    value={meal.name}
                                    onChange={e => updateMeal(mIdx, 'name', e.target.value)}
                                    onClick={e => e.stopPropagation()}
                                    placeholder="Nombre de la comida (ej: Desayuno)"
                                    className="h-8 font-bold text-sm bg-transparent border-transparent hover:border-slate-200 focus:bg-white focus:border-primary px-2 -ml-2 w-full max-w-[250px]"
                                />
                                <div className="text-xs text-slate-400 pl-0.5 mt-0.5">
                                    {(meal.options?.length || 0) === 0 ? "Sin opciones" : `${meal.options.length} opciones`}
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500"
                                onClick={(e) => { e.stopPropagation(); removeMeal(mIdx) }}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                        </div>

                        {/* Meal Content */}
                        {isExpanded && (
                            <div className="p-4 border-t border-slate-100 bg-slate-50/30 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-slate-400">Horario Sugerido</label>
                                        <Input
                                            value={meal.time || ""}
                                            onChange={e => updateMeal(mIdx, 'time', e.target.value)}
                                            placeholder="Ej: 08:00 hs"
                                            className="h-8 text-sm bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-slate-400">Notas / Observaciones</label>
                                        <Input
                                            value={meal.notes || ""}
                                            onChange={e => updateMeal(mIdx, 'notes', e.target.value)}
                                            placeholder="Ej: Acompañar con agua..."
                                            className="h-8 text-sm bg-white"
                                        />
                                    </div>
                                </div>

                                {/* Options List */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Opciones de Menú</label>
                                        <Button size="sm" variant="outline" onClick={() => addOption(mIdx)} className="h-7 text-xs bg-white text-orange-600 border-orange-200 hover:bg-orange-50">
                                            <Plus className="h-3 w-3 mr-1" /> Agregar Opción
                                        </Button>
                                    </div>

                                    {meal.options?.map((opt, oIdx) => (
                                        <div key={opt.id} className="bg-white border border-slate-200 rounded-lg p-3 space-y-3 relative group">
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-red-500" onClick={() => removeOption(mIdx, oIdx)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold mt-1 shrink-0">
                                                        {(oIdx + 1)}
                                                    </div>
                                                    <div className="flex-1 space-y-3">
                                                        <Input
                                                            value={opt.name}
                                                            onChange={e => updateOption(mIdx, oIdx, 'name', e.target.value)}
                                                            className="h-8 font-semibold text-sm border-0 border-b border-transparent focus:border-orange-500 focus:ring-0 px-0 rounded-none bg-transparent placeholder:text-slate-300"
                                                            placeholder={`Nombre de la Opción ${oIdx + 1}`}
                                                        />

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Ingredientes</label>
                                                                <Textarea
                                                                    value={opt.ingredients || ""}
                                                                    onChange={e => updateOption(mIdx, oIdx, 'ingredients', e.target.value)}
                                                                    placeholder="Lista de ingredientes..."
                                                                    className="min-h-[80px] text-sm resize-none bg-slate-50/50"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Preparación</label>
                                                                <Textarea
                                                                    value={opt.preparation || ""}
                                                                    onChange={e => updateOption(mIdx, oIdx, 'preparation', e.target.value)}
                                                                    placeholder="Pasos de la preparación..."
                                                                    className="min-h-[80px] text-sm resize-none bg-slate-50/50"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Legacy Description Fallback - Only show if it has data and new fields are empty */}
                                                        {opt.description && !opt.ingredients && !opt.preparation && (
                                                            <div className="bg-amber-50 p-2 rounded border border-amber-100">
                                                                <label className="text-[10px] font-bold text-amber-600 uppercase mb-1 block">Descripción (Antigua)</label>
                                                                <Textarea
                                                                    value={opt.description}
                                                                    onChange={e => updateOption(mIdx, oIdx, 'description', e.target.value)}
                                                                    className="min-h-[60px] text-sm resize-none bg-white border-amber-200"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Media Uploads */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8 border-t border-slate-100 pt-3">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                                                            <Video className="h-3 w-3" /> Video Receta
                                                        </label>
                                                        <MediaUploadField
                                                            type="video"
                                                            value={opt.videoUrl}
                                                            onChange={url => updateOption(mIdx, oIdx, 'videoUrl', url)}
                                                            placeholder="Link de video..."
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                                                            <FileText className="h-3 w-3" /> Archivo PDF
                                                        </label>
                                                        <MediaUploadField
                                                            type="pdf"
                                                            value={opt.pdfUrl}
                                                            onChange={url => updateOption(mIdx, oIdx, 'pdfUrl', url)}
                                                            placeholder="Link de PDF..."
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {(!meal.options || meal.options.length === 0) && (
                                        <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg text-slate-400">
                                            <p className="text-xs">No hay opciones cargadas para esta comida.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )
            })}

            <Button onClick={addMeal} variant="outline" className="w-full border-dashed border-slate-300 text-slate-500 hover:text-orange-600 hover:border-orange-300 hover:bg-orange-50">
                <Plus className="h-4 w-4 mr-2" /> Agregar Nueva Comida
            </Button>
        </div>
    )
}
