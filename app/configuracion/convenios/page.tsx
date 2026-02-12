"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { CovenantsConfig } from "@/components/configuracion/covenants-config"

export default function ConveniosPage() {
    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">Configuración de Convenios</h1>
                    <p className="text-muted-foreground">Administra las obras sociales y descuentos aplicables.</p>
                </div>

                <CovenantsConfig />
            </div>
        </AppLayout>
    )
}
