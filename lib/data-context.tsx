"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import {
  User,
  Professional,
  Client,
  Appointment,
  Transaction,
  CashRegister,
  ServiceConfig,
  ServicePack,
  CashRegisterType,
  AppointmentStatus,
  AppointmentPayment,
  Settlement,
  SettlementStatus,
  Product,
  Supplier,
  ProductPurchase,
  ProductSale,
  BankAccount,
  ProductCategoryConfig,
  WaitlistEntry,
  ReceptionDailyClose,
  ReceptionMonthlyClose,
  ClinicalFormConfig,
  ChatConversation,
  ChatMessage,
  CommunityPost,
  StaffTask,
  StaffGoal,
  ClinicalTask,
  ClinicalTaskEvent,
  MedicalRecord,
  CashTransfer,
  PatientDailyLog,
  UserStatus,
  PatientTask,
  PatientTaskStatus,
  ProgressPoint,
  CompanyInfo,
  InterProfessionalAdjustment,
  ClinicalEntry,
  Covenant,
  ClinicalFormType,
  MealTemplate,
  MealPlanItem, // Ensure this is imported if used in MealTemplate content
} from "./types"
import { getDefaultFormConfig, FORM_TYPES_INFO } from "./clinical-forms-defaults"
import {
  users as mockUsers,
  professionals as mockProfessionals,
  clients as mockClients,
  appointments as mockAppointments,
  transactions as mockTransactions,
  cashRegisters as mockCashRegisters,
  settlements as mockSettlements,
  serviceConfigs as mockServiceConfigs,
  servicePacks as mockServicePacks,
  products as mockProducts,
  conversations as mockConversations,
  chatMessages as mockChatMessages,
  mockOccupationGoals,
} from "./mock-data"
import { supabase, isSupabaseConfigured } from "./supabase-client"
import { SYNC_CONFIG, deleteFromSupabase as apiDelete, upsertToSupabase as apiUpsert } from "./supabase-sync"
import { fetchClientLogs } from "./exercise-logs.storage"
import { getDateInISO } from "./utils"

const mockClinicalTasks: ClinicalTask[] = []
const mockClinicalTaskEvents: ClinicalTaskEvent[] = []

interface DataContextType {
  // Users
  users: User[]
  addUser: (user: Omit<User, "id" | "createdAt">) => void
  updateUser: (id: string, data: Partial<User>) => void
  deleteUser: (id: string) => void

  // Professionals
  professionals: Professional[]
  addProfessional: (professional: Omit<Professional, "id">) => void
  updateProfessional: (id: string, data: Partial<Professional>) => void
  deleteProfessional: (id: string) => void
  selectedProfessionalId: string | null
  setSelectedProfessionalId: (id: string | null) => void
  selectedProfessionalIds: string[]
  setSelectedProfessionalIds: (ids: string[]) => void
  toggleProfessionalSelection: (id: string) => void

  // Clients
  clients: Client[]
  addClient: (client: Omit<Client, "id" | "createdAt">) => void
  updateClient: (id: string, data: Partial<Client>) => void

  // Service Configs
  serviceConfigs: ServiceConfig[]
  addServiceConfig: (service: Omit<ServiceConfig, "id" | "createdAt" | "updatedAt">) => void
  updateServiceConfig: (id: string, data: Partial<ServiceConfig>) => void

  // Service Packs
  servicePacks: ServicePack[]
  addServicePack: (pack: Omit<ServicePack, "id" | "createdAt">) => void
  updateServicePack: (id: string, data: Partial<ServicePack>) => void
  deleteServicePack: (id: string) => void

  // Products
  products: Product[]
  addProduct: (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => void
  updateProduct: (id: string, data: Partial<Product>) => void
  deleteProduct: (id: string) => void

  // Suppliers
  suppliers: Supplier[]
  addSupplier: (supplier: Omit<Supplier, "id" | "createdAt">) => void
  updateSupplier: (id: string, data: Partial<Supplier>) => void
  deleteSupplier: (id: string) => void

  // Product Purchases
  productPurchases: ProductPurchase[]
  addProductPurchase: (purchase: Omit<ProductPurchase, "id" | "createdAt">) => void

  // Product Sales
  productSales: ProductSale[]
  addProductSale: (sale: Omit<ProductSale, "id" | "createdAt">) => ProductSale | null

  // Bank Accounts
  bankAccounts: BankAccount[]
  addBankAccount: (account: Omit<BankAccount, "id" | "createdAt">) => void
  updateBankAccount: (id: string, data: Partial<BankAccount>) => void
  deleteBankAccount: (id: string) => void

  // Product Categories
  productCategories: ProductCategoryConfig[]
  addProductCategory: (category: Omit<ProductCategoryConfig, "id">) => void
  updateProductCategory: (id: string, data: Partial<ProductCategoryConfig>) => void
  deleteProductCategory: (id: string) => void

  // Appointments
  appointments: Appointment[]
  addAppointment: (appointment: Omit<Appointment, "id" | "createdAt">) => void
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void
  updateAppointment: (id: string, data: Partial<Appointment>) => void
  addPaymentToAppointment: (appointmentId: string, payment: Omit<AppointmentPayment, "id" | "createdAt">) => void
  deletePaymentFromAppointment: (appointmentId: string, paymentId: string) => void
  deleteAppointment: (appointmentId: string) => void

  // Transactions
  transactions: Transaction[]
  addTransaction: (transaction: Omit<Transaction, "id" | "createdAt">) => void
  updateTransaction: (transaction: Transaction) => void
  addStaffTask: (task: Omit<StaffTask, "id" | "createdAt" | "updatedAt">) => StaffTask

  // Cash Registers
  cashRegisters: CashRegister[]
  getCashRegister: (type: CashRegisterType, professionalId?: string) => CashRegister | undefined
  openCashRegister: (type: CashRegisterType, openingBalance: number, professionalId?: string) => void
  closeCashRegister: (type: CashRegisterType, professionalId?: string) => void
  closeReceptionCash: () => { excess: number }
  deliverCashToProfessional: (professionalId: string, amount: number) => void

  // Inter-professional Adjustments
  interProfessionalAdjustments: InterProfessionalAdjustment[]
  addInterProfessionalAdjustment: (adjustment: Omit<InterProfessionalAdjustment, "id" | "createdAt" | "resolvedAt">) => InterProfessionalAdjustment
  markAdjustmentAsDone: (id: string, evidenceUrl: string) => void
  confirmAdjustmentResolution: (id: string) => void

  // Settlements
  settlements: Settlement[]
  setSettlements: React.Dispatch<React.SetStateAction<Settlement[]>>
  generateSettlement: (professionalId: string, month: number, year: number) => Settlement | null
  generateDailySettlement: (professionalId: string, date: Date) => Settlement | null
  updateSettlementStatus: (id: string, status: Settlement["status"]) => void
  updateSettlement: (settlement: Settlement) => void
  deleteSettlement: (id: string) => void
  addSettlementPayment: (settlementId: string, amount: number, notes?: string) => void

  // Helper functions
  calculateAppointmentFinancials: (
    serviceId: string,
    clientId: string,
  ) => {
    basePrice: number
    discountPercent: number
    finalPrice: number
    professionalPercentage: number
    professionalEarnings: number
    recommendedDeposit: number
  } | null

  // Waitlist management
  waitlist: WaitlistEntry[]
  addToWaitlist: (entry: Omit<WaitlistEntry, "id" | "createdAt">) => void
  updateWaitlistEntry: (id: string, data: Partial<WaitlistEntry>) => void
  removeFromWaitlist: (id: string) => void

  // Helper functions for products
  getProductStockStatus: (product: Product) => "ok" | "medio" | "bajo"
  getProductPurchaseHistory: (productId: string) => ProductPurchase[]
  getProductCostAnalysis: (productId: string) => {
    averageCost: number
    minCost: number
    maxCost: number
    costBySupplier: { supplierId: string; avgCost: number }[]
  }

  // Reception cash management
  receptionDailyCloses: ReceptionDailyClose[]
  receptionMonthlyCloses: ReceptionMonthlyClose[]
  closeReceptionDaily: (userId: string, userName: string) => ReceptionDailyClose | null
  closeReceptionMonthly: (userId: string, userName: string, fixedFund: number) => ReceptionMonthlyClose | null
  getReceptionProductSalesToday: () => { total: number; cashTotal: number; transferTotal: number; count: number }
  getReceptionProductSalesMonth: (
    month: number,
    year: number,
  ) => { total: number; cashTotal: number; transferTotal: number; count: number }
  isLastDayOfMonth: () => boolean
  canCloseReceptionDaily: (date: Date) => boolean
  canCloseReceptionMonthly: (month: number, year: number) => boolean

  clinicalFormConfigs: ClinicalFormConfig[]
  addClinicalFormConfig: (config: Omit<ClinicalFormConfig, "id" | "createdAt" | "updatedAt">) => void
  updateClinicalFormConfig: (id: string, data: Partial<ClinicalFormConfig>) => void
  deleteClinicalFormConfig: (id: string) => void
  getClinicalFormConfig: (formType: ClinicalFormConfig["formType"]) => ClinicalFormConfig | undefined

  conversations: ChatConversation[]
  chatMessages: ChatMessage[]
  addConversation: (conversation: Omit<ChatConversation, "id" | "createdAt">) => ChatConversation
  addChatMessage: (message: Omit<ChatMessage, "id" | "createdAt">) => ChatMessage
  markMessagesAsRead: (conversationId: string) => void

  communityPosts: CommunityPost[]
  addCommunityPost: (post: Omit<CommunityPost, "id" | "createdAt" | "likes" | "comments">) => void
  updateCommunityPost: (id: string, updates: Partial<CommunityPost>) => void
  deleteCommunityPost: (id: string) => void

  tasks: StaffTask[]
  addTask: (task: Omit<StaffTask, "id" | "createdAt" | "updatedAt">) => void
  updateTask: (id: string, data: Partial<StaffTask>) => void
  deleteTask: (id: string) => void

  goals: StaffGoal[]
  addGoal: (goal: Omit<StaffGoal, "id" | "createdAt" | "updatedAt">) => void
  updateGoal: (id: string, data: Partial<StaffGoal>) => void
  deleteGoal: (id: string) => void

  clinicalTasks: ClinicalTask[]
  clinicalTaskEvents: ClinicalTaskEvent[]
  addClinicalTask: (task: Omit<ClinicalTask, "id" | "createdAt" | "updatedAt">) => ClinicalTask
  updateClinicalTask: (id: string, updates: Partial<ClinicalTask>) => void
  deleteClinicalTask: (id: string) => void
  completeClinicalTask: (id: string, evidence?: { type: "photo" | "comment"; content: string }) => void
  validateClinicalTask: (id: string) => void
  getClientClinicalTasks: (clientId: string) => ClinicalTask[]
  getClinicalTaskEvents: (clientId: string) => ClinicalTaskEvent[]

  medicalRecords: MedicalRecord[]
  getMedicalRecord: (clientId: string) => MedicalRecord | undefined

  // Clinical Entries
  clinicalEntries: ClinicalEntry[]
  loadClinicalEntries: (clientId: string) => Promise<ClinicalEntry[]>
  saveClinicalEntry: (entry: ClinicalEntry) => Promise<void>
  deleteClinicalEntry: (id: string) => Promise<void>
  uploadClinicalMedia: (file: File) => Promise<string | null>
  addMedicalRecord: (record: MedicalRecord) => void
  updateMedicalRecord: (clientId: string, record: MedicalRecord) => void
  addPatientLog: (clientId: string, log: Omit<PatientDailyLog, "id" | "createdAt">) => void
  addPatientTask: (clientId: string, task: Omit<PatientTask, "id" | "createdAt" | "updatedAt">) => void
  updatePatientTaskStatus: (clientId: string, taskId: string, status: PatientTaskStatus, evidence?: any) => void


  // Cash Transfers
  cashTransfers: CashTransfer[]
  setCashTransfers: React.Dispatch<React.SetStateAction<CashTransfer[]>>
  confirmCashTransfer: (transferId: string) => void
  deleteCashTransfer: (transferId: string) => void
  updateCashTransfer: (transferId: string, data: Partial<CashTransfer>) => void

  // Company Info
  companyInfo: CompanyInfo
  updateCompanyInfo: (data: Partial<CompanyInfo>) => void

  isInitialized: boolean

  // Covenants
  covenants: Covenant[]
  addCovenant: (covenant: Omit<Covenant, "id" | "createdAt">) => void
  updateCovenant: (id: string, data: Partial<Covenant>) => void
  deleteCovenant: (id: string) => void
  getCovenant: (id: string) => Covenant | undefined

  // Meal Templates
  mealTemplates: MealTemplate[]
  saveMealTemplate: (name: string, content: MealPlanItem[]) => Promise<void>
  deleteMealTemplate: (id: string) => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)


// Helper functions for case conversion
const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => toSnakeCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        result[snakeKey] = toSnakeCase(obj[key]);
        return result;
      },
      {} as any
    );
  }
  return obj;
}

