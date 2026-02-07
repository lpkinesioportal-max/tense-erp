"use client"

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

interface OccupancyDonutProps {
    rate: number
    color?: string
}

export function OccupancyDonut({ rate, color = "#d97706" }: OccupancyDonutProps) {
    const data = [
        { name: "Occupied", value: rate },
        { name: "Empty", value: 100 - rate },
    ]

    return (
        <div className="relative w-full h-[200px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        startAngle={90}
                        endAngle={450}
                        paddingAngle={0}
                        dataKey="value"
                        stroke="none"
                    >
                        <Cell fill={color} />
                        <Cell fill="rgba(0,0,0,0.05)" />
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-foreground">{Math.round(rate)}%</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Tasa de ocupación</span>
            </div>
        </div>
    )
}
