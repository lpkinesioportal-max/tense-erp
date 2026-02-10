"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  LogOut, Home, Activity, Dumbbell, FileText, ShoppingBag,
  MessageCircle, Bell, ChevronRight, Calendar, User,
  Stethoscope, Target, Play, Video, Download, Info, CheckSquare, Heart,
  TrendingUp, ClipboardCheck, Droplets, Moon, History, Utensils, Flower2, Camera,
  Sparkles, ShieldCheck, Zap, Brain, Clock, Layers, Clipboard, CheckCircle, Repeat
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { BodyMap } from "@/components/medical/body-map"
import { ProgressChart } from "@/components/progreso/progress-chart"
import { PatientLogForm } from "@/components/progreso/patient-log-form"
import { PatientTaskList } from "@/components/progreso/patient-task-list"
import { QuickDailyLog } from "@/components/progreso/quick-daily-log"
import { loadLogs, addLog } from "@/lib/exercise-logs.storage"
import type { ExerciseLog, RoutineDay, ExerciseItem } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function MiCuentaPage() {
  const router = useRouter()
  const { client, logout, isClient } = useAuth()
  const { getMedicalRecord, professionals, clinicalEntries, loadClinicalEntries } = useData()
  const [activeTab, setActiveTab] = useState("inicio")
  const [record, setRecord] = useState<any>(null)
  const [routineEntries, setRoutineEntries] = useState<any[]>([])
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>(loadLogs())
  const [trackingModal, setTrackingModal] = useState<{ routineId: string, dayId: string, dayName: string, exercises: ExerciseItem[] } | null>(null)
  const [trackingForm, setTrackingForm] = useState<Record<string, { completed: boolean, weight: string, duration: string, notes: string }>>({})
  const [activeDayIndex, setActiveDayIndex] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!isClient || !client) {
      router.push("/login")
    } else {
      const existingRecord = getMedicalRecord(client.id)
      if (existingRecord) {
        setRecord(existingRecord)
      }
      loadClinicalEntries(client.id).then(entries => {
        const routines = entries.filter((e: any) => e.formType === 'training_routine')
        setRoutineEntries(routines)
      }).catch(() => { /* clinical_entries table may not exist yet */ })
    }
  }, [isClient, client, router, getMedicalRecord, loadClinicalEntries])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const getProfessionalName = (id: string) => {
    const prof = professionals.find((p) => p.id === id)
    return prof ? prof.name : "Profesional"
  }

  const translateZone = (zoneStr: string) => {
    const translations: Record<string, string> = {
      "left-pec": "Pectoral Izquierdo",
      "right-pec": "Pectoral Derecho",
      "left-shoulder": "Hombro Izquierdo",
      "right-shoulder": "Hombro Derecho",
      "neck": "Cuello",
      "trapezius": "Trapecio",
      "upper-back": "Espalda Alta",
      "mid-back": "Espalda Media",
      "lower-back": "Espalda Baja",
      "left-lower-back": "Lumbar Izquierdo",
      "right-lower-back": "Lumbar Derecho",
      "gluteus": "Glúteos",
      "hamstrings": "Isquios",
      "quadriceps": "Cuádriceps",
      "abs": "Abdominales",
      "obliques": "Oblicuos",
      "biceps": "Bíceps",
      "triceps": "Tríceps",
      "forearm": "Antebrazo",
      "calf": "Gemelos",
      "calves": "Gemelos",
      "ankles": "Tobillos",
      "feet": "Pies"
    };

    const slug = zoneStr.toLowerCase().replace(/\s+/g, '-');
    for (const [key, value] of Object.entries(translations)) {
      if (slug.includes(key)) return value;
    }
    return zoneStr.replace(/-/g, ' ');
  };

  if (!client) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sky-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando tu cuenta...</p>
        </div>
      </div>
    )
  }

  // Filter visible items
  const visibleEvaluations = record?.kinesiologyEvaluations?.filter((e: any) => e.visibleToPatient) || []
  const visibleTreatments = record?.kinesiologyTreatments?.filter((t: any) => t.visibleToPatient) || []
  const visiblePrograms = record?.kineHomePrograms?.filter((p: any) => p.visibleToPatient) || []
  const visibleRoutines = record?.trainingRoutines?.filter((r: any) => r.visibleToPatient) || []
  const visibleEvaluationsTraining = record?.trainingEvaluations?.filter((e: any) => e.visibleToPatient) || []
  const visibleMassageSessions = record?.massageEvaluations?.filter((s: any) => s.visibleToPatient) || []
  const visibleNutritionalEvaluations = record?.anthropometryEvaluations?.filter((e: any) => e.visibleToPatient) || []
  const visibleYogaSessions = record?.yogaEvaluations?.filter((s: any) => s.visibleToPatient) || []
  const visibleRecipes = record?.recipes?.filter((r: any) => r.visibleToPatient) || []

  // Build routine data from clinical entries (new exercise_days format)
  const clinicalRoutines = routineEntries
    // Filter by visibility (default true)
    .filter((entry: any) => {
      // Check both flattened prop and nested content just in case, prioritize explicit false
      if (entry.isVisible === false) return false
      if (entry.content?.isVisible === false) return false
      return true
    })
    .map((entry: any) => {
      const content = entry.content || {}
      // exerciseList might be at top level now due to flattening, or in content
      const exerciseList = entry.exerciseList || content.exerciseList

      let days: RoutineDay[]
      if (!exerciseList || !Array.isArray(exerciseList) || exerciseList.length === 0) {
        days = []
      } else if (exerciseList[0] && 'title' in exerciseList[0] && !('exercises' in exerciseList[0])) {
        days = [{ id: 'day-1', name: 'Dia 1', exercises: exerciseList }]
      } else {
        days = exerciseList as RoutineDay[]
      }
      return {
        id: entry.id,
        name: entry.routineName || content.routineName || entry.title || 'Rutina',
        month: entry.month || content.month || 'General',
        date: entry.attentionDate || entry.createdAt,
        objective: entry.objective || content.objective || '',
        days,
      }
    }).filter((r: any) => r.days.length > 0)

  // Group routines by month
  const routinesByMonth = clinicalRoutines.reduce((acc: Record<string, any[]>, routine: any) => {
    const month = routine.month || 'General'
    if (!acc[month]) acc[month] = []
    acc[month].push(routine)
    return acc
  }, {})

  const sortedMonths = Object.keys(routinesByMonth).sort((a, b) => {
    // Basic sort, can be improved to sort months chronologically if needed
    // Assuming user enters "Enero", "Febrero" or "Fase 1", "Fase 2"
    if (a === 'General') return -1 // General first
    if (b === 'General') return 1
    return a.localeCompare(b)
  })

  const getLogsForDay = (routineId: string, dayId: string) => {
    return exerciseLogs.filter(l => l.routineId === routineId && l.dayId === dayId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  const openTrackingModal = (routineId: string, day: RoutineDay) => {
    const defaultForm: Record<string, { completed: boolean, weight: string, duration: string, notes: string }> = {}
    day.exercises.forEach(ex => {
      defaultForm[ex.id] = { completed: false, weight: '', duration: '', notes: '' }
    })
    setTrackingForm(defaultForm)
    setTrackingModal({ routineId, dayId: day.id, dayName: day.name, exercises: day.exercises })
  }

  const submitTracking = () => {
    if (!trackingModal) return
    const log: ExerciseLog = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 5),
      routineId: trackingModal.routineId,
      dayId: trackingModal.dayId,
      date: new Date().toISOString(),
      exercises: trackingModal.exercises.map(ex => ({
        exerciseId: ex.id,
        completed: trackingForm[ex.id]?.completed || false,
        weight: trackingForm[ex.id]?.weight || '',
        duration: trackingForm[ex.id]?.duration || '',
        notes: trackingForm[ex.id]?.notes || ''
      }))
    }
    addLog(log)
    setExerciseLogs(loadLogs())
    setTrackingModal(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50/30 pb-20 sm:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-lg shadow-slate-200/30">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setActiveTab("inicio")}>
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-sky-600 to-indigo-700 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-500">
                <Activity className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <h1 className="font-black text-lg text-slate-900 tracking-tighter leading-none">TENSE</h1>
                <p className="text-[8px] uppercase font-black text-sky-600 tracking-widest mt-0.5 opacity-80">PATIENT</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden md:flex items-center gap-2.5 bg-slate-50/50 p-1.5 rounded-xl border border-slate-100 pr-4 group hover:bg-white hover:shadow-sm transition-all duration-500">
                <Avatar className="h-8 w-8 border-2 border-white shadow-sm group-hover:rotate-6 transition-transform">
                  <AvatarImage src={client.profileImage || "/placeholder.svg"} />
                  <AvatarFallback className="bg-gradient-to-br from-sky-500 to-indigo-600 text-white text-[10px] font-black">
                    {client.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-[12px] font-black text-slate-900 leading-none">{client.name}</p>
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5 uppercase tracking-tighter">{client.email.split('@')[0]}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg relative hover:bg-sky-50 text-slate-600">
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-rose-500 ring-1 ring-white"></span>
                </Button>

                <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-3 py-1.5">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">¡Hola, {client.name.split(" ")[0]}!</h2>
              <p className="text-slate-500 font-medium text-[11px] mt-0.5">Tu panel de recuperación inteligente.</p>
            </div>

            <TabsList className="flex w-full md:w-auto overflow-x-auto justify-start bg-white/50 backdrop-blur-md p-0.5 rounded-lg shadow-md border border-white/50 scrollbar-hide">
              <TabsTrigger
                value="inicio"
                className="flex items-center gap-1.5 data-[state=active]:bg-sky-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg py-1 px-2.5 text-[10px] font-bold transition-all duration-300"
              >
                <Home className="h-3 w-3" />
                <span>Dashboard</span>
              </TabsTrigger>
              <TabsTrigger
                value="progreso"
                className="flex items-center gap-1.5 data-[state=active]:bg-sky-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg py-1 px-2.5 text-[10px] font-bold transition-all duration-300"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Progreso</span>
              </TabsTrigger>
              <TabsTrigger
                value="tratamientos"
                className="flex items-center gap-1.5 data-[state=active]:bg-sky-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg py-1 px-2.5 text-[10px] font-bold transition-all duration-300"
              >
                <Activity className="h-3 w-3" />
                <span>Sesiones</span>
              </TabsTrigger>
              <TabsTrigger
                value="ejercicios"
                className="flex items-center gap-1.5 data-[state=active]:bg-sky-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg py-1 px-2.5 text-[10px] font-bold transition-all duration-300"
              >
                <Dumbbell className="h-3 w-3" />
                <span>Kine</span>
              </TabsTrigger>
              <TabsTrigger
                value="rutinas"
                className="flex items-center gap-1.5 data-[state=active]:bg-sky-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg py-1 px-2.5 text-[10px] font-bold transition-all duration-300"
              >
                <Target className="h-3 w-3" />
                <span>Training</span>
              </TabsTrigger>
              <TabsTrigger
                value="nutricion"
                className="flex items-center gap-1.5 data-[state=active]:bg-sky-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg py-1 px-2.5 text-[10px] font-bold transition-all duration-300"
              >
                <Utensils className="h-3 w-3" />
                <span>Nutrición</span>
              </TabsTrigger>
              <TabsTrigger
                value="masajes"
                className="flex items-center gap-1.5 data-[state=active]:bg-sky-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg py-1 px-2.5 text-[10px] font-bold transition-all duration-300"
              >
                <Sparkles className="h-3 w-3" />
                <span>Wellness</span>
              </TabsTrigger>
              <TabsTrigger
                value="yoga"
                className="flex items-center gap-1.5 data-[state=active]:bg-sky-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg py-1 px-2.5 text-[10px] font-bold transition-all duration-300"
              >
                <Flower2 className="h-3 w-3" />
                <span>Yoga</span>
              </TabsTrigger>
              <TabsTrigger
                value="evaluaciones"
                className="flex items-center gap-1.5 data-[state=active]:bg-sky-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg py-1 px-2.5 text-[10px] font-bold transition-all duration-300"
              >
                <Stethoscope className="h-3 w-3" />
                <span>Historias</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="inicio" className="space-y-6 outline-none animate-in fade-in duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Content Area */}
              <div className="lg:col-span-3 space-y-6">
                {/* Welcome & Pulse Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="md:col-span-2 border-none shadow-sm bg-white rounded-xl overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-sky-50 opacity-100" />
                    <CardHeader className="relative z-10 p-3 pb-0.5">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-6 w-6 rounded-md bg-sky-100 flex items-center justify-center">
                          <Sparkles className="h-3 w-3 text-sky-600" />
                        </div>
                        <p className="text-[8px] uppercase font-black text-sky-600 tracking-wider">Estado</p>
                      </div>
                      <CardTitle className="text-md font-black text-slate-900 tracking-tight leading-tight">Tu Recuperación</CardTitle>
                      <CardDescription className="text-slate-500 font-bold text-[11px] mt-0.5 max-w-lg leading-tight">
                        Consistencia del <span className="text-sky-600 font-black">85%</span>.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10 p-3 pt-0">
                      <div className="space-y-3">
                        <div className="flex justify-between items-end mb-0.5">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Progreso de Objetivos</span>
                          <span className="text-lg font-black text-sky-600">85%</span>
                        </div>
                        <div className="h-2.5 bg-slate-100/50 rounded-full overflow-hidden p-0.5 border border-slate-200/30">
                          <div
                            className="h-full bg-gradient-to-r from-sky-400 via-sky-600 to-indigo-600 rounded-full shadow-md transition-all duration-1000 ease-out"
                            style={{ width: '85%' }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl text-white overflow-hidden relative group">
                    <CardHeader className="pb-1 relative z-10 p-3">
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="h-6 w-6 rounded-md bg-white/10 flex items-center justify-center border border-white/10">
                          <Zap className="h-3 w-3 text-sky-400" />
                        </div>
                        <p className="text-[8px] uppercase font-black text-sky-300 tracking-wider">Score</p>
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-2xl font-black leading-none tracking-tighter">
                          {record?.progressHistory?.[record.progressHistory.length - 1]?.score || 1050}
                        </span>
                        <div className="flex items-center text-[8px] font-black bg-emerald-500/20 px-1.5 py-0.5 rounded-full text-emerald-400 border border-emerald-500/20">
                          <TrendingUp className="h-2 w-2 mr-1" /> +12
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="relative z-10 px-3 pb-3 pt-0">
                      <div className="h-1 w-full bg-white/10 rounded-full mb-1.5 overflow-hidden">
                        <div className="h-full bg-sky-400 w-3/4 rounded-full" />
                      </div>
                      <p className="text-[8px] text-white/50 font-bold uppercase tracking-widest leading-tight">Rendimiento Pro</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="animate-in slide-in-from-bottom-6 duration-700 delay-100">
                  <QuickDailyLog clientId={client.id} onSuccess={() => setRecord(getMedicalRecord(client.id))} />
                </div>

                <Card className="border-none shadow-sm bg-white/90 backdrop-blur-xl rounded-xl border border-white/50 overflow-hidden">
                  <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between border-b border-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-md bg-emerald-50 flex items-center justify-center border border-emerald-100">
                        <ClipboardCheck className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                      <div>
                        <CardTitle className="text-md font-black text-slate-900 tracking-tight">Checklist</CardTitle>
                        <CardDescription className="text-[10px] font-medium text-slate-500">Micro-objetivos</CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className="bg-emerald-500 text-white font-black px-2 py-0.5 rounded-md border-none text-[8px]">
                        {record?.patientTasks?.filter((t: any) => t.status === "completed").length || 0} / {record?.patientTasks?.length || 0} OK
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3">
                    <PatientTaskList clientId={client.id} tasks={record?.patientTasks || []} />
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar Info Area */}
              <div className="space-y-6 animate-in slide-in-from-right-6 duration-700">
                {/* Next Appointment Simulation */}
                <Card className="border-none shadow-md bg-slate-900 text-white rounded-2xl overflow-hidden relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 to-transparent pointer-events-none" />
                  <CardHeader className="p-5 pb-1 relative z-10">
                    <CardTitle className="text-[9px] font-black flex items-center gap-2 uppercase tracking-wider text-sky-400 opacity-80">
                      <Calendar className="h-3 w-3" />
                      Próxima Cita
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 relative z-10">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-white/10 flex flex-col items-center justify-center border border-white/20 backdrop-blur-md">
                          <span className="text-[8px] font-black text-sky-400 uppercase tracking-tighter leading-none">FEB</span>
                          <span className="text-xl font-black leading-none mt-1">05</span>
                        </div>
                        <div>
                          <p className="text-sm font-black tracking-tight">Kine Deportiva</p>
                          <p className="text-[9px] text-slate-400 font-bold mt-0.5 uppercase tracking-tighter">15:30 • Dr. Rodriguez</p>
                        </div>
                      </div>
                      <Button className="w-full bg-white text-slate-900 hover:bg-sky-400 hover:text-white font-black text-[9px] tracking-widest h-9 rounded-lg transition-all duration-300">
                        CONFIRMAR ASISTENCIA
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Medical Identity Card */}
                <Card className="border-none shadow-md bg-white rounded-2xl group hover:shadow-sky-100 transition-all duration-700 overflow-hidden relative">
                  <CardHeader className="p-5 pb-2 border-b border-slate-50">
                    <CardTitle className="text-[9px] font-black flex items-center gap-2 text-slate-400 uppercase tracking-wider">
                      <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
                      ID de Salud
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4 relative z-10">
                    <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-[9px] uppercase font-black text-slate-400 tracking-tighter">Grupo</p>
                        <p className="text-xl font-black text-slate-900 leading-none">Rh {record?.personalData?.bloodType || "O+"}</p>
                      </div>
                      <div className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center">
                        <Zap className="h-4 w-4 text-sky-600" />
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] uppercase font-black text-slate-400 tracking-wider mb-2 ml-1">Alergias</p>
                      <div className="flex flex-wrap gap-1.5">
                        {record?.personalData?.allergies && record.personalData.allergies.length > 0 ? (
                          record.personalData.allergies.map((a: string, i: number) => (
                            <Badge key={i} className="bg-rose-50 text-rose-600 border border-rose-100 text-[9px] py-1 px-3 rounded-lg font-black">{a}</Badge>
                          ))
                        ) : (
                          <div className="flex items-center gap-2 text-slate-300 font-bold italic text-[10px] py-1.5 px-3 bg-slate-50 rounded-xl">
                            <Brain className="h-3.5 w-3.5" /> Sin alertas
                          </div>
                        )}
                      </div>
                    </div>

                    {record?.personalData?.emergencyContact && (
                      <div className="p-4 bg-sky-50 rounded-xl border border-sky-100 relative group/contact overflow-hidden">
                        <p className="text-[9px] uppercase font-black text-sky-600 tracking-wider mb-2 relative z-10">Contacto Emergencia</p>
                        <div className="flex items-center gap-3 relative z-10">
                          <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                            <AvatarFallback className="text-[10px] bg-sky-600 text-white font-black">
                              {record.personalData.emergencyContact.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-[12px] font-black text-slate-800 leading-tight">{record.personalData.emergencyContact.name}</p>
                            <p className="text-[10px] text-sky-600 font-black mt-0.5 tracking-wider">{record.personalData.emergencyContact.phone}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* EVALUACIONES TAB */}
          <TabsContent value="evaluaciones" className="space-y-6 outline-none animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md">
                    <Stethoscope className="h-3.5 w-3.5 text-white" />
                  </div>
                  Historias Clínicas
                </h3>
                <p className="text-slate-500 font-medium text-[11px] mt-1 ml-9">Resultados de tus evaluaciones y exámenes físicos</p>
              </div>
            </div>

            {visibleEvaluations.length === 0 ? (
              <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-200 p-20 text-center">
                <div className="h-20 w-20 mx-auto rounded-full bg-slate-50 flex items-center justify-center mb-6">
                  <FileText className="h-10 w-10 text-slate-200" />
                </div>
                <p className="text-slate-600 font-black text-xl">Sin informes compartidos</p>
                <p className="text-slate-400 mt-2 max-w-sm mx-auto font-medium">Aquí aparecerán los informes detallados de tus evaluaciones kinesiológicas.</p>
              </div>
            ) : (
              <div className="grid gap-10">
                {visibleEvaluations.map((evalu: any, i: number) => (
                  <Card key={evalu.id} className="border-none shadow-md rounded-2xl overflow-hidden bg-white/70 backdrop-blur-xl border border-white group">
                    <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-sky-500" />
                    <CardHeader className="p-5 pb-1 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner group-hover:scale-110 transition-transform duration-500">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-black text-slate-900 tracking-tight capitalize">
                            Evaluación de {evalu.consultReason || "Sesión Clínica"}
                          </CardTitle>
                          <CardDescription className="text-[10px] font-bold text-slate-400 mt-0.5">
                            {format(new Date(evalu.date), "dd 'de' MMMM, yyyy", { locale: es })}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className="bg-white text-indigo-600 border border-indigo-100 font-black px-3 py-1 rounded-lg shadow-sm text-[9px] tracking-widest h-auto">
                        SESIÓN #{evalu.sessionNumber || "INTAKE"}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-5 pt-2">
                      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                        <div className="xl:col-span-7 space-y-10">
                          <div className="group/diag lg:p-4 rounded-[2.5rem] hover:bg-slate-50 transition-colors duration-500">
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4" /> Diagnóstico Clínico
                            </p>
                            <p className="text-xl font-black text-slate-900 leading-snug">
                              {evalu.diagnosis || "Evaluación física en proceso de codificación."}
                            </p>
                          </div>

                          <div className="lg:p-8 bg-slate-900 rounded-[2.5rem] shadow-2xl relative overflow-hidden group/plan">
                            <div className="absolute -right-8 -bottom-8 h-32 w-32 bg-white/5 rounded-full blur-3xl group-hover/plan:scale-150 transition-transform duration-1000" />
                            <p className="text-[10px] font-black text-sky-400 uppercase tracking-[0.2em] mb-4 relative z-10">Plan de Tratamiento Estratégico</p>
                            <p className="text-slate-100 text-[15px] whitespace-pre-line leading-relaxed font-medium relative z-10">
                              {evalu.treatmentPlan}
                            </p>
                          </div>
                        </div>

                        <div className="xl:col-span-5 flex flex-col gap-4">
                          <div className="p-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl text-white shadow-xl shadow-amber-200 group/eva">
                            <div className="flex justify-between items-center mb-4">
                              <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">Nivel de Dolor (EVA)</p>
                              <Heart className="h-4 w-4 animate-pulse" />
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-5xl font-black tracking-tighter">{evalu.evaScale || 0}</span>
                              <span className="text-xl font-bold opacity-60">/ 10</span>
                            </div>
                            <div className="mt-4 h-1.5 bg-white/20 rounded-full overflow-hidden">
                              <div className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" style={{ width: `${(evalu.evaScale || 0) * 10}%` }} />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100/50 flex flex-col items-center justify-center text-center group/metric">
                              <Moon className="h-4 w-4 text-sky-600 mb-2 group-hover:scale-110 transition-transform" />
                              <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Sueño</p>
                              <p className="text-xs font-black text-slate-800 tracking-tight">{evalu.sleepQuality || "Normal"}</p>
                            </div>
                            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100/50 flex flex-col items-center justify-center text-center group/metric">
                              <Activity className="h-4 w-4 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                              <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Inflamación</p>
                              <p className="text-xs font-black text-slate-800 tracking-tight">{evalu.abdominalInflammation ? "Presencia" : "Ausencia"}</p>
                            </div>
                          </div>

                          {evalu.notes && (
                            <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm italic">
                              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-3 not-italic">Observaciones Adicionales</p>
                              <p className="text-sm text-slate-600 font-medium leading-relaxed">"{evalu.notes}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TRATAMIENTOS TAB */}
          <TabsContent value="tratamientos" className="space-y-3 outline-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-sky-600 flex items-center justify-center shadow-md">
                    <Activity className="h-3.5 w-3.5 text-white" />
                  </div>
                  Seguimiento de Sesiones
                </h3>
                <p className="text-slate-500 text-[11px] mt-1 ml-9">Historial cronológico de tu proceso terapéutico</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-white text-sky-700 border border-sky-100 px-3 py-1 rounded-lg font-bold">
                  {visibleTreatments.length} Sesiones
                </Badge>
              </div>
            </div>

            <div className="relative pl-5 sm:pl-6 space-y-3 before:absolute before:left-[10px] sm:before:left-[13px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-gradient-to-b before:from-sky-600 before:via-sky-200 before:to-slate-100 before:rounded-full">
              {visibleTreatments.length === 0 ? (
                <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-200 p-12 text-center">
                  <div className="h-16 w-16 mx-auto rounded-full bg-slate-50 flex items-center justify-center mb-4">
                    <History className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="text-slate-600 font-bold">Sin sesiones registradas</p>
                  <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">Tus sesiones compartidas por el profesional aparecerán en esta línea de tiempo.</p>
                </div>
              ) : (
                visibleTreatments.map((treat: any, i: number) => (
                  <div key={treat.id} className="relative group animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                    {/* Timeline Dot */}
                    <div className={`absolute -left-[32px] sm:-left-[36px] top-1 px-1 py-1 rounded-full border-[4px] border-white shadow-md transition-all duration-500 z-10 
                      ${i === 0
                        ? 'bg-sky-600'
                        : 'bg-white ring-1 ring-slate-100 group-hover:bg-sky-400 ring-offset-1'}`}
                    >
                      {i === 0 && <Sparkles className="h-3 w-3 text-white animate-pulse" />}
                    </div>

                    <Card className="border-none shadow-xl shadow-slate-200/60 rounded-3xl overflow-hidden group-hover:shadow-sky-200/40 transition-all duration-500 bg-white/70 backdrop-blur-sm border border-white/40">
                      <div className={`h-1.5 w-full ${i === 0 ? 'bg-gradient-to-r from-sky-600 to-indigo-600' : 'bg-slate-100'}`} />
                      <CardHeader className="p-4 pb-1">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                          <div className="flex items-center gap-4">
                            <div className={`h-8 w-8 rounded-lg flex flex-col items-center justify-center shadow-sm transition-transform group-hover:scale-105 duration-500
                              ${i === 0 ? 'bg-sky-600 text-white' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                              <span className="text-[6px] font-black uppercase tracking-tighter leading-none opacity-80">S#</span>
                              <span className="text-md font-black leading-none mt-0.5">{treat.sessionNumber || (visibleTreatments.length - i)}</span>
                            </div>
                            <div>
                              <h4 className="text-lg font-black text-slate-900 tracking-tight capitalize">
                                {format(new Date(treat.date), "EEEE d 'de' MMMM", { locale: es })}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="flex items-center gap-1 text-slate-400 text-[10px] font-bold">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(treat.date), "yyyy")}
                                </span>
                                <span className="h-1 w-1 rounded-full bg-slate-300" />
                                <span className="flex items-center gap-1 text-slate-400 text-[10px] font-bold">
                                  <User className="h-3 w-3" />
                                  {getProfessionalName(treat.professionalId)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Badge className={`px-3 py-1 rounded-lg font-black text-[9px] tracking-widest border-none h-auto shadow-sm
                             ${treat.attended
                              ? "bg-emerald-500 text-white shadow-emerald-100"
                              : "bg-rose-500 text-white shadow-rose-100"}`}>
                            {treat.attended ? "REALIZADA" : "AUSENCIA"}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="p-3 pt-0.5 space-y-3">
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
                          {/* Content Column */}
                          <div className="xl:col-span-5 space-y-3">
                            <div className="space-y-2 group/info">
                              <div className="flex items-center gap-3">
                                <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover/info:bg-sky-50 group-hover/info:text-sky-600 transition-colors">
                                  <Activity className="h-3.5 w-3.5" />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trabajo Realizado</p>
                              </div>
                              <p className="text-[12px] text-slate-700 leading-snug font-medium bg-slate-50/50 p-3 rounded-xl border border-slate-100 shadow-inner min-h-[60px]">
                                {treat.sessionWork || "Registro de evolución en sesión clínica."}
                              </p>
                            </div>

                            {treat.indication && (
                              <div className="relative overflow-hidden group/alert p-3 bg-gradient-to-br from-amber-50 to-orange-50/30 rounded-xl border border-amber-100 shadow-sm transition-all duration-500">
                                <div className="absolute -right-3 -bottom-3 h-20 w-20 bg-amber-200/20 rounded-full blur-xl" />
                                <div className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                  <div className="h-5 w-5 rounded-md bg-amber-500 text-white flex items-center justify-center">
                                    <Info className="h-3 w-3" />
                                  </div>
                                  Indicación
                                </div>
                                <p className="text-[12px] text-amber-900 font-bold leading-tight relative z-10">{treat.indication}</p>
                              </div>
                            )}

                            {treat.exercises && (
                              <div className="p-3 bg-sky-50 rounded-xl border border-sky-100">
                                <p className="text-[9px] font-black text-sky-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                  <Dumbbell className="h-3 w-3" /> Ejercicios
                                </p>
                                <p className="text-[12px] font-semibold text-sky-900 leading-tight">{treat.exercises}</p>
                              </div>
                            )}
                          </div>

                          {/* Map Column */}
                          <div className="xl:col-span-7">
                            <div className="relative h-full bg-slate-50/20 rounded-lg border border-slate-100 p-1.5 hover:bg-slate-50/40 transition-colors duration-500 max-w-sm mx-auto xl:mx-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <div className="h-5 w-5 rounded bg-slate-900 flex items-center justify-center text-white">
                                    <Target className="h-2.5 w-2.5" />
                                  </div>
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Anatomía</p>
                                </div>
                                {treat.bodyZones?.length > 0 && (
                                  <Badge className="bg-white text-slate-800 border border-slate-200 font-bold text-[7px] px-1.5 py-0 rounded-full">
                                    {treat.bodyZones.length} ZONAS
                                  </Badge>
                                )}
                              </div>

                              {treat.bodyZones && treat.bodyZones.length > 0 ? (
                                <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden h-[350px] relative flex items-center justify-center">
                                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.01)_0%,transparent_70%)] pointer-events-none" />
                                  <div className="w-[800px] h-[800px] scale-[0.42] flex items-center justify-center origin-center shrink-0">
                                    <BodyMap zones={treat.bodyZones} onZonesChange={() => { }} readOnly isPatient />
                                  </div>
                                </div>
                              ) : (
                                <div className="h-[350px] flex items-center justify-center bg-white/50 rounded border-2 border-dashed border-slate-100">
                                  <div className="text-center">
                                    <Activity className="h-5 w-5 mx-auto text-slate-200 mb-1" />
                                    <p className="text-[8px] text-slate-400 font-bold italic">No disponible</p>
                                  </div>
                                </div>
                              )}

                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {treat.bodyZones?.map((zone: any) => (
                                  <Badge key={zone.id} className="bg-sky-50/80 text-sky-700 border-sky-100/50 hover:bg-sky-100 font-black text-[8px] px-2 py-0.5 uppercase tracking-tighter">
                                    {translateZone(zone.name || zone.zone)}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {treat.zoneNotes && treat.zoneNotes.length > 0 && (
                          <div className="pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="h-6 w-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Zap className="h-3 w-3" />
                              </div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalle por Zona</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {treat.zoneNotes.map((note: any, nIdx: number) => (
                                <div key={note.id || nIdx} className="group/note p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-500 overflow-hidden relative">
                                  <div className="absolute -right-6 -top-6 h-16 w-16 bg-emerald-50 rounded-full opacity-0 group-hover/note:opacity-100 transition-opacity" />
                                  <div className="flex flex-wrap gap-2 mb-4">
                                    {note.zoneIds.map((zid: string) => (
                                      <Badge key={zid} variant="outline" className="text-[10px] font-black uppercase tracking-tighter px-3 h-6 bg-slate-50/50 border-slate-100 text-slate-500 group-hover/note:bg-emerald-50 group-hover/note:border-emerald-100 group-hover/note:text-emerald-700 transition-colors">
                                        {translateZone(zid)}
                                      </Badge>
                                    ))}
                                  </div>
                                  <p className="text-sm font-black text-slate-800 mb-2 leading-tight">{note.treatment}</p>
                                  {note.notes && <p className="text-xs italic text-slate-500 leading-relaxed font-medium">"{note.notes}"</p>}
                                  {note.intensity && (
                                    <div className="mt-4 flex items-center gap-2">
                                      <span className="text-[9px] font-black text-slate-300 uppercase">Intensidad</span>
                                      <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(nIdx + 1) * 20}%` }} />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* EJERCICIOS TAB */}
          <TabsContent value="ejercicios" className="space-y-6 outline-none animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-sky-600 flex items-center justify-center shadow-md">
                    <Dumbbell className="h-3.5 w-3.5 text-white" />
                  </div>
                  Home Kine
                </h3>
                <p className="text-slate-500 font-medium text-[11px] mt-1 ml-9">Tu plan personalizado de ejercicios terapéuticos</p>
              </div>
            </div>

            {visiblePrograms.length === 0 ? (
              <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-200 p-20 text-center">
                <div className="h-20 w-20 mx-auto rounded-full bg-slate-50 flex items-center justify-center mb-6">
                  <Play className="h-10 w-10 text-slate-200 ml-1" />
                </div>
                <p className="text-slate-600 font-black text-xl">Sin tareas asignadas</p>
                <p className="text-slate-400 mt-2 max-w-sm mx-auto font-medium">Cuando tu kinesiólogo diseñe tu rutina para casa, la verás aquí con sus respectivos videos.</p>
              </div>
            ) : (
              <div className="space-y-12">
                {visiblePrograms.map((prog: any, pIdx: number) => (
                  <div key={prog.id} className="space-y-8 animate-in slide-in-from-bottom-6 duration-700" style={{ animationDelay: `${pIdx * 100}ms` }}>
                    <Card className="border-none bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl rounded-3xl overflow-hidden relative group">
                      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:rotate-12 group-hover:scale-125 transition-transform duration-1000">
                        <Dumbbell className="h-32 w-32" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-sky-600/10 to-transparent pointer-events-none" />
                      <CardHeader className="p-6 pb-2 relative z-10">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-sky-500 text-white border-none font-black text-[8px] px-2 py-0.5 rounded-md tracking-wider">
                                {prog.status === 'active' ? 'ACTIVO' : 'COMPLETO'}
                              </Badge>
                              <span className="text-white/40 font-black text-[8px] tracking-wider uppercase">{format(new Date(prog.date), "dd/MM/yyyy")}</span>
                            </div>
                            <CardTitle className="text-xl font-black tracking-tight leading-tight">Región: {prog.region || "Multisegmentaria"}</CardTitle>
                          </div>
                          <div className="h-9 w-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-2xl">
                            <Target className="h-5 w-5 text-sky-400" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-10 pt-0 relative z-10">
                        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 shadow-inner max-w-2xl">
                          <p className="text-[10px] font-black text-sky-300 uppercase tracking-[0.2em] mb-3">Objetivo Terapéutico</p>
                          <p className="text-lg font-medium text-slate-100 leading-relaxed italic">
                            "{prog.objective || "Fase de fortalecimiento y optimización de rangos articulares."}"
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {prog.exercises.filter((ex: any) => ex.visibleToPatient).map((ex: any, eIdx: number) => (
                        <Card key={ex.id} className="border-none shadow-xl shadow-slate-200/40 hover:shadow-sky-100 rounded-[2.5rem] overflow-hidden bg-white/70 backdrop-blur-lg border border-white transition-all duration-500 group">
                          <div className="aspect-video bg-slate-900 flex items-center justify-center relative group-hover:scale-105 transition-transform duration-700">
                            {ex.videoUrl ? (
                              <div className="relative w-full h-full cursor-pointer overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="text-white/10 group-hover:scale-125 transition-transform duration-1000">
                                    <Activity className="h-32 w-32" />
                                  </div>
                                </div>
                                <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/20 transition-colors flex items-center justify-center">
                                  <div className="h-16 w-16 rounded-full bg-sky-600 text-white flex items-center justify-center shadow-[0_0_30px_rgba(14,165,233,0.5)] transform group-hover:scale-125 transition-all duration-500">
                                    <Play className="h-8 w-8 ml-1.5" />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-4 text-slate-700">
                                <div className="h-16 w-16 rounded-3xl bg-slate-800 flex items-center justify-center">
                                  <Dumbbell className="h-8 w-8 text-slate-600" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Sin video disponible</span>
                              </div>
                            )}
                          </div>
                          <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-xl font-black text-slate-900 tracking-tight group-hover:text-sky-600 transition-colors">{ex.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-8 pt-0 space-y-6">
                            <div className="grid grid-cols-3 gap-4 py-6 border-y border-slate-50">
                              <div className="text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Series</p>
                                <p className="text-xl font-black text-slate-700">{ex.sets || "-"}</p>
                              </div>
                              <div className="text-center border-x border-slate-50 px-2">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Reps/Tiempo</p>
                                <p className="text-xl font-black text-slate-700 truncate">{ex.reps || ex.duration || "-"}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Carga</p>
                                <p className="text-xl font-black text-slate-700">{ex.weight || "Peso C."}</p>
                              </div>
                            </div>
                            {ex.notes && (
                              <div className="p-5 bg-sky-50/50 rounded-2xl border border-sky-100/30">
                                <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                                  <Info className="h-3 w-3" /> Tips del Kine
                                </p>
                                <p className="text-xs font-medium text-slate-600 leading-relaxed italic">"{ex.notes}"</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* RUTINAS TAB */}
          <TabsContent value="rutinas" className="space-y-6 outline-none animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-indigo-900 flex items-center justify-center shadow-md">
                    <Target className="h-3.5 w-3.5 text-indigo-400" />
                  </div>
                  Performance Hub
                </h3>
                <p className="text-slate-500 font-medium text-[11px] mt-1 ml-9">Tus protocolos de entrenamiento y optimizacion</p>
              </div>
            </div>

            {clinicalRoutines.length === 0 && visibleRoutines.length === 0 ? (
              <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-200 p-20 text-center">
                <div className="h-20 w-20 mx-auto rounded-full bg-slate-50 flex items-center justify-center mb-6">
                  <Target className="h-10 w-10 text-slate-200" />
                </div>
                <p className="text-slate-600 font-black text-xl">Sin protocolos asignados</p>
                <p className="text-slate-400 mt-2 max-w-sm mx-auto font-medium">Aqui visualizaras tus rutinas de entrenamiento funcional y correctivo.</p>
              </div>
            ) : (
              <div className="grid gap-10">
                {/* === NEW: Clinical Entries Routines Grouped by Month === */}
                {sortedMonths.length > 0 && (
                  <Tabs defaultValue={sortedMonths[0]} className="w-full">
                    <TabsList className="flex w-full overflow-x-auto justify-start bg-slate-100 p-1 rounded-xl mb-6 scrollbar-hide">
                      {sortedMonths.map(month => (
                        <TabsTrigger
                          key={month}
                          value={month}
                          className="flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all capitalize"
                        >
                          {month}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {sortedMonths.map(month => (
                      <TabsContent key={month} value={month} className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {routinesByMonth[month].map((routine: any) => {
                          const currentDayIdx = activeDayIndex[routine.id] || 0
                          const currentDay = routine.days[currentDayIdx]
                          const dayLogs = currentDay ? getLogsForDay(routine.id, currentDay.id) : []

                          return (
                            <Card key={routine.id} className="border-none shadow-md rounded-2xl overflow-hidden bg-white/80 backdrop-blur-xl border border-white/50 group">
                              <CardHeader className="bg-slate-900 p-5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-150 transition-transform duration-1000">
                                  <Zap className="h-16 w-16 text-indigo-400" />
                                </div>
                                <div className="flex flex-col md:flex-row justify-between items-center gap-3 relative z-10">
                                  <div className="text-center md:text-left">
                                    <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
                                      <CardTitle className="text-lg font-black text-white tracking-tight">{routine.name}</CardTitle>
                                      {routine.month && routine.month !== 'General' && (
                                        <Badge variant="outline" className="text-[9px] border-indigo-500/50 text-indigo-300 uppercase tracking-wider">
                                          {routine.month}
                                        </Badge>
                                      )}
                                    </div>
                                    <CardDescription className="text-indigo-300 font-bold uppercase tracking-widest text-[8px]">Iniciado {format(new Date(routine.date), "dd/MM/yyyy")}</CardDescription>
                                  </div>
                                  <div className="flex flex-col items-center md:items-end gap-1.5">
                                    {routine.objective && (
                                      <Badge className="bg-indigo-500 text-white border-none font-black px-3 py-1 rounded-lg shadow-lg shadow-indigo-500/20 uppercase text-[8px] tracking-widest">
                                        {routine.objective}
                                      </Badge>
                                    )}
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">{routine.days.length} dia{routine.days.length !== 1 ? 's' : ''}</span>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="p-0">
                                {/* DAY TABS */}
                                <div className="flex items-center gap-1 flex-wrap bg-slate-50 p-2 border-b border-slate-100">
                                  {routine.days.map((day: RoutineDay, dIdx: number) => (
                                    <button
                                      key={day.id}
                                      onClick={() => setActiveDayIndex(prev => ({ ...prev, [routine.id]: dIdx }))}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${dIdx === currentDayIdx
                                        ? 'bg-white text-indigo-600 shadow-sm border border-indigo-200'
                                        : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                                        }`}
                                    >
                                      <Layers className="h-3 w-3 inline mr-1" />
                                      {day.name}
                                      <span className="ml-1 text-[9px] opacity-60">({day.exercises.length})</span>
                                    </button>
                                  ))}
                                </div>

                                {/* EXERCISES FOR CURRENT DAY */}
                                {currentDay && (
                                  <div className="divide-y divide-slate-100/50">
                                    {currentDay.exercises.map((ex: ExerciseItem, i: number) => (
                                      <div key={ex.id} className="group/ex p-5 hover:bg-slate-50/80 transition-all duration-500">
                                        <div className="flex items-center gap-4">
                                          <div className="h-10 w-10 shrink-0 rounded-xl bg-white shadow-lg shadow-slate-200 flex items-center justify-center text-slate-900 text-sm font-black border border-slate-100 group-hover/ex:bg-indigo-600 group-hover/ex:text-white group-hover/ex:scale-110 transition-all duration-500">
                                            {(i + 1).toString().padStart(2, "0")}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <h4 className="text-base font-black text-slate-900 tracking-tight group-hover/ex:text-indigo-600 transition-colors">{ex.title || `Ejercicio ${i + 1}`}</h4>
                                            {ex.description && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{ex.description}</p>}
                                            {ex.notes && <p className="text-[10px] text-slate-400 mt-1 italic">{ex.notes}</p>}
                                          </div>
                                          {ex.setsReps && (
                                            <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-indigo-100 shrink-0">
                                              <Repeat className="h-3 w-3" />
                                              {ex.setsReps}
                                            </div>
                                          )}
                                        </div>
                                        {ex.videoUrl && (() => {
                                          const ytMatch = ex.videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
                                          if (ytMatch) {
                                            return (
                                              <div className="mt-3 rounded-xl overflow-hidden shadow-md border border-slate-200 aspect-video">
                                                <iframe
                                                  src={`https://www.youtube.com/embed/${ytMatch[1]}`}
                                                  title={ex.title || 'Video del ejercicio'}
                                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                  allowFullScreen
                                                  className="w-full h-full"
                                                />
                                              </div>
                                            )
                                          }
                                          return (
                                            <div className="mt-3 rounded-xl overflow-hidden shadow-md border border-slate-200">
                                              <video
                                                src={ex.videoUrl}
                                                controls
                                                className="w-full max-h-[300px] object-contain bg-black"
                                                preload="metadata"
                                              />
                                            </div>
                                          )
                                        })()}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* REGISTER SESSION BUTTON */}
                                {currentDay && (
                                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-transparent border-t border-emerald-100">
                                    <button
                                      onClick={() => openTrackingModal(routine.id, currentDay)}
                                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                                    >
                                      <Clipboard className="h-4 w-4" />
                                      Registrar Sesión — {currentDay.name}
                                    </button>

                                    {/* SESSION HISTORY */}
                                    {dayLogs.length > 0 && (
                                      <div className="mt-3 space-y-1.5">
                                        <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1">
                                          <History className="h-3 w-3" /> Mis Sesiones ({dayLogs.length})
                                        </p>
                                        {dayLogs.slice(0, 3).map((log: ExerciseLog) => (
                                          <div key={log.id} className="flex items-center gap-2 bg-white rounded-lg p-2 border border-emerald-100 text-xs">
                                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                            <span className="font-semibold text-slate-700">{format(new Date(log.date), "dd/MM/yyyy HH:mm")}</span>
                                            <span className="text-slate-400">— {log.exercises.filter(e => e.completed).length}/{log.exercises.length} completados</span>
                                          </div>
                                        ))}
                                        {dayLogs.length > 3 && (
                                          <p className="text-[10px] text-slate-400 text-center">+{dayLogs.length - 3} sesiones anteriores</p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )
                        })}
                      </TabsContent>
                    ))}
                  </Tabs>
                )}

                {/* === OLD: Legacy trainingRoutines === */}
                {visibleRoutines.map((routine: any, rIdx: number) => (
                  <Card key={routine.id} className="border-none shadow-md rounded-2xl overflow-hidden bg-white/80 backdrop-blur-xl border border-white/50 group">
                    <CardHeader className="bg-slate-900 p-5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-150 transition-transform duration-1000">
                        <Zap className="h-16 w-16 text-indigo-400" />
                      </div>
                      <div className="flex flex-col md:flex-row justify-between items-center gap-3 relative z-10">
                        <div className="text-center md:text-left">
                          <CardTitle className="text-lg font-black text-white tracking-tight">{routine.name}</CardTitle>
                          <CardDescription className="text-indigo-300 font-bold mt-1 uppercase tracking-widest text-[8px]">Iniciado {format(new Date(routine.date), "dd/MM/yyyy")}</CardDescription>
                        </div>
                        <div className="flex flex-col items-center md:items-end gap-1.5">
                          <Badge className="bg-indigo-500 text-white border-none font-black px-3 py-1 rounded-lg shadow-lg shadow-indigo-500/20 uppercase text-[8px] tracking-widest">
                            {routine.objective || "Performance"}
                          </Badge>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">{routine.exercises.length} bloques</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-slate-100/50">
                        {routine.exercises.filter((ex: any) => ex.visibleToPatient).map((ex: any, i: number) => (
                          <div key={ex.id} className="group/ex flex flex-col lg:flex-row lg:items-center gap-6 p-6 hover:bg-slate-50/80 transition-all duration-500">
                            <div className="h-12 w-12 shrink-0 rounded-2xl bg-white shadow-xl shadow-slate-200 flex items-center justify-center text-slate-900 text-lg font-black border border-slate-100 group-hover/ex:bg-indigo-600 group-hover/ex:text-white group-hover/ex:scale-110 transition-all duration-500">
                              {(i + 1).toString().padStart(2, "0")}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-black text-slate-900 tracking-tight group-hover/ex:text-indigo-600 transition-colors">{ex.name}</h4>
                              {ex.notes && <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed italic">"{ex.notes}"</p>}
                            </div>
                            <div className="grid grid-cols-4 gap-4 bg-white/50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                              <div className="text-center px-1">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Series</p>
                                <p className="text-base font-black text-slate-900">{ex.sets || "-"}</p>
                              </div>
                              <div className="text-center px-1 border-x border-slate-100">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Reps</p>
                                <p className="text-base font-black text-slate-900">{ex.reps || "-"}</p>
                              </div>
                              <div className="text-center px-1">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Carga</p>
                                <p className="text-base font-black text-indigo-600">{ex.weight || "0"}<span className="text-[10px] ml-0.5">kg</span></p>
                              </div>
                              <div className="text-center px-1 border-l border-slate-100">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Pausa</p>
                                <p className="text-base font-black text-slate-900 flex items-center justify-center gap-1">
                                  {ex.rest || "-"}<Clock className="h-2.5 w-2.5 text-slate-300" />
                                </p>
                              </div>
                            </div>
                            {ex.videoUrl && (
                              <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center cursor-pointer hover:bg-indigo-600 hover:text-white transition-all duration-500 shadow-sm">
                                <Video className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* TRACKING MODAL */}
            {trackingModal && (
              <Dialog open={!!trackingModal} onOpenChange={() => setTrackingModal(null)}>
                <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-black flex items-center gap-2">
                      <Clipboard className="h-5 w-5 text-emerald-600" />
                      Registrar Sesion — {trackingModal.dayName}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    {trackingModal.exercises.map((ex, idx) => (
                      <div key={ex.id} className="border border-slate-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setTrackingForm(prev => ({ ...prev, [ex.id]: { ...prev[ex.id], completed: !prev[ex.id]?.completed } }))}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${trackingForm[ex.id]?.completed
                              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                              : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                              }`}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800">{ex.title || `Ejercicio ${idx + 1}`}</p>
                            {ex.setsReps && <p className="text-[10px] text-indigo-500 font-semibold">{ex.setsReps}</p>}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-0.5 block">Peso (kg)</label>
                            <Input
                              value={trackingForm[ex.id]?.weight || ''}
                              onChange={e => setTrackingForm(prev => ({ ...prev, [ex.id]: { ...prev[ex.id], weight: e.target.value } }))}
                              placeholder="Ej: 15"
                              className="h-8 text-sm"
                              type="number"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-0.5 block">Duracion</label>
                            <Input
                              value={trackingForm[ex.id]?.duration || ''}
                              onChange={e => setTrackingForm(prev => ({ ...prev, [ex.id]: { ...prev[ex.id], duration: e.target.value } }))}
                              placeholder="Ej: 10 min"
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-0.5 block">Notas</label>
                          <Textarea
                            value={trackingForm[ex.id]?.notes || ''}
                            onChange={e => setTrackingForm(prev => ({ ...prev, [ex.id]: { ...prev[ex.id], notes: e.target.value } }))}
                            placeholder="Observaciones..."
                            className="min-h-[40px] text-sm resize-none"
                          />
                        </div>
                      </div>
                    ))}
                    <Button
                      onClick={submitTracking}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Guardar Sesion
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>
          {/* NUTRICIÓN TAB */}
          <TabsContent value="nutricion" className="space-y-6 outline-none animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-emerald-600 flex items-center justify-center shadow-md">
                    <Utensils className="h-3.5 w-3.5 text-white" />
                  </div>
                  Bio-Nutrición
                </h3>
                <p className="text-slate-500 font-medium text-[11px] mt-1 ml-9">Planificación alimentaria y métricas antropométricas</p>
              </div>
            </div>

            {visibleNutritionalEvaluations.length === 0 && visibleRecipes.length === 0 ? (
              <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-200 p-20 text-center">
                <div className="h-20 w-20 mx-auto rounded-full bg-slate-50 flex items-center justify-center mb-6">
                  <Utensils className="h-10 w-10 text-slate-200" />
                </div>
                <p className="text-slate-600 font-black text-xl">Sin registros nutricionales</p>
                <p className="text-slate-400 mt-2 max-w-sm mx-auto font-medium">Aquí encontrarás tus evaluaciones de composición corporal y planes de alimentación.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-10">
                  {visibleNutritionalEvaluations.map((evalu: any) => (
                    <Card key={evalu.id} className="border-none shadow-md rounded-2xl overflow-hidden bg-white/80 backdrop-blur-xl border border-white/50">
                      <CardHeader className="p-5 pb-1 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/30 shadow-sm">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-black text-slate-900 tracking-tight">Evolución Antropométrica</CardTitle>
                            <CardDescription className="text-[10px] font-bold text-slate-400">{format(new Date(evalu.date), "dd 'de' MMMM, yyyy", { locale: es })}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-5 pt-2">
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center group hover:bg-white hover:shadow-xl transition-all duration-500">
                            <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">Peso Corporal</p>
                            <p className="text-2xl font-black text-slate-900">{evalu.weight}<span className="text-xs ml-1 text-slate-400">kg</span></p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center group hover:bg-white hover:shadow-xl transition-all duration-500">
                            <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">Estatura</p>
                            <p className="text-2xl font-black text-slate-900">{evalu.height}<span className="text-xs ml-1 text-slate-400">cm</span></p>
                          </div>
                          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100/30 flex flex-col items-center justify-center group hover:bg-white hover:shadow-xl transition-all duration-500">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-[9px] uppercase font-black text-emerald-600 tracking-widest">IMC Score</p>
                            </div>
                            <p className="text-2xl font-black text-emerald-700">{evalu.imc}</p>
                          </div>
                          <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100/30 flex flex-col items-center justify-center group hover:bg-white hover:shadow-xl transition-all duration-500">
                            <p className="text-[9px] uppercase font-black text-rose-600 tracking-widest mb-1">Grasa Corporal</p>
                            <p className="text-2xl font-black text-rose-700">{evalu.fatPercentage}<span className="text-xs ml-0.5">%</span></p>
                          </div>
                        </div>
                        {evalu.observations && (
                          <div className="p-6 bg-slate-900 rounded-2xl shadow-xl relative overflow-hidden group">
                            <div className="absolute -top-12 -right-12 h-40 w-40 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2 relative z-10">Análisis Nutricional</p>
                            <p className="text-slate-100 text-xs italic font-medium leading-relaxed relative z-10">"{evalu.observations}"</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="space-y-10">
                  {visibleRecipes.map((recipe: any) => (
                    <Card key={recipe.id} className="border-none shadow-xl rounded-3xl overflow-hidden bg-white/90 backdrop-blur-xl border border-white/50 group">
                      <CardHeader className="bg-sky-600 p-6 flex flex-row items-center justify-between border-none">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-xl">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-black text-white tracking-tight">{recipe.title || "Guía Alimentaria"}</CardTitle>
                            <CardDescription className="text-sky-100 font-bold opacity-80 uppercase tracking-widest text-[8px] mt-0.5">Sugerencia de salud personalizada</CardDescription>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-white hover:bg-white/20 hover:text-white transition-all">
                          <Download className="h-5 w-5" />
                        </Button>
                      </CardHeader>
                      <CardContent className="p-6 pt-8">
                        <div className="prose prose-slate prose-sm max-w-none text-slate-600 font-medium leading-relaxed select-text [&>ul]:list-none [&>ul]:p-0 [&>ul>li]:mb-4 [&>ul>li]:p-4 [&>ul>li]:bg-slate-50 [&>ul>li]:rounded-2xl [&>ul>li]:border [&>ul>li]:border-slate-100 [&>h3]:text-slate-900 [&>h3]:font-black [&>h3]:text-xl [&>h3]:mb-6 [&>p]:mb-4" dangerouslySetInnerHTML={{ __html: recipe.content }} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* MASAJES TAB */}
          <TabsContent value="masajes" className="space-y-6 outline-none animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-rose-500 flex items-center justify-center shadow-md">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                  Wellness Therapy
                </h3>
                <p className="text-slate-500 font-medium text-[11px] mt-1 ml-9">Rituales de recuperación y bienestar miofascial</p>
              </div>
            </div>

            {visibleMassageSessions.length === 0 ? (
              <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-200 p-20 text-center">
                <div className="h-20 w-20 mx-auto rounded-full bg-slate-50 flex items-center justify-center mb-6">
                  <Heart className="h-10 w-10 text-slate-200" />
                </div>
                <p className="text-slate-600 font-black text-xl">Sin sesiones activas</p>
                <p className="text-slate-400 mt-2 max-w-sm mx-auto font-medium">Aquí quedarán registradas tus sesiones de masajes terapéuticos y relajación.</p>
              </div>
            ) : (
              <div className="grid gap-10">
                {visibleMassageSessions.map((session: any) => (
                  <Card key={session.id} className="border-none shadow-md rounded-2xl overflow-hidden bg-white/70 backdrop-blur-xl border border-white">
                    <CardHeader className="p-5 pb-1 flex flex-row items-center justify-between border-none">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shadow-inner group-hover:scale-110 transition-transform duration-500">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-black text-slate-900 tracking-tight">Masaje Terapéutico</CardTitle>
                          <CardDescription className="text-[10px] font-bold text-slate-400 mt-0.5">
                            {format(new Date(session.date), "dd 'de' MMMM, yyyy", { locale: es })}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 pt-2">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        <div className="lg:col-span-12 space-y-10">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {session.sessionWork && (
                              <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Trabajo de la Sesión</p>
                                <p className="text-slate-700 text-[15px] leading-relaxed font-medium">{session.sessionWork}</p>
                              </div>
                            )}
                            {session.comments && (
                              <div className="p-8 bg-rose-50/30 rounded-[2.5rem] border border-rose-100/50">
                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-4">Insights del Terapeuta</p>
                                <p className="text-slate-600 text-[15px] italic leading-relaxed font-medium">"{session.comments}"</p>
                              </div>
                            )}
                          </div>

                          {session.zoneNotes && session.zoneNotes.length > 0 && (
                            <div className="space-y-6">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Foco por Áreas Musculares</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {session.zoneNotes.map((note: any, idx: number) => (
                                  <div key={idx} className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex flex-wrap gap-2 mb-4">
                                      {note.zoneIds?.map((zid: string) => (
                                        <Badge key={zid} variant="outline" className="text-[9px] font-black bg-slate-50 border-slate-200 text-slate-500 uppercase px-3 py-1 rounded-full">
                                          {zid.replace('_', ' ')}
                                        </Badge>
                                      ))}
                                    </div>
                                    <p className="text-sm font-medium text-slate-600 line-clamp-3 leading-relaxed italic">"{note.notes}"</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* YOGA TAB */}
          <TabsContent value="yoga" className="space-y-6 outline-none animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-indigo-500 flex items-center justify-center shadow-md">
                    <Flower2 className="h-3.5 w-3.5 text-white" />
                  </div>
                  Conexión Yoga
                </h3>
                <p className="text-slate-500 font-medium text-[11px] mt-1 ml-9">Espacio para la movilidad consciente y equilibrio</p>
              </div>
            </div>

            {visibleYogaSessions.length === 0 ? (
              <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-200 p-20 text-center">
                <div className="h-20 w-20 mx-auto rounded-full bg-slate-50 flex items-center justify-center mb-6">
                  <Flower2 className="h-10 w-10 text-slate-200" />
                </div>
                <p className="text-slate-600 font-black text-xl">Sin sesiones registradas</p>
                <p className="text-slate-400 mt-2 max-w-sm mx-auto font-medium">Tus clases de yoga y progresos en asanas aparecerán aquí.</p>
              </div>
            ) : (
              <div className="grid gap-10">
                {visibleYogaSessions.map((yoga: any, yIdx: number) => (
                  <Card key={yoga.id} className="border-none shadow-md rounded-2xl overflow-hidden bg-white/70 backdrop-blur-xl border border-white group">
                    <CardHeader className="p-5 pb-1 flex flex-row items-center justify-between border-none">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner group-hover:rotate-12 transition-transform duration-700">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-black text-slate-900 tracking-tight">Fluidez Consciente</CardTitle>
                          <CardDescription className="text-[10px] font-bold text-slate-400 mt-0.5">
                            {format(new Date(yoga.date), "dd 'de' MMMM, yyyy", { locale: es })}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 pt-2">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        <div className="lg:col-span-7 space-y-8">
                          {yoga.notes && (
                            <div className="p-10 bg-indigo-900 rounded-[2.5rem] shadow-2xl relative overflow-hidden group/notes">
                              <div className="absolute -bottom-10 -right-10 h-32 w-32 bg-white/10 rounded-full blur-2xl group-hover/notes:scale-150 transition-transform duration-1000" />
                              <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-4">Bitácora de Práctica</p>
                              <p className="text-slate-100 text-lg font-medium leading-relaxed">
                                "{yoga.notes}"
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="lg:col-span-5 space-y-8">
                          {yoga.poses && yoga.poses.length > 0 && (
                            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Asanas Destacadas</p>
                              <div className="flex flex-wrap gap-3">
                                {yoga.poses.map((pose: string, i: number) => (
                                  <Badge key={i} className="bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all duration-500 font-black px-5 py-2 rounded-2xl shadow-sm text-xs cursor-default">
                                    {pose}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* PROGRESO TAB */}
          <TabsContent value="progreso" className="space-y-6 outline-none animate-in fade-in duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Log & Progress Chart */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white/50 backdrop-blur-xl border border-white/40">
                  <CardHeader className="bg-slate-900 p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                      <TrendingUp className="h-24 w-24 text-emerald-400 rotate-12" />
                    </div>
                    <div className="flex items-center justify-between relative z-10">
                      <div>
                        <CardTitle className="text-xl font-black text-white flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
                            <TrendingUp className="h-4 w-4 text-emerald-400" />
                          </div>
                          Evolución TENSE Score
                        </CardTitle>
                        <CardDescription className="text-slate-400 font-medium text-xs mt-0.5">Monitoreo de biometría y adherencia</CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-black text-emerald-400 tracking-tighter">
                          {record?.progressHistory?.[record.progressHistory.length - 1]?.score || 1000}
                        </p>
                        <p className="text-[8px] uppercase font-black tracking-[0.2em] text-slate-500 mt-1 shadow-sm">Puntaje Biomecánico</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 pt-4">
                    <ProgressChart data={record?.progressHistory || []} />

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
                      <div className="group text-center p-2 rounded-xl hover:bg-sky-50 transition-colors duration-500">
                        <div className="h-10 w-10 mx-auto rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-2 shadow-sm">
                          <Droplets className="h-5 w-5" />
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Hidratación</p>
                        <p className="text-xl font-black text-slate-900">{record?.patientLogs?.slice(-1)[0]?.hydration?.amount || 0}<span className="text-xs text-slate-400 ml-0.5">L</span></p>
                      </div>
                      <div className="group text-center p-2 rounded-xl hover:bg-indigo-50 transition-colors duration-500">
                        <div className="h-10 w-10 mx-auto rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 shadow-sm">
                          <Moon className="h-5 w-5" />
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Sueño</p>
                        <p className="text-xl font-black text-slate-900">{record?.patientLogs?.slice(-1)[0]?.sleep?.hours || 0}<span className="text-xs text-slate-400 ml-0.5">h</span></p>
                      </div>
                      <div className="group text-center p-2 rounded-xl hover:bg-amber-50 transition-colors duration-500">
                        <div className="h-10 w-10 mx-auto rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2 shadow-sm">
                          <Activity className="h-5 w-5" />
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Actividad</p>
                        <p className="text-xl font-black text-slate-900">{record?.patientLogs?.slice(-1)[0]?.activity?.steps || 0}<span className="text-[10px] text-slate-400 ml-0.5">pasos</span></p>
                      </div>
                      <div className="group text-center p-2 rounded-xl hover:bg-rose-50 transition-colors duration-500">
                        <div className="h-10 w-10 mx-auto rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2 shadow-sm">
                          <Heart className="h-5 w-5" />
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Dolor (EVA)</p>
                        <p className="text-xl font-black text-rose-600">{record?.patientLogs?.slice(-1)[0]?.pain?.eva || 0}<span className="text-xs text-slate-400 ml-0.5">/10</span></p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl border border-white/50">
                  <CardHeader className="p-6 pb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shadow-inner">
                        <History className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Bitácora de Salud</CardTitle>
                        <CardDescription className="text-xs font-medium text-slate-500">Tus registros diarios históricos</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <div className="space-y-6">
                      {record?.patientLogs && record.patientLogs.length > 0 ? (
                        [...record.patientLogs].reverse().map((log: any, index: number) => (
                          <div key={log.id || index} className="group/log p-6 rounded-[2.5rem] bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-xl transition-all duration-500">
                            <div className="flex justify-between items-center mb-6">
                              <span className="text-lg font-black text-slate-800 capitalize">{format(new Date(log.date), "EEEE d 'de' MMMM", { locale: es })}</span>
                              <Badge className="bg-sky-500 text-white font-black px-4 py-1.5 rounded-full border-none shadow-sm shadow-sky-100 uppercase text-[10px] tracking-widest">
                                {log.mood?.value?.replace('_', ' ') || 'Neutro'}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Hidratación</span>
                                <span className="text-sm font-bold text-slate-700">{log.hydration?.amount}{log.hydration?.unit}</span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Descanso</span>
                                <span className="text-sm font-bold text-slate-700">{log.sleep?.hours}h ({log.sleep?.quality}/5*)</span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Intensidad Dolor</span>
                                <span className="text-sm font-black text-rose-600">{log.pain?.eva}/10 EVA</span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Actividad</span>
                                <Badge variant="outline" className="w-fit text-[10px] px-2 py-0 h-5 font-bold border-slate-200">
                                  {log.activity?.type === 'entrenamiento' ? 'Sesión Entrenamiento' : 'Reposo Activo'}
                                </Badge>
                              </div>
                            </div>
                            {log.notesForSession && (
                              <div className="mt-6 pt-4 border-t border-slate-100/50">
                                <p className="text-sm italic text-slate-500 leading-relaxed font-medium bg-white/50 p-4 rounded-2xl border border-slate-100/30 group-hover/log:bg-sky-50/30 transition-colors">
                                  "{log.notesForSession}"
                                </p>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                          <Info className="h-10 w-10 mx-auto text-slate-300 mb-4" />
                          <p className="text-slate-500 font-bold">Aún no hay registros en tu bitácora.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar Right Column */}
              <div className="space-y-6">
                <Card className="border-none shadow-md bg-emerald-600 text-white rounded-2xl overflow-hidden relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                  <CardHeader className="p-5 pb-1">
                    <CardTitle className="text-[9px] font-black uppercase tracking-wider text-emerald-100 opacity-80">Cumplimiento Tareas</CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 pt-0">
                    <div className="space-y-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-black tracking-tighter">92</span>
                        <span className="text-lg font-bold opacity-60">%</span>
                      </div>
                      <p className="text-[11px] font-medium leading-tight opacity-90">Tu compromiso influye positivamente en tu TENSE Score.</p>
                      <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white w-[92%] rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="p-5 bg-white rounded-2xl shadow-md border border-slate-100 space-y-3">
                  <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                      <Brain className="h-3.5 w-3.5" />
                    </div>
                    TENSE Insight
                  </h4>
                  <p className="text-[11px] font-medium text-slate-600 leading-snug">
                    Tus niveles de dolor disminuyen un <span className="text-emerald-600 font-black">20%</span> los días con descanso superior a 7h.
                  </p>
                  <Button className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[9px] tracking-widest h-9 rounded-lg border-none transition-all">
                    VER MÁS ANÁLISIS
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Mobile Navigation Bar */}
      <footer className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-xl border-t border-slate-100 px-2 py-3 z-50">
        <div className="flex justify-around items-center">
          <Button variant="ghost" onClick={() => setActiveTab('inicio')} className={`flex flex-col h-auto py-1 gap-1.5 ${activeTab === 'inicio' ? 'text-sky-600' : 'text-slate-400'}`}>
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-tighter">Panel</span>
          </Button>
          <Button variant="ghost" onClick={() => setActiveTab('progreso')} className={`flex flex-col h-auto py-1 gap-1.5 ${activeTab === 'progreso' ? 'text-sky-600' : 'text-slate-400'}`}>
            <TrendingUp className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-tighter">Score</span>
          </Button>
          <Button variant="ghost" onClick={() => setActiveTab('tratamientos')} className={`flex flex-col h-auto py-1 gap-1.5 ${activeTab === 'tratamientos' ? 'text-sky-600' : 'text-slate-400'}`}>
            <Activity className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-tighter">Sesiones</span>
          </Button>
          <Button variant="ghost" onClick={() => setActiveTab('ejercicios')} className={`flex flex-col h-auto py-1 gap-1.5 ${activeTab === 'ejercicios' ? 'text-sky-600' : 'text-slate-400'}`}>
            <Dumbbell className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-tighter">Kine</span>
          </Button>
        </div>
      </footer>
    </div >
  )
}
