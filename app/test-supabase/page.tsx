"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

export default function TestSupabase() {
    const [status, setStatus] = useState("Cargando...")
    const [details, setDetails] = useState("")

    useEffect(() => {
        async function test() {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

            if (!supabaseUrl || !supabaseAnonKey) {
                setStatus("Error")
                setDetails("Faltan variables de entorno (NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY)")
                return
            }

            try {
                const supabase = createClient(supabaseUrl, supabaseAnonKey)
                const { data, error, count } = await supabase
                    .from("liquidaciones_diarias")
                    .select("*", { count: "exact", head: true })

                if (error) {
                    setStatus("❌ Error")
                    setDetails(`Error de Supabase: ${error.message}`)
                } else {
                    setStatus("✅ ¡Conexión Exitosa!")
                    setDetails(`Se pudo conectar correctamente. Total de registros en 'liquidaciones_diarias': ${count}`)
                }
            } catch (err: any) {
                setStatus("❌ Error Inesperado")
                setDetails(err.message || "Error desconocido")
            }
        }

        test()
    }, [])

    return (
        <div className="p-10 font-sans">
            <h1 className="text-2xl font-bold mb-4">Prueba de Conexión Supabase</h1>
            <div className={`p-4 rounded-md ${status.includes("✅") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                <strong>Estado:</strong> {status}
            </div>
            <div className="mt-4 p-4 bg-gray-100 rounded-md">
                <strong>Detalles:</strong> {details}
            </div>
            <div className="mt-8 text-sm text-gray-500">
                Esta página es temporal y sirve para verificar que las variables de entorno estén bien configuradas.
            </div>
        </div>
    )
}
