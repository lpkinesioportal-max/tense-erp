"use client"

import { useState } from "react"
import { useData } from "@/lib/data-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Search, Building2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { Covenant } from "@/lib/types"

export function CovenantsConfig() {
    const { covenants, addCovenant, updateCovenant, deleteCovenant } = useData()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [editingCovenant, setEditingCovenant] = useState<Covenant | null>(null)

    const [formData, setFormData] = useState({
        name: "",
        discountPercentage: 0,
        isActive: true,
    })

    // Reset form when opening dialog
    const handleOpenDialog = (covenant?: Covenant) => {
        if (covenant) {
            setEditingCovenant(covenant)
            setFormData({
                name: covenant.name,
                discountPercentage: covenant.discountPercentage,
                isActive: covenant.isActive,
            })
        } else {
            setEditingCovenant(null)
            setFormData({
                name: "",
                discountPercentage: 0,
                isActive: true,
            })
        }
        setIsDialogOpen(true)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (editingCovenant) {
            updateCovenant(editingCovenant.id, formData)
        } else {
            addCovenant(formData)
        }
        setIsDialogOpen(false)
    }

    const filteredCovenants = (covenants || []).filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-semibold">Convenios y Obras Sociales</h2>
                    <p className="text-sm text-muted-foreground">Gestiona las obras sociales y sus porcentajes de cobertura.</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Convenio
                </Button>
            </div>

            <div className="flex items-center space-x-2 max-w-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar convenio..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Descuento / Cobertura</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Creado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCovenants.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No hay convenios registrados
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCovenants.map((covenant) => (
                                    <TableRow key={covenant.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                                {covenant.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="text-sm">
                                                {covenant.discountPercentage}% OFF
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={covenant.isActive ? "default" : "secondary"}>
                                                {covenant.isActive ? "Activo" : "Inactivo"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {formatDate(covenant.createdAt)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(covenant)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => {
                                                        if (confirm('¿Estás seguro de eliminar este convenio?')) {
                                                            deleteCovenant(covenant.id)
                                                        }
                                                    }}
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCovenant ? "Editar Convenio" : "Nuevo Convenio"}</DialogTitle>
                        <DialogDescription>
                            Configura los detalles del convenio o cobertura medica.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre del Convenio</Label>
                            <Input
                                id="name"
                                placeholder="Ej: OSDE 210, Particular, PAMI"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="discount">Porcentaje de Descuento (%)</Label>
                            <div className="relative">
                                <Input
                                    id="discount"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.discountPercentage}
                                    onChange={(e) => setFormData({ ...formData, discountPercentage: Number(e.target.value) })}
                                    className="pl-8"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">%</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Este porcentaje se descontará automáticamente del precio base del servicio.
                            </p>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Switch
                                id="isActive"
                                checked={formData.isActive}
                                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                            />
                            <Label htmlFor="isActive">Convenio Habilitado</Label>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit">Guardar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
