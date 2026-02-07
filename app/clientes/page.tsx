"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { ClientsList } from "@/components/clientes/clients-list"

export default function ClientesPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pacientes</h1>
          <p className="text-muted-foreground">Gestión de pacientes y sus historiales</p>
        </div>

        <ClientsList />
      </div>
    </AppLayout>
  )
}
