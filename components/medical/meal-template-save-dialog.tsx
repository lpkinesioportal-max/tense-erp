"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { MealPlanItem } from "@/lib/types"
import { Save } from "lucide-react"

interface MealTemplateSaveDialogProps {
    content: MealPlanItem[]
}

export function MealTemplateSaveDialog({ content }: MealTemplateSaveDialogProps) {
    const { saveMealTemplate } = useData()
    const [isOpen, setIsOpen] = useState(false)
    const [name, setName] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        if (!name.trim()) return
        setIsSaving(true)
        await saveMealTemplate(name, content)
        setIsSaving(false)
        setIsOpen(false)
        setName("")
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-8 text-xs bg-white text-slate-700 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50" disabled={content.length === 0}>
                    <Save className="h-3.5 w-3.5" />
                    Guardar Plantilla
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Guardar como Plantilla</DialogTitle>
                    <DialogDescription>
                        Guardá este plan alimentario para reusarlo con otros pacientes.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Input
                        id="name"
                        placeholder="Nombre de la plantilla (ej: Descenso Rápido)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave()
                        }}
                    />
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} disabled={!name.trim() || isSaving}>{isSaving ? 'Guardando...' : 'Guardar'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
