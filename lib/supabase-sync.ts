/**
 * Supabase Sync Helpers
 * 
 * These utilities handle the synchronization between Supabase and localStorage,
 * providing a fallback mechanism when Supabase is unavailable.
 */

import { supabase, isSupabaseConfigured } from './supabase-client'
import type { Professional, Client, User, Appointment } from './types'

// ============================================
// Type mappings: camelCase <-> snake_case
// ============================================

function toSnakeCase(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {}
    for (const key in obj) {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
        result[snakeKey] = obj[key]
    }
    return result
}

function toCamelCase(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {}
    for (const key in obj) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
        result[camelKey] = obj[key]
    }
    return result
}

// ============================================
// Generic CRUD operations with fallback
// ============================================

export interface SyncOptions {
    localStorageKey: string
    tableName: string
}

export async function fetchFromSupabase<T>(
    options: SyncOptions,
    fallbackData: T[]
): Promise<T[]> {
    if (!isSupabaseConfigured()) {
        console.log(`[Sync] Supabase not configured, using localStorage for ${options.tableName}`)
        return fallbackData
    }

    try {
        const { data, error } = await supabase
            .from(options.tableName)
            .select('*')

        if (error) {
            console.error(`[Sync] Error fetching ${options.tableName}:`, error.message)
            return fallbackData
        }

        if (data && data.length > 0) {
            return data.map(row => toCamelCase(row) as T)
        }

        return fallbackData
    } catch (err) {
        console.error(`[Sync] Failed to fetch ${options.tableName}:`, err)
        return fallbackData
    }
}

export async function upsertToSupabase<T extends { id: string }>(
    options: SyncOptions,
    item: T
): Promise<boolean> {
    if (!isSupabaseConfigured()) {
        return false
    }

    try {
        const snakeCaseItem = toSnakeCase(item as Record<string, any>)

        const { error } = await supabase
            .from(options.tableName)
            .upsert(snakeCaseItem, { onConflict: 'id' })

        if (error) {
            console.error(`[Sync] Error upserting to ${options.tableName}:`, error.message)
            return false
        }

        return true
    } catch (err) {
        console.error(`[Sync] Failed to upsert to ${options.tableName}:`, err)
        return false
    }
}

export async function deleteFromSupabase(
    options: SyncOptions,
    id: string
): Promise<boolean> {
    if (!isSupabaseConfigured()) {
        return false
    }

    try {
        const { error } = await supabase
            .from(options.tableName)
            .delete()
            .eq('id', id)

        if (error) {
            console.error(`[Sync] Error deleting from ${options.tableName}:`, error.message)
            return false
        }

        return true
    } catch (err) {
        console.error(`[Sync] Failed to delete from ${options.tableName}:`, err)
        return false
    }
}

// ============================================
// Entity-specific sync configurations
// ============================================

export const SYNC_CONFIG = {
    professionals: {
        localStorageKey: 'tense_erp_professionals',
        tableName: 'tense_professionals'
    },
    clients: {
        localStorageKey: 'tense_erp_clients',
        tableName: 'tense_clients'
    },
    users: {
        localStorageKey: 'tense_erp_users',
        tableName: 'tense_users'
    },
    appointments: {
        localStorageKey: 'tense_erp_appointments',
        tableName: 'tense_appointments'
    },
    servicePacks: {
        localStorageKey: 'tense_erp_servicePacks',
        tableName: 'tense_service_packs'
    },
    covenants: {
        localStorageKey: 'tense_erp_covenants',
        tableName: 'tense_covenants'
    },
    transactions: {
        localStorageKey: 'tense_erp_transactions',
        tableName: 'tense_transactions'
    },
}

// ============================================
// Batch sync for migration
// ============================================

export async function migrateLocalStorageToSupabase<T extends { id: string }>(
    options: SyncOptions,
    localData: T[]
): Promise<{ success: boolean; migratedCount: number; errors: string[] }> {
    if (!isSupabaseConfigured()) {
        return { success: false, migratedCount: 0, errors: ['Supabase not configured'] }
    }

    const errors: string[] = []
    let migratedCount = 0

    for (const item of localData) {
        try {
            const snakeCaseItem = toSnakeCase(item as Record<string, any>)

            const { error } = await supabase
                .from(options.tableName)
                .upsert(snakeCaseItem, { onConflict: 'id' })

            if (error) {
                errors.push(`ID ${item.id}: ${error.message}`)
            } else {
                migratedCount++
            }
        } catch (err: any) {
            errors.push(`ID ${item.id}: ${err.message}`)
        }
    }

    return {
        success: errors.length === 0,
        migratedCount,
        errors
    }
}

// ============================================
// Check Supabase connection
// ============================================

export async function checkSupabaseConnection(): Promise<{
    connected: boolean
    message: string
}> {
    if (!isSupabaseConfigured()) {
        return { connected: false, message: 'Environment variables not configured' }
    }

    try {
        const { data, error } = await supabase
            .from('tense_professionals')
            .select('count', { count: 'exact', head: true })

        if (error) {
            return { connected: false, message: error.message }
        }

        return { connected: true, message: 'Connection successful' }
    } catch (err: any) {
        return { connected: false, message: err.message }
    }
}
