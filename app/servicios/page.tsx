"use client"

import { useState, useMemo } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { useData } from "@/lib/data-context"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Edit, Trash2, Briefcase, Package, Clock, Check } from "lucide-react"
import type { ServiceConfig, ServicePack } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

const SERVICE_COLORS = [
  { name: "Verde", bg: "bg-green-500", text: "text-green-500", value: "green" },
  { name: "Azul", bg: "bg-blue-500", text: "text-blue-500", value: "blue" },
  { name: "Violeta", bg: "bg-violet-500", text: "text-violet-500", value: "violet" },
  { name: "Rosa", bg: "bg-pink-500", text: "text-pink-500", value: "pink" },
  { name: "Naranja", bg: "bg-orange-500", text: "text-orange-500", value: "orange" },
  { name: "Cyan", bg: "bg-cyan-500", text: "text-cyan-500", value: "cyan" },
  { name: "Amarillo", bg: "bg-yellow-500", text: "text-yellow-500", value: "yellow" },
  { name: "Rojo", bg: "bg-red-500", text: "text-red-500", value: "red" },
  { name: "Indigo", bg: "bg-indigo-500", text: "text-indigo-500", value: "indigo" },
  { name: "Teal", bg: "bg-teal-500", text: "text-teal-500", value: "teal" },
  { name: "Esmeralda", bg: "bg-emerald-500", text: "text-emerald-500", value: "emerald" },
]

const getColorClasses = (colorValue: string | undefined) => {
  const color = SERVICE_COLORS.find((c) => c.value === colorValue)
  return color || SERVICE_COLORS[0]
}

