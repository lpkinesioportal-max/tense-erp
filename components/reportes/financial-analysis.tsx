"use client"

import { useMemo, useState } from "react"
import { useData } from "@/lib/data-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
} from "recharts"
import { formatCurrency } from "@/lib/utils"
import {
    format,
    eachDayOfInterval,
    isSameDay,
    startOfMonth,
    endOfMonth,
    subMonths,
    startOfDay,
    endOfDay
} from "date-fns"
import { es } from "date-fns/locale"
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingBag,
    Package,
    Truck,
    Calendar as CalendarIcon,
    Layers,
    Target,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Info
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"

export function FinancialAnalysis() {
    const {
        transactions,
        productSales,
        productPurchases,
        products,
        suppliers,
        getProductCostAnalysis
    } = useData()

    const [timeRange, setTimeRange] = useState("month")
    const [viewMode, setViewMode] = useState("general")
    const [customRange, setCustomRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date())
    })

    const dateRange = useMemo(() => {
        const now = new Date()
        if (timeRange === "custom" && customRange?.from && customRange?.to) {
            return { start: startOfDay(customRange.from), end: endOfDay(customRange.to) }
        }
        if (timeRange === "year") return { start: startOfMonth(subMonths(now, 11)), end: endOfMonth(now) }
        if (timeRange === "quarter") return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) }
        return { start: startOfMonth(now), end: endOfMonth(now) }
    }, [timeRange, customRange])

    const financialData = useMemo(() => {
        if (!dateRange.start || !dateRange.end) return []
        const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end })
        return days.map(day => {
            const dayTransactions = (transactions || []).filter(tx => isSameDay(new Date(tx.date), day))
            const daySales = (productSales || []).filter(s => isSameDay(new Date(s.date), day))
            const dayPurchases = (productPurchases || []).filter(p => isSameDay(new Date(p.purchaseDate || p.date), day))

            const serviceIncome = dayTransactions
                .filter(tx => tx.type === "session_payment" || tx.type === "deposit_payment" || tx.type === "cash_fund")
                .reduce((sum, tx) => sum + tx.amount, 0)
            const productIncome = daySales.reduce((sum, s) => sum + s.totalAmount, 0)
            const income = serviceIncome + productIncome

            const baseExpenses = dayTransactions
                .filter(tx => tx.type === "expense" || tx.type === "supplier_payment" || tx.type === "professional_withdrawal")
                .reduce((sum, tx) => sum + tx.amount, 0)
            const productExpenses = dayPurchases.reduce((sum, p) => sum + p.totalCost, 0)
            const expenses = baseExpenses + productExpenses

            return {
                date: format(day, "dd MMM"),
                income,
                expenses,
                profit: income - expenses
            }
        })
    }, [transactions, productSales, productPurchases, dateRange])

    const totals = useMemo(() => {
        const totalIncome = financialData.reduce((sum, d) => sum + d.income, 0)
        const totalExpenses = financialData.reduce((sum, d) => sum + d.expenses, 0)
        const productIncome = (productSales || []).filter(s => {
            const d = new Date(s.date)
            return d >= dateRange.start && d <= dateRange.end
        }).reduce((sum, s) => sum + s.totalAmount, 0)

        let totalProductCostSold = 0
        productSales.forEach(sale => {
            const saleDate = new Date(sale.date)
            if (saleDate >= dateRange.start && saleDate <= dateRange.end) {
                sale.items.forEach(item => {
                    const product = products.find(p => p.id === item.productId)
                    const costAnalysis = getProductCostAnalysis(item.productId)
                    const unitCost = costAnalysis.averageCost || product?.costPrice || 0
                    totalProductCostSold += unitCost * item.quantity
                })
            }
        })

        const productGrossProfit = productIncome - totalProductCostSold
        const productMargin = productIncome > 0 ? (productGrossProfit / productIncome) * 100 : 0
        const currentInventoryValueCost = products.reduce((sum, p) => sum + (p.costPrice * p.currentStock), 0)

        return {
            totalIncome,
            totalExpenses,
            netProfit: totalIncome - totalExpenses,
            productIncome,
            productGrossProfit,
            productMargin,
            currentInventoryValueCost
        }
    }, [financialData, productSales, products, dateRange, getProductCostAnalysis])

    const expensesByCategory = useMemo(() => {
        const categories: Record<string, number> = {}
            ; (transactions || []).filter(tx => {
                const d = new Date(tx.date)
                return d >= dateRange.start && d <= dateRange.end && (tx.type === "expense" || tx.type === "supplier_payment")
            }).forEach(tx => {
                const category = tx.notes || "Gastos Generales"
                categories[category] = (categories[category] || 0) + tx.amount
            })
        return Object.entries(categories)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 4)
    }, [transactions, dateRange])

    const minimalistColors = ["#020617", "#64748b", "#94a3b8", "#cbd5e1"]

    return (
        <div className="max-w-[1200px] mx-auto space-y-12 py-8 animate-in fade-in duration-700">
            {/* CLEAN MODULAR HEADER */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-100 pb-8">
                <div className="space-y-1">
                    <h2 className="text-sm font-medium text-slate-400 uppercase tracking-[0.2em]">Balance de Resultados</h2>
                    <h1 className="text-4xl font-light text-slate-900">
                        {viewMode === "general" ? "Finanzas Globales" : "Análisis Comercial"}
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex bg-slate-100 p-1 rounded-full">
                        <button
                            onClick={() => setViewMode("general")}
                            className={`px-6 py-2 rounded-full text-xs font-semibold transition-all ${viewMode === "general" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                        >
                            General
                        </button>
                        <button
                            onClick={() => setViewMode("products")}
                            className={`px-6 py-2 rounded-full text-xs font-semibold transition-all ${viewMode === "products" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                        >
                            Productos
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger className="w-[140px] h-10 border-slate-200 text-xs font-semibold rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="month">Este Mes</SelectItem>
                                <SelectItem value="quarter">Trimestre</SelectItem>
                                <SelectItem value="year">Anual</SelectItem>
                                <SelectItem value="custom">Personalizado</SelectItem>
                            </SelectContent>
                        </Select>
                        <DatePickerWithRange
                            date={customRange}
                            setDate={(r) => { setCustomRange(r); setTimeRange("custom") }}
                            className="h-10 border-slate-200 rounded-xl"
                        />
                    </div>
                </div>
            </header>

            {/* MINIMALIST KPI TILES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Facturación
                    </p>
                    <p className="text-3xl font-light text-slate-900">{formatCurrency(totals.totalIncome)}</p>
                    <div className="flex items-center gap-1 text-emerald-600">
                        <ArrowUpRight className="h-3 w-3" />
                        <span className="text-[10px] font-bold">+12.5% vs anterior</span>
                    </div>
                </div>

                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-900" /> Gastos Totales
                    </p>
                    <p className="text-3xl font-light text-slate-900">{formatCurrency(totals.totalExpenses)}</p>
                    <p className="text-[10px] font-medium text-slate-500 italic">Egresos operativos y compras</p>
                </div>

                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" /> Ganancia Neta
                    </p>
                    <p className="text-3xl font-semibold text-slate-900">{formatCurrency(totals.netProfit)}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{((totals.netProfit / (totals.totalIncome || 1)) * 100).toFixed(1)}% Margen Operativo</p>
                </div>

                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Valor Stock
                    </p>
                    <p className="text-3xl font-light text-slate-900">{formatCurrency(totals.currentInventoryValueCost)}</p>
                    <p className="text-[10px] text-slate-500 font-medium">Activos líquidos en almacén</p>
                </div>
            </div>

            {viewMode === "general" ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 pt-8">
                    {/* CHART AREA */}
                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <h3 className="text-lg font-medium text-slate-900 mb-2">Flujo de Caja</h3>
                            <p className="text-xs text-slate-500">Relación diaria entre ingresos y egresos registrados</p>
                        </div>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={financialData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 9, fill: '#94a3b8' }}
                                        minTickGap={30}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 9, fill: '#94a3b8' }}
                                        tickFormatter={(v) => `$${v / 1000}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: '1px solid #f1f5f9',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                            fontSize: '11px'
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="income"
                                        stroke="#0f172a"
                                        strokeWidth={1.5}
                                        fill="#f1f5f9"
                                        name="Ingresos"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="expenses"
                                        stroke="#cbd5e1"
                                        strokeWidth={1.5}
                                        strokeDasharray="4 4"
                                        fill="transparent"
                                        name="Gastos"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* CATEGORY LIST */}
                    <div className="space-y-12">
                        <div className="space-y-6">
                            <h3 className="text-lg font-medium text-slate-900">Distribución de Gastos</h3>
                            <div className="space-y-6">
                                {expensesByCategory.map((cat, idx) => (
                                    <div key={cat.name} className="group">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cat.name}</span>
                                            <span className="text-sm font-semibold text-slate-900">{formatCurrency(cat.value)}</span>
                                        </div>
                                        <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-slate-900 transition-all duration-1000"
                                                style={{ width: `${(cat.value / totals.totalExpenses) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {expensesByCategory.length === 0 && (
                                    <div className="py-12 border border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 text-xs italic">
                                        No hay gastos registrados en este periodo
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 rounded-2xl space-y-4">
                            <div className="flex items-center gap-3 text-slate-900">
                                <Info className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Insight de Gestión</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Tus gastos representan el <strong>{(totals.totalExpenses / (totals.totalIncome || 1) * 100).toFixed(0)}%</strong> de tus ingresos totales. Mantener este ratio debajo del 70% es vital para el crecimiento sostenido del centro.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-16 pt-8 animate-in slide-in-from-bottom-2 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-20 gap-y-12">
                        {/* PRODUCT PERFORMANCE */}
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-lg font-medium text-slate-900 mb-2">Rendimiento Comercial</h3>
                                <p className="text-xs text-slate-500">Top productos por margen de utilidad bruta</p>
                            </div>
                            <div className="space-y-1">
                                <div className="grid grid-cols-12 py-3 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <div className="col-span-6">Producto</div>
                                    <div className="col-span-3 text-right">Utilidad</div>
                                    <div className="col-span-3 text-right">Margen</div>
                                </div>
                                {products.map(p => {
                                    const sales = productSales.flatMap(s => s.items).filter(i => {
                                        const parent = productSales.find(ps => ps.items.includes(i))
                                        const d = new Date(parent?.date || new Date())
                                        return i.productId === p.id && d >= dateRange.start && d <= dateRange.end
                                    })
                                    const revenue = sales.reduce((sum, i) => sum + i.subtotal, 0)
                                    const units = sales.reduce((sum, i) => sum + i.quantity, 0)
                                    const cost = (getProductCostAnalysis(p.id).averageCost || p.costPrice) * units
                                    const profit = revenue - cost
                                    const margin = revenue > 0 ? (profit / revenue) * 100 : 0
                                    return { name: p.name, profit, margin, active: revenue > 0 }
                                }).filter(p => p.active).sort((a, b) => b.profit - a.profit).slice(0, 5).map(row => (
                                    <div key={row.name} className="grid grid-cols-12 py-4 px-2 items-center hover:bg-slate-50 rounded-xl transition-colors border-b border-slate-50 last:border-0">
                                        <div className="col-span-6">
                                            <p className="text-sm font-medium text-slate-800">{row.name}</p>
                                        </div>
                                        <div className="col-span-3 text-right">
                                            <p className="text-sm font-semibold text-slate-900">{formatCurrency(row.profit)}</p>
                                        </div>
                                        <div className="col-span-3 text-right">
                                            <Badge variant="outline" className="text-[10px] font-bold py-0 h-5 border-slate-200">
                                                {row.margin.toFixed(0)}%
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* PRODUCT STATS */}
                        <div className="space-y-12">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2 p-6 rounded-2xl border border-slate-100 bg-white">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ingresos Venta</p>
                                    <p className="text-2xl font-light text-slate-900">{formatCurrency(totals.productIncome)}</p>
                                </div>
                                <div className="space-y-2 p-6 rounded-2xl border border-slate-100 bg-white shadow-sm">
                                    <p className="text-[10px] font-bold text-sky-600 uppercase tracking-widest">Margen Bruto</p>
                                    <p className="text-2xl font-semibold text-sky-900">{totals.productMargin.toFixed(1)}%</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Cuentas de Proveedores</h3>
                                <div className="space-y-6">
                                    {(suppliers || []).map(s => {
                                        const purchases = (productPurchases || []).filter(p => {
                                            const d = new Date(p.purchaseDate || p.date)
                                            return p.supplierId === s.id && d >= dateRange.start && d <= dateRange.end
                                        })
                                        const total = purchases.reduce((sum, p) => sum + p.totalCost, 0)
                                        return { name: s.name, total }
                                    }).filter(s => s.total > 0).slice(0, 3).map(sup => (
                                        <div key={sup.name} className="flex justify-between items-center group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black">
                                                    {sup.name.charAt(0)}
                                                </div>
                                                <p className="text-sm font-medium text-slate-700">{sup.name}</p>
                                            </div>
                                            <p className="text-sm font-bold text-slate-900">{formatCurrency(sup.total)}</p>
                                        </div>
                                    ))}
                                    {suppliers.length === 0 && <p className="text-xs text-slate-400 italic">No hay registros de proveedores</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER ACTION */}
                    <div className="flex justify-center pt-8">
                        <Button variant="ghost" className="text-slate-400 hover:text-slate-900 text-[10px] font-bold uppercase tracking-widest gap-2">
                            <Layers className="h-4 w-4" /> Descargar Auditoría PDF
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
