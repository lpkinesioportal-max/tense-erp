"use client"

import { useMemo } from "react"
import { useData } from "@/lib/data-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Activity, Package, AlertTriangle, TrendingUp, DollarSign } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export function ProductAnalysis() {
    const { products, productSales } = useData()

    const stats = useMemo(() => {
        const topSelling = (products || [])
            .map(p => {
                const sales = (productSales || []).flatMap(s => s.items).filter(i => i.productId === p.id)
                const totalSold = sales.reduce((sum, i) => sum + i.quantity, 0)
                return { ...p, totalSold }
            })
            .sort((a, b) => b.totalSold - a.totalSold)
            .slice(0, 5)

        const critical = (products || []).filter(p => p.currentStock <= p.minimumStock)

        // Future Profit Calculations
        const totalCostValue = (products || []).reduce((sum, p) => sum + (p.costPrice * p.currentStock), 0)
        const totalSaleValue = (products || []).reduce((sum, p) => sum + (p.salePrice * p.currentStock), 0)
        const projectedProfit = totalSaleValue - totalCostValue

        return {
            topSelling,
            critical,
            totalCostValue,
            totalSaleValue,
            projectedProfit
        }
    }, [products, productSales])

    return (
        <div className="max-w-[1200px] mx-auto space-y-16 py-8 animate-in fade-in duration-700">
            {/* MINIMALIST STATS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Catálogo Activo</p>
                    <p className="text-4xl font-light text-slate-900">{products?.length || 0} <span className="text-sm text-slate-400 font-normal ml-1">Items</span></p>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock Saludable</p>
                    <p className="text-4xl font-light text-slate-900">{(products?.length || 0) - stats.critical.length}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inversión en Stock</p>
                    <p className="text-4xl font-light text-slate-900">{formatCurrency(stats.totalCostValue)}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                        Ganancia Proyectada <TrendingUp className="h-3 w-3" />
                    </p>
                    <p className="text-4xl font-semibold text-emerald-600">{formatCurrency(stats.projectedProfit)}</p>
                    <p className="text-[10px] text-slate-400 font-medium italic">Si se vende todo el stock actual</p>
                </div>
            </div>

            {/* VALUE PROJECTION BANNER */}
            <div className="bg-slate-900 text-white p-12 rounded-[2.5rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-5 -rotate-12 group-hover:scale-110 transition-transform duration-700">
                    <DollarSign className="h-64 w-64" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-12">
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-sky-400 uppercase tracking-[0.2em]">Potencial de Liquidación</h3>
                        <h2 className="text-5xl font-light tracking-tighter">
                            {formatCurrency(stats.totalSaleValue)}
                        </h2>
                        <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                            Este es el valor total estimado de tu inventario a precio de venta actual.
                            Representa el capital que recuperará el centro una vez agotado el stock existente.
                        </p>
                    </div>
                    <div className="flex gap-8 border-l border-white/10 pl-8">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Utilidad Estimada</p>
                            <p className="text-3xl font-bold text-emerald-400">+{((stats.projectedProfit / (stats.totalCostValue || 1)) * 100).toFixed(0)}%</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Margen Promedio</p>
                            <p className="text-3xl font-bold text-sky-400">{((stats.projectedProfit / (stats.totalSaleValue || 1)) * 100).toFixed(1)}%</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                {/* INVENTORY MANAGEMENT */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-slate-900">Gestión de Reposición</h3>
                        {stats.critical.length > 0 && <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tighter border-red-200 text-red-600 bg-red-50">{stats.critical.length} Alertas</Badge>}
                    </div>

                    <div className="space-y-4">
                        {stats.critical.map(p => (
                            <div key={p.id} className="flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-red-500">
                                        <AlertTriangle className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Stock: {p.currentStock} / Mín: {p.minimumStock}</p>
                                    </div>
                                </div>
                                <Button variant="link" className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase p-0 h-auto">Solicitar</Button>
                            </div>
                        ))}
                        {stats.critical.length === 0 && (
                            <div className="py-20 border border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-300">
                                <Package className="h-8 w-8 mb-2 opacity-20" />
                                <span className="text-xs font-medium">Niveles de stock óptimos</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* RANKING TABLE */}
                <div className="space-y-8">
                    <h3 className="text-lg font-medium text-slate-900">Demanda Histórica (Top 5)</h3>
                    <div className="space-y-1">
                        <div className="grid grid-cols-12 py-3 text-[10px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50">
                            <div className="col-span-8">Producto</div>
                            <div className="col-span-4 text-right">Vendidas</div>
                        </div>
                        {stats.topSelling.map(p => (
                            <div key={p.id} className="grid grid-cols-12 py-5 items-center border-b border-slate-50 last:border-0 group">
                                <div className="col-span-8">
                                    <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors uppercase tracking-tight">{p.name}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{p.category}</p>
                                </div>
                                <div className="col-span-4 text-right">
                                    <span className="text-sm font-light text-slate-900 bg-slate-50 px-3 py-1 rounded-lg">
                                        {p.totalSold} <span className="text-[10px] text-slate-400 uppercase ml-0.5">unid</span>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FULL INVENTORY PREVIEW (MINIMAL TABLE) */}
            <div className="pt-12 border-t border-slate-50">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Resumen de Almacén</h3>
                    <span className="text-[10px] font-bold text-slate-300 uppercase">Valores a precio de venta sugerido</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-8">
                    {products.map(p => (
                        <div key={p.id} className="space-y-1">
                            <p className="text-sm font-medium text-slate-800 truncate" title={p.name}>{p.name}</p>
                            <div className="flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${p.currentStock > p.minimumStock ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                <span className="text-xs font-semibold text-slate-500">{p.currentStock} unid</span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400">{formatCurrency(p.salePrice)}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
