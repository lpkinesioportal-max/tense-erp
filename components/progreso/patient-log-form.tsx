"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {
    Droplets,
    Zap,
    Moon,
    Smile,
    Activity,
    Utensils,
    Scale,
    Camera,
    MessageSquare,
    ChevronRight,
    ChevronLeft,
    Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useData } from "@/lib/data-context"
import { toast } from "sonner"

const logSchema = z.object({
    hydration: z.object({
        amount: z.coerce.number().min(0),
        unit: z.enum(["vasos", "litros"]),
    }),
    pain: z.object({
        eva: z.number().min(0).max(10),
        location: z.string().optional(),
    }),
    sleep: z.object({
        hours: z.coerce.number().min(0).max(24),
        quality: z.coerce.number().min(1).max(5),
        awakenings: z.boolean(),
    }),
    stress: z.object({
        level: z.number().min(0).max(10),
        source: z.string().optional(),
    }),
    mood: z.object({
        value: z.enum(["muy_bajo", "bajo", "neutro", "bueno", "muy_bueno"]),
        notes: z.string().optional(),
    }),
    activity: z.object({
        steps: z.coerce.number().min(0),
        type: z.enum(["entrenamiento", "caminata", "yoga", "reposo"]),
        duration: z.coerce.number().min(0),
    }),
    nutrition: z.object({
        description: z.string().optional(),
        respectedCompliance: z.boolean(),
    }),
    measurements: z.object({
        weight: z.coerce.number().optional(),
    }),
    notesForSession: z.string().optional(),
})

interface PatientLogFormProps {
    clientId: string
    onSuccess?: () => void
}

const STEPS = [
    { id: "vitals", name: "Bienestar", icon: Zap },
    { id: "habits", name: "Hábitos", icon: Droplets },
    { id: "activity", name: "Actividad", icon: Activity },
    { id: "additional", name: "Notas", icon: MessageSquare },
]

