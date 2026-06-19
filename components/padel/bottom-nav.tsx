"use client"

import { Medal, Plus, List } from "lucide-react"
import { cn } from "@/lib/utils"

export type Tab = "classifica" | "nuova" | "storico"

const items: { id: Tab; label: string; icon: typeof Medal }[] = [
  { id: "classifica", label: "Classifica", icon: Medal },
  { id: "nuova", label: "Nuova", icon: Plus },
  { id: "storico", label: "Storico", icon: List },
]

export function BottomNav({
  active,
  onChange,
}: {
  active: Tab
  onChange: (tab: Tab) => void
}) {
  return (
    <nav className="absolute bottom-0 left-0 right-0 z-20 bg-blue-600">
      <ul className="flex items-stretch">
        {items.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <li key={id} className="flex-1">
              <button
                type="button"
                onClick={() => onChange(id)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex w-full flex-col items-center gap-1 py-3 text-white transition-opacity",
                  isActive ? "opacity-100" : "opacity-70 hover:opacity-100",
                )}
              >
                <Icon
                  className={cn("h-6 w-6", id === "nuova" && "rounded-full")}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={cn("text-xs", isActive && "font-semibold")}>{label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
