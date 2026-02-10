"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { format } from "date-fns"
import type { ExerciseItem, RoutineDay } from "@/lib/types"
import { es } from "date-fns/locale"
import {
  FileText,
  Activity,
  Calendar,
  Clock,
  ChevronRight,
  Plus,
  Search,
  Filter,
  MoreVertical,
  User,
  Phone,
  Mail,
  MapPin,
  Heart,
  AlertCircle,
  Stethoscope,
  Dumbbell,
  Utensils,
  Archive,
  ChevronLeft,
  Settings,
  X,
  Save,
  Trash2,
  ExternalLink,
  Info,
  Sparkles,
  Apple,
  ArrowLeft,
  CreditCard,
  Upload,
  Video,
  LinkIcon,
  Loader2,
  CheckCircle2,
  Repeat,
  BookOpen,
  Download,
  Copy,
  Layers
} from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import Link from "next/link"
import { cn } from "@/lib/utils"
// Import shared defaults and constants
import { SERVICE_CATEGORIES, FORM_TYPES_INFO, getDefaultFormConfig } from "@/lib/clinical-forms-defaults"
import { ClinicalFormConfig, ClinicalFormType } from "@/lib/types"

// Components (assuming these exist and are working)
import { BodyMap } from "@/components/medical/body-map"
import { AdherenceInput } from "@/components/medical/adherence-input"