export function PatientLogForm({ clientId, onSuccess }: PatientLogFormProps) {
    const { addPatientLog } = useData()
    const [currentStep, setCurrentStep] = useState(0)

    const form = useForm<z.infer<typeof logSchema>>({
        resolver: zodResolver(logSchema),
        defaultValues: {
            hydration: { amount: 0, unit: "litros" },
            pain: { eva: 0, location: "" },
            sleep: { hours: 8, quality: 3, awakenings: false },
            stress: { level: 5, source: "" },
            mood: { value: "neutro", notes: "" },
            activity: { steps: 0, type: "reposo", duration: 0 },
            nutrition: { description: "", respectedCompliance: true },
            measurements: { weight: undefined },
            notesForSession: "",
        },
    })

    const onSubmit = (values: z.infer<typeof logSchema>) => {
        // Determine if hydration goal reached (simplified logic: > 2L or > 8 glasses)
        const goalReached = (values.hydration.unit === "litros" && values.hydration.amount >= 2) ||
            (values.hydration.unit === "vasos" && values.hydration.amount >= 8)

        addPatientLog(clientId, {
            clientId,
            date: new Date(),
            hydration: { ...values.hydration, goalReached },
            pain: values.pain,
            sleep: { ...values.sleep, quality: values.sleep.quality as any },
            stress: values.stress,
            mood: values.mood,
            activity: values.activity,
            nutrition: { ...values.nutrition, description: values.nutrition.description || "" },
            measurements: values.measurements,
            photos: [],
            notesForSession: values.notesForSession,
        })

        toast.success("Progreso registrado con éxito")
        onSuccess?.()
    }

    const nextStep = () => setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1))
    const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0))

    return (
        <Card className="border-none shadow-none">
            <CardHeader className="px-0 pt-0">
                <div className="flex justify-between items-center mb-4">
                    {STEPS.map((step, i) => (
                        <div key={step.id} className="flex flex-col items-center gap-1 opacity-50 data-[active=true]:opacity-100 transition-opacity" data-active={i <= currentStep}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${i <= currentStep ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                                {i < currentStep ? <Check className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
                            </div>
                            <span className="text-[10px] font-medium uppercase tracking-wider">{step.name}</span>
                        </div>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="px-0">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {currentStep === 0 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Mood */}
                                    <FormField
                                        control={form.control}
                                        name="mood.value"
                                        render={({ field }) => (
                                            <FormItem className="space-y-3">
                                                <FormLabel className="text-base">¿Cómo te sientes hoy?</FormLabel>
                                                <FormControl>
                                                    <RadioGroup
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                        className="flex flex-wrap gap-2"
                                                    >
                                                        {["muy_bajo", "bajo", "neutro", "bueno", "muy_bueno"].map((v) => (
                                                            <FormItem key={v} className="flex-1 min-w-[80px]">
                                                                <FormControl>
                                                                    <RadioGroupItem value={v} className="sr-only" />
                                                                </FormControl>
                                                                <FormLabel className={`flex flex-col items-center justify-center p-3 border-2 rounded-xl cursor-pointer hover:bg-muted transition-all ${field.value === v ? "border-primary bg-primary/10" : "border-transparent bg-muted/30"}`}>
                                                                    <span className="text-xl">
                                                                        {v === "muy_bajo" && "😢"}
                                                                        {v === "bajo" && "🙁"}
                                                                        {v === "neutro" && "😐"}
                                                                        {v === "bueno" && "🙂"}
                                                                        {v === "muy_bueno" && "🤩"}
                                                                    </span>
                                                                    <span className="text-[10px] mt-1 capitalize">{v.replace("_", " ")}</span>
                                                                </FormLabel>
                                                            </FormItem>
                                                        ))}
                                                    </RadioGroup>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    {/* Stress */}
                                    <FormField
                                        control={form.control}
                                        name="stress.level"
                                        render={({ field }) => (
                                            <FormItem className="space-y-3">
                                                <FormLabel className="text-base">Nivel de Estrés (0-10)</FormLabel>
                                                <FormControl>
                                                    <div className="pt-2">
                                                        <Slider
                                                            value={[field.value]}
                                                            onValueChange={([v]) => field.onChange(v)}
                                                            max={10}
                                                            step={1}
                                                            className="py-4"
                                                        />
                                                        <div className="flex justify-between text-xs text-muted-foreground">
                                                            <span>Zen (0)</span>
                                                            <span className="font-bold text-primary">{field.value}</span>
                                                            <span>Crítico (10)</span>
                                                        </div>
                                                    </div>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    {/* Pain */}
                                    <FormField
                                        control={form.control}
                                        name="pain.eva"
                                        render={({ field }) => (
                                            <FormItem className="space-y-3">
                                                <FormLabel className="text-base font-medium flex items-center gap-2">
                                                    Escala de Dolor (EVA)
                                                    <span className={`px-2 py-0.5 rounded text-xs ${field.value <= 3 ? "bg-green-100 text-green-700" : field.value <= 6 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                                                        {field.value}/10
                                                    </span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Slider
                                                        value={[field.value]}
                                                        onValueChange={([v]) => field.onChange(v)}
                                                        max={10}
                                                        step={1}
                                                        className="py-2"
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="pain.location"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm">¿Dónde te duele?</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ej: Espalda baja, hombro..." {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        )}

                        {currentStep === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Hydration */}
                                    <div className="space-y-4">
                                        <FormLabel className="text-base">Hidratación</FormLabel>
                                        <div className="flex gap-4">
                                            <FormField
                                                control={form.control}
                                                name="hydration.amount"
                                                render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <FormControl>
                                                            <Input type="number" step="0.5" {...field} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="hydration.unit"
                                                render={({ field }) => (
                                                    <FormItem className="w-32">
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="litros">Litros</SelectItem>
                                                                <SelectItem value="vasos">Vasos</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    {/* Sleep */}
                                    <div className="space-y-4">
                                        <FormLabel className="text-base">Sueño</FormLabel>
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="sleep.hours"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">Horas dormidas</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" {...field} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="sleep.quality"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">Calidad (1-5)</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value.toString()}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {[1, 2, 3, 4, 5].map(v => (
                                                                    <SelectItem key={v} value={v.toString()}>{v} estrella{v > 1 ? 's' : ''}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="sleep.awakenings"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                    <div className="space-y-0.5">
                                                        <FormLabel>¿Tuviste despertares nocturnos?</FormLabel>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Activity */}
                                    <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="activity.steps"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Pasos Diarios</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" placeholder="10000" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="activity.type"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Tipo</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="entrenamiento">Entrenamiento</SelectItem>
                                                                <SelectItem value="caminata">Caminata</SelectItem>
                                                                <SelectItem value="yoga">Yoga</SelectItem>
                                                                <SelectItem value="reposo">Reposo</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="activity.duration"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Minutos</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" {...field} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    {/* Nutrition & Weight */}
                                    <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="nutrition.respectedCompliance"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                    <div className="space-y-0.5">
                                                        <FormLabel>¿Respetaste lo indicado hoy?</FormLabel>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="measurements.weight"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Peso (kg)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="0.1" placeholder="75.0" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                <FormField
                                    control={form.control}
                                    name="notesForSession"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Notas para la próxima sesión</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="¿Hay algo que quieras comentar con tu profesional en la próxima sesión?"
                                                    className="h-32"
                                                    {...field}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                                    <div className="flex items-center gap-3 text-primary">
                                        <Camera className="h-6 w-6" />
                                        <div>
                                            <p className="font-semibold">Fotos de progreso</p>
                                            <p className="text-xs">Sube tus fotos para ver tu evolución física</p>
                                        </div>
                                    </div>
                                    <Button type="button" variant="outline" className="w-full mt-4 bg-white dark:bg-slate-900 border-dashed">
                                        Haz clic para subir fotos
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between pt-4">
                            <Button type="button" variant="ghost" onClick={prevStep} disabled={currentStep === 0}>
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                Anterior
                            </Button>
                            {currentStep < STEPS.length - 1 ? (
                                <Button type="button" onClick={nextStep}>
                                    Siguiente
                                    <ChevronRight className="h-4 w-4 ml-2" />
                                </Button>
                            ) : (
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                                    Guardar Registro
                                    <Check className="h-4 w-4 ml-2" />
                                </Button>
                            )}
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
