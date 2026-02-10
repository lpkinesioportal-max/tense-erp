"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Save,
  ArrowLeft,
  FileText,
  Activity,
  Dumbbell,
  Apple,
  Sparkles,
  Heart,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import type {
  ClinicalFormConfig,
  FormFieldConfig,
  FormSectionConfig,
  FormFieldType,
  ClinicalFormType,
} from "@/lib/types"

const FORM_CATEGORIES = [
  { id: "kinesiologia", label: "Kinesiología", icon: Activity, color: "text-blue-500", bgColor: "bg-blue-500" },
  { id: "entrenamiento", label: "Entrenamiento", icon: Dumbbell, color: "text-orange-500", bgColor: "bg-orange-500" },
  { id: "nutricion", label: "Nutrición", icon: Apple, color: "text-green-500", bgColor: "bg-green-500" },
  { id: "masajes", label: "Masajes", icon: Sparkles, color: "text-purple-500", bgColor: "bg-purple-500" },
  { id: "yoga", label: "Yoga", icon: Heart, color: "text-pink-500", bgColor: "bg-pink-500" },
  { id: "evolucion", label: "Evolución", icon: FileText, color: "text-gray-500", bgColor: "bg-gray-500" },
  { id: "paciente", label: "Ficha del Paciente", icon: FileText, color: "text-slate-500", bgColor: "bg-slate-500" },
]

const FORM_TYPES: { value: ClinicalFormType; label: string; icon: any; color: string; category: string }[] = [
  { value: "kinesiology_evaluation", label: "Evaluación Kinésica", icon: Activity, color: "bg-blue-500", category: "kinesiologia" },
  { value: "kinesiology_treatment", label: "Tratamiento Kinésico", icon: Activity, color: "bg-blue-400", category: "kinesiologia" },
  { value: "kine_home", label: "Kine en Casa", icon: Activity, color: "bg-blue-300", category: "kinesiologia" },
  { value: "exercise_log", label: "Registro de Avance", icon: Activity, color: "bg-blue-300", category: "kinesiologia" },
  { value: "exercise_log", label: "Registro de Avance", icon: Activity, color: "bg-blue-300", category: "kinesiologia" },
  { value: "training_evaluation", label: "Evaluación Entrenamiento", icon: Dumbbell, color: "bg-orange-500", category: "entrenamiento" },
  { value: "training_routine", label: "Rutina Entrenamiento", icon: Dumbbell, color: "bg-orange-400", category: "entrenamiento" },
  { value: "nutrition_anthropometry", label: "Antropometría", icon: Apple, color: "bg-green-500", category: "nutricion" },
  { value: "nutrition_recipe", label: "Recetas", icon: Apple, color: "bg-green-400", category: "nutricion" },
  { value: "massage_evaluation", label: "Evaluación Masajes", icon: Sparkles, color: "bg-purple-500", category: "masajes" },
  { value: "yoga_evaluation", label: "Evaluación Yoga", icon: Heart, color: "bg-pink-500", category: "yoga" },
  { value: "yoga_routine", label: "Rutina Yoga", icon: Heart, color: "bg-pink-400", category: "yoga" },
  { value: "evolution_note", label: "Notas de Evolución", icon: FileText, color: "bg-gray-500", category: "evolucion" },
  { value: "personal", label: "Datos Personales", icon: FileText, color: "bg-slate-500", category: "paciente" },
]

const FIELD_TYPES: { value: FormFieldType; label: string }[] = [
  { value: "text", label: "Texto corto" },
  { value: "textarea", label: "Texto largo" },
  { value: "number", label: "Número" },
  { value: "select", label: "Lista desplegable" },
  { value: "multiselect", label: "Selección múltiple" },
  { value: "checkbox", label: "Casilla de verificación" },
  { value: "radio", label: "Opción única" },
  { value: "date", label: "Fecha" },
  { value: "time", label: "Hora" },
  { value: "scale", label: "Escala (1-10)" },
  { value: "toggle", label: "Sí/No" },
  { value: "section", label: "Separador de sección" },
]