export default function PatientHistoryPage() {
  const { clientId } = useParams()
  const router = useRouter()
  // Retrieve user from Auth Context
  const { user } = useAuth()
  const currentUser = user // Alias for logic compatibility if needed

  const {
    clients,
    medicalRecords,
    addMedicalRecord,
    updateMedicalRecord, // Keep for PersonalDataView if needed
    clinicalFormConfigs,
    professionals,
    clinicalEntries,
    loadClinicalEntries,
    saveClinicalEntry,
  } = useData()

  // Load entries on mount
  useEffect(() => {
    if (clientId) {
      loadClinicalEntries(clientId as string)
    }
  }, [clientId, loadClinicalEntries])

  // State
  const [activeCategory, setActiveCategory] = useState<string>("Kinesiología")
  const [editingEntry, setEditingEntry] = useState<any>(null) // New state for editing
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false)
  const [selectedFormType, setSelectedFormType] = useState<ClinicalFormType | null>(null)

  // Find Client and Record
  const client = clients.find((c) => c.id === clientId)
  const record = medicalRecords.find((r) => r.clientId === clientId)

  // Helper to get the effective config (dynamic OR default)
  const getEffectiveConfig = (type: ClinicalFormType): Partial<ClinicalFormConfig> => {
    // HARD OVERRIDE: Always use default to fix persistence/corruption issues
    if (type === 'kinesiology_evaluation' || type === 'kine_home' || type === 'training_routine') {
      return getDefaultFormConfig(type);
    }

    const dynamicConfig = clinicalFormConfigs.find(c => c.formType === type && c.isActive)

    if (dynamicConfig && dynamicConfig.sections && dynamicConfig.sections.length > 0) {
      return dynamicConfig
    }

    return getDefaultFormConfig(type)
  }

  // Flatten history items for the active category
  const activeCategoryConfig = SERVICE_CATEGORIES.find(c => c.id === activeCategory)

  const relevantHistoryItems = useMemo(() => {
    if (!activeCategoryConfig) return []

    // Filter and map clinicalEntries
    const entries = clinicalEntries.filter(e => e.clientId === clientId && activeCategoryConfig.types.includes(e.formType))

    return entries.map(e => ({
      ...e,
      ...e.content, // Flatten content for display compatibility
      _type: e.formType, // For compatibility
      date: e.attentionDate // Map attentionDate to date
    })).sort((a, b) => new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime())
  }, [clinicalEntries, clientId, activeCategoryConfig])

  // Group items by type for the horizontal swimlanes
  const itemsByType = useMemo(() => {
    const groups: Record<string, any[]> = {}
    if (activeCategoryConfig) {
      activeCategoryConfig.types.forEach(type => {
        groups[type] = relevantHistoryItems.filter(i => i._type === type)
      })
    }
    return groups
  }, [relevantHistoryItems, activeCategoryConfig])

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
        <User className="h-12 w-12 mb-4 opacity-20" />
        <h2 className="text-xl font-semibold text-foreground">Cliente no encontrado</h2>
        <p className="mb-6">El cliente que buscas no existe o fue eliminado.</p>
        <Button onClick={() => router.back()}>Volver</Button>
      </div>
    )
  }

  const handleEdit = (item: any) => {
    setEditingEntry(item)
    // Map formType correctly. If item has formType property use it, otherwise infer from item._type
    // item._type is set during mapping in useMemo above
    const type = item.formType || item._type
    setSelectedFormType(type)
    setIsNewEntryOpen(true)
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 hover:bg-slate-100 rounded-full">
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-slate-200">
              <AvatarImage src={client.profileImage} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">{client.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">{client.name}</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" /> DNI: {client.dni}</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <span>Edad: 32 años</span> {/* Calculate age ideally */}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeCategory !== "Datos Personales" && (
            <Button onClick={() => setIsNewEntryOpen(true)} className="gap-2 shadow-sm bg-primary hover:bg-primary/90 text-white">
              <Plus className="h-4 w-4" />
              Nueva Ficha
            </Button>
          )}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 overflow-hidden">

        {/* SIDEBAR NAVIGATION */}
        <div className="w-64 bg-white border-r flex flex-col shrink-0 h-full overflow-y-auto">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Departamentos</h3>
            <nav className="space-y-1">
              {SERVICE_CATEGORIES.map(category => {
                const Icon = category.icon
                const isActive = activeCategory === category.id
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-slate-100 text-slate-900 shadow-sm"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <div className={cn("p-1.5 rounded-md transition-colors", isActive ? "bg-white text-primary shadow-sm" : "bg-transparent")}>
                      <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-slate-400")} />
                    </div>
                    {category.label}
                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* HISTORY CONTENT */}
        <ScrollArea className="flex-1 bg-slate-50/50 w-full">
          <div className="p-6 pb-20 space-y-8 w-full max-w-[calc(100vw-17rem)]">
            {activeCategory === "Datos Personales" ? (
              <PersonalDataView client={client} record={record} config={getEffectiveConfig('personal')} />
            ) : (
              activeCategoryConfig?.types.map(type => {
                const items = itemsByType[type] || []
                const typeInfo = FORM_TYPES_INFO.find(t => t.value === type)
                const config = getEffectiveConfig(type as ClinicalFormType);

                if (!typeInfo) return null

                // Create a scroll function ref for this type's card container
                const scrollContainerId = `scroll-${type}`

                return (
                  <div key={type} className="space-y-4 max-w-full overflow-hidden">
                    {/* Header with title */}
                    <div className="flex items-center gap-2">
                      <div className={cn("p-1.5 rounded-md", typeInfo.color.replace('bg-', 'bg-').replace('600', '100').replace('500', '100'))}>
                        <typeInfo.icon className={cn("h-4 w-4", typeInfo.color.replace('bg-', 'text-'))} />
                      </div>
                      <h3 className="font-semibold text-slate-800">{typeInfo.label}</h3>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200">
                        {items.length}
                      </Badge>
                    </div>

                    {/* NAVIGATION BAR - Always visible when there are cards */}
                    {items.length > 0 && (
                      <div
                        className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2 max-w-full"
                      >
                        <span className="text-sm text-blue-700">
                          {items.length} {items.length === 1 ? 'ficha' : 'fichas'} disponibles
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white hover:bg-blue-100 text-blue-700 border-blue-200"
                            onClick={() => {
                              const el = document.getElementById(scrollContainerId)
                              if (el) el.scrollBy({ left: -400, behavior: 'smooth' })
                            }}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white hover:bg-blue-100 text-blue-700 border-blue-200"
                            onClick={() => {
                              const el = document.getElementById(scrollContainerId)
                              if (el) el.scrollBy({ left: 400, behavior: 'smooth' })
                            }}
                          >
                            Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Cards container */}
                    {items.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400">
                        <typeInfo.icon className="h-8 w-8 mb-2 opacity-20" />
                        <span className="text-sm">Sin registros aún</span>
                      </div>
                    ) : (
                      <div
                        id={scrollContainerId}
                        className="flex overflow-x-auto gap-4 pb-4 snap-x scrollbar-hide w-full"
                      >
                        {items.map((item, idx) => (
                          <FichaDisplay
                            key={item.id || idx}
                            item={item}
                            config={config}
                            typeInfo={typeInfo}
                            onEdit={handleEdit}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* NEW ENTRY MODAL */}
      <Dialog open={isNewEntryOpen} onOpenChange={(open) => {
        setIsNewEntryOpen(open)
        if (!open) setSelectedFormType(null)
      }}>
        <DialogContent className="max-w-7xl max-h-[95vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 py-2 border-b shrink-0">
            <DialogTitle className="text-base">
              {editingEntry ? "Editar Ficha" : (selectedFormType
                ? FORM_TYPES_INFO.find(t => t.value === selectedFormType)?.label
                : `Nueva Ficha - ${activeCategory}`)}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingEntry ? "Modifique los datos de la ficha." : (selectedFormType ? "Complete los datos de la ficha." : "Seleccione el tipo de ficha a crear.")}
            </DialogDescription>
          </DialogHeader>

          {!selectedFormType ? (
            // TYPE SELECTION
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto">
              {activeCategoryConfig?.types.map(type => {
                const info = FORM_TYPES_INFO.find(t => t.value === type)
                if (!info) return null
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedFormType(type as ClinicalFormType)}
                    className="flex items-center gap-4 p-4 rounded-xl border bg-white hover:border-primary/50 hover:shadow-md hover:bg-slate-50 transition-all text-left group"
                  >
                    <div className={cn("p-3 rounded-lg group-hover:scale-110 transition-transform", info.color, "text-white")}>
                      <info.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 group-hover:text-primary transition-colors">{info.label}</h4>
                      <p className="text-sm text-slate-500">Crear nuevo registro</p>
                    </div>
                    <ChevronRight className="ml-auto h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
                  </button>
                )
              })}
            </div>
          ) : (
            // DYNAMIC FORM
            <DynamicEntryForm
              key={editingEntry ? `edit-${editingEntry.id}` : selectedFormType} // Force remount on switch defaults/edit
              type={selectedFormType}
              config={getEffectiveConfig(selectedFormType)}
              initialSessionNumber={editingEntry ? editingEntry.sessionNumber : (relevantHistoryItems.filter(i => i._type === selectedFormType).length) + 1}
              initialProfessionalName={editingEntry ? (editingEntry.professionalName || editingEntry.professional?.name) : (professionals.find(p => p.id === user?.professionalId)?.name || user?.name || "Profesional")}
              initialValues={editingEntry ? (editingEntry.content || editingEntry) : undefined}
              onCancel={() => {
                setSelectedFormType(null)
                setEditingEntry(null)
                setIsNewEntryOpen(false)
              }}
              onSubmit={async (values) => {
                // Prepare the object to save
                // Prepare the object to save
                const entryData: any = {
                  id: editingEntry ? editingEntry.id : crypto.randomUUID(),
                  clientId: client.id,
                  professionalId: currentUser?.professionalId || (editingEntry ? editingEntry.professionalId : null),
                  serviceCategory: activeCategory,
                  formType: selectedFormType,
                  attentionDate: editingEntry ? new Date(editingEntry.attentionDate) : new Date(),
                  sessionNumber: Number(values.sessionNumber) || (editingEntry ? editingEntry.sessionNumber : relevantHistoryItems.length + 1),
                  visibleToPatient: true, // Always true at record level? Or form value overrides? usually record level default
                  content: values, // Store all form values in content
                  templateSnapshot: editingEntry ? editingEntry.templateSnapshot : getEffectiveConfig(selectedFormType), // Keep original template if editing? Or update? Let's keep original unless we have versioning. Actually for now update it to current config is safer if fields changed.
                  bodyMap: values.bodyZones || {},
                  adherence: values.adherence || {},
                  createdAt: editingEntry ? editingEntry.createdAt : new Date(),
                  updatedAt: new Date()
                }

                await saveClinicalEntry(entryData)

                toast.success("Ficha guardada exitosamente")
                setIsNewEntryOpen(false)
              }}
            />
          )
          }
        </DialogContent >
      </Dialog >
    </div >
  )
}


// --- SUB COMPONENTS ---

// 1. DYNAMIC FORM COMPONENT
function DynamicEntryForm({
  type,
  config,
  onCancel,
  onSubmit,
  initialSessionNumber,
  initialProfessionalName,
  initialValues
}: {
  type: ClinicalFormType,
  config: Partial<ClinicalFormConfig>,
  onCancel: () => void,
  onSubmit: (values: any) => void,
  initialSessionNumber: number,
  initialProfessionalName: string,
  initialValues?: Record<string, any> // New prop
}) {
  const [values, setValues] = useState<Record<string, any>>({
    sessionNumber: initialSessionNumber,
    professionalName: initialProfessionalName,
    ...initialValues // Merge initial values
  })

  // Debug Log on Mount
  useEffect(() => {
    console.log('[HC] DynamicEntryForm CONFIG:', {
      type,
      sections: config.sections?.length,
      fields: config.fields?.length,
      allSectionIds: config.sections?.map(s => s.id),
      allFieldSections: config.fields?.map(f => f.section)
    })
  }, [type, config])

  const sections = config.sections?.filter(s => s.isActive).sort((a, b) => a.order - b.order) || []
  const rawFields = config.fields || []

  const showBodyMap = type === "kinesiology_treatment" || type === "massage_evaluation";
  const showAdherence = type === "kinesiology_treatment" || type === "training_routine" || type === "yoga_routine";
  const hasSidebar = showBodyMap || showAdherence;

  const handleBodyMapChange = (zones: any[]) => {
    setValues(prev => ({ ...prev, bodyZones: zones }))
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-slate-50/50">
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
        <div className="max-w-full mx-auto">

          {/* METADATA HEADER - Compact */}
          <div className="mb-4 flex flex-wrap items-center gap-3 px-1">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm ring-1 ring-slate-200 border-l-3 border-l-primary">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">Sesión Nº</span>
              <span className="text-sm font-black text-slate-900">#{initialSessionNumber}</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm ring-1 ring-slate-200">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">Prof.</span>
              <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-2.5 w-2.5 text-primary" />
                </div>
                {initialProfessionalName}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-lg shadow-sm ring-1 ring-slate-200 ml-auto hidden sm:flex">
              <Calendar className="h-3 w-3 text-slate-400" />
              <span className="text-sm font-semibold text-slate-600">{format(new Date(), "dd/MM/yy", { locale: es })}</span>
            </div>
          </div>
          {hasSidebar ? (
            /* CASE A: WITH SIDEBAR (Treatment / Routine) - Compact Professional Layout */
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-2 w-full">
              {/* LEFT COLUMN: Medical Data - Takes 7 columns to give more to the Map */}
              <div className="xl:col-span-7 space-y-2">
                {/* Session Data Sections */}
                {sections.map(section => {
                  const fields = rawFields.filter(f => f.section === section.id && f.isActive !== false).sort((a, b) => a.order - b.order)
                  if (fields.length === 0) return null
                  return (
                    <Card key={section.id} className="border-none shadow-sm ring-1 ring-slate-200 bg-white h-fit">
                      <CardHeader className="py-1.5 px-3 border-b bg-slate-50/50">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-blue-500/10 rounded">
                            <FileText className="h-3 w-3 text-blue-600" />
                          </div>
                          <CardTitle className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{section.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-2">
                        {/* Denser grid for more compact view */}
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                          {fields.map(field => (
                            <div key={field.id} className={cn("space-y-0.5", field.type === "textarea" ? "col-span-2" : "col-span-1")}>
                              <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                {field.label} {field.required && <span className="text-red-500 font-bold">*</span>}
                              </Label>
                              <RenderFieldInput field={field} value={values[field.key]} onChange={(val: any) => setValues(p => ({ ...p, [field.key]: val }))} />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* RIGHT COLUMN: Interactive Widgets - Vertical Stack for Maximum Map Height */}
              <div className="xl:col-span-5 space-y-2">
                {/* BODY MAP CARD */}
                {showBodyMap && (
                  <Card className="border-none shadow-sm ring-1 ring-slate-200 bg-white overflow-hidden w-full">
                    <CardHeader className="py-1 px-3 border-b bg-primary/[0.03]">
                      <div className="flex items-center gap-1.5">
                        <Activity className="h-3 w-3 text-primary" />
                        <CardTitle className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Mapa Corporal</CardTitle>
                      </div>
                    </CardHeader>
                    <div className="p-2 flex justify-center bg-white min-h-[500px]">
                      <div className="w-full">
                        <BodyMap zones={values.bodyZones || []} onZonesChange={handleBodyMapChange} readOnly={false} />
                      </div>
                    </div>
                  </Card>
                )}

                {/* ADHERENCIA CARD */}
                {showAdherence && (
                  <Card className="border-none shadow-sm ring-1 ring-slate-200 bg-white overflow-hidden w-full h-fit">
                    <CardHeader className="py-1 px-3 border-b bg-pink-50/30">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-pink-500" />
                        <CardTitle className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Adherencia y Puntos</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 bg-white">
                      <AdherenceInput value={values.adherence} onChange={val => setValues(p => ({ ...p, adherence: val }))} />
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : type === 'kinesiology_evaluation' ? (
            /* Panoramic Layout (Evaluation) - 3 Columns Side-by-Side */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
              {/* Col 1: Clinical */}
              <div className="space-y-6">
                {sections.filter(s => s.id === 'clinical').map(section => {
                  const fields = rawFields.filter(f => f.section === section.id && f.isActive !== false).sort((a, b) => a.order - b.order)
                  return (
                    <Card key={section.id} className="border-none shadow-sm ring-1 ring-slate-200 bg-white h-fit">
                      <CardHeader className="py-3 px-4 border-b bg-slate-50/30">
                        <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">{section.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-5 space-y-4">
                        {fields.map(field => (
                          <div key={field.id} className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-500 uppercase">{field.label}</Label>
                            <RenderFieldInput field={field} value={values[field.key]} onChange={(val: any) => setValues(p => ({ ...p, [field.key]: val }))} />
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
              {/* Col 2: Systems */}
              <div className="space-y-6">
                <Card className="border-none shadow-sm ring-1 ring-slate-200 bg-white h-fit">
                  <CardHeader className="py-3 px-4 border-b bg-primary/5">
                    <CardTitle className="text-xs font-bold text-primary uppercase tracking-widest">Evaluación por Sistemas</CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-1">
                    {rawFields.filter(f => (f.section === 'digestive' || f.section === 'gynecological') && f.isActive !== false).map(field => (
                      <div key={field.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 px-1 rounded transition-colors">
                        <Label className="text-sm font-medium text-slate-700">{field.label}</Label>
                        <RenderFieldInput field={field} value={values[field.key]} onChange={(val: any) => setValues(p => ({ ...p, [field.key]: val }))} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
              {/* Col 3: Neuro & Plan */}
              <div className="md:col-span-2 lg:col-span-1 space-y-6">
                <Card className="border-none shadow-sm ring-1 ring-slate-200 bg-white shadow-sm">
                  <CardHeader className="py-3 px-4 border-b bg-slate-50/30">
                    <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">Neuro / Sueño</CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    {rawFields.filter(f => f.section === 'neurological' && f.isActive !== false).map(field => (
                      <div key={field.id} className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-500 uppercase">{field.label}</Label>
                        <RenderFieldInput field={field} value={values[field.key]} onChange={(val: any) => setValues(p => ({ ...p, [field.key]: val }))} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
                {sections.filter(s => s.id === 'diagnosis').map(section => (
                  <Card key={section.id} className="border-none shadow-sm ring-1 ring-slate-200 bg-white shadow-sm">
                    <CardHeader className="py-3 px-4 border-b bg-slate-50/30">
                      <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                      {rawFields.filter(f => f.section === section.id && f.isActive !== false).map(field => (
                        <div key={field.id} className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-500 uppercase">{field.label}</Label>
                          <RenderFieldInput field={field} value={values[field.key]} onChange={(val: any) => setValues(p => ({ ...p, [field.key]: val }))} />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            /* GENERIC DYNAMIC Layout - For all other form types (kine_home, nutrition, yoga, etc.) */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {sections.map(section => {
                const fields = rawFields.filter(f => f.section === section.id && f.isActive !== false).sort((a, b) => a.order - b.order)
                if (fields.length === 0) return null
                return (
                  <Card key={section.id} className="border-none shadow-sm ring-1 ring-slate-200 bg-white h-fit">
                    <CardHeader className="py-3 px-4 border-b bg-slate-50/30">
                      <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                      {fields.map(field => (
                        <div key={field.id} className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-500 uppercase">{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
                          <RenderFieldInput field={field} value={values[field.key]} onChange={(val: any) => setValues(p => ({ ...p, [field.key]: val }))} />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <DialogFooter className="p-4 border-t bg-white flex items-center justify-between shrink-0">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={() => onSubmit(values)} className="gap-2 bg-primary"><Save className="h-4 w-4" /> Guardar Ficha</Button>
      </DialogFooter>
    </div>
  )
}

function VideoUploadField({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [mode, setMode] = useState<'url' | 'upload'>('url')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('video/')) {
      alert('Por favor seleccioná un archivo de video (mp4, mov, etc.)')
      return
    }
    if (file.size > 100 * 1024 * 1024) {
      alert('El video es demasiado grande. El máximo es 100MB.')
      return
    }
    setUploading(true)
    setUploadProgress('Subiendo video...')
    try {
      const fileName = `videos/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const { data, error } = await supabase.storage
        .from('clinical-media')
        .upload(fileName, file, { cacheControl: '3600', upsert: false })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('clinical-media').getPublicUrl(data.path)
      onChange(urlData.publicUrl)
      setUploadProgress('¡Video subido!')
      setTimeout(() => setUploadProgress(''), 2000)
    } catch (err: any) {
      console.error('Upload error:', err)
      setUploadProgress('Error al subir el video')
      setTimeout(() => setUploadProgress(''), 3000)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
        <button type="button" onClick={() => setMode('url')}
          className={cn("flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
            mode === 'url' ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-700")}>
          <LinkIcon className="h-3 w-3" /> Link de YouTube
        </button>
        <button type="button" onClick={() => setMode('upload')}
          className={cn("flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
            mode === 'upload' ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-700")}>
          <Upload className="h-3 w-3" /> Subir Video
        </button>
      </div>
      {mode === 'url' && (
        <Input type="text" value={value || ""} onChange={e => onChange(e.target.value)}
          placeholder="Pegá el link de YouTube aquí..." className="h-9 text-sm" />
      )}
      {mode === 'upload' && (
        <div className="space-y-2">
          <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className={cn("w-full border-2 border-dashed rounded-lg p-3 flex flex-col items-center gap-1.5 transition-all",
              uploading ? "border-primary/30 bg-primary/5" : "border-slate-200 hover:border-primary/50 hover:bg-primary/5 cursor-pointer")}>
            {uploading ? <Loader2 className="h-5 w-5 text-primary animate-spin" /> : <Video className="h-5 w-5 text-slate-400" />}
            <span className="text-xs font-medium text-slate-500">{uploading ? uploadProgress : "Tocá para elegir un video"}</span>
            <span className="text-[10px] text-slate-400">MP4, MOV, WebM • Máx 100MB</span>
          </button>
        </div>
      )}
      {value && !uploading && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-md px-3 py-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
          <span className="text-xs text-green-800 truncate flex-1">{value}</span>
          <button type="button" onClick={() => onChange('')} className="text-xs text-red-500 hover:text-red-700 font-medium shrink-0">Quitar</button>
        </div>
      )}
    </div>
  )
}

// ExerciseItem and RoutineDay imported from @/lib/types

function ExerciseListEditor({ value, onChange }: { value: ExerciseItem[], onChange: (val: ExerciseItem[]) => void }) {
  const exercises: ExerciseItem[] = Array.isArray(value) ? value : []
  const [showTemplateMenu, setShowTemplateMenu] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [savedTemplates, setSavedTemplates] = useState<{ id: string, name: string, createdAt: string, exercises: ExerciseItem[] }[]>([])

  // Load saved templates from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('routine_templates')
      if (stored) setSavedTemplates(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  const addExercise = () => {
    onChange([...exercises, {
      id: Date.now().toString(),
      title: '',
      description: '',
      setsReps: '',
      videoUrl: '',
      notes: ''
    }])
  }

  const updateExercise = (index: number, field: keyof ExerciseItem, val: string) => {
    const updated = [...exercises]
    updated[index] = { ...updated[index], [field]: val }
    onChange(updated)
  }

  const removeExercise = (index: number) => {
    onChange(exercises.filter((_, i) => i !== index))
  }

  const saveAsTemplate = () => {
    if (!templateName.trim()) return
    if (exercises.length === 0) {
      toast.error('Agregá al menos un ejercicio antes de guardar la plantilla')
      return
    }
    const newTemplate = {
      id: Date.now().toString(),
      name: templateName.trim(),
      createdAt: new Date().toISOString(),
      exercises: exercises.map(ex => ({ ...ex })) // Deep copy
    }
    const updated = [...savedTemplates, newTemplate]
    setSavedTemplates(updated)
    localStorage.setItem('routine_templates', JSON.stringify(updated))
    setTemplateName('')
    setShowSaveDialog(false)
    toast.success(`Plantilla "${newTemplate.name}" guardada`)
  }

  const loadTemplate = (template: typeof savedTemplates[0]) => {
    // Load with new IDs so they're fully independent/editable
    const loadedExercises = template.exercises.map(ex => ({
      ...ex,
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7)
    }))
    onChange(loadedExercises)
    setShowTemplateMenu(false)
    toast.success(`Plantilla "${template.name}" cargada — podés modificar los ejercicios`)
  }

  const deleteTemplate = (templateId: string) => {
    const updated = savedTemplates.filter(t => t.id !== templateId)
    setSavedTemplates(updated)
    localStorage.setItem('routine_templates', JSON.stringify(updated))
    toast.success('Plantilla eliminada')
  }

  return (
    <div className="space-y-3">
      {/* TEMPLATE TOOLBAR */}
      <div className="flex flex-wrap gap-2">
        {/* Save as Template */}
        <button type="button" onClick={() => setShowSaveDialog(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all">
          <Save className="h-3 w-3" /> Guardar Plantilla
        </button>

        {/* Load Template */}
        <div className="relative">
          <button type="button" onClick={() => setShowTemplateMenu(!showTemplateMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-all">
            <BookOpen className="h-3 w-3" /> Cargar Plantilla
            {savedTemplates.length > 0 && (
              <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold leading-none">{savedTemplates.length}</span>
            )}
          </button>

          {/* Template Dropdown */}
          {showTemplateMenu && (
            <div className="absolute top-full left-0 mt-1 z-50 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2.5 bg-gradient-to-r from-blue-50 to-transparent border-b">
                <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Plantillas Guardadas</p>
              </div>
              {savedTemplates.length === 0 ? (
                <div className="p-4 text-center">
                  <BookOpen className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No hay plantillas guardadas</p>
                  <p className="text-[10px] text-slate-400 mt-1">Creá una rutina y guardala como plantilla</p>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto">
                  {savedTemplates.map(tpl => (
                    <div key={tpl.id} className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 border-b border-slate-50 group">
                      <button type="button" onClick={() => loadTemplate(tpl)} className="flex-1 text-left">
                        <p className="text-sm font-semibold text-slate-700 group-hover:text-primary transition-colors">{tpl.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {tpl.exercises.length} ejercicio{tpl.exercises.length !== 1 ? 's' : ''} • {format(new Date(tpl.createdAt), "dd MMM yyyy", { locale: es })}
                        </p>
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); deleteTemplate(tpl.id) }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="px-4 py-2 bg-slate-50 border-t">
                <button type="button" onClick={() => setShowTemplateMenu(false)} className="text-xs text-slate-500 hover:text-slate-700 font-medium">Cerrar</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SAVE TEMPLATE DIALOG */}
      {showSaveDialog && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Guardar como Plantilla</span>
          </div>
          <Input
            value={templateName}
            onChange={e => setTemplateName(e.target.value)}
            placeholder="Nombre de la plantilla (ej: Tren Superior, Piernas, etc.)"
            className="h-8 text-sm bg-white"
            onKeyDown={e => e.key === 'Enter' && saveAsTemplate()}
            autoFocus
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={saveAsTemplate} className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700">
              <Save className="h-3 w-3 mr-1" /> Guardar
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => { setShowSaveDialog(false); setTemplateName('') }} className="h-7 text-xs">
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* EXERCISES LIST */}
      {exercises.map((ex, idx) => (
        <div key={ex.id} className="border border-slate-200 rounded-lg bg-white overflow-hidden">
          {/* Exercise Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent px-4 py-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{idx + 1}</div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ejercicio {idx + 1}</span>
            </div>
            <button type="button" onClick={() => removeExercise(idx)}
              className="text-red-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          {/* Exercise Fields */}
          <div className="p-4 space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-500 uppercase">Título del Ejercicio *</Label>
              <Input value={ex.title} onChange={e => updateExercise(idx, 'title', e.target.value)}
                placeholder="Ej: Sentadilla con banda elástica" className="h-8 text-sm font-medium" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-500 uppercase">Descripción / Instrucciones</Label>
              <Textarea value={ex.description} onChange={e => updateExercise(idx, 'description', e.target.value)}
                placeholder="Describí cómo se realiza el ejercicio..." className="min-h-[50px] py-1.5 resize-none text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-500 uppercase">Series y Repeticiones</Label>
              <Input value={ex.setsReps} onChange={e => updateExercise(idx, 'setsReps', e.target.value)}
                placeholder="Ej: 3x15" className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-500 uppercase">Video del Ejercicio</Label>
              <VideoUploadField value={ex.videoUrl} onChange={(url) => updateExercise(idx, 'videoUrl', url)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-500 uppercase">Notas</Label>
              <Textarea value={ex.notes} onChange={e => updateExercise(idx, 'notes', e.target.value)}
                placeholder="Observaciones adicionales..." className="min-h-[40px] py-1.5 resize-none text-sm" />
            </div>
          </div>
        </div>
      ))}

      <button type="button" onClick={addExercise}
        className="w-full border-2 border-dashed border-primary/30 rounded-lg p-3 flex items-center justify-center gap-2 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all">
        <Plus className="h-4 w-4" />
        <span className="text-sm font-semibold">Agregar Ejercicio</span>
      </button>
    </div>
  )
}

// === DAY ROUTINE EDITOR ===
function DayRoutineEditor({ value, onChange }: { value: RoutineDay[] | ExerciseItem[] | undefined, onChange: (val: RoutineDay[]) => void }) {
  // Migrate legacy flat ExerciseItem[] to RoutineDay[]
  const normalizeDays = (val: any): RoutineDay[] => {
    if (!val || !Array.isArray(val) || val.length === 0) {
      return [{ id: Date.now().toString(), name: 'Día 1', exercises: [] }]
    }
    // Check if it's legacy flat array (has 'title' field = ExerciseItem)
    if (val[0] && 'title' in val[0] && !('exercises' in val[0])) {
      return [{ id: Date.now().toString(), name: 'Día 1', exercises: val as ExerciseItem[] }]
    }
    return val as RoutineDay[]
  }

  const [days, setDays] = useState<RoutineDay[]>(() => normalizeDays(value))
  const [activeDay, setActiveDay] = useState(0)

  // Sync up when days change
  const updateDays = (newDays: RoutineDay[]) => {
    setDays(newDays)
    onChange(newDays)
  }

  const addDay = () => {
    const newDay: RoutineDay = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 5),
      name: `Día ${days.length + 1}`,
      exercises: []
    }
    const updated = [...days, newDay]
    updateDays(updated)
    setActiveDay(updated.length - 1)
  }

  const removeDay = (idx: number) => {
    if (days.length <= 1) {
      toast.error('Debe haber al menos un día')
      return
    }
    const updated = days.filter((_, i) => i !== idx)
    updateDays(updated)
    if (activeDay >= updated.length) setActiveDay(updated.length - 1)
  }

  const duplicateDay = (idx: number) => {
    const source = days[idx]
    const newDay: RoutineDay = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 5),
      name: `${source.name} (copia)`,
      exercises: source.exercises.map(ex => ({
        ...ex,
        id: Date.now().toString() + Math.random().toString(36).slice(2, 7)
      }))
    }
    const updated = [...days]
    updated.splice(idx + 1, 0, newDay)
    updateDays(updated)
    setActiveDay(idx + 1)
    toast.success('Día duplicado')
  }

  const renameDayFn = (idx: number, name: string) => {
    const updated = [...days]
    updated[idx] = { ...updated[idx], name }
    updateDays(updated)
  }

  const updateDayExercises = (idx: number, exercises: ExerciseItem[]) => {
    const updated = [...days]
    updated[idx] = { ...updated[idx], exercises }
    updateDays(updated)
  }

  const currentDay = days[activeDay]

  return (
    <div className="space-y-3">
      {/* DAY TABS */}
      <div className="flex items-center gap-1.5 flex-wrap bg-slate-50 rounded-xl p-1.5 border border-slate-200">
        {days.map((day, idx) => (
          <button
            key={day.id}
            type="button"
            onClick={() => setActiveDay(idx)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${idx === activeDay
              ? 'bg-white text-primary shadow-sm border border-primary/20'
              : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'
              }`}
          >
            <Layers className="h-3 w-3 inline mr-1.5" />
            {day.name}
            {day.exercises.length > 0 && (
              <span className="ml-1.5 bg-primary/10 text-primary text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                {day.exercises.length}
              </span>
            )}
          </button>
        ))}
        <button
          type="button"
          onClick={addDay}
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-all border border-dashed border-emerald-300"
        >
          <Plus className="h-3 w-3 inline mr-1" /> Agregar Día
        </button>
      </div>

      {/* ACTIVE DAY HEADER */}
      {currentDay && (
        <div className="flex items-center gap-2 bg-gradient-to-r from-primary/5 to-transparent p-3 rounded-lg border border-primary/10">
          <div className="flex-1">
            <Input
              value={currentDay.name}
              onChange={e => renameDayFn(activeDay, e.target.value)}
              className="h-7 text-sm font-bold bg-white/80 border-primary/20 max-w-[200px]"
              placeholder={`Día ${activeDay + 1}`}
            />
          </div>
          <button type="button" onClick={() => duplicateDay(activeDay)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold text-blue-600 hover:bg-blue-50 transition-all border border-blue-200">
            <Copy className="h-3 w-3" /> Duplicar
          </button>
          {days.length > 1 && (
            <button type="button" onClick={() => { if (confirm(`¿Eliminar "${currentDay.name}"?`)) removeDay(activeDay) }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold text-red-500 hover:bg-red-50 transition-all border border-red-200">
              <Trash2 className="h-3 w-3" /> Eliminar
            </button>
          )}
        </div>
      )}

      {/* EXERCISES FOR THIS DAY */}
      {currentDay && (
        <ExerciseListEditor
          value={currentDay.exercises}
          onChange={(exs) => updateDayExercises(activeDay, exs)}
        />
      )}
    </div>
  )
}

function RenderFieldInput({ field, value, onChange }: { field: any, value: any, onChange: (val: any) => void }) {
  switch (field.type) {
    case "exercise_days":
      return <DayRoutineEditor value={value} onChange={onChange} />
    case "exercise_list":
      return <ExerciseListEditor value={value || []} onChange={onChange} />
    case "textarea":
      return <Textarea value={value || ""} onChange={e => onChange(e.target.value)} placeholder="Escriba aquí..." className="min-h-[60px] py-1.5 resize-none text-sm" />
    case "number":
      return <Input type="number" value={value || ""} onChange={e => onChange(Number(e.target.value))} className="h-8 text-sm" />
    case "date":
      return <Input type="date" value={value ? format(new Date(value), "yyyy-MM-dd") : ""} onChange={e => onChange(e.target.value)} className="h-8 text-sm" />
    case "toggle":
      return (
        <div className="flex items-center gap-3 py-1">
          <Switch checked={!!value} onCheckedChange={onChange} className="h-4 w-7" />
          <span className={cn("text-[10px] font-bold uppercase tracking-wider", value ? "text-primary" : "text-slate-400")}>
            {value ? "Sí" : "No"}
          </span>
        </div>
      )
    case "select":
      return (
        <Select value={value || ""} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
          <SelectContent>
            {field.options?.map((opt: any) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
          </SelectContent>
        </Select>
      )
    case "scale":
      return (
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500">{field.min || 1}</span>
          <Slider
            value={[value || field.min || 1]}
            min={field.min || 1} max={field.max || 10} step={1}
            onValueChange={(vals) => onChange(vals[0])}
            className="flex-1"
          />
          <span className="text-xs font-medium text-slate-500">Val: {value}</span>
        </div>
      )
    default:
      return <Input type="text" value={value || ""} onChange={e => onChange(e.target.value)} className="h-8 text-sm" />
  }
}


// 2. FICHA DISPLAY COMPONENT (The Card in the list)
function FichaDisplay({ item, config, typeInfo, onEdit }: { item: any, config: Partial<ClinicalFormConfig>, typeInfo: any, onEdit: (item: any) => void }) {
  const [isOpen, setIsOpen] = useState(false)

  // Sort sections
  const sections = config.sections?.filter(s => s.isActive).sort((a, b) => a.order - b.order) || []
  const allFields = config.fields?.filter(f => f.isActive !== false).sort((a, b) => a.order - b.order) || []

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* CARD PREVIEW - Shows ALL data */}
      <div
        className="min-w-[380px] w-[380px] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all cursor-pointer flex flex-col snap-start"
        onClick={() => setIsOpen(true)}
      >
        {/* Header */}
        <div className={cn("px-4 py-3 border-b flex items-center justify-between", typeInfo.color.replace('bg-', 'bg-').replace('600', '50'))}>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-700 text-sm">
              {format(new Date(item.date || item.createdAt), "dd MMM yyyy", { locale: es })}
            </span>
            {item.month && (
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {item.month}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-indigo-600 hover:bg-slate-100/50" onClick={(e) => {
              e.stopPropagation()
              onEdit(item)
            }}>
              <Settings className="h-3.5 w-3.5" />
            </Button>
            {(item.isVisible !== undefined) && (
              <Badge variant={item.isVisible !== false ? "outline" : "destructive"} className={cn("text-[10px] h-5", item.isVisible !== false ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200")}>
                {item.isVisible !== false ? "Visible" : "Oculto"}
              </Badge>
            )}
            <Badge variant="outline" className="bg-white/50 border-transparent text-xs">
              Sesión #{item.sessionNumber || 1}
            </Badge>
          </div>
        </div>

        {/* Body - Show ALL sections and ALL fields */}
        <div className="p-4 space-y-4 flex-1 max-h-[400px] overflow-y-auto">
          {sections.map(section => {
            const sectionFields = allFields.filter(f => f.section === section.id)
            const fieldsWithData = sectionFields.filter(f =>
              f.key !== 'month' &&
              f.key !== 'isVisible' &&
              item[f.key] !== undefined &&
              item[f.key] !== null &&
              item[f.key] !== ''
            )

            if (fieldsWithData.length === 0) return null

            return (
              <div key={section.id} className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b pb-1">{section.title}</p>
                <div className="space-y-1.5">
                  {fieldsWithData.map(field => {
                    const val = item[field.key]
                    // Handle exercise_days type (RoutineDay[])
                    if (field.type === 'exercise_days' && Array.isArray(val)) {
                      const days = val as any[]
                      // Check if it's legacy flat array
                      const isLegacy = days.length > 0 && 'title' in days[0] && !('exercises' in days[0])
                      const routineDays = isLegacy ? [{ id: '1', name: 'Día 1', exercises: days }] : days
                      return (
                        <div key={field.id} className="space-y-2">
                          {routineDays.map((day: any, dIdx: number) => (
                            <div key={day.id || dIdx}>
                              <div className="flex items-center gap-1.5 mb-1">
                                <Layers className="h-3 w-3 text-primary" />
                                <span className="text-[10px] font-bold text-primary uppercase">{day.name}</span>
                                <span className="text-[9px] text-slate-400">({day.exercises?.length || 0} ej.)</span>
                              </div>
                              {day.exercises?.map((ex: any, i: number) => (
                                <div key={i} className="bg-slate-50 rounded-md p-2 border border-slate-100 ml-3 mb-1">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold">{i + 1}</div>
                                    <span className="text-xs font-semibold text-slate-700">{ex.title || `Ejercicio ${i + 1}`}</span>
                                    {ex.setsReps && <span className="ml-auto text-[10px] font-bold text-blue-600">{ex.setsReps}</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )
                    }
                    // Handle exercise_list type specially
                    if (field.type === 'exercise_list' && Array.isArray(val)) {
                      return (
                        <div key={field.id} className="space-y-2">
                          {val.map((ex: any, i: number) => (
                            <div key={i} className="bg-slate-50 rounded-md p-2 border border-slate-100">
                              <div className="flex items-center gap-1.5 mb-1">
                                <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold">{i + 1}</div>
                                <span className="text-xs font-semibold text-slate-700">{ex.title || `Ejercicio ${i + 1}`}</span>
                              </div>
                              {ex.setsReps && (
                                <div className="ml-5.5 mb-2 mt-1">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">
                                    <Repeat className="h-3 w-3" />
                                    {ex.setsReps}
                                  </span>
                                </div>
                              )}
                              {ex.videoUrl && (
                                <div className="mt-1.5 ml-5.5" onClick={(e) => e.stopPropagation()}>
                                  {ex.videoUrl.match(/(?:youtube\.com|youtu\.be)/) ? (
                                    <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary underline">🎬 Ver en YouTube</a>
                                  ) : (
                                    <video src={ex.videoUrl} controls preload="metadata" className="w-full max-h-[80px] rounded mt-0.5" />
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )
                    }
                    let displayVal = val
                    if (val && typeof val === 'object') {
                      displayVal = val.name ? `${val.name} ${val.relationship ? `(${val.relationship})` : ''}` : JSON.stringify(val)
                    }
                    return (
                      <div key={field.id} className="flex flex-col">
                        <span className="text-[10px] font-medium text-slate-400 uppercase">{field.label}</span>
                        <span className="text-sm text-slate-800">
                          {field.type === 'toggle' ? (val ? 'Sí' : 'No') : displayVal?.toString() || '-'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Points/Adherence Preview if exists */}
          {item.adherence && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-dashed">
              <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                <Heart className="h-3 w-3" /> +{item.adherence.positivePoints}
              </div>
              <div className="flex items-center gap-1 text-red-500 text-xs font-medium">
                <AlertCircle className="h-3 w-3" /> -{item.adherence.negativePoints}
              </div>
            </div>
          )}

          {/* Body Map Mini Preview */}
          {(item.bodyZones?.length > 0 || item.bodyMap?.length > 0) && (() => {
            const zones = item.bodyZones || item.bodyMap || []
            return (
              <div className="mt-2 pt-2 border-t border-dashed space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-primary">
                  <Activity className="h-3 w-3" />
                  <span>Mapa Corporal ({zones.length} zona{zones.length !== 1 ? 's' : ''})</span>
                </div>
                <div className="flex justify-center bg-slate-50 rounded-lg p-2" style={{ maxHeight: '350px', overflow: 'hidden' }}>
                  <div style={{ transform: 'scale(0.7)', transformOrigin: 'top center' }}>
                    <BodyMap zones={zones} readOnly={true} onZonesChange={() => { }} />
                  </div>
                </div>
                {/* Zone Notes */}
                {zones.filter((z: any) => z.notes || z.treatment).length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {zones.filter((z: any) => z.notes || z.treatment).map((z: any, idx: number) => (
                      <div key={idx} className="flex flex-col bg-slate-50 rounded px-2 py-1.5 border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{z.label || z.zoneId}</span>
                        {z.treatment && <span className="text-xs text-slate-700">Tratamiento: {z.treatment}</span>}
                        {z.intensity && <span className="text-xs text-slate-500">Intensidad: {z.intensity}</span>}
                        {z.notes && <span className="text-xs text-slate-600 italic">"{z.notes}"</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t flex justify-end">
          <span className="text-xs font-medium text-primary flex items-center gap-1">
            Ver ficha completa <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </div>

      {/* FULL DETAIL MODAL */}
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{typeInfo.label}</DialogTitle>
          <DialogDescription>
            {format(new Date(item.date || item.createdAt), "PPPP", { locale: es })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-4">
          {/* Render sections based on CONFIG */}
          {sections.map(section => {
            const fields = config.fields?.filter(f => f.section === section.id && f.isActive).sort((a, b) => a.order - b.order) || []
            if (fields.length === 0) return null

            return (
              <div key={section.id} className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 border-b pb-1 flex items-center gap-2">
                  {section.title}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fields.map(field => {
                    const val = item[field.key];
                    if (val === undefined || val === null || val === "") return null;

                    // Handle exercise_days type (RoutineDay[])
                    if (field.type === 'exercise_days' && Array.isArray(val)) {
                      const days = val as any[]
                      const isLegacy = days.length > 0 && 'title' in days[0] && !('exercises' in days[0])
                      const routineDays = isLegacy ? [{ id: '1', name: 'Día 1', exercises: days }] : days
                      return (
                        <div key={field.id} className="md:col-span-2 space-y-4">
                          {routineDays.map((day: any, dIdx: number) => (
                            <div key={day.id || dIdx}>
                              <div className="flex items-center gap-2 mb-2 bg-gradient-to-r from-primary/10 to-transparent px-3 py-2 rounded-lg">
                                <Layers className="h-4 w-4 text-primary" />
                                <span className="text-sm font-bold text-primary">{day.name}</span>
                                <span className="text-xs text-slate-400">— {day.exercises?.length || 0} ejercicio{(day.exercises?.length || 0) !== 1 ? 's' : ''}</span>
                              </div>
                              {day.exercises?.map((ex: any, i: number) => (
                                <div key={i} className="border border-slate-200 rounded-lg overflow-hidden mb-2 ml-2">
                                  <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 border-b border-slate-100">
                                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{i + 1}</div>
                                    <span className="text-sm font-bold text-slate-800">{ex.title || `Ejercicio ${i + 1}`}</span>
                                    {ex.setsReps && (
                                      <div className="ml-auto px-2.5 py-1 rounded-full bg-primary text-white text-xs font-bold leading-none shadow-sm flex items-center gap-1">
                                        <Repeat className="h-3 w-3" />
                                        {ex.setsReps}
                                      </div>
                                    )}
                                  </div>
                                  <div className="p-4 space-y-3">
                                    {ex.description && (
                                      <div className="text-sm text-slate-700 bg-slate-50 p-2 rounded-md border border-slate-100">{ex.description}</div>
                                    )}
                                    {ex.videoUrl && (() => {
                                      const ytMatch = ex.videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
                                      if (ytMatch) {
                                        return (
                                          <iframe width="100%" height="280" src={`https://www.youtube.com/embed/${ytMatch[1]}`}
                                            title={ex.title || 'Video'} frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen className="rounded-lg" />
                                        )
                                      }
                                      return (
                                        <video src={ex.videoUrl} controls preload="metadata"
                                          className="w-full max-h-[350px] rounded-lg bg-black">
                                          Tu navegador no soporta la reproducción de video.
                                        </video>
                                      )
                                    })()}
                                    {ex.notes && (
                                      <div className="text-xs text-slate-500 italic bg-amber-50 p-2 rounded-md border border-amber-100">📝 {ex.notes}</div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )
                    }
                    // Handle exercise_list type
                    if (field.type === 'exercise_list' && Array.isArray(val)) {
                      return (
                        <div key={field.id} className="md:col-span-2 space-y-3">
                          {val.map((ex: any, i: number) => (
                            <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
                              <div className="flex items-center gap-2 bg-gradient-to-r from-primary/5 to-transparent px-4 py-2.5 border-b border-slate-100">
                                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{i + 1}</div>
                                <span className="text-sm font-bold text-slate-800">{ex.title || `Ejercicio ${i + 1}`}</span>
                                {ex.setsReps && (
                                  <div className="ml-auto px-2.5 py-1 rounded-full bg-primary text-white text-xs font-bold leading-none shadow-sm flex items-center gap-1">
                                    <Repeat className="h-3 w-3" />
                                    {ex.setsReps}
                                  </div>
                                )}
                              </div>
                              <div className="p-4 space-y-3">
                                {ex.description && (
                                  <div className="text-sm text-slate-700 bg-slate-50 p-2 rounded-md border border-slate-100">{ex.description}</div>
                                )}
                                {ex.videoUrl && (() => {
                                  const ytMatch = ex.videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
                                  if (ytMatch) {
                                    return (
                                      <iframe width="100%" height="280" src={`https://www.youtube.com/embed/${ytMatch[1]}`}
                                        title={ex.title || 'Video'} frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen className="rounded-lg" />
                                    )
                                  }
                                  return (
                                    <video src={ex.videoUrl} controls preload="metadata"
                                      className="w-full max-h-[350px] rounded-lg bg-black">
                                      Tu navegador no soporta la reproducción de video.
                                    </video>
                                  )
                                })()}
                                {ex.notes && (
                                  <div className="text-xs text-slate-500 italic bg-amber-50 p-2 rounded-md border border-amber-100">📝 {ex.notes}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    }

                    // Normal field rendering
                    let displayVal = val;
                    if (val && typeof val === 'object') {
                      displayVal = val.name ? `${val.name} ${val.relationship ? `(${val.relationship})` : ''}` : JSON.stringify(val);
                    }
                    return (
                      <div key={field.id} className={cn("space-y-1", field.type === "textarea" ? "md:col-span-2" : "")}>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">{field.label}</label>
                        <div className="text-sm text-slate-800 bg-slate-50 p-2 rounded-md border border-slate-100">
                          {field.type === "toggle" ? (val ? "Sí" : "No") :
                            field.type === "scale" ? `${val} / ${field.max || 10}` :
                              displayVal.toString()}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Body Map Read-Only View */}
          {((item.bodyZones && item.bodyZones.length > 0) || (item.bodyMap && item.bodyMap.length > 0)) && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 border-b pb-1">Mapa Corporal</h4>
              <div className="flex justify-center p-4 bg-slate-50 rounded-xl">
                <BodyMap zones={item.bodyZones || item.bodyMap} readOnly={true} onZonesChange={() => { }} />
              </div>
            </div>
          )}

          {/* Adherence Read-Only */}
          {item.adherence && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 border-b pb-1">Adherencia y Puntos</h4>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex gap-4">
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                    +{item.adherence.positivePoints} Pts Positivos
                  </Badge>
                  <Badge className="bg-red-50 text-red-600 hover:bg-red-50 border-red-100">
                    -{item.adherence.negativePoints} Pts Negativos
                  </Badge>
                </div>
                {item.adherence.note && (
                  <p className="mt-2 text-sm text-slate-600 italic">"{item.adherence.note}"</p>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}



function ScrollableRow({ children, className }: { children: React.ReactNode, className?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' })
    }
  }

  return (
    <div className="space-y-3">
      {/* TOP NAVIGATION BAR - Using native buttons with text arrows */}
      <div className="flex items-center justify-between bg-slate-100 rounded-lg px-4 py-2">
        <span className="text-sm text-slate-600 font-medium">Navegar fichas:</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => scroll('left')}
            style={{ backgroundColor: '#3b82f6', color: 'white', width: '44px', height: '44px', borderRadius: '50%', fontSize: '20px', border: 'none', cursor: 'pointer' }}
          >
            ◀
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            style={{ backgroundColor: '#3b82f6', color: 'white', width: '44px', height: '44px', borderRadius: '50%', fontSize: '20px', border: 'none', cursor: 'pointer' }}
          >
            ▶
          </button>
        </div>
      </div>

      {/* SCROLLABLE CARDS */}
      <div ref={scrollRef} className={className}>
        {children}
      </div>
    </div>
  )
}

// 3. PERSONAL DATA VIEW (Special case)
function PersonalDataView({ client, record, config }: { client: any, record: any, config: Partial<ClinicalFormConfig> }) {
  if (!record) return <div>No hay datos personales cargados.</div>

  const sections = config.sections?.filter(s => s.isActive).sort((a, b) => a.order - b.order) || []

  return (
    <Card className="max-w-3xl mx-auto border-none shadow-sm ring-1 ring-slate-200 bg-white">
      <CardHeader className="border-b pb-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={client.profileImage} />
            <AvatarFallback className="text-lg bg-slate-100">{client.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl">{client.name}</CardTitle>
            <CardDescription>{client.email} • {client.phone}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {sections.map(section => {
          const fields = config.fields?.filter(f => f.section === section.id && f.isActive).sort((a, b) => a.order - b.order) || []

          return (
            <div key={section.id} className="p-6 border-b last:border-0">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                {section.title}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {fields.map(field => {
                  let val = record.personalData?.[field.key]
                  if (field.key === 'dni') val = client.dni;
                  if (field.key === 'address') val = client.address;

                  let displayVal = val;
                  if (val && typeof val === 'object') {
                    displayVal = val.name
                      ? `${val.name} ${val.relationship ? `(${val.relationship})` : ''}`
                      : JSON.stringify(val);
                  }

                  return (
                    <div key={field.id}>
                      <label className="text-xs font-medium text-slate-400 uppercase">{field.label}</label>
                      <p className="text-sm font-medium text-slate-800 mt-1">
                        {displayVal || <span className="text-slate-300 italic">No registrado</span>}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </CardContent>
      <CardFooter className="py-4 bg-slate-50 justify-end">
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" /> Editar Perfil
        </Button>
      </CardFooter>
    </Card>
  )
}
