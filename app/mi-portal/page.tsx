"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Calendar,
  Users,
  Wallet,
  MessageSquare,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  FileText,
  DollarSign,
  TrendingUp,
  Send,
  Activity,
  Bell,
  Target,
  CheckSquare,
  Plus,
  Check,
  Clock,
} from "lucide-react"
import { format, addDays, startOfWeek, isSameDay } from "date-fns"
import { es } from "date-fns/locale"

export default function MiPortalPage() {
  const router = useRouter()
  const { user, professional, isProfessional, logout, isLoading } = useAuth()
  const {
    appointments,
    clients,
    transactions,
    serviceConfigs,
    conversations,
    chatMessages,
    addChatMessage,
    goals,
    updateGoal,
    tasks,
    addTask,
    updateTask,
  } = useData()

  const [activeTab, setActiveTab] = useState("agenda")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [showAppointmentDetail, setShowAppointmentDetail] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [newMessage, setNewMessage] = useState("")
  const [searchClients, setSearchClients] = useState("")

  const [showTaskDialog, setShowTaskDialog] = useState(false)
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    category: "clinical" as "administrative" | "clients" | "inventory" | "financial" | "clinical" | "other",
    dueDate: "",
  })

  useEffect(() => {
    if (!isLoading && (!isProfessional || !professional)) {
      router.push("/login")
    }
  }, [isLoading, isProfessional, professional, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!professional || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  // Filter appointments for this professional
  const myAppointments = appointments.filter((apt) => apt.professionalId === professional.id)
  const todayAppointments = myAppointments.filter((apt) => isSameDay(new Date(apt.date), new Date()))
  const weekAppointments = myAppointments.filter((apt) => {
    const aptDate = new Date(apt.date)
    return aptDate >= weekStart && aptDate < addDays(weekStart, 7)
  })

  // Get clients for this professional (based on appointments)
  const myClientIds = [...new Set(myAppointments.map((apt) => apt.clientId))]
  const myClients = clients.filter((c) => myClientIds.includes(c.id))

  // Filter transactions for this professional
  const myTransactions = transactions.filter((t) => t.professionalId === professional.id)

  const myGoals = goals.filter((g) => g.targetType === "professional" && g.targetId === professional.id)
  const myTasks = tasks.filter((t) => t.assignedToType === "professional" && t.assignedTo === professional.id)

  // Calculate earnings
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const monthlyEarnings = myAppointments
    .filter((apt) => new Date(apt.date) >= monthStart && apt.status === "attended")
    .reduce((sum, apt) => sum + (apt.professionalEarnings || 0), 0)

  const pendingEarnings = myAppointments
    .filter((apt) => apt.status === "attended" && !apt.isPaid)
    .reduce((sum, apt) => sum + (apt.professionalEarnings || 0), 0)

  const calculateOccupationRate = () => {
    const now = new Date()
    const daysPassed = now.getDate()

    // Get working days from professional schedule
    const workingDays = professional.workingDays || ["lunes", "martes", "miércoles", "jueves", "viernes"]
    const dayNames = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]

    // Count working days passed this month
    let workingDaysPassed = 0
    for (let d = 1; d <= daysPassed; d++) {
      const date = new Date(now.getFullYear(), now.getMonth(), d)
      const dayName = dayNames[date.getDay()]
      if (workingDays.includes(dayName)) {
        workingDaysPassed++
      }
    }

    // Calculate hours per day
    const startTimeStr = professional.workingHours?.start || "09:00"
    const endTimeStr = professional.workingHours?.end || "18:00"
    const startHour = Number.parseInt(startTimeStr.split(":")[0])
    const endHour = Number.parseInt(endTimeStr.split(":")[0])
    const hoursPerDay = endHour - startHour

    // Assume 1 hour per appointment on average
    const slotsPerDay = hoursPerDay
    const totalPossibleSlots = workingDaysPassed * slotsPerDay

    // Count appointments this month
    const now2 = new Date()
    const monthlyAppointments = myAppointments.filter((apt) => {
      const aptDate = new Date(apt.date)
      return aptDate >= monthStart && aptDate <= now2 && apt.status !== "cancelled"
    }).length

    if (totalPossibleSlots === 0) return 0
    return Math.round((monthlyAppointments / totalPossibleSlots) * 100)
  }

  const occupationRate = calculateOccupationRate()

  const getClient = (clientId: string) => clients.find((c) => c.id === clientId)
  const getService = (serviceId: string) => serviceConfigs.find((s) => s.id === serviceId)

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending_deposit: { label: "Sin seña", variant: "outline" },
      confirmed: { label: "Confirmado", variant: "default" },
      attended: { label: "Asistió", variant: "secondary" },
      no_show: { label: "No asistió", variant: "destructive" },
      follow_up: { label: "Seguimiento", variant: "outline" },
      cancelled: { label: "Cancelado", variant: "destructive" },
    }
    const { label, variant } = config[status] || { label: status, variant: "outline" as const }
    return <Badge variant={variant}>{label}</Badge>
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const myConversations = conversations.filter((c) => c.professionalId === professional.id)

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return

    addChatMessage({
      conversationId: selectedConversation.id,
      senderId: professional.id,
      senderName: professional.name,
      senderRole: "professional",
      content: newMessage.trim(),
      isRead: false,
    })
    setNewMessage("")
  }

  const getConversationMessages = (conversationId: string) => {
    return (chatMessages || [])
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }

  const filteredClients = myClients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchClients.toLowerCase()) ||
      c.email.toLowerCase().includes(searchClients.toLowerCase()) ||
      c.dni.includes(searchClients),
  )

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const getGoalProgress = (goal: any) => {
    if (goal.targetValue === 0) return 0
    return Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
  }

  const getGoalTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      revenue: "Ingresos",
      appointments: "Turnos",
      attendance: "Asistencia",
      new_clients: "Nuevos clientes",
      occupation_rate: "Tasa de ocupación",
      custom: "Personalizado",
    }
    return labels[type] || type
  }

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { label: string; className: string }> = {
      low: { label: "Baja", className: "bg-gray-100 text-gray-700" },
      medium: { label: "Media", className: "bg-blue-100 text-blue-700" },
      high: { label: "Alta", className: "bg-orange-100 text-orange-700" },
      urgent: { label: "Urgente", className: "bg-red-100 text-red-700" },
    }
    const { label, className } = config[priority] || { label: priority, className: "" }
    return <Badge className={className}>{label}</Badge>
  }

  const handleCreateTask = () => {
    if (!taskForm.title.trim()) return

    addTask({
      title: taskForm.title,
      description: taskForm.description,
      priority: taskForm.priority,
      category: taskForm.category,
      status: "pending",
      assignedTo: professional.id,
      assignedToType: "professional",
      assignedBy: professional.id,
      dueDate: taskForm.dueDate ? new Date(taskForm.dueDate) : undefined,
    })

    setTaskForm({
      title: "",
      description: "",
      priority: "medium",
      category: "clinical",
      dueDate: "",
    })
    setShowTaskDialog(false)
  }

  const handleCompleteTask = (taskId: string) => {
    updateTask(taskId, { status: "completed", completedAt: new Date() })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 bg-sky-600">
              <AvatarFallback className="bg-sky-600 text-white">
                {professional.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-semibold text-lg">{professional.name}</h1>
              <p className="text-sm text-muted-foreground">{professional.specialty}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {myConversations.reduce((sum, c) => sum + c.unreadCount, 0) > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                  {myConversations.reduce((sum, c) => sum + c.unreadCount, 0)}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-sky-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{todayAppointments.length}</p>
                  <p className="text-xs text-muted-foreground">Turnos hoy</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{myClients.length}</p>
                  <p className="text-xs text-muted-foreground">Pacientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${monthlyEarnings.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Ganado este mes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{occupationRate}%</p>
                  <p className="text-xs text-muted-foreground">Ocupación del mes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white border shadow-sm flex-wrap">
            <TabsTrigger value="agenda" className="data-[state=active]:bg-sky-100 data-[state=active]:text-sky-700">
              <Calendar className="h-4 w-4 mr-2" />
              Agenda
            </TabsTrigger>
            <TabsTrigger value="pacientes" className="data-[state=active]:bg-sky-100 data-[state=active]:text-sky-700">
              <Users className="h-4 w-4 mr-2" />
              Pacientes
            </TabsTrigger>
            <TabsTrigger value="objetivos" className="data-[state=active]:bg-sky-100 data-[state=active]:text-sky-700">
              <Target className="h-4 w-4 mr-2" />
              Objetivos
              {myGoals.filter((g) => g.status === "active").length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 justify-center">
                  {myGoals.filter((g) => g.status === "active").length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tareas" className="data-[state=active]:bg-sky-100 data-[state=active]:text-sky-700">
              <CheckSquare className="h-4 w-4 mr-2" />
              Tareas
              {myTasks.filter((t) => t.status === "pending" || t.status === "in_progress").length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 justify-center">
                  {myTasks.filter((t) => t.status === "pending" || t.status === "in_progress").length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="finanzas" className="data-[state=active]:bg-sky-100 data-[state=active]:text-sky-700">
              <Wallet className="h-4 w-4 mr-2" />
              Finanzas
            </TabsTrigger>
            <TabsTrigger value="mensajes" className="data-[state=active]:bg-sky-100 data-[state=active]:text-sky-700">
              <MessageSquare className="h-4 w-4 mr-2" />
              Mensajes
              {myConversations.reduce((sum, c) => sum + c.unreadCount, 0) > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 justify-center">
                  {myConversations.reduce((sum, c) => sum + c.unreadCount, 0)}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="config" className="data-[state=active]:bg-sky-100 data-[state=active]:text-sky-700">
              <Settings className="h-4 w-4 mr-2" />
              Config
            </TabsTrigger>
          </TabsList>

          {/* AGENDA TAB */}
          <TabsContent value="agenda" className="space-y-4">
            {/* Week Navigation */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, -7))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="font-semibold">
                    {format(weekStart, "d MMM", { locale: es })} -{" "}
                    {format(addDays(weekStart, 6), "d MMM yyyy", { locale: es })}
                  </h2>
                  <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, 7))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Week Days */}
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((day) => {
                    const dayAppointments = weekAppointments.filter((apt) => isSameDay(new Date(apt.date), day))
                    const isToday = isSameDay(day, new Date())
                    const isSelected = isSameDay(day, selectedDate)

                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={`p-2 rounded-lg text-center transition-colors ${isSelected
                            ? "bg-sky-600 text-white"
                            : isToday
                              ? "bg-sky-100 text-sky-700"
                              : "hover:bg-gray-100"
                          }`}
                      >
                        <p className="text-xs font-medium">{format(day, "EEE", { locale: es })}</p>
                        <p className="text-lg font-bold">{format(day, "d")}</p>
                        {dayAppointments.length > 0 && (
                          <Badge
                            variant={isSelected ? "secondary" : "default"}
                            className="mt-1 text-[10px] px-1.5 py-0"
                          >
                            {dayAppointments.length}
                          </Badge>
                        )}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Day Appointments */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-sky-600" />
                  {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {myAppointments.filter((apt) => isSameDay(new Date(apt.date), selectedDate)).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No hay turnos para este día</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myAppointments
                      .filter((apt) => isSameDay(new Date(apt.date), selectedDate))
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((apt) => {
                        const client = getClient(apt.clientId)
                        const service = getService(apt.serviceId)

                        return (
                          <div
                            key={apt.id}
                            className="flex items-center gap-4 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => {
                              setSelectedAppointment(apt)
                              setShowAppointmentDetail(true)
                            }}
                          >
                            <div className="text-center">
                              <p className="text-lg font-bold text-sky-600">{apt.startTime}</p>
                              <p className="text-xs text-muted-foreground">{apt.endTime}</p>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{client?.name || "Cliente desconocido"}</p>
                              <p className="text-sm text-muted-foreground">{service?.name}</p>
                            </div>
                            <div className="text-right">
                              {getStatusBadge(apt.status)}
                              <p className="text-sm font-medium mt-1">${apt.finalPrice.toLocaleString()}</p>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PACIENTES TAB */}
          <TabsContent value="pacientes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-sky-600" />
                  Mis Pacientes
                </CardTitle>
                <div className="relative">
                  <Input
                    placeholder="Buscar por nombre, email o DNI..."
                    value={searchClients}
                    onChange={(e) => setSearchClients(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {filteredClients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No se encontraron pacientes</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredClients.map((client) => {
                      const clientAppointments = myAppointments.filter((apt) => apt.clientId === client.id)
                      const lastAppointment = clientAppointments.sort(
                        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
                      )[0]

                      return (
                        <div key={client.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-gray-50">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-sky-100 text-sky-700">
                              {client.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">{client.name}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {client.phone}
                              </span>
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {client.email}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{clientAppointments.length} turnos</p>
                            {lastAppointment && (
                              <p className="text-xs text-muted-foreground">
                                Último: {format(new Date(lastAppointment.date), "dd/MM/yyyy")}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/historia-clinica/${client.id}`)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            HC
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="objetivos" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Active Goals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-sky-600" />
                    Objetivos Activos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {myGoals.filter((g) => g.status === "active").length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No tienes objetivos asignados</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {myGoals
                        .filter((g) => g.status === "active")
                        .map((goal) => {
                          const progress = getGoalProgress(goal)
                          const isCompleted = progress >= 100

                          return (
                            <div key={goal.id} className="p-4 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-medium">{goal.title}</h3>
                                <Badge variant={isCompleted ? "default" : "outline"}>
                                  {getGoalTypeLabel(goal.type)}
                                </Badge>
                              </div>
                              {goal.description && (
                                <p className="text-sm text-muted-foreground mb-3">{goal.description}</p>
                              )}
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>
                                    {goal.currentValue.toLocaleString()} / {goal.targetValue.toLocaleString()}{" "}
                                    {goal.unit}
                                  </span>
                                  <span className={isCompleted ? "text-green-600 font-bold" : ""}>{progress}%</span>
                                </div>
                                <Progress value={progress} className={isCompleted ? "bg-green-100" : ""} />
                              </div>
                              <div className="flex justify-between mt-3 text-xs text-muted-foreground">
                                <span>
                                  Período:{" "}
                                  {goal.period === "weekly"
                                    ? "Semanal"
                                    : goal.period === "monthly"
                                      ? "Mensual"
                                      : goal.period === "quarterly"
                                        ? "Trimestral"
                                        : "Anual"}
                                </span>
                                <span>Vence: {format(new Date(goal.endDate), "dd/MM/yyyy")}</span>
                              </div>
                              {isCompleted && (
                                <div className="mt-3 p-2 bg-green-50 rounded-lg flex items-center gap-2 text-green-700">
                                  <Check className="h-4 w-4" />
                                  <span className="text-sm font-medium">¡Objetivo cumplido!</span>
                                </div>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Occupation Rate Visual */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                    Tasa de Ocupación
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <div className="relative inline-flex items-center justify-center">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="transparent"
                          className="text-gray-200"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="transparent"
                          strokeDasharray={`${occupationRate * 3.52} 352`}
                          className={
                            occupationRate >= 80
                              ? "text-green-500"
                              : occupationRate >= 50
                                ? "text-amber-500"
                                : "text-red-500"
                          }
                        />
                      </svg>
                      <span className="absolute text-3xl font-bold">{occupationRate}%</span>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                      {occupationRate >= 80
                        ? "¡Excelente ocupación!"
                        : occupationRate >= 50
                          ? "Buena ocupación, hay margen de mejora"
                          : "Hay oportunidad de aumentar la ocupación"}
                    </p>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">Turnos este mes</span>
                      <span className="font-bold">
                        {myAppointments.filter((apt) => new Date(apt.date) >= monthStart).length}
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">Turnos atendidos</span>
                      <span className="font-bold">
                        {
                          myAppointments.filter((apt) => new Date(apt.date) >= monthStart && apt.status === "attended")
                            .length
                        }
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">Cancelaciones</span>
                      <span className="font-bold text-red-600">
                        {
                          myAppointments.filter(
                            (apt) =>
                              new Date(apt.date) >= monthStart &&
                              (apt.status === "cancelled" || apt.status === "no_show"),
                          ).length
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Completed Goals */}
            {myGoals.filter((g) => g.status === "completed").length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <Check className="h-5 w-5" />
                    Objetivos Cumplidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-3">
                    {myGoals
                      .filter((g) => g.status === "completed")
                      .map((goal) => (
                        <div key={goal.id} className="p-3 border border-green-200 rounded-lg bg-green-50">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-green-800">{goal.title}</h3>
                            <Check className="h-5 w-5 text-green-600" />
                          </div>
                          <p className="text-sm text-green-700 mt-1">
                            {goal.currentValue.toLocaleString()} {goal.unit} alcanzados
                          </p>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tareas" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-sky-600" />
                  Mis Tareas
                </CardTitle>
                <Button size="sm" onClick={() => setShowTaskDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Tarea
                </Button>
              </CardHeader>
              <CardContent>
                {myTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No tienes tareas pendientes</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Pending / In Progress */}
                    {myTasks
                      .filter((t) => t.status === "pending" || t.status === "in_progress")
                      .sort((a, b) => {
                        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
                        return priorityOrder[a.priority] - priorityOrder[b.priority]
                      })
                      .map((task) => (
                        <div key={task.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 mt-0.5"
                            onClick={() => handleCompleteTask(task.id)}
                          >
                            <div className="h-5 w-5 rounded-full border-2 border-gray-300 hover:border-green-500 hover:bg-green-50" />
                          </Button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium">{task.title}</h3>
                              {getPriorityBadge(task.priority)}
                              {task.status === "in_progress" && <Badge variant="secondary">En progreso</Badge>}
                            </div>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                            )}
                            {task.dueDate && (
                              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Vence: {format(new Date(task.dueDate), "dd/MM/yyyy")}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}

                    {/* Completed */}
                    {myTasks.filter((t) => t.status === "completed").length > 0 && (
                      <>
                        <div className="border-t my-4 pt-4">
                          <h4 className="text-sm font-medium text-muted-foreground mb-3">Completadas</h4>
                        </div>
                        {myTasks
                          .filter((t) => t.status === "completed")
                          .slice(0, 5)
                          .map((task) => (
                            <div
                              key={task.id}
                              className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50 opacity-75"
                            >
                              <div className="h-6 w-6 shrink-0 flex items-center justify-center">
                                <Check className="h-5 w-5 text-green-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium line-through text-muted-foreground">{task.title}</h3>
                                {task.completedAt && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Completada: {format(new Date(task.completedAt), "dd/MM/yyyy HH:mm")}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* HISTORIAL TAB */}
          <TabsContent value="historial" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-sky-600" />
                  Historial de Turnos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {myAppointments
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 20)
                    .map((apt) => {
                      const client = getClient(apt.clientId)
                      const service = getService(apt.serviceId)

                      return (
                        <div key={apt.id} className="flex items-center gap-4 p-3 rounded-lg border">
                          <div className="text-center min-w-[70px]">
                            <p className="text-sm font-medium">{format(new Date(apt.date), "dd/MM")}</p>
                            <p className="text-xs text-muted-foreground">{apt.startTime}</p>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{client?.name}</p>
                            <p className="text-sm text-muted-foreground">{service?.name}</p>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(apt.status)}
                            <p className="text-sm mt-1">
                              <span className="text-muted-foreground">Ganancia:</span>{" "}
                              <span className="font-medium text-green-600">
                                ${apt.professionalEarnings?.toLocaleString() || 0}
                              </span>
                            </p>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FINANZAS TAB */}
          <TabsContent value="finanzas" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Resumen del Mes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span>Turnos atendidos</span>
                    <span className="font-bold">
                      {
                        myAppointments.filter((apt) => new Date(apt.date) >= monthStart && apt.status === "attended")
                          .length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                    <span>Total ganado</span>
                    <span className="font-bold text-emerald-600">${monthlyEarnings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                    <span>Pendiente de cobro</span>
                    <span className="font-bold text-amber-600">${pendingEarnings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-sky-50 rounded-lg">
                    <span>Comisión TENSE</span>
                    <span className="font-medium text-sky-600">
                      $
                      {myAppointments
                        .filter((apt) => new Date(apt.date) >= monthStart && apt.status === "attended")
                        .reduce((sum, apt) => sum + (apt.finalPrice - (apt.professionalEarnings || 0)), 0)
                        .toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span>Descuentos absorbidos por TENSE</span>
                    <span className="font-medium text-purple-600">
                      $
                      {myAppointments
                        .filter((apt) => new Date(apt.date) >= monthStart && apt.status === "attended")
                        .reduce((sum, apt) => {
                          const discount = apt.discount || 0
                          const absorbedBy = apt.discountAbsorbedBy || "both"
                          if (absorbedBy === "tense") {
                            return sum + discount
                          } else if (absorbedBy === "both") {
                            return sum + discount / 2
                          }
                          return sum
                        }, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-sky-600" />
                    Estadísticas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Tasa de asistencia</span>
                    <span className="font-bold">
                      {myAppointments.length > 0
                        ? Math.round(
                          (myAppointments.filter((apt) => apt.status === "attended").length / myAppointments.length) *
                          100,
                        )
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Precio promedio</span>
                    <span className="font-bold">
                      $
                      {myAppointments.length > 0
                        ? Math.round(
                          myAppointments.reduce((sum, apt) => sum + apt.finalPrice, 0) / myAppointments.length,
                        ).toLocaleString()
                        : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total pacientes únicos</span>
                    <span className="font-bold">{myClients.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Promedio sesiones por paciente</span>
                    <span className="font-bold">
                      {myClients.length > 0
                        ? (myAppointments.filter((apt) => apt.status === "attended").length / myClients.length).toFixed(
                          1,
                        )
                        : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Turnos este mes</span>
                    <span className="font-bold">
                      {myAppointments.filter((apt) => new Date(apt.date) >= monthStart).length}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Últimas Transacciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {myTransactions.slice(0, 10).map((txn) => (
                    <div key={txn.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                      <div>
                        <p className="font-medium text-sm">{txn.notes || txn.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(txn.date), "dd/MM/yyyy HH:mm")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${txn.type.includes("payment") ? "text-green-600" : "text-red-600"}`}>
                          {txn.type.includes("payment") ? "+" : "-"}${txn.amount.toLocaleString()}
                        </p>
                        <Badge variant="outline" className="text-[10px]">
                          {txn.paymentMethod === "cash" ? "Efectivo" : "Transferencia"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MENSAJES TAB */}
          <TabsContent value="mensajes" className="space-y-4">
            <Card className="h-[600px] flex">
              {/* Conversations List */}
              <div className="w-1/3 border-r">
                <div className="p-3 border-b">
                  <h3 className="font-semibold">Conversaciones</h3>
                </div>
                <ScrollArea className="h-[550px]">
                  {myConversations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No hay conversaciones</p>
                    </div>
                  ) : (
                    <div className="space-y-1 p-2">
                      {myConversations
                        .sort(
                          (a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime(),
                        )
                        .map((conv) => {
                          const client = getClient(conv.clientId)
                          const isSelected = selectedConversation?.id === conv.id

                          return (
                            <button
                              key={conv.id}
                              onClick={() => setSelectedConversation(conv)}
                              className={`w-full p-3 rounded-lg text-left transition-colors ${isSelected ? "bg-sky-100" : "hover:bg-gray-100"
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-sky-200 text-sky-700">
                                    {client?.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .slice(0, 2) || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className="font-medium truncate">{client?.name || "Cliente"}</p>
                                    {conv.unreadCount > 0 && (
                                      <Badge variant="destructive" className="h-5 w-5 p-0 justify-center text-[10px]">
                                        {conv.unreadCount}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                                </div>
                              </div>
                            </button>
                          )
                        })}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-3 border-b flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-sky-200 text-sky-700">
                          {getClient(selectedConversation.clientId)
                            ?.name.split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .slice(0, 2) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{getClient(selectedConversation.clientId)?.name || "Cliente"}</p>
                        <p className="text-xs text-muted-foreground">
                          {getClient(selectedConversation.clientId)?.phone}
                        </p>
                      </div>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-3">
                        {getConversationMessages(selectedConversation.id).map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.senderRole === "professional" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[70%] p-3 rounded-lg ${msg.senderRole === "professional"
                                  ? "bg-sky-600 text-white"
                                  : "bg-gray-100 text-gray-900"
                                }`}
                            >
                              <p className="text-sm">{msg.content}</p>
                              <p
                                className={`text-[10px] mt-1 ${msg.senderRole === "professional" ? "text-sky-200" : "text-gray-500"}`}
                              >
                                {format(new Date(msg.createdAt), "HH:mm")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    {/* Input */}
                    <div className="p-3 border-t flex gap-2">
                      <Input
                        placeholder="Escribe un mensaje..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      />
                      <Button onClick={handleSendMessage}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Selecciona una conversación</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* CONFIG TAB */}
          <TabsContent value="config" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-sky-600" />
                    Mi Perfil
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarFallback className="bg-sky-600 text-white text-2xl">
                        {professional.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-bold">{professional.name}</h2>
                      <p className="text-muted-foreground">{professional.specialty}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{professional.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{professional.phone}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-medium mb-2">Servicios que ofrece</h3>
                    <div className="flex flex-wrap gap-2">
                      {(professional.services || []).map((serviceId) => {
                        const service = getService(serviceId)
                        return service ? (
                          <Badge key={serviceId} variant="secondary">
                            {service.name}
                          </Badge>
                        ) : null
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-sky-600" />
                    Disponibilidad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">Horario</span>
                      <span className="font-medium">
                        {professional.workingHours?.start || "09:00"} - {professional.workingHours?.end || "18:00"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">Duración estándar</span>
                      <span className="font-medium">{professional.standardDuration || 60} min</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">Comisión TENSE</span>
                      <span className="font-medium">{100 - (professional.commissionRate || 65)}%</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Días laborales</h4>
                    <div className="flex gap-1">
                      {["L", "M", "X", "J", "V", "S", "D"].map((day, i) => {
                        const dayNames = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
                        const workingDays = professional.workingDays || [
                          "lunes",
                          "martes",
                          "miércoles",
                          "jueves",
                          "viernes",
                        ]
                        const isWorking = workingDays.includes(dayNames[i])

                        return (
                          <div
                            key={day}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${isWorking ? "bg-sky-600 text-white" : "bg-gray-100 text-gray-400"
                              }`}
                          >
                            {day}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Tarea</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="Ej: Revisar historia clínica de..."
              />
            </div>
            <div>
              <Label>Descripción (opcional)</Label>
              <Textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Detalles adicionales..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prioridad</Label>
                <Select value={taskForm.priority} onValueChange={(v: any) => setTaskForm({ ...taskForm, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoría</Label>
                <Select value={taskForm.category} onValueChange={(v: any) => setTaskForm({ ...taskForm, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clinical">Clínica</SelectItem>
                    <SelectItem value="administrative">Administrativa</SelectItem>
                    <SelectItem value="clients">Clientes</SelectItem>
                    <SelectItem value="other">Otra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Fecha límite (opcional)</Label>
              <Input
                type="date"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTaskDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTask} disabled={!taskForm.title.trim()}>
              Crear Tarea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Detail Dialog */}
      <Dialog open={showAppointmentDetail} onOpenChange={setShowAppointmentDetail}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle del Turno</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-sky-100 text-sky-700 text-xl">
                    {getClient(selectedAppointment.clientId)
                      ?.name.split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .slice(0, 2) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-bold">{getClient(selectedAppointment.clientId)?.name}</h3>
                  <p className="text-muted-foreground">{getService(selectedAppointment.serviceId)?.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium">{format(new Date(selectedAppointment.date), "dd/MM/yyyy")}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Horario</p>
                  <p className="font-medium">
                    {selectedAppointment.startTime} - {selectedAppointment.endTime}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Estado</p>
                  {getStatusBadge(selectedAppointment.status)}
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Precio</p>
                  <p className="font-medium">${selectedAppointment.finalPrice.toLocaleString()}</p>
                </div>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Tu ganancia</p>
                <p className="text-xl font-bold text-green-600">
                  ${selectedAppointment.professionalEarnings?.toLocaleString() || 0}
                </p>
              </div>

              <Button
                className="w-full"
                onClick={() => router.push(`/historia-clinica/${selectedAppointment.clientId}`)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Ver Historia Clínica
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
