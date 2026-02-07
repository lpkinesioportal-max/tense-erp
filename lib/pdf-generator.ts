import { jsPDF } from "jspdf"
import { formatCurrency, formatDateDisplay, statusLabels } from "@/lib/utils"
import type { Settlement, Appointment, Professional, ServiceConfig } from "@/lib/types"

/**
 * Genera un PDF de liquidación diaria con diseño profesional y colorido.
 * Usa los valores del objeto Settlement sin recalcular.
 */
export const generateSettlementPDF = (
    settlement: Settlement,
    professional: Professional,
    appointments: Appointment[],
    clients: any[],
    services?: ServiceConfig[]
) => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let y = 0

    // ===== HEADER CON FONDO AZUL =====
    doc.setFillColor(25, 118, 210)
    doc.rect(0, 0, pageWidth, 28, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont("helvetica", "bold")
    doc.text(settlement.type === "monthly" ? "LIQUIDACIÓN MENSUAL" : "LIQUIDACIÓN DIARIA", pageWidth / 2, 12, { align: "center" })
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("TENSE - Gestión de Servicios", pageWidth / 2, 20, { align: "center" })
    y = 35

    // ===== INFO DEL PROFESIONAL =====
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text(`Profesional: ${professional.name}`, 15, y)
    y += 7
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(`Especialidad: ${professional.specialty || "-"}`, 15, y)
    y += 7
    doc.text(`Fecha: ${new Date(settlement.date || new Date()).toLocaleDateString("es-AR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}`, 15, y)
    y += 7
    doc.text(`Estado: ${settlement.status === "paid" ? "PAGADA" : "PENDIENTE"}`, 15, y)
    y += 7
    // Mostrar displayId si existe
    if (settlement.displayId) {
        doc.text(`ID: ${settlement.displayId}`, 15, y)
        y += 7
    }
    y += 5

    // ===== RESUMEN DE ATENCIÓN =====
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.setTextColor(25, 118, 210)
    doc.text("RESUMEN DE ATENCIÓN", 15, y)
    y += 8

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)

    const basePriceTotal = settlement.basePriceTotal || settlement.baseRevenue || 0
    const discountAmount = settlement.discountAmount || 0
    const facturadoTotal = settlement.totalFacturado || settlement.attendedRevenue || 0
    // Use the percentage stored at generation time if available, otherwise fallback to current professional rate
    const commissionRate = (settlement as any).professionalPercentage ?? professional.commissionRate ?? (professional as any).commissionPercentage ?? 65

    const summaryData = [
        ["Turnos Atendidos:", `${settlement.attendedAppointments || 0}`],
        ["Precio Base Total:", formatCurrency(basePriceTotal)],
        ["Descuentos TENSE:", `-${formatCurrency(discountAmount)}`],
        ["Facturado Total:", formatCurrency(facturadoTotal)],
        ["Efectivo Cobrado (Prof.):", formatCurrency(settlement.cashCollected || 0)],
    ]

    summaryData.forEach((row) => {
        doc.setFont("helvetica", "normal")
        doc.text(row[0], 15, y)
        doc.setFont("helvetica", "bold")
        doc.text(row[1], pageWidth - 15, y, { align: "right" })
        y += 6
    })
    y += 6

    // ===== BLOQUE A: ATENCIÓN (PERFORMANCE) =====
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.setTextColor(25, 118, 210)
    doc.text("BLOQUE A: ATENCIÓN (PERFORMANCE)", 15, y)
    y += 8
    doc.setFontSize(8)
    doc.setFont("helvetica", "italic")
    doc.setTextColor(100, 100, 100)
    doc.text("Cálculo basado en prestaciones realizadas en esta fecha.", 15, y)
    y += 6

    const professionalEarnings = settlement.professionalEarningsAttended || 0
    const tenseCommission = settlement.totalTenseCommission || 0

    // Caja del profesional (celeste)
    doc.setFillColor(230, 245, 255)
    const boxWidth = (pageWidth - 34) / 2
    doc.rect(15, y - 5, boxWidth, 22, "F")
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text(`Honorarios Profesional (${commissionRate}%)`, 18, y)
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text(formatCurrency(professionalEarnings), 18, y + 10)

    // Caja de TENSE (naranja claro)
    doc.setFillColor(255, 245, 230)
    doc.rect(15 + boxWidth + 4, y - 5, boxWidth, 22, "F")
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text(`Comisión TENSE (Neta)`, 18 + boxWidth + 4, y)
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text(formatCurrency(tenseCommission), 18 + boxWidth + 4, y + 10)

    y += 30

    // ===== BLOQUE B: COBROS (DINERO FÍSICO) =====
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.setTextColor(25, 118, 210)
    doc.text("BLOQUE B: COBROS (DINERO FÍSICO)", 15, y)
    y += 8
    doc.setFontSize(8)
    doc.setFont("helvetica", "italic")
    doc.setTextColor(100, 100, 100)
    doc.text("Resumen de pagos recibidos en esta fecha (incluye señas de otros días).", 15, y)
    y += 6

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    const settlementData = [
        ["Efectivo (Entregado al Profesional):", formatCurrency(settlement.cashCollected || 0)],
        ["Transferencia (Directo al Profesional):", formatCurrency(settlement.transferCollected || 0)],
    ]

    settlementData.forEach((row) => {
        doc.setFont("helvetica", "normal")
        doc.text(row[0], 15, y)
        doc.setFont("helvetica", "bold")
        doc.text(row[1], pageWidth - 15, y, { align: "right" })
        y += 6
    })
    y += 6

    // ===== MONTO A LIQUIDAR =====
    const amountToSettle = settlement.amountToSettle || 0
    const totalTenseCommission = settlement.totalTenseCommission || tenseCommission

    // Determinar quién debe a quién
    let settleLabel = ""
    let settleAmount = 0
    let settleColor: [number, number, number] = [255, 245, 230]
    let textColor: [number, number, number] = [255, 102, 0]

    if (settlement.type === "daily") {
        settleLabel = "Comisión del Día Estimada para TENSE (Informativa):"
        settleAmount = Math.abs(amountToSettle)
        settleColor = [230, 245, 255]
        textColor = [30, 64, 175]
    } else if (amountToSettle > 0) {
        settleLabel = "PROFESIONAL debe abonar a TENSE (Saldo real):"
        settleAmount = amountToSettle
        settleColor = [255, 245, 230]
        textColor = [255, 102, 0]
    } else if (amountToSettle < 0) {
        settleLabel = "TENSE debe liquidar al Profesional:"
        settleAmount = Math.abs(amountToSettle)
        settleColor = [230, 255, 230]
        textColor = [34, 139, 34]
    } else {
        settleLabel = "Saldo:"
        settleAmount = 0
    }

    doc.setFillColor(...settleColor)
    doc.rect(15, y, pageWidth - 30, 14, "F")
    doc.setTextColor(...textColor)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.text(settleLabel, 18, y + 9)
    doc.text(formatCurrency(settleAmount), pageWidth - 18, y + 9, { align: "right" })

    y += 22

    // ===== DETALLE DE ATENCIONES (BLOQUE A) =====
    const dateStr = new Date(settlement.date || new Date()).toDateString()
    const settlementAppointments = appointments.filter(
        (a) =>
            new Date(a.date).toDateString() === dateStr &&
            a.professionalId === settlement.professionalId &&
            a.status !== "cancelled"
    ).sort((a, b) => a.startTime.localeCompare(b.startTime))

    if (settlementAppointments.length > 0) {
        if (y > pageHeight - 60) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold")
        doc.setFontSize(11)
        doc.setTextColor(25, 118, 210)
        doc.text("DETALLE DE ATENCIONES (BLOQUE A)", 15, y)
        y += 8

        doc.setFillColor(25, 118, 210)
        doc.rect(15, y - 5, pageWidth - 30, 8, "F")
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.text("Hora", 18, y + 1)
        doc.text("Paciente", 45, y + 1)
        doc.text("Servicio", 95, y + 1)
        doc.text("Estado", 140, y + 1)
        doc.text("Valor", pageWidth - 18, y + 1, { align: "right" })
        y += 8

        doc.setTextColor(0, 0, 0)
        doc.setFont("helvetica", "normal")
        let rowIdx = 0
        for (const apt of settlementAppointments) {
            if (y > pageHeight - 30) { doc.addPage(); y = 20; }
            if (rowIdx % 2 === 0) { doc.setFillColor(245, 247, 250); doc.rect(15, y - 4, pageWidth - 30, 8, "F"); }
            const client = clients.find((c) => c.id === apt.clientId)
            const service = services?.find((s) => s.id === apt.serviceId)
            doc.text(apt.startTime, 18, y)
            doc.text((client?.name || "Paciente").substring(0, 20), 45, y)
            doc.text((service?.name || "-").substring(0, 18), 95, y)
            doc.text(statusLabels[apt.status] || apt.status, 140, y)
            doc.text(formatCurrency(apt.finalPrice), pageWidth - 18, y, { align: "right" })
            y += 8; rowIdx++;
        }
        y += 6
    }

    // ===== DETALLE DE COBROS (BLOQUE B) =====
    const dailyPayments: any[] = []
    appointments.forEach(apt => {
        (apt.payments || []).forEach(p => {
            if (p.receivedByProfessionalId === settlement.professionalId) {
                const pDate = p.paymentDate ? new Date(p.paymentDate) : new Date(p.createdAt)
                if (pDate.toDateString() === dateStr) {
                    dailyPayments.push({ ...p, aptTime: apt.startTime })
                }
            }
        })
    })

    if (dailyPayments.length > 0) {
        if (y > pageHeight - 60) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold")
        doc.setFontSize(11)
        doc.setTextColor(25, 118, 210)
        doc.text("DETALLE DE COBROS (BLOQUE B)", 15, y)
        y += 8

        doc.setFillColor(41, 128, 185)
        doc.rect(15, y - 5, pageWidth - 30, 8, "F")
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.text("Hora Turno", 18, y + 1)
        doc.text("Método", 45, y + 1)
        doc.text("Concepto", 95, y + 1)
        doc.text("Monto", pageWidth - 18, y + 1, { align: "right" })
        y += 8

        doc.setTextColor(0, 0, 0)
        doc.setFont("helvetica", "normal")
        let rowIdx = 0
        for (const p of dailyPayments) {
            if (y > pageHeight - 30) { doc.addPage(); y = 20; }
            if (rowIdx % 2 === 0) { doc.setFillColor(245, 247, 250); doc.rect(15, y - 4, pageWidth - 30, 8, "F"); }
            doc.text(p.aptTime || "--:--", 18, y)
            doc.text(p.paymentMethod === "cash" ? "Efectivo" : "Transferencia", 45, y)
            doc.text((p.notes || "Pago de sesión").substring(0, 25), 95, y)
            doc.text(formatCurrency(p.amount), pageWidth - 18, y, { align: "right" })
            y += 8; rowIdx++;
        }
    }

    // ===== NOTAS =====
    y = Math.max(y + 10, pageHeight - 55)
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.text("NOTAS:", 15, y)
    y += 4
    const notes = [
        `- Documento informativo de control de operaciones diarias.`,
        `- El efectivo cobrado ha sido entregado al profesional al cierre de caja.`,
        `- Las transferencias se acreditan directamente en la cuenta del profesional.`,
        `- La comisión calculada es informativa y se acumulará en la liquidación mensual.`,
        `- TENSE absorbe los descuentos; el profesional recibe su comisión sobre el precio base.`,
    ]
    notes.forEach((note) => {
        doc.text(note, 15, y, { maxWidth: pageWidth - 30 })
        y += 4
    })

    // ===== FOOTER =====
    doc.setTextColor(150, 150, 150)
    doc.setFontSize(8)
    doc.line(15, pageHeight - 22, pageWidth - 15, pageHeight - 22)
    doc.text(`Generado: ${new Date().toLocaleString("es-AR")}`, 15, pageHeight - 15)
    if (settlement.templateVersion) {
        doc.text(`v${settlement.templateVersion}`, pageWidth / 2, pageHeight - 15, { align: "center" })
    }
    doc.text("Documento de Control Interno", pageWidth - 15, pageHeight - 15, { align: "right" })

    // ===== GUARDAR =====
    const filename = `Liquidacion_${professional.name.replace(/\s+/g, "_")}_${new Date(settlement.date || new Date()).toISOString().split("T")[0]}.pdf`
    doc.save(filename)
}

