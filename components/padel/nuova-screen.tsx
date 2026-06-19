"use client"

import { useState } from "react"
import { Plus, CalendarClock } from "lucide-react"
import type { Match, Player } from "@/lib/padel-data"
import { formatDateTime } from "@/lib/padel-data"
import { NewMatchModal } from "./new-match-modal"
import { ScoreModal } from "./score-modal"

function name(players: Player[], id: string) {
  return players.find((p) => p.id === id)?.name ?? "?"
}

export function NuovaScreen({
  players,
  matches,
  onAddMatch,
  onFinishMatch,
}: {
  players: Player[]
  matches: Match[]
  onAddMatch: (match: Omit<Match, "id">) => Promise<void>
  onFinishMatch: (matchId: string, sets: Array<[number, number]>) => Promise<void>
}) {
  const [showNew, setShowNew] = useState(false)
  const [scoreMatch, setScoreMatch] = useState<Match | null>(null)

  const upcoming = [...matches].sort(
    (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
  )

  return (
    <div className="px-4 pb-6 pt-5">
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900">Programma</h1>
      </header>

      <button
        type="button"
        onClick={() => setShowNew(true)}
        className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
      >
        <Plus className="h-5 w-5" />
        Nuova Partita
      </button>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Prossime Partite
      </h2>

      <ul className="flex flex-col gap-3">
        {upcoming.map((match) => (
          <li key={match.id} className="rounded-xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-1.5 text-sm font-medium text-blue-600">
              <CalendarClock className="h-4 w-4" />
              {formatDateTime(match.dateTime)}
            </div>
            <div className="mb-4 flex items-center justify-between gap-2 text-sm">
              <span className="flex-1 text-right font-medium text-slate-800">
                {name(players, match.team[0])} & {name(players, match.team[1])}
              </span>
              <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                VS
              </span>
              <span className="flex-1 font-medium text-slate-800">
                {name(players, match.team[2])} & {name(players, match.team[3])}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setScoreMatch(match)}
              className="w-full rounded-lg border border-blue-600 py-2 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50"
            >
              Inserisci Punteggio
            </button>
          </li>
        ))}
        {upcoming.length === 0 && (
          <li className="rounded-xl bg-white px-4 py-6 text-center text-sm text-slate-500 shadow-sm">
            Nessuna partita in programma.
          </li>
        )}
      </ul>

      {showNew && (
        <NewMatchModal
          players={players}
          onClose={() => setShowNew(false)}
          onSubmit={(m) => {
            onAddMatch(m)
            setShowNew(false)
          }}
        />
      )}

      {scoreMatch && (
        <ScoreModal
          match={scoreMatch}
          players={players}
          onClose={() => setScoreMatch(null)}
          onSubmit={(id, sets) => {
            onFinishMatch(id, sets)
            setScoreMatch(null)
          }}
        />
      )}
    </div>
  )
}
