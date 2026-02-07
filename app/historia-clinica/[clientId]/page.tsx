"use client"

import { useState, useMemo, useEffect } from "react"
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
  CreditCard
} from "lucide-react"
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
    updateMedicalRecord,
    clinicalFormConfigs, // The dynamic configs from context
    professionals
  } = useData()

  // State
  const [activeCategory, setActiveCategory] = useState<string>("Kinesiología")
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false)
  const [selectedFormType, setSelectedFormType] = useState<ClinicalFormType | null>(null)

  // Find Client and Record
  const client = clients.find((c) => c.id === clientId)
  const record = medicalRecords.find((r) => r.clientId === clientId)

  // Helper to get the effective config (dynamic OR default)
  const getEffectiveConfig = (type: ClinicalFormType): Partial<ClinicalFormConfig> => {
    // HARD OVERRIDE: For evaluation, always use default to fix persistence/corruption issues
    if (type === 'kinesiology_evaluation') {
      return getDefaultFormConfig('kinesiology_evaluation');
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
    if (!record || !activeCategoryConfig) return []

    let items: any[] = []

    // Map record arrays to a generic item structure with '_type'
    if (record.kinesiologyEvaluations) items = items.concat(record.kinesiologyEvaluations.map(i => ({ ...i, _type: 'kinesiology_evaluation' })))
    if (record.kinesiologyTreatments) items = items.concat(record.kinesiologyTreatments.map(i => ({ ...i, _type: 'kinesiology_treatment' })))
    if (record.kineHomePrograms) items = items.concat(record.kineHomePrograms.map(i => ({ ...i, _type: 'kine_home' })))
    if (record.trainingEvaluations) items = items.concat(record.trainingEvaluations.map(i => ({ ...i, _type: 'training_evaluation' })))
    if (record.trainingRoutines) items = items.concat(record.trainingRoutines.map(i => ({ ...i, _type: 'training_routine' })))
    if (record.anthropometryEvaluations) items = items.concat(record.anthropometryEvaluations.map(i => ({ ...i, _type: 'nutrition_anthropometry' })))
    if (record.recipes) items = items.concat(record.recipes.map(i => ({ ...i, _type: 'nutrition_recipe' })))
    if (record.massageEvaluations) items = items.concat(record.massageEvaluations.map(i => ({ ...i, _type: 'massage_evaluation' })))
    if (record.yogaEvaluations) items = items.concat(record.yogaEvaluations.map(i => ({ ...i, _type: 'yoga_evaluation' })))

    // Filter by types belonging to active category
    return items
      .filter(item => activeCategoryConfig.types.includes(item._type))
      .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())

  }, [record, activeCategoryConfig])

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
        <ScrollArea className="flex-1 bg-slate-50/50">
          <div className="p-6 pb-20 space-y-8">
            {activeCategory === "Datos Personales" ? (
              <PersonalDataView client={client} record={record} config={getEffectiveConfig('personal')} />
            ) : (
              activeCategoryConfig?.types.map(type => {
                const items = itemsByType[type] || []
                const typeInfo = FORM_TYPES_INFO.find(t => t.value === type)
                const config = getEffectiveConfig(type as ClinicalFormType);

                if (!typeInfo) return null

                return (
                  <div key={type} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("p-1.5 rounded-md", typeInfo.color.replace('bg-', 'bg-').replace('600', '100').replace('500', '100'))}>
                          <typeInfo.icon className={cn("h-4 w-4", typeInfo.color.replace('bg-', 'text-'))} />
                        </div>
                        <h3 className="font-semibold text-slate-800">{typeInfo.label}</h3>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200">
                          {items.length}
                        </Badge>
                      </div>
                      {/* Optional: Add "Ver todo" link if specific list view needed */}
                    </div>

                    {items.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400">
                        <typeInfo.icon className="h-8 w-8 mb-2 opacity-20" />
                        <span className="text-sm">Sin registros aún</span>
                      </div>
                    ) : (
                      <div className="flex overflow-x-auto gap-4 pb-4 snap-x pr-4 -mx-6 px-6 scrollbar-hide">
                        {items.map((item, idx) => (
                          <FichaDisplay
                            key={item.id || idx}
                            item={item}
                            config={config}
                            typeInfo={typeInfo}
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
              {selectedFormType
                ? FORM_TYPES_INFO.find(t => t.value === selectedFormType)?.label
                : `Nueva Ficha - ${activeCategory}`}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {selectedFormType ? "Complete los datos de la ficha." : "Seleccione el tipo de ficha a crear."}
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
              key={selectedFormType} // CRITICAL FIX: Forces component remount/reset on type change
              type={selectedFormType}
              config={getEffectiveConfig(selectedFormType)}
              initialSessionNumber={relevantHistoryItems.length + 1}
              initialProfessionalName={professionals.find(p => p.id === user?.professionalId)?.name || user?.name || "Profesional"}
              onCancel={() => setSelectedFormType(null)}
              onSubmit={async (values) => {
                // Prepare the object to save
                const newRecord = {
                  ...values,
                  id: crypto.randomUUID(),
                  clientId: client.id,
                  professionalId: currentUser?.professionalId || "unknown", // Should select professional
                  date: new Date(),
                  createdAt: new Date(),
                  visibleToPatient: true
                }

                // Just save for now, specific logic would go here to update 'medicalRecords'
                // We will map 'type' to the property name in MedicalRecord
                // ... (logic reused from before) ...

                let updatedRecord: any = record ? { ...record } : { id: crypto.randomUUID(), clientId: client.id, createdAt: new Date() }

                // [Simplified logic for brevity, assuming standard push]
                if (selectedFormType === 'kinesiology_evaluation') {
                  updatedRecord.kinesiologyEvaluations = [...(updatedRecord.kinesiologyEvaluations || []), newRecord]
                } else if (selectedFormType === 'kinesiology_treatment') {
                  updatedRecord.kinesiologyTreatments = [...(updatedRecord.kinesiologyTreatments || []), newRecord]
                } else if (selectedFormType === 'kine_home') {
                  updatedRecord.kineHomePrograms = [...(updatedRecord.kineHomePrograms || []), newRecord]
                } else if (selectedFormType === 'training_evaluation') {
                  updatedRecord.trainingEvaluations = [...(updatedRecord.trainingEvaluations || []), newRecord]
                } else if (selectedFormType === 'training_routine') {
                  updatedRecord.trainingRoutines = [...(updatedRecord.trainingRoutines || []), newRecord]
                } else if (selectedFormType === 'nutrition_anthropometry') {
                  updatedRecord.anthropometryEvaluations = [...(updatedRecord.anthropometryEvaluations || []), newRecord]
                } else if (selectedFormType === 'nutrition_recipe') {
                  updatedRecord.recipes = [...(updatedRecord.recipes || []), newRecord]
                } else if (selectedFormType === 'massage_evaluation') {
                  updatedRecord.massageEvaluations = [...(updatedRecord.massageEvaluations || []), newRecord]
                } else if (selectedFormType === 'yoga_evaluation') {
                  updatedRecord.yogaEvaluations = [...(updatedRecord.yogaEvaluations || []), newRecord]
                }

                if (!record) {
                  addMedicalRecord(updatedRecord as any)
                } else {
                  updateMedicalRecord(client.id, updatedRecord as any)
                }

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
  initialProfessionalName
}: {
  type: ClinicalFormType,
  config: Partial<ClinicalFormConfig>,
  onCancel: () => void,
  onSubmit: (values: any) => void,
  initialSessionNumber: number,
  initialProfessionalName: string
}) {
  const [values, setValues] = useState<Record<string, any>>({
    sessionNumber: initialSessionNumber,
    professionalName: initialProfessionalName,
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
          ) : (
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

function RenderFieldInput({ field, value, onChange }: { field: any, value: any, onChange: (val: any) => void }) {
  switch (field.type) {
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
function FichaDisplay({ item, config, typeInfo }: { item: any, config: Partial<ClinicalFormConfig>, typeInfo: any }) {
  const [isOpen, setIsOpen] = useState(false)

  // Sort sections
  const sections = config.sections?.filter(s => s.isActive).sort((a, b) => a.order - b.order) || []

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* CARD PREVIEW */}
      <div
        className="min-w-[320px] w-[320px] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all cursor-pointer flex flex-col snap-start"
        onClick={() => setIsOpen(true)}
      >
        {/* Header */}
        <div className={cn("px-4 py-3 border-b flex items-center justify-between", typeInfo.color.replace('bg-', 'bg-').replace('600', '50'))}>
          <span className="font-semibold text-slate-700 text-sm">
            {format(new Date(item.date || item.createdAt), "dd MMM yyyy", { locale: es })}
          </span>
          <Badge variant="outline" className="bg-white/50 border-transparent text-xs">
            Session #{item.sessionNumber || 1}
          </Badge>
        </div>

        {/* Body Preview */}
        <div className="p-4 space-y-3 flex-1">
          {/* Show first 3 relevant non-empty text fields */}
          {sections.slice(0, 2).map(section => {
            const firstField = config.fields?.find(f => f.section === section.id && f.isActive && item[f.key])
            if (!firstField) return null
            return (
              <div key={section.id}>
                <p className="text-xs font-medium text-slate-500 uppercase">{section.title}</p>
                <p className="text-sm text-slate-800 line-clamp-2 leading-relaxed">
                  {typeof item[firstField.key] === 'object' ? 'Ver detalle...' : item[firstField.key]}
                </p>
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

                    // Safe rendering for object values in detail view too
                    let displayVal = val;
                    if (val && typeof val === 'object') {
                      displayVal = val.name
                        ? `${val.name} ${val.relationship ? `(${val.relationship})` : ''}`
                        : JSON.stringify(val);
                    }

                    return (
                      <div key={field.id} className={cn("space-y-1", field.type === "textarea" ? "md:col-span-2" : "")}>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                          {field.label}
                        </label>
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
          {item.bodyZones && item.bodyZones.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 border-b pb-1">Mapa Corporal</h4>
              <div className="flex justify-center p-4 bg-slate-50 rounded-xl">
                <BodyMap zones={item.bodyZones} readOnly={true} onZonesChange={() => { }} />
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
