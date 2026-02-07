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
import { Eye, EyeOff, Lock } from "lucide-react"

interface ClientDialogProps {
  client?: Client
  onClose: () => void
}

export function ClientDialog({ client, onClose }: ClientDialogProps) {
  const { addClient, updateClient } = useData()
  const [name, setName] = useState(client?.name || "")
  const [dni, setDni] = useState(client?.dni || "")
  const [email, setEmail] = useState(client?.email || "")
  const [phone, setPhone] = useState(client?.phone || "")
  const [notes, setNotes] = useState(client?.notes || "")
  const [specialDiscount, setSpecialDiscount] = useState(client?.specialDiscount || 0)
  const [password, setPassword] = useState(client?.password || "")
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (client) {
      updateClient(client.id, { name, dni, email, phone, notes, specialDiscount, password: password || undefined })
    } else {
      addClient({ name, dni, email, phone, notes, balance: 0, specialDiscount, password: password || undefined })
    }

    onClose()
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{client ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
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

            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña para iniciar sesión"
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
              <p className="text-xs text-muted-foreground">
                Esta contraseña será usada por el cliente para iniciar sesión en su cuenta
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="discount">Descuento Especial (%)</Label>
              <Input
                id="discount"
                type="number"
                min={0}
                max={100}
                value={specialDiscount}
                onChange={(e) => setSpecialDiscount(Number(e.target.value))}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Este descuento es absorbido por TENSE, no afecta al profesional
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas sobre el cliente..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
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
