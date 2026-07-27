"use client"

import { useEffect } from "react"
import { GOOGLE_INCLUDED, isBuiltin } from "@/lib/languages"

const STORAGE_KEY = "eta_lang"

// --- cookie helpers -------------------------------------------------------
function setGoogTransCookie(value: string) {
  if (typeof document === "undefined") return
  const host = window.location.hostname
  const variants = [
    `googtrans=${value};path=/`,
    `googtrans=${value};path=/;domain=${host}`,
  ]
  const base = host.split(".").slice(-2).join(".")
  if (base && base !== host) variants.push(`googtrans=${value};path=/;domain=.${base}`)
  variants.forEach((c) => (document.cookie = c))
}

/** Read the persisted language code (defaults to English). */
export function storedLang(): string {
  if (typeof window === "undefined") return "en"
  return localStorage.getItem(STORAGE_KEY) || "en"
}

/**
 * Switch UI language. English/Arabic are handled by the built-in dictionary;
 * any other language is applied through Google Translate. We persist the
 * choice, prime the Google cookie and reload so the engine applies cleanly and
 * there is never a half-translated DOM.
 */
export function changeLanguage(code: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, code)
  if (isBuiltin(code)) {
    setGoogTransCookie("/en/en") // revert any Google translation
  } else {
    setGoogTransCookie(`/en/${code}`)
  }
  window.location.reload()
}

// --- Google Translate widget (injected only when actually needed) ---------
let injected = false
function injectGoogleWidget() {
  if (injected || typeof window === "undefined") return
  injected = true
  ;(window as any).googleTranslateElementInit = () => {
    try {
      // eslint-disable-next-line new-cap
      new (window as any).google.translate.TranslateElement(
        { pageLanguage: "en", includedLanguages: GOOGLE_INCLUDED, autoDisplay: false },
        "google_translate_element",
      )
    } catch {
      /* ignore */
    }
  }
  const s = document.createElement("script")
  s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
  s.async = true
  s.onerror = () => console.warn("[Eta] Google Translate failed to load")
  document.body.appendChild(s)
}

/**
 * Mounted once at the app root. Injects the Google widget only when the active
 * language actually needs it (keeps English/Arabic fast and banner-free).
 */
export function TranslateEngineMount() {
  useEffect(() => {
    const code = storedLang()
    if (!isBuiltin(code)) injectGoogleWidget()
  }, [])
  return <div id="google_translate_element" className="sr-only" aria-hidden="true" />
}
