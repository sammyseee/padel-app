"use client"

import { useState } from "react"
import { UserPlus, X } from "lucide-react"
import type { Player } from "@/lib/padel-data"

export function ClassificaScreen({
  players,
  onAddPlayer,
}: {
  players: Player[]
  onAddPlayer: (name: string) => Promise<void>
}) {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)

  const ranked = [...players].sort((a, b) => b.points - a.points)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || saving) return
    setSaving(true)
    try {
      await onAddPlayer(trimmed)
      setName("")
      setShowForm(false)
    } catch (err) {
      console.log("[v0] Errore aggiunta giocatore:", err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 pb-6 pt-5">
      <header className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Classifica</h1>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
        >
          <UserPlus className="h-4 w-4" />
          Aggiungi Giocatore
        </button>
      </header>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome del giocatore"
              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="submit"
              disabled={saving}
              className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "..." : "Aggiungi"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              aria-label="Chiudi"
              className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}

      <ul className="flex flex-col gap-2.5">
        {ranked.map((player, index) => (
          <li
            key={player.id}
            className="flex items-center gap-4 rounded-xl bg-white px-4 py-3.5 shadow-sm"
          >
            <span className="w-7 text-center text-xl font-bold text-blue-600">
              {index + 1}
            </span>
            <span className="flex-1 truncate font-medium text-slate-800">
              {player.name}
            </span>
            <span className="font-bold text-slate-900">{player.points} pt</span>
          </li>
        ))}
        {ranked.length === 0 && (
          <li className="rounded-xl bg-white px-4 py-6 text-center text-sm text-slate-500 shadow-sm">
            Nessun giocatore. Aggiungine uno per iniziare.
          </li>
        )}
      </ul>
    </div>
  )
}
