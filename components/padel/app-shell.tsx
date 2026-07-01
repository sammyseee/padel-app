"use client"

import { useEffect, useState } from "react"
import {
  fetchPlayers,
  fetchUpcomingMatches,
  fetchHistory,
  createPlayer,
  createMatch,
  finishMatchInDb,
  deleteFinishedMatch,
  type Player,
  type Match,
  type FinishedMatch,
} from "@/lib/padel-data"
import { BottomNav, type Tab } from "@/components/bottom-nav"
import { ClassificaScreen } from "@/components/classifica-screen"
import { NuovaScreen } from "@/components/nuova-screen"
import { StoricoScreen } from "@/components/storico-screen"
import { Loader2 } from "lucide-react"

export function AppShell() {
  const [tab, setTab] = useState<Tab>("classifica")
  const [players, setPlayers] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [history, setHistory] = useState<FinishedMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadAllData() {
    try {
      const [p, m, h] = await Promise.all([
        fetchPlayers(),
        fetchUpcomingMatches(),
        fetchHistory(),
      ])
      setPlayers(p)
      setMatches(m)
      setHistory(h)
    } catch (err) {
      console.log("[v0] Errore caricamento dati:", err)
      setError("Impossibile caricare i dati dal database.")
    }
  }

  useEffect(() => {
    let active = true
    async function init() {
      await loadAllData()
      if (active) setLoading(false)
    }
    init()
    return () => {
      active = false
    }
  }, [])

  async function addPlayer(name: string) {
    const created = await createPlayer(name)
    setPlayers((prev) =>
      [...prev, created].sort((a, b) => b.points - a.points),
    )
  }

  async function addMatch(match: Omit<Match, "id">) {
    const created = await createMatch(match)
    setMatches((prev) =>
      [...prev, created].sort(
        (a, b) =>
          new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
      ),
    )
  }

  async function finishMatch(matchId: string, sets: Array<[number, number]>) {
    const match = matches.find((m) => m.id === matchId)
    if (!match) return

    await finishMatchInDb(match, sets)
    await loadAllData()
  }

  async function handleDeleteMatch(matchId: string) {
    try {
      // Nascondiamo subito la partita per dare la sensazione di velocità
      setHistory((prev) => prev.filter((m) => m.id !== matchId))
      
      // Cancelliamo dal DB e resettiamo i punti
      await deleteFinishedMatch(matchId)
      
      // Ricarichiamo tutto
      await loadAllData()
    } catch (err) {
      if (err instanceof Error) {
        alert("Errore del Database: " + err.message)
      } else {
        alert("Si è verificato un errore sconosciuto.")
      }
      // Se fallisce, rimettiamo tutto come prima
      await loadAllData()
    }
  }

  if (loading) {
    return (
      <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center bg-slate-50 shadow-xl">
        <Loader2 className="size-8 animate-spin text-blue-600" />
        <p className="mt-3 text-sm text-slate-500">Caricamento…</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center bg-slate-50 px-6 text-center shadow-xl">
        <p className="text-sm text-slate-600">{error}</p>
      </main>
    )
  }

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-slate-50 shadow-xl">
      <div className="flex-1 overflow-y-auto pb-24">
        {tab === "classifica" && (
          <ClassificaScreen players={players} onAddPlayer={addPlayer} />
        )}
        {tab === "nuova" && (
          <NuovaScreen
            players={players}
            matches={matches}
            onAddMatch={addMatch}
            onFinishMatch={finishMatch}
          />
        )}
        {tab === "storico" && (
          <StoricoScreen
            history={history}
            players={players}
            onDeleteMatch={handleDeleteMatch}
          />
        )}
      </div>
      <BottomNav active={tab} onChange={setTab} />
    </main>
  )
}