"use client"

import { Languages, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LANGUAGES } from "@/lib/languages"
import { changeLanguage } from "@/components/translate-engine"

export function LanguageSwitcher({ current }: { current: string }) {
  const builtin = LANGUAGES.filter((l) => l.builtin)
  const rest = LANGUAGES.filter((l) => !l.builtin)

  const Item = ({ code, native, label }: { code: string; native: string; label: string }) => (
    <DropdownMenuItem
      onClick={() => { if (code !== current) changeLanguage(code) }}
      className="flex items-center justify-between gap-3 cursor-pointer"
    >
      <span className="flex flex-col">
        <span className="text-sm">{native}</span>
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </span>
      {code === current && <Check className="h-3.5 w-3.5 text-accent" />}
    </DropdownMenuItem>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="bg-transparent" aria-label="Language">
          <Languages className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[70vh] overflow-y-auto w-56">
        <DropdownMenuLabel>Language / اللغة</DropdownMenuLabel>
        {builtin.map((l) => <Item key={l.code} {...l} />)}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[10px] text-muted-foreground font-normal flex items-center gap-1">
          <Languages className="h-3 w-3" /> Google Translate
        </DropdownMenuLabel>
        {rest.map((l) => <Item key={l.code} {...l} />)}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
