// Shared service color utilities
export const SERVICE_COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  green: { bg: "bg-green-500", text: "text-green-700", border: "border-green-500" },
  emerald: { bg: "bg-emerald-500", text: "text-emerald-700", border: "border-emerald-500" },
  blue: { bg: "bg-blue-500", text: "text-blue-700", border: "border-blue-500" },
  sky: { bg: "bg-sky-500", text: "text-sky-700", border: "border-sky-500" },
  cyan: { bg: "bg-cyan-500", text: "text-cyan-700", border: "border-cyan-500" },
  violet: { bg: "bg-violet-500", text: "text-violet-700", border: "border-violet-500" },
  purple: { bg: "bg-purple-500", text: "text-purple-700", border: "border-purple-500" },
  pink: { bg: "bg-pink-500", text: "text-pink-700", border: "border-pink-500" },
  rose: { bg: "bg-rose-500", text: "text-rose-700", border: "border-rose-500" },
  red: { bg: "bg-red-500", text: "text-red-700", border: "border-red-500" },
  orange: { bg: "bg-orange-500", text: "text-orange-700", border: "border-orange-500" },
  amber: { bg: "bg-amber-500", text: "text-amber-700", border: "border-amber-500" },
  yellow: { bg: "bg-yellow-500", text: "text-yellow-700", border: "border-yellow-500" },
  lime: { bg: "bg-lime-500", text: "text-lime-700", border: "border-lime-500" },
  teal: { bg: "bg-teal-500", text: "text-teal-700", border: "border-teal-500" },
  indigo: { bg: "bg-indigo-500", text: "text-indigo-700", border: "border-indigo-500" },
  fuchsia: { bg: "bg-fuchsia-500", text: "text-fuchsia-700", border: "border-fuchsia-500" },
  slate: { bg: "bg-slate-500", text: "text-slate-700", border: "border-slate-500" },
  gray: { bg: "bg-gray-500", text: "text-gray-700", border: "border-gray-500" },
}

export const DEFAULT_COLOR = { bg: "bg-gray-500", text: "text-gray-700", border: "border-gray-500" }

export const colorClasses = SERVICE_COLOR_MAP

export function getServiceColor(colorName: string | undefined): { bg: string; text: string; border: string } {
  if (!colorName) return DEFAULT_COLOR
  return SERVICE_COLOR_MAP[colorName] || DEFAULT_COLOR
}
