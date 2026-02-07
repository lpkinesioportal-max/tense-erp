"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { X, EyeOff, Zap, Edit3, Search, RotateCcw, Copy, Info } from "lucide-react"
import type { BodyZone } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"

interface BodyMapProps {
  zones: BodyZone[]
  onZonesChange: (zones: BodyZone[]) => void
  readOnly?: boolean
  isPatient?: boolean
}

const FRONT_ZONES = {
  "head-front": { label: "Cabeza", cx: 100, cy: 50 },
  "neck-front": { label: "Cuello", cx: 100, cy: 90 },
  "left-shoulder": { label: "Hombro Izq.", cx: 142, cy: 120 },
  "right-shoulder": { label: "Hombro Der.", cx: 58, cy: 120 },
  "left-pec": { label: "Pectoral Izq.", cx: 122, cy: 160 },
  "right-pec": { label: "Pectoral Der.", cx: 78, cy: 160 },
  "left-bicep": { label: "Bícep Izq.", cx: 162, cy: 190 },
  "right-bicep": { label: "Bícep Der.", cx: 38, cy: 190 },
  "abs-upper": { label: "Abdomen Sup.", cx: 100, cy: 220 },
  "abs-lower": { label: "Abdomen Inf.", cx: 100, cy: 275 },
  "left-forearm": { label: "Antebrazo Izq.", cx: 172, cy: 265 },
  "right-forearm": { label: "Antebrazo Der.", cx: 28, cy: 265 },
  "left-hip": { label: "Cadera Izq.", cx: 122, cy: 305 },
  "right-hip": { label: "Cadera Der.", cx: 78, cy: 305 },
  "left-hand": { label: "Mano Izq.", cx: 188, cy: 335 },
  "right-hand": { label: "Mano Der.", cx: 12, cy: 335 },
  "left-quad": { label: "Cuádricep Izq.", cx: 122, cy: 375 },
  "right-quad": { label: "Cuádricep Der.", cx: 78, cy: 375 },
  "left-knee": { label: "Rodilla Izq.", cx: 122, cy: 445 },
  "right-knee": { label: "Rodilla Der.", cx: 78, cy: 445 },
  "left-shin": { label: "Tibia Izq.", cx: 120, cy: 510 },
  "right-shin": { label: "Tibia Der.", cx: 80, cy: 510 },
  "left-foot": { label: "Pie Izq.", cx: 115, cy: 575 },
  "right-foot": { label: "Pie Der.", cx: 85, cy: 575 },
}

const BACK_ZONES = {
  "head-back": { label: "Cabeza (Post.)", cx: 100, cy: 50 },
  "neck-back": { label: "Cuello (Post.)", cx: 100, cy: 90 },
  "left-trap": { label: "Trapecio Izq.", cx: 82, cy: 125 },
  "right-trap": { label: "Trapecio Der.", cx: 118, cy: 125 },
  "left-delt": { label: "Deltoides Izq.", cx: 55, cy: 135 },
  "right-delt": { label: "Deltoides Der.", cx: 145, cy: 135 },
  "upper-back-left": { label: "Dorsal Izq.", cx: 82, cy: 175 },
  "upper-back-right": { label: "Dorsal Der.", cx: 118, cy: 175 },
  "left-tricep": { label: "Trícep Izq.", cx: 48, cy: 200 },
  "right-tricep": { label: "Trícep Der.", cx: 152, cy: 200 },
  "mid-back": { label: "Espalda Media", cx: 100, cy: 220 },
  "left-lower-back": { label: "Lumbar Izq.", cx: 88, cy: 280 },
  "right-lower-back": { label: "Lumbar Der.", cx: 112, cy: 280 },
  "left-forearm-back": { label: "Antebrazo Izq.", cx: 32, cy: 285 },
  "right-forearm-back": { label: "Antebrazo Der.", cx: 168, cy: 285 },
  "left-glute": { label: "Glúteo Izq.", cx: 85, cy: 335 },
  "right-glute": { label: "Glúteo Der.", cx: 115, cy: 335 },
  "left-hamstring": { label: "Isquiotibial Izq.", cx: 88, cy: 430 },
  "right-hamstring": { label: "Isquiotibial Der.", cx: 112, cy: 430 },
  "left-calf": { label: "Gemelo Izq.", cx: 88, cy: 520 },
  "right-calf": { label: "Gemelo Der.", cx: 112, cy: 520 },
  "left-heel": { label: "Talón Izq.", cx: 88, cy: 575 },
  "right-heel": { label: "Talón Der.", cx: 112, cy: 575 },
}













