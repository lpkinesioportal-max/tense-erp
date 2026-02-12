"use client"

import { useState } from "react"
import { useData } from "@/lib/data-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Copy, ArrowLeft, Check } from "lucide-react"
import { getWeekDays } from "@/lib/utils"

interface ShareAvailabilityDialogProps {
    isOpen: boolean
    onClose: () => void
    initialProfessionalIds?: string[]
}

export function ShareAvailabilityDialog({ isOpen, onClose, initialProfessionalIds }: ShareAvailabilityDialogProps) {
    const { professionals, appointments, serviceConfigs } = useData()
    const [selectedProfIds, setSelectedProfIds] = useState<string[]>(initialProfessionalIds || [])
    const [weeksCount, setWeeksCount] = useState("1")
    const [selectedServiceId, setSelectedServiceId] = useState<string>("default")
    const [generatedText, setGeneratedText] = useState<string | null>(null)
    const [isCopied, setIsCopied] = useState(false)
    const { toast } = useToast()

    const timeToMinutes = (time: string) => {
        if (!time) return 0
        const [h, m] = time.split(":").map(Number)
        return h * 60 + m
    }

    const minutesToTime = (m: number) => {
        const h = Math.floor(m / 60)
        const min = m % 60
        return `${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`
    }

    const getFreeSlotsForDay = (date: Date, prof: any, service: any) => {
        const dayOfWeek = date.getDay()
        const daySchedule = prof.availability?.schedule?.find((d: any) => d.dayOfWeek === dayOfWeek)

        if (!daySchedule || !daySchedule.isActive || !daySchedule.slots || daySchedule.slots.length === 0) return []

        const duration = service?.appointmentDuration || prof.standardDuration || 60
        const dateStr = date.toDateString()
        const dayAppointments = (appointments || []).filter(a =>
            (a.professionalIdCalendario === prof.id || a.professionalId === prof.id) &&
            new Date(a.date).toDateString() === dateStr &&
            a.status !== "cancelled" &&
            a.status !== "follow_up"
        )

        const freeSlots: string[] = []
        const now = new Date()

        daySchedule.slots.forEach((slot: any) => {
            const startMinutes = timeToMinutes(slot.start)
            const endMinutes = timeToMinutes(slot.end)

            for (let m = startMinutes; m + duration <= endMinutes; m += duration) {
                const slotDate = new Date(date)
                slotDate.setHours(Math.floor(m / 60), m % 60, 0, 0)
                if (slotDate < now) continue

                const isOccupied = dayAppointments.some(apt => {
                    const aptStart = timeToMinutes(apt.startTime)
                    const aptEnd = timeToMinutes(apt.endTime)
                    return m < aptEnd && (m + duration) > aptStart
                })

                if (!isOccupied) {
                    freeSlots.push(minutesToTime(m))
                }
            }
        })

        return freeSlots
    }

    const handleCopy = () => {
        if (!generatedText) return

        // Método infalible: Crear un elemento temporal, seleccionarlo y copiar
        const textArea = document.createElement("textarea")
        textArea.value = generatedText
        textArea.style.position = "fixed"
        textArea.style.left = "-9999px"
        textArea.style.top = "0"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        try {
            const successful = document.execCommand('copy')
            if (successful) {
                setIsCopied(true)
                toast({ title: "¡Copiado!", description: "Texto listo para pegar en WhatsApp." })
                setTimeout(() => setIsCopied(false), 3000)
            } else {
                throw new Error("Copy failed")
            }
        } catch (err) {
            // Intento con API moderna si falla el anterior
            if (navigator.clipboard) {
                navigator.clipboard.writeText(generatedText).then(() => {
                    setIsCopied(true)
                    toast({ title: "¡Copiado!", description: "Texto listo para pegar." })
                    setTimeout(() => setIsCopied(false), 3000)
                }).catch(() => {
                    toast({ title: "Atención", description: "Selecciona el texto y usa Copiar.", variant: "destructive" })
                })
            }
        } finally {
            document.body.removeChild(textArea)
        }
    }

    const generateAvailabilityText = () => {
        if (selectedProfIds.length === 0) {
            toast({ title: "Atención", description: "Seleccione al menos un profesional", variant: "destructive" })
            return
        }

        let text = "✨ *DISPONIBILIDAD DE TURNOS* ✨\n\n"
        const weeks = parseInt(weeksCount)
        const today = new Date()

        const currentDay = today.getDay()
        const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1)
        const weekStartBasis = new Date(today)
        weekStartBasis.setDate(diff)
        weekStartBasis.setHours(0, 0, 0, 0)

        const service = serviceConfigs.find(s => s.id === selectedServiceId)

        selectedProfIds.forEach((profId, profIndex) => {
            const prof = professionals.find(p => p.id === profId)
            if (!prof) return

            const serviceName = selectedServiceId === "default"
                ? (prof.specialty || "Sesión")
                : (service?.name || "Sesión")

            const duration = service?.appointmentDuration || prof.standardDuration || 60

            if (profIndex > 0) text += "\n"
            text += `👤 *PROFESIONAL:* ${prof.name.toUpperCase()}\n`
            text += `🏥 *SERVICIO:* ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}\n`
            text += `⏱️ *DURACIÓN:* ${duration} min\n\n`

            let foundAny = false

            for (let w = 0; w < weeks; w++) {
                const currentWeekStart = new Date(weekStartBasis)
                currentWeekStart.setDate(weekStartBasis.getDate() + (w * 7))
                const days = getWeekDays(currentWeekStart)

                days.forEach(day => {
                    const checkDate = new Date(day)
                    checkDate.setHours(0, 0, 0, 0)
                    const todayComp = new Date()
                    todayComp.setHours(0, 0, 0, 0)

                    if (checkDate < todayComp) return

                    const freeSlots = getFreeSlotsForDay(day, prof, service)
                    if (freeSlots.length > 0) {
                        foundAny = true
                        const dayName = day.toLocaleDateString("es-AR", { weekday: "long" })
                        const dayDate = day.toLocaleDateString("es-AR", { day: "numeric", month: "short" })
                        text += `📅 *${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayDate}:*\n`
                        // Using bullet points for extreme clarity
                        freeSlots.forEach(slot => {
                            text += `▫️ ${slot}\n`
                        })
                        text += `\n`
                    }
                })
            }

            if (!foundAny) text += "_(Sin disponibilidad próxima)_\n\n"
            text += "--------------------------------\n"
        })

        text += "\n📍 *TENSE - Kinesiología & Estética*\n"
        text += "Para reservar, por favor responde a este mensaje indicando el horario de tu preferencia. 😊"

        setGeneratedText(text)
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Compartir Disponibilidad</DialogTitle>
                    <DialogDescription>
                        {generatedText
                            ? "Copia el texto generado para enviarlo por WhatsApp."
                            : "Selecciona los parámetros para generar el reporte de turnos libres."}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {generatedText ? (
                        <div className="space-y-4">
                            <div className="relative">
                                <Textarea
                                    value={generatedText}
                                    readOnly
                                    className="h-[300px] font-mono text-[11px] leading-relaxed bg-muted/50 p-4 resize-none border-2 focus-visible:ring-emerald-500"
                                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground text-center">
                                Si el botón no funciona, mantén presionado el texto para seleccionarlo y copiar.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            <div className="space-y-3">
                                <Label className="text-sm font-bold text-foreground/80">Profesionales Incluidos</Label>
                                <div className="grid grid-cols-2 gap-2 border rounded-xl p-4 bg-muted/20">
                                    {professionals.map(prof => (
                                        <div key={prof.id} className="flex items-center space-x-2 bg-background/50 p-2 rounded-lg border border-transparent hover:border-border transition-all">
                                            <Checkbox
                                                id={`share-prof-${prof.id}`}
                                                checked={selectedProfIds.includes(prof.id)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setSelectedProfIds([...selectedProfIds, prof.id])
                                                    else setSelectedProfIds(selectedProfIds.filter(id => id !== prof.id))
                                                }}
                                            />
                                            <Label htmlFor={`share-prof-${prof.id}`} className="text-xs font-medium cursor-pointer truncate">{prof.name}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="weeks-count" className="text-xs font-bold text-foreground/70">Rango de Tiempo</Label>
                                    <Select value={weeksCount} onValueChange={setWeeksCount}>
                                        <SelectTrigger id="weeks-count" className="h-10 rounded-xl">
                                            <SelectValue placeholder="Semanas" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Esta semana</SelectItem>
                                            <SelectItem value="2">Próximas 2 semanas</SelectItem>
                                            <SelectItem value="3">Próximas 3 semanas</SelectItem>
                                            <SelectItem value="4">Próximas 4 semanas</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="service-select" className="text-xs font-bold text-foreground/70">Servicio y Duración</Label>
                                    <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                                        <SelectTrigger id="service-select" className="h-10 rounded-xl">
                                            <SelectValue placeholder="Servicio" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="default">Estándar (60 m)</SelectItem>
                                            {serviceConfigs.map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.name} ({s.appointmentDuration}m)</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex flex-row items-center justify-between border-t pt-4 gap-3">
                    {generatedText ? (
                        <>
                            <Button variant="ghost" onClick={() => setGeneratedText(null)} className="h-12 rounded-xl gap-2 text-muted-foreground px-6">
                                <ArrowLeft className="h-4 w-4" />
                                Volver
                            </Button>
                            <Button
                                onClick={handleCopy}
                                className={`h-12 rounded-xl gap-3 flex-1 text-white shadow-lg transition-all duration-300 ${isCopied ? 'bg-emerald-500 scale-105' : 'bg-primary hover:bg-primary/90 shadow-primary/20'}`}
                            >
                                {isCopied ? (
                                    <>
                                        <Check className="h-5 w-5" />
                                        ¡COPIADO!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-5 w-5" />
                                        COPIAR TODO
                                    </>
                                )}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={onClose} className="h-11 rounded-xl text-muted-foreground">Cancelar</Button>
                            <Button onClick={generateAvailabilityText} className="h-11 rounded-xl gap-2 bg-primary hover:bg-primary/90 px-8 text-primary-foreground shadow-lg shadow-primary/20">
                                <Copy className="h-4 w-4" />
                                Generar Texto
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