// Default form configurations
const getDefaultFormConfig = (formType: ClinicalFormType): Partial<ClinicalFormConfig> => {
  const configs: Record<ClinicalFormType, Partial<ClinicalFormConfig>> = {
    personal: {
      name: "Datos Personales del Paciente",
      description: "Información personal, antecedentes y consentimiento",
      sections: [
        { id: "admin", key: "admin", title: "Administrativo", order: 0, isActive: true },
        { id: "personal", key: "personal", title: "Datos Personales", order: 1, isActive: true },
        { id: "medical", key: "medical", title: "Antecedentes Médicos", order: 2, isActive: true },
        { id: "habits", key: "habits", title: "Hábitos", order: 3, isActive: true },
        { id: "emergency", key: "emergency", title: "Contacto de Emergencia", order: 4, isActive: true },
      ],
      fields: [
        {
          id: "1",
          key: "registrationDate",
          label: "Fecha de Registro",
          type: "date",
          section: "admin",
          order: 0,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "2",
          key: "assignedProfessionalId",
          label: "Profesional Asignado",
          type: "select",
          section: "admin",
          order: 1,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "3",
          key: "birthDate",
          label: "Fecha de Nacimiento",
          type: "date",
          section: "personal",
          order: 0,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "4",
          key: "address",
          label: "Domicilio",
          type: "text",
          section: "personal",
          order: 1,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "5",
          key: "nationality",
          label: "Nacionalidad",
          type: "text",
          section: "personal",
          order: 2,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "6",
          key: "dni",
          label: "DNI",
          type: "text",
          section: "personal",
          order: 3,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "7",
          key: "height",
          label: "Altura (cm)",
          type: "number",
          section: "personal",
          order: 4,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "8",
          key: "weight",
          label: "Peso (kg)",
          type: "number",
          section: "personal",
          order: 5,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "9",
          key: "bloodType",
          label: "Grupo Sanguíneo",
          type: "select",
          section: "personal",
          order: 6,
          isActive: true,
          visibleToPatient: true,
          options: [
            { value: "A+", label: "A+" },
            { value: "A-", label: "A-" },
            { value: "B+", label: "B+" },
            { value: "B-", label: "B-" },
            { value: "AB+", label: "AB+" },
            { value: "AB-", label: "AB-" },
            { value: "O+", label: "O+" },
            { value: "O-", label: "O-" },
          ],
        },
        {
          id: "10",
          key: "injuryHistory",
          label: "Antecedentes de Lesión",
          type: "textarea",
          section: "medical",
          order: 0,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "11",
          key: "diseases",
          label: "Enfermedades",
          type: "textarea",
          section: "medical",
          order: 1,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "12",
          key: "surgeries",
          label: "Cirugías",
          type: "textarea",
          section: "medical",
          order: 2,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "13",
          key: "medication",
          label: "Medicación / Suplementación",
          type: "textarea",
          section: "medical",
          order: 3,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "14",
          key: "smoker",
          label: "¿Fumás?",
          type: "select",
          section: "habits",
          order: 0,
          isActive: true,
          visibleToPatient: true,
          options: [
            { value: "no", label: "No" },
            { value: "yes", label: "Sí" },
            { value: "former", label: "Ex fumador" },
          ],
        },
        {
          id: "15",
          key: "physicalActivityFrequency",
          label: "Actividad Física (estímulos/semana)",
          type: "text",
          section: "habits",
          order: 1,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "16",
          key: "occupation",
          label: "Ocupación",
          type: "text",
          section: "habits",
          order: 2,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "17",
          key: "occupationErgonomic",
          label: "¿Condiciones ergonómicas?",
          type: "toggle",
          section: "habits",
          order: 3,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "18",
          key: "emergencyContact",
          label: "Nombre Contacto Emergencia",
          type: "text",
          section: "emergency",
          order: 0,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "19",
          key: "emergencyPhone",
          label: "Teléfono Emergencia",
          type: "text",
          section: "emergency",
          order: 1,
          isActive: true,
          visibleToPatient: true,
        },
      ],
    },
    kinesiology_evaluation: {
      name: "Evaluación Kinésica",
      description: "Primera evaluación del paciente en kinesiología",
      sections: [
        { id: "clinical", key: "clinical", title: "Datos Clínicos", order: 0, isActive: true },
        { id: "digestive", key: "digestive", title: "Digestivo / Sistémico", order: 1, isActive: true },
        { id: "gynecological", key: "gynecological", title: "Ginecológico", order: 2, isActive: true },
        { id: "neurological", key: "neurological", title: "Sueño / Neurológico", order: 3, isActive: true },
        { id: "diagnosis", key: "diagnosis", title: "Diagnóstico y Plan", order: 4, isActive: true },
      ],
      fields: [
        {
          id: "1",
          key: "consultReason",
          label: "Motivo de Consulta",
          type: "textarea",
          section: "clinical",
          order: 0,
          isActive: true,
          visibleToPatient: true,
          required: true,
        },
        {
          id: "2",
          key: "painType",
          label: "Tipo de Dolor",
          type: "text",
          section: "clinical",
          order: 1,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "3",
          key: "evaScale",
          label: "EVA (Escala de Dolor)",
          type: "scale",
          section: "clinical",
          order: 2,
          isActive: true,
          visibleToPatient: true,
          min: 0,
          max: 10,
        },
        {
          id: "4",
          key: "painMoment",
          label: "Momento en que Duele",
          type: "text",
          section: "clinical",
          order: 3,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "5",
          key: "painChronology",
          label: "Cronología del Dolor",
          type: "textarea",
          section: "clinical",
          order: 4,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "6",
          key: "previousTreatments",
          label: "Tratamientos Anteriores",
          type: "textarea",
          section: "clinical",
          order: 5,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "7",
          key: "abdominalInflammation",
          label: "Inflamación Abdominal",
          type: "toggle",
          section: "digestive",
          order: 0,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "8",
          key: "heartburn",
          label: "Acidez",
          type: "toggle",
          section: "digestive",
          order: 1,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "9",
          key: "regularEvacuation",
          label: "Evacuación Regular",
          type: "toggle",
          section: "digestive",
          order: 2,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "10",
          key: "hemorrhoids",
          label: "Hemorroides",
          type: "toggle",
          section: "digestive",
          order: 3,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "11",
          key: "variedDiet",
          label: "Alimentación Variada",
          type: "toggle",
          section: "digestive",
          order: 4,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "12",
          key: "foodRejection",
          label: "Rechazo a Algún Alimento",
          type: "text",
          section: "digestive",
          order: 5,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "13",
          key: "varicoseVeins",
          label: "Várices",
          type: "toggle",
          section: "digestive",
          order: 6,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "14",
          key: "intenseMenstrualPain",
          label: "Dolor Menstrual Intenso",
          type: "toggle",
          section: "gynecological",
          order: 0,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "15",
          key: "sleepQuality",
          label: "Calidad de Sueño",
          type: "textarea",
          section: "neurological",
          order: 0,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "16",
          key: "headaches",
          label: "Cefaleas / Migrañas",
          type: "textarea",
          section: "neurological",
          order: 1,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "17",
          key: "diagnosis",
          label: "Diagnóstico",
          type: "textarea",
          section: "diagnosis",
          order: 0,
          isActive: true,
          visibleToPatient: false,
        },
        {
          id: "18",
          key: "treatmentPlan",
          label: "Plan de Tratamiento",
          type: "textarea",
          section: "diagnosis",
          order: 1,
          isActive: true,
          visibleToPatient: true,
        },
      ],
    },
    kinesiology_treatment: {
      name: "Sesión de Tratamiento Kinésico",
      description: "Registro de cada sesión de kinesiología",
      sections: [{ id: "session", key: "session", title: "Datos de Sesión", order: 0, isActive: true }],
      fields: [
        {
          id: "1",
          key: "sessionNumber",
          label: "Número de Sesión",
          type: "number",
          section: "session",
          order: 0,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "2",
          key: "attended",
          label: "¿Vino a la Sesión?",
          type: "toggle",
          section: "session",
          order: 1,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "3",
          key: "sessionWork",
          label: "Trabajamos en la Sesión",
          type: "textarea",
          section: "session",
          order: 2,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "4",
          key: "indication",
          label: "Indicaciones",
          type: "textarea",
          section: "session",
          order: 3,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "5",
          key: "nextSession",
          label: "Próxima Sesión",
          type: "text",
          section: "session",
          order: 4,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "6",
          key: "exercises",
          label: "Ejercicios",
          type: "textarea",
          section: "session",
          order: 5,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "7",
          key: "comments",
          label: "Comentarios",
          type: "textarea",
          section: "session",
          order: 6,
          isActive: true,
          visibleToPatient: false,
        },
      ],
    },
    kine_home: {
      name: "Kine en Casa",
      description: "Programa de ejercicios para realizar en casa",
      sections: [
        { id: "program", key: "program", title: "Programa", order: 0, isActive: true },
        { id: "exercises", key: "exercises", title: "Ejercicios", order: 1, isActive: true },
      ],
      fields: [
        {
          id: "1",
          key: "region",
          label: "Región",
          type: "text",
          section: "program",
          order: 0,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "2",
          key: "objective",
          label: "Objetivo",
          type: "textarea",
          section: "program",
          order: 1,
          isActive: true,
          visibleToPatient: true,
        },
      ],
    },
    training_evaluation: {
      name: "Evaluación de Entrenamiento",
      description: "Evaluación inicial para entrenamiento",
      sections: [
        { id: "history", key: "history", title: "Historia", order: 0, isActive: true },
        { id: "bioimpedance", key: "bioimpedance", title: "Bioimpedancia", order: 1, isActive: true },
        { id: "perimeters", key: "perimeters", title: "Perímetros", order: 2, isActive: true },
        { id: "functional", key: "functional", title: "Evaluación Funcional", order: 3, isActive: true },
      ],
      fields: [
        {
          id: "1",
          key: "pastSports",
          label: "Deportes Pasados",
          type: "textarea",
          section: "history",
          order: 0,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "2",
          key: "nutrition",
          label: "Alimentación",
          type: "textarea",
          section: "history",
          order: 1,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "3",
          key: "pain",
          label: "Dolor",
          type: "textarea",
          section: "history",
          order: 2,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "4",
          key: "personalGoals",
          label: "Objetivos Personales",
          type: "textarea",
          section: "history",
          order: 3,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "5",
          key: "weeklyTrainingFrequency",
          label: "Frecuencia Semanal de Entrenamiento",
          type: "number",
          section: "history",
          order: 4,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "6",
          key: "bmi",
          label: "BMI",
          type: "number",
          section: "bioimpedance",
          order: 0,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "7",
          key: "fatPercentage",
          label: "% Grasa",
          type: "number",
          section: "bioimpedance",
          order: 1,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "8",
          key: "musclePercentage",
          label: "% Músculo",
          type: "number",
          section: "bioimpedance",
          order: 2,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "9",
          key: "basalKcal",
          label: "Kcal Basales",
          type: "number",
          section: "bioimpedance",
          order: 3,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "10",
          key: "bodyAge",
          label: "Edad Corporal",
          type: "number",
          section: "bioimpedance",
          order: 4,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "11",
          key: "clavicles",
          label: "Clavículas (cm)",
          type: "number",
          section: "perimeters",
          order: 0,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "12",
          key: "mammaryLine",
          label: "Línea Mamilar (cm)",
          type: "number",
          section: "perimeters",
          order: 1,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "13",
          key: "biceps90",
          label: "Bíceps 90° (cm)",
          type: "number",
          section: "perimeters",
          order: 2,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "14",
          key: "navel",
          label: "Ombligo (cm)",
          type: "number",
          section: "perimeters",
          order: 3,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "15",
          key: "gluteus",
          label: "Glúteos (cm)",
          type: "number",
          section: "perimeters",
          order: 4,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "16",
          key: "thigh",
          label: "Muslo (cm)",
          type: "number",
          section: "perimeters",
          order: 5,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "17",
          key: "calves",
          label: "Gemelos (cm)",
          type: "number",
          section: "perimeters",
          order: 6,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "18",
          key: "staticEvaluation",
          label: "Evaluación Estática (1-10)",
          type: "scale",
          section: "functional",
          order: 0,
          isActive: true,
          visibleToPatient: true,
          min: 1,
          max: 10,
        },
        {
          id: "19",
          key: "flexibility",
          label: "Flexibilidad",
          type: "textarea",
          section: "functional",
          order: 1,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "20",
          key: "squat",
          label: "Sentadilla",
          type: "textarea",
          section: "functional",
          order: 2,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "21",
          key: "trainingPlan",
          label: "Plan de Entrenamiento",
          type: "textarea",
          section: "functional",
          order: 3,
          isActive: true,
          visibleToPatient: true,
        },
      ],
    },
    training_routine: {
      name: "Rutina de Entrenamiento",
      description: "Rutinas personalizadas para el paciente",
      sections: [
        { id: "routine", key: "routine", title: "Rutina", order: 0, isActive: true },
        { id: "exercises", key: "exercises", title: "Ejercicios", order: 1, isActive: true },
      ],
      fields: [
        {
          id: "0",
          key: "month",
          label: "Mes / Etapa",
          type: "text",
          section: "routine",
          order: -1,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "1",
          key: "name",
          label: "Nombre de Rutina",
          type: "text",
          section: "routine",
          order: 0,
          isActive: true,
          visibleToPatient: true,
          required: true,
        },
        {
          id: "2",
          key: "objective",
          label: "Objetivo",
          type: "textarea",
          section: "routine",
          order: 1,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "3",
          key: "reevaluationDate",
          label: "Fecha de Reevaluación",
          type: "date",
          section: "routine",
          order: 2,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "4",
          key: "warmUp",
          label: "Entrada en Calor",
          type: "textarea",
          section: "routine",
          order: 3,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "5",
          key: "coolDown",
          label: "Vuelta a la Calma",
          type: "textarea",
          section: "routine",
          order: 4,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "6",
          key: "comments",
          label: "Comentarios",
          type: "textarea",
          section: "routine",
          order: 5,
          isActive: true,
          visibleToPatient: false,
        },
        {
          id: "7",
          key: "exerciseList",
          label: "Días de Entrenamiento",
          type: "exercise_days",
          section: "exercises",
          order: 0,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "99",
          key: "isVisible",
          label: "Visible para el Paciente",
          type: "toggle",
          section: "routine",
          order: 99,
          isActive: true,
          visibleToPatient: false,
        },
      ],
    },
    nutrition_anthropometry: {
      name: "Evaluación Antropométrica",
      description: "Mediciones y evaluación nutricional",
      sections: [
        { id: "consultation", key: "consultation", title: "Consulta", order: 0, isActive: true },
        { id: "measurements", key: "measurements", title: "Mediciones", order: 1, isActive: true },
        { id: "plan", key: "plan", title: "Plan", order: 2, isActive: true },
      ],
      fields: [
        {
          id: "1",
          key: "sessionNumber",
          label: "Número de Sesión",
          type: "number",
          section: "consultation",
          order: 0,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "2",
          key: "consultReason",
          label: "Motivo de Consulta",
          type: "textarea",
          section: "consultation",
          order: 1,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "3",
          key: "lastLabWork",
          label: "Último Laboratorio",
          type: "textarea",
          section: "consultation",
          order: 2,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "4",
          key: "previousNutritionTreatments",
          label: "Tratamientos Anteriores",
          type: "textarea",
          section: "consultation",
          order: 3,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "5",
          key: "representativeFoodDay",
          label: "Día Alimentario Representativo",
          type: "textarea",
          section: "consultation",
          order: 4,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "6",
          key: "weight",
          label: "Peso (kg)",
          type: "number",
          section: "measurements",
          order: 0,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "7",
          key: "height",
          label: "Altura (cm)",
          type: "number",
          section: "measurements",
          order: 1,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "8",
          key: "bmi",
          label: "IMC",
          type: "number",
          section: "measurements",
          order: 2,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "9",
          key: "bodyFatPercentage",
          label: "% Grasa Corporal",
          type: "number",
          section: "measurements",
          order: 3,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "10",
          key: "muscleMass",
          label: "Masa Muscular",
          type: "number",
          section: "measurements",
          order: 4,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "11",
          key: "interpretation",
          label: "Interpretación",
          type: "textarea",
          section: "plan",
          order: 0,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "12",
          key: "nutritionalObjective",
          label: "Objetivo Nutricional",
          type: "textarea",
          section: "plan",
          order: 1,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "13",
          key: "nextSessionGoals",
          label: "Objetivos Próxima Consulta",
          type: "textarea",
          section: "plan",
          order: 2,
          isActive: true,
          visibleToPatient: true,
        },
      ],
    },
    nutrition_recipe: {
      name: "Recetas",
      description: "Recetas personalizadas para el paciente",
      sections: [
        { id: "recipe", key: "recipe", title: "Receta", order: 0, isActive: true },
        { id: "macros", key: "macros", title: "Macros", order: 1, isActive: true },
      ],
      fields: [
        {
          id: "1",
          key: "name",
          label: "Nombre",
          type: "text",
          section: "recipe",
          order: 0,
          isActive: true,
          visibleToPatient: true,
          required: true,
        },
        {
          id: "2",
          key: "mealTime",
          label: "Momento del Día",
          type: "select",
          section: "recipe",
          order: 1,
          isActive: true,
          visibleToPatient: true,
          options: [
            { value: "desayuno", label: "Desayuno" },
            { value: "almuerzo", label: "Almuerzo" },
            { value: "merienda", label: "Merienda" },
            { value: "cena", label: "Cena" },
            { value: "snack", label: "Snack" },
          ],
        },
        {
          id: "3",
          key: "ingredients",
          label: "Ingredientes",
          type: "textarea",
          section: "recipe",
          order: 2,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "4",
          key: "preparation",
          label: "Preparación",
          type: "textarea",
          section: "recipe",
          order: 3,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "5",
          key: "proteins",
          label: "Proteínas (g)",
          type: "number",
          section: "macros",
          order: 0,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "6",
          key: "carbohydrates",
          label: "Carbohidratos (g)",
          type: "number",
          section: "macros",
          order: 1,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "7",
          key: "fats",
          label: "Grasas (g)",
          type: "number",
          section: "macros",
          order: 2,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "8",
          key: "calories",
          label: "Calorías",
          type: "number",
          section: "macros",
          order: 3,
          isActive: true,
          visibleToPatient: true,
        },
      ],
    },
    massage_evaluation: {
      name: "Evaluación de Masajes",
      description: "Evaluación para sesiones de masaje",
      sections: [
        { id: "session", key: "session", title: "Datos de Sesión", order: 0, isActive: true },
        { id: "preferences", key: "preferences", title: "Preferencias", order: 1, isActive: true },
      ],
      fields: [
        {
          id: "1",
          key: "sessionNumber",
          label: "Número de Sesión",
          type: "number",
          section: "session",
          order: 0,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "2",
          key: "trainingHours",
          label: "Horas de Entrenamiento",
          type: "number",
          section: "session",
          order: 1,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "3",
          key: "fatigueLevelNum",
          label: "Nivel de Fatiga (1-10)",
          type: "scale",
          section: "session",
          order: 2,
          isActive: true,
          visibleToPatient: true,
          min: 1,
          max: 10,
        },
        {
          id: "4",
          key: "loadWeek",
          label: "Tipo de Semana",
          type: "select",
          section: "session",
          order: 3,
          isActive: true,
          visibleToPatient: true,
          options: [
            { value: "carga", label: "Semana de Carga" },
            { value: "regenerativa", label: "Semana Regenerativa" },
          ],
        },
        {
          id: "5",
          key: "previousMassageExperience",
          label: "Experiencia Previa con Masajes",
          type: "toggle",
          section: "preferences",
          order: 0,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "6",
          key: "pressurePreference",
          label: "Preferencia de Presión",
          type: "select",
          section: "preferences",
          order: 1,
          isActive: true,
          visibleToPatient: true,
          options: [
            { value: "fuerte", label: "Masaje Fuerte" },
            { value: "suave", label: "Masaje Suave" },
          ],
        },
        {
          id: "7",
          key: "ambientPreference",
          label: "Ambiente Preferido",
          type: "select",
          section: "preferences",
          order: 2,
          isActive: true,
          visibleToPatient: true,
          options: [
            { value: "silencio", label: "Silencio" },
            { value: "musica", label: "Música" },
          ],
        },
        {
          id: "8",
          key: "massageFrequency",
          label: "Frecuencia de Masajes",
          type: "text",
          section: "preferences",
          order: 3,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "9",
          key: "sessionWork",
          label: "Trabajado en Sesión",
          type: "textarea",
          section: "session",
          order: 4,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "10",
          key: "comments",
          label: "Comentarios",
          type: "textarea",
          section: "session",
          order: 5,
          isActive: true,
          visibleToPatient: false,
        },
      ],
    },
    yoga_evaluation: {
      name: "Evaluación de Yoga",
      description: "Evaluación inicial para yoga",
      sections: [{ id: "evaluation", key: "evaluation", title: "Evaluación", order: 0, isActive: true }],
      fields: [
        {
          id: "1",
          key: "experienceLevel",
          label: "Nivel de Experiencia",
          type: "select",
          section: "evaluation",
          order: 0,
          isActive: true,
          visibleToPatient: true,
          options: [
            { value: "principiante", label: "Principiante" },
            { value: "intermedio", label: "Intermedio" },
            { value: "avanzado", label: "Avanzado" },
          ],
        },
        {
          id: "2",
          key: "objective",
          label: "Objetivo",
          type: "textarea",
          section: "evaluation",
          order: 1,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "3",
          key: "stressLevel",
          label: "Nivel de Estrés (1-10)",
          type: "scale",
          section: "evaluation",
          order: 2,
          isActive: true,
          visibleToPatient: true,
          min: 1,
          max: 10,
        },
        {
          id: "4",
          key: "sleepQuality",
          label: "Calidad de Sueño",
          type: "textarea",
          section: "evaluation",
          order: 3,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "5",
          key: "physicalLimitations",
          label: "Limitaciones Físicas",
          type: "textarea",
          section: "evaluation",
          order: 4,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "6",
          key: "contraindications",
          label: "Contraindicaciones",
          type: "textarea",
          section: "evaluation",
          order: 5,
          isActive: true,
          visibleToPatient: false,
        },
      ],
    },
    yoga_routine: {
      name: "Rutina de Yoga",
      description: "Rutinas personalizadas de yoga",
      sections: [{ id: "routine", key: "routine", title: "Rutina", order: 0, isActive: true }],
      fields: [
        {
          id: "1",
          key: "name",
          label: "Nombre",
          type: "text",
          section: "routine",
          order: 0,
          isActive: true,
          visibleToPatient: true,
          required: true,
        },
        {
          id: "2",
          key: "objective",
          label: "Objetivo",
          type: "textarea",
          section: "routine",
          order: 1,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "3",
          key: "frequency",
          label: "Frecuencia",
          type: "text",
          section: "routine",
          order: 2,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "4",
          key: "videoUrl",
          label: "Video (URL)",
          type: "text",
          section: "routine",
          order: 3,
          isActive: true,
          visibleToPatient: true,
        },
        {
          id: "5",
          key: "instructions",
          label: "Indicaciones",
          type: "textarea",
          section: "routine",
          order: 4,
          isActive: true,
          visibleToPatient: true,
        },
      ],
    },
    evolution_note: {
      name: "Notas de Evolución",
      description: "Notas de seguimiento del paciente",
      sections: [{ id: "note", key: "note", title: "Nota", order: 0, isActive: true }],
      fields: [
        {
          id: "1",
          key: "title",
          label: "Título",
          type: "text",
          section: "note",
          order: 0,
          isActive: true,
          visibleToPatient: false,
        },
        {
          id: "2",
          key: "content",
          label: "Contenido",
          type: "textarea",
          section: "note",
          order: 1,
          isActive: true,
          visibleToPatient: false,
        },
        {
          id: "3",
          key: "isInternal",
          label: "¿Nota Interna?",
          type: "toggle",
          section: "note",
          order: 2,
          isActive: true,
          visibleToPatient: false,
        },
      ],
    },
    exercise_log: {
      name: "Registro de Avance",
      description: "Registro de ejercicios realizados por el paciente",
      sections: [
        { id: "summary", key: "summary", title: "Resumen", order: 0, isActive: true },
        { id: "details", key: "details", title: "Detalle", order: 1, isActive: true },
      ],
      fields: [
        { id: "1", key: "dayName", label: "Día de Rutina", type: "text", section: "summary", order: 0, isActive: true, visibleToPatient: true },
        { id: "2", key: "notes", label: "Notas de Sesión", type: "textarea", section: "details", order: 2, isActive: true, visibleToPatient: true },
        { id: "3", key: "exercises", label: "Ejercicios Realizados", type: "exercise_list", section: "details", order: 1, isActive: true, visibleToPatient: true },
      ]
    },
  }
  return configs[formType] || { name: "", sections: [], fields: [] }
}