export function BodyMap({ zones = [], onZonesChange, readOnly = false, isPatient = false }: BodyMapProps) {
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [selection, setSelection] = useState<string[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [hoveredZone, setHoveredZone] = useState<string | null>(null)
  const [quickSelectMode, setQuickSelectMode] = useState(true)
  const [mirrorMode, setMirrorMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [formData, setFormData] = useState({
    treatment: "",
    intensity: "",
    notes: "",
    visibleToPatient: true,
  })

  const allZones = { ...FRONT_ZONES, ...BACK_ZONES }
  const getZoneData = (zoneId: string) => zones?.find((z) => z.zone === zoneId)

  const handleQuickToggle = (zoneId: string) => {
    if (!onZonesChange) return
    const zoneIdsToToggle = [zoneId]
    if (mirrorMode) {
      const mirrorId = getMirrorZoneId(zoneId)
      if (mirrorId && mirrorId !== zoneId) zoneIdsToToggle.push(mirrorId)
    }

    let updatedZones = [...zones]
    zoneIdsToToggle.forEach((id) => {
      const existingZone = updatedZones.find((z) => z.zone === id)
      if (existingZone) {
        updatedZones = updatedZones.filter((z) => z.zone !== id)
      } else {
        const zoneInfo = allZones[id as keyof typeof allZones]
        updatedZones.push({
          id: `bz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          zone: id,
          label: zoneInfo?.label || id,
          treatment: "Zona trabajada",
          notes: "",
          visibleToPatient: true,
        })
      }
    })
    onZonesChange(updatedZones)
  }

  const getMirrorZoneId = (zoneId: string) => {
    if (zoneId.includes("left")) return zoneId.replace("left", "right")
    if (zoneId.includes("right")) return zoneId.replace("right", "left")
    return null
  }

  const handleZoneClick = (zoneId: string) => {
    if (readOnly) return

    const isSelected = selection.includes(zoneId)
    const existingZone = getZoneData(zoneId)

    // If clicking an already selected zone, open the form to save the batch
    if (isSelected) {
      setSelectedZone(zoneId)
      setFormData({
        treatment: existingZone?.treatment ?? "",
        intensity: existingZone?.intensity ?? "",
        notes: existingZone?.notes ?? "",
        visibleToPatient: existingZone?.visibleToPatient ?? true,
      })
      setShowDialog(true)
      return
    }

    // Toggle selection
    let newSelection = [...selection]
    const toggle = (id: string) => {
      if (newSelection.includes(id)) {
        newSelection = newSelection.filter(sid => sid !== id)
      } else {
        newSelection.push(id)
      }
    }

    toggle(zoneId)
    if (mirrorMode) {
      const mirrorId = getMirrorZoneId(zoneId)
      if (mirrorId && mirrorId !== zoneId) toggle(mirrorId)
    }
    setSelection(newSelection)

    // If not in quick mode and just selected one, open the form automatically
    if (!quickSelectMode && newSelection.includes(zoneId)) {
      setSelectedZone(zoneId)
      setFormData({
        treatment: existingZone?.treatment ?? "",
        intensity: existingZone?.intensity ?? "",
        notes: existingZone?.notes ?? "",
        visibleToPatient: existingZone?.visibleToPatient ?? true,
      })
      setShowDialog(true)
    }
  }

  const handleEditZone = (zoneId: string) => {
    const existingZone = getZoneData(zoneId)
    setSelectedZone(zoneId)
    setFormData({
      treatment: existingZone?.treatment ?? "",
      intensity: existingZone?.intensity ?? "",
      notes: existingZone?.notes ?? "",
      visibleToPatient: existingZone?.visibleToPatient ?? true,
    })
    setShowDialog(true)
  }

  const handleSaveZone = () => {
    if (!formData.treatment) return

    // We apply the same form data to ALL zones in the current selection
    const updatedZones = [...zones]

    selection.forEach(zoneId => {
      const zoneInfo = allZones[zoneId as keyof typeof allZones]
      const existingIndex = updatedZones.findIndex((z) => z.zone === zoneId)
      const existingZone = updatedZones[existingIndex]

      const newZone: BodyZone = {
        id: existingZone?.id || `bz_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        zone: zoneId,
        label: zoneInfo?.label || zoneId,
        treatment: formData.treatment,
        intensity: formData.intensity,
        notes: formData.notes,
        visibleToPatient: formData.visibleToPatient,
      }

      if (existingIndex >= 0) {
        updatedZones[existingIndex] = { ...updatedZones[existingIndex], ...newZone }
      } else {
        updatedZones.push(newZone)
      }
    })

    onZonesChange(updatedZones)
    setShowDialog(false)
    setSelectedZone(null)
    setSelection([]) // Clear selection after saving
  }

  const handleRemoveZone = (zoneId: string) => {
    onZonesChange(zones.filter((z) => z.zone !== zoneId))
  }

  const visibleZones = isPatient ? (zones || []).filter((z) => z.visibleToPatient) : (zones || [])
  const handleClearAll = () => onZonesChange([])

  const PointOverlay = ({ zonesMap, side }: { zonesMap: Record<string, { label: string, cx: number, cy: number }>, side: 'front' | 'back' }) => (
    <svg viewBox="0 0 200 600" className="absolute inset-0 w-full h-full z-20 pointer-events-none">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {Object.entries(zonesMap).map(([id, zone]) => {
        const zoneData = getZoneData(id)
        const isMarked = zoneData && (!isPatient || zoneData.visibleToPatient)
        const isSelected = selection.includes(id)
        const isHovered = hoveredZone === id
        const isFaded = searchQuery && !zone.label.toLowerCase().includes(searchQuery.toLowerCase())

        return (
          <g key={id} opacity={isFaded || (selectedZone && selectedZone !== id) ? 0.3 : 1} className="pointer-events-auto">
            <circle
              cx={zone.cx}
              cy={zone.cy}
              r={12}
              fill="white"
              fillOpacity={0.01}
              className="cursor-pointer"
              onClick={() => handleZoneClick(id)}
              onMouseEnter={() => setHoveredZone(id)}
              onMouseLeave={() => setHoveredZone(null)}
            />
            <circle
              cx={zone.cx}
              cy={zone.cy}
              r={9}
              fill="white"
              fillOpacity={isMarked || isSelected ? 0.4 : isHovered ? 0.6 : 0.15}
              stroke="white"
              strokeWidth="1.5"
              className={cn(
                "transition-all duration-300 pointer-events-none",
                !readOnly && (isSelected ? "r-11" : "hover:r-11")
              )}
            />
            {(isMarked || isSelected) && (
              <g className="pointer-events-none">
                <circle cx={zone.cx} cy={zone.cy} r={6} fill={isSelected ? "#10b981" : "#3b82f6"} filter="url(#glow)" />
                <circle cx={zone.cx} cy={zone.cy} r={2.5} fill="white" />
              </g>
            )}
            {selectedZone === id && (
              <circle cx={zone.cx} cy={zone.cy} r={14} fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 2" className="animate-spin-slow" />
            )}
            {isHovered && !selectedZone && (
              <g className="pointer-events-none">
                <rect x={zone.cx - 45} y={zone.cy - 30} width="90" height="16" rx="4" fill="#1e293b" />
                <text x={zone.cx} y={zone.cy - 19} textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">{zone.label}</text>
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )


  const renderForm = () => (
    <div className="flex flex-col max-h-[450px]">
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
        <div>
          <h4 className="text-sm font-black uppercase tracking-widest leading-none">
            {selection.length > 1 ? `${selection.length} Zonas Seleccionadas` : (selectedZone && allZones[selectedZone as keyof typeof allZones]?.label)}
          </h4>
          <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Completar datos de zona</p>
        </div>
        {!readOnly && (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => {
            setShowDialog(false)
            setSelectedZone(null)
          }}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tight">Tratamiento / Trabajo *</Label>
            <Input
              value={formData.treatment}
              onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
              placeholder="Ej: Masaje, punción..."
              className="h-9 text-xs rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tight">Intensidad / Duración</Label>
            <Input
              value={formData.intensity}
              onChange={(e) => setFormData({ ...formData, intensity: e.target.value })}
              placeholder="Ej: 15 min, media..."
              className="h-9 text-xs rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tight">Observaciones</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas adicionales..."
              className="min-h-[60px] text-xs rounded-xl bg-slate-50 border-slate-200 focus:bg-white resize-none"
            />
          </div>
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <Label htmlFor="visible-patient-pop" className="text-[11px] font-bold text-slate-600">Visible</Label>
            <Switch
              checked={formData.visibleToPatient}
              onCheckedChange={(checked) => setFormData({ ...formData, visibleToPatient: checked })}
              id="visible-patient-pop"
              className="scale-75"
            />
          </div>
        </div>
      </ScrollArea>
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => handleRemoveZone(selectedZone!)} className="h-9 px-3 rounded-xl text-[11px] font-bold text-rose-500 hover:bg-rose-50">
          Borrar
        </Button>
        <Button onClick={handleSaveZone} disabled={!formData.treatment} className="h-9 flex-1 rounded-xl text-[11px] font-black uppercase bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/10">
          Guardar Zona
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {!readOnly && !isPatient && (
        <Card className="p-4 bg-slate-50/50 border-slate-200 shadow-sm rounded-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <TooltipProvider>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <Label htmlFor="quick-mode" className="text-xs font-semibold">Modo Rápido</Label>
                  <Switch id="quick-mode" checked={quickSelectMode} onCheckedChange={setQuickSelectMode} />
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200">
                  <Copy className="h-4 w-4 text-sky-500" />
                  <Label htmlFor="mirror-mode" className="text-xs font-semibold">Modo Espejo</Label>
                  <Switch id="mirror-mode" checked={mirrorMode} onCheckedChange={setMirrorMode} />
                </div>
              </TooltipProvider>

              <Button variant="outline" size="sm" onClick={handleClearAll} className="text-xs font-semibold h-9 rounded-lg border-slate-200">
                <RotateCcw className="h-3.5 w-3.5 mr-2" />
                Limpiar Todo
              </Button>
            </div>

            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar región (ej: dorsal, rodilla...)"
                className="pl-10 h-10 text-sm bg-white border-slate-200 rounded-lg shadow-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500 bg-blue-50/50 p-2 rounded-lg border border-blue-100">
            <Info className="h-3.5 w-3.5 text-blue-500" />
            <span>Haz clic en las zonas del mapa para marcar dolor o tratamiento. El modo rápido permite marcar/quitar con un solo clic.</span>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 w-full max-w-5xl mx-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-px w-8 bg-slate-200"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Vista Frontal</span>
            <div className="h-px w-8 bg-slate-200"></div>
          </div>

          <div className="relative aspect-[200/600] rounded-[2rem] bg-white border border-slate-100 shadow-xl overflow-hidden group h-[720px] mx-auto">
            <img src="/images/body-front.png" alt="Anatomía Frontal" className="absolute inset-0 w-full h-full object-fill opacity-100 transition-opacity duration-500" />
            <PointOverlay zonesMap={FRONT_ZONES} side="front" />
            <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent pointer-events-none"></div>

            <Popover open={showDialog && !!selectedZone && Object.keys(FRONT_ZONES).includes(selectedZone)} onOpenChange={(open) => {
              if (!open) {
                setShowDialog(false)
                setSelectedZone(null)
              }
            }}>
              <PopoverTrigger asChild>
                <div style={{
                  position: 'absolute',
                  left: selectedZone && FRONT_ZONES[selectedZone as keyof typeof FRONT_ZONES] ? `${(FRONT_ZONES[selectedZone as keyof typeof FRONT_ZONES].cx / 200) * 100}%` : '50%',
                  top: selectedZone && FRONT_ZONES[selectedZone as keyof typeof FRONT_ZONES] ? `${(FRONT_ZONES[selectedZone as keyof typeof FRONT_ZONES].cy / 600) * 100}%` : '50%',
                  width: 1,
                  height: 1
                }} />
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 rounded-2xl shadow-2xl border-slate-200 overflow-hidden z-[100]" side="right" align="start" sideOffset={20}>
                {renderForm()}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-px w-8 bg-slate-200"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Vista Posterior</span>
            <div className="h-px w-8 bg-slate-200"></div>
          </div>

          <div className="relative aspect-[200/600] rounded-[2rem] bg-white border border-slate-100 shadow-xl overflow-hidden group h-[600px] mx-auto">
            <img src="/images/body-back.png" alt="Anatomía Posterior" className="absolute inset-0 w-full h-full object-fill opacity-100 transition-opacity duration-500" />
            <PointOverlay zonesMap={BACK_ZONES} side="back" />
            <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent pointer-events-none"></div>

            <Popover open={showDialog && !!selectedZone && Object.keys(BACK_ZONES).includes(selectedZone)} onOpenChange={(open) => {
              if (!open) {
                setShowDialog(false)
                setSelectedZone(null)
              }
            }}>
              <PopoverTrigger asChild>
                <div style={{
                  position: 'absolute',
                  left: selectedZone && BACK_ZONES[selectedZone as keyof typeof BACK_ZONES] ? `${(BACK_ZONES[selectedZone as keyof typeof BACK_ZONES].cx / 200) * 100}%` : '50%',
                  top: selectedZone && BACK_ZONES[selectedZone as keyof typeof BACK_ZONES] ? `${(BACK_ZONES[selectedZone as keyof typeof BACK_ZONES].cy / 600) * 100}%` : '50%',
                  width: 1,
                  height: 1
                }} />
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 rounded-2xl shadow-2xl border-slate-200 overflow-hidden z-[100]" side="left" align="start" sideOffset={20}>
                {renderForm()}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Registro de la Sesión (Grouped Notes) */}
      {visibleZones.length > 0 && (
        <div className="pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              Registro de la Sesión
            </h4>
            <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold text-[10px]">
              {visibleZones.length} {visibleZones.length === 1 ? 'PUNTO MARCADO' : 'PUNTOS MARCADOS'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {(() => {
              // Group zones by their content to show them as a single "note"
              const groups: Record<string, { zones: BodyZone[], treatment: string, intensity: string, notes: string, visibleToPatient: boolean }> = {}

              visibleZones.forEach(z => {
                const treatment = z.treatment || ''
                const intensity = z.intensity || ''
                const notes = z.notes || ''
                const visible = z.visibleToPatient ?? true

                const key = `${treatment}|${intensity}|${notes}|${visible}`
                if (!groups[key]) {
                  groups[key] = { zones: [], treatment, intensity, notes, visibleToPatient: visible }
                }
                groups[key].zones.push(z)
              })

              return Object.entries(groups).map(([key, group], idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-blue-200 transition-all group/note relative">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {group.zones.map(z => (
                          <Badge
                            key={z.id}
                            variant="outline"
                            className={cn(
                              "text-[10px] font-bold py-0.5 px-2 rounded-lg border-slate-200 bg-slate-50/50 text-slate-600",
                              !z.visibleToPatient && "border-amber-200 bg-amber-50 text-amber-700"
                            )}
                          >
                            {!z.visibleToPatient && <EyeOff className="h-2.5 w-2.5 mr-1" />}
                            {z.label}
                          </Badge>
                        ))}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{group.treatment}</p>
                          {group.intensity && (
                            <Badge variant="secondary" className="h-5 text-[9px] font-black uppercase bg-amber-100 text-amber-700 border-none">
                              {group.intensity}
                            </Badge>
                          )}
                        </div>
                        {group.notes && (
                          <p className="text-xs text-slate-500 italic leading-relaxed">"{group.notes}"</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover/note:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => handleEditZone(group.zones[0].zone)}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        onClick={() => {
                          // Remove all zones in this group
                          const idsToRemove = group.zones.map(z => z.zone)
                          onZonesChange(zones.filter(z => !idsToRemove.includes(z.zone)))
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            })()}
          </div>
        </div>
      )}

      {/* Removed separate Dialog as we now use contextual popovers for better usability */}
    </div>
  )
}
