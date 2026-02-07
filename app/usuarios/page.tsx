"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AppLayout } from "@/components/layout/app-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UsersList } from "@/components/usuarios/users-list"
import { UserDialog } from "@/components/usuarios/user-dialog"
import { UserProfile } from "@/components/usuarios/user-profile"
import { ProfessionalsConfig } from "@/components/usuarios/professionals-config"
import { PermissionsMatrix } from "@/components/usuarios/permissions-matrix"
import type { User } from "@/lib/types"

export default function UsuariosPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null
  const defaultTab = searchParams?.get("tab") || "users"

  const [activeTab, setActiveTab] = useState(defaultTab)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [viewingUser, setViewingUser] = useState<User | null>(null)

  useEffect(() => {
    if (user?.role === "cliente") {
      router.push("/dashboard")
    }
  }, [user, router])

  if (!user || user.role === "cliente") {
    return null
  }

  const handleEdit = (userToEdit: User) => {
    setEditingUser(userToEdit)
    setDialogOpen(true)
  }

  const handleNew = () => {
    setEditingUser(null)
    setDialogOpen(true)
  }

  if (viewingUser) {
    return (
      <AppLayout>
        <UserProfile user={viewingUser} onBack={() => setViewingUser(null)} />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión del Equipo</h1>
          <p className="text-muted-foreground">Administra el personal, roles y configuración de profesionales</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Cuentas y Acceso</TabsTrigger>
            {user?.role === "super_admin" && (
              <>
                <TabsTrigger value="professionals">Agenda y Servicios</TabsTrigger>
                <TabsTrigger value="permissions">Permisos</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="users">
            <UsersList onEdit={handleEdit} onNew={handleNew} onViewProfile={setViewingUser} />
          </TabsContent>

          {user?.role === "super_admin" && (
            <>
              <TabsContent value="professionals">
                <ProfessionalsConfig />
              </TabsContent>

              <TabsContent value="permissions">
                <PermissionsMatrix />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      <UserDialog open={dialogOpen} onOpenChange={setDialogOpen} user={editingUser} />
    </AppLayout>
  )
}
