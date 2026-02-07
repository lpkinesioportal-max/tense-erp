"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, User, Users, Stethoscope } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await login(email, password)
    if (result.success) {
      if (result.isClient) {
        router.push("/mi-cuenta")
      } else if (result.isProfessional) {
        router.push("/mi-portal")
      } else {
        router.push("/dashboard")
      }
    } else {
      setError("Credenciales inválidas")
    }
    setLoading(false)
  }

  const handleDemoLogin = async (role: "super_admin" | "receptionist" | "professional" | "client") => {
    const credentials: Record<string, { email: string; password: string }> = {
      super_admin: { email: "tense.kinesio@gmail.com", password: "Camaron1" },
      receptionist: { email: "recepcion.tense@gmail.com", password: "Tense2022" },
      professional: { email: "roberto@tense.com", password: "Prof2024" },
      client: { email: "ramiro@gmail.com", password: "demo" },
    }
    setLoading(true)
    const cred = credentials[role]
    const result = await login(cred.email, cred.password)
    if (result.success) {
      if (result.isClient) {
        router.push("/mi-cuenta")
      } else if (result.isProfessional) {
        router.push("/mi-portal")
      } else {
        router.push("/dashboard")
      }
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 to-sky-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-sky-600 shadow-lg">
            <Calendar className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-sky-900">TENSE</CardTitle>
          <CardDescription>Sistema de gestión integral</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="staff" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="staff" className="flex items-center gap-1 text-xs sm:text-sm">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Staff</span>
              </TabsTrigger>
              <TabsTrigger value="professional" className="flex items-center gap-1 text-xs sm:text-sm">
                <Stethoscope className="h-4 w-4" />
                <span className="hidden sm:inline">Profesional</span>
              </TabsTrigger>
              <TabsTrigger value="client" className="flex items-center gap-1 text-xs sm:text-sm">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Paciente</span>
              </TabsTrigger>
            </TabsList>

            {/* Staff Tab */}
            <TabsContent value="staff">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="staff-email">Email</Label>
                  <Input
                    id="staff-email"
                    type="email"
                    placeholder="tu@tense.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-password">Contraseña</Label>
                  <Input
                    id="staff-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700" disabled={loading}>
                  {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                </Button>
              </form>

              <div className="mt-6">
                <p className="mb-3 text-center text-sm text-muted-foreground">Demo rápido</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleDemoLogin("super_admin")}>
                    Super Admin
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDemoLogin("receptionist")}>
                    Recepción
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Professional Tab */}
            <TabsContent value="professional">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prof-email">Email</Label>
                  <Input
                    id="prof-email"
                    type="email"
                    placeholder="profesional@tense.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prof-password">Contraseña</Label>
                  <Input
                    id="prof-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700" disabled={loading}>
                  {loading ? "Iniciando sesión..." : "Acceder a mi portal"}
                </Button>
              </form>

              <div className="mt-6">
                <p className="mb-3 text-center text-sm text-muted-foreground">Demo profesional</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-transparent"
                  onClick={() => handleDemoLogin("professional")}
                >
                  Ingresar como Dr. Roberto Fernández
                </Button>
              </div>
            </TabsContent>

            {/* Client Tab */}
            <TabsContent value="client">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client-email">Email</Label>
                  <Input
                    id="client-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-password">Contraseña</Label>
                  <Input
                    id="client-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700" disabled={loading}>
                  {loading ? "Iniciando sesión..." : "Acceder a mi cuenta"}
                </Button>
              </form>

              <div className="mt-6">
                <p className="mb-3 text-center text-sm text-muted-foreground">Demo paciente</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-transparent"
                  onClick={() => handleDemoLogin("client")}
                >
                  Ingresar como Ramiro González
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
