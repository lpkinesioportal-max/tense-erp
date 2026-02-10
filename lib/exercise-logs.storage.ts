import { ExerciseLog } from './types'
import { supabase, isSupabaseConfigured } from './supabase-client'

const KEY = "tense.exerciseLogs.v1"

export function loadLogs(): ExerciseLog[] {
    try {
        const stored = localStorage.getItem(KEY)
        if (!stored) return []
        return JSON.parse(stored)
    } catch {
        return []
    }
}

export function saveLogs(logs: ExerciseLog[]): void {
    try {
        localStorage.setItem(KEY, JSON.stringify(logs))
    } catch {
        console.error('Failed to save exercise logs')
    }
}

export function getLogsForRoutineDay(routineId: string, dayId: string): ExerciseLog[] {
    const logs = loadLogs()
    return logs
        .filter(l => l.routineId === routineId && l.dayId === dayId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export async function addLog(log: ExerciseLog, clientId?: string): Promise<void> {
    const logs = loadLogs()
    logs.push(log)
    saveLogs(logs)

    if (clientId && isSupabaseConfigured()) {
        try {
            await supabase.from('exercise_logs').insert({
                id: log.id,
                client_id: clientId,
                routine_id: log.routineId,
                day_id: log.dayId,
                day_name: log.dayName,
                date: log.date,
                exercises: log.exercises,
                notes: log.notes
            })
        } catch (error) {
            console.error('Error syncing log to Supabase:', error)
        }
    }
}

export async function deleteLog(logId: string): Promise<void> {
    const logs = loadLogs().filter(l => l.id !== logId)
    saveLogs(logs)

    if (isSupabaseConfigured()) {
        try {
            await supabase.from('exercise_logs').delete().eq('id', logId)
        } catch (error) {
            console.error('Error deleting log from Supabase:', error)
        }
    }
}

export async function updateLog(updatedLog: ExerciseLog, clientId?: string): Promise<void> {
    const logs = loadLogs()
    const index = logs.findIndex(l => l.id === updatedLog.id)
    if (index !== -1) {
        logs[index] = updatedLog
        saveLogs(logs)

        if (isSupabaseConfigured()) {
            try {
                const payload: any = {
                    routine_id: updatedLog.routineId,
                    day_id: updatedLog.dayId,
                    day_name: updatedLog.dayName,
                    date: updatedLog.date,
                    exercises: updatedLog.exercises,
                    notes: updatedLog.notes
                }
                // Only include client_id if provided (usually for insert, but good for safety)
                if (clientId) payload.client_id = clientId

                await supabase.from('exercise_logs').update(payload).eq('id', updatedLog.id)
            } catch (error) {
                console.error('Error updating log in Supabase:', error)
            }
        }
    }
}

export async function fetchClientLogs(clientId: string): Promise<ExerciseLog[]> {
    if (!isSupabaseConfigured()) return []

    try {
        const { data, error } = await supabase
            .from('exercise_logs')
            .select('*')
            .eq('client_id', clientId)
            .order('date', { ascending: false })

        if (error) throw error

        return (data || []).map(row => ({
            id: row.id,
            date: row.date,
            routineId: row.routine_id,
            dayId: row.day_id,
            dayName: row.day_name,
            exercises: row.exercises,
            notes: row.notes
        }))
    } catch (error) {
        console.error('Error fetching client logs:', error)
        return []
    }
}

function isValidUUID(uuid: string) {
    const s = "" + uuid;
    const match = s.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[4][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/);
    return match !== null;
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export async function syncLocalLogs(clientId: string, syncedLogs: ExerciseLog[]): Promise<void> {
    if (!isSupabaseConfigured()) return

    const localLogs = loadLogs()
    const syncedIds = new Set(syncedLogs.map(l => l.id))
    const unsyncedLogs = localLogs.filter(l => !syncedIds.has(l.id))

    if (unsyncedLogs.length === 0) return

    console.log(`Syncing ${unsyncedLogs.length} unsynced logs for client ${clientId}`)

    let localLogsChanged = false;

    for (const log of unsyncedLogs) {
        try {
            let logToSync = { ...log };

            // If the local ID is not a valid UUID, generate a new one for Supabase
            // and update local storage as well to maintain consistency
            if (!isValidUUID(log.id)) {
                console.log(`Log ${log.id} has invalid UUID, generating new one...`);
                const newId = generateUUID();

                // Update in local array
                const index = localLogs.findIndex(l => l.id === log.id);
                if (index !== -1) {
                    localLogs[index].id = newId;
                    logToSync.id = newId;
                    localLogsChanged = true;
                }
            }

            const { error } = await supabase.from('exercise_logs').upsert({
                id: logToSync.id,
                client_id: clientId,
                routine_id: logToSync.routineId,
                day_id: logToSync.dayId,
                day_name: logToSync.dayName,
                date: logToSync.date,
                exercises: logToSync.exercises,
                notes: logToSync.notes
            })

            if (error) {
                console.error('Supabase upsert error:', error);
            }
        } catch (error) {
            console.error('Error syncing log during bulk sync:', error)
        }
    }

    if (localLogsChanged) {
        saveLogs(localLogs);
    }
}
