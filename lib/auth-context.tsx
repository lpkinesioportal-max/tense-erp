"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User, UserRole, Client, Professional } from "./types"
import { currentUser as mockCurrentUser, users as mockUsers, clients, professionals } from "./mock-data"

interface AuthContextType {
  user: User | null
  client: Client | null
  professional: Professional | null
  login: (email: string, password: string) => Promise<{ success: boolean; isClient: boolean; isProfessional: boolean }>
  logout: () => void
  hasPermission: (requiredRoles: UserRole[]) => boolean
  switchUser: (userId: string) => void
  isClient: boolean
  isProfessional: boolean
  isLoading: boolean
  users: User[]
  registerUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [professional, setProfessional] = useState<Professional | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [isProfessional, setIsProfessional] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<User[]>(mockUsers)

  // Load from localStorage on mount
  useEffect(() => {
    console.log("[v0] AuthProvider useEffect - loading from localStorage")

    const savedUsers = localStorage.getItem("tense_registered_users")
    if (savedUsers) {
      setUsers([...mockUsers, ...JSON.parse(savedUsers)])
    }

    const savedClient = localStorage.getItem("tense_current_client")
    const savedProfessional = localStorage.getItem("tense_current_professional")
    const savedUser = localStorage.getItem("tense_current_user")

    console.log("[v0] Saved data:", {
      hasClient: !!savedClient,
      hasProfessional: !!savedProfessional,
      hasUser: !!savedUser,
    })

    if (savedClient) {
      console.log("[v0] Loading client session")
      setClient(JSON.parse(savedClient))
      setIsClient(true)
      setUser(null)
      setProfessional(null)
      setIsProfessional(false)
    } else if (savedProfessional && savedUser) {
      console.log("[v0] Loading professional session")
      const prof = JSON.parse(savedProfessional)
      const usr = JSON.parse(savedUser)
      setProfessional(prof)
      setUser(usr)
      setIsProfessional(true)
      setIsClient(false)
      console.log("[v0] Professional loaded:", prof.name)
    } else {
      console.log("[v0] No saved session, defaulting to mock user")
      setUser(mockCurrentUser)
      setIsClient(false)
      setIsProfessional(false)
    }

    setIsLoading(false)
  }, [])

  const registerUser = (newUser: User) => {
    setUsers((prev) => {
      const updated = [...prev, newUser]
      // Save users with passwords to localStorage (excluding mock users)
      const customUsers = updated.filter((u) => !mockUsers.find((mu) => mu.id === u.id))
      localStorage.setItem("tense_registered_users", JSON.stringify(customUsers))
      return updated
    })
  }

  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; isClient: boolean; isProfessional: boolean }> => {
    // Super admin login
    if (email === "tense.kinesio@gmail.com") {
      if (password !== "Camaron1") {
        return { success: false, isClient: false, isProfessional: false }
      }
      const foundUser = users.find((u) => u.email === email && u.status === "active")
      if (foundUser) {
        setUser(foundUser)
        setClient(null)
        setProfessional(null)
        setIsClient(false)
        setIsProfessional(false)
        localStorage.removeItem("tense_current_client")
        localStorage.removeItem("tense_current_professional")
        localStorage.removeItem("tense_current_user")
        return { success: true, isClient: false, isProfessional: false }
      }
    }

    // Reception login
    if (email === "recepcion.tense@gmail.com") {
      if (password !== "Tense2022") {
        return { success: false, isClient: false, isProfessional: false }
      }
      const foundUser = users.find((u) => u.email === email && u.status === "active")
      if (foundUser) {
        setUser(foundUser)
        setClient(null)
        setProfessional(null)
        setIsClient(false)
        setIsProfessional(false)
        localStorage.removeItem("tense_current_client")
        localStorage.removeItem("tense_current_professional")
        localStorage.removeItem("tense_current_user")
        return { success: true, isClient: false, isProfessional: false }
      }
    }

    // Professional login - check by email in professionals list
    const foundProfessional = professionals.find((p) => p.email === email && p.isActive)
    if (foundProfessional) {
      const validPassword = foundProfessional.password
        ? password === foundProfessional.password
        : password === "Prof2024" || password === "demo"

      if (validPassword) {
        const profUser = users.find((u) => u.professionalId === foundProfessional.id) || {
          id: `user-${foundProfessional.id}`,
          email: foundProfessional.email,
          name: foundProfessional.name,
          role: "profesional" as UserRole,
          status: "active" as const,
          professionalId: foundProfessional.id,
          createdAt: new Date(),
        }
        setUser(profUser)
        setProfessional(foundProfessional)
        setClient(null)
        setIsClient(false)
        setIsProfessional(true)
        localStorage.setItem("tense_current_professional", JSON.stringify(foundProfessional))
        localStorage.setItem("tense_current_user", JSON.stringify(profUser))
        localStorage.removeItem("tense_current_client")
        return { success: true, isClient: false, isProfessional: true }
      }
      return { success: false, isClient: false, isProfessional: false }
    }

    const foundUser = users.find((u) => u.email === email && u.status === "active")
    if (foundUser) {
      // Check if user has a password set
      if (foundUser.password) {
        if (foundUser.password !== password) {
          return { success: false, isClient: false, isProfessional: false }
        }
      }
      setUser(foundUser)
      setClient(null)
      setProfessional(null)
      setIsClient(false)
      setIsProfessional(false)
      localStorage.removeItem("tense_current_client")
      localStorage.removeItem("tense_current_professional")
      localStorage.removeItem("tense_current_user")
      return { success: true, isClient: false, isProfessional: false }
    }

    const foundClient = clients.find((c) => c.email === email)
    if (foundClient) {
      // Check if client has a password set
      if (foundClient.password) {
        if (foundClient.password !== password) {
          return { success: false, isClient: false, isProfessional: false }
        }
      }
      setClient(foundClient)
      setUser(null)
      setProfessional(null)
      setIsClient(true)
      setIsProfessional(false)
      localStorage.setItem("tense_current_client", JSON.stringify(foundClient))
      localStorage.removeItem("tense_current_professional")
      localStorage.removeItem("tense_current_user")
      return { success: true, isClient: true, isProfessional: false }
    }

    return { success: false, isClient: false, isProfessional: false }
  }

  const logout = () => {
    setUser(null)
    setClient(null)
    setProfessional(null)
    setIsClient(false)
    setIsProfessional(false)
    localStorage.removeItem("tense_current_client")
    localStorage.removeItem("tense_current_professional")
    localStorage.removeItem("tense_current_user")
  }

  const hasPermission = (requiredRoles: UserRole[]): boolean => {
    if (!user) return false
    return requiredRoles.includes(user.role)
  }

  const switchUser = (userId: string) => {
    const foundUser = users.find((u) => u.id === userId)
    if (foundUser) {
      setUser(foundUser)
      setClient(null)
      setProfessional(null)
      setIsClient(false)
      setIsProfessional(false)
      localStorage.removeItem("tense_current_client")
      localStorage.removeItem("tense_current_professional")
      localStorage.removeItem("tense_current_user")
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        client,
        professional,
        login,
        logout,
        hasPermission,
        switchUser,
        isClient,
        isProfessional,
        isLoading,
        users,
        registerUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
