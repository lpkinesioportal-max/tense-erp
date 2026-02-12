"use client"

import type React from "react"

import { useState } from "react"
import { useData } from "@/lib/data-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Client } from "@/lib/types"
import { Eye, EyeOff, Lock, Building2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ClientDialogProps {
  client?: Client
  onClose: () => void
}

export function ClientDialog({ client, onClose }: ClientDialogProps) {
  const { addClient, updateClient, covenants } = useData()
  const [name, setName] = useState(client?.name || "")
  const [dni, setDni] = useState(client?.dni || "")
  const [email, setEmail] = useState(client?.email || "")
  const [phone, setPhone] = useState(client?.phone || "")
  const [notes, setNotes] = useState(client?.notes || "")
  const [specialDiscount, setSpecialDiscount] = useState(client?.specialDiscount || 0)
  const [password, setPassword] = useState(client?.password || "")
  const [showPassword, setShowPassword] = useState(false)
  const [covenantId, setCovenantId] = useState(client?.covenantId || "none")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (client) {
      updateClient(client.id, {
        name,
        dni,
        email,
        phone,
        notes,
        specialDiscount,
        password: password || undefined,
        covenantId: covenantId === "none" ? undefined : covenantId
      })
    } else {
      addClient({
        name,
        dni,
        email,
        phone,
        notes,
        balance: 0,
        specialDiscount,
        password: password || undefined,
        covenantId: covenantId === "none" ? undefined : covenantId
      })
    }

    onClose()
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{client ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre completo"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dni">DNI</Label>
                <Input id="dni" value={dni} onChange={(e) => setDni(e.target.value)} placeholder="12345678" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+54 11 1234-5678"
                  required
                />
              </div>

              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@ejemplo.com"
                  required
                />
              </div>

              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña para pacientes"
                    className="pl-10 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="covenant">Convenio / Obra Social</Label>
                <Select
                  value={covenantId}
                  onValueChange={(value) => {
                    setCovenantId(value)
                    if (value !== "none") {
                      const selected = covenants?.find(c => c.id === value)
                      if (selected) {
                        setSpecialDiscount(selected.discountPercentage)
                      }
                    } else {
                      setSpecialDiscount(0)
                    }
                  }}
                >
                  <SelectTrigger id="covenant">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin convenio</SelectItem>
                    {(covenants || []).filter(c => c.isActive).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="discount">Descuento (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min={0}
                  max={100}
                  value={specialDiscount}
                  onChange={(e) => setSpecialDiscount(Number(e.target.value))}
                  placeholder="0"
                />
              </div>

              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas internas..."
                  rows={2}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 bg-slate-50 border-t mt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">{client ? "Guardar Cambios" : "Crear Cliente"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
