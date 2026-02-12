export type UserRole = "super_admin" | "admin" | "profesional" | "cliente"
export type UserStatus = "active" | "inactive"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  status: UserStatus
  createdAt: Date
  professionalId?: string
  clientId?: string
  password?: string
  phone?: string
  dni?: string
  isActive?: boolean
}

export interface ProfessionalAvailability {
  slotDuration: number
  schedule: {
    dayOfWeek: number
    isActive: boolean
    slots: { start: string; end: string }[]
  }[]
}

export interface Professional {
  id: string
  name: string
  email: string
  phone: string
  specialty: string
  workingHours: { start: string; end: string }
  standardDuration: number
  nonWorkingDays: number[]
  services: string[]
  commissionRate: number
  isActive: boolean
  color?: string
  status: "active" | "inactive"
  availability: ProfessionalAvailability
  password?: string
}

export interface Client {
  id: string
  name: string
  dni: string
  email: string
  phone: string
  notes: string
  balance: number
  specialDiscount: number
  createdAt: Date
  password?: string
  profileImage?: string
}

export interface ServiceConfig {
  id: string
  name: string
  description: string
  basePrice: number
  standardDuration: number
  professionalPercentage: number
  requiresDeposit: boolean
  recommendedDepositPercentage: number
  isActive: boolean
  color: string
  createdAt: Date
  updatedAt: Date
  appointmentDuration?: number
}

export type AppointmentStatus =
  | "available"
  | "pending_deposit"
  | "confirmed"
  | "attended"
  | "no_show"
  | "follow_up"
  | "closed"
  | "holiday"
  | "cancelled"

export type PaymentMethod = "cash" | "transfer"

export interface AppointmentPayment {
  id: string
  amount: number
  paymentMethod: PaymentMethod
  collectedMethod?: "cash_professional" | "transfer_professional" | "cash_tense" | "transfer_tense"
  receivedByProfessionalId: string
  isDeposit: boolean
  paymentDate: Date
  createdAt: Date
  notes: string
}

export interface Appointment {
  id: string
  professionalId: string
  clientId: string
  serviceId: string
  date: Date
  startTime: string
  endTime: string
  basePrice: number
  discountPercent: number
  finalPrice: number
  professionalPercentage: number
  professionalEarnings: number
  recommendedDeposit: number
  depositAmount: number
  isDepositComplete: boolean
  paidAmount: number
  payments: AppointmentPayment[]
  status: AppointmentStatus
  isPaid: boolean
  cashCollected: number
  transferCollected: number
  notes: string
  comments: any[]
  createdAt: Date
  professionalIdCalendario?: string
  professionalIdCobro?: string
  professionalIdAtencion?: string
  isOvertimeMode?: boolean
  cancelReason?: string
  cashInTense?: number
  transfersToProfessional?: number
  paymentResolutionStatus?: "ok" | "pending_resolution"
  paymentResolutionMode?: "neteo_liquidacion" | "transferencia"
  adjustmentId?: string
  professionalPreviousId?: string
  professionalNewId?: string
  changedBy?: string
  changedAt?: Date
}

export type TransactionType =
  | "session_payment"
  | "deposit_payment"
  | "commission_collection"
  | "professional_withdrawal"
  | "product_sale"
  | "supplier_payment"
  | "cash_fund"
  | "excess_transfer"
  | "expense"
  | "adjustment"
  | "settlement_transfer"
  | "professional_settlement"
  | "monthly_reception_transfer"
  | "cash_transfer"

export type CashRegisterType = "reception" | "professional" | "administrator"

export interface Transaction {
  id: string
  date: Date
  type: TransactionType
  amount: number
  paymentMethod: PaymentMethod
  cashRegisterType: CashRegisterType
  professionalId?: string
  appointmentId?: string
  clientId?: string
  productSaleId?: string
  notes: string
  createdAt: Date
  description?: string
  category?: string
  settlementId?: string
}

export type SettlementStatus = "pending" | "reviewed" | "paid"

export interface SettlementPayment {
  id: string
  date: Date
  amount: number
  notes?: string
}

