"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useData } from "@/lib/data-context"
import { MealPlanItem, MealTemplate } from "@/lib/types"
import { Trash2, FileText, Check, Download } from "lucide-react"

interface MealTemplateSelectorProps {
    onSelect: (template: MealPlanItem[]) => void
}

export function MealTemplateSelector({ onSelect }: MealTemplateSelectorProps) {
    const { mealTemplates, deleteMealTemplate } = useData()
    const [isOpen, setIsOpen] = useState(false)

    const handleSelect = (template: MealTemplate) => {
        if (confirm(`¿Cargar la plantilla "${template.name}"? Esto reemplazará lo que tengas cargado actualmente.`)) {
            // Deep copy to avoid reference issues
            const contentCopy = JSON.parse(JSON.stringify(template.content))
            onSelect(contentCopy)
            setIsOpen(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-8 text-xs bg-white text-slate-700 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50">
                    <Download className="h-3.5 w-3.5" />
                    Cargar Plantilla
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Cargar Plantilla</DialogTitle>
                    <DialogDescription>
                        Seleccioná una plantilla guardada para cargarla en el plan alimentario.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 max-h-[300px] overflow-y-auto py-2 pr-2">
                    {mealTemplates.length === 0 && (
                        <div className="text-center py-8 text-slate-500 border border-dashed rounded-lg">
                            <p className="text-sm">No hay plantillas guardadas.</p>
                            <p className="text-xs mt-1">Guardá tu plan actual para verlo aquí.</p>
                        </div>
                    )}
                    {mealTemplates.map(template => (
                        <div key={template.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-orange-200 hover:bg-orange-50/50 transition-colors bg-white group">
                            <div className="flex-1 cursor-pointer" onClick={() => handleSelect(template)}>
                                <h4 className="font-semibold text-sm text-slate-800 mb-0.5">{template.name}</h4>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">{template.content.length} comidas</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    if (confirm("¿Eliminar plantilla permanentemente?")) deleteMealTemplate(template.id)
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}
