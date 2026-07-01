"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import type { FinishedMatch, Player } from "@/lib/padel-data"
import { cn } from "@/lib/utils"

function name(players: Player[], id: string) {
  return players.find((p) => p.id === id)?.name ?? "?"
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function TeamRow({
  label,
  scores,
  isWinner,
  side,
}: {
  label: string
  scores: number[]
  isWinner: boolean
  side: 0 | 1
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span
        className={cn(
          "min-w-0 flex-1 truncate",
          isWinner ? "font-bold text-slate-900" : "font-normal text-slate-600",
        )}
      >
        {label}
      </span>
      <div className="flex shrink-0 gap-1.5">
        {scores.map((s, i) => (
          <span
            key={i}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md text-sm tabular-nums",
              isWinner
                ? "bg-blue-50 font-bold text-blue-700"
                : "bg-slate-50 font-normal text-slate-500",
            )}
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}

export function StoricoScreen({
  history,
  players,
  onDeleteMatch,
}: {
  history: FinishedMatch[]
  players: Player[]
  onDeleteMatch: (matchId: string) => Promise<void>
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const sorted = [...history].sort(
    (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
  )

  async function handleDelete(matchId: string) {
    if (!window.confirm("Sei sicuro di voler eliminare questa partita? I punti verranno tolti dalla classifica e la rimozione è irreversibile.")) {
      return
    }
    setDeletingId(matchId)
    await onDeleteMatch(matchId)
    setDeletingId(null)
  }

  return (
    <div className="px-4 pb-6 pt-5">
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900">Storico</h1>
      </header>

      <ul className="flex flex-col gap-3">
        {sorted.map((match) => {
          const aScores = match.sets.map((s) => s[0])
          const bScores = match.sets.map((s) => s[1])
          const isDeleting = deletingId === match.id

          return (
            <li key={match.id} className={cn("rounded-xl bg-white p-4 shadow-sm transition-opacity", isDeleting && "opacity-50 pointer-events-none")}>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium capitalize text-slate-400">
                  {formatDate(match.dateTime)}
                </p>
                <button
                  onClick={() => handleDelete(match.id)}
                  title="Elimina partita"
                  className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-col gap-2.5">
                <TeamRow
                  label={`${name(players, match.team[0])} & ${name(players, match.team[1])}`}
                  scores={aScores}
                  isWinner={match.winner === "A"}
                  side={0}
                />
                <TeamRow
                  label={`${name(players, match.team[2])} & ${name(players, match.team[3])}`}
                  scores={bScores}
                  isWinner={match.winner === "B"}
                  side={1}
                />
              </div>
            </li>
          )
        })}
        {sorted.length === 0 && (
          <li className="rounded-xl bg-white px-4 py-6 text-center text-sm text-slate-500 shadow-sm">
            Nessuna partita conclusa.
          </li>
        )}
      </ul>
    </div>
  )
}