const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => toCamelCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => {
        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        result[camelKey] = toCamelCase(obj[key]);
        return result;
      },
      {} as any
    );
  }
  return obj;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null)
  const [selectedProfessionalIds, setSelectedProfessionalIds] = useState<string[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [serviceConfigs, setServiceConfigs] = useState<ServiceConfig[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [servicePacks, setServicePacks] = useState<ServicePack[]>([])
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([])
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [cashTransfers, setCashTransfers] = useState<CashTransfer[]>([])
  const [interProfessionalAdjustments, setInterProfessionalAdjustments] = useState<InterProfessionalAdjustment[]>([])

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [productPurchases, setProductPurchases] = useState<ProductPurchase[]>([])
  const [productSales, setProductSales] = useState<ProductSale[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [productCategories, setProductCategories] = useState<ProductCategoryConfig[]>([])

  const [receptionDailyCloses, setReceptionDailyCloses] = useState<ReceptionDailyClose[]>([])
  const [receptionMonthlyCloses, setReceptionMonthlyCloses] = useState<ReceptionMonthlyClose[]>([])

  const [clinicalFormConfigs, setClinicalFormConfigs] = useState<ClinicalFormConfig[]>([])
  const [covenants, setCovenants] = useState<Covenant[]>([])

  const [clinicalTasks, setClinicalTasks] = useState<ClinicalTask[]>([])
  const [clinicalTaskEvents, setClinicalTaskEvents] = useState<ClinicalTaskEvent[]>([])

  const [mealTemplates, setMealTemplates] = useState<MealTemplate[]>([])

  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("tense_company_info")
      if (saved) return JSON.parse(saved)
    }
    return {
      name: "Tense Kinesiología",
      cuit: "30-12345678-9",
      address: "Av. Principal 123, Ciudad",
      phone: "+54 11 1234-5678",
      email: "info@tense.com",
      website: "www.tense.com",
      currency: "ARS",
      openingHours: "Lunes a Viernes 08:00 - 20:00",
    }
  })

  const [clinicalEntries, setClinicalEntries] = useState<ClinicalEntry[]>([])

  const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
    if (typeof window === "undefined") return defaultValue
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.error(`Error loading ${key}:`, e)
    }
    return defaultValue
  }

  // Helper to convert snake_case to camelCase
  const toCamelCase = (obj: Record<string, any>): Record<string, any> => {
    const result: Record<string, any> = {}
    for (const key in obj) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      result[camelKey] = obj[key]
    }
    return result
  }

  // Load from Supabase ONLY (no localStorage fallback)
  const loadFromSupabase = async <T,>(
    tableName: string,
    defaultValue: T[]
  ): Promise<T[]> => {
    try {
      const { data, error } = await supabase.from(tableName).select('*')

      if (error) {
        // Silently handle cases where the table hasn't been created yet in Supabase
        if (!error.message.includes("schema cache") && !error.message.includes("does not exist")) {
          console.error(`[Supabase Load] Error fetching ${tableName}:`, error.message)
        }
        return defaultValue
      }

      if (data && data.length > 0) {
        console.log(`[Supabase Load] Successfully loaded ${data.length} items from ${tableName}`)
        return data.map(row => toCamelCase(row) as T)
      }

      // No data in Supabase, return defaults
      return defaultValue
    } catch (err) {
      console.error(`[Supabase Load] Failed to load ${tableName}:`, err)
      return defaultValue
    }
  }

  const [tasks, setTasks] = useState<StaffTask[]>([])
  const [goals, setGoals] = useState<StaffGoal[]>([])

  const [conversations, setConversations] = useState<ChatConversation[]>(() =>
    loadFromStorage("tense_erp_conversations", mockConversations),
  )
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() =>
    loadFromStorage("tense_erp_chat_messages", mockChatMessages),
  )

  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(() =>
    loadFromStorage("tense_erp_community_posts", []),
  )

  useEffect(() => {
    const loadData = async () => {
      if (typeof window === "undefined") return

      // Load from Supabase ONLY for main entities
      const [
        supabaseAppts, supabaseClients, supabaseProfs, supabaseUsers,
        supabasePacks, supabaseCovenants, supabaseTransactions,
        supabaseFormConfigs, supabaseMealTemplates,
        // New Entities
        supabaseProducts, supabaseCategories, supabaseSuppliers,
        supabasePurchases, supabaseSales,
        supabaseCashRegisters, supabaseBankAccounts, supabaseCashTransfers,
        supabaseSettlements, supabaseAdjustments,
        supabaseDailyCloses, supabaseMonthlyCloses,
        supabaseWaitlist, supabaseStaffTasks, supabaseStaffGoals,
        supabaseClinicalTasks, supabaseClinicalTaskEvents,
        supabaseMedicalRecords, supabaseClinicalEntries,
        supabaseConversations, supabaseChatMessages, supabasePosts
      ] = await Promise.all([
        loadFromSupabase<Appointment>(SYNC_CONFIG.appointments.tableName, []),
        loadFromSupabase<Client>(SYNC_CONFIG.clients.tableName, []),
        loadFromSupabase<Professional>(SYNC_CONFIG.professionals.tableName, []),
        loadFromSupabase<User>(SYNC_CONFIG.users.tableName, []),
        loadFromSupabase<ServicePack>(SYNC_CONFIG.servicePacks.tableName, []),
        loadFromSupabase<Covenant>(SYNC_CONFIG.covenants.tableName, []),
        loadFromSupabase<Transaction>(SYNC_CONFIG.transactions.tableName, []),
        loadFromSupabase<ClinicalFormConfig>(SYNC_CONFIG.clinicalFormConfigs.tableName, []),
        loadFromSupabase<MealTemplate>(SYNC_CONFIG.mealTemplates.tableName, []),

        // New Loads
        loadFromSupabase<Product>(SYNC_CONFIG.products.tableName, []),
        loadFromSupabase<ProductCategoryConfig>(SYNC_CONFIG.productCategories.tableName, []),
        loadFromSupabase<Supplier>(SYNC_CONFIG.suppliers.tableName, []),
        loadFromSupabase<ProductPurchase>(SYNC_CONFIG.productPurchases.tableName, []),
        loadFromSupabase<ProductSale>(SYNC_CONFIG.productSales.tableName, []),

        loadFromSupabase<CashRegister>(SYNC_CONFIG.cashRegisters.tableName, []),
        loadFromSupabase<BankAccount>(SYNC_CONFIG.bankAccounts.tableName, []),
        loadFromSupabase<CashTransfer>(SYNC_CONFIG.cashTransfers.tableName, []),
        loadFromSupabase<Settlement>(SYNC_CONFIG.settlements.tableName, []),
        loadFromSupabase<InterProfessionalAdjustment>(SYNC_CONFIG.interProfessionalAdjustments.tableName, []),

        loadFromSupabase<ReceptionDailyClose>(SYNC_CONFIG.receptionDailyCloses.tableName, []),
        loadFromSupabase<ReceptionMonthlyClose>(SYNC_CONFIG.receptionMonthlyCloses.tableName, []),

        loadFromSupabase<WaitlistEntry>(SYNC_CONFIG.waitlist.tableName, []),
        loadFromSupabase<StaffTask>(SYNC_CONFIG.staffTasks.tableName, []),
        loadFromSupabase<StaffGoal>(SYNC_CONFIG.staffGoals.tableName, []),

        loadFromSupabase<ClinicalTask>(SYNC_CONFIG.clinicalTasks.tableName, []),
        loadFromSupabase<ClinicalTaskEvent>(SYNC_CONFIG.clinicalTaskEvents.tableName, []),
        loadFromSupabase<MedicalRecord>(SYNC_CONFIG.medicalRecords.tableName, []),
        loadFromSupabase<ClinicalEntry>(SYNC_CONFIG.clinicalEntries.tableName, []),

        loadFromSupabase<ChatConversation>(SYNC_CONFIG.chatConversations.tableName, []),
        loadFromSupabase<ChatMessage>(SYNC_CONFIG.chatMessages.tableName, []),
        loadFromSupabase<CommunityPost>(SYNC_CONFIG.communityPosts.tableName, []),
      ])

      // =========================================================================================
      // CLOUD-FIRST DATA INITIALIZATION
      // We prioritize Supabase data. LocalStorage is only updated, not read (unless fallback needed).
      // =========================================================================================

      // 1. Core Entities
      setAppointments(supabaseAppts)
      saveToStorage(SYNC_CONFIG.appointments.localStorageKey, supabaseAppts)

      setClients(supabaseClients)
      saveToStorage(SYNC_CONFIG.clients.localStorageKey, supabaseClients)

      setProfessionals(supabaseProfs)
      saveToStorage(SYNC_CONFIG.professionals.localStorageKey, supabaseProfs)

      // Users - Ensure Admin/Reception exists if DB is empty (Bootstrap)
      let finalUsers = [...supabaseUsers]
      const systemUsers = mockUsers.filter(u => u.role === 'super_admin' || u.role === 'admin' || u.email.includes('recepcion'))
      systemUsers.forEach(sysUser => {
        if (!finalUsers.some(u => u.email === sysUser.email)) {
          finalUsers.push(sysUser)
        }
      })
      setUsers(finalUsers)
      saveToStorage(SYNC_CONFIG.users.localStorageKey, finalUsers)

      // 2. Services & Configs
      setServicePacks(supabasePacks)
      saveToStorage(SYNC_CONFIG.servicePacks.localStorageKey, supabasePacks)

      setCovenants(supabaseCovenants)
      saveToStorage(SYNC_CONFIG.covenants.localStorageKey, supabaseCovenants)

      setTransactions(supabaseTransactions)
      saveToStorage(SYNC_CONFIG.transactions.localStorageKey, supabaseTransactions)

      // Merge Form Configs (Remote + Defaults)
      // Check if we have remote configs, if not, fallback to defaults
      // But we always prefer remote if available.
      let finalFormConfigs = [...supabaseFormConfigs]
      // Ensure defaults exist if not in DB
      FORM_TYPES_INFO.forEach(typeInfo => {
        if (!finalFormConfigs.find(c => c.formType === typeInfo.value)) {
          finalFormConfigs.push({
            id: crypto.randomUUID(),
            ...getDefaultFormConfig(typeInfo.value),
            formType: typeInfo.value,
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true
          } as ClinicalFormConfig)
        }
      })
      setClinicalFormConfigs(finalFormConfigs)
      saveToStorage(SYNC_CONFIG.clinicalFormConfigs.localStorageKey, finalFormConfigs)

      setMealTemplates(supabaseMealTemplates)
      saveToStorage(SYNC_CONFIG.mealTemplates.localStorageKey, supabaseMealTemplates)

      // 3. Inventory & Sales (New via Supabase)
      setProducts(supabaseProducts)
      setProductCategories(supabaseCategories)
      setSuppliers(supabaseSuppliers)
      setProductPurchases(supabasePurchases)
      setProductSales(supabaseSales)

      // 4. Finance (New via Supabase)
      setCashRegisters(supabaseCashRegisters)
      setBankAccounts(supabaseBankAccounts)
      setCashTransfers(supabaseCashTransfers)
      setSettlements(supabaseSettlements)
      setInterProfessionalAdjustments(supabaseAdjustments)
      setReceptionDailyCloses(supabaseDailyCloses)
      setReceptionMonthlyCloses(supabaseMonthlyCloses)

      // 5. Management (New via Supabase)
      setWaitlist(supabaseWaitlist)
      setTasks(supabaseStaffTasks)
      setGoals(supabaseStaffGoals)

      // 6. Clinical Records (New via Supabase)
      setClinicalTasks(supabaseClinicalTasks)
      setClinicalTaskEvents(supabaseClinicalTaskEvents)
      setMedicalRecords(supabaseMedicalRecords)
      setClinicalEntries(supabaseClinicalEntries)

      // 7. Communication (New via Supabase)
      setConversations(supabaseConversations)
      setChatMessages(supabaseChatMessages)
      setCommunityPosts(supabasePosts)

      // Update Selection
      const activeIds = supabaseProfs
        .filter(p => (p.status === 'active' || !p.status) && p.isActive !== false)
        .map(p => p.id)
      setSelectedProfessionalIds(activeIds)

      setIsInitialized(true)
    }

    loadData()
  }, [])

  const saveToStorage = <T,>(key: string, value: T): void => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch (e) {
        console.error(`Error saving ${key}:`, e)
      }
    }
  }

  // Helper to convert camelCase to snake_case for Supabase
  const toSnakeCase = (obj: Record<string, any>): Record<string, any> => {
    const result: Record<string, any> = {}
    for (const key in obj) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
      result[snakeKey] = obj[key]
    }
    return result
  }

  // Sync data to Supabase (async, non-blocking) - handles upserts and deletions
  const syncToSupabase = async <T extends { id: string }>(
    tableName: string,
    items: T[]
  ): Promise<void> => {
    if (!isSupabaseConfigured() || typeof window === "undefined") return

    try {
      // Get current IDs in local state
      const localIds = new Set(items.map(item => item.id))

      // Upsert all current items
      for (const item of items) {
        const snakeCaseItem = toSnakeCase(item as Record<string, any>)
        await supabase.from(tableName).upsert(snakeCaseItem, { onConflict: 'id' })
      }

      // Fetch existing IDs from Supabase to find deleted items
      const { data: existingItems } = await supabase.from(tableName).select('id')
      if (existingItems) {
        for (const existing of existingItems) {
          if (!localIds.has(existing.id)) {
            // This item was deleted locally, delete from Supabase
            await supabase.from(tableName).delete().eq('id', existing.id)
            console.log(`[Supabase Sync] Deleted ${existing.id} from ${tableName}`)
          }
        }
      }
    } catch (err) {
      console.error(`[Supabase Sync] Error syncing to ${tableName}:`, err)
    }
  }

  // Delete single item from Supabase
  const deleteFromSupabase = async (tableName: string, id: string): Promise<void> => {
    if (!isSupabaseConfigured() || typeof window === "undefined") return

    try {
      await supabase.from(tableName).delete().eq('id', id)
      console.log(`[Supabase Sync] Deleted ${id} from ${tableName}`)
    } catch (err) {
      console.error(`[Supabase Sync] Error deleting from ${tableName}:`, err)
    }
  }

  // Chats Persistence
  useEffect(() => {
    if (isInitialized) {
      saveToStorage("tense_erp_conversations", conversations)
    }
  }, [conversations, isInitialized])

  useEffect(() => {
    if (isInitialized) {
      saveToStorage("tense_erp_chat_messages", chatMessages)
    }
  }, [chatMessages, isInitialized])

  // Transactions Persistence
  useEffect(() => {
    if (isInitialized) {
      saveToStorage("tense_erp_transactions", transactions)
    }
  }, [transactions, isInitialized])

  useEffect(() => {
    if (isInitialized) {
      saveToStorage("tense_erp_settlements", settlements)
    }
  }, [settlements, isInitialized])

  useEffect(() => {
    if (isInitialized) {
      saveToStorage("tense_erp_serviceConfigs", serviceConfigs)
    }
  }, [serviceConfigs, isInitialized])

  useEffect(() => {
    if (isInitialized) {
      saveToStorage("tense_erp_products", products)
    }
  }, [products, isInitialized])

  useEffect(() => {
    if (isInitialized) {
      saveToStorage("tense_erp_servicePacks", servicePacks)
    }
  }, [servicePacks, isInitialized])

  useEffect(() => {
    if (isInitialized) {
      saveToStorage("tense_erp_cashRegisters", cashRegisters)
    }
  }, [cashRegisters, isInitialized])

  useEffect(() => {
    if (isInitialized) {
      saveToStorage("tense_waitlist", waitlist)
    }
  }, [waitlist, isInitialized])

  useEffect(() => {
    if (isInitialized) {
      saveToStorage("suppliers", suppliers)
    }
  }, [suppliers, isInitialized])

  useEffect(() => {
    if (isInitialized) {
      saveToStorage("productPurchases", productPurchases)
    }
  }, [productPurchases, isInitialized])

  useEffect(() => {
    if (isInitialized) {
      saveToStorage("productSales", productSales)
    }
  }, [productSales, isInitialized])

  useEffect(() => {
    if (isInitialized) {
      saveToStorage("bankAccounts", bankAccounts)
    }
  }, [bankAccounts, isInitialized])

  useEffect(() => {
    if (isInitialized) {
      saveToStorage("productCategories", productCategories)
    }
  }, [productCategories, isInitialized])

  useEffect(() => {
    if (isInitialized) {
      saveToStorage("tense_reception_daily_closes", receptionDailyCloses)
    }
  }, [receptionDailyCloses, isInitialized])

  useEffect(() => {
    if (isInitialized) {
      saveToStorage("tense_reception_monthly_closes", receptionMonthlyCloses)
    }
  }, [receptionMonthlyCloses, isInitialized])

  useEffect(() => {
    if (isInitialized) {
      saveToStorage("tense_erp_clinical_form_configs", clinicalFormConfigs)
    }
  }, [clinicalFormConfigs, isInitialized])

  useEffect(() => {
    if (isInitialized) {
      saveToStorage("tense_erp_conversations", conversations)
    }
  }, [conversations, isInitialized])

  useEffect(() => {
    if (isInitialized) {
      saveToStorage("tense_erp_chat_messages", chatMessages)
    }
  }, [chatMessages, isInitialized])

  useEffect(() => {
    if (isInitialized) {
      saveToStorage("tense_erp_community_posts", communityPosts)
    }
  }, [communityPosts, isInitialized])

  useEffect(() => {
    if (isInitialized) {
      saveToStorage("tense_erp_tasks", tasks)
    }
  }, [tasks, isInitialized])

  useEffect(() => {
    if (isInitialized) {
      saveToStorage("tense_erp_goals", goals)
    }
  }, [goals, isInitialized])

  useEffect(() => {
    if (clinicalTasks.length > 0 || loadFromStorage("clinicalTasks", []).length > 0) {
      saveToStorage("clinicalTasks", clinicalTasks)
    }
  }, [clinicalTasks])

  useEffect(() => {
    if (clinicalTaskEvents.length > 0 || loadFromStorage("clinicalTaskEvents", []).length > 0) {
      saveToStorage("clinicalTaskEvents", clinicalTaskEvents)
    }
  }, [clinicalTaskEvents])

  useEffect(() => {
    if (isInitialized) {
      saveToStorage("tense_erp_medical_records", medicalRecords)
    }
  }, [medicalRecords, isInitialized])

  useEffect(() => {
    if (isInitialized) {
      saveToStorage("tense_erp_cash_transfers", cashTransfers)
    }
  }, [cashTransfers, isInitialized])

  useEffect(() => {
    if (isInitialized) {
      saveToStorage("tense_erp_inter_professional_adjustments", interProfessionalAdjustments)
    }
  }, [interProfessionalAdjustments, isInitialized])

  useEffect(() => {
    if (isInitialized) {
      saveToStorage("tense_erp_covenants", covenants)
    }
  }, [covenants, isInitialized])

  // Covenants Implementation
  const addCovenant = (covenant: Omit<Covenant, "id" | "createdAt">) => {
    const newCovenant: Covenant = {
      ...covenant,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    }
    setCovenants((prev) => {
      const updated = [...prev, newCovenant]
      saveToStorage("tense_erp_covenants", updated)
      return updated
    })
    apiUpsert(SYNC_CONFIG.covenants, newCovenant)
  }

  const updateCovenant = (id: string, data: Partial<Covenant>) => {
    setCovenants((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, ...data } : c))
      saveToStorage("tense_erp_covenants", updated)
      return updated
    })
    const covenant = covenants.find((c) => c.id === id)
    if (covenant) {
      apiUpsert(SYNC_CONFIG.covenants, { ...covenant, ...data })
    }
  }

  const deleteCovenant = (id: string) => {
    setCovenants((prev) => {
      const updated = prev.filter((c) => c.id !== id)
      saveToStorage("tense_erp_covenants", updated)
      return updated
    })
    apiDelete(SYNC_CONFIG.covenants, id)
  }

  const getCovenant = (id: string) => covenants.find((c) => c.id === id)

  // Clinical Entries Implementation
  const loadClinicalEntries = useCallback(async (clientId: string): Promise<ClinicalEntry[]> => {
    if (!isSupabaseConfigured()) return []

    try {
      const { data, error } = await supabase
        .from('clinical_entries')
        .select('*')
        .eq('client_id', clientId)
        .order('attention_date', { ascending: false })

      if (error) throw error

      const entries = data.map(row => {
        const entry = toCamelCase(row) as ClinicalEntry
        return { ...(entry.content || {}), ...entry }
      })

      // Fetch exercise logs
      const logs = await fetchClientLogs(clientId)
      const logEntries = logs.map(log => ({
        id: log.id,
        clientId,
        professionalId: '',
        serviceCategory: 'kinesiologia',
        formType: 'exercise_log' as any,
        sessionNumber: (log as any).sessionNumber || 0,
        attentionDate: log.date,
        routineId: log.routineId, // Top-level for easier filtering
        visibleToPatient: true,
        content: log,
        templateSnapshot: {},
        bodyMap: {},
        adherence: {},
        points: 0,
        createdAt: log.date,
        updatedAt: log.date
      } as unknown as ClinicalEntry))

      const allEntries = [...entries, ...logEntries].sort((a, b) =>
        new Date(b.attentionDate).getTime() - new Date(a.attentionDate).getTime()
      )

      setClinicalEntries(prev => {
        // Merge with existing avoiding duplicates
        const otherEntries = prev.filter(e => e.clientId !== clientId)
        return [...otherEntries, ...allEntries]
      })
      return allEntries
    } catch (error: any) {
      console.error("Error loading clinical entries:", error)
      if (error && typeof error === 'object') {
        console.error("Error message:", error.message)
        console.error("Error details:", error.details)
        console.error("Error hint:", error.hint)
      }
      return []
    }
  }, [])

  const saveClinicalEntry = useCallback(async (entry: ClinicalEntry) => {
    if (!isSupabaseConfigured()) return

    try {
      const snakeCaseEntry = toSnakeCase(entry)
      // Ensure specific fields are JSON
      if (snakeCaseEntry.content) snakeCaseEntry.content = entry.content
      if (snakeCaseEntry.template_snapshot) snakeCaseEntry.template_snapshot = entry.templateSnapshot
      if (snakeCaseEntry.body_map) snakeCaseEntry.body_map = entry.bodyMap
      if (snakeCaseEntry.adherence) snakeCaseEntry.adherence = entry.adherence

      console.log("Saving clinical entry:", snakeCaseEntry) // DEBUG

      const { error } = await supabase
        .from('clinical_entries')
        .upsert(snakeCaseEntry, { onConflict: 'id' })

      if (error) throw error

      setClinicalEntries(prev => {
        const index = prev.findIndex(e => e.id === entry.id)
        if (index >= 0) {
          const newEntries = [...prev]
          newEntries[index] = entry
          return newEntries
        }
        return [...prev, entry]
      })
    } catch (error) {
      console.error("Error saving clinical entry:", error)
      if (error && typeof error === 'object' && 'message' in error) {
        console.error("Error message:", (error as any).message)
        console.error("Error details:", (error as any).details)
        console.error("Error hint:", (error as any).hint)
      }
      throw error
    }
  }, [])

  const deleteClinicalEntry = useCallback(async (id: string) => {
    if (!isSupabaseConfigured()) return

    try {
      // Try deleting from clinical_entries
      const { error: error1 } = await supabase
        .from('clinical_entries')
        .delete()
        .eq('id', id)

      if (error1) {
        console.error("Error deleting from clinical_entries:", error1)
      }

      // Also try deleting from exercise_logs (for legacy or patient entries)
      const { error: error2 } = await supabase
        .from('exercise_logs')
        .delete()
        .eq('id', id)

      if (error2) {
        // Just log warning, key might not exist which is fine
        console.warn("Error deleting from exercise_logs (might not exist):", error2)
      }

      if (error1 && error2) {
        throw new Error("Failed to delete entry from both tables")
      }

      setClinicalEntries(prev => prev.filter(e => e.id !== id))
    } catch (error) {
      console.error("Error deleting clinical entry:", error)
      throw error
    }
  }, [])

  const uploadClinicalMedia = useCallback(async (file: File): Promise<string | null> => {
    if (!isSupabaseConfigured()) return null

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${fileName}`

      const { error } = await supabase.storage
        .from('clinical-media')
        .upload(filePath, file)

      if (error) throw error

      // For private buckets, we return the path. 
      return filePath
    } catch (error) {
      console.error("Error uploading clinical media:", error)
      return null
    }
  }, [])

  // Users
  const addUser = async (userData: Omit<User, "id" | "createdAt">) => {
    const userId = `user-${Date.now()}`
    const newUser: User = { ...userData, id: userId, createdAt: new Date() }

    // Si el rol es cliente, también lo agregamos a la lista de clientes (pacientes)
    if (userData.role === "cliente") {
      const clientId = `client-${Date.now()}`
      newUser.clientId = clientId

      const newClient: Client = {
        id: clientId,
        name: userData.name,
        dni: userData.dni || "",
        email: userData.email,
        phone: userData.phone || "",
        address: userData.address || "",
        balance: 0,
        specialDiscount: 0,
        createdAt: new Date(),
        notes: "Creado desde gestión del equipo",
      }
      setClients((prev) => [...prev, newClient])
      apiUpsert(SYNC_CONFIG.clients, newClient)
    }

    // Si el rol es profesional, también lo agregamos a la lista de profesionales
    if (userData.role === "profesional") {
      const professionalId = `prof-${Date.now()}`
      newUser.professionalId = professionalId

      const newProfessional: Professional = {
        id: professionalId,
        name: userData.name,
        email: userData.email,
        phone: userData.phone || "",
        dni: userData.dni || "",
        address: userData.address || "",
        specialty: "",
        color: "blue",
        isActive: true,
        status: "active",
        workingHours: { start: "09:00", end: "18:00" },
        standardDuration: 60,
        nonWorkingDays: [0, 6],
        services: [],
        commissionRate: 35,
        availability: {
          slotDuration: 60,
          schedule: [1, 2, 3, 4, 5].map((day) => ({
            dayOfWeek: day,
            isActive: true,
            slots: [{ start: "09:00", end: "18:00" }],
          })),
        },
      }
      setProfessionals((prev) => [...prev, newProfessional])
      apiUpsert(SYNC_CONFIG.professionals, newProfessional)

      // Creamos su caja automática
      setCashRegisters((prev) => [
        ...prev,
        {
          id: `cash-${professionalId}`,
          type: "professional",
          professionalId: professionalId,
          date: new Date(),
          openingBalance: 0,
          status: "open",
          transactions: [],
        },
      ])
    }

    setUsers((prev) => {
      const updated = [...prev, newUser]
      saveToStorage("tense_erp_users", updated)
      return updated
    })
    apiUpsert(SYNC_CONFIG.users, newUser)
  }

  const updateUser = (id: string, data: Partial<User>) => {
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === id ? { ...u, ...data } : u))
      const updatedUser = updated.find(u => u.id === id)
      if (updatedUser) {
        apiUpsert(SYNC_CONFIG.users, updatedUser)
      }
      return updated
    })

    // Sincronizar con profesional si aplica
    const user = users.find(u => u.id === id)
    if (user?.professionalId && (data.status !== undefined || data.isActive !== undefined)) {
      const isActive = data.isActive !== undefined ? data.isActive : (data.status === "active")
      updateProfessional(user.professionalId, { isActive, status: isActive ? "active" : "inactive" })
    }
  }

  const deleteUser = (id: string) => {
    const user = users.find(u => u.id === id)
    console.log(`[Cascaded Delete] Deleting user: ${id}`)

    setUsers((prev) => {
      const updated = prev.filter((u) => u.id !== id)
      saveToStorage("tense_erp_users", updated)
      return updated
    })
    deleteFromSupabase(SYNC_CONFIG.users.tableName, id)

    // Delete linked professional if exists
    if (user?.professionalId) {
      console.log(`[Cascaded Delete] Linking: Deleting professional ${user.professionalId}`)
      setProfessionals(prev => {
        const updated = prev.filter(p => p.id !== user.professionalId)
        saveToStorage("tense_erp_professionals", updated)
        return updated
      })
      deleteFromSupabase(SYNC_CONFIG.professionals.tableName, user.professionalId)
    }

    // Delete linked client if exists
    if (user?.clientId) {
      console.log(`[Cascaded Delete] Linking: Deleting client ${user.clientId}`)
      setClients(prev => {
        const updated = prev.filter(c => c.id !== user.clientId)
        saveToStorage("tense_erp_clients", updated)
        return updated
      })
      deleteFromSupabase(SYNC_CONFIG.clients.tableName, user.clientId)
    }
  }

  // Professionals
  const addProfessional = (professional: Omit<Professional, "id">) => {
    const professionalId = `prof-${Date.now()}`
    const newProfessional: Professional = { ...professional, id: professionalId }

    // Al agregar un profesional, también creamos su cuenta de usuario si no existe
    setUsers((prev) => {
      const existingUserIndex = prev.findIndex(u => u.email === professional.email)
      let updated: User[]

      if (existingUserIndex >= 0) {
        updated = [...prev]
        updated[existingUserIndex] = {
          ...updated[existingUserIndex],
          professionalId: professionalId,
          role: "profesional"
        }
        apiUpsert(SYNC_CONFIG.users, updated[existingUserIndex])
      } else {
        const newUser: User = {
          id: `user-${Date.now()}`,
          name: professional.name,
          email: professional.email,
          role: "profesional",
          status: "active",
          isActive: true,
          professionalId: professionalId,
          password: professional.password || "123456",
          createdAt: new Date()
        }
        updated = [...prev, newUser]
        apiUpsert(SYNC_CONFIG.users, newUser)
      }
      saveToStorage("tense_erp_users", updated)
      return updated
    })

    setProfessionals((prev) => {
      const updated = [...prev, newProfessional]
      saveToStorage("tense_erp_professionals", updated)
      return updated
    })
    setCashRegisters((prev) => {
      const updated: CashRegister[] = [
        ...prev,
        {
          id: `cash-${professionalId}`,
          type: "professional" as CashRegisterType,
          professionalId: professionalId,
          date: new Date(),
          openingBalance: 0,
          status: "open",
          transactions: [],
        },
      ]
      saveToStorage("tense_erp_cashRegisters", updated)
      return updated
    })

    // Sync to Supabase directly
    apiUpsert(SYNC_CONFIG.professionals, newProfessional)
  }

  const updateProfessional = (id: string, data: Partial<Professional>) => {
    setProfessionals((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, ...data } : p))
      const updatedProf = updated.find(p => p.id === id)
      if (updatedProf) {
        apiUpsert(SYNC_CONFIG.professionals, updatedProf)
      }
      saveToStorage("tense_erp_professionals", updated)
      return updated
    })

    // Sincronizamos con el usuario vinculado
    if (data.name || data.email || data.isActive !== undefined || data.status !== undefined) {
      setUsers((prev) => {
        const updated = prev.map((u) => {
          if (u.professionalId === id) {
            const isActive = data.isActive !== undefined ? data.isActive : (data.status === "active")
            const updatedUser: User = {
              ...u,
              ...(data.name ? { name: data.name } : {}),
              ...(data.email ? { email: data.email } : {}),
              ...(data.isActive !== undefined || data.status !== undefined ? {
                isActive: isActive,
                status: (isActive ? "active" : "inactive") as UserStatus
              } : {})
            }
            apiUpsert(SYNC_CONFIG.users, updatedUser)
            return updatedUser
          }
          return u
        })
        saveToStorage("tense_erp_users", updated)
        return updated
      })
    }
  }

  const deleteProfessional = async (id: string) => {
    console.log(`[Soft Disable] Deactivating professional agenda: ${id}`)

    // User Request: "No quiero eliminar al profesional. solo la agenda"
    // Action: We ONLY deactivate the professional (hide from calendar/lists) but KEEP the user and history.

    setProfessionals((prev) => {
      const updated = prev.map((p) => p.id === id ? { ...p, status: 'inactive' as const, isActive: false } : p)
      saveToStorage("tense_erp_professionals", updated)
      return updated
    })

    const prof = professionals.find(p => p.id === id)
    if (prof) {
      // Just update status to inactive in Supabase
      await apiUpsert(SYNC_CONFIG.professionals, { ...prof, status: 'inactive', isActive: false })
    }

    // Also deactivate the associated user (optional, depending on if they should still login)
    // For now, let's keep the user active so they can still see their history, 
    // or maybe the user wants to remove the 'agenda' capability only.
    // Given the complaint "eliminaste a todas las cuentas", we touch NOTHING else.
  }

  // Clients
  const addClient = (client: Omit<Client, "id" | "createdAt">) => {
    const clientId = `client-${Date.now()}`
    const newClient: Client = { ...client, id: clientId, createdAt: new Date() }

    // Al agregar un cliente, también creamos su cuenta de usuario para que pueda acceder
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: client.name,
      email: client.email,
      role: "cliente",
      status: "active",
      isActive: true,
      clientId: clientId,
      password: client.password || "123456",
      createdAt: new Date()
    }

    setUsers((prev) => {
      if (prev.some(u => u.email === client.email)) return prev;
      return [...prev, newUser]
    })

    // Sync User if it's new
    if (!users.some(u => u.email === client.email)) {
      apiUpsert(SYNC_CONFIG.users, newUser)
    }

    setClients((prev) => {
      const updated = [...prev, newClient]
      saveToStorage("tense_erp_clients", updated)
      return updated
    })
    apiUpsert(SYNC_CONFIG.clients, newClient)
  }

  const updateClient = (id: string, data: Partial<Client>) => {
    setClients((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, ...data } : c))
      const updatedClient = updated.find(c => c.id === id)
      if (updatedClient) {
        apiUpsert(SYNC_CONFIG.clients, updatedClient)
      }
      saveToStorage("tense_erp_clients", updated)
      return updated
    })

    // Sincronizamos cambios básicos con el usuario vinculado
    if (data.name || data.email) {
      setUsers((prev) => {
        const updated = prev.map((u) => {
          if (u.clientId === id) {
            const upUser = {
              ...u,
              ...(data.name ? { name: data.name } : {}),
              ...(data.email ? { email: data.email } : {})
            }
            apiUpsert(SYNC_CONFIG.users, upUser)
            return upUser
          }
          return u
        })
        return updated
      })
    }
  }

  const deleteClient = (id: string) => {
    console.log(`[Cascaded Delete] Deleting client: ${id}`)
    setClients((prev) => {
      const updated = prev.filter((c) => c.id !== id)
      saveToStorage("tense_erp_clients", updated)
      return updated
    })
    deleteFromSupabase(SYNC_CONFIG.clients.tableName, id)

    // Also delete associated user
    const userToDelete = users.find(u => u.clientId === id)
    if (userToDelete) {
      console.log(`[Cascaded Delete] Linking: Deleting user ${userToDelete.id}`)
      setUsers((prev) => {
        const updated = prev.filter((u) => u.id !== userToDelete.id)
        saveToStorage("tense_erp_users", updated)
        return updated
      })
      deleteFromSupabase(SYNC_CONFIG.users.tableName, userToDelete.id)
    }
  }

  // Service Configs
  const addServiceConfig = (service: Omit<ServiceConfig, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date()
    const newService: ServiceConfig = {
      ...service,
      id: `service-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    }
    setServiceConfigs((prev) => [...prev, newService])
  }

  const updateServiceConfig = (id: string, data: Partial<ServiceConfig>) => {
    setServiceConfigs((prev) => prev.map((s) => (s.id === id ? { ...s, ...data, updatedAt: new Date() } : s)))
  }

  // Service Packs
  const addServicePack = (pack: Omit<ServicePack, "id" | "createdAt">) => {
    const newPack: ServicePack = { ...pack, id: `pack-${Date.now()}`, createdAt: new Date() }
    setServicePacks((prev) => {
      const updated = [...prev, newPack]
      saveToStorage("tense_erp_servicePacks", updated)
      return updated
    })
    syncToSupabase(SYNC_CONFIG.servicePacks.tableName, [newPack])
  }

  const updateServicePack = (id: string, data: Partial<ServicePack>) => {
    setServicePacks((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, ...data } : p))
      const updatedPack = updated.find(p => p.id === id)
      if (updatedPack) {
        syncToSupabase(SYNC_CONFIG.servicePacks.tableName, [updatedPack])
      }
      saveToStorage("tense_erp_servicePacks", updated)
      return updated
    })
  }

  const deleteServicePack = (id: string) => {
    setServicePacks((prev) => {
      const updated = prev.filter((p) => p.id !== id)
      saveToStorage("tense_erp_servicePacks", updated)
      return updated
    })
    deleteFromSupabase(SYNC_CONFIG.servicePacks.tableName, id)
  }

  // Products
  const addProduct = (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    }
    setProducts((prev) => [...prev, newProduct])
  }

  const updateProduct = (id: string, data: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...data, updatedAt: new Date() } : p)))
  }

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  // Suppliers
  const addSupplier = (supplier: Omit<Supplier, "id" | "createdAt">) => {
    const newSupplier: Supplier = {
      ...supplier,
      id: `supplier-${Date.now()}`,
      createdAt: new Date(),
    }
    setSuppliers((prev) => [...prev, newSupplier])
  }

  const updateSupplier = (id: string, data: Partial<Supplier>) => {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)))
  }

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id))
  }

  // Product Purchases
  const addProductPurchase = (purchase: Omit<ProductPurchase, "id" | "createdAt">) => {
    const newPurchase: ProductPurchase = {
      ...purchase,
      id: `purchase-${Date.now()}`,
      createdAt: new Date(),
    }
    setProductPurchases((prev) => [...prev, newPurchase])

    setProducts((prev) =>
      prev.map((p) =>
        p.id === purchase.productId
          ? { ...p, currentStock: p.currentStock + purchase.quantity, updatedAt: new Date() }
          : p,
      ),
    )
  }

  // Product Sales
  const addProductSale = (sale: Omit<ProductSale, "id" | "createdAt">): ProductSale | null => {
    for (const item of sale.items) {
      const product = products.find((p) => p.id === item.productId)
      if (!product || product.currentStock < item.quantity) {
        return null
      }
    }

    const newSale: ProductSale = {
      ...sale,
      id: `sale-${Date.now()}`,
      createdAt: new Date(),
    }
    setProductSales((prev) => [...prev, newSale])

    for (const item of sale.items) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === item.productId ? { ...p, currentStock: p.currentStock - item.quantity, updatedAt: new Date() } : p,
        ),
      )
    }

    const transaction: Omit<Transaction, "id" | "createdAt"> = {
      date: new Date(),
      type: "product_sale",
      amount: sale.totalAmount,
      paymentMethod: sale.paymentMethod,
      cashRegisterType: sale.paymentMethod === "cash" ? "reception" : "administrator",
      productSaleId: newSale.id,
      notes: `Venta de productos - ${sale.paymentMethod === "cash" ? "Efectivo" : "Transferencia"}`,
    }
    addTransaction(transaction)

    return newSale
  }

  // Bank Accounts
  const addBankAccount = (account: Omit<BankAccount, "id" | "createdAt">) => {
    const newAccount: BankAccount = {
      ...account,
      id: `bank-${Date.now()}`,
      createdAt: new Date(),
    }
    setBankAccounts((prev) => [...prev, newAccount])
  }

  const updateBankAccount = (id: string, data: Partial<BankAccount>) => {
    setBankAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)))
  }

  const deleteBankAccount = (id: string) => {
    setBankAccounts((prev) => prev.filter((a) => a.id !== id))
  }

  // Product Categories
  const addProductCategory = (category: Omit<ProductCategoryConfig, "id">) => {
    const newCategory: ProductCategoryConfig = {
      ...category,
      id: `cat-${Date.now()}`,
    }
    setProductCategories((prev) => [...prev, newCategory])
  }

  const updateProductCategory = (id: string, data: Partial<ProductCategoryConfig>) => {
    setProductCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)))
  }

  const deleteProductCategory = (id: string) => {
    setProductCategories((prev) => prev.filter((c) => c.id !== id))
  }

  // Appointments
  const addAppointment = (appointment: Omit<Appointment, "id" | "createdAt">) => {
    const newAppointment: Appointment = {
      ...appointment,
      professionalIdCalendario: appointment.professionalIdCalendario || appointment.professionalId,
      professionalIdCobro: appointment.professionalIdCobro || appointment.professionalId,
      id: `apt-${Date.now()}`,
      createdAt: new Date(),
    }

    setAppointments((prev) => {
      const updated = [...prev, newAppointment]
      saveToStorage("tense_erp_appointments", updated)
      return updated
    })

    // Create transactions for initial payments
    if (newAppointment.payments && newAppointment.payments.length > 0) {
      const newTransactions: Transaction[] = newAppointment.payments.map(pay => ({
        id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date: pay.paymentDate || new Date(),
        type: pay.isDeposit ? "deposit_payment" : "session_payment",
        amount: pay.amount,
        paymentMethod: pay.paymentMethod,
        cashRegisterType: "professional",
        professionalId: pay.receivedByProfessionalId || newAppointment.professionalId,
        appointmentId: newAppointment.id,
        clientId: newAppointment.clientId,
        notes: pay.notes || (pay.isDeposit ? "Seña de turno" : "Pago de sesión"),
        createdAt: new Date(),
      }))

      setTransactions(prev => {
        const updated = [...prev, ...newTransactions]
        saveToStorage("tense_erp_transactions", updated)
        return updated
      })

      // Sync transactions to Supabase
      syncToSupabase(SYNC_CONFIG.transactions.tableName, newTransactions)
    }

    // Sync to Supabase directly
    syncToSupabase(SYNC_CONFIG.appointments.tableName, [newAppointment])
  }

  const updateAppointmentStatus = (id: string, status: AppointmentStatus) => {
    const apt = appointments.find((a) => a.id === id)
    if (!apt || apt.status === status) return

    setAppointments((prev) => {
      const updated = prev.map((a) => (a.id === id ? { ...a, status } : a))
      const updatedApt = updated.find(a => a.id === id)
      if (updatedApt) {
        syncToSupabase(SYNC_CONFIG.appointments.tableName, [updatedApt])
      }
      saveToStorage("tense_erp_appointments", updated)
      return updated
    })

    // Points logic
    if (status === "attended" || status === "no_show") {
      const clientId = apt.clientId
      const serviceName = serviceConfigs.find((s) => s.id === apt.serviceId)?.name || "Sesión"

      let points = 0
      let eventName = ""
      if (status === "attended") {
        points = 3
        eventName = `Asistencia: ${serviceName}`
      } else if (status === "no_show") {
        points = -5
        eventName = `Inasistencia: ${serviceName}`
      }

      const record = medicalRecords.find((r) => r.clientId === clientId)
      if (record && points !== 0) {
        const lastScore = record.progressHistory?.[record.progressHistory.length - 1]?.score || 1000
        const newPoint: ProgressPoint = {
          date: new Date(),
          score: lastScore + points,
          event: eventName,
          type: points >= 0 ? "positive" : "negative",
          adherenceDetails: {
            attendance: points,
            positive: 0,
            negative: 0,
            showToPatient: true,
          },
        }

        const updatedRecord: MedicalRecord = {
          ...record,
          progressHistory: [...(record.progressHistory || []), newPoint],
          lastUpdated: new Date(),
        }
        updateMedicalRecord(clientId, updatedRecord)
      }
    }
  }

  const updateAppointment = (id: string, data: Partial<Appointment>) => {
    setAppointments((prev) => {
      const updated = prev.map((a) => (a.id === id ? { ...a, ...data } : a))
      const updatedApt = updated.find(a => a.id === id)
      if (updatedApt) {
        syncToSupabase(SYNC_CONFIG.appointments.tableName, [updatedApt])
      }
      saveToStorage("tense_erp_appointments", updated)
      return updated
    })
  }

  const addPaymentToAppointment = (appointmentId: string, payment: Omit<AppointmentPayment, "id" | "createdAt">) => {
    const appointment = appointments.find((a) => a.id === appointmentId)
    if (!appointment) return

    const newPayment: AppointmentPayment = {
      ...payment,
      id: `pay-${Date.now()}`,
      createdAt: new Date(),
    }

    const newPaidAmount = appointment.paidAmount + payment.amount
    const newCashCollected =
      payment.paymentMethod === "cash" ? appointment.cashCollected + payment.amount : appointment.cashCollected
    const newTransfers =
      payment.paymentMethod === "transfer"
        ? appointment.transferCollected + payment.amount
        : appointment.transferCollected

    setAppointments((prev) => {
      const updated = prev.map((a) =>
        a.id === appointmentId
          ? {
            ...a,
            payments: [...(a.payments || []), newPayment],
            paidAmount: newPaidAmount,
            cashCollected: newCashCollected,
            transferCollected: newTransfers,
            isPaid: newPaidAmount >= a.finalPrice,
            depositAmount: payment.isDeposit ? a.depositAmount + payment.amount : a.depositAmount,
            isDepositComplete: payment.isDeposit
              ? a.depositAmount + payment.amount >= a.recommendedDeposit
              : a.isDepositComplete,
            status: a.status === "pending_deposit" && (payment.isDeposit || newPaidAmount >= a.recommendedDeposit || newPaidAmount >= a.finalPrice) ? "confirmed" : a.status,
          }
          : a,
      )
      const updatedApt = updated.find(a => a.id === appointmentId)
      if (updatedApt) {
        syncToSupabase(SYNC_CONFIG.appointments.tableName, [updatedApt])
      }
      saveToStorage("tense_erp_appointments", updated)
      return updated
    })

    const txn: Transaction = {
      id: `txn-${Date.now()}`,
      date: payment.paymentDate, // Use the collection date
      type: payment.isDeposit ? "deposit_payment" : "session_payment",
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      cashRegisterType: "professional", // Cash always goes to professional box
      professionalId: payment.receivedByProfessionalId,
      appointmentId,
      clientId: appointment.clientId,
      notes: payment.notes || (payment.isDeposit ? "Seña de turno" : "Pago de sesión"),
      createdAt: new Date(),
    }
    setTransactions((prev) => {
      const updated = [...prev, txn]
      saveToStorage("tense_erp_transactions", updated)
      syncToSupabase(SYNC_CONFIG.transactions.tableName, [txn])
      return updated
    })

    // Only Cash hits the professional cash register
    if (payment.paymentMethod === "cash") {
      setCashRegisters((prev) =>
        prev.map((cr) =>
          cr.type === "professional" && cr.professionalId === payment.receivedByProfessionalId
            ? { ...cr, transactions: [...cr.transactions, txn] }
            : cr,
        ),
      )
    }
    // Transfers are direct and don't hit any TENSE box
  }

  const deletePaymentFromAppointment = (appointmentId: string, paymentId: string) => {
    const appointment = appointments.find((a) => a.id === appointmentId)
    if (!appointment) return

    const payment = appointment.payments?.find((p) => p.id === paymentId)
    if (!payment) return

    const newPaidAmount = Math.max(0, appointment.paidAmount - payment.amount)
    const newCashCollected =
      payment.paymentMethod === "cash" ? (appointment.cashCollected || 0) - payment.amount : (appointment.cashCollected || 0)
    const newTransfers =
      payment.paymentMethod === "transfer"
        ? (appointment.transferCollected || 0) - payment.amount
        : (appointment.transferCollected || 0)

    setAppointments((prev) => {
      const updated = prev.map((a) =>
        a.id === appointmentId
          ? {
            ...a,
            payments: (a.payments || []).filter((p) => p.id !== paymentId),
            paidAmount: newPaidAmount,
            cashCollected: newCashCollected,
            transferCollected: newTransfers,
            isPaid: newPaidAmount >= a.finalPrice,
            status: (a.status === "confirmed" || a.status === "attended") && newPaidAmount === 0 ? "pending_deposit" : a.status,
          }
          : a,
      )
      const updatedApt = updated.find(a => a.id === appointmentId)
      if (updatedApt) {
        syncToSupabase(SYNC_CONFIG.appointments.tableName, [updatedApt])
      }
      return updated
    })

    // Sync deletion to cash registers
    setCashRegisters((prev) =>
      prev.map((cr) => ({
        ...cr,
        transactions: cr.transactions.filter((t: any) => t.id !== `txn-${payment.id}` && t.appointmentId !== appointmentId),
      })),
    )
    setTransactions((prev) => prev.filter((t: any) => t.appointmentId !== appointmentId || !t.id.includes(payment.id)))
  }

  const deleteAppointment = (appointmentId: string) => {
    setAppointments((prev) => {
      const updated = prev.filter((a) => a.id !== appointmentId)
      saveToStorage("tense_erp_appointments", updated)
      return updated
    })
    deleteFromSupabase(SYNC_CONFIG.appointments.tableName, appointmentId)
  }

  // Transactions
  const addTransaction = (transaction: Omit<Transaction, "id" | "createdAt">) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date(),
    }
    setTransactions((prev) => {
      const updated = [...prev, newTransaction]
      saveToStorage("tense_erp_transactions", updated)
      syncToSupabase(SYNC_CONFIG.transactions.tableName, [newTransaction])
      return updated
    })

    setCashRegisters((prev) =>
      prev.map((cr) => {
        if (transaction.cashRegisterType === "professional") {
          if (cr.type === "professional" && cr.professionalId === transaction.professionalId) {
            return { ...cr, transactions: [...cr.transactions, newTransaction] }
          }
        } else if (cr.type === transaction.cashRegisterType) {
          return { ...cr, transactions: [...cr.transactions, newTransaction] }
        }
        return cr
      }),
    )
  }

  // Cash Registers
  const getCashRegister = (type: CashRegisterType, professionalId?: string) => {
    if (type === "professional") {
      return cashRegisters.find((cr) => cr.type === type && cr.professionalId === professionalId)
    }
    return cashRegisters.find((cr) => cr.type === type)
  }

  const openCashRegister = (type: CashRegisterType, openingBalance: number, professionalId?: string) => {
    setCashRegisters((prev) =>
      prev.map((cr) => {
        if (type === "professional") {
          if (cr.type === type && cr.professionalId === professionalId) {
            return { ...cr, openingBalance, status: "open", transactions: [], date: new Date() }
          }
        } else if (cr.type === type) {
          return { ...cr, openingBalance, status: "open", transactions: [], date: new Date() }
        }
        return cr
      }),
    )
  }

  const deliverCashToProfessional = (professionalId: string, amount: number) => {
    if (amount <= 0) return

    addTransaction({
      date: new Date(),
      type: "professional_withdrawal",
      amount: -amount,
      paymentMethod: "cash",
      cashRegisterType: "professional",
      professionalId: professionalId,
      notes: `Entrega de efectivo al profesional ($${amount}) - Cierre de caja`,
    })

    // Update professional's cashInHand
    setProfessionals(prev => {
      const updated = prev.map(p => {
        if (p.id === professionalId) {
          const updatedProf = { ...p, cashInHand: (p.cashInHand || 0) + amount }
          apiUpsert(SYNC_CONFIG.professionals, updatedProf)
          return updatedProf
        }
        return p
      })
      saveToStorage("tense_erp_professionals", updated)
      return updated
    })
  }

  const updateTransaction = (updatedTransaction: Transaction) => {
    // 1. Update Global Transactions
    setTransactions((prev) => {
      const updated = prev.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t))
      saveToStorage("tense_erp_transactions", updated)
      apiUpsert(SYNC_CONFIG.transactions, updatedTransaction)
      return updated
    })

    // 2. Update Cash Registers (Sync)
    setCashRegisters((prevRegisters) => {
      return prevRegisters.map((cr) => {
        // Determine if transaction belongs in this register based on new state
        const belongsInRegister =
          (cr.type === updatedTransaction.cashRegisterType) &&
          (cr.type !== "professional" || cr.professionalId === updatedTransaction.professionalId)

        // Check if it currently exists in this register
        const existsInRegister = cr.transactions.some((t) => t.id === updatedTransaction.id)

        if (existsInRegister && belongsInRegister) {
          // Update in place
          return {
            ...cr,
            transactions: cr.transactions.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t)),
          }
        } else if (existsInRegister && !belongsInRegister) {
          // Remove (it moved to another register)
          return {
            ...cr,
            transactions: cr.transactions.filter((t) => t.id !== updatedTransaction.id),
          }
        } else if (!existsInRegister && belongsInRegister) {
          // Add (it moved into this register)
          return {
            ...cr,
            transactions: [...cr.transactions, updatedTransaction],
          }
        }
        return cr
      })
    })
  }

  const closeCashRegister = (type: CashRegisterType, professionalId?: string) => {
    setCashRegisters((prev) =>
      prev.map((cr) => {
        if (type === "professional" && cr.type === type && cr.professionalId === professionalId) {
          const currentBalance = cr.openingBalance + cr.transactions.reduce((sum, t) => sum + t.amount, 0)

          if (currentBalance > 0) {
            const withdrawal: Transaction = {
              id: `txn-withdrawal-${Date.now()}`,
              date: new Date(),
              type: "professional_withdrawal",
              amount: -currentBalance,
              paymentMethod: "cash",
              cashRegisterType: "professional",
              professionalId: professionalId,
              notes: "Entrega de efectivo al profesional - Cierre de caja diaria",
              createdAt: new Date(),
            }

            // Sync with transactions list
            setTransactions((prevTxns) => {
              const updated = [...prevTxns, withdrawal]
              saveToStorage("tense_erp_transactions", updated)
              syncToSupabase(SYNC_CONFIG.transactions.tableName, [withdrawal])
              return updated
            })

            // Update professional's cashInHand
            setProfessionals(prev => {
              const updated = prev.map(p => {
                if (p.id === professionalId) {
                  const updatedProf = { ...p, cashInHand: (p.cashInHand || 0) + currentBalance }
                  apiUpsert(SYNC_CONFIG.professionals, updatedProf)
                  return updatedProf
                }
                return p
              })
              saveToStorage("tense_erp_professionals", updated)
              return updated
            })

            return {
              ...cr,
              transactions: [...cr.transactions, withdrawal],
              closingBalance: 0,
              status: "closed",
              date: new Date(),
            }
          }

          return { ...cr, closingBalance: 0, status: "closed" }
        } else if (cr.type === type && type !== "professional") {
          const total = cr.transactions.reduce((sum, t) => sum + t.amount, 0)
          return { ...cr, closingBalance: cr.openingBalance + total, status: "closed" }
        }
        return cr
      }),
    )
  }

  const closeReceptionCash = () => {
    const receptionCash = cashRegisters.find((cr) => cr.type === "reception")
    if (!receptionCash || !receptionCash.fixedFund) return { excess: 0 }

    const currentBalance =
      receptionCash.openingBalance + receptionCash.transactions.reduce((sum, t) => sum + t.amount, 0)
    const excess = currentBalance - receptionCash.fixedFund

    if (excess > 0) {
      const txnOut: Transaction = {
        id: `txn-${Date.now()}`,
        date: new Date(),
        type: "excess_transfer",
        amount: -excess,
        paymentMethod: "cash",
        cashRegisterType: "reception",
        notes: "Transferencia de excedente a Caja Administrador",
        createdAt: new Date(),
      }
      const txnIn: Transaction = {
        id: `txn-${Date.now() + 1}`,
        date: new Date(),
        type: "excess_transfer",
        amount: excess,
        paymentMethod: "cash",
        cashRegisterType: "administrator",
        notes: "Excedente recibido de Caja Recepción",
        createdAt: new Date(),
      }

      setTransactions((prev) => [...prev, txnOut, txnIn])
      setCashRegisters((prev) =>
        prev.map((cr) => {
          if (cr.type === "reception") {
            return { ...cr, transactions: [...cr.transactions, txnOut] }
          }
          if (cr.type === "administrator") {
            return { ...cr, transactions: [...cr.transactions, txnIn] }
          }
          return cr
        }),
      )
    }

    return { excess }
  }

  // Settlements
  const generateSettlement = (professionalId: string, month: number, year: number) => {
    const professional = professionals.find((p) => p.id === professionalId)
    if (!professional) return null

    const profAppointments = appointments.filter((a) => {
      const aptDate = new Date(a.date)
      return a.professionalId === professionalId &&
        aptDate.getMonth() === month &&
        aptDate.getFullYear() === year &&
        a.status !== "cancelled"
    })


    const attended = profAppointments.filter((a) => a.status === "attended" || a.status === "closed")

    const baseRevenue = attended.reduce((sum, a) => sum + (a.basePrice || a.finalPrice || 0), 0)
    const totalFacturado = attended.reduce((sum, a) => sum + (a.finalPrice || 0), 0)
    const discountAmount = attended.reduce(
      (sum, a) => sum + Math.max(0, (a.basePrice || a.finalPrice || 0) - (a.finalPrice || 0)),
      0,
    )

    // Base calculation on baseRevenue (before TENSE discounts)
    // so the professional doesn't lose earnings due to TENSE marketing discounts
    const tenseRate = professional.commissionRate ?? 35
    const professionalRate = 100 - tenseRate
    const professionalEarningsAttended = (baseRevenue * professionalRate) / 100
    const tenseCommissionAttended = (baseRevenue * tenseRate) / 100

    const noShows = profAppointments.filter((a) => a.status === "no_show")
    const noShowDepositsLost = noShows.reduce((sum, a) => {
      const service = serviceConfigs.find((s) => s.id === a.serviceId)
      const maxDeposit = service ? a.basePrice * (service.recommendedDepositPercentage / 100) : a.depositAmount
      return sum + Math.min(a.depositAmount || 0, maxDeposit || 0)
    }, 0)
    const professionalEarningsNoShow = noShowDepositsLost

    const totalProfessionalEarnings = professionalEarningsAttended + professionalEarningsNoShow
    // Tense absorbs the discount
    const totalTenseCommission = Math.max(0, tenseCommissionAttended - discountAmount)

    const cashCollected = profAppointments.reduce((sum, a) => sum + (a.cashCollected || 0), 0)
    const transferCollected = profAppointments.reduce((sum, a) => sum + (a.transferCollected || 0), 0)

    const amountToSettle = totalTenseCommission

    const internalId = `set-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const displayId = `LIQM-${year}${String(month + 1).padStart(2, "0")}-${professional.name
      .split(" ")
      .map((n: string) => n[0])
      .join("")}`;

    const newSettlement: Settlement = {
      id: internalId,
      professionalId,
      month,
      year,
      type: "monthly",
      date: new Date(),
      attendedAppointments: attended.length,
      attendedRevenue: totalFacturado,
      baseRevenue: baseRevenue,
      totalFacturado: totalFacturado,
      discountAmount: discountAmount,
      professionalEarningsAttended,
      tenseCommissionAttended,
      totalTenseCommission,
      noShowAppointments: noShows.length,
      noShowDepositsLost,
      professionalEarningsNoShow,
      totalProfessionalEarnings,
      cashCollected,
      transferCollected,
      amountToSettle,
      professionalCashInHand: professional.cashInHand || 0,
      status: "pending",
      displayId,
      templateVersion: "1.0.0",
      source: "caja_liquidaciones",
      createdAt: new Date(),
    }

    setSettlements((prev) => [...prev, newSettlement])

    return newSettlement
  }

  const updateSettlement = (updatedSettlement: Settlement) => {
    setSettlements((prev) => prev.map((s) => (s.id === updatedSettlement.id ? updatedSettlement : s)))
  }

  const deleteSettlement = (id: string) => {
    // RULE: Revert transactions transactionally
    setTransactions((prev) => prev.filter((t: any) => t.settlementId !== id))
    setCashRegisters((prev) =>
      prev.map((cr) => ({
        ...cr,
        transactions: cr.transactions.filter((t: any) => t.settlementId !== id),
      })),
    )

    setSettlements((prev) => prev.filter((s) => s.id !== id))
  }
  const addSettlementPayment = (settlementId: string, amount: number, notes?: string) => {
    let profId = ""
    let dId = ""
    let isMonthly = false
    let currentSettlement: Settlement | null = null

    setSettlements((prev) =>
      prev.map((s) => {
        if (s.id === settlementId) {
          profId = s.professionalId
          dId = s.displayId || s.id
          isMonthly = s.type === "monthly"
          const totalPaid = (s.totalPaid || 0) + amount
          const isFullyPaid = totalPaid >= (s.amountToSettle || 0)
          const newPayment = {
            id: `pay-${Date.now()}`,
            date: new Date(),
            amount,
            notes,
          }

          const updated = {
            ...s,
            totalPaid,
            payments: [...(s.payments || []), newPayment],
            status: (isFullyPaid ? "paid" : "pending") as SettlementStatus,
            paidAt: isFullyPaid ? new Date() : s.paidAt,
          }
          currentSettlement = updated
          return updated
        }
        return s
      }),
    )

    if (profId) {
      const professional = professionals.find((p) => p.id === profId)
      addTransaction({
        date: new Date(),
        type: "settlement_transfer",
        amount: amount,
        paymentMethod: "cash",
        cashRegisterType: "reception", // Changed from 'administrator' to 'reception' so it appears in daily cash
        professionalId: profId,
        settlementId: settlementId,
        notes: notes || `Cobro liquidación - ${professional?.name} (${dId})`,
      })

      // If fully paid monthly settlement, also create/update a cash transfer record
      if (isMonthly && currentSettlement && (currentSettlement as Settlement).status === "paid") {
        const s = currentSettlement as Settlement
        const transferMonth = (s.month || 0) + 1
        const transferYear = s.year || new Date().getFullYear()

        const existingIndex = cashTransfers.findIndex(
          (t) =>
            t.profesionalId === s.professionalId &&
            t.month === transferMonth &&
            t.year === transferYear &&
            t.status === "pendiente",
        )

        if (existingIndex >= 0) {
          const updatedTransfers = [...cashTransfers]
          updatedTransfers[existingIndex] = {
            ...updatedTransfers[existingIndex],
            monto: s.amountToSettle || 0,
            fechaCreacion: new Date(),
          }
          setCashTransfers(updatedTransfers)
        } else {
          const newTransfer: CashTransfer = {
            id: `transfer-${Date.now()}`,
            profesionalId: s.professionalId,
            month: transferMonth,
            year: transferYear,
            monto: s.amountToSettle || 0,
            status: "pendiente",
            fechaCreacion: new Date(),
          }
          setCashTransfers((prev) => [...prev, newTransfer])
        }
      }
    }
  }

  const generateDailySettlement = (professionalId: string, date: Date) => {
    const professional = professionals.find((p) => p.id === professionalId)
    if (!professional) return null

    const targetDateStr = getDateInISO(date)
    const profAppointments = appointments.filter((a) => {
      return (a.professionalId === professionalId || a.professionalIdCalendario === professionalId) &&
        getDateInISO(a.date) === targetDateStr &&
        a.status !== "cancelled"
    })


    // BLOCK A: ATENCIÓN (Performance) - Based on appointment date
    const attended = profAppointments.filter((a) => a.status === "attended" || a.status === "closed")

    const baseRevenue = attended.reduce((sum, a) => sum + (a.basePrice || a.finalPrice || 0), 0)
    const attendedRevenue = attended.reduce((sum, a) => sum + (a.finalPrice || 0), 0)
    const discountAmount = attended.reduce((sum, a) => {
      const base = a.basePrice || a.finalPrice || 0
      return sum + Math.max(0, base - (a.finalPrice || 0))
    }, 0)

    const tenseRate = professional.commissionRate ?? 35
    const professionalRate = 100 - tenseRate

    // Professionial earnings are ALWAYS based on basePrice (TENSE absorbs discounts)
    const professionalEarningsAttended = baseRevenue * (professionalRate / 100)
    const tenseCommissionAttended = baseRevenue * (tenseRate / 100)

    const noShows = profAppointments.filter((a) => a.status === "no_show")
    const noShowDepositsLost = noShows.reduce((sum, a) => {
      const service = serviceConfigs.find((s) => s.id === a.serviceId)
      const maxDeposit = service ? a.basePrice * (service.recommendedDepositPercentage / 100) : a.depositAmount
      return sum + Math.min(a.depositAmount || 0, maxDeposit || 0)
    }, 0)
    const professionalEarningsNoShow = noShowDepositsLost

    const totalProfessionalEarnings = professionalEarningsAttended + professionalEarningsNoShow
    const totalTenseCommission = Math.max(0, tenseCommissionAttended - discountAmount)

    // BLOCK B: COBROS (Collections) - Based on collection date
    let cashCollected = 0
    let transferCollected = 0

    // Search ALL appointments for payments matching this day and this professional
    appointments.forEach((apt) => {
      (apt.payments || []).forEach((payment) => {
        if (payment.receivedByProfessionalId === professionalId) {
          if (getDateInISO(payment.paymentDate || payment.createdAt) === targetDateStr) {
            if (payment.paymentMethod === "cash") {
              cashCollected += payment.amount
            } else if (payment.paymentMethod === "transfer") {
              transferCollected += payment.amount
            }
          }
        }
      })
    })

    // Formula: Informative commission for TENSE (Accumulated for month)
    const amountToSettle = totalTenseCommission

    const newSettlement: Settlement = {
      id: `set-${Date.now()}`,
      professionalId,
      type: "daily",
      date: date,
      month: date.getMonth(),
      year: date.getFullYear(),
      attendedAppointments: attended.length,
      baseRevenue: baseRevenue, // Corrected: Use baseRevenue for daily settlement
      attendedRevenue,
      discountAmount,
      professionalEarningsAttended,
      tenseCommissionAttended,
      noShowAppointments: noShows.length,
      noShowDepositsLost,
      professionalEarningsNoShow,
      totalProfessionalEarnings,
      totalTenseCommission,
      basePriceTotal: baseRevenue,
      professionalPercentage: professionalRate,
      cashCollected,
      transferCollected,
      amountToSettle,
      professionalCashInHand: professional.cashInHand || 0,
      status: "pending",
      displayId: `LIQD-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}-${professional.name.split(" ").map((n: any) => n[0]).join("")}`,
      templateVersion: "1.0.0",
      source: "caja_liquidaciones",
      createdAt: new Date(),
    }

    setSettlements((prev) => [...prev, newSettlement])

    return newSettlement
  }

  const updateSettlementStatus = (id: string, status: Settlement["status"]) => {
    setSettlements((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status, paidAt: status === "paid" ? new Date() : s.paidAt } : s)),
    )
  }

  // Helper: Calculate appointment financials
  const calculateAppointmentFinancials = (serviceId: string, clientId: string) => {
    const service = serviceConfigs.find((s) => s.id === serviceId)
    const client = clients.find((c) => c.id === clientId)
    if (!service) return null

    const basePrice = service.basePrice
    const discountPercent = client?.specialDiscount || 0
    const finalPrice = basePrice * (1 - discountPercent / 100)
    const professionalPercentage = service.professionalPercentage
    const professionalEarnings = basePrice * (professionalPercentage / 100)
    const recommendedDeposit = service.requiresDeposit ? finalPrice * (service.recommendedDepositPercentage / 100) : 0

    return {
      basePrice,
      discountPercent,
      finalPrice,
      professionalPercentage,
      professionalEarnings,
      recommendedDeposit,
    }
  }

  const addToWaitlist = (entry: Omit<WaitlistEntry, "id" | "createdAt">) => {
    const newEntry: WaitlistEntry = {
      ...entry,
      id: `waitlist-${Date.now()}`,
      createdAt: new Date(),
    }
    setWaitlist((prev) => {
      const updated = [...prev, newEntry]
      localStorage.setItem("tense_waitlist", JSON.stringify(updated))
      return updated
    })
  }

  const updateWaitlistEntry = (id: string, data: Partial<WaitlistEntry>) => {
    setWaitlist((prev) => {
      const updated = prev.map((entry) => (entry.id === id ? { ...entry, ...data } : entry))
      localStorage.setItem("tense_waitlist", JSON.stringify(updated))
      return updated
    })
  }

  const removeFromWaitlist = (id: string) => {
    setWaitlist((prev) => {
      const updated = prev.filter((entry) => entry.id !== id)
      localStorage.setItem("tense_waitlist", JSON.stringify(updated))
      return updated
    })
  }

  // Helper functions for products
  const getProductStockStatus = (product: Product): "ok" | "medio" | "bajo" => {
    if (product.currentStock <= product.stockMinimo) return "bajo"
    if (product.currentStock <= product.stockMedio) return "medio"
    return "ok"
  }

  const getProductPurchaseHistory = (productId: string): ProductPurchase[] => {
    return productPurchases
      .filter((p) => p.productId === productId)
      .sort((a, b) => {
        const dateA = a.purchaseDate || a.date
        const dateB = b.purchaseDate || b.date
        return new Date(dateB as any).getTime() - new Date(dateA as any).getTime()
      })
  }

  const getProductCostAnalysis = (productId: string) => {
    const purchases = productPurchases.filter((p) => p.productId === productId)
    if (purchases.length === 0) {
      return { averageCost: 0, minCost: 0, maxCost: 0, costBySupplier: [] }
    }

    const costs = purchases.map((p) => p.unitCost)
    const averageCost = costs.reduce((a, b) => a + b, 0) / costs.length
    const minCost = Math.min(...costs)
    const maxCost = Math.max(...costs)

    const supplierCosts: { [key: string]: number[] } = {}
    purchases.forEach((p) => {
      if (!supplierCosts[p.supplierId]) supplierCosts[p.supplierId] = []
      supplierCosts[p.supplierId].push(p.unitCost)
    })

    const costBySupplier = Object.entries(supplierCosts).map(([supplierId, costs]) => ({
      supplierId,
      avgCost: costs.reduce((a, b) => a + b, 0) / costs.length,
    }))

    return { averageCost, minCost, maxCost, costBySupplier }
  }

  const getReceptionProductSalesToday = () => {
    const today = new Date().toDateString()
    const todaySales = productSales.filter((sale) => {
      const saleDate = new Date(sale.date).toDateString()
      return saleDate === today
    })

    const cashSales = todaySales.filter((s) => s.paymentMethod === "cash")
    const transferSales = todaySales.filter((s) => s.paymentMethod === "transfer")

    return {
      total: todaySales.reduce((sum: number, s: any) => sum + s.totalAmount, 0),
      cashTotal: cashSales.reduce((sum: number, s: any) => sum + s.totalAmount, 0),
      transferTotal: transferSales.reduce((sum: number, s: any) => sum + s.totalAmount, 0),
      count: todaySales.length,
    }
  }

  const getReceptionProductSalesMonth = (month: number, year: number) => {
    const monthSales = productSales.filter((sale) => {
      const saleDate = new Date(sale.date)
      return saleDate.getMonth() === month && saleDate.getFullYear() === year
    })

    const cashSales = monthSales.filter((s) => s.paymentMethod === "cash")
    const transferSales = monthSales.filter((s) => s.paymentMethod === "transfer")

    return {
      total: monthSales.reduce((sum: number, s: any) => sum + s.totalAmount, 0),
      cashTotal: cashSales.reduce((sum: number, s: any) => sum + s.totalAmount, 0),
      transferTotal: transferSales.reduce((sum: number, s: any) => sum + s.totalAmount, 0),
      count: monthSales.length,
    }
  }

  const isLastDayOfMonth = () => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.getMonth() !== today.getMonth()
  }

  const canCloseReceptionDaily = (date: Date) => {
    const dateStr = date.toDateString()
    return !receptionDailyCloses.some((close) => new Date(close.date).toDateString() === dateStr)
  }

  const canCloseReceptionMonthly = (month: number, year: number) => {
    return !receptionMonthlyCloses.some((close) => close.month === month && close.year === year)
  }

  const closeReceptionDaily = (userId: string, userName: string): ReceptionDailyClose | null => {
    const today = new Date()

    if (!canCloseReceptionDaily(today)) {
      return null
    }

    const sales = getReceptionProductSalesToday()

    const newClose: ReceptionDailyClose = {
      id: `daily-close-${Date.now()}`,
      date: today,
      totalProductSales: sales.total,
      totalCashSales: sales.cashTotal,
      totalTransferSales: sales.transferTotal,
      operationsCount: sales.count,
      closedBy: userId,
      closedByName: userName,
      createdAt: new Date(),
    }

    setReceptionDailyCloses((prev) => [...prev, newClose])
    return newClose
  }

  const closeReceptionMonthly = (userId: string, userName: string, fixedFund: number): ReceptionMonthlyClose | null => {
    const today = new Date()
    const month = today.getMonth()
    const year = today.getFullYear()

    if (!canCloseReceptionMonthly(month, year)) {
      return null
    }

    const sales = getReceptionProductSalesMonth(month, year)
    const receptionCash = getCashRegister("reception")

    const currentBalance = receptionCash
      ? receptionCash.openingBalance + receptionCash.transactions.reduce((sum, t) => sum + t.amount, 0)
      : 0

    const excessAmount = Math.max(0, currentBalance - fixedFund)

    if (excessAmount > 0) {
      const txnOut: Transaction = {
        id: `txn-monthly-out-${Date.now()}`,
        date: new Date(),
        type: "monthly_reception_transfer",
        amount: -excessAmount,
        paymentMethod: "cash",
        cashRegisterType: "reception",
        notes: `Liquidación mensual Caja Recepción – Ventas productos (${month + 1}/${year})`,
        createdAt: new Date(),
      }

      const txnIn: Transaction = {
        id: `txn-monthly-in-${Date.now()}`,
        date: new Date(),
        type: "monthly_reception_transfer",
        amount: excessAmount,
        paymentMethod: "cash",
        cashRegisterType: "administrator",
        notes: `Liquidación mensual Caja Recepción – Ventas productos (${month + 1}/${year})`,
        createdAt: new Date(),
      }

      setTransactions((prev) => [...prev, txnOut, txnIn])

      setCashRegisters((prev) =>
        prev.map((cr) => {
          if (cr.type === "reception") {
            return { ...cr, transactions: [...cr.transactions, txnOut] }
          }
          if (cr.type === "administrator") {
            return { ...cr, transactions: [...cr.transactions, txnIn] }
          }
          return cr
        }),
      )
    }

    const newClose: ReceptionMonthlyClose = {
      id: `monthly-close-${Date.now()}`,
      month,
      year,
      totalProductSalesCash: sales.cashTotal,
      totalProductSalesTransfer: sales.transferTotal,
      operationsCount: sales.count,
      excessTransferred: excessAmount,
      fixedFundAfterClose: fixedFund,
      closedBy: userId,
      closedByName: userName,
      closedAt: new Date(),
      createdAt: new Date(),
      status: "closed",
      userId: userId,
      userName: userName,
      totalProfessionalCommissionCash: 0, // Should be calculated if needed
      totalProfessionalCommissionTransfer: 0,
    }

    setReceptionMonthlyCloses((prev) => [...prev, newClose])
    return newClose
  }

  const addClinicalFormConfig = (config: Omit<ClinicalFormConfig, "id" | "createdAt" | "updatedAt">) => {
    const newConfig: ClinicalFormConfig = {
      ...config,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setClinicalFormConfigs((prev) => [...prev, newConfig])
  }

  const updateClinicalFormConfig = (id: string, data: Partial<ClinicalFormConfig>) => {
    setClinicalFormConfigs((prev) =>
      prev.map((config) => (config.id === id ? { ...config, ...data, updatedAt: new Date() } : config)),
    )
  }

  const deleteClinicalFormConfig = (id: string) => {
    console.log("[DataContext] Deleting Clinical Form Config:", id)
    setClinicalFormConfigs((prev) => {
      const updated = prev.filter((config) => config.id !== id)
      saveToStorage("tense_erp_clinical_form_configs", updated)
      return updated
    })
    // Also try to delete from Supabase if configured
    if (SYNC_CONFIG.clinicalFormConfigs) {
      deleteFromSupabase(SYNC_CONFIG.clinicalFormConfigs.tableName, id)
    }
  }

  const getClinicalFormConfig = (formType: ClinicalFormConfig["formType"]) => {
    return clinicalFormConfigs.find((config) => config.formType === formType && config.isActive)
  }

  const addConversation = (conversation: Omit<ChatConversation, "id" | "createdAt">) => {
    const newConversation: ChatConversation = {
      ...conversation,
      id: `conv-${Date.now()}`,
      createdAt: new Date(),
    }
    setConversations((prev) => [...prev, newConversation])
    return newConversation
  }

  const addChatMessage = (message: Omit<ChatMessage, "id" | "createdAt">) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}`,
      createdAt: new Date(),
    }
    setChatMessages((prev) => [...prev, newMessage])

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === message.conversationId
          ? {
            ...conv,
            lastMessage: message.content,
            lastMessageAt: new Date(),
            unreadCount: message.senderRole === "client" ? conv.unreadCount + 1 : conv.unreadCount,
          }
          : conv,
      ),
    )
    return newMessage
  }

  const markMessagesAsRead = (conversationId: string) => {
    setChatMessages((prev) =>
      prev.map((msg) => (msg.conversationId === conversationId ? { ...msg, isRead: true } : msg)),
    )
    setConversations((prev) => prev.map((conv) => (conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv)))
  }

  const addCommunityPost = (post: Omit<CommunityPost, "id" | "createdAt" | "likes" | "comments">) => {
    const newPost: CommunityPost = {
      ...post,
      id: `post-${Date.now()}`,
      createdAt: new Date(),
      likes: [],
      comments: [],
    }
    setCommunityPosts((prev) => [newPost, ...prev])
  }

  const updateCommunityPost = (id: string, updates: Partial<CommunityPost>) => {
    setCommunityPosts((prev) => prev.map((post) => (post.id === id ? { ...post, ...updates } : post)))
  }

  const deleteCommunityPost = (id: string) => {
    setCommunityPosts((prev) => prev.filter((post) => post.id !== id))
  }

  const addStaffTask = (task: Omit<StaffTask, "id" | "createdAt" | "updatedAt">): StaffTask => {
    const newTask: StaffTask = {
      ...task,
      id: `task-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setTasks((prev) => [...prev, newTask])
    return newTask
  }

  const addInterProfessionalAdjustment = (
    adjData: Omit<InterProfessionalAdjustment, "id" | "createdAt" | "resolvedAt">,
  ): InterProfessionalAdjustment => {
    const id = `adj-${Date.now()}`
    const createdAt = new Date()

    const newAdjustment: InterProfessionalAdjustment = {
      ...adjData,
      id,
      createdAt,
      sourcePaymentIds: adjData.sourcePaymentIds || [],
    }

    if (adjData.mode === "neteo_liquidacion") {
      newAdjustment.status = "resolved"
      newAdjustment.autoResolved = true
      newAdjustment.resolvedAt = createdAt

      // For neteo, we also might want to mark the appointment resolution status
      // but usually this is called when saving, so the save logic will handle it.
    } else {
      newAdjustment.status = "pending"

      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 2)

      const profA = professionals.find((p) => p.id === adjData.fromProfessionalId)
      const profB = professionals.find((p) => p.id === adjData.toProfessionalId)

      // Single Unified Task: For Professional (The one who collected) but visible to both
      addStaffTask({
        title: `Transferencia Inter-Profesional: ${profA?.name} → ${profB?.name}`,
        description: `El profesional ${profA?.name} debe transferir ${adjData.amount.toLocaleString("es-AR", { style: "currency", currency: "ARS" })} a ${profB?.name} por cambio de turno.`,
        assignedTo: adjData.fromProfessionalId,
        status: "pending",
        dueDate: dueDate,
        linkedAdjustmentId: id,
        linkedAppointmentId: adjData.appointmentId,
      })
    }

    setInterProfessionalAdjustments((prev) => [...prev, newAdjustment])
    return newAdjustment
  }

  const markAdjustmentAsDone = (id: string, evidenceUrl: string) => {
    setInterProfessionalAdjustments((prev) =>
      prev.map((adj) =>
        adj.id === id ? { ...adj, professionalMarkedAsDone: true, evidenceUrl, status: "waiting_reception_validation" } : adj,
      ),
    )
  }

  const confirmAdjustmentResolution = (id: string) => {
    let apptId = ""
    setInterProfessionalAdjustments((prev) => {
      const updated = prev.map((adj) => {
        if (adj.id === id) {
          apptId = adj.appointmentId
          return { ...adj, status: "resolved" as const, resolvedAt: new Date() }
        }
        return adj
      })

      // After state is updated, we check if all adjustments for this appointment are resolved
      if (apptId) {
        // We use the 'updated' list since setInterProfessionalAdjustments hasn't finished yet
        const pendingForThisAppt = updated.filter((a) => a.appointmentId === apptId && a.status !== "resolved")

        if (pendingForThisAppt.length === 0) {
          updateAppointment(apptId, { paymentResolutionStatus: "ok" })
        }
      }

      return updated
    })
  }

  const updateTask = (id: string, data: Partial<StaffTask>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...data, updatedAt: new Date() } : t)))
  }

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const addGoal = (goal: Omit<StaffGoal, "id" | "createdAt" | "updatedAt">) => {
    const newGoal: StaffGoal = {
      ...goal,
      id: `goal-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setGoals((prev) => [...prev, newGoal])
  }

  const updateGoal = (id: string, data: Partial<StaffGoal>) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...data, updatedAt: new Date() } : g)))
  }

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id))
  }

  const addClinicalTask = (taskData: Omit<ClinicalTask, "id" | "createdAt" | "updatedAt">): ClinicalTask => {
    const now = new Date()
    const newTask: ClinicalTask = {
      ...taskData,
      id: `clinical-task-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    }

    const createdEvent: ClinicalTaskEvent = {
      id: `event-${Date.now()}`,
      taskId: newTask.id,
      clientId: newTask.clientId,
      eventType: "created",
      points: 0,
      description: `Nueva tarea asignada: ${newTask.title}`,
      date: now,
      createdAt: now,
    }

    setClinicalTasks((prev) => [...prev, newTask])
    setClinicalTaskEvents((prev) => [...prev, createdEvent])
    return newTask
  }

  const updateClinicalTask = (id: string, updates: Partial<ClinicalTask>) => {
    setClinicalTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...updates, updatedAt: new Date() } : task)),
    )
  }

  const deleteClinicalTask = (id: string) => {
    const task = clinicalTasks.find((t) => t.id === id)
    if (task) {
      const cancelEvent: ClinicalTaskEvent = {
        id: `event-${Date.now()}`,
        taskId: id,
        clientId: task.clientId,
        eventType: "cancelled",
        points: 0,
        description: `Tarea anulada: ${task.title}`,
        date: new Date(),
        createdAt: new Date(),
      }
      setClinicalTaskEvents((prev) => [...prev, cancelEvent])
    }
    setClinicalTasks((prev) => prev.filter((task) => task.id !== id))
  }

  const completeClinicalTask = (id: string, evidence?: { type: "photo" | "comment"; content: string }) => {
    const now = new Date()
    setClinicalTasks((prev) =>
      prev.map((task) => {
        if (task.id === id) {
          const newEvidence = evidence ? [...(task.evidence || []), { ...evidence, submittedAt: now }] : task.evidence

          const completedEvent: ClinicalTaskEvent = {
            id: `event-${Date.now()}`,
            taskId: id,
            clientId: task.clientId,
            eventType: "completed",
            points: task.impactType === "positive" ? (task.points || 0) : -(task.points || 0),
            description: `Tarea completada: ${task.title}`,
            date: now,
            createdAt: now,
          }
          setClinicalTaskEvents((prevEvents) => [...prevEvents, completedEvent])

          return {
            ...task,
            status: "completed" as const,
            completedAt: now,
            evidence: newEvidence,
            updatedAt: now,
          }
        }
        return task
      }),
    )
  }

  const validateClinicalTask = (id: string) => {
    const now = new Date()
    setClinicalTasks((prev) =>
      prev.map((task) => {
        if (task.id === id) {
          const validatedEvent: ClinicalTaskEvent = {
            id: `event-${Date.now()}`,
            taskId: id,
            clientId: task.clientId,
            eventType: "validated",
            points: 0,
            description: `Tarea validada por profesional: ${task.title}`,
            date: now,
            createdAt: now,
          }
          setClinicalTaskEvents((prevEvents) => [...prevEvents, validatedEvent])

          return {
            ...task,
            validatedByProfessional: true,
            validatedAt: now,
            updatedAt: new Date(),
          }
        }
        return task
      }),
    )
  }

  const getClientClinicalTasks = (clientId: string): ClinicalTask[] => {
    return clinicalTasks.filter((task) => task.clientId === clientId)
  }

  const getClinicalTaskEvents = (clientId: string): ClinicalTaskEvent[] => {
    return clinicalTaskEvents.filter((event) => event.clientId === clientId)
  }

  const getMedicalRecord = (clientId: string): MedicalRecord | undefined => {
    return medicalRecords.find((r) => r.clientId === clientId)
  }

  const addMedicalRecord = (record: MedicalRecord) => {
    const newRecords = [...medicalRecords, record]
    setMedicalRecords(newRecords)
    saveToStorage("tense_erp_medical_records", newRecords)
  }

  const updateMedicalRecord = (clientId: string, record: MedicalRecord) => {
    const newRecords = medicalRecords.map((r) => (r.clientId === clientId ? { ...record, lastUpdated: new Date() } : r))
    if (!medicalRecords.find((r) => r.clientId === clientId)) {
      newRecords.push({ ...record, lastUpdated: new Date() })
    }
    setMedicalRecords(newRecords)
    saveToStorage("tense_erp_medical_records", newRecords)
  }

  const addPatientLog = (clientId: string, log: Omit<PatientDailyLog, "id" | "createdAt">) => {
    const record = medicalRecords.find((r) => r.clientId === clientId)
    if (!record) return

    const todayStr = new Date().toDateString()
    const existingLogIndex = (record.patientLogs || []).findIndex(
      (l) => new Date(l.date).toDateString() === todayStr
    )

    let updatedLogs = [...(record.patientLogs || [])]
    let scoreChange = 0
    let eventName = "Registro diario"

    if (existingLogIndex !== -1) {
      // Update existing
      const existingLog = updatedLogs[existingLogIndex]

      // If goal wasn't reached before but is now
      if (!existingLog.hydration.goalReached && (existingLog.hydration.amount + log.hydration.amount >= 2)) {
        scoreChange += 5
        eventName = "Meta de hidratación alcanzada"
      }

      updatedLogs[existingLogIndex] = {
        ...existingLog,
        ...log,
        hydration: {
          ...log.hydration,
          amount: existingLog.hydration.amount + log.hydration.amount,
          goalReached: (existingLog.hydration.amount + log.hydration.amount) >= 2
        },
        // Notes appending or replacing? Replacing is safer for "Quick log"
        notesForSession: log.notesForSession || existingLog.notesForSession
      }
    } else {
      // Create new
      const newLog: PatientDailyLog = {
        ...log,
        id: `log-${Date.now()}`,
        createdAt: new Date(),
      }
      updatedLogs.push(newLog)

      scoreChange = 5 // Base for logging
      if (log.hydration.goalReached) scoreChange += 5
      if (log.sleep.quality >= 4) scoreChange += 2
      if (log.sleep.quality <= 2) scoreChange -= 2
      if (log.stress.level > 8) scoreChange -= 3
      if (log.stress.level < 3) scoreChange += 1
      if (log.mood.value === "muy_bueno") scoreChange += 2
      if (log.mood.value === "muy_bajo") scoreChange -= 2
      eventName = "Registro diario completo"
    }

    const updatedRecord: MedicalRecord = {
      ...record,
      patientLogs: updatedLogs,
      progressHistory: scoreChange !== 0 ? [
        ...(record.progressHistory || []),
        {
          date: new Date(),
          score: (record.progressHistory?.[record.progressHistory.length - 1]?.score || 1000) + scoreChange,
          event: eventName,
          type: scoreChange >= 0 ? "positive" : "negative",
        }
      ] : record.progressHistory,
      lastUpdated: new Date(),
    }

    updateMedicalRecord(clientId, updatedRecord)
  }

  const addPatientTask = (clientId: string, task: Omit<PatientTask, "id" | "createdAt" | "updatedAt">) => {
    const record = medicalRecords.find((r) => r.clientId === clientId)
    if (!record) return

    const newTask: PatientTask = {
      ...task,
      id: `task-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const updatedRecord: MedicalRecord = {
      ...record,
      patientTasks: [...(record.patientTasks || []), newTask],
      lastUpdated: new Date(),
    }

    updateMedicalRecord(clientId, updatedRecord)
  }

  const updatePatientTaskStatus = (clientId: string, taskId: string, status: PatientTaskStatus, evidence?: any) => {
    const record = medicalRecords.find((r) => r.clientId === clientId)
    if (!record || !record.patientTasks) return

    const taskIndex = record.patientTasks.findIndex((t) => t.id === taskId)
    if (taskIndex === -1) return

    const task = record.patientTasks[taskIndex]
    const updatedTask = { ...task, status, evidence, updatedAt: new Date() }
    const updatedTasks = [...record.patientTasks]
    updatedTasks[taskIndex] = updatedTask

    let scoreChange = 0
    let event = ""
    if (status === "completed") {
      scoreChange = task.pointsValue
      event = `Tarea cumplida: ${task.title}`
    } else if (status === "expired") {
      scoreChange = -5
      event = `Tarea vencida: ${task.title}`
    }

    const lastScore = record.progressHistory?.[record.progressHistory.length - 1]?.score || 1000
    const newProgressPoint: ProgressPoint = {
      date: new Date(),
      score: lastScore + scoreChange,
      event,
      type: scoreChange >= 0 ? "positive" : "negative",
    }

    const updatedRecord: MedicalRecord = {
      ...record,
      patientTasks: updatedTasks,
      progressHistory: scoreChange !== 0 ? [...(record.progressHistory || []), newProgressPoint] : record.progressHistory,
      lastUpdated: new Date(),
    }

    updateMedicalRecord(clientId, updatedRecord)
  }

  const confirmCashTransfer = (transferId: string) => {
    const transfer = cashTransfers.find((t) => t.id === transferId)
    if (!transfer || transfer.status === "confirmado") return

    const receptionCashRegister = cashRegisters.find((cr) => cr.type === "reception")

    const adminCashRegister = cashRegisters.find((cr) => cr.type === "administrator")

    if (!receptionCashRegister || !adminCashRegister) return

    const txnOut: Transaction = {
      id: `txn-transfer-out-${Date.now()}`,
      date: new Date(),
      type: "cash_transfer",
      amount: -transfer.monto,
      paymentMethod: "cash",
      cashRegisterType: "reception", // Changed from 'professional' to 'reception'
      professionalId: transfer.profesionalId,
      notes: `Traspaso a Caja Admin - Liquidación ${transfer.month}/${transfer.year}`,
      createdAt: new Date(),
    }

    const txnIn: Transaction = {
      id: `txn-transfer-in-${Date.now()}`,
      date: new Date(),
      type: "cash_transfer",
      amount: transfer.monto,
      paymentMethod: "cash",
      cashRegisterType: "administrator",
      notes: `Traspaso de Caja Profesional - ${transfer.profesionalId} (${transfer.month}/${transfer.year})`,
      createdAt: new Date(),
    }

    setTransactions((prev) => [...prev, txnOut, txnIn])

    setCashRegisters((prev) =>
      prev.map((cr) => {
        if (cr.type === "reception") {
          return { ...cr, transactions: [...cr.transactions, txnOut] }
        }
        if (cr.type === "administrator") {
          return { ...cr, transactions: [...cr.transactions, txnIn] }
        }
        return cr
      }),
    )

    setCashTransfers((prev) =>
      prev.map((t) => (t.id === transferId ? { ...t, status: "confirmado", fechaConfirmacion: new Date() } : t)),
    )
  }

  const deleteCashTransfer = (id: string) => {
    setCashTransfers((prev) => prev.filter((t) => t.id !== id))
  }

  const updateCashTransfer = (id: string, data: Partial<CashTransfer>) => {
    setCashTransfers((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)))
  }

  const updateCompanyInfo = (data: Partial<CompanyInfo>) => {
    setCompanyInfo((prev) => {
      const updated = { ...prev, ...data }
      if (typeof window !== "undefined") {
        localStorage.setItem("tense_company_info", JSON.stringify(updated))
      }
      return updated
    })
  }

  const saveMealTemplate = async (name: string, content: MealPlanItem[]) => {
    const newTemplate: MealTemplate = {
      id: crypto.randomUUID(),
      name,
      content,
      createdAt: new Date()
    }

    const newTemplates = [...mealTemplates, newTemplate]
    setMealTemplates(newTemplates)
    saveToStorage("tense_erp_meal_templates", newTemplates)

    if (isSupabaseConfigured()) {
      await apiUpsert(SYNC_CONFIG.mealTemplates, newTemplate)
    }
  }

  const deleteMealTemplate = async (id: string) => {
    const updated = mealTemplates.filter(t => t.id !== id)
    setMealTemplates(updated)
    saveToStorage("tense_erp_meal_templates", updated)

    if (isSupabaseConfigured()) {
      await apiDelete(SYNC_CONFIG.mealTemplates, id)
    }
  }

  const value: DataContextType = {
    users,
    addUser,
    updateUser,
    deleteUser,
    professionals,
    addProfessional,
    updateProfessional,
    deleteProfessional,
    selectedProfessionalId,
    setSelectedProfessionalId,
    clients,
    addClient,
    updateClient,
    serviceConfigs,
    addServiceConfig,
    updateServiceConfig,
    servicePacks,
    addServicePack,
    updateServicePack,
    deleteServicePack,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    suppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    productPurchases,
    addProductPurchase,
    productSales,
    addProductSale,
    bankAccounts,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
    productCategories,
    addProductCategory,
    updateProductCategory,
    deleteProductCategory,
    appointments,
    addAppointment,
    updateAppointmentStatus,
    updateAppointment,
    addPaymentToAppointment,
    deletePaymentFromAppointment,
    deleteAppointment,
    transactions,
    addTransaction,
    updateTransaction,
    cashRegisters,
    getCashRegister,
    openCashRegister,
    closeCashRegister,
    closeReceptionCash,
    settlements,
    setSettlements,
    generateSettlement,
    generateDailySettlement,
    updateSettlementStatus,
    updateSettlement,
    deleteSettlement,
    addSettlementPayment,
    calculateAppointmentFinancials,
    waitlist,
    addToWaitlist,
    updateWaitlistEntry,
    removeFromWaitlist,
    getProductStockStatus,
    getProductPurchaseHistory,
    getProductCostAnalysis,
    receptionDailyCloses,
    receptionMonthlyCloses,
    closeReceptionDaily,
    closeReceptionMonthly,
    getReceptionProductSalesToday,
    getReceptionProductSalesMonth,
    isLastDayOfMonth,
    canCloseReceptionDaily,
    canCloseReceptionMonthly,
    deliverCashToProfessional,
    clinicalFormConfigs,
    addClinicalFormConfig,
    updateClinicalFormConfig,
    deleteClinicalFormConfig,
    getClinicalFormConfig,
    conversations,
    chatMessages,
    addConversation,
    addChatMessage,
    markMessagesAsRead,
    communityPosts,
    addCommunityPost,
    updateCommunityPost,
    deleteCommunityPost,
    tasks,
    addTask: addStaffTask,
    addStaffTask,
    updateTask,
    deleteTask,
    interProfessionalAdjustments,
    addInterProfessionalAdjustment,
    markAdjustmentAsDone,
    confirmAdjustmentResolution,
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    clinicalTasks,
    clinicalTaskEvents,
    addClinicalTask,
    updateClinicalTask,
    deleteClinicalTask,
    completeClinicalTask,
    validateClinicalTask,
    getClientClinicalTasks,
    getClinicalTaskEvents,
    medicalRecords,
    getMedicalRecord,
    addMedicalRecord,
    updateMedicalRecord,
    addPatientLog,
    addPatientTask,
    updatePatientTaskStatus,
    clinicalEntries,
    loadClinicalEntries,
    saveClinicalEntry,
    deleteClinicalEntry,
    uploadClinicalMedia,
    cashTransfers,
    setCashTransfers,
    confirmCashTransfer,
    deleteCashTransfer,
    updateCashTransfer,
    companyInfo,
    updateCompanyInfo,
    selectedProfessionalIds,
    setSelectedProfessionalIds,
    toggleProfessionalSelection: (id: string) => {
      setSelectedProfessionalIds(prev => {
        const newIds = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        // Maintain single selection for backward compatibility
        if (newIds.length > 0) {
          setSelectedProfessionalId(newIds[0])
        } else {
          setSelectedProfessionalId(null)
        }
        return newIds
      })
    },
    covenants,
    addCovenant,
    updateCovenant,
    deleteCovenant,
    getCovenant,
    isInitialized,
    mealTemplates,
    saveMealTemplate,
    deleteMealTemplate,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}
