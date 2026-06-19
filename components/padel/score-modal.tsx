"use client"

import { useState } from "react"
import { X } from "lucide-react"
import type { Match, Player } from "@/lib/padel-data"

function teamName(players: Player[], a: string, b: string) {
  const pa = players.find((p) => p.id === a)?.name ?? "?"
  const pb = players.find((p) => p.id === b)?.name ?? "?"
  return `${pa} & ${pb}`
}

export function ScoreModal({
  match,
  players,
  onClose,
  onSubmit,
}: {
  match: Match
  players: Player[]
  onClose: () => void
  onSubmit: (matchId: string, sets: Array<[number, number]>) => void
}) {
  const [sets, setSets] = useState<Array<[string, string]>>([
    ["", ""],
    ["", ""],
    ["", ""],
  ])

  function updateSet(index: number, side: 0 | 1, value: string) {
    setSets((prev) => {
      const next = prev.map((s) => [...s] as [string, string])
      next[index][side] = value.replace(/[^0-9]/g, "").slice(0, 2)
      return next
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed: Array<[number, number]> = sets
      .filter(([x, y]) => x !== "" && y !== "")
      .map(([x, y]) => [Number(x), Number(y)])
    if (parsed.length === 0) return
    onSubmit(match.id, parsed)
  }

  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-slate-900/40">
      <div className="w-full rounded-t-2xl bg-white p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Inserisci Punteggio</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4 grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-3">
            <span className="text-sm font-medium text-slate-700">
              {teamName(players, match.team[0], match.team[1])}
            </span>
            <div className="flex gap-2">
              {sets.map((s, i) => (
                <input
                  key={`a-${i}`}
                  inputMode="numeric"
                  value={s[0]}
                  onChange={(e) => updateSet(i, 0, e.target.value)}
                  className="h-11 w-11 rounded-lg border border-slate-200 bg-slate-50 text-center text-base font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="-"
                  aria-label={`Set ${i + 1} coppia 1`}
                />
              ))}
            </div>

            <span className="text-sm font-medium text-slate-700">
              {teamName(players, match.team[2], match.team[3])}
            </span>
            <div className="flex gap-2">
              {sets.map((s, i) => (
                <input
                  key={`b-${i}`}
                  inputMode="numeric"
                  value={s[1]}
                  onChange={(e) => updateSet(i, 1, e.target.value)}
                  className="h-11 w-11 rounded-lg border border-slate-200 bg-slate-50 text-center text-base font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="-"
                  aria-label={`Set ${i + 1} coppia 2`}
                />
              ))}
            </div>
          </div>

          <p className="mb-4 text-xs text-slate-500">
            Lascia vuoti i set non giocati. La coppia vincente riceve 3 punti a
            testa.
          </p>

          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Salva Risultato
          </button>
        </form>
      </div>
    </div>
  )
}