export interface Settlement {
  id: string
  professionalId: string
  date?: Date
  month?: number
  year?: number
  totalFacturado?: number
  totalBilled?: number
  baseRevenue?: number
  basePriceTotal?: number
  professionalEarningsAttended?: number
  professionalEarnings?: number
  tenseCommissionAttended?: number
  tenseCommission?: number
  totalTenseCommission?: number
  amountToSettle?: number
  totalPaid?: number
  payments?: SettlementPayment[]
  saldo_prof_debe?: number
  saldo_tense_debe?: number
  totalDiscounts?: number
  discountedRevenue?: number
  attendedRevenue?: number
  type?: "daily" | "monthly"
  status: SettlementStatus
  createdAt?: Date
  paidAt?: Date
  cashCollected?: number
  transferCollected?: number
  templateVersion?: string
  noShowDepositsLost?: number
  source?: string
  discountPercentageAbsorbed?: number
  professionalPercentage?: number
  discountAmount?: number
  displayId?: string
  attendedAppointments?: number
  noShowAppointments?: number
  totalProfessionalEarnings?: number
  professionalEarningsNoShow?: number
}

export interface Product {
  id: string
  name: string
  description?: string
  category: string
  imageUrl?: string
  costPrice: number
  salePrice: number
  currentStock: number
  minimumStock: number
  stockMinimo: number
  stockMedio: number
  mainSupplierId?: string
  relatedSupplierIds?: string[]
  supplier?: string
  unitMeasure?: string
  isActive: boolean
  createdAt: Date
  updatedAt?: Date
}

export interface Supplier {
  id: string
  name: string
  contactName: string
  email: string
  phone: string
  address: string
  notes: string
  isActive: boolean
  createdAt: Date
}

export interface ProductPurchase {
  id: string
  productId: string
  supplierId: string
  quantity: number
  unitCost: number
  totalCost: number
  date: Date
  purchaseDate?: string | Date
  invoiceNumber: string
  notes: string
  createdAt: Date
}

