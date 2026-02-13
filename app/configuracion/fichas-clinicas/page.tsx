"use client"

import { useState, useEffect, useMemo } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Save,
  ArrowLeft,
  FileText,
  Activity,
  Dumbbell,
  Apple,
  Sparkles,
  Heart,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import type {
  ClinicalFormConfig,
  FormFieldConfig,
  FormSectionConfig,
  FormFieldType,
  ClinicalFormType,
} from "@/lib/types"

import {
  SERVICE_CATEGORIES as FORM_CATEGORIES,
  FORM_TYPES_INFO as FORM_TYPES,
  getDefaultFormConfig,
  FIELD_TYPES
} from "@/lib/clinical-forms-defaults"

// Default form configurations

export default function ClinicalFormsConfigPage() {
  const { user } = useAuth()
  const {
    clinicalFormConfigs,
    addClinicalFormConfig,
    updateClinicalFormConfig,
    deleteClinicalFormConfig
  } = useData()

  const [selectedFormType, setSelectedFormType] = useState<ClinicalFormType>("kinesiology_evaluation")
  const [selectedConfig, setSelectedConfig] = useState<ClinicalFormConfig | null>(null)
  const [showFieldDialog, setShowFieldDialog] = useState(false)
  const [showSectionDialog, setShowSectionDialog] = useState(false)
  const [editingField, setEditingField] = useState<FormFieldConfig | null>(null)
  const [editingSection, setEditingSection] = useState<FormSectionConfig | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const [fieldForm, setFieldForm] = useState<Partial<FormFieldConfig>>({
    type: "text",
    isActive: true,
    visibleToPatient: true,
    order: 0,
  })
  const [sectionForm, setSectionForm] = useState<Partial<FormSectionConfig>>({
    isActive: true,
    order: 0,
  })
  const [fieldOptions, setFieldOptions] = useState<string>("") // For select/multiselect/radio
  const [showNewFormDialog, setShowNewFormDialog] = useState(false)
  const [newFormForm, setNewFormForm] = useState({
    name: "",
    category: "nutricion",
    typeKey: ""
  })
  const [showEditFormDialog, setShowEditFormDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editFormForm, setEditFormForm] = useState({
    name: "",
    category: "nutricion",
  })

  // Seeding removed - DataContext handles initialization

  // Derive dynamic form types from formConfigs
  const dynamicFormTypes = useMemo(() => {
    const seen = new Set<string>()
    const uniqueTypes: any[] = []

    clinicalFormConfigs.forEach(c => {
      if (seen.has(c.formType)) return
      seen.add(c.formType)

      // Find if it's already in FORM_TYPES
      const existing = FORM_TYPES.find(ft => ft.value === c.formType)

      // If it exists in FORM_TYPES but the config has an OVERRIDE category, we use that
      const categoryId = c.category || existing?.category || (
        FORM_CATEGORIES.find(cat =>
          c.formType.startsWith(cat.id) ||
          (c.name.toLowerCase().includes('nutri') ? 'nutricion' :
            c.name.toLowerCase().includes('kine') ? 'kinesiologia' :
              c.name.toLowerCase().includes('entren') ? 'entrenamiento' : 'evolucion')
        )?.id || "evolucion"
      )

      const category = FORM_CATEGORIES.find(cat => cat.id === categoryId)

      uniqueTypes.push({
        value: c.formType,
        label: c.name,
        icon: category?.icon || existing?.icon || FileText,
        color: category?.bgColor || existing?.color || "bg-slate-500",
        category: categoryId
      })
    })

    return uniqueTypes
  }, [clinicalFormConfigs])

  // Update selected config when form type changes
  useEffect(() => {
    const config = clinicalFormConfigs.find((c) => c.formType === selectedFormType)
    setSelectedConfig(config || null)
    setExpandedSections(new Set(config?.sections.map((s) => s.id) || []))
  }, [selectedFormType, clinicalFormConfigs])

  const updateConfig = (updatedConfig: ClinicalFormConfig) => {
    updateClinicalFormConfig(updatedConfig.id, updatedConfig)
    setSelectedConfig(updatedConfig)
  }

  const openFieldDialog = (field?: FormFieldConfig) => {
    if (field) {
      setEditingField(field)
      setFieldForm(field)
      setFieldOptions(field.options?.map((o) => `${o.value}:${o.label}`).join("\n") || "")
    } else {
      setEditingField(null)
      setFieldForm({
        type: "text",
        isActive: true,
        visibleToPatient: true,
        order: selectedConfig?.fields.length || 0,
        section: selectedConfig?.sections[0]?.key || "",
      })
      setFieldOptions("")
    }
    setShowFieldDialog(true)
  }

  const openSectionDialog = (section?: FormSectionConfig) => {
    if (section) {
      setEditingSection(section)
      setSectionForm(section)
    } else {
      setEditingSection(null)
      setSectionForm({
        isActive: true,
        order: selectedConfig?.sections.length || 0,
      })
    }
    setShowSectionDialog(true)
  }

  const saveField = () => {
    if (!selectedConfig || !fieldForm.label) return

    // Auto-generate key if missing
    let fieldKey = fieldForm.key
    if (!fieldKey) {
      fieldKey = fieldForm.label
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "")

      if (!fieldKey) fieldKey = `field_${Date.now()}`
    }

    const options = fieldOptions
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        const [value, label] = line.split(":")
        return { value: value.trim(), label: (label || value).trim() }
      })

    const newField: FormFieldConfig = {
      id: editingField?.id || `field_${Date.now()}`,
      key: fieldKey,
      label: fieldForm.label!,
      type: fieldForm.type || "text",
      placeholder: fieldForm.placeholder,
      helpText: fieldForm.helpText,
      options: options.length > 0 ? options : undefined,
      min: fieldForm.min,
      max: fieldForm.max,
      required: fieldForm.required,
      visibleToPatient: fieldForm.visibleToPatient ?? true,
      order: fieldForm.order ?? 0,
      isActive: fieldForm.isActive ?? true,
      section: fieldForm.section || selectedConfig.sections[0]?.key || "default",
    }

    let newFields: FormFieldConfig[]
    if (editingField) {
      newFields = selectedConfig.fields.map((f) => (f.id === editingField.id ? newField : f))
    } else {
      newFields = [...selectedConfig.fields, newField]
    }

    updateConfig({ ...selectedConfig, fields: newFields })
    setShowFieldDialog(false)
  }

  const saveSection = () => {
    if (!selectedConfig || !sectionForm.title) return

    // Auto-generate key if missing
    let sectionKey = sectionForm.key
    if (!sectionKey) {
      sectionKey = sectionForm.title
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "")

      if (!sectionKey) sectionKey = `section_${Date.now()}`
    }

    const newSection: FormSectionConfig = {
      id: editingSection?.id || `section_${Date.now()}`,
      key: sectionKey,
      title: sectionForm.title!,
      description: sectionForm.description,
      order: sectionForm.order ?? 0,
      isActive: sectionForm.isActive ?? true,
      isCollapsible: sectionForm.isCollapsible,
    }

    let newSections: FormSectionConfig[]
    if (editingSection) {
      newSections = selectedConfig.sections.map((s) => (s.id === editingSection.id ? newSection : s))
    } else {
      newSections = [...selectedConfig.sections, newSection]
    }

    updateConfig({ ...selectedConfig, sections: newSections })
    setShowSectionDialog(false)
  }

  const deleteField = (fieldId: string) => {
    if (!selectedConfig) return
    const newFields = selectedConfig.fields.filter((f) => f.id !== fieldId)
    updateConfig({ ...selectedConfig, fields: newFields })
  }

  const deleteSection = (sectionId: string) => {
    if (!selectedConfig) return
    const newSections = selectedConfig.sections.filter((s) => s.id !== sectionId)
    const newFields = selectedConfig.fields.filter(
      (f) => f.section !== selectedConfig.sections.find((s) => s.id === sectionId)?.key,
    )
    updateConfig({ ...selectedConfig, sections: newSections, fields: newFields })
  }

  const toggleFieldActive = (fieldId: string) => {
    if (!selectedConfig) return
    const newFields = selectedConfig.fields.map((f) => (f.id === fieldId ? { ...f, isActive: !f.isActive } : f))
    updateConfig({ ...selectedConfig, fields: newFields })
  }

  const toggleFieldVisibility = (fieldId: string) => {
    if (!selectedConfig) return
    const newFields = selectedConfig.fields.map((f) =>
      f.id === fieldId ? { ...f, visibleToPatient: !f.visibleToPatient } : f,
    )
    updateConfig({ ...selectedConfig, fields: newFields })
  }

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const resetToDefaults = () => {
    if (!selectedFormType) return
    const defaultConfig = getDefaultFormConfig(selectedFormType)
    const newConfig: ClinicalFormConfig = {
      id: selectedFormType,
      formType: selectedFormType,
      name: defaultConfig.name || "",
      description: defaultConfig.description || "",
      sections: (defaultConfig.sections || []) as FormSectionConfig[],
      fields: (defaultConfig.fields || []) as FormFieldConfig[],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    updateClinicalFormConfig(newConfig.id, newConfig)
    setSelectedConfig(newConfig)
  }

  const createNewForm = () => {
    if (!newFormForm.name) return

    const typeKey = newFormForm.typeKey || newFormForm.name
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "") || `form_${Date.now()}`

    const finalTypeKey = clinicalFormConfigs.some(c => c.formType === typeKey)
      ? `${typeKey}_${Date.now()}`
      : typeKey

    const newConfig: ClinicalFormConfig = {
      id: finalTypeKey,
      formType: finalTypeKey as ClinicalFormType,
      name: newFormForm.name,
      category: newFormForm.category,
      description: "",
      sections: [{ id: `section_${Date.now()}`, key: "general", title: "General", order: 0, isActive: true }],
      fields: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    addClinicalFormConfig(newConfig)
    setSelectedFormType(finalTypeKey as ClinicalFormType)
    setShowNewFormDialog(false)
    setNewFormForm({ name: "", category: "nutricion", typeKey: "" })
  }

  const openEditFormDialog = () => {
    if (!selectedConfig || !selectedFormInfo) return
    setEditFormForm({
      name: selectedConfig.name,
      category: selectedFormInfo.category,
    })
    setShowEditFormDialog(true)
  }

  const saveFormMetadata = () => {
    if (!selectedConfig || !editFormForm.name) return

    const updatedConfig = {
      ...selectedConfig,
      name: editFormForm.name,
      category: editFormForm.category,
      updatedAt: new Date()
    }

    updateClinicalFormConfig(updatedConfig.id, updatedConfig)
    setShowEditFormDialog(false)
  }

  const deleteForm = () => {
    if (!selectedConfig) return
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    if (!selectedConfig) return

    console.log("[ConfigPage] Deleting form:", {
      id: selectedConfig.id,
      type: selectedFormType,
      name: selectedConfig.name
    })

    const remainingConfigs = clinicalFormConfigs.filter(c => c.id !== selectedConfig.id)

    deleteClinicalFormConfig(selectedConfig.id)
    setShowDeleteDialog(false)

    // Clear selection immediately to prevent stale UI
    setSelectedConfig(null)

    // Select the first available form or force reset
    if (remainingConfigs.length > 0) {
      setSelectedFormType(remainingConfigs[0].formType)
    } else {
      setSelectedFormType("" as any)
    }
  }

  if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Acceso Restringido</h2>
            <p className="text-muted-foreground">No tienes permisos para acceder a esta sección.</p>
          </Card>
        </div>
      </AppLayout>
    )
  }

  const selectedFormInfo = dynamicFormTypes.find((ft) => ft.value === selectedFormType)

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/configuracion">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Configuración de Fichas Clínicas</h1>
              <p className="text-muted-foreground">Personaliza los cuestionarios de cada servicio</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Form Types */}
          <div className="col-span-3">
            <Card className="h-[calc(100vh-12rem)] overflow-hidden flex flex-col">
              <CardHeader className="pb-3 px-4 flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">Categorías y Fichas</CardTitle>
                  <CardDescription className="text-xs">Selecciona una ficha para configurar</CardDescription>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowNewFormDialog(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-2 flex-1 overflow-y-auto">
                <div className="space-y-4 px-2 pb-4">
                  {FORM_CATEGORIES.map((cat) => {
                    const CatIcon = cat.icon
                    const categoryForms = dynamicFormTypes.filter((ft) => ft.category === cat.id)

                    return (
                      <div key={cat.id} className="space-y-1">
                        <div className="flex items-center gap-2 px-2 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/30 rounded-md">
                          <CatIcon className={`h-3 w-3 ${cat.color}`} />
                          {cat.label}
                        </div>
                        <div className="space-y-0.5 ml-1 border-l-2 border-muted pl-2">
                          {categoryForms.map((ft) => {
                            const Icon = ft.icon
                            const isSelected = selectedFormType === ft.value
                            return (
                              <button
                                key={ft.value}
                                onClick={() => setSelectedFormType(ft.value)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${isSelected
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "hover:bg-accent text-muted-foreground hover:text-foreground"
                                  }`}
                              >
                                <div
                                  className={`p-1 rounded ${isSelected ? "bg-primary-foreground/20" : ft.color + " text-white"
                                    }`}
                                >
                                  <Icon className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-sm font-medium truncate">{ft.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Form Editor */}
          <div className="col-span-9 space-y-4">
            {selectedConfig && selectedFormInfo && (
              <>
                {/* Form Header */}
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${selectedFormInfo.color} text-white`}>
                          <selectedFormInfo.icon className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold">{selectedConfig.name}</h2>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={openEditFormDialog}>
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">{selectedConfig.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={deleteForm}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={resetToDefaults}>
                          Restaurar Predeterminados
                        </Button>
                        <Button size="sm" onClick={() => openSectionDialog()}>
                          <Plus className="h-4 w-4 mr-2" />
                          Nueva Sección
                        </Button>
                        <Button size="sm" onClick={() => openFieldDialog()}>
                          <Plus className="h-4 w-4 mr-2" />
                          Nuevo Campo
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sections and Fields */}
                <div className="space-y-4">
                  {selectedConfig.sections
                    .sort((a, b) => a.order - b.order)
                    .map((section) => {
                      const sectionFields = selectedConfig.fields
                        .filter((f) => f.section === section.key)
                        .sort((a, b) => a.order - b.order)
                      const isExpanded = expandedSections.has(section.id)

                      return (
                        <Card key={section.id} className={!section.isActive ? "opacity-50" : ""}>
                          <CardHeader className="py-3 cursor-pointer" onClick={() => toggleSection(section.id)}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                <div>
                                  <CardTitle className="text-base">{section.title}</CardTitle>
                                  {section.description && (
                                    <CardDescription className="text-xs">{section.description}</CardDescription>
                                  )}
                                </div>
                                {!section.isActive && (
                                  <Badge variant="secondary" className="ml-2">
                                    Inactiva
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <Badge variant="outline">{sectionFields.length} campos</Badge>
                                <Button variant="ghost" size="icon" onClick={() => openSectionDialog(section)}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => deleteSection(section.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>

                          {isExpanded && (
                            <CardContent className="pt-0">
                              <div className="space-y-2">
                                {sectionFields.length === 0 ? (
                                  <p className="text-sm text-muted-foreground text-center py-4">
                                    No hay campos en esta sección
                                  </p>
                                ) : (
                                  sectionFields.map((field) => (
                                    <div
                                      key={field.id}
                                      className={`flex items-center justify-between p-3 rounded-lg border ${!field.isActive ? "bg-muted/50 opacity-60" : "bg-background"
                                        }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium">{field.label}</span>
                                            {field.required && <span className="text-destructive">*</span>}
                                            <Badge variant="secondary" className="text-xs">
                                              {FIELD_TYPES.find((ft) => ft.value === field.type)?.label || field.type}
                                            </Badge>
                                          </div>
                                          <span className="text-xs text-muted-foreground">{field.key}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => toggleFieldVisibility(field.id)}
                                          title={
                                            field.visibleToPatient ? "Visible para paciente" : "Oculto para paciente"
                                          }
                                        >
                                          {field.visibleToPatient ? (
                                            <Eye className="h-4 w-4 text-green-600" />
                                          ) : (
                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                          )}
                                        </Button>
                                        <Switch
                                          checked={field.isActive}
                                          onCheckedChange={() => toggleFieldActive(field.id)}
                                        />
                                        <Button variant="ghost" size="icon" onClick={() => openFieldDialog(field)}>
                                          <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => deleteField(field.id)}>
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      )
                    })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Field Dialog */}
      <Dialog open={showFieldDialog} onOpenChange={setShowFieldDialog}>
        <DialogContent className="sm:max-w-[600px] gap-6 transition-all">
          <DialogHeader className="pb-2 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-slate-100 text-slate-600`}>
                <Edit2 className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl font-bold text-slate-900">
                  {editingField ? "Editar Campo" : "Nuevo Campo"}
                </DialogTitle>
                <DialogDescription className="text-slate-500 mt-1">
                  {editingField
                    ? "Ajusta las propiedades y validaciones de este campo."
                    : "Agrega un nuevo punto de entrada de datos al formulario."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh] -mr-4 pr-4">
            <div className="grid gap-6 pt-2 pb-2 pl-1">

              {/* Primary Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="field-label" className="text-sm font-bold text-slate-700">Etiqueta del Campo</Label>
                  <Input
                    id="field-label"
                    value={fieldForm.label || ""}
                    onChange={(e) => setFieldForm({ ...fieldForm, label: e.target.value })}
                    placeholder="Ej: Motivo de Consulta"
                    className="h-11 border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-base"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Tipo de Dato</Label>
                    <Select
                      value={fieldForm.type}
                      onValueChange={(v) => setFieldForm({ ...fieldForm, type: v as FormFieldType })}
                    >
                      <SelectTrigger className="bg-slate-50 border-slate-200 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map((ft) => (
                          <SelectItem key={ft.value} value={ft.value}>
                            {ft.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Sección</Label>
                    <Select value={fieldForm.section} onValueChange={(v) => setFieldForm({ ...fieldForm, section: v })}>
                      <SelectTrigger className="bg-slate-50 border-slate-200 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedConfig?.sections.map((s) => (
                          <SelectItem key={s.key} value={s.key}>
                            {s.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="field-placeholder" className="text-sm font-medium text-slate-600">Placeholder</Label>
                  <Input
                    id="field-placeholder"
                    value={fieldForm.placeholder || ""}
                    onChange={(e) => setFieldForm({ ...fieldForm, placeholder: e.target.value })}
                    placeholder="Texto de ejemplo para guiar al usuario..."
                    className="border-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="field-help" className="text-sm font-medium text-slate-600">Texto de Ayuda</Label>
                  <Input
                    id="field-help"
                    value={fieldForm.helpText || ""}
                    onChange={(e) => setFieldForm({ ...fieldForm, helpText: e.target.value })}
                    placeholder="Instrucciones adicionales..."
                    className="border-slate-200"
                  />
                </div>
              </div>

              {/* Conditional Inputs */}
              {(fieldForm.type === "select" || fieldForm.type === "multiselect" || fieldForm.type === "radio") && (
                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <Label className="text-sm font-bold text-slate-700">Opciones</Label>
                  <p className="text-xs text-slate-500 mb-2">Ingresa una opción por línea con el formato <span className="font-mono bg-slate-200 px-1 rounded">valor:etiqueta</span></p>
                  <Textarea
                    value={fieldOptions}
                    onChange={(e) => setFieldOptions(e.target.value)}
                    placeholder="si:Sí&#10;no:No&#10;a_veces:A veces"
                    rows={5}
                    className="font-mono text-xs bg-white"
                  />
                </div>
              )}

              {(fieldForm.type === "number" || fieldForm.type === "scale") && (
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="space-y-2">
                    <Label>Mínimo</Label>
                    <Input
                      type="number"
                      value={fieldForm.min ?? ""}
                      onChange={(e) =>
                        setFieldForm({ ...fieldForm, min: e.target.value ? Number(e.target.value) : undefined })
                      }
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Máximo</Label>
                    <Input
                      type="number"
                      value={fieldForm.max ?? ""}
                      onChange={(e) =>
                        setFieldForm({ ...fieldForm, max: e.target.value ? Number(e.target.value) : undefined })
                      }
                      className="bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Technical */}
              <div className="grid grid-cols-5 gap-4 pt-2">
                <div className="col-span-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="field-key" className="text-xs font-bold uppercase tracking-wider text-slate-500">Identificador (Key)</Label>
                    <Badge variant="outline" className="text-[9px] h-4 px-1 py-0 text-slate-400 border-slate-200">System</Badge>
                  </div>
                  <Input
                    id="field-key"
                    value={fieldForm.key || ""}
                    onChange={(e) => setFieldForm({ ...fieldForm, key: e.target.value })}
                    placeholder="unique_key"
                    className="font-mono text-xs bg-slate-50 border-slate-200 text-slate-600"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="field-order" className="text-xs font-bold uppercase tracking-wider text-slate-500">Orden</Label>
                  <Input
                    id="field-order"
                    type="number"
                    value={fieldForm.order ?? 0}
                    onChange={(e) => setFieldForm({ ...fieldForm, order: Number(e.target.value) })}
                    className="bg-slate-50 border-slate-200 text-center"
                  />
                  <p className="text-[10px] text-slate-400 leading-tight">Define la posición (1 = Arriba)</p>
                </div>
              </div>

              <Separator className="bg-slate-100" />

              {/* Toggles */}
              <div className="grid gap-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setFieldForm({ ...fieldForm, required: !fieldForm.required })}>
                  <div>
                    <Label className="font-semibold text-slate-700 cursor-pointer">Campo Obligatorio</Label>
                    <p className="text-xs text-slate-500">El usuario no podrá guardar sin completar esto.</p>
                  </div>
                  <Switch
                    checked={fieldForm.required ?? false}
                    onCheckedChange={(v) => setFieldForm({ ...fieldForm, required: v })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setFieldForm({ ...fieldForm, visibleToPatient: !fieldForm.visibleToPatient })}>
                  <div>
                    <Label className="font-semibold text-slate-700 cursor-pointer">Visible para el Paciente</Label>
                    <p className="text-xs text-slate-500">El paciente podrá ver este dato en su portal.</p>
                  </div>
                  <Switch
                    checked={fieldForm.visibleToPatient ?? true}
                    onCheckedChange={(v) => setFieldForm({ ...fieldForm, visibleToPatient: v })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setFieldForm({ ...fieldForm, isActive: !fieldForm.isActive })}>
                  <div>
                    <Label className="font-semibold text-slate-700 cursor-pointer">Campo Activo</Label>
                    <p className="text-xs text-slate-500">Desactivar para ocultarlo sin borrarlo.</p>
                  </div>
                  <Switch
                    checked={fieldForm.isActive ?? true}
                    onCheckedChange={(v) => setFieldForm({ ...fieldForm, isActive: v })}
                  />
                </div>
              </div>

            </div>
          </ScrollArea>

          <DialogFooter className="mt-2 border-t border-slate-100 pt-4">
            <Button variant="ghost" onClick={() => setShowFieldDialog(false)} className="text-slate-500 hover:text-slate-700 hover:bg-slate-100">
              Cancelar
            </Button>
            <Button onClick={saveField} className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 px-6">
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Section Dialog */}
      <Dialog open={showSectionDialog} onOpenChange={setShowSectionDialog}>
        <DialogContent className="sm:max-w-[500px] gap-6 transition-all">
          <DialogHeader className="pb-2 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-slate-100 text-slate-600`}>
                <GripVertical className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl font-bold text-slate-900">
                  {editingSection ? "Editar Sección" : "Nueva Sección"}
                </DialogTitle>
                <DialogDescription className="text-slate-500 mt-1">
                  {editingSection
                    ? "Modifica el título, orden y visibilidad de esta sección."
                    : "Crea un nuevo grupo para organizar tus campos."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid gap-6 pt-2">

            {/* Main Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sec-title" className="text-sm font-bold text-slate-700">Título de la Sección</Label>
                <Input
                  id="sec-title"
                  value={sectionForm.title || ""}
                  onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                  placeholder="Ej: Datos Clínicos"
                  className="h-11 border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sec-desc" className="text-sm font-medium text-slate-600">Descripción <span className="text-slate-400 font-normal text-xs ml-1">(Opcional)</span></Label>
                <Input
                  id="sec-desc"
                  value={sectionForm.description || ""}
                  onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                  placeholder="Pequeña descripción para guiar al usuario..."
                  className="bg-slate-50/50 border-slate-200"
                />
              </div>
            </div>

            {/* Technical & Ordering */}
            <div className="grid grid-cols-5 gap-4">
              <div className="col-span-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="sec-key" className="text-xs font-bold uppercase tracking-wider text-slate-500">Identificador (Key)</Label>
                  <Badge variant="outline" className="text-[9px] h-4 px-1 py-0 text-slate-400 border-slate-200">BBDD</Badge>
                </div>
                <Input
                  id="sec-key"
                  value={sectionForm.key || ""}
                  onChange={(e) => setSectionForm({ ...sectionForm, key: e.target.value })}
                  placeholder="clinical_data"
                  className="font-mono text-xs bg-slate-50 border-slate-200 text-slate-600"
                />
                <p className="text-[10px] text-slate-400">ID interno único. Evita cambiarlo si ya hay datos guardados.</p>
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="sec-order" className="text-xs font-bold uppercase tracking-wider text-slate-500">Orden</Label>
                <Input
                  id="sec-order"
                  type="number"
                  value={sectionForm.order ?? 0}
                  onChange={(e) => setSectionForm({ ...sectionForm, order: Number(e.target.value) })}
                  className="bg-slate-50 border-slate-200 text-center"
                />
                <p className="text-[10px] text-slate-400 leading-tight">Define la posición (1 = Arriba)</p>
              </div>
            </div>

            {/* Toggles */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between group cursor-pointer" onClick={() => setSectionForm({ ...sectionForm, isCollapsible: !sectionForm.isCollapsible })}>
                <div className="flex flex-col gap-0.5">
                  <Label className="text-sm font-semibold text-slate-700 cursor-pointer">Sección Colapsable</Label>
                  <p className="text-xs text-slate-500">Permite al usuario expandir y contraer este bloque.</p>
                </div>
                <Switch
                  checked={sectionForm.isCollapsible ?? false}
                  onCheckedChange={(v) => setSectionForm({ ...sectionForm, isCollapsible: v })}
                />
              </div>

              <Separator className="bg-slate-200/50" />

              <div className="flex items-center justify-between group cursor-pointer" onClick={() => setSectionForm({ ...sectionForm, isActive: !sectionForm.isActive })}>
                <div className="flex flex-col gap-0.5">
                  <Label className="text-sm font-semibold text-slate-700 cursor-pointer">Sección Activa</Label>
                  <p className="text-xs text-slate-500">Si se desactiva, esta sección no aparecerá en la ficha.</p>
                </div>
                <Switch
                  checked={sectionForm.isActive ?? true}
                  onCheckedChange={(v) => setSectionForm({ ...sectionForm, isActive: v })}
                />
              </div>
            </div>

          </div>

          <DialogFooter className="mt-2 border-t border-slate-100 pt-4">
            <Button variant="ghost" onClick={() => setShowSectionDialog(false)} className="text-slate-500 hover:text-slate-700 hover:bg-slate-100">
              Cancelar
            </Button>
            <Button onClick={saveSection} className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 px-6">
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewFormDialog} onOpenChange={setShowNewFormDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nueva Ficha Clínica</DialogTitle>
            <DialogDescription>
              Crea un nuevo tipo de ficha personalizada.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="form-name">Nombre de la Ficha</Label>
              <Input
                id="form-name"
                placeholder="Ej: Antropometría Nutricional"
                value={newFormForm.name}
                onChange={(e) => setNewFormForm({ ...newFormForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-category">Categoría (Servicio)</Label>
              <Select
                value={newFormForm.category}
                onValueChange={(val) => setNewFormForm({ ...newFormForm, category: val })}
              >
                <SelectTrigger id="form-category">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {FORM_CATEGORIES.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFormDialog(false)}>Cancelar</Button>
            <Button onClick={createNewForm} disabled={!newFormForm.name}>Crear Ficha</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditFormDialog} onOpenChange={setShowEditFormDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Ficha</DialogTitle>
            <DialogDescription>
              Modifica los metadatos de la ficha clínica.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-form-name">Nombre de la Ficha</Label>
              <Input
                id="edit-form-name"
                value={editFormForm.name}
                onChange={(e) => setEditFormForm({ ...editFormForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-form-category">Categoría (Servicio)</Label>
              <Select
                value={editFormForm.category}
                onValueChange={(val) => setEditFormForm({ ...editFormForm, category: val })}
              >
                <SelectTrigger id="edit-form-category">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {FORM_CATEGORIES.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditFormDialog(false)}>Cancelar</Button>
            <Button onClick={saveFormMetadata} disabled={!editFormForm.name}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar la ficha clínica <strong>"{selectedConfig?.name}"</strong>?<br /><br />
              Esta acción eliminará la configuración de campos y no se podrá deshacer. Los datos ya cargados en pacientes no se verán afectados, pero ya no podrás usar esta ficha para nuevas entradas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}