export default function ClinicalFormsConfigPage() {
  const { user } = useAuth()
  const { serviceConfigs } = useData()

  const [formConfigs, setFormConfigs] = useState<ClinicalFormConfig[]>([])
  const [selectedFormType, setSelectedFormType] = useState<ClinicalFormType>("kinesiology_evaluation")
  const [selectedConfig, setSelectedConfig] = useState<ClinicalFormConfig | null>(null)
  const [showFieldDialog, setShowFieldDialog] = useState(false)
  const [showSectionDialog, setShowSectionDialog] = useState(false)
  const [editingField, setEditingField] = useState<FormFieldConfig | null>(null)
  const [editingSection, setEditingSection] = useState<FormSectionConfig | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const [fieldForm, setFieldForm] = useState<Partial<FormFieldConfig>>({
    type: "text",
    isActive: true,
    visibleToPatient: true,
    order: 0,
  })
  const [sectionForm, setSectionForm] = useState<Partial<FormSectionConfig>>({
    isActive: true,
    order: 0,
  })
  const [fieldOptions, setFieldOptions] = useState<string>("") // For select/multiselect/radio

  // Load form configs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("tense_erp_clinical_form_configs")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFormConfigs(parsed)
          return
        }
      } catch (e) {
        console.error("Error parsing clinical form configs:", e)
      }
    }
    // Initialize with defaults
    const defaults: ClinicalFormConfig[] = FORM_TYPES.map((ft) => {
      const defaultConfig = getDefaultFormConfig(ft.value)
      return {
        id: ft.value,
        formType: ft.value,
        name: defaultConfig.name || ft.label,
        description: defaultConfig.description || "",
        sections: (defaultConfig.sections || []) as FormSectionConfig[],
        fields: (defaultConfig.fields || []) as FormFieldConfig[],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })
    setFormConfigs(defaults)
    localStorage.setItem("tense_erp_clinical_form_configs", JSON.stringify(defaults))
  }, [])

  // Update selected config when form type changes
  useEffect(() => {
    const config = formConfigs.find((c) => c.formType === selectedFormType)
    setSelectedConfig(config || null)
    setExpandedSections(new Set(config?.sections.map((s) => s.id) || []))
  }, [selectedFormType, formConfigs])

  const saveConfigs = (newConfigs: ClinicalFormConfig[]) => {
    setFormConfigs(newConfigs)
    localStorage.setItem("tense_erp_clinical_form_configs", JSON.stringify(newConfigs))
  }

  const updateConfig = (updatedConfig: ClinicalFormConfig) => {
    const newConfigs = formConfigs.map((c) =>
      c.id === updatedConfig.id ? { ...updatedConfig, updatedAt: new Date() } : c,
    )
    saveConfigs(newConfigs)
    setSelectedConfig(updatedConfig)
  }

  const openFieldDialog = (field?: FormFieldConfig) => {
    if (field) {
      setEditingField(field)
      setFieldForm(field)
      setFieldOptions(field.options?.map((o) => `${o.value}:${o.label}`).join("\n") || "")
    } else {
      setEditingField(null)
      setFieldForm({
        type: "text",
        isActive: true,
        visibleToPatient: true,
        order: selectedConfig?.fields.length || 0,
        section: selectedConfig?.sections[0]?.key || "",
      })
      setFieldOptions("")
    }
    setShowFieldDialog(true)
  }

  const openSectionDialog = (section?: FormSectionConfig) => {
    if (section) {
      setEditingSection(section)
      setSectionForm(section)
    } else {
      setEditingSection(null)
      setSectionForm({
        isActive: true,
        order: selectedConfig?.sections.length || 0,
      })
    }
    setShowSectionDialog(true)
  }

  const saveField = () => {
    if (!selectedConfig || !fieldForm.key || !fieldForm.label) return

    const options = fieldOptions
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        const [value, label] = line.split(":")
        return { value: value.trim(), label: (label || value).trim() }
      })

    const newField: FormFieldConfig = {
      id: editingField?.id || `field_${Date.now()}`,
      key: fieldForm.key!,
      label: fieldForm.label!,
      type: fieldForm.type || "text",
      placeholder: fieldForm.placeholder,
      helpText: fieldForm.helpText,
      options: options.length > 0 ? options : undefined,
      min: fieldForm.min,
      max: fieldForm.max,
      required: fieldForm.required,
      visibleToPatient: fieldForm.visibleToPatient ?? true,
      order: fieldForm.order ?? 0,
      isActive: fieldForm.isActive ?? true,
      section: fieldForm.section,
    }

    let newFields: FormFieldConfig[]
    if (editingField) {
      newFields = selectedConfig.fields.map((f) => (f.id === editingField.id ? newField : f))
    } else {
      newFields = [...selectedConfig.fields, newField]
    }

    updateConfig({ ...selectedConfig, fields: newFields })
    setShowFieldDialog(false)
  }

  const saveSection = () => {
    if (!selectedConfig || !sectionForm.key || !sectionForm.title) return

    const newSection: FormSectionConfig = {
      id: editingSection?.id || `section_${Date.now()}`,
      key: sectionForm.key!,
      title: sectionForm.title!,
      description: sectionForm.description,
      order: sectionForm.order ?? 0,
      isActive: sectionForm.isActive ?? true,
      isCollapsible: sectionForm.isCollapsible,
    }

    let newSections: FormSectionConfig[]
    if (editingSection) {
      newSections = selectedConfig.sections.map((s) => (s.id === editingSection.id ? newSection : s))
    } else {
      newSections = [...selectedConfig.sections, newSection]
    }

    updateConfig({ ...selectedConfig, sections: newSections })
    setShowSectionDialog(false)
  }

  const deleteField = (fieldId: string) => {
    if (!selectedConfig) return
    const newFields = selectedConfig.fields.filter((f) => f.id !== fieldId)
    updateConfig({ ...selectedConfig, fields: newFields })
  }

  const deleteSection = (sectionId: string) => {
    if (!selectedConfig) return
    const newSections = selectedConfig.sections.filter((s) => s.id !== sectionId)
    const newFields = selectedConfig.fields.filter(
      (f) => f.section !== selectedConfig.sections.find((s) => s.id === sectionId)?.key,
    )
    updateConfig({ ...selectedConfig, sections: newSections, fields: newFields })
  }

  const toggleFieldActive = (fieldId: string) => {
    if (!selectedConfig) return
    const newFields = selectedConfig.fields.map((f) => (f.id === fieldId ? { ...f, isActive: !f.isActive } : f))
    updateConfig({ ...selectedConfig, fields: newFields })
  }

  const toggleFieldVisibility = (fieldId: string) => {
    if (!selectedConfig) return
    const newFields = selectedConfig.fields.map((f) =>
      f.id === fieldId ? { ...f, visibleToPatient: !f.visibleToPatient } : f,
    )
    updateConfig({ ...selectedConfig, fields: newFields })
  }

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const resetToDefaults = () => {
    if (!selectedFormType) return
    const defaultConfig = getDefaultFormConfig(selectedFormType)
    const newConfig: ClinicalFormConfig = {
      id: selectedFormType,
      formType: selectedFormType,
      name: defaultConfig.name || "",
      description: defaultConfig.description || "",
      sections: (defaultConfig.sections || []) as FormSectionConfig[],
      fields: (defaultConfig.fields || []) as FormFieldConfig[],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const newConfigs = formConfigs.map((c) => (c.formType === selectedFormType ? newConfig : c))
    saveConfigs(newConfigs)
  }

  if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Acceso Restringido</h2>
            <p className="text-muted-foreground">No tienes permisos para acceder a esta sección.</p>
          </Card>
        </div>
      </AppLayout>
    )
  }

  const selectedFormInfo = FORM_TYPES.find((ft) => ft.value === selectedFormType)

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/configuracion">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Configuración de Fichas Clínicas</h1>
              <p className="text-muted-foreground">Personaliza los cuestionarios de cada servicio</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Form Types */}
          <div className="col-span-3">
            <Card className="h-[calc(100vh-12rem)] overflow-hidden flex flex-col">
              <CardHeader className="pb-3 px-4">
                <CardTitle className="text-base">Categorías y Fichas</CardTitle>
                <CardDescription className="text-xs">Selecciona una ficha para configurar</CardDescription>
              </CardHeader>
              <CardContent className="p-2 flex-1 overflow-y-auto">
                <div className="space-y-4 px-2 pb-4">
                  {FORM_CATEGORIES.map((cat) => {
                    const CatIcon = cat.icon
                    const categoryForms = FORM_TYPES.filter((ft) => ft.category === cat.id)

                    return (
                      <div key={cat.id} className="space-y-1">
                        <div className="flex items-center gap-2 px-2 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/30 rounded-md">
                          <CatIcon className={`h-3 w-3 ${cat.color}`} />
                          {cat.label}
                        </div>
                        <div className="space-y-0.5 ml-1 border-l-2 border-muted pl-2">
                          {categoryForms.map((ft) => {
                            const Icon = ft.icon
                            const isSelected = selectedFormType === ft.value
                            return (
                              <button
                                key={ft.value}
                                onClick={() => setSelectedFormType(ft.value)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${isSelected
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "hover:bg-accent text-muted-foreground hover:text-foreground"
                                  }`}
                              >
                                <div
                                  className={`p-1 rounded ${isSelected ? "bg-primary-foreground/20" : ft.color + " text-white"
                                    }`}
                                >
                                  <Icon className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-sm font-medium truncate">{ft.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Form Editor */}
          <div className="col-span-9 space-y-4">
            {selectedConfig && selectedFormInfo && (
              <>
                {/* Form Header */}
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${selectedFormInfo.color} text-white`}>
                          <selectedFormInfo.icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold">{selectedConfig.name}</h2>
                          <p className="text-sm text-muted-foreground">{selectedConfig.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={resetToDefaults}>
                          Restaurar Predeterminados
                        </Button>
                        <Button size="sm" onClick={() => openSectionDialog()}>
                          <Plus className="h-4 w-4 mr-2" />
                          Nueva Sección
                        </Button>
                        <Button size="sm" onClick={() => openFieldDialog()}>
                          <Plus className="h-4 w-4 mr-2" />
                          Nuevo Campo
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sections and Fields */}
                <div className="space-y-4">
                  {selectedConfig.sections
                    .sort((a, b) => a.order - b.order)
                    .map((section) => {
                      const sectionFields = selectedConfig.fields
                        .filter((f) => f.section === section.key)
                        .sort((a, b) => a.order - b.order)
                      const isExpanded = expandedSections.has(section.id)

                      return (
                        <Card key={section.id} className={!section.isActive ? "opacity-50" : ""}>
                          <CardHeader className="py-3 cursor-pointer" onClick={() => toggleSection(section.id)}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                <div>
                                  <CardTitle className="text-base">{section.title}</CardTitle>
                                  {section.description && (
                                    <CardDescription className="text-xs">{section.description}</CardDescription>
                                  )}
                                </div>
                                {!section.isActive && (
                                  <Badge variant="secondary" className="ml-2">
                                    Inactiva
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <Badge variant="outline">{sectionFields.length} campos</Badge>
                                <Button variant="ghost" size="icon" onClick={() => openSectionDialog(section)}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => deleteSection(section.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>

                          {isExpanded && (
                            <CardContent className="pt-0">
                              <div className="space-y-2">
                                {sectionFields.length === 0 ? (
                                  <p className="text-sm text-muted-foreground text-center py-4">
                                    No hay campos en esta sección
                                  </p>
                                ) : (
                                  sectionFields.map((field) => (
                                    <div
                                      key={field.id}
                                      className={`flex items-center justify-between p-3 rounded-lg border ${!field.isActive ? "bg-muted/50 opacity-60" : "bg-background"
                                        }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium">{field.label}</span>
                                            {field.required && <span className="text-destructive">*</span>}
                                            <Badge variant="secondary" className="text-xs">
                                              {FIELD_TYPES.find((ft) => ft.value === field.type)?.label || field.type}
                                            </Badge>
                                          </div>
                                          <span className="text-xs text-muted-foreground">{field.key}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => toggleFieldVisibility(field.id)}
                                          title={
                                            field.visibleToPatient ? "Visible para paciente" : "Oculto para paciente"
                                          }
                                        >
                                          {field.visibleToPatient ? (
                                            <Eye className="h-4 w-4 text-green-600" />
                                          ) : (
                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                          )}
                                        </Button>
                                        <Switch
                                          checked={field.isActive}
                                          onCheckedChange={() => toggleFieldActive(field.id)}
                                        />
                                        <Button variant="ghost" size="icon" onClick={() => openFieldDialog(field)}>
                                          <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => deleteField(field.id)}>
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      )
                    })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Field Dialog */}
      <Dialog open={showFieldDialog} onOpenChange={setShowFieldDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingField ? "Editar Campo" : "Nuevo Campo"}</DialogTitle>
            <DialogDescription>Configura las propiedades del campo</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 p-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Identificador (key)</Label>
                  <Input
                    value={fieldForm.key || ""}
                    onChange={(e) => setFieldForm({ ...fieldForm, key: e.target.value })}
                    placeholder="consultReason"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Etiqueta</Label>
                  <Input
                    value={fieldForm.label || ""}
                    onChange={(e) => setFieldForm({ ...fieldForm, label: e.target.value })}
                    placeholder="Motivo de consulta"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Campo</Label>
                  <Select
                    value={fieldForm.type}
                    onValueChange={(v) => setFieldForm({ ...fieldForm, type: v as FormFieldType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map((ft) => (
                        <SelectItem key={ft.value} value={ft.value}>
                          {ft.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sección</Label>
                  <Select value={fieldForm.section} onValueChange={(v) => setFieldForm({ ...fieldForm, section: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedConfig?.sections.map((s) => (
                        <SelectItem key={s.key} value={s.key}>
                          {s.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Placeholder</Label>
                <Input
                  value={fieldForm.placeholder || ""}
                  onChange={(e) => setFieldForm({ ...fieldForm, placeholder: e.target.value })}
                  placeholder="Texto de ejemplo..."
                />
              </div>

              <div className="space-y-2">
                <Label>Texto de Ayuda</Label>
                <Input
                  value={fieldForm.helpText || ""}
                  onChange={(e) => setFieldForm({ ...fieldForm, helpText: e.target.value })}
                  placeholder="Instrucciones adicionales para el usuario"
                />
              </div>

              {(fieldForm.type === "select" || fieldForm.type === "multiselect" || fieldForm.type === "radio") && (
                <div className="space-y-2">
                  <Label>Opciones (una por línea, formato: valor:etiqueta)</Label>
                  <Textarea
                    value={fieldOptions}
                    onChange={(e) => setFieldOptions(e.target.value)}
                    placeholder="si:Sí&#10;no:No&#10;a_veces:A veces"
                    rows={4}
                  />
                </div>
              )}

              {(fieldForm.type === "number" || fieldForm.type === "scale") && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mínimo</Label>
                    <Input
                      type="number"
                      value={fieldForm.min ?? ""}
                      onChange={(e) =>
                        setFieldForm({ ...fieldForm, min: e.target.value ? Number(e.target.value) : undefined })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Máximo</Label>
                    <Input
                      type="number"
                      value={fieldForm.max ?? ""}
                      onChange={(e) =>
                        setFieldForm({ ...fieldForm, max: e.target.value ? Number(e.target.value) : undefined })
                      }
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Orden</Label>
                <Input
                  type="number"
                  value={fieldForm.order ?? 0}
                  onChange={(e) => setFieldForm({ ...fieldForm, order: Number(e.target.value) })}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Campo Obligatorio</Label>
                    <p className="text-xs text-muted-foreground">El usuario debe completar este campo</p>
                  </div>
                  <Switch
                    checked={fieldForm.required ?? false}
                    onCheckedChange={(v) => setFieldForm({ ...fieldForm, required: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Visible para el Paciente</Label>
                    <p className="text-xs text-muted-foreground">El paciente puede ver este campo en su portal</p>
                  </div>
                  <Switch
                    checked={fieldForm.visibleToPatient ?? true}
                    onCheckedChange={(v) => setFieldForm({ ...fieldForm, visibleToPatient: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Campo Activo</Label>
                    <p className="text-xs text-muted-foreground">El campo aparece en el formulario</p>
                  </div>
                  <Switch
                    checked={fieldForm.isActive ?? true}
                    onCheckedChange={(v) => setFieldForm({ ...fieldForm, isActive: v })}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFieldDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={saveField}>
              <Save className="h-4 w-4 mr-2" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Section Dialog */}
      <Dialog open={showSectionDialog} onOpenChange={setShowSectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSection ? "Editar Sección" : "Nueva Sección"}</DialogTitle>
            <DialogDescription>Configura las propiedades de la sección</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Identificador (key)</Label>
                <Input
                  value={sectionForm.key || ""}
                  onChange={(e) => setSectionForm({ ...sectionForm, key: e.target.value })}
                  placeholder="clinical"
                />
              </div>
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={sectionForm.title || ""}
                  onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                  placeholder="Datos Clínicos"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripción (opcional)</Label>
              <Input
                value={sectionForm.description || ""}
                onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                placeholder="Información adicional sobre la sección"
              />
            </div>

            <div className="space-y-2">
              <Label>Orden</Label>
              <Input
                type="number"
                value={sectionForm.order ?? 0}
                onChange={(e) => setSectionForm({ ...sectionForm, order: Number(e.target.value) })}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Sección Colapsable</Label>
                  <p className="text-xs text-muted-foreground">Permite expandir/colapsar la sección</p>
                </div>
                <Switch
                  checked={sectionForm.isCollapsible ?? false}
                  onCheckedChange={(v) => setSectionForm({ ...sectionForm, isCollapsible: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Sección Activa</Label>
                  <p className="text-xs text-muted-foreground">La sección aparece en el formulario</p>
                </div>
                <Switch
                  checked={sectionForm.isActive ?? true}
                  onCheckedChange={(v) => setSectionForm({ ...sectionForm, isActive: v })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSectionDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={saveSection}>
              <Save className="h-4 w-4 mr-2" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
