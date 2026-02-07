import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date))
}

export function getDateInISO(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  // Format as YYYY-MM-DD using local date (not UTC)
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, "0")
  const day = String(dateObj.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function formatTime(time: string): string {
  return time
}

export function getWeekDays(startDate: Date): Date[] {
  const days: Date[] = []
  const start = new Date(startDate)
  const day = start.getDay()
  const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Adjust when it's Sunday
  start.setDate(diff)

  for (let i = 0; i < 7; i++) {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    days.push(day)
  }
  return days
}

export function generateTimeSlots(start: string, end: string, interval: number): string[] {
  const slots: string[] = []
  const [startHour, startMin] = start.split(":").map(Number)
  const [endHour, endMin] = end.split(":").map(Number)

  let currentHour = startHour
  let currentMin = startMin

  while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
    slots.push(`${currentHour.toString().padStart(2, "0")}:${currentMin.toString().padStart(2, "0")}`)
    currentMin += interval
    if (currentMin >= 60) {
      currentHour += Math.floor(currentMin / 60)
      currentMin = currentMin % 60
    }
  }

  return slots
}

export const statusLabels: Record<string, string> = {
  available: "Disponible",
  pending_deposit: "Sin seña",
  confirmed: "Confirmado",
  attended: "Asistió",
  no_show: "No asistió",
  follow_up: "En seguimiento",
  closed: "Cerrado",
  holiday: "Feriado",
}

export const statusColors: Record<string, string> = {
  available: "bg-muted text-muted-foreground",
  pending_deposit: "bg-amber-100 text-amber-800 border-amber-300",
  confirmed: "bg-blue-100 text-blue-800 border-blue-300",
  attended: "bg-emerald-600 text-white border-emerald-700 shadow-sm",
  no_show: "bg-red-500 text-white border-red-600 shadow-sm",
  follow_up: "bg-purple-100 text-purple-800 border-purple-300",
  closed: "bg-slate-700 text-white border-slate-800",
  holiday: "bg-muted text-muted-foreground",
}

export const paymentMethodLabels: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
}

export const transactionTypeLabels: Record<string, string> = {
  session_payment: "Pago de sesión",
  deposit_payment: "Pago de seña",
  commission_collection: "Cobro de comisión",
  professional_withdrawal: "Retiro profesional",
  product_sale: "Venta de producto",
  supplier_payment: "Pago a proveedor",
  cash_fund: "Fondeo de caja",
  excess_transfer: "Transferencia excedente",
  expense: "Gasto",
  adjustment: "Ajuste",
}

export function formatDateDisplay(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).replace(/^\w/, (c) => c.toUpperCase())
}
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}
