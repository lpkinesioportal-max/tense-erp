import { ExerciseLog } from './types'

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

export function addLog(log: ExerciseLog): void {
    const logs = loadLogs()
    logs.push(log)
    saveLogs(logs)
}

export function deleteLog(logId: string): void {
    const logs = loadLogs().filter(l => l.id !== logId)
    saveLogs(logs)
}
