"use client"

import { useState } from "react"
import { X } from "lucide-react"
import type { Match, Player } from "@/lib/padel-data"

const slots: { key: 0 | 1 | 2 | 3; label: string }[] = [
  { key: 0, label: "Giocatore 1" },
  { key: 1, label: "Giocatore 2" },
  { key: 2, label: "Giocatore 3" },
  { key: 3, label: "Giocatore 4" },
]

export function NewMatchModal({
  players,
  onClose,
  onSubmit,
}: {
  players: Player[]
  onClose: () => void
  onSubmit: (match: Omit<Match, "id">) => void
}) {
  const [dateTime, setDateTime] = useState("")
  const [team, setTeam] = useState<[string, string, string, string]>(["", "", "", ""])
  const [bestOf, setBestOf] = useState<3 | 5>(3) // Nuova variabile di stato

  function setSlot(index: number, value: string) {
    setTeam((prev) => {
      const next = [...prev] as [string, string, string, string]
      next[index] = value
      return next
    })
  }

  const allFilled = dateTime !== "" && team.every((t) => t !== "")
  const noDuplicates = new Set(team.filter(Boolean)).size === team.filter(Boolean).length

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!allFilled || !noDuplicates) return
    onSubmit({ dateTime, team, bestOf }) // Inviamo anche l'impostazione dei set
  }

  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-slate-900/40">
      <div className="max-h-full w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Nuova Partita</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Data e Ora
            </label>
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Nuovo campo: Formato della partita */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Formato Partita
            </label>
            <select
              value={bestOf}
              onChange={(e) => setBestOf(Number(e.target.value) as 3 | 5)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value={3}>Al meglio di 3 set</option>
              <option value={5}>Al meglio di 5 set</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {slots.map(({ key, label }) => (
              <div key={key}>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  {label}
                </label>
                <select
                  value={team[key]}
                  onChange={(e) => setSlot(key, e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Seleziona</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {!noDuplicates && (
            <p className="text-xs text-red-500">
              Ogni giocatore può essere selezionato una sola volta.
            </p>
          )}

          <button
            type="submit"
            disabled={!allFilled || !noDuplicates}
            className="mt-2 w-full rounded-xl bg-blue-600 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Crea Partita
          </button>
        </form>
      </div>
    </div>
  )
}