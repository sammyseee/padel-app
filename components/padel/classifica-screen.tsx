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
  const [tipoClassifica, setTipoClassifica] = useState<"punti" | "irp">("punti")

  // Funzione per il calcolo dell'Indice di Rendimento Ponderato (IRP)
  const calcolaIRP = (player: any) => {
    const partite = player.partite_giocate || 0
    const setVinti = player.set_vinti || 0
    const setPersi = player.set_persi || 0
    
    if (partite === 0) return 0 
    
    return (setVinti - setPersi) / (partite + 10)
  }

  // Ordinamento dinamico in base al tab selezionato
  const ranked = [...players].sort((a, b) => {
    if (tipoClassifica === "punti") {
      return b.points - a.points
    } else {
      return calcolaIRP(b) - calcolaIRP(a)
    }
  })

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

      {/* Selettore Tipo Classifica */}
      <div className="mb-4 flex rounded-lg bg-slate-100 p-1">
        <button
          onClick={() => setTipoClassifica("punti")}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
            tipoClassifica === "punti"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Punti Attuali
        </button>
        <button
          onClick={() => setTipoClassifica("irp")}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
            tipoClassifica === "irp"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Rendimento (IRP)
        </button>
      </div>

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
            
            <div className="flex flex-col items-end">
              <span className="font-bold text-slate-900">
                {tipoClassifica === "punti" 
                  ? `${player.points} pt` 
                  : calcolaIRP(player).toFixed(2)}
              </span>
              <span className="text-xs font-medium text-slate-400">
                {player.partite_giocate || 0} match
              </span>
            </div>
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