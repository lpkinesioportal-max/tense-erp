"use client"

import { useState } from "react"
import { supabase, isSupabaseConfigured } from "@/lib/supabase-client"
import { SYNC_CONFIG, migrateLocalStorageToSupabase, checkSupabaseConnection } from "@/lib/supabase-sync"

interface MigrationStatus {
    entity: string
    status: "pending" | "running" | "success" | "error"
    count: number
    errors: string[]
}

export default function MigratePage() {
    const [connectionStatus, setConnectionStatus] = useState<string>("Verificando...")
    const [isConnected, setIsConnected] = useState<boolean | null>(null)
    const [migrations, setMigrations] = useState<MigrationStatus[]>([
        { entity: "Profesionales", status: "pending", count: 0, errors: [] },
        { entity: "Clientes", status: "pending", count: 0, errors: [] },
        { entity: "Usuarios", status: "pending", count: 0, errors: [] },
        { entity: "Turnos", status: "pending", count: 0, errors: [] },
    ])
    const [isRunning, setIsRunning] = useState(false)

    const checkConnection = async () => {
        const result = await checkSupabaseConnection()
        setIsConnected(result.connected)
        setConnectionStatus(result.message)
    }

    const loadLocalData = (key: string) => {
        if (typeof window === "undefined") return []
        const data = localStorage.getItem(key)
        return data ? JSON.parse(data) : []
    }

    const runMigration = async () => {
        setIsRunning(true)

        // Check connection first
        await checkConnection()
        if (!isConnected) {
            setIsRunning(false)
            return
        }

        const entities = [
            { name: "Profesionales", config: SYNC_CONFIG.professionals, index: 0 },
            { name: "Clientes", config: SYNC_CONFIG.clients, index: 1 },
            { name: "Usuarios", config: SYNC_CONFIG.users, index: 2 },
            { name: "Turnos", config: SYNC_CONFIG.appointments, index: 3 },
        ]

        for (const entity of entities) {
            // Update status to running
            setMigrations(prev => prev.map((m, i) =>
                i === entity.index ? { ...m, status: "running" } : m
            ))

            // Load data from localStorage
            const localData = loadLocalData(entity.config.localStorageKey)

            if (localData.length === 0) {
                setMigrations(prev => prev.map((m, i) =>
                    i === entity.index ? { ...m, status: "success", count: 0, errors: ["Sin datos locales"] } : m
                ))
                continue
            }

            // Migrate
            const result = await migrateLocalStorageToSupabase(entity.config, localData)

            setMigrations(prev => prev.map((m, i) =>
                i === entity.index ? {
                    ...m,
                    status: result.success ? "success" : "error",
                    count: result.migratedCount,
                    errors: result.errors
                } : m
            ))
        }

        setIsRunning(false)
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-2">Migración a Supabase</h1>
                <p className="text-gray-600 mb-8">
                    Esta herramienta migra los datos desde localStorage hacia la base de datos Supabase.
                </p>

                {/* Connection Status */}
                <div className={`p-4 rounded-lg mb-6 ${isConnected === null ? "bg-gray-100" :
                        isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                    <div className="flex items-center gap-2">
                        <span className="font-medium">Estado de conexión:</span>
                        <span>{connectionStatus}</span>
                    </div>
                    <button
                        onClick={checkConnection}
                        className="mt-2 text-sm underline"
                    >
                        Verificar conexión
                    </button>
                </div>

                {/* Migration Status */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Entidades a migrar</h2>
                    <div className="space-y-3">
                        {migrations.map((m, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                <span className="font-medium">{m.entity}</span>
                                <div className="flex items-center gap-3">
                                    {m.status === "pending" && <span className="text-gray-400">⏳ Pendiente</span>}
                                    {m.status === "running" && <span className="text-blue-500">🔄 Migrando...</span>}
                                    {m.status === "success" && <span className="text-green-600">✅ {m.count} registros</span>}
                                    {m.status === "error" && <span className="text-red-600">❌ Error</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Run Migration Button */}
                <button
                    onClick={runMigration}
                    disabled={isRunning || isConnected === false}
                    className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition ${isRunning || isConnected === false
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                >
                    {isRunning ? "Migrando..." : "Iniciar Migración"}
                </button>

                {/* Instructions */}
                <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Importante</h3>
                    <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Asegurate de haber ejecutado el script SQL <code>000_master_migration.sql</code> en Supabase primero.</li>
                        <li>• Esta operación no borra los datos locales, solo los copia a Supabase.</li>
                        <li>• Si hay errores, revisá la consola del navegador para más detalles.</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
