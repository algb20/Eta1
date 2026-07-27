// Supported languages. English + Arabic use the built-in dictionary
// (lib/i18n.ts) for the highest quality; every other language is provided by
// the Google Translate engine, translating from the English base.

export interface Language {
  code: string
  label: string // English label
  native: string // endonym
  rtl?: boolean
  builtin?: boolean // has a hand-written dictionary (en / ar)
}

export const LANGUAGES: Language[] = [
  { code: "en", label: "English", native: "English", builtin: true },
  { code: "ar", label: "Arabic", native: "العربية", rtl: true, builtin: true },
  { code: "fr", label: "French", native: "Français" },
  { code: "es", label: "Spanish", native: "Español" },
  { code: "de", label: "German", native: "Deutsch" },
  { code: "pt", label: "Portuguese", native: "Português" },
  { code: "ru", label: "Russian", native: "Русский" },
  { code: "tr", label: "Turkish", native: "Türkçe" },
  { code: "id", label: "Indonesian", native: "Bahasa Indonesia" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "ur", label: "Urdu", native: "اردو", rtl: true },
  { code: "fa", label: "Persian", native: "فارسی", rtl: true },
  { code: "zh-CN", label: "Chinese", native: "中文" },
  { code: "ja", label: "Japanese", native: "日本語" },
  { code: "ko", label: "Korean", native: "한국어" },
  { code: "sw", label: "Swahili", native: "Kiswahili" },
  { code: "vi", label: "Vietnamese", native: "Tiếng Việt" },
  { code: "th", label: "Thai", native: "ไทย" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "nl", label: "Dutch", native: "Nederlands" },
  { code: "it", label: "Italian", native: "Italiano" },
  { code: "fil", label: "Filipino", native: "Filipino" },
  { code: "ha", label: "Hausa", native: "Hausa" },
]

// Comma-separated list used by the Google widget's includedLanguages option.
export const GOOGLE_INCLUDED = LANGUAGES.map((l) => l.code).join(",")

export function isRtl(code: string): boolean {
  return LANGUAGES.find((l) => l.code === code)?.rtl ?? false
}

// Which built-in dictionary to render before Google (if any) runs.
export function dictLangFor(code: string): "en" | "ar" {
  return code === "ar" ? "ar" : "en"
}

export function isBuiltin(code: string): boolean {
  return Boolean(LANGUAGES.find((l) => l.code === code)?.builtin)
}