export default function ServiciosPage() {
  const { hasPermission } = useAuth()
  const {
    serviceConfigs,
    addServiceConfig,
    updateServiceConfig,
    servicePacks,
    addServicePack,
    updateServicePack,
    deleteServicePack,
  } = useData()

  const [activeTab, setActiveTab] = useState("servicios")
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false)
  const [isPackDialogOpen, setIsPackDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<ServiceConfig | null>(null)
  const [editingPack, setEditingPack] = useState<ServicePack | null>(null)

  const [serviceData, setServiceData] = useState({
    name: "",
    basePrice: 0,
    duration: 60,
    requiresDeposit: true,
    recommendedDepositPercentage: 50,
    isActive: true,
    color: "emerald",
    description: "",
  })

  const [packFormData, setPackFormData] = useState({
    serviceId: "",
    name: "",
    sessionsCount: 4,
    validityDays: 60,
    maxReschedules: 2,
    price: 0,
    requiresDeposit: true,
    depositAmount: 0,
    isActive: true,
    isUnlimited: false,
  })

  const [search, setSearch] = useState("")

  const filteredServices = useMemo(() => {
    return (serviceConfigs || []).filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
  }, [serviceConfigs, search])

  const filteredPacks = useMemo(() => {
    return servicePacks.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
  }, [servicePacks, search])

  const depositAmount = serviceData.requiresDeposit
    ? (serviceData.basePrice * serviceData.recommendedDepositPercentage) / 100
    : 0

  // Calculate pack price per session and discount
  const getServiceBasePrice = (serviceId: string) => {
    const service = (serviceConfigs || []).find((s) => s.id === serviceId)
    return service?.basePrice || 0
  }

  const calculatePackDiscount = () => {
    if (!packFormData.serviceId || packFormData.isUnlimited) return 0
    const basePrice = getServiceBasePrice(packFormData.serviceId)
    const totalIndividualPrice = basePrice * packFormData.sessionsCount
    if (totalIndividualPrice === 0) return 0
    return Math.round(((totalIndividualPrice - packFormData.price) / totalIndividualPrice) * 100)
  }

  const calculatePricePerSession = () => {
    if (packFormData.isUnlimited || packFormData.sessionsCount === 0) return 0
    return Math.round(packFormData.price / packFormData.sessionsCount)
  }

  // Service handlers
  const handleServiceSubmit = () => {
    // Remove extra properties that are not in ServiceConfig and map correctly
    const { duration, ...restServiceData } = serviceData

    const serviceDataToSubmit = {
      ...restServiceData,
      standardDuration: duration,
      professionalPercentage: 50, // Default value
      createdAt: editingService?.createdAt || new Date(),
      updatedAt: new Date(),
    }

    if (editingService) {
      updateServiceConfig(editingService.id, serviceDataToSubmit)
    } else {
      addServiceConfig(serviceDataToSubmit)
    }
    setIsServiceDialogOpen(false)
    setEditingService(null)
    resetServiceForm()
  }

  const handleEditService = (service: ServiceConfig) => {
    setEditingService(service)
    setServiceData({
      name: service.name,
      basePrice: service.basePrice,
      duration: service.standardDuration,
      requiresDeposit: service.requiresDeposit,
      recommendedDepositPercentage: service.recommendedDepositPercentage,
      isActive: service.isActive,
      color: service.color || "emerald", // Updated default color
      description: service.description || "",
    })
    setIsServiceDialogOpen(true)
  }

  const handleDeleteService = (id: string) => {
    if (confirm("¿Eliminar este servicio?")) {
      updateServiceConfig(id, { isActive: false })
    }
  }

  const resetServiceForm = () => {
    setServiceData({
      name: "",
      basePrice: 0,
      duration: 60,
      requiresDeposit: true,
      recommendedDepositPercentage: 50,
      isActive: true,
      color: "emerald", // Updated default color
      description: "",
    })
  }

  // Pack handlers
  const handlePackSubmit = () => {
    const packData = {
      serviceId: packFormData.serviceId,
      name: packFormData.name,
      sessionsCount: packFormData.isUnlimited ? 0 : packFormData.sessionsCount,
      validityDays: packFormData.validityDays,
      maxReschedules: packFormData.maxReschedules,
      totalPrice: packFormData.price,
      pricePerSession: calculatePricePerSession(),
      discountPercent: calculatePackDiscount(),
      requiresDeposit: packFormData.requiresDeposit,
      depositAmount: packFormData.depositAmount,
      isActive: packFormData.isActive,
    }

    if (editingPack) {
      updateServicePack(editingPack.id, packData)
    } else {
      addServicePack(packData)
    }
    setIsPackDialogOpen(false)
    setEditingPack(null)
    resetPackForm()
  }

  const handleEditPack = (pack: ServicePack) => {
    setEditingPack(pack)
    setPackFormData({
      serviceId: pack.serviceId,
      name: pack.name,
      sessionsCount: pack.sessionsCount || 4,
      validityDays: pack.validityDays,
      maxReschedules: pack.maxReschedules || 2,
      price: pack.totalPrice || (pack as any).price || 0,
      requiresDeposit: pack.requiresDeposit || false,
      depositAmount: pack.depositAmount || 0,
      isActive: pack.isActive,
      isUnlimited: pack.sessionsCount === 0,
    })
    setIsPackDialogOpen(true)
  }

  const handleDeletePack = (packId: string) => {
    deleteServicePack(packId)
  }

  const resetPackForm = () => {
    setPackFormData({
      serviceId: "",
      name: "",
      sessionsCount: 4,
      validityDays: 60,
      maxReschedules: 2,
      price: 0,
      requiresDeposit: true,
      depositAmount: 0,
      isActive: true,
      isUnlimited: false,
    })
  }

  const getServiceName = (serviceId: string) => {
    const service = (serviceConfigs || []).find((s) => s.id === serviceId)
    return service?.name || "Servicio no encontrado"
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Servicios y Packs</h1>
            <p className="text-muted-foreground">Configura los servicios y packs de sesiones</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="servicios" className="gap-2">
                <Briefcase className="h-4 w-4" />
                Servicios
              </TabsTrigger>
              <TabsTrigger value="packs" className="gap-2">
                <Package className="h-4 w-4" />
                Packs de Sesiones
              </TabsTrigger>
            </TabsList>

            {activeTab === "servicios" ? (
              <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-sky-500 hover:bg-sky-600"
                    onClick={() => {
                      setEditingService(null)
                      resetServiceForm()
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Servicio
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingService ? "Editar Servicio" : "Nuevo Servicio"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nombre del servicio</Label>
                        <Input
                          value={serviceData.name}
                          onChange={(e) => setServiceData({ ...serviceData, name: e.target.value })}
                          placeholder="Ej: Entrenamiento"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Duración (min)</Label>
                        <Input
                          type="number"
                          value={serviceData.duration}
                          onChange={(e) => setServiceData({ ...serviceData, duration: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Color del servicio</Label>
                      <div className="flex flex-wrap gap-2">
                        {SERVICE_COLORS.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => setServiceData({ ...serviceData, color: color.value })}
                            className={`w-7 h-7 rounded-full ${color.bg} flex items-center justify-center transition-all hover:scale-110 ${serviceData.color === color.value ? "ring-2 ring-offset-2 ring-gray-400" : ""
                              }`}
                            title={color.name}
                          >
                            {serviceData.color === color.value && <Check className="h-3 w-3 text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Descripción (opcional)</Label>
                      <Textarea
                        value={serviceData.description}
                        onChange={(e) => setServiceData({ ...serviceData, description: e.target.value })}
                        placeholder="Descripción del servicio..."
                        rows={2}
                        className="resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Precio por sesión</Label>
                      <Input
                        type="number"
                        value={serviceData.basePrice}
                        onChange={(e) => setServiceData({ ...serviceData, basePrice: Number(e.target.value) })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                      <div>
                        <Label className="text-sm">Requiere seña</Label>
                        <p className="text-xs text-muted-foreground">El cliente debe abonar seña para confirmar</p>
                      </div>
                      <Switch
                        checked={serviceData.requiresDeposit}
                        onCheckedChange={(checked) => setServiceData({ ...serviceData, requiresDeposit: checked })}
                      />
                    </div>

                    {serviceData.requiresDeposit && (
                      <div className="space-y-2 p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Porcentaje de seña</Label>
                          <span className="text-sm font-medium">{serviceData.recommendedDepositPercentage}%</span>
                        </div>
                        <Input
                          type="range"
                          min="10"
                          max="100"
                          value={serviceData.recommendedDepositPercentage}
                          onChange={(e) =>
                            setServiceData({
                              ...serviceData,
                              recommendedDepositPercentage: Number(e.target.value),
                            })
                          }
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          Monto de seña:{" "}
                          <span className="font-semibold text-foreground">
                            {formatCurrency((serviceData.basePrice * serviceData.recommendedDepositPercentage) / 100)}
                          </span>
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                      <div>
                        <Label className="text-sm">Servicio activo</Label>
                        <p className="text-xs text-muted-foreground">Disponible para agendar turnos</p>
                      </div>
                      <Switch
                        checked={serviceData.isActive}
                        onCheckedChange={(checked) => setServiceData({ ...serviceData, isActive: checked })}
                      />
                    </div>

                    <Button onClick={handleServiceSubmit} className="w-full bg-sky-500 hover:bg-sky-600">
                      {editingService ? "Guardar cambios" : "Crear servicio"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Dialog open={isPackDialogOpen} onOpenChange={setIsPackDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-sky-500 hover:bg-sky-600"
                    onClick={() => {
                      setEditingPack(null)
                      resetPackForm()
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Pack
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editingPack ? "Editar Pack" : "Nuevo Pack de Sesiones"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Servicio asociado</Label>
                      <select
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                        value={packFormData.serviceId}
                        onChange={(e) => setPackFormData({ ...packFormData, serviceId: e.target.value })}
                      >
                        <option value="">Seleccionar servicio...</option>
                        {(serviceConfigs || [])
                          .filter((s) => s.isActive)
                          .map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.name} - {formatCurrency(service.basePrice)}/sesión
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Nombre del pack</Label>
                      <Input
                        value={packFormData.name}
                        onChange={(e) => setPackFormData({ ...packFormData, name: e.target.value })}
                        placeholder="Ej: Pack 4 Sesiones, Plan Anual..."
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label>Pack ilimitado / Anual</Label>
                        <p className="text-xs text-muted-foreground">
                          Sin límite de sesiones (ej: plan mensual o anual)
                        </p>
                      </div>
                      <Switch
                        checked={packFormData.isUnlimited}
                        onCheckedChange={(checked) => setPackFormData({ ...packFormData, isUnlimited: checked })}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {!packFormData.isUnlimited && (
                        <div className="space-y-2">
                          <Label>Cantidad de sesiones</Label>
                          <Input
                            type="number"
                            value={packFormData.sessionsCount}
                            onChange={(e) =>
                              setPackFormData({ ...packFormData, sessionsCount: Number(e.target.value) })
                            }
                            min={1}
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Vigencia (días)</Label>
                        <Input
                          type="number"
                          value={packFormData.validityDays}
                          onChange={(e) => setPackFormData({ ...packFormData, validityDays: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Reprogramaciones</Label>
                        <Input
                          type="number"
                          value={packFormData.maxReschedules}
                          onChange={(e) => setPackFormData({ ...packFormData, maxReschedules: Number(e.target.value) })}
                          min={0}
                        />
                        <p className="text-xs text-muted-foreground">Por sesión</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Precio del Pack</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                          <Input
                            type="number"
                            className="pl-7"
                            value={packFormData.price}
                            onChange={(e) => setPackFormData({ ...packFormData, price: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                    </div>

                    {packFormData.serviceId && !packFormData.isUnlimited && packFormData.sessionsCount > 0 && (
                      <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Precio individual ({packFormData.sessionsCount} sesiones):</span>
                          <span className="line-through text-muted-foreground">
                            {formatCurrency(getServiceBasePrice(packFormData.serviceId) * packFormData.sessionsCount)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Precio por sesión en pack:</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(calculatePricePerSession())}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Descuento:</span>
                          <Badge className="bg-green-100 text-green-700">{calculatePackDiscount()}% OFF</Badge>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label>Requiere seña</Label>
                        <p className="text-xs text-muted-foreground">Monto inicial para reservar el pack</p>
                      </div>
                      <Switch
                        checked={packFormData.requiresDeposit}
                        onCheckedChange={(checked) => setPackFormData({ ...packFormData, requiresDeposit: checked })}
                      />
                    </div>

                    {packFormData.requiresDeposit && (
                      <div className="space-y-2">
                        <Label>Monto de seña</Label>
                        <Input
                          type="number"
                          value={packFormData.depositAmount}
                          onChange={(e) => setPackFormData({ ...packFormData, depositAmount: Number(e.target.value) })}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label>Pack activo</Label>
                        <p className="text-xs text-muted-foreground">Disponible para la venta</p>
                      </div>
                      <Switch
                        checked={packFormData.isActive}
                        onCheckedChange={(checked) => setPackFormData({ ...packFormData, isActive: checked })}
                      />
                    </div>

                    <Button
                      onClick={handlePackSubmit}
                      className="w-full bg-sky-500 hover:bg-sky-600"
                      disabled={!packFormData.serviceId || !packFormData.name || packFormData.price <= 0}
                    >
                      {editingPack ? "Guardar cambios" : "Crear pack"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={activeTab === "servicios" ? "Buscar servicios..." : "Buscar packs..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 max-w-sm"
              />
            </div>
          </div>

          <TabsContent value="servicios" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Color</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-center">Duración</TableHead>
                      <TableHead className="text-center">Seña</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServices.map((service) => {
                      const colorClasses = getColorClasses(service.color)
                      return (
                        <TableRow key={service.id}>
                          <TableCell>
                            <div className={`w-6 h-6 rounded-full ${colorClasses.bg}`} />
                          </TableCell>
                          <TableCell className="font-medium">{service.name}</TableCell>
                          <TableCell className="text-right">{formatCurrency(service.basePrice)}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="gap-1">
                              <Clock className="h-3 w-3" />
                              {service.standardDuration} min
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {service.requiresDeposit ? (
                              <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                                {service.recommendedDepositPercentage}%
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">No requiere</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={service.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}
                            >
                              {service.isActive ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEditService(service)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteService(service.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {filteredServices.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No hay servicios configurados
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="packs" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pack</TableHead>
                      <TableHead>Servicio</TableHead>
                      <TableHead className="text-center">Sesiones</TableHead>
                      <TableHead className="text-center">Vigencia</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-center">Descuento</TableHead>
                      <TableHead className="text-center">Seña</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPacks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          No hay packs configurados
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPacks.map((pack) => (
                        <TableRow key={pack.id}>
                          <TableCell className="font-medium">{pack.name}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {getServiceName(pack.serviceId)}
                          </TableCell>
                          <TableCell className="text-center">
                            {pack.sessionsCount === 0 ? (
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                Ilimitado
                              </Badge>
                            ) : (
                              <span>{pack.sessionsCount}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground">{pack.validityDays} días</TableCell>
                          <TableCell className="text-right">
                            <div>
                              <p className="font-semibold">{formatCurrency(pack.totalPrice || (pack as any).price || 0)}</p>
                              {(!pack.sessionsCount || pack.sessionsCount > 0) && (
                                <p className="text-xs text-muted-foreground">
                                  {pack.sessionsCount > 0
                                    ? formatCurrency(Math.round((pack.totalPrice || (pack as any).price || 0) / pack.sessionsCount))
                                    : formatCurrency(0)
                                  }/sesión
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {(() => {
                              const serviceBasePrice = getServiceBasePrice(pack.serviceId)
                              const currentPrice = pack.totalPrice || (pack as any).price || 0
                              const totalIndividual = serviceBasePrice * pack.sessionsCount
                              const discount = totalIndividual > 0
                                ? Math.round(((totalIndividual - currentPrice) / totalIndividual) * 100)
                                : 0
                              return discount > 0 ? (
                                <Badge className="bg-green-100 text-green-700 border-0">
                                  {discount}% OFF
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )
                            })()}
                          </TableCell>
                          <TableCell className="text-center">
                            {pack.requiresDeposit ? (
                              <span className="text-sm">{formatCurrency(pack.depositAmount || 0)}</span>
                            ) : (
                              <span className="text-muted-foreground text-sm">No</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={pack.isActive ? "default" : "secondary"}>
                              {pack.isActive ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="icon" variant="ghost" onClick={() => handleEditPack(pack)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive"
                                onClick={() => handleDeletePack(pack.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
