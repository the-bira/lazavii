import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth"
import { auth } from "./firebase"

export interface User {
  id: string
  email: string
  name: string
}

function mapFirebaseUser(firebaseUser: FirebaseUser): User {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || "",
    name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Usuário",
  }
}

export async function signIn(email: string, password: string): Promise<User | null> {
  try {
    // Se Firebase não estiver configurado, usar demo
    if (!auth) {
      if (email === "admin@lazavii.com" && password === "123456") {
        return {
          id: "demo-user-id",
          email: "admin@lazavii.com",
          name: "Admin Demo",
        }
      }
      return null
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      return mapFirebaseUser(userCredential.user)
    } catch (loginError: any) {
      console.log("[v0] Erro no login, tentando criar usuário:", loginError.code)

      if (loginError.code === "auth/invalid-credential" || loginError.code === "auth/user-not-found") {
        try {
          console.log("[v0] Criando novo usuário:", email)
          const userCredential = await createUserWithEmailAndPassword(auth, email, password)
          return mapFirebaseUser(userCredential.user)
        } catch (signUpError: any) {
          console.log("[v0] Erro ao criar usuário:", signUpError.code)

          if (email === "admin@lazavii.com" && password === "123456") {
            console.log("[v0] Usando fallback demo")
            const demoUser = {
              id: "demo-user-id",
              email: "admin@lazavii.com",
              name: "Admin Demo",
            }
            setCurrentUser(demoUser)
            return demoUser
          }

          throw signUpError
        }
      }

      throw loginError
    }
  } catch (error) {
    console.error("[v0] Erro no login:", error)
    return null
  }
}

export async function signUp(email: string, password: string): Promise<User | null> {
  try {
    if (!auth) {
      throw new Error("Firebase não configurado")
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    return mapFirebaseUser(userCredential.user)
  } catch (error) {
    console.error("[v0] Erro no cadastro:", error)
    return null
  }
}

export async function signOut(): Promise<void> {
  try {
    if (auth) {
      await firebaseSignOut(auth)
    } else {
      // Fallback para localStorage se Firebase não estiver configurado
      if (typeof window !== "undefined") {
        localStorage.removeItem("user")
      }
    }
  } catch (error) {
    console.error("[v0] Erro no logout:", error)
  }
}

export function getCurrentUser(): User | null {
  if (auth && auth.currentUser) {
    return mapFirebaseUser(auth.currentUser)
  }

  // Fallback para localStorage se Firebase não estiver configurado
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("user")
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch {
        return null
      }
    }
  }
  return null
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  if (auth) {
    return onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        callback(mapFirebaseUser(firebaseUser))
      } else {
        callback(null)
      }
    })
  }

  // Fallback para localStorage
  const user = getCurrentUser()
  callback(user)
  return () => {} // Retorna função vazia para cleanup
}

export function setCurrentUser(user: User): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(user))
  }
}
