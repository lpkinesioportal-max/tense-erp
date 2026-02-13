import { ClinicalFormType, ClinicalFormConfig } from "./types"
import { Activity, Dumbbell, Apple, Sparkles, Heart, FileText } from "lucide-react"

export const SERVICE_CATEGORIES = [
    { id: "kinesiologia", label: "Kinesiología", icon: Activity, color: "text-blue-500", bgColor: "bg-blue-500", types: ["kinesiology_evaluation", "kinesiology_treatment", "kine_home", "exercise_log"] },
    { id: "entrenamiento", label: "Entrenamiento", icon: Dumbbell, color: "text-orange-500", bgColor: "bg-orange-500", types: ["training_evaluation", "training_routine", "exercise_log"] },
    { id: "nutricion", label: "Nutrición", icon: Apple, color: "text-green-500", bgColor: "bg-green-500", types: ["nutrition_evaluation", "nutrition_anthropometry", "nutrition_recipe"] },
    { id: "masajes", label: "Masajes", icon: Sparkles, color: "text-purple-500", bgColor: "bg-purple-500", types: ["massage_evaluation"] },
    { id: "yoga", label: "Yoga", icon: Heart, color: "text-pink-500", bgColor: "bg-pink-500", types: ["yoga_evaluation", "yoga_routine"] },
    { id: "evolucion", label: "Evolución", icon: FileText, color: "text-gray-500", bgColor: "bg-gray-500", types: ["evolution_note"] },
    { id: "paciente", label: "Ficha del Paciente", icon: FileText, color: "text-slate-500", bgColor: "bg-slate-500", types: ["personal"] },
]

export const FORM_TYPES_INFO: { value: ClinicalFormType; label: string; icon: any; color: string; category: string }[] = [
    { value: "kinesiology_evaluation", label: "Evaluación Kinésica", icon: Activity, color: "bg-blue-500", category: "kinesiologia" },
    { value: "kinesiology_treatment", label: "Tratamiento Kinésico", icon: Activity, color: "bg-blue-400", category: "kinesiologia" },
    { value: "kine_home", label: "Kine en Casa", icon: Activity, color: "bg-blue-300", category: "kinesiologia" },
    { value: "exercise_log", label: "Registro de Avance", icon: Activity, color: "bg-blue-300", category: "kinesiologia" },
    { value: "training_evaluation", label: "Evaluación Entrenamiento", icon: Dumbbell, color: "bg-orange-500", category: "entrenamiento" },
    { value: "training_routine", label: "Rutina Entrenamiento", icon: Dumbbell, color: "bg-orange-400", category: "entrenamiento" },
    { value: "nutrition_evaluation", label: "Evaluación Nutricional", icon: Apple, color: "bg-green-700", category: "nutricion" },
    { value: "nutrition_anthropometry", label: "Antropometría", icon: Apple, color: "bg-green-600", category: "nutricion" },
    { value: "nutrition_recipe", label: "Recetas", icon: Apple, color: "bg-green-400", category: "nutricion" },
    { value: "massage_evaluation", label: "Evaluación Masajes", icon: Sparkles, color: "bg-purple-500", category: "masajes" },
    { value: "yoga_evaluation", label: "Evaluación Yoga", icon: Heart, color: "bg-pink-500", category: "yoga" },
    { value: "yoga_routine", label: "Rutina Yoga", icon: Heart, color: "bg-pink-400", category: "yoga" },
    { value: "evolution_note", label: "Notas de Evolución", icon: FileText, color: "bg-gray-500", category: "evolucion" },
    { value: "personal", label: "Datos Personales", icon: FileText, color: "bg-slate-500", category: "paciente" },
]

