"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { type User, getCurrentUser, setCurrentUser, signOut as authSignOut } from "@/lib/auth"

interface AuthContextType {
  user: User | null
  signIn: (email: string, password: string) => Promise<boolean>
  signOut: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string): Promise<boolean> => {
    const { signIn: authSignIn } = await import("@/lib/auth")
    const authenticatedUser = await authSignIn(email, password)

    if (authenticatedUser) {
      setUser(authenticatedUser)
      setCurrentUser(authenticatedUser)
      return true
    }
    return false
  }

  const signOut = () => {
    setUser(null)
    authSignOut()
  }

  return <AuthContext.Provider value={{ user, signIn, signOut, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
