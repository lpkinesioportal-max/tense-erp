"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Check, Copy, Database, ExternalLink, AlertTriangle } from "lucide-react"

export default function SetupPage() {
    const [copied, setCopied] = useState(false)

    const SQL_SCRIPT = `-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PRODUCTS & INVENTORY
CREATE TABLE IF NOT EXISTS tense_product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    color TEXT
);

CREATE TABLE IF NOT EXISTS tense_suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    cuit TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tense_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID, -- References tense_product_categories(id)
    brand TEXT,
    model TEXT,
    barcode TEXT,
    sku TEXT,
    cost_price NUMERIC,
    sale_price NUMERIC,
    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    supplier_id UUID, -- References tense_suppliers(id)
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tense_product_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID,
    date TIMESTAMPTZ DEFAULT NOW(),
    items JSONB DEFAULT '[]'::jsonb, -- Array of bought items
    total_amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'completed', -- pending, completed, cancelled
    payment_method TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tense_product_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID,
    date TIMESTAMPTZ DEFAULT NOW(),
    items JSONB DEFAULT '[]'::jsonb, -- Array of sold items
    total_amount NUMERIC DEFAULT 0,
    payment_method TEXT,
    status TEXT DEFAULT 'completed',
    seller_id UUID, -- User ID
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FINANCE & CASH REGISTERS
CREATE TABLE IF NOT EXISTS tense_bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    cbu TEXT,
    alias TEXT,
    bank_name TEXT,
    account_type TEXT, -- checking, savings
    currency TEXT DEFAULT 'ARS',
    balance NUMERIC DEFAULT 0,
    holder_name TEXT,
    holder_cuit TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tense_cash_registers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL, -- reception, professional
    status TEXT DEFAULT 'closed', -- open, closed
    opened_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    opening_balance NUMERIC DEFAULT 0,
    current_balance NUMERIC DEFAULT 0,
    closing_balance NUMERIC,
    professional_id UUID, -- Null for reception
    opened_by UUID, -- User ID
    closed_by UUID, -- User ID
    notes TEXT,
    transactions JSONB DEFAULT '[]'::jsonb -- Can be used for small log or reference
);

CREATE TABLE IF NOT EXISTS tense_cash_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TIMESTAMPTZ DEFAULT NOW(),
    amount NUMERIC NOT NULL,
    from_register_id UUID, -- or type description
    to_register_id UUID,
    from_user_id UUID,
    to_user_id UUID,
    status TEXT DEFAULT 'pending', -- pending, completed, rejected
    evidence_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tense_settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    professional_id UUID NOT NULL,
    period_month INTEGER,
    period_year INTEGER,
    start_date TIMESTAMPTZ, -- For daily settlements
    end_date TIMESTAMPTZ,
    total_turnos INTEGER DEFAULT 0,
    total_turnos_amount NUMERIC DEFAULT 0,
    total_extras_amount NUMERIC DEFAULT 0,
    total_discounts_amount NUMERIC DEFAULT 0,
    final_amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'draft', -- draft, pending_payment, paid
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    details JSONB DEFAULT '{}'::jsonb, -- Appointments list snapshot
    payments JSONB DEFAULT '[]'::jsonb -- Partial payments
);

CREATE TABLE IF NOT EXISTS tense_inter_professional_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_professional_id UUID NOT NULL,
    to_professional_id UUID NOT NULL,
    amount NUMERIC NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    evidence_url TEXT
);

CREATE TABLE IF NOT EXISTS tense_reception_daily_closes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TIMESTAMPTZ DEFAULT NOW(),
    opening_time TIMESTAMPTZ,
    closing_time TIMESTAMPTZ,
    opening_balance NUMERIC DEFAULT 0,
    cash_in NUMERIC DEFAULT 0,
    cash_out NUMERIC DEFAULT 0,
    expected_balance NUMERIC DEFAULT 0,
    actual_balance NUMERIC DEFAULT 0,
    difference NUMERIC DEFAULT 0,
    closed_by UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tense_reception_monthly_closes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    total_income NUMERIC DEFAULT 0,
    total_expenses NUMERIC DEFAULT 0,
    net_result NUMERIC DEFAULT 0,
    closed_by UUID,
    closed_at TIMESTAMPTZ DEFAULT NOW(),
    details JSONB DEFAULT '{}'::jsonb
);

-- 3. MANAGEMENT & TASKS
CREATE TABLE IF NOT EXISTS tense_waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name TEXT NOT NULL,
    client_phone TEXT,
    preferred_days TEXT,
    preferred_times TEXT,
    service_type TEXT,
    professional_id UUID,
    status TEXT DEFAULT 'pending', -- pending, contacted, scheduled, cancelled
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

CREATE TABLE IF NOT EXISTS tense_staff_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID, -- User ID
    status TEXT DEFAULT 'pending',
    due_date TIMESTAMPTZ,
    priority TEXT DEFAULT 'normal',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    recurrence TEXT -- daily, weekly, etc.
);

CREATE TABLE IF NOT EXISTS tense_staff_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID,
    target_date TIMESTAMPTZ,
    status TEXT DEFAULT 'in_progress',
    progress INTEGER DEFAULT 0, -- 0-100
    metrics JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CLINICAL & MEDICAL RECORDS
CREATE TABLE IF NOT EXISTS tense_medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL,
    blood_type TEXT,
    height NUMERIC,
    allergies TEXT[],
    chronic_conditions TEXT[],
    medications TEXT[],
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tense_clinical_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL,
    professional_id UUID,
    date TIMESTAMPTZ DEFAULT NOW(),
    type TEXT NOT NULL, -- evolution, anamnesis, etc.
    content JSONB DEFAULT '{}'::jsonb,
    attachments JSONB DEFAULT '[]'::jsonb, -- Media URLs
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tense_clinical_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    status TEXT DEFAULT 'pending',
    assigned_to UUID,
    priority TEXT DEFAULT 'normal',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tense_clinical_task_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID, -- References tense_clinical_tasks(id)
    type TEXT NOT NULL, -- status_change, comment, etc.
    content TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. COMMUNICATION
CREATE TABLE IF NOT EXISTS tense_chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT DEFAULT 'direct', -- direct, group
    participants JSONB DEFAULT '[]'::jsonb, -- Array of User IDs
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tense_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID, -- References tense_chat_conversations(id)
    sender_id UUID,
    content TEXT,
    type TEXT DEFAULT 'text', -- text, image, file
    media_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tense_community_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID,
    content TEXT,
    media_urls JSONB DEFAULT '[]'::jsonb,
    likes JSONB DEFAULT '[]'::jsonb, -- Array of User IDs
    comments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);`

    const copyToClipboard = () => {
        navigator.clipboard.writeText(SQL_SCRIPT)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="container mx-auto py-10 max-w-4xl space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <Database className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-slate-900">Configuración de Base de Datos</h1>
            </div>

            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Acción Requerida</AlertTitle>
                <AlertDescription>
                    El sistema está configurado para operar 100% en la nube. Las tablas necesarias aún no existen en tu base de datos Supabase.
                    Por seguridad, tu aplicación no tiene permisos para crearlas automáticamente.
                </AlertDescription>
            </Alert>

            <Card>
                <CardHeader>
                    <CardTitle>Inicialización de Tablas</CardTitle>
                    <CardDescription>
                        Sigue estos pasos para completar la configuración y habilitar todas las funciones del sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <li>Ingresa a tu panel de control de <strong>Supabase</strong>.</li>
                        <li>Navega a la sección <strong>SQL Editor</strong> en el menú lateral.</li>
                        <li>Haz clic en <strong>New Query</strong>.</li>
                        <li>Copia el código de abajo y pégalo en el editor.</li>
                        <li>Presiona el botón <strong>Run</strong> (ejecutar).</li>
                    </ol>

                    <div className="relative group">
                        <div className="absolute right-2 top-2 z-10">
                            <Button
                                onClick={copyToClipboard}
                                size="sm"
                                variant={copied ? "default" : "secondary"}
                                className={copied ? "bg-green-600 hover:bg-green-700" : ""}
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-4 w-4 mr-1" /> Copiado
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4 mr-1" /> Copiar SQL
                                    </>
                                )}
                            </Button>
                        </div>
                        <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto text-xs font-mono h-[400px] w-full border border-slate-800">
                            {SQL_SCRIPT}
                        </pre>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center border-t py-4 bg-slate-50">
                    <p className="text-xs text-slate-500">
                        Una vez ejecutado, recarga esta aplicación para comenzar a usar el sistema.
                    </p>
                    <Button variant="outline" onClick={() => window.open('https://app.supabase.com', '_blank')}>
                        Ir a Supabase <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