export const FIELD_TYPES: { value: import("./types").FormFieldType; label: string }[] = [
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

// ... code ...



export const getDefaultFormConfig = (formType: ClinicalFormType): Partial<ClinicalFormConfig> => {
    // This replicates the logic from app/configuracion/fichas-clinicas/page.tsx
    // to ensure consistency without importing from the page file directly.

    switch (formType) {
        case "exercise_log":
            return {
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
            }
        case "personal":
            return {
                name: "Datos Personales del Paciente",
                sections: [
                    { id: "admin", key: "admin", title: "Administrativo", order: 0, isActive: true },
                    { id: "personal", key: "personal", title: "Datos Personales", order: 1, isActive: true },
                    { id: "medical", key: "medical", title: "Antecedentes Médicos", order: 2, isActive: true },
                    { id: "habits", key: "habits", title: "Hábitos", order: 3, isActive: true },
                    { id: "emergency", key: "emergency", title: "Contacto de Emergencia", order: 4, isActive: true },
                ],
                fields: [
                    { id: "1", key: "registrationDate", label: "Fecha de Registro", type: "date", section: "admin", order: 0, isActive: true, visibleToPatient: true },
                    { id: "2", key: "assignedProfessionalId", label: "Profesional Asignado", type: "select", section: "admin", order: 1, isActive: true, visibleToPatient: true },
                    { id: "3", key: "birthDate", label: "Fecha de Nacimiento", type: "date", section: "personal", order: 0, isActive: true, visibleToPatient: true },
                    { id: "4", key: "address", label: "Domicilio", type: "text", section: "personal", order: 1, isActive: true, visibleToPatient: true },
                    { id: "5", key: "nationality", label: "Nacionalidad", type: "text", section: "personal", order: 2, isActive: true, visibleToPatient: true },
                    { id: "6", key: "dni", label: "DNI", type: "text", section: "personal", order: 3, isActive: true, visibleToPatient: true },
                    { id: "7", key: "height", label: "Altura (cm)", type: "number", section: "personal", order: 4, isActive: true, visibleToPatient: true },
                    { id: "8", key: "weight", label: "Peso (kg)", type: "number", section: "personal", order: 5, isActive: true, visibleToPatient: true },
                    { id: "9", key: "bloodType", label: "Grupo Sanguíneo", type: "select", section: "personal", order: 6, isActive: true, visibleToPatient: true, options: [{ value: "A+", label: "A+" }, { value: "A-", label: "A-" }, { value: "B+", label: "B+" }, { value: "B-", label: "B-" }, { value: "AB+", label: "AB+" }, { value: "AB-", label: "AB-" }, { value: "O+", label: "O+" }, { value: "O-", label: "O-" }] },
                    { id: "10", key: "injuryHistory", label: "Antecedentes de Lesión", type: "textarea", section: "medical", order: 0, isActive: true, visibleToPatient: true },
                    { id: "11", key: "diseases", label: "Enfermedades", type: "textarea", section: "medical", order: 1, isActive: true, visibleToPatient: true },
                    { id: "12", key: "surgeries", label: "Cirugías", type: "textarea", section: "medical", order: 2, isActive: true, visibleToPatient: true },
                    { id: "13", key: "medication", label: "Medicación / Suplementación", type: "textarea", section: "medical", order: 3, isActive: true, visibleToPatient: true },
                    { id: "14", key: "smoker", label: "¿Fumás?", type: "select", section: "habits", order: 0, isActive: true, visibleToPatient: true, options: [{ value: "no", label: "No" }, { value: "yes", label: "Sí" }, { value: "former", label: "Ex fumador" }] },
                    { id: "15", key: "physicalActivityFrequency", label: "Actividad Física (estímulos/semana)", type: "text", section: "habits", order: 1, isActive: true, visibleToPatient: true },
                    { id: "16", key: "occupation", label: "Ocupación", type: "text", section: "habits", order: 2, isActive: true, visibleToPatient: true },
                    { id: "17", key: "occupationErgonomic", label: "¿Condiciones ergonómicas?", type: "toggle", section: "habits", order: 3, isActive: true, visibleToPatient: true },
                    { id: "18", key: "emergencyContact", label: "Nombre Contacto Emergencia", type: "text", section: "emergency", order: 0, isActive: true, visibleToPatient: true },
                    { id: "19", key: "emergencyPhone", label: "Teléfono Emergencia", type: "text", section: "emergency", order: 1, isActive: true, visibleToPatient: true },
                    { id: "99", key: "isVisible", label: "Visible para el Paciente", type: "toggle", section: "admin", order: 99, isActive: true, visibleToPatient: false },
                ],
            }
        case "kinesiology_evaluation":
            return {
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
                    { id: "0", key: "month", label: "Mes / Etapa", type: "text", section: "clinical", order: -1, isActive: true, visibleToPatient: true },
                    { id: "1", key: "consultReason", label: "Motivo de Consulta", type: "textarea", section: "clinical", order: 0, isActive: true, visibleToPatient: true, required: true },
                    { id: "2", key: "painType", label: "Tipo de Dolor", type: "text", section: "clinical", order: 1, isActive: true, visibleToPatient: true },
                    { id: "3", key: "evaScale", label: "EVA (Escala de Dolor)", type: "scale", section: "clinical", order: 2, isActive: true, visibleToPatient: true, min: 0, max: 10 },
                    { id: "4", key: "painMoment", label: "Momento en que Duele", type: "text", section: "clinical", order: 3, isActive: true, visibleToPatient: true },
                    { id: "5", key: "painChronology", label: "Cronología del Dolor", type: "textarea", section: "clinical", order: 4, isActive: true, visibleToPatient: true },
                    { id: "6", key: "previousTreatments", label: "Tratamientos Anteriores", type: "textarea", section: "clinical", order: 5, isActive: true, visibleToPatient: true },
                    // Digestive...
                    { id: "7", key: "abdominalInflammation", label: "Inflamación Abdominal", type: "toggle", section: "digestive", order: 0, isActive: true, visibleToPatient: true },
                    { id: "8", key: "heartburn", label: "Acidez", type: "toggle", section: "digestive", order: 1, isActive: true, visibleToPatient: true },
                    { id: "9", key: "regularEvacuation", label: "Evacuación Regular", type: "toggle", section: "digestive", order: 2, isActive: true, visibleToPatient: true },
                    { id: "10", key: "hemorrhoids", label: "Hemorroides", type: "toggle", section: "digestive", order: 3, isActive: true, visibleToPatient: true },
                    { id: "11", key: "variedDiet", label: "Alimentación Variada", type: "toggle", section: "digestive", order: 4, isActive: true, visibleToPatient: true },
                    { id: "12", key: "foodRejection", label: "Rechazo a Algún Alimento", type: "text", section: "digestive", order: 5, isActive: true, visibleToPatient: true },
                    { id: "13", key: "varicoseVeins", label: "Várices", type: "toggle", section: "digestive", order: 6, isActive: true, visibleToPatient: true },
                    // Gyneco
                    { id: "14", key: "intenseMenstrualPain", label: "Dolor Menstrual Intenso", type: "toggle", section: "gynecological", order: 0, isActive: true, visibleToPatient: true },
                    // Neuro
                    { id: "15", key: "sleepQuality", label: "Calidad de Sueño", type: "textarea", section: "neurological", order: 0, isActive: true, visibleToPatient: true },
                    { id: "16", key: "headaches", label: "Cefaleas / Migrañas", type: "textarea", section: "neurological", order: 1, isActive: true, visibleToPatient: true },
                    // Diagnosis
                    { id: "17", key: "diagnosis", label: "Diagnóstico", type: "textarea", section: "diagnosis", order: 0, isActive: true, visibleToPatient: false },
                    { id: "18", key: "treatmentPlan", label: "Plan de Tratamiento", type: "textarea", section: "diagnosis", order: 1, isActive: true, visibleToPatient: true },
                    { id: "99", key: "isVisible", label: "Visible para el Paciente", type: "toggle", section: "diagnosis", order: 99, isActive: true, visibleToPatient: false },
                ]
            }
        case "kinesiology_treatment":
            return {
                name: "Sesión de Tratamiento Kinésico",
                description: "Registro de cada sesión de kinesiología",
                sections: [{ id: "session", key: "session", title: "Datos de Sesión", order: 0, isActive: true }],
                fields: [
                    { id: "0", key: "month", label: "Mes / Etapa", type: "text", section: "session", order: -1, isActive: true, visibleToPatient: true },
                    { id: "1", key: "sessionNumber", label: "Número de Sesión", type: "number", section: "session", order: 0, isActive: true, visibleToPatient: true },
                    { id: "2", key: "attended", label: "¿Vino a la Sesión?", type: "toggle", section: "session", order: 1, isActive: true, visibleToPatient: true },
                    { id: "3", key: "sessionWork", label: "Trabajamos en la Sesión", type: "textarea", section: "session", order: 2, isActive: true, visibleToPatient: true },
                    { id: "4", key: "indication", label: "Indicaciones", type: "textarea", section: "session", order: 3, isActive: true, visibleToPatient: true },
                    { id: "5", key: "nextSession", label: "Próxima Sesión", type: "text", section: "session", order: 4, isActive: true, visibleToPatient: true },
                    { id: "6", key: "exercises", label: "Ejercicios", type: "textarea", section: "session", order: 5, isActive: true, visibleToPatient: true },
                    { id: "7", key: "comments", label: "Comentarios", type: "textarea", section: "session", order: 6, isActive: true, visibleToPatient: false },
                    { id: "99", key: "isVisible", label: "Visible para el Paciente", type: "toggle", section: "session", order: 99, isActive: true, visibleToPatient: false },
                ]
            }
        case "kine_home":
            return {
                name: "Kine en Casa",
                description: "Programa de ejercicios para realizar en casa",
                sections: [
                    { id: "program", key: "program", title: "Programa", order: 0, isActive: true },
                    { id: "exercises", key: "exercises", title: "Ejercicios", order: 1, isActive: true },
                ],
                fields: [
                    { id: "0", key: "month", label: "Mes / Etapa", type: "text", section: "program", order: -1, isActive: true, visibleToPatient: true },
                    { id: "1", key: "region", label: "Región", type: "text", section: "program", order: 0, isActive: true, visibleToPatient: true },
                    { id: "2", key: "objective", label: "Objetivo", type: "textarea", section: "program", order: 1, isActive: true, visibleToPatient: true },
                    { id: "3", key: "frequency", label: "Frecuencia (veces por semana)", type: "text", section: "program", order: 2, isActive: true, visibleToPatient: true },
                    { id: "4", key: "duration", label: "Duración del programa", type: "text", section: "program", order: 3, isActive: true, visibleToPatient: true },
                    { id: "5", key: "exerciseList", label: "Lista de Ejercicios", type: "exercise_days", section: "exercises", order: 0, isActive: true, visibleToPatient: true },
                    { id: "99", key: "isVisible", label: "Visible para el Paciente", type: "toggle", section: "program", order: 99, isActive: true, visibleToPatient: false },
                ]
            }
        case "training_evaluation":
            return {
                name: "Evaluación de Entrenamiento",
                description: "Evaluación inicial para entrenamiento",
                sections: [
                    { id: "history", key: "history", title: "Historia", order: 0, isActive: true },
                    { id: "bioimpedance", key: "bioimpedance", title: "Bioimpedancia", order: 1, isActive: true },
                    { id: "perimeters", key: "perimeters", title: "Perímetros", order: 2, isActive: true },
                    { id: "functional", key: "functional", title: "Evaluación Funcional", order: 3, isActive: true },
                ],
                fields: [
                    { id: "1", key: "pastSports", label: "Deportes Pasados", type: "textarea", section: "history", order: 0, isActive: true, visibleToPatient: true },
                    { id: "2", key: "nutrition", label: "Alimentación", type: "textarea", section: "history", order: 1, isActive: true, visibleToPatient: true },
                    { id: "3", key: "pain", label: "Dolor", type: "textarea", section: "history", order: 2, isActive: true, visibleToPatient: true },
                    { id: "4", key: "personalGoals", label: "Objetivos Personales", type: "textarea", section: "history", order: 3, isActive: true, visibleToPatient: true },
                    { id: "5", key: "weeklyTrainingFrequency", label: "Frecuencia Semanal de Entrenamiento", type: "number", section: "history", order: 4, isActive: true, visibleToPatient: true },
                    // Bio
                    { id: "6", key: "bmi", label: "BMI", type: "number", section: "bioimpedance", order: 0, isActive: true, visibleToPatient: true },
                    { id: "7", key: "fatPercentage", label: "% Grasa", type: "number", section: "bioimpedance", order: 1, isActive: true, visibleToPatient: true },
                    { id: "8", key: "musclePercentage", label: "% Músculo", type: "number", section: "bioimpedance", order: 2, isActive: true, visibleToPatient: true },
                    { id: "9", key: "basalKcal", label: "Kcal Basales", type: "number", section: "bioimpedance", order: 3, isActive: true, visibleToPatient: true },
                    { id: "10", key: "bodyAge", label: "Edad Corporal", type: "number", section: "bioimpedance", order: 4, isActive: true, visibleToPatient: true },
                    // Perimeters
                    { id: "11", key: "clavicles", label: "Clavículas (cm)", type: "number", section: "perimeters", order: 0, isActive: true, visibleToPatient: true },
                    { id: "12", key: "mammaryLine", label: "Línea Mamilar (cm)", type: "number", section: "perimeters", order: 1, isActive: true, visibleToPatient: true },
                    { id: "13", key: "biceps90", label: "Bíceps 90° (cm)", type: "number", section: "perimeters", order: 2, isActive: true, visibleToPatient: true },
                    { id: "14", key: "navel", label: "Ombligo (cm)", type: "number", section: "perimeters", order: 3, isActive: true, visibleToPatient: true },
                    { id: "15", key: "gluteus", label: "Glúteos (cm)", type: "number", section: "perimeters", order: 4, isActive: true, visibleToPatient: true },
                    { id: "16", key: "thigh", label: "Muslo (cm)", type: "number", section: "perimeters", order: 5, isActive: true, visibleToPatient: true },
                    { id: "17", key: "calves", label: "Gemelos (cm)", type: "number", section: "perimeters", order: 6, isActive: true, visibleToPatient: true },
                    // Functional
                    { id: "18", key: "staticEvaluation", label: "Evaluación Estática (1-10)", type: "scale", section: "functional", order: 0, isActive: true, visibleToPatient: true, min: 1, max: 10 },
                    { id: "19", key: "overheadSquat", label: "Sentadilla de Arranque (1-10)", type: "scale", section: "functional", order: 1, isActive: true, visibleToPatient: true, min: 1, max: 10 },
                    { id: "20", key: "pushUp", label: "Flexión de Brazos (1-10)", type: "scale", section: "functional", order: 2, isActive: true, visibleToPatient: true, min: 1, max: 10 },
                    { id: "21", key: "pullUp", label: "Dominada (1-10)", type: "scale", section: "functional", order: 3, isActive: true, visibleToPatient: true, min: 1, max: 10 },
                    { id: "22", key: "coreStability", label: "Estabilidad Core (1-10)", type: "scale", section: "functional", order: 4, isActive: true, visibleToPatient: true, min: 1, max: 10 },
                    { id: "23", key: "mobility", label: "Movilidad (1-10)", type: "scale", section: "functional", order: 5, isActive: true, visibleToPatient: true, min: 1, max: 10 },
                    { id: "24", key: "notes", label: "Observaciones Generales", type: "textarea", section: "functional", order: 6, isActive: true, visibleToPatient: true },
                    { id: "99", key: "isVisible", label: "Visible para el Paciente", type: "toggle", section: "history", order: 99, isActive: true, visibleToPatient: false },
                ]
            }
        case "training_routine":
            return {
                name: "Rutina de Entrenamiento",
                description: "Asignación de rutina",
                sections: [
                    { id: "routine", key: "routine", title: "Rutina", order: 0, isActive: true },
                    { id: "exercises", key: "exercises", title: "Ejercicios", order: 1, isActive: true },
                ],
                fields: [
                    { id: "0", key: "month", label: "Mes / Etapa", type: "text", section: "routine", order: -1, isActive: true, visibleToPatient: true },
                    { id: "1", key: "name", label: "Nombre de la Rutina", type: "text", section: "routine", order: 0, isActive: true, visibleToPatient: true },
                    { id: "2", key: "objective", label: "Objetivo", type: "textarea", section: "routine", order: 1, isActive: true, visibleToPatient: true },
                    { id: "3", key: "exerciseList", label: "Días de Entrenamiento", type: "exercise_days", section: "exercises", order: 0, isActive: true, visibleToPatient: true },
                    { id: "99", key: "isVisible", label: "Visible para el Paciente", type: "toggle", section: "routine", order: 99, isActive: true, visibleToPatient: false },
                ]
            }
        case "nutrition_evaluation":
            return {
                name: "Evaluación Nutricional",
                description: "Evaluación inicial y seguimiento nutricional",
                sections: [
                    { id: "anamnesis", key: "anamnesis", title: "Anamnesis", order: 0, isActive: true },
                    { id: "habits", key: "habits", title: "Hábitos", order: 1, isActive: true },
                    { id: "objectives", key: "objectives", title: "Objetivos", order: 2, isActive: true },
                ],
                fields: [
                    { id: "1", key: "reason", label: "Motivo de Consulta", type: "textarea", section: "anamnesis", order: 0, isActive: true, visibleToPatient: true },
                    { id: "2", key: "history", label: "Antecedentes Patológicos", type: "textarea", section: "anamnesis", order: 1, isActive: true, visibleToPatient: true },
                    { id: "3", key: "medication", label: "Medicación", type: "textarea", section: "anamnesis", order: 2, isActive: true, visibleToPatient: true },
                    { id: "4", key: "allergies", label: "Alergias / Intolerancias", type: "textarea", section: "anamnesis", order: 3, isActive: true, visibleToPatient: true },
                    { id: "5", key: "digestive", label: "Ritmo Evacuatorio / Digestión", type: "textarea", section: "anamnesis", order: 4, isActive: true, visibleToPatient: true },
                    { id: "6", key: "activity", label: "Actividad Física", type: "textarea", section: "habits", order: 0, isActive: true, visibleToPatient: true },
                    { id: "7", key: "schedule", label: "Horarios y Rutinas", type: "textarea", section: "habits", order: 1, isActive: true, visibleToPatient: true },
                    { id: "8", key: "preferences", label: "Gustos y Preferencias", type: "textarea", section: "habits", order: 2, isActive: true, visibleToPatient: true },
                    { id: "9", key: "shortTermGoals", label: "Objetivos Corto Plazo", type: "textarea", section: "objectives", order: 0, isActive: true, visibleToPatient: true },
                    { id: "10", key: "longTermGoals", label: "Objetivos Largo Plazo", type: "textarea", section: "objectives", order: 1, isActive: true, visibleToPatient: true },
                    { id: "99", key: "isVisible", label: "Visible para el Paciente", type: "toggle", section: "anamnesis", order: 99, isActive: true, visibleToPatient: false },
                ]
            }
        case "nutrition_anthropometry":
            return {
                name: "Antropometría",
                description: "Mediciones y evaluación nutricional",
                sections: [
                    { id: "consultation", key: "consultation", title: "Consulta", order: 0, isActive: true },
                    { id: "measurements", key: "measurements", title: "Mediciones", order: 1, isActive: true },
                    { id: "plan", key: "plan", title: "Plan", order: 2, isActive: true },
                ],
                fields: [
                    { id: "1", key: "sessionNumber", label: "Número de Sesión", type: "number", section: "consultation", order: 0, isActive: true, visibleToPatient: true },
                    { id: "2", key: "consultReason", label: "Motivo de Consulta", type: "textarea", section: "consultation", order: 1, isActive: true, visibleToPatient: true },
                    { id: "3", key: "lastLabWork", label: "Último Laboratorio", type: "textarea", section: "consultation", order: 2, isActive: true, visibleToPatient: true },
                    { id: "4", key: "previousNutritionTreatments", label: "Tratamientos Anteriores", type: "textarea", section: "consultation", order: 3, isActive: true, visibleToPatient: true },
                    { id: "5", key: "representativeFoodDay", label: "Día Alimentario Representativo", type: "textarea", section: "consultation", order: 4, isActive: true, visibleToPatient: true },
                    { id: "6", key: "weight", label: "Peso (kg)", type: "number", section: "measurements", order: 0, isActive: true, visibleToPatient: true },
                    { id: "7", key: "height", label: "Altura (cm)", type: "number", section: "measurements", order: 1, isActive: true, visibleToPatient: true },
                    { id: "8", key: "bmi", label: "IMC", type: "number", section: "measurements", order: 2, isActive: true, visibleToPatient: true },
                    { id: "9", key: "bodyFatPercentage", label: "% Grasa Corporal", type: "number", section: "measurements", order: 3, isActive: true, visibleToPatient: true },
                    { id: "10", key: "muscleMass", label: "Masa Muscular", type: "number", section: "measurements", order: 4, isActive: true, visibleToPatient: true },
                    { id: "11", key: "interpretation", label: "Interpretación", type: "textarea", section: "plan", order: 0, isActive: true, visibleToPatient: true },
                    { id: "12", key: "nutritionalObjective", label: "Objetivo Nutricional", type: "textarea", section: "plan", order: 1, isActive: true, visibleToPatient: true },
                    { id: "13", key: "nextSessionGoals", label: "Objetivos Próxima Consulta", type: "textarea", section: "plan", order: 2, isActive: true, visibleToPatient: true },
                ]
            }
        case "nutrition_recipe":
            return {
                name: "Recetas / Plan Alimentario",
                description: "Planificación de comidas con opciones y archivos media",
                sections: [
                    { id: "general", key: "general", title: "Planificación", order: 0, isActive: true },
                ],
                fields: [
                    {
                        id: "meal_plan",
                        key: "plan_alimentario",
                        label: "Plan Alimentario",
                        type: "meal_plan",
                        section: "general",
                        order: 0,
                        isActive: true,
                        visibleToPatient: true,
                        helpText: "Cargá las comidas con sus opciones. Cada opción puede tener video y PDF."
                    },
                    {
                        id: "notes",
                        key: "notas_generales",
                        label: "Notas Generales",
                        type: "textarea",
                        section: "general",
                        order: 1,
                        isActive: true,
                        visibleToPatient: true,
                        placeholder: "Indicaciones generales para esta semana..."
                    }
                ]
            }
        case "massage_evaluation":
            return {
                name: "Evaluación de Masajes",
                description: "Evaluación inicial para masoterapia",
                sections: [
                    { id: "preferences", key: "preferences", title: "Preferencias", order: 0, isActive: true },
                    { id: "session", key: "session", title: "Datos de Sesión", order: 1, isActive: true },
                ],
                fields: [
                    // Preferences fields...
                    { id: "5", key: "previousMassageExperience", label: "Experiencia Previa con Masajes", type: "toggle", section: "preferences", order: 0, isActive: true, visibleToPatient: true },
                    { id: "6", key: "pressurePreference", label: "Preferencia de Presión", type: "select", section: "preferences", order: 1, isActive: true, visibleToPatient: true, options: [{ value: "fuerte", label: "Masaje Fuerte" }, { value: "suave", label: "Masaje Suave" }] },
                    { id: "7", key: "ambientPreference", label: "Ambiente Preferido", type: "select", section: "preferences", order: 2, isActive: true, visibleToPatient: true, options: [{ value: "silencio", label: "Silencio" }, { value: "musica", label: "Música" }] },
                    { id: "8", key: "massageFrequency", label: "Frecuencia de Masajes", type: "text", section: "preferences", order: 3, isActive: true, visibleToPatient: true },
                    { id: "9", key: "sessionWork", label: "Trabajado en Sesión", type: "textarea", section: "session", order: 4, isActive: true, visibleToPatient: true },
                    { id: "10", key: "comments", label: "Comentarios", type: "textarea", section: "session", order: 5, isActive: true, visibleToPatient: false },
                    { id: "99", key: "isVisible", label: "Visible para el Paciente", type: "toggle", section: "preferences", order: 99, isActive: true, visibleToPatient: false },
                ]
            }
        case "yoga_evaluation":
            return {
                name: "Evaluación de Yoga",
                description: "Evaluación inicial para yoga",
                sections: [{ id: "evaluation", key: "evaluation", title: "Evaluación", order: 0, isActive: true }],
                fields: [
                    { id: "1", key: "experienceLevel", label: "Nivel de Experiencia", type: "select", section: "evaluation", order: 0, isActive: true, visibleToPatient: true, options: [{ value: "principiante", label: "Principiante" }, { value: "intermedio", label: "Intermedio" }, { value: "avanzado", label: "Avanzado" }] },
                    { id: "2", key: "objective", label: "Objetivo", type: "textarea", section: "evaluation", order: 1, isActive: true, visibleToPatient: true },
                    { id: "3", key: "stressLevel", label: "Nivel de Estrés (1-10)", type: "scale", section: "evaluation", order: 2, isActive: true, visibleToPatient: true, min: 1, max: 10 },
                    { id: "4", key: "sleepQuality", label: "Calidad de Sueño", type: "textarea", section: "evaluation", order: 3, isActive: true, visibleToPatient: true },
                    { id: "5", key: "physicalLimitations", label: "Limitaciones Físicas", type: "textarea", section: "evaluation", order: 4, isActive: true, visibleToPatient: true },
                    { id: "6", key: "contraindications", label: "Contraindicaciones", type: "textarea", section: "evaluation", order: 5, isActive: true, visibleToPatient: false },
                    { id: "99", key: "isVisible", label: "Visible para el Paciente", type: "toggle", section: "evaluation", order: 99, isActive: true, visibleToPatient: false },
                ]
            }
        case "yoga_routine":
            return {
                name: "Rutina de Yoga",
                description: "Rutinas personalizadas de yoga",
                sections: [
                    { id: "routine", key: "routine", title: "Rutina", order: 0, isActive: true },
                    { id: "exercises", key: "exercises", title: "Ejercicios", order: 1, isActive: true },
                ],
                fields: [
                    { id: "0", key: "month", label: "Mes / Etapa", type: "text", section: "routine", order: -1, isActive: true, visibleToPatient: true },
                    { id: "1", key: "name", label: "Nombre de la Rutina", type: "text", section: "routine", order: 0, isActive: true, visibleToPatient: true },
                    { id: "2", key: "objective", label: "Objetivo", type: "textarea", section: "routine", order: 1, isActive: true, visibleToPatient: true },
                    { id: "3", key: "exerciseList", label: "Días de Práctica", type: "exercise_days", section: "exercises", order: 0, isActive: true, visibleToPatient: true },
                    { id: "99", key: "isVisible", label: "Visible para el Paciente", type: "toggle", section: "routine", order: 99, isActive: true, visibleToPatient: false },
                ]
            }
        case "evolution_note":
            return {
                name: "Nota de Evolución",
                description: "Nota clínica general",
                sections: [{ id: "note", key: "note", title: "Nota", order: 0, isActive: true }],
                fields: [
                    { id: "1", key: "content", label: "Contenido", type: "textarea", section: "note", order: 0, isActive: true, visibleToPatient: false },
                    { id: "99", key: "isVisible", label: "Visible para el Paciente", type: "toggle", section: "note", order: 99, isActive: true, visibleToPatient: false },
                ]
            }
        default:
            return {
                name: "Formulario Genérico",
                sections: [{ id: "general", key: "general", title: "General", order: 0, isActive: true }],
                fields: [{ id: "1", key: "notes", label: "Notas", type: "textarea", section: "general", order: 0, isActive: true }]
            }
    }
}
