"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const createSupabaseClient = () => {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options) {
          cookieStore.delete(name)
        },
      },
    },
  )
}

/**
 * Genera una liquidación diaria para un profesional en una fecha específica
 * Recibe datos ya calculados desde el cliente
 * Changed to accept pre-calculated data instead of querying the non-existent 'turnos' table
 */
export async function generateDailyLiquidation(
  profesionalId: string,
  fecha: Date,
  totalBase: number,
  totalFacturado: number,
  comisionProf: number,
  comisionTense: number,
  descuentosTense: number,
) {
  try {
    const supabase = createSupabaseClient()

    const saldoTenseDebe = comisionTense - descuentosTense

    const { data: liquidacion, error: saveError } = await supabase
      .from("liquidaciones_diarias")
      .insert({
        profesional_id: profesionalId,
        fecha: fecha.toISOString().split("T")[0],
        total_facturado: totalFacturado,
        total_base: totalBase,
        comision_prof: comisionProf,
        comision_tense: comisionTense,
        descuentos_tense: descuentosTense,
        saldo_prof_debe: 0,
        saldo_tense_debe: saldoTenseDebe,
        estado: "pendiente",
        incluida_en_liquidacion_mensual: false,
      })
      .select()
      .single()

    if (saveError) throw saveError

    return {
      error: null,
      data: liquidacion,
    }
  } catch (error) {
    console.error("[v0] Error generating daily liquidation:", error)
    return {
      error: error instanceof Error ? error.message : "Error desconocido",
      data: null,
    }
  }
}

/**
 * Genera una liquidación mensual consolidando todas las diarias del mes
 */
export async function generateMonthlyLiquidation(profesionalId: string, mes: number, anio: number) {
  try {
    const supabase = createSupabaseClient()

    // 1. Obtener todas las liquidaciones diarias del mes que aún no estén incluidas
    const { data: dailies, error: dailyError } = await supabase
      .from("liquidaciones_diarias")
      .select("*")
      .eq("profesional_id", profesionalId)
      .eq("incluida_en_liquidacion_mensual", false)
      .gte("fecha", `${anio}-${String(mes).padStart(2, "0")}-01`)
      .lt("fecha", `${anio}-${String(mes + 1).padStart(2, "0")}-01`)

    if (dailyError) throw dailyError

    if (!dailies || dailies.length === 0) {
      return {
        error: "No hay liquidaciones diarias para este mes",
        data: null,
      }
    }

    // 2. Sumar totales
    const totalBase = dailies.reduce((sum, d) => sum + d.total_base, 0)
    const totalFacturado = dailies.reduce((sum, d) => sum + d.total_facturado, 0)
    const comisionProf = dailies.reduce((sum, d) => sum + d.comision_prof, 0)
    const comisionTense = dailies.reduce((sum, d) => sum + d.comision_tense, 0)
    const descuentosTense = dailies.reduce((sum, d) => sum + d.descuentos_tense, 0)

    const saldoTenseFinal = comisionTense - descuentosTense
    const saldoProfFinal = comisionProf

    // 3. Crear liquidación mensual
    const { data: monthly, error: monthlyError } = await supabase
      .from("liquidaciones_mensuales")
      .insert({
        profesional_id: profesionalId,
        mes,
        anio,
        total_facturado_mes: totalFacturado,
        total_base_mes: totalBase,
        comision_prof_mes: comisionProf,
        comision_tense_mes: comisionTense,
        descuentos_tense_mes: descuentosTense,
        saldo_prof_final: saldoProfFinal,
        saldo_tense_final: saldoTenseFinal,
        estado: "pendiente",
      })
      .select()
      .single()

    if (monthlyError) throw monthlyError

    // 4. Marcar diarias como incluidas
    const { error: updateError } = await supabase
      .from("liquidaciones_diarias")
      .update({ incluida_en_liquidacion_mensual: true })
      .in(
        "id",
        dailies.map((d) => d.id),
      )

    if (updateError) throw updateError

    return {
      error: null,
      data: monthly,
    }
  } catch (error) {
    console.error("[v0] Error generating monthly liquidation:", error)
    return {
      error: error instanceof Error ? error.message : "Error desconocido",
      data: null,
    }
  }
}

/**
 * Crea un traspaso desde caja profesional a caja admin
 */
export async function createCashTransfer(liquidacionMensualId: string, monto: number, profesionalId?: string) {
  try {
    const supabase = createSupabaseClient()

    const { data: transfer, error } = await supabase
      .from("traspasos_caja")
      .insert({
        liquidacion_mensual_id: liquidacionMensualId,
        profesional_id: profesionalId || null,
        monto,
        origen: "caja_profesionales",
        destino: "caja_admin",
        fecha: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // Actualizar estado de liquidación mensual a "traspasada"
    const { error: updateError } = await supabase
      .from("liquidaciones_mensuales")
      .update({ estado: "traspasada" })
      .eq("id", liquidacionMensualId)

    if (updateError) throw updateError

    return {
      error: null,
      data: transfer,
    }
  } catch (error) {
    console.error("[v0] Error creating cash transfer:", error)
    return {
      error: error instanceof Error ? error.message : "Error desconocido",
      data: null,
    }
  }
}

/**
 * Obtiene todas las liquidaciones diarias de un profesional
 */
export async function getDailyLiquidations(profesionalId: string, limit = 30) {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from("liquidaciones_diarias")
      .select("*")
      .eq("profesional_id", profesionalId)
      .order("fecha", { ascending: false })
      .limit(limit)

    if (error) throw error

    return {
      error: null,
      data: data || [],
    }
  } catch (error) {
    console.error("[v0] Error fetching daily liquidations:", error)
    return {
      error: error instanceof Error ? error.message : "Error desconocido",
      data: [],
    }
  }
}

/**
 * Obtiene liquidaciones mensuales de un profesional
 */
export async function getMonthlyLiquidations(profesionalId: string, anio?: number) {
  try {
    const supabase = createSupabaseClient()

    let query = supabase.from("liquidaciones_mensuales").select("*").eq("profesional_id", profesionalId)

    if (anio) {
      query = query.eq("anio", anio)
    }

    const { data, error } = await query.order("anio", { ascending: false }).order("mes", { ascending: false })

    if (error) throw error

    return {
      error: null,
      data: data || [],
    }
  } catch (error) {
    console.error("[v0] Error fetching monthly liquidations:", error)
    return {
      error: error instanceof Error ? error.message : "Error desconocido",
      data: [],
    }
  }
}

/**
 * Obtiene traspasos de caja
 */
export async function getCashTransfers(limit = 50) {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from("traspasos_caja")
      .select("*")
      .order("fecha", { ascending: false })
      .limit(limit)

    if (error) throw error

    return {
      error: null,
      data: data || [],
    }
  } catch (error) {
    console.error("[v0] Error fetching cash transfers:", error)
    return {
      error: error instanceof Error ? error.message : "Error desconocido",
      data: [],
    }
  }
}
