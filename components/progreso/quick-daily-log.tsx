"use client"

import { useState, useEffect } from "react"
import {
    Droplets,
    Plus,
    Minus,
    Moon,
    Zap,
    Smile,
    Activity,
    Scale,
    MessageSquare,
    CheckCircle2,
    AlertCircle,
    Clock,
    ChevronDown,
    ChevronUp,
    Info,
    Camera,
    X
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useData } from "@/lib/data-context"
import { toast } from "sonner"
import { format, isToday, isYesterday } from "date-fns"
import { es } from "date-fns/locale"

interface QuickDailyLogProps {
    clientId: string
    onSuccess?: () => void
}

export function QuickDailyLog({ clientId, onSuccess }: QuickDailyLogProps) {
    const { getMedicalRecord, addPatientLog } = useData()
    const record = getMedicalRecord(clientId)

    // Checking if today is already logged
    const todayLog = record?.patientLogs?.find(log => isToday(new Date(log.date)))
    const [isLogged, setIsLogged] = useState(!!todayLog)
    const [isExpanded, setIsExpanded] = useState(false)

    // Local state for quick inputs
    const [hydration, setHydration] = useState(0) // Litros
    const [pain, setPain] = useState(0)
    const [painLocation, setPainLocation] = useState("")
    const [showPainLocation, setShowPainLocation] = useState(false)

    const [sleepHours, setSleepHours] = useState(8)
    const [sleepQuality, setSleepQuality] = useState(3)
    const [awakenings, setAwakenings] = useState(false)

    const [stress, setStress] = useState(3)
    const [mood, setMood] = useState("neutro")
    const [showMoodNotes, setShowMoodNotes] = useState(false)
    const [moodNotes, setMoodNotes] = useState("")

    const [activityDone, setActivityDone] = useState<boolean | null>(null)
    const [activityIntensity, setActivityIntensity] = useState("media")

    const [weight, setWeight] = useState<string>("")
    const [note, setNote] = useState("")
    const [photos, setPhotos] = useState<string[]>([])

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files) {
            Array.from(files).forEach(file => {
                const reader = new FileReader()
                reader.onloadend = () => {
                    setPhotos(prev => [...prev, reader.result as string])
                }
                reader.readAsDataURL(file)
            })
        }
    }

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index))
    }

    useEffect(() => {
        if (todayLog) {
            setIsLogged(true)
        } else {
            setIsLogged(false)
        }

        // Pre-fill weight from the most recent record that has it
        if (record?.patientLogs && record.patientLogs.length > 0) {
            const lastWeightLog = [...record.patientLogs]
                .reverse()
                .find(log => log.measurements?.weight !== undefined)

            if (lastWeightLog?.measurements?.weight) {
                setWeight(lastWeightLog.measurements.weight.toString())
            }
        }
    }, [todayLog, record])

    const handleSave = () => {
        const goalReached = hydration >= 2

        addPatientLog(clientId, {
            clientId,
            date: new Date(),
            hydration: { amount: hydration, unit: "litros", goalReached },
            pain: { eva: pain, location: painLocation },
            sleep: { hours: sleepHours, quality: sleepQuality as any, awakenings },
            stress: { level: stress * 2 }, // Map 1-5 to 0-10
            mood: { value: mood as any, notes: moodNotes },
            activity: {
                steps: 0,
                type: activityDone ? "entrenamiento" : "reposo",
                duration: activityDone ? 30 : 0
            },
            nutrition: { description: "", respectedCompliance: true },
            measurements: { weight: weight ? parseFloat(weight) : undefined },
            photos: photos.map(p => ({ url: p, category: "frontal" as const, date: new Date() })),
            notesForSession: note,
        })

        toast.success("¡Buen día registrado! 💪")
        setIsLogged(true)
        onSuccess?.()
    }

    const getDayStatus = () => {
        if (isLogged) return { color: "bg-emerald-500", label: "Día completo", text: "¡Excelente! Vas muy bien hoy." }

        const partialFields = [
            hydration > 0,
            pain > 0,
            activityDone !== null,
            note !== ""
        ].filter(Boolean).length

        if (partialFields > 0) return { color: "bg-amber-500", label: "Parcial", text: "Te falta completar algunos datos." }

        return { color: "bg-slate-300", label: "Sin registros", text: "Aún no has cargado tus datos de hoy." }
    }

    const status = getDayStatus()

    if (isLogged) {
        return (
            <Card className="border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
                <div className="bg-emerald-600 p-4 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="font-bold">¡Registro de hoy completado!</p>
                            <p className="text-xs text-emerald-100">Tus datos ya están en tu evolución.</p>
                        </div>
                    </div>
                    <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => setIsLogged(false)}>
                        Editar
                    </Button>
                </div>
            </Card>
        )
    }

    return (
        <Card className="border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden sticky top-20 z-30 mb-6">
            <CardHeader className="bg-slate-900 text-white pb-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-sky-400" />
                        <CardTitle className="text-lg">Hoy – Tu registro diario</CardTitle>
                    </div>
                    <Badge className={`${status.color} border-none text-white`}>
                        {status.label}
                    </Badge>
                </div>
                <p className="text-xs text-slate-400 mt-1">{status.text}</p>
            </CardHeader>

            <CardContent className="p-0">
                <div className="divide-y divide-slate-100">

                    {/* Hidratación */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                                <Droplets className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="font-bold text-sm">Hidratación</p>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Meta: 2.0 Litros</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full bg-white shadow-sm"
                                onClick={() => setHydration(prev => Math.max(0, prev - 0.25))}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <div className="text-center min-w-[60px]">
                                <span className="text-lg font-black text-slate-900">{hydration.toFixed(2)}</span>
                                <span className="text-[10px] font-bold text-slate-400 ml-1">L</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full bg-sky-600 text-white hover:bg-sky-700 shadow-sm"
                                onClick={() => setHydration(prev => prev + 0.25)}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Dolor (EVA) */}
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                    <Activity className="h-6 w-6" />
                                </div>
                                <p className="font-bold text-sm">Nivel de Dolor (EVA)</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full font-black text-sm ${pain <= 3 ? 'bg-emerald-100 text-emerald-700' : pain <= 6 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                {pain}/10
                            </div>
                        </div>

                        <Slider
                            value={[pain]}
                            onValueChange={([v]) => setPain(v)}
                            max={10}
                            step={1}
                            className="py-2"
                        />
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase px-1">
                            <span>0 - Sin dolor</span>
                            <span>10 - Dolor máximo</span>
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-[10px] font-bold text-slate-500 uppercase p-0 mt-2 h-auto"
                            onClick={() => setShowPainLocation(!showPainLocation)}
                        >
                            {showPainLocation ? '- Ocultar' : '+ ¿Dónde te duele?'}
                        </Button>

                        {showPainLocation && (
                            <Input
                                placeholder="Ej: Espalda baja, hombro..."
                                className="mt-2 text-xs"
                                value={painLocation}
                                onChange={(e) => setPainLocation(e.target.value)}
                            />
                        )}
                    </div>

                    {/* Sueño */}
                    <div className="p-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <Moon className="h-6 w-6" />
                            </div>
                            <p className="font-bold text-sm">Descanso Nocturno</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Horas dormidas</p>
                                <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border">
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSleepHours(prev => Math.max(0, prev - 1))}><Minus className="h-3 w-3" /></Button>
                                    <span className="flex-1 text-center font-bold">{sleepHours}h</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSleepHours(prev => Math.min(24, prev + 1))}><Plus className="h-3 w-3" /></Button>
                                </div>
                            </div>
                            <div className="space-y-2 text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Calidad</p>
                                <div className="flex justify-between">
                                    {[1, 2, 3, 4, 5].map(v => (
                                        <button
                                            key={v}
                                            onClick={() => setSleepQuality(v)}
                                            className={`text-xl grayscale hover:grayscale-0 transition-all ${sleepQuality === v ? 'grayscale-0 scale-125' : 'opacity-40'}`}
                                        >
                                            {v === 1 && "😴"}
                                            {v === 2 && "😐"}
                                            {v === 3 && "😊"}
                                            {v === 4 && "😄"}
                                            {v === 5 && "🤩"}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 mt-4 bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
                            <Checkbox
                                id="awakenings"
                                checked={awakenings}
                                onCheckedChange={(v) => setAwakenings(!!v)}
                                className="border-indigo-300"
                            />
                            <label htmlFor="awakenings" className="text-xs font-medium text-indigo-900 cursor-pointer">
                                Tuve despertares durante la noche
                            </label>
                        </div>
                    </div>

                    <div className={`${isExpanded ? '' : 'hidden'} sm:block`}>
                        {/* Estrés y Ánimo */}
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                                        <Zap className="h-5 w-5" />
                                    </div>
                                    <p className="font-bold text-sm">Estrés</p>
                                </div>
                                <div className="flex justify-between bg-slate-50 p-2 rounded-xl border">
                                    {[1, 2, 3, 4, 5].map(v => (
                                        <button
                                            key={v}
                                            onClick={() => setStress(v)}
                                            className={`text-xl transition-all ${stress === v ? 'scale-125' : 'opacity-30'}`}
                                        >
                                            {v === 1 && "🧘"}
                                            {v === 2 && "🙂"}
                                            {v === 3 && "😐"}
                                            {v === 4 && "😰"}
                                            {v === 5 && "🌋"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                        <Smile className="h-5 w-5" />
                                    </div>
                                    <p className="font-bold text-sm">Ánimo</p>
                                </div>
                                <div className="flex justify-between bg-slate-50 p-2 rounded-xl border">
                                    {['muy_bajo', 'bajo', 'neutro', 'bueno', 'muy_bueno'].map(v => (
                                        <button
                                            key={v}
                                            onClick={() => setMood(v)}
                                            className={`text-xl transition-all ${mood === v ? 'scale-125' : 'opacity-30'}`}
                                        >
                                            {v === 'muy_bajo' && "😞"}
                                            {v === 'bajo' && "😐"}
                                            {v === 'neutro' && "🙂"}
                                            {v === 'bueno' && "😄"}
                                            {v === 'muy_bueno' && "🤩"}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Actividad */}
                        <div className="p-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <Activity className="h-6 w-6" />
                                </div>
                                <p className="font-bold text-sm">Rutina / Actividad</p>
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    variant={activityDone === true ? "default" : "outline"}
                                    className={`flex-1 rounded-xl h-12 gap-2 ${activityDone === true ? 'bg-emerald-600' : ''}`}
                                    onClick={() => setActivityDone(true)}
                                >
                                    {activityDone === true && <CheckCircle2 className="h-4 w-4" />}
                                    Hice mi rutina
                                </Button>
                                <Button
                                    variant={activityDone === false ? "default" : "outline"}
                                    className={`flex-1 rounded-xl h-12 gap-2 ${activityDone === false ? 'bg-slate-700' : ''}`}
                                    onClick={() => setActivityDone(false)}
                                >
                                    No entrené
                                </Button>
                            </div>

                            {activityDone && (
                                <div className="mt-4 p-3 bg-slate-50 rounded-xl border animate-in fade-in slide-in-from-top-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Intensidad</p>
                                    <div className="flex gap-2">
                                        {['baja', 'media', 'alta'].map(i => (
                                            <Button
                                                key={i}
                                                variant={activityIntensity === i ? "default" : "outline"}
                                                size="sm"
                                                className="flex-1 capitalize text-xs"
                                                onClick={() => setActivityIntensity(i)}
                                            >
                                                {i}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Peso y Notas */}
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Scale className="h-4 w-4 text-slate-400" />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Peso (kg)</p>
                                </div>
                                <Input
                                    type="number"
                                    placeholder="0.0"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    className="rounded-xl border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-slate-400" />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Nota rápida</p>
                                </div>
                                <Input
                                    placeholder="Algo para tu profesional..."
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="rounded-xl border-slate-200"
                                />
                            </div>
                        </div>
                        {/* Documentación Fotográfica */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50/30">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                                        <Camera className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">Documentar Cambio</p>
                                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Registra tu evolución física</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl gap-2 border-sky-100 text-sky-600 hover:bg-sky-50"
                                    onClick={() => document.getElementById('photo-upload')?.click()}
                                >
                                    <Plus className="h-4 w-4" />
                                    Subir Foto
                                </Button>
                                <input
                                    id="photo-upload"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handlePhotoUpload}
                                />
                            </div>

                            {photos.length > 0 ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                    {photos.map((p, i) => (
                                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden group shadow-sm">
                                            <img src={p} alt={`Progreso ${i}`} className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => removePhoto(i)}
                                                className="absolute top-1 right-1 bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div
                                    className="border-2 border-dashed border-slate-200 rounded-2xl py-8 flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-sky-200 transition-all"
                                    onClick={() => document.getElementById('photo-upload')?.click()}
                                >
                                    <Camera className="h-8 w-8 text-slate-300 mb-2" />
                                    <p className="text-xs text-slate-400 font-medium text-center px-4">
                                        Haz clic aquí para subir una foto de tu cambio físico
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 flex flex-col gap-3">
                        <Button
                            variant="ghost"
                            className="w-full sm:hidden text-xs text-slate-500 font-bold uppercase gap-2"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            {isExpanded ? 'Ver menos' : 'Completar más datos'}
                        </Button>

                        <Button
                            onClick={handleSave}
                            className="w-full bg-sky-600 hover:bg-sky-700 h-14 rounded-2xl shadow-lg shadow-sky-200 text-lg font-black"
                            disabled={hydration === 0 && activityDone === null && pain === 0 && photos.length === 0}
                        >
                            GUARDAR REGISTRO 💪
                        </Button>

                        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase py-1">
                            <Info className="h-3 w-3" />
                            <span>Impacta en tu Score TENSE</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
