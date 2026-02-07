"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency } from "@/lib/utils"
import { AlertCircle, ArrowRight, Wallet, History } from "lucide-react"
import type { Appointment, AppointmentPayment, Professional } from "@/lib/types"

interface PaymentResolutionModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (resolution: {
        mode: "neteo_liquidacion" | "transferencia"
        notes: string
        amount: number
        sourcePaymentIds: string[]
        fromProfessionalId: string
        toProfessionalId: string
    }) => void
    appointment: Appointment
    paymentsToResolve: AppointmentPayment[]
    fromProfessional: Professional
    toProfessional: Professional
}

export function PaymentResolutionModal({
    isOpen,
    onClose,
    onConfirm,
    appointment,
    paymentsToResolve,
    fromProfessional,
    toProfessional,
}: PaymentResolutionModalProps) {
    const [mode, setMode] = useState<"neteo_liquidacion" | "transferencia">("neteo_liquidacion")
    const [notes, setNotes] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const totalAmount = paymentsToResolve.reduce((sum, p) => sum + p.amount, 0)
    const sourcePaymentIds = paymentsToResolve.map((p) => p.id)

    const handleConfirm = async () => {
        if (!notes.trim()) return

        setIsSubmitting(true)
        try {
            await onConfirm({
                mode,
                notes,
                amount: totalAmount,
                sourcePaymentIds,
                fromProfessionalId: fromProfessional.id,
                toProfessionalId: toProfessional.id,
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (paymentsToResolve.length === 0) return null

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <AlertCircle className="h-6 w-6 text-amber-500" />
                        Resolución de Pagos
                    </DialogTitle>
                    <DialogDescription>
                        Se ha detectado un cambio de profesional en un turno con cobros realizados.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Summary Card */}
                    <div className="bg-muted/50 rounded-lg p-4 border border-border">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <History className="h-4 w-4 text-muted-foreground" />
                            Resumen de Cobros
                        </h4>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Originalmente cobrado por:</span>
                                <span className="font-medium">{fromProfessional.name}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Nuevo profesional asignado:</span>
                                <span className="font-medium">{toProfessional.name}</span>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t mt-2">
                                <span className="font-semibold">Monto a resolver:</span>
                                <span className="text-lg font-bold text-primary">{formatCurrency(totalAmount)}</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-1">
                                Incluye {paymentsToResolve.length} pago(s) realizados por {fromProfessional.name}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-4 py-2">
                        <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
                                {fromProfessional.name.charAt(0)}
                            </div>
                            <span className="text-[10px] mt-1 text-muted-foreground">De {fromProfessional.name.split(" ")[0]}</span>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground animate-pulse" />
                        <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                                {toProfessional.name.charAt(0)}
                            </div>
                            <span className="text-[10px] mt-1 text-muted-foreground">A {toProfessional.name.split(" ")[0]}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-base">Seleccione una opción de resolución <span className="text-red-500">*</span></Label>
                        <RadioGroup value={mode} onValueChange={(v) => setMode(v as any)} className="space-y-3">
                            <div className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${mode === "neteo_liquidacion" ? "border-primary bg-primary/5" : "hover:bg-muted/30"}`} onClick={() => setMode("neteo_liquidacion")}>
                                <RadioGroupItem value="neteo_liquidacion" id="neteo" className="mt-1" />
                                <Label htmlFor="neteo" className="grid gap-1.5 cursor-pointer font-normal">
                                    <span className="font-semibold flex items-center gap-2">
                                        Compensar en liquidación
                                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase font-bold">Auditado</span>
                                    </span>
                                    <span className="text-xs text-muted-foreground leading-relaxed">
                                        El sistema ajustará los saldos automáticamente en la próxima liquidación mensual de ambos profesionales.
                                    </span>
                                </Label>
                            </div>

                            <div className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${mode === "transferencia" ? "border-primary bg-primary/5" : "hover:bg-muted/30"}`} onClick={() => setMode("transferencia")}>
                                <RadioGroupItem value="transferencia" id="transfer" className="mt-1" />
                                <Label htmlFor="transfer" className="grid gap-1.5 cursor-pointer font-normal">
                                    <span className="font-semibold flex items-center gap-2">
                                        Solicitar transferencia entre profesionales
                                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase font-bold">Manual</span>
                                    </span>
                                    <span className="text-xs text-muted-foreground leading-relaxed">
                                        Se crearán tareas para que el profesional transfiera el dinero y Recepción verifique el comprobante.
                                    </span>
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="resolution-notes" className="text-sm font-semibold">Notas / Motivo del cambio <span className="text-red-500">*</span></Label>
                        <Textarea
                            id="resolution-notes"
                            placeholder="Indique brevemente por qué se realiza este cambio para auditoría..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="resize-none min-h-[80px]"
                        />
                        {notes.trim().length === 0 && (
                            <p className="text-[10px] text-red-500 font-medium">Este campo es obligatorio para proceder.</p>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto">
                        Cancelar
                    </Button>
                    <Button
                        className="bg-primary hover:bg-primary/90 w-full sm:w-auto min-w-[150px]"
                        disabled={!notes.trim() || isSubmitting}
                        onClick={handleConfirm}
                    >
                        {isSubmitting ? "Procesando..." : "Confirmar y Guardar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
