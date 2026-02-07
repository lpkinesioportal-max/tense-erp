"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { useData } from "@/lib/data-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Building2, Save, MapPin, Phone, Mail, Globe, Clock, Banknote } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function EmpresaConfigPage() {
    const { companyInfo, updateCompanyInfo } = useData()
    const [formData, setFormData] = useState(companyInfo)
    const { toast } = useToast()

    const handleSave = () => {
        updateCompanyInfo(formData)
        toast({
            title: "Configuración guardada",
            description: "Los datos de la empresa han sido actualizados correctamente.",
        })
    }

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Datos de la Empresa</h1>
                        <p className="text-muted-foreground">Configura la información básica de tu centro</p>
                    </div>
                    <Button onClick={handleSave} className="gap-2">
                        <Save className="h-4 w-4" />
                        Guardar Cambios
                    </Button>
                </div>

                <div className="grid gap-6">
                    <Card className="overflow-hidden border-none shadow-premium">
                        <CardHeader className="bg-slate-50/50 border-b">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-primary" />
                                <CardTitle className="text-lg">Información General</CardTitle>
                            </div>
                            <CardDescription>Datos identificatorios y legales</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre Fantasía</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ej: Tense Kinesiología"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cuit">CUIT / Identificación Fiscal</Label>
                                <Input
                                    id="cuit"
                                    value={formData.cuit}
                                    onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                                    placeholder="30-XXXXXXXX-X"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-none shadow-premium">
                        <CardHeader className="bg-slate-50/50 border-b">
                            <div className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-primary" />
                                <CardTitle className="text-lg">Contacto y Ubicación</CardTitle>
                            </div>
                            <CardDescription>Cómo pueden encontrarte tus clientes</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="address">Dirección</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="address"
                                        className="pl-9"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Calle 123, Ciudad, Provincia"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Teléfono</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="phone"
                                        className="pl-9"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+54 11 XXXX-XXXX"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email de Contacto</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        className="pl-9"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="contacto@empresa.com"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="website">Sitio Web</Label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="website"
                                        className="pl-9"
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        placeholder="www.tusitio.com"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-none shadow-premium">
                        <CardHeader className="bg-slate-50/50 border-b">
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                <CardTitle className="text-lg">Configuración del Sistema</CardTitle>
                            </div>
                            <CardDescription>Preferencias regionales y horarias</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="currency">Moneda</Label>
                                <div className="relative">
                                    <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="currency"
                                        className="pl-9"
                                        value={formData.currency}
                                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                        placeholder="ARS, USD, EUR..."
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="hours">Horario de Atención</Label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="hours"
                                        className="pl-9"
                                        value={formData.openingHours}
                                        onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                                        placeholder="Ej: Lun a Vie 08:00 - 20:00"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    )
}
