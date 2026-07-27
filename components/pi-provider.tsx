"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { PI_CONFIG, EDGE, SUPABASE_ANON } from "@/lib/config"
import { getMyLikes, getMyFollows, type Profile, type PlatformSettings } from "@/lib/api"
import { supabase } from "@/lib/supabase"

// --- Pi SDK typings -------------------------------------------------------
interface PiAuthResult {
  accessToken: string
  user: { uid: string; username: string }
}
declare global {
  interface Window {
    Pi?: {
      init: (c: { version: string; sandbox?: boolean }) => void
      authenticate: (
        scopes: string[],
        onIncompletePaymentFound?: (p: unknown) => void,
      ) => Promise<PiAuthResult>
    }
  }
}

const SDK_URL = "https://sdk.minepi.com/pi-sdk.js"
const TOKEN_KEY = "eta_pi_token"

let sdkPromise: Promise<void> | null = null
function loadPiSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"))
  if (window.Pi) return Promise.resolve()
  if (sdkPromise) return sdkPromise
  sdkPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SDK_URL}"]`)
    if (existing) {
      existing.addEventListener("load", () => resolve())
      existing.addEventListener("error", () => reject(new Error("Pi SDK failed to load")))
      if (window.Pi) resolve()
      return
    }
    const s = document.createElement("script")
    s.src = SDK_URL
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error("Pi SDK failed to load"))
    document.head.appendChild(s)
  })
  return sdkPromise
}

interface PiContextValue {
  loading: boolean
  profile: Profile | null
  token: string | null
  error: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  settings: PlatformSettings | null
  myLikes: Set<string>
  myFollows: Set<string>
  signIn: () => Promise<void>
  signOut: () => void
  setLiked: (projectId: string, liked: boolean) => void
  setFollowing: (projectId: string, following: boolean) => void
}

const PiContext = createContext<PiContextValue | null>(null)

export function PiProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<PlatformSettings | null>(null)
  const [myLikes, setMyLikes] = useState<Set<string>>(new Set())
  const [myFollows, setMyFollows] = useState<Set<string>>(new Set())
  const bootstrapped = useRef(false)

  const applyLogin = useCallback(async (accessToken: string) => {
    if (!EDGE.login) {
      throw new Error("Backend is not configured yet.")
    }
    const headers: Record<string, string> = { "Content-Type": "application/json", "X-Pi-Token": accessToken }
    if (SUPABASE_ANON) {
      headers["apikey"] = SUPABASE_ANON
      headers["Authorization"] = `Bearer ${SUPABASE_ANON}`
    }
    const res = await fetch(EDGE.login, { method: "POST", headers, body: JSON.stringify({}) })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json?.error || "Login failed")

    const prof = json.profile as Profile
    setProfile(prof)
    setToken(accessToken)
    setSettings(json.settings ?? null)
    if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, accessToken)

    // Load personal like/follow state (only meaningful with a live database).
    if (supabase && prof?.id) {
      const [likes, follows] = await Promise.all([getMyLikes(prof.id), getMyFollows(prof.id)])
      setMyLikes(new Set(likes))
      setMyFollows(new Set(follows))
    }
  }, [])

  const signIn = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await loadPiSdk()
      if (!window.Pi) throw new Error("Pi SDK unavailable")
      window.Pi.init({ version: PI_CONFIG.version, sandbox: PI_CONFIG.sandbox })
      const auth = await window.Pi.authenticate(PI_CONFIG.scopes, () => {})
      if (!auth?.accessToken) throw new Error("No access token from Pi")
      await applyLogin(auth.accessToken)
    } catch (e: any) {
      console.error("[Eta] Pi sign-in failed:", e)
      setError(e?.message || "Pi sign-in failed")
    } finally {
      setLoading(false)
    }
  }, [applyLogin])

  const signOut = useCallback(() => {
    setProfile(null)
    setToken(null)
    setMyLikes(new Set())
    setMyFollows(new Set())
    if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY)
  }, [])

  const setLiked = useCallback((projectId: string, liked: boolean) => {
    setMyLikes((prev) => {
      const next = new Set(prev)
      liked ? next.add(projectId) : next.delete(projectId)
      return next
    })
  }, [])

  const setFollowing = useCallback((projectId: string, following: boolean) => {
    setMyFollows((prev) => {
      const next = new Set(prev)
      following ? next.add(projectId) : next.delete(projectId)
      return next
    })
  }, [])

  // Silent session restore across reloads (Pi tokens stay valid for a while).
  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true
    const stored = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null
    if (!stored || !EDGE.login) return
    ;(async () => {
      try {
        await applyLogin(stored)
      } catch {
        if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY)
      }
    })()
  }, [applyLogin])

  const value: PiContextValue = {
    loading,
    profile,
    token,
    error,
    isAuthenticated: Boolean(profile && token),
    isAdmin: profile?.role === "founder" || profile?.role === "admin",
    settings,
    myLikes,
    myFollows,
    signIn,
    signOut,
    setLiked,
    setFollowing,
  }

  return <PiContext.Provider value={value}>{children}</PiContext.Provider>
}

export function usePi(): PiContextValue {
  const ctx = useContext(PiContext)
  if (!ctx) throw new Error("usePi must be used within <PiProvider>")
  return ctx
}