export interface ProductSaleItem {
  productId: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface ProductSale {
  id: string
  items: ProductSaleItem[]
  totalAmount: number
  paymentMethod: PaymentMethod
  clientId?: string
  clientName?: string
  notes: string
  date: Date
  createdAt: Date
}

export interface CashRegister {
  id: string
  type: CashRegisterType
  professionalId?: string
  date: Date
  openingBalance: number
  fixedFund?: number
  status: "open" | "closed"
  transactions: Transaction[]
}

export interface WaitlistEntry {
  id: string
  clientId: string
  professionalId?: string
  serviceId?: string
  preferredDays?: string[]
  preferredTimeRange?: string
  notes: string
  status: "pending" | "scheduled" | "cancelled"
  createdAt: Date
}

export interface ReceptionDailyClose {
  id: string
  date: Date
  userId?: string
  userName?: string
  totalProductSales: number
  totalCashSales: number
  totalTransferSales: number
  totalProfessionalCommissionCash?: number
  totalProfessionalCommissionTransfer?: number
  operationsCount: number
  openingBalance?: number
  closingBalance?: number
  closedBy?: string
  closedByName?: string
  status?: "open" | "closed"
  createdAt: Date
}

export interface ReceptionMonthlyClose {
  id: string
  month: number
  year: number
  userId: string
  userName: string
  totalProductSalesCash: number
  totalProductSalesTransfer: number
  totalProfessionalCommissionCash: number
  totalProfessionalCommissionTransfer: number
  excessTransferred: number
  status: "open" | "closed"
  createdAt: Date
  operationsCount?: number
  fixedFundAfterClose?: number
  closedBy?: string
  closedByName?: string
  closedAt?: Date
}

export interface ServicePack {
  id: string
  serviceId: string
  name: string
  sessionsCount: number
  totalPrice: number
  validityDays: number
  maxReschedules?: number
  requiresDeposit?: boolean
  depositAmount?: number
  isActive: boolean
  createdAt: Date
}

export interface BankAccount {
  id: string
  name: string
  bankName: string
  accountNumber: string
  cbu: string
  alias: string
  type: string
  balance: number
  isActive: boolean
  createdAt: Date
}

export interface ProductCategoryConfig {
  id: string
  name: string
  description?: string
  isActive: boolean
}

export type FormRefType = "string" | "number" | "boolean" | "date"

export type FormFieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "multiselect"
  | "checkbox"
  | "radio"
  | "date"
  | "time"
  | "scale"
  | "toggle"
  | "section"
  | "note"
  | "exercise_list"
  | "exercise_days"

export interface FormSectionConfig {
  id: string
  key: string
  title: string
  description?: string
  order: number
  isActive: boolean
  isCollapsible?: boolean
}

export interface FormFieldConfig {
  id: string
  key: string
  label: string
  type: FormFieldType
  section: string
  order: number
  isActive: boolean
  required?: boolean
  visibleToPatient?: boolean
  options?: { value: string; label: string }[]
  min?: number
  max?: number
  defaultValue?: any
  placeholder?: string
  helpText?: string
}

export type ClinicalFormType =
  | "kinesiology_evaluation"
  | "kinesiology_treatment"
  | "kine_home"
  | "training_evaluation"
  | "training_routine"
  | "nutrition_anthropometry"
  | "nutrition_recipe"
  | "massage_evaluation"
  | "yoga_evaluation"
  | "yoga_routine"
  | "evolution_note"
  | "personal"
  | "exercise_log"

export interface ClinicalFormConfig {
  id: string
  name: string
  description: string
  formType: ClinicalFormType
  category?: string
  sections: FormSectionConfig[]
  fields: FormFieldConfig[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ChatConversation {
  id: string
  clientId?: string
  professionalId?: string
  participantIds: string[]
  participantNames: string[]
  lastMessage?: string
  lastMessageAt: Date
  unreadCount: number
  createdAt: Date
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  content: string
  type: "text" | "image" | "file"
  senderRole?: string
  createdAt: Date
  readBy: string[]
}

export interface CommunityPost {
  id: string
  authorId: string
  authorName: string
  content: string
  category: string
  likes: string[]
  comments: any[]
  createdAt: Date
}

export interface StaffTask {
  id: string
  title: string
  description: string
  assignedTo: string
  status: "pending" | "completed"
  dueDate: Date
  createdAt: Date
  updatedAt: Date
  linkedAdjustmentId?: string
  linkedAppointmentId?: string
  linkedTaskId?: string
}

export interface InterProfessionalAdjustment {
  id: string
  fromProfessionalId: string
  toProfessionalId: string
  amount: number
  mode: "neteo_liquidacion" | "transferencia"
  status: "resolved" | "pending" | "waiting_reception_validation"
  appointmentId: string
  sourcePaymentIds: string[]
  collectedByProfessionalId: string
  notes?: string
  autoResolved?: boolean
  createdAt: Date
  resolvedAt?: Date
  evidenceUrl?: string
  professionalMarkedAsDone?: boolean
}

export interface StaffGoal {
  id: string
  title: string
  description: string
  targetValue: number
  currentValue: number
  unit: string
  startDate: Date
  endDate: Date
  status: "active" | "achieved" | "expired"
  createdAt: Date
  updatedAt: Date
}

export interface ClinicalTask {
  id: string
  clientId: string
  title: string
  description: string
  status: "pending" | "completed"
  dueDate: Date
  createdAt: Date
  updatedAt: Date
  evidence?: { type: "photo" | "comment"; content: string; submittedAt?: Date }[]
  impactType?: "positive" | "negative"
  points?: number
  completedAt?: Date
  validatedByProfessional?: boolean
  validatedAt?: Date
}

export interface ClinicalTaskEvent {
  id: string
  taskId: string
  eventType: string
  content?: string
  createdAt: Date
  date?: Date
  clientId?: string
  points?: number
  description?: string
}

export interface BodyZone {
  id: string
  zone: string
  label?: string
  name?: string
  treatment?: string
  intensity?: string
  notes?: string
  visibleToPatient?: boolean
}

// === Exercise / Routine Types ===

export interface ExerciseItem {
  id: string
  title: string
  description: string
  setsReps: string
  videoUrl: string
  notes: string
}

// Block Types
export type RoutineBlockType = 'standard' | 'circuit'

export interface RoutineBlock {
  id: string
  title: string
  type: RoutineBlockType
  notes?: string
  order: number
  circuit?: {
    rounds?: number
    restSeconds?: number
    timeCapSeconds?: number
    format?: 'for_reps' | 'amrap' | 'emom' | 'quality'
  }
  exercises: ExerciseItem[]
}

export interface RoutineDay {
  id: string
  name: string
  exercises: ExerciseItem[] // Legacy: exercises if no blocks
  blocks?: RoutineBlock[]   // New: blocks of exercises
}

export interface ExerciseLog {
  id: string
  routineId: string // clinical_entries.id
  dayId: string
  dayName?: string
  date: string // ISO
  notes?: string
  exercises: Array<{
    exerciseId: string
    completed: boolean
    weight: string
    duration: string
    notes: string
  }>
}

export interface ZoneNote {
  id: string
  zoneIds: string[]
  treatment: string
  intensity: string
  notes: string
}

export interface KinesiologyEvaluation {
  id: string
  clientId: string
  professionalId: string
  date: Date | string
  sessionNumber?: number
  consultReason?: string
  painType?: string
  evaScale?: number
  painMoment?: string
  painChronology?: string
  previousTreatments?: string
  abdominalInflammation?: boolean
  heartburn?: boolean
  regularEvacuation?: boolean
  hemorrhoids?: boolean
  variedDiet?: boolean
  foodRejection?: string
  varicoseVeins?: boolean
  intenseMenstrualPain?: boolean
  sleepQuality?: string
  headaches?: string
  diagnosis?: string
  treatmentPlan?: string
  notes?: string
  visibleToPatient: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AdherenceEvaluation {
  attendancePoints: number
  positivePoints: number
  negativePoints: number
  note: string
  justification: {
    hydration?: boolean
    sleep?: boolean
    tasks?: boolean
    progress?: boolean
    training?: boolean
    painImproved?: boolean
    painWorsened?: boolean
    noData?: boolean
    noTasks?: boolean
    others?: boolean
  }
  showBreakdownToPatient: boolean
  showNoteToPatient: boolean
  assignedBy: string
  assignedAt: Date
}

export interface KinesiologyTreatment {
  id: string
  clientId: string
  professionalId: string
  date: Date | string
  sessionNumber: number
  attended: boolean
  sessionWork?: string
  indication?: string
  nextSession?: string
  exercises?: string
  comments?: string
  bodyZones?: BodyZone[]
  zoneNotes?: ZoneNote[]
  // Temp form fields
  zonesTreatment?: string
  zonesIntensity?: string
  zonesNotes?: string
  visibleToPatient: boolean
  adherence?: AdherenceEvaluation
  createdAt: Date
}

export interface MassageSession {
  id: string
  clientId: string
  professionalId: string
  date: Date | string
  sessionWork?: string
  comments?: string
  bodyZones?: BodyZone[]
  zoneNotes?: ZoneNote[]
  visibleToPatient: boolean
  adherence?: AdherenceEvaluation
  createdAt: Date
}

export interface YogaSession {
  id: string
  clientId: string
  professionalId: string
  date: Date | string
  notes?: string
  poses?: string[]
  visibleToPatient: boolean
  adherence?: AdherenceEvaluation
  createdAt: Date
}

export interface NutritionalEvaluation {
  id: string
  clientId: string
  professionalId: string
  date: Date | string
  weight?: number
  height?: number
  imc?: number
  bmi?: number // Support both
  fatPercentage?: number
  observations?: string
  visibleToPatient: boolean
  adherence?: AdherenceEvaluation
  createdAt: Date
}

export interface HomeExercise {
  id: string
  name: string
  description?: string
  sets?: string
  reps?: string
  repsOrTime?: string
  frequency?: string
  videoUrl?: string
  warnings?: string
  visibleToPatient: boolean
}

export interface KineHomeProgram {
  id: string
  clientId: string
  professionalId: string
  date: Date | string
  region?: string
  objective?: string
  exercises: HomeExercise[]
  status: "active" | "completed" | "cancelled"
  visibleToPatient: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TrainingEvaluation {
  id: string
  clientId: string
  professionalId: string
  date: Date | string
  objective?: string
  currentLevel?: string
  injuries?: string
  limitations?: string
  visibleToPatient: boolean
  createdAt: Date
  updatedAt: Date
}

export interface RoutineExercise {
  id: string
  name: string
  sets?: string
  reps?: string
  weight?: string
  rest?: string
  notes?: string
  videoUrl?: string
  visibleToPatient: boolean
}

export interface TrainingRoutine {
  id: string
  clientId: string
  professionalId: string
  date: Date | string
  name: string
  objective?: string
  exercises: RoutineExercise[]
  status: "active" | "completed" | "cancelled"
  visibleToPatient: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ClinicalEvolution {
  id: string
  professionalId: string
  date: Date | string
  content: string
  visibleToPatient: boolean
  createdAt: Date
}

export interface MedicalMedia {
  id: string
  professionalId: string
  date: Date | string
  title: string
  type: "image" | "video" | "file"
  url: string
  visibleToPatient: boolean
  createdAt: Date
}

export interface PatientDailyLog {
  id: string
  clientId: string
  date: Date | string
  hydration: {
    amount: number
    unit: "vasos" | "litros"
    goalReached: boolean
  }
  pain: {
    eva: number
    location?: string
  }
  sleep: {
    hours: number
    quality: 1 | 2 | 3 | 4 | 5
    awakenings: boolean
  }
  stress: {
    level: number
    source?: string
  }
  mood: {
    value: "muy_bajo" | "bajo" | "neutro" | "bueno" | "muy_bueno"
    notes?: string
  }
  activity: {
    steps: number
    type: "entrenamiento" | "caminata" | "yoga" | "reposo"
    duration: number // minutes
  }
  nutrition: {
    description: string
    respectedCompliance: boolean
  }
  measurements: {
    weight?: number
    height?: number
  }
  notesForSession?: string
  photos: {
    url: string
    category: "frontal" | "lateral" | "posterior"
    date: Date
  }[]
  createdAt: Date
}

export type PatientTaskType = "habitos" | "salud" | "recuperacion" | "nutricion" | "sueño"
export type PatientTaskFrequency = "unica" | "diaria" | "semanal"
export type PatientTaskStatus = "pending" | "completed" | "expired"

export interface PatientTask {
  id: string
  clientId: string
  professionalId: string
  title: string
  description: string
  type: PatientTaskType
  startDate: Date | string
  endDate: Date | string
  frequency: PatientTaskFrequency
  pointsValue: number
  status: PatientTaskStatus
  visibleToPatient: boolean
  evidence?: {
    comment?: string
    url?: string
    date?: Date
  }
  createdAt: Date
  updatedAt: Date
}

export interface ProgressPoint {
  date: Date | string
  score: number
  event?: string // e.g., "Tarea cumplida", "Sesión asistida"
  type: "positive" | "negative" | "neutral"
  adherenceDetails?: {
    attendance: number
    positive: number
    negative: number
    note?: string
    showToPatient: boolean
  }
}

export interface ClinicalEntry {
  id: string
  clientId: string
  professionalId?: string
  serviceCategory: string
  formType: ClinicalFormType
  sessionNumber?: number
  attentionDate: Date | string
  visibleToPatient: boolean
  content: any
  templateSnapshot: any
  bodyMap: any
  adherence: any
  points?: number
  createdAt: Date
  updatedAt: Date
}

export interface MedicalRecord {
  id: string
  clientId: string
  clinicalEntries?: ClinicalEntry[]
  personalData: {
    bloodType: string
    allergies: string[]
    chronicConditions: string[]
    currentMedications: string[]
    emergencyContact: {
      name: string
      phone: string
      relationship: string
    }
  }
  kinesiologyEvaluations: KinesiologyEvaluation[]
  kinesiologyTreatments: KinesiologyTreatment[]
  kineHomePrograms: KineHomeProgram[]
  trainingEvaluations: TrainingEvaluation[]
  trainingRoutines: TrainingRoutine[]
  anthropometryEvaluations: NutritionalEvaluation[]
  recipes: any[]
  nutritionalEducation: any[]
  massageEvaluations: MassageSession[]
  yogaEvaluations: YogaSession[]
  clinicalEvolutions: ClinicalEvolution[]
  medicalMedia: MedicalMedia[]
  patientLogs?: PatientDailyLog[]
  patientTasks?: PatientTask[]
  progressHistory?: ProgressPoint[]
  dailyLogs: any[]
  smartObjectives: any[]
  achievements: any[]
  clinicalDecisions: any[]
  activityLogs: any[]
  healthStatus: {
    general: string
    lastCheckup: Date
    alerts: string[]
  }
  lastUpdated: Date
  createdAt: Date
  version: number
}

export interface CashTransfer {
  id: string
  profesionalId: string
  month: number
  year: number
  monto: number
  status: "pendiente" | "confirmado"
  fechaCreacion: Date
  fechaConfirmacion?: Date
}
export interface CompanyInfo {
  name: string
  cuit: string
  address: string
  phone: string
  email: string
  website: string
  logoUrl?: string
  currency: string
  openingHours: string
}
