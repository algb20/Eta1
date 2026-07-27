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

function isPiBrowser(): boolean {
  return typeof navigator !== "undefined" && /PiBrowser/i.test(navigator.userAgent)
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Pi authentication timed out")), ms)),
  ])
}

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

// Verify the token with our backend (upsert profile, founder bootstrap).
async function backendLogin(accessToken: string): Promise<{ profile: Profile; settings: PlatformSettings | null }> {
  const headers: Record<string, string> = { "Content-Type": "application/json", "X-Pi-Token": accessToken }
  if (SUPABASE_ANON) {
    headers["apikey"] = SUPABASE_ANON
    headers["Authorization"] = `Bearer ${SUPABASE_ANON}`
  }
  const res = await fetch(EDGE.login, { method: "POST", headers, body: JSON.stringify({}) })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.error || "Login failed")
  return { profile: json.profile as Profile, settings: json.settings ?? null }
}

interface PiContextValue {
  loading: boolean
  profile: Profile | null
  token: string | null
  error: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  serverConnected: boolean
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
  const [serverConnected, setServerConnected] = useState(false)
  const [myLikes, setMyLikes] = useState<Set<string>>(new Set())
  const [myFollows, setMyFollows] = useState<Set<string>>(new Set())
  const bootstrapped = useRef(false)

  const enrichFromServer = useCallback(async (accessToken: string) => {
    if (!EDGE.login) return
    try {
      const { profile: prof, settings: s } = await backendLogin(accessToken)
      setProfile(prof)
      setSettings(s)
      setServerConnected(true)
      if (supabase && prof?.id) {
        const [likes, follows] = await Promise.all([getMyLikes(prof.id), getMyFollows(prof.id)])
        setMyLikes(new Set(likes))
        setMyFollows(new Set(follows))
      }
    } catch (e) {
      // Backend not deployed yet — keep the client-tier identity.
      setServerConnected(false)
      console.warn("[Eta] backend enrich skipped:", (e as Error).message)
    }
  }, [])

  // Core sign-in. `silent` is used for the automatic attempt on app open so a
  // failure (e.g. outside the Pi Browser) does not surface an error.
  const authenticate = useCallback(async (silent: boolean) => {
    if (!silent) { setLoading(true); setError(null) }
    try {
      await loadPiSdk()
      if (!window.Pi) throw new Error("Pi SDK unavailable")
      window.Pi.init({ version: PI_CONFIG.version, sandbox: PI_CONFIG.sandbox })
      const auth = await withTimeout(window.Pi.authenticate(PI_CONFIG.scopes, () => {}), silent ? 12000 : 60000)
      if (!auth?.accessToken) throw new Error("No access token from Pi")

      // Client-tier identity is available immediately (works without a backend).
      setProfile({
        id: `pi:${auth.user.uid}`,
        pi_uid: auth.user.uid,
        username: auth.user.username,
        avatar_url: null,
        bio: null,
        role: "user",
        verified: false,
      })
      setToken(auth.accessToken)
      if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, auth.accessToken)

      // Upgrade to the verified, server-backed profile when the backend exists.
      await enrichFromServer(auth.accessToken)
    } catch (e: any) {
      if (!silent) {
        console.error("[Eta] Pi sign-in failed:", e)
        setError(
          isPiBrowser()
            ? e?.message || "Pi sign-in failed"
            : "Open the app inside the Pi Browser to sign in with Pi Network.",
        )
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }, [enrichFromServer])

  const signIn = useCallback(() => authenticate(false), [authenticate])

  const signOut = useCallback(() => {
    setProfile(null)
    setToken(null)
    setServerConnected(false)
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

  // Automatic sign-in when the app opens inside the Pi Browser.
  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true
    if (isPiBrowser()) authenticate(true)
  }, [authenticate])

  const value: PiContextValue = {
    loading,
    profile,
    token,
    error,
    isAuthenticated: Boolean(profile && token),
    isAdmin: profile?.role === "founder" || profile?.role === "admin",
    serverConnected,
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