/**
 * Genera un PDF de liquidación mensual con diseño profesional.
 */
export const generateMonthlySettlementPDF = (
    settlement: Settlement,
    professional: Professional,
    dailySettlements: Settlement[]
) => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 10
    let y = 12

    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ]
    const monthName = months[settlement.month || 0]

    // ===== HEADER =====
    doc.setFontSize(18)
    doc.setTextColor(30, 64, 175)
    doc.setFont("helvetica", "bold")
    doc.text("Liquidación TENSE - Mensual", margin, y)

    doc.setFontSize(8)
    doc.setTextColor(150, 0, 0)
    doc.text("DOCUMENTO NO VÁLIDO COMO FACTURA", pageWidth - margin - 50, y)
    y += 8

    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)
    doc.setFont("helvetica", "normal")
    doc.text(`Período: ${monthName} ${settlement.year}`, margin, y)
    y += 5
    doc.text(`Profesional: ${professional.name}`, margin, y)
    y += 7

    const commissionRate = (settlement as any).professionalPercentage ?? professional.commissionRate ?? (professional as any).commissionPercentage ?? 65

    // ===== RESUMEN DE TURNOS =====
    doc.setFontSize(11)
    doc.setTextColor(30, 64, 175)
    doc.setFont("helvetica", "bold")
    doc.text("Desglose de turnos del mes:", margin, y)
    y += 5

    const totalTurnos = settlement.attendedAppointments || 0
    const totalNoShow = settlement.noShowAppointments || 0

    const turnoStats = [
        { label: "Agendados:", value: (totalTurnos + totalNoShow).toString() },
        { label: "Atendidos:", value: totalTurnos.toString() },
        { label: "No asistidos:", value: totalNoShow.toString() },
    ]

    doc.setFontSize(9)
    turnoStats.forEach((stat, idx) => {
        const cellWidth = (pageWidth - margin * 2) / 3
        const xPos = margin + idx * cellWidth
        doc.setDrawColor(200, 200, 200)
        doc.rect(xPos, y - 4, cellWidth - 1, 8)
        doc.setTextColor(80, 80, 80)
        doc.setFont("helvetica", "normal")
        doc.text(stat.label, xPos + 2, y)
        doc.setTextColor(30, 64, 175)
        doc.setFont("helvetica", "bold")
        doc.text(stat.value, xPos + cellWidth - 4, y, { align: "right" })
    })
    y += 12

    // ===== TABLA DE LIQUIDACIONES DIARIAS =====
    doc.setFontSize(10)
    doc.setTextColor(30, 64, 175)
    doc.setFont("helvetica", "bold")
    doc.text("Detalle de Liquidaciones Diarias", margin, y)
    y += 5

    const tableHeaders = ["Fecha", "Turnos", "Precio Base", "Comisión TENSE", "Comisión Prof."]
    const colWidths = [28, 18, 32, 32, 32]
    const colX = [margin, margin + 28, margin + 46, margin + 78, margin + 110]
    const headerHeight = 6
    const rowHeight = 4

    doc.setFillColor(30, 64, 175)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    tableHeaders.forEach((header, idx) => {
        doc.rect(colX[idx], y, colWidths[idx], headerHeight, "F")
        doc.text(header, colX[idx] + 1, y + 4)
    })
    y += headerHeight

    doc.setTextColor(50, 50, 50)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)

    dailySettlements.forEach((d, rowIdx) => {
        if (y > pageHeight - 50) {
            doc.addPage()
            y = 15
        }

        const bgColor: [number, number, number] = rowIdx % 2 === 0 ? [240, 244, 250] : [255, 255, 255]
        doc.setFillColor(...bgColor)
        doc.rect(margin, y, colWidths.reduce((a, b) => a + b), rowHeight, "F")

        const rowBasePrice = d.basePriceTotal || d.baseRevenue || 0
        const rowTenseRate = (settlement as any).professionalPercentage ? (100 - (settlement as any).professionalPercentage) : (100 - commissionRate)
        const rowProfRate = 100 - rowTenseRate

        const recalculatedProfGross = (rowBasePrice * rowProfRate) / 100
        const recalculatedTenseGross = (rowBasePrice * rowTenseRate) / 100

        const rowData = [
            d.date ? new Date(d.date).toLocaleDateString("es-AR") : "N/A",
            `${d.attendedAppointments || 0}`,
            formatCurrency(rowBasePrice),
            formatCurrency(recalculatedTenseGross),
            formatCurrency(recalculatedProfGross),
        ]

        rowData.forEach((cell, idx) => {
            doc.text(String(cell), colX[idx] + 1, y + 3)
        })
        y += rowHeight
    })

    y += 6

    // ===== RESUMEN DE TOTALES =====
    const totalFacturado = settlement.totalFacturado || 0
    const totalComisionProf = settlement.professionalEarningsAttended || 0
    const totalComisionTENSE = settlement.tenseCommissionAttended || 0
    const descuentosAbsorbidos = settlement.discountAmount || 0

    doc.setFontSize(10)
    doc.setTextColor(30, 64, 175)
    doc.setFont("helvetica", "bold")

    const colWidth = (pageWidth - margin * 3) / 2

    // Columna izquierda - Resumen de pagos
    doc.text("Resumen de pagos:", margin, y)
    let leftY = y + 4

    doc.setFontSize(9)
    const paymentItems = [
        { label: "Subtotal Base (Servicios):", value: formatCurrency(settlement.basePriceTotal || 0) },
        { label: "Descuentos (TENSE):", value: `-${formatCurrency(descuentosAbsorbidos)}` },
        { label: "Total Facturado (Neto):", value: formatCurrency(totalFacturado) },
    ]

    paymentItems.forEach((item) => {
        doc.setTextColor(80, 80, 80)
        doc.setFont("helvetica", "normal")
        doc.text(item.label, margin, leftY)
        doc.setTextColor(30, 64, 175)
        doc.setFont("helvetica", "bold")
        doc.text(item.value, margin + colWidth - 2, leftY, { align: "right" })
        leftY += 5
    })

    // Columna derecha - Resumen de comisiones
    const rightX = margin + colWidth + 1
    doc.setFontSize(10)
    doc.setTextColor(30, 64, 175)
    doc.setFont("helvetica", "bold")
    doc.text("Resumen de comisiones:", rightX, y)

    let rightY = y + 4
    const commissionItems = [
        { label: "Comisión Prof. Bruta:", value: formatCurrency(totalComisionProf), highlight: false },
        { label: "Comisión TENSE Bruta:", value: formatCurrency(totalComisionTENSE), highlight: false },
        { label: "Comisión TENSE Neta:", value: formatCurrency(Math.max(0, totalComisionTENSE - descuentosAbsorbidos)), highlight: true },
    ]

    doc.setFontSize(9)
    commissionItems.forEach((item) => {
        if (item.highlight) {
            doc.setFillColor(255, 250, 200)
            doc.rect(rightX - 2, rightY - 2.5, colWidth + 2, 4.5, "F")
        }

        doc.setTextColor(80, 80, 80)
        doc.setFont("helvetica", "normal")
        doc.text(item.label, rightX, rightY)
        doc.setTextColor(item.highlight ? 184 : 30, item.highlight ? 134 : 64, item.highlight ? 11 : 175)
        doc.setFont("helvetica", "bold")
        doc.text(item.value, pageWidth - margin - 2, rightY, { align: "right" })
        rightY += 5
    })

    y = Math.max(leftY, rightY) + 8

    // ===== SALDO FINAL =====
    const saldoFinal = settlement.amountToSettle || 0
    const balanceIndicator = "MONTO FINAL QUE EL PROFESIONAL DEBE ABONAR A TENSE"
    const balanceColor: [number, number, number] = [220, 20, 60]

    doc.setDrawColor(...balanceColor)
    doc.setFillColor(...balanceColor)
    doc.rect(margin, y, pageWidth - margin * 2, 14, "FD")

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text(balanceIndicator, margin + 3, y + 5)

    doc.setFontSize(13)
    doc.text(
        formatCurrency(Math.abs(saldoFinal)),
        pageWidth - margin - 3,
        y + 5,
        { align: "right" }
    )

    // ===== GUARDAR =====
    const filename = `Liquidacion_${professional.name.replace(/\s+/g, "_")}_${monthName}_${settlement.year}.pdf`
    doc.save(filename)
}
