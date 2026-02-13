"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Plus, Trash2, Save, FileText, ChevronDown, ChevronUp,
    Utensils, ExternalLink, Video, Download, Copy
} from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import { VideoUploadField } from "@/components/ui/video-upload-field"
import { RecipeSection, RecipeItem, RecipeAttachment } from "@/lib/types"

interface RecipeManagerProps {
    value: RecipeSection[]
    onChange: (sections: RecipeSection[]) => void
    readOnly?: boolean
}

export function RecipeManager({ value, onChange, readOnly = false }: RecipeManagerProps) {
    const [sections, setSections] = useState<RecipeSection[]>(value || [])
    const [activeTab, setActiveTab] = useState<string>(value?.[0]?.id || "new")
    const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
    const [isLoadTemplateDialogOpen, setIsLoadTemplateDialogOpen] = useState(false)
    const [templateName, setTemplateName] = useState("")
    const [templates, setTemplates] = useState<any[]>([])
    const [loadingTemplates, setLoadingTemplates] = useState(false)

    useEffect(() => {
        // Ensure there is at least one section if empty? 
        // Maybe better to let user create.
        if (!value && sections.length === 0) {
            // Initialize with empty array or default sections
        } else {
            setSections(value || [])
            if (!activeTab && value?.length > 0) {
                setActiveTab(value[0].id)
            }
        }
    }, [value])

    const updateSections = (newSections: RecipeSection[]) => {
        setSections(newSections)
        onChange(newSections)
    }

    const addSection = () => {
        const newSection: RecipeSection = {
            id: Date.now().toString(),
            title: "Nueva Sección",
            recipes: []
        }
        const updated = [...sections, newSection]
        updateSections(updated)
        setActiveTab(newSection.id)
    }

    const removeSection = (sectionId: string) => {
        const updated = sections.filter(s => s.id !== sectionId)
        updateSections(updated)
        if (activeTab === sectionId && updated.length > 0) {
            setActiveTab(updated[0].id)
        }
    }

    const updateSectionTitle = (sectionId: string, title: string) => {
        const updated = sections.map(s => s.id === sectionId ? { ...s, title } : s)
        updateSections(updated)
    }

    // --- Recipe Management ---
    const addRecipe = (sectionId: string) => {
        const updated = sections.map(s => {
            if (s.id === sectionId) {
                return {
                    ...s,
                    recipes: [
                        ...s.recipes,
                        {
                            id: Date.now().toString(),
                            title: "",
                            ingredients: "",
                            instructions: "",
                            attachments: []
                        }
                    ]
                }
            }
            return s
        })
        updateSections(updated)
    }

    const removeRecipe = (sectionId: string, recipeId: string) => {
        const updated = sections.map(s => {
            if (s.id === sectionId) {
                return {
                    ...s,
                    recipes: s.recipes.filter(r => r.id !== recipeId)
                }
            }
            return s
        })
        updateSections(updated)
    }

    // Helper to update a recipe field
    const updateRecipe = (sectionId: string, recipeId: string, field: keyof RecipeItem, val: any) => {
        const updated = sections.map(s => {
            if (s.id === sectionId) {
                return {
                    ...s,
                    recipes: s.recipes.map(r => r.id === recipeId ? { ...r, [field]: val } : r)
                }
            }
            return s
        })
        updateSections(updated)
    }

    // --- Template Logic ---
    const saveTemplate = async () => {
        if (!templateName.trim()) {
            toast.error("Por favor ingresá un nombre para la plantilla")
            return
        }

        try {
            const { error } = await supabase
                .from('routine_templates')
                .insert({
                    name: templateName,
                    exercises: sections, // Save the whole sections array as JSON
                    type: 'recipe_plan', // We can use a custom type or map to existing enum if strictly constrained
                    service_type: 'nutrition',
                    tags: ['recipe']
                })

            if (error) throw error

            toast.success("Plantilla guardada correctamente")
            setIsTemplateDialogOpen(false)
            setTemplateName("")
        } catch (error) {
            console.error('Error saving template:', error)
            toast.error("Error al guardar la plantilla")
        }
    }

    const loadTemplates = async () => {
        setLoadingTemplates(true)
        try {
            const { data, error } = await supabase
                .from('routine_templates')
                .select('*')
                .eq('service_type', 'nutrition')
                .order('created_at', { ascending: false })

            if (error) throw error
            setTemplates(data || [])
        } catch (error) {
            console.error('Error loading templates:', error)
            toast.error("Error al cargar plantillas")
        } finally {
            setLoadingTemplates(false)
        }
    }

    const applyTemplate = (templateContent: any) => {
        // Basic validation
        if (Array.isArray(templateContent)) {
            // Ensure IDs are regenerated to avoid collisions if template applied multiple times?
            // Actually, for a full replace it's fine. If appending, we'd need new IDs.
            // Let's replace for now as usually templates are starting points.
            // But regenerating IDs is safer.
            const newSections = templateContent.map((s: any) => ({
                ...s,
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                recipes: s.recipes.map((r: any) => ({
                    ...r,
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5)
                }))
            }))

            updateSections(newSections)
            if (newSections.length > 0) setActiveTab(newSections[0].id)
            setIsLoadTemplateDialogOpen(false)
            toast.success("Plantilla cargada")
        } else {
            toast.error("El formato de la plantilla no es compatible")
        }
    }

    if (readOnly) {
        return <RecipeViewer sections={sections} />
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsLoadTemplateDialogOpen(true)}>
                        <Copy className="h-4 w-4 mr-2" /> Cargar Plantilla
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIsTemplateDialogOpen(true)}>
                        <Save className="h-4 w-4 mr-2" /> Guardar como Plantilla
                    </Button>
                </div>
            </div>

            <div className="bg-slate-50/50 rounded-lg p-1 border border-slate-200">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex items-center w-full overflow-x-auto pb-2 mb-2 custom-scrollbar">
                        <TabsList className="bg-transparent h-auto p-0 gap-1">
                            {sections.map(section => (
                                <TabsTrigger
                                    key={section.id}
                                    value={section.id}
                                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-slate-200 border border-transparent rounded-t-lg rounded-b-none px-4 py-2"
                                >
                                    {section.title}
                                </TabsTrigger>
                            ))}
                            <Button variant="ghost" size="sm" onClick={addSection} className="h-9 px-3 gap-1 hover:bg-slate-200/50">
                                <Plus className="h-4 w-4" /> Nueva Sección
                            </Button>
                        </TabsList>
                    </div>

                    {sections.map(section => (
                        <TabsContent key={section.id} value={section.id} className="mt-0 space-y-4">
                            <Card className="border-t-0 rounded-tl-none shadow-sm">
                                <CardHeader className="pb-3 border-b bg-slate-50/30">
                                    <div className="flex items-center gap-4">
                                        <div className="space-y-1 flex-1">
                                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre de la Sección</Label>
                                            <Input
                                                value={section.title}
                                                onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                                                className="font-bold text-lg h-9 bg-white"
                                            />
                                        </div>
                                        <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-500 hover:bg-red-50" onClick={() => removeSection(section.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 bg-slate-50/10 space-y-4">
                                    {section.recipes.length === 0 ? (
                                        <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-100 rounded-lg">
                                            <Utensils className="h-10 w-10 mx-auto opacity-20 mb-2" />
                                            <p className="text-sm">No hay recetas en esta sección</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {section.recipes.map((recipe, idx) => (
                                                <div key={recipe.id} className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm transition-all hover:shadow-md">
                                                    <div className="bg-slate-50 border-b border-slate-100 p-3 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                                                {idx + 1}
                                                            </span>
                                                            <Input
                                                                value={recipe.title}
                                                                onChange={(e) => updateRecipe(section.id, recipe.id, 'title', e.target.value)}
                                                                placeholder="Ej: Tostadas con Palta y Huevo"
                                                                className="h-8 w-[250px] md:w-[350px] font-semibold bg-transparent border-transparent hover:border-slate-200 focus:bg-white focus:border-primary transition-all px-2"
                                                            />
                                                        </div>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-red-500" onClick={() => removeRecipe(section.id, recipe.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>

                                                    <div className="p-4 grid md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                                                                <Utensils className="h-3 w-3" /> Ingredientes
                                                            </Label>
                                                            <Textarea
                                                                value={recipe.ingredients}
                                                                onChange={(e) => updateRecipe(section.id, recipe.id, 'ingredients', e.target.value)}
                                                                placeholder="- 2 huevos&#10;- 1 palta&#10;- 2 rebanadas pan integral"
                                                                className="min-h-[120px] text-sm resize-none bg-slate-50/50 focus:bg-white"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                                                                <FileText className="h-3 w-3" /> Instrucciones
                                                            </Label>
                                                            <Textarea
                                                                value={recipe.instructions}
                                                                onChange={(e) => updateRecipe(section.id, recipe.id, 'instructions', e.target.value)}
                                                                placeholder="1. Tostar el pan...&#10;2. Pisar la palta..."
                                                                className="min-h-[120px] text-sm resize-none bg-slate-50/50 focus:bg-white"
                                                            />
                                                        </div>

                                                        <div className="md:col-span-2 pt-2 border-t border-slate-50">
                                                            <Label className="text-xs font-semibold text-slate-500 flex items-center gap-1 mb-2">
                                                                <Video className="h-3 w-3" /> Video / Recursos
                                                            </Label>
                                                            {/* Simplification: Just one video per recipe for now, or use VideoUploadField which handles strings directly?
                                                        The type says attachments: RecipeAttachment[]. 
                                                        But VideoUploadField works with a string URL.
                                                        Let's adapt. If user uploads, we add to attachments array. 
                                                        Actually, let's keep it simple and just have one 'videoUrl' for MVP if easier, OR 
                                                        implement a small list of attachments.
                                                        
                                                        Let's stick to the Plan: Attachments[]
                                                    */}
                                                            <AttachmentsEditor
                                                                attachments={recipe.attachments || []}
                                                                onChange={(newAttachments) => updateRecipe(section.id, recipe.id, 'attachments', newAttachments)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <Button
                                        variant="outline"
                                        className="w-full border-dashed border-2 py-6 text-slate-500 hover:text-green-600 hover:border-green-200 hover:bg-green-50/50"
                                        onClick={() => addRecipe(section.id)}
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Agregar Receta a {section.title}
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>

            {/* Save Template Dialog */}
            <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Guardar como Plantilla</DialogTitle>
                        <DialogDescription>Guardá este plan para reutilizarlo con otros pacientes.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-4">
                        <Label>Nombre de la Plantilla</Label>
                        <Input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="Ej: Descenso Rápido - Semana 1" />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={saveTemplate}>Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Load Template Dialog */}
            <Dialog open={isLoadTemplateDialogOpen} onOpenChange={(open) => {
                setIsLoadTemplateDialogOpen(open)
                if (open) loadTemplates()
            }}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Cargar Plantilla</DialogTitle>
                        <DialogDescription>Elegí una plantilla para cargar. Esto reemplazará el contenido actual.</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto py-4 space-y-2">
                        {loadingTemplates ? (
                            <div className="py-8 text-center text-slate-500">Cargando plantillas...</div>
                        ) : templates.length === 0 ? (
                            <div className="py-8 text-center text-slate-500">No hay plantillas guardadas.</div>
                        ) : (
                            templates.map(t => (
                                <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 cursor-pointer" onClick={() => applyTemplate(t.exercises)}>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">{t.name}</h4>
                                        <p className="text-xs text-slate-500">Creado el {new Date(t.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <Button variant="ghost" size="sm">Cargar</Button>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function AttachmentsEditor({ attachments, onChange }: { attachments: RecipeAttachment[], onChange: (val: RecipeAttachment[]) => void }) {
    const addAttachment = (url: string, type: 'video' | 'link') => {
        if (!url) return
        const newAtt: RecipeAttachment = {
            id: Date.now().toString(),
            type,
            url,
            title: type === 'video' ? 'Video' : 'Enlace'
        }
        onChange([...attachments, newAtt])
    }

    const removeAttachment = (id: string) => {
        onChange(attachments.filter(a => a.id !== id))
    }

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
                {attachments.map(att => (
                    <div key={att.id} className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5 text-sm group">
                        {att.type === 'video' ? <Video className="h-3 w-3 text-blue-500" /> : <ExternalLink className="h-3 w-3 text-slate-500" />}
                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="truncate max-w-[150px] hover:underline text-blue-600">
                            {att.url}
                        </a>
                        <button type="button" onClick={() => removeAttachment(att.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="h-3 w-3" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="flex gap-2 items-start">
                <div className="flex-1">
                    <VideoUploadField
                        value=""
                        placeholder="Pegá un link de YouTube o subí un video..."
                        onChange={(url) => {
                            if (url) addAttachment(url, 'video')
                        }}
                    />
                </div>
                {/* Can add pure link input here if needed */}
            </div>
        </div>
    )
}

export function RecipeViewer({ sections }: { sections: RecipeSection[] }) {
    if (!sections || sections.length === 0) return <div className="text-slate-500 text-sm italic">No hay recetas cargadas.</div>

    return (
        <div className="space-y-6">
            {sections.map(section => (
                <div key={section.id} className="space-y-3">
                    <h3 className="text-lg font-bold text-green-800 border-b border-green-100 pb-1">{section.title}</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        {section.recipes.map(recipe => (
                            <Card key={recipe.id} className="overflow-hidden border-green-100 bg-white">
                                <CardHeader className="bg-green-50/50 py-3 px-4 border-b border-green-50">
                                    <CardTitle className="text-base font-bold text-green-900">{recipe.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-4 text-sm">
                                    {recipe.ingredients && (
                                        <div className="space-y-1">
                                            <span className="font-semibold text-green-700 block text-xs uppercase tracking-wide">Ingredientes</span>
                                            <p className="whitespace-pre-wrap text-slate-600 pl-2 border-l-2 border-green-200">{recipe.ingredients}</p>
                                        </div>
                                    )}
                                    {recipe.instructions && (
                                        <div className="space-y-1">
                                            <span className="font-semibold text-green-700 block text-xs uppercase tracking-wide">Instrucciones</span>
                                            <p className="whitespace-pre-wrap text-slate-600 pl-2 border-l-2 border-green-200">{recipe.instructions}</p>
                                        </div>
                                    )}
                                    {recipe.attachments && recipe.attachments.length > 0 && (
                                        <div className="space-y-2 pt-2">
                                            {recipe.attachments.map(att => (
                                                <div key={att.id}>
                                                    {att.type === 'video' && att.url.includes('youtube') ? (
                                                        <div className="aspect-video rounded-lg overflow-hidden bg-black">
                                                            {/* Simple embed or link */}
                                                            <iframe
                                                                width="100%" height="100%"
                                                                src={`https://www.youtube.com/embed/${att.url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1]}`}
                                                                title="Video" frameBorder="0" allowFullScreen
                                                            />
                                                        </div>
                                                    ) : (
                                                        <Button variant="outline" size="sm" asChild className="w-full justify-start gap-2 h-8">
                                                            <a href={att.url} target="_blank" rel="noopener noreferrer">
                                                                <Video className="h-3 w-3" /> Ver Recurso
                                                            </a>
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
