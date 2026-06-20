"use client"

import { useEffect, useState } from "react"
import {
  fetchPlayers,
  fetchUpcomingMatches,
  fetchHistory,
  createPlayer,
  createMatch,
  finishMatchInDb,
  WIN_POINTS,
  type Player,
  type Match,
  type FinishedMatch,
} from "@/lib/padel-data"
import { BottomNav, type Tab } from "./bottom-nav"
import { ClassificaScreen } from "./classifica-screen"
import { NuovaScreen } from "./nuova-screen"
import { StoricoScreen } from "./storico-screen"
import { Loader2 } from "lucide-react"

export function AppShell() {
  const [tab, setTab] = useState<Tab>("classifica")
  const [players, setPlayers] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [history, setHistory] = useState<FinishedMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [p, m, h] = await Promise.all([
          fetchPlayers(),
          fetchUpcomingMatches(),
          fetchHistory(),
        ])
        if (!active) return
        setPlayers(p)
        setMatches(m)
        setHistory(h)
      } catch (err) {
        console.log("[v0] Errore caricamento dati:", err)
        if (active) setError("Impossibile caricare i dati dal database.")
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
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

    const { finished, winnerIds } = await finishMatchInDb(match, sets)

    // Calcolo dei set vinti e persi per la nuova classifica IRP
    let team1SetsWon = 0
    let team2SetsWon = 0
    sets.forEach(([score1, score2]) => {
      if (score1 > score2) team1SetsWon++
      else if (score2 > score1) team2SetsWon++
    })

    const team1Ids = [match.team[0], match.team[1]]
    const team2Ids = [match.team[2], match.team[3]]
    const matchPlayers = [...team1Ids, ...team2Ids]

    setHistory((prev) => [finished, ...prev])
    setMatches((prev) => prev.filter((m) => m.id !== matchId))
    setPlayers((prev) =>
      prev
        .map((p) => {
          // Se il giocatore non ha partecipato a questa partita, lo lasciamo intatto
          if (!matchPlayers.includes(p.id)) return p

          // Scopriamo in che squadra era e se ha vinto la partita
          const isTeam1 = team1Ids.includes(p.id)
          const isWinner = winnerIds.includes(p.id)
          
          const setsVinti = isTeam1 ? team1SetsWon : team2SetsWon
          const setsPersi = isTeam1 ? team2SetsWon : team1SetsWon

          // Aggiorniamo tutte le sue statistiche
          return {
            ...p,
            points: isWinner ? p.points + WIN_POINTS : p.points,
            partite_giocate: (p.partite_giocate || 0) + 1,
            set_vinti: (p.set_vinti || 0) + setsVinti,
            set_persi: (p.set_persi || 0) + setsPersi,
          }
        })
        .sort((a, b) => b.points - a.points),
    )
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
          <StoricoScreen history={history} players={players} />
        )}
      </div>
      <BottomNav active={tab} onChange={setTab} />
    </main>
  )
}