import { createClient } from "@/lib/supabase/client"

export const WIN_POINTS = 3

export type Player = {
  id: string
  name: string
  points: number
  partite_giocate?: number
  set_vinti?: number
  set_persi?: number
  win_streak?: number
}

export type Match = {
  id: string
  dateTime: string
  team: [string, string, string, string]
  bestOf: 3 | 5
}

export type FinishedMatch = Match & {
  sets: Array<[number, number]>
  winner: "A" | "B"
}

// --- DB row types ---
type GiocatoreRow = {
  id: string
  name: string
  points: number
  partite_giocate: number
  set_vinti: number
  set_persi: number
  win_streak: number
}

type PartitaRow = {
  id: string
  date_time: string
  player1: string
  player2: string
  player3: string
  player4: string
  sets: Array<[number, number]> | null
  winner: "A" | "B" | null
  status: "upcoming" | "finished"
  best_of: number
}

function mapMatch(row: PartitaRow): Match {
  return {
    id: row.id,
    dateTime: row.date_time,
    team: [row.player1, row.player2, row.player3, row.player4],
    bestOf: (row.best_of === 5 ? 5 : 3) as 3 | 5,
  }
}

// --- Players ---
export async function fetchPlayers(): Promise<Player[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("giocatori")
    .select("id, name, points, partite_giocate, set_vinti, set_persi, win_streak")
    .order("points", { ascending: false })
  if (error) throw error
  return (data as GiocatoreRow[]) ?? []
}

export async function createPlayer(name: string): Promise<Player> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("giocatori")
    .insert({ name, points: 0 })
    .select("id, name, points, partite_giocate, set_vinti, set_persi, win_streak")
    .single()
  if (error) throw error
  return data as GiocatoreRow
}

// --- Matches ---
export async function fetchUpcomingMatches(): Promise<Match[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("partite")
    .select("*")
    .eq("status", "upcoming")
    .order("date_time", { ascending: true })
  if (error) throw error
  return ((data as PartitaRow[]) ?? []).map(mapMatch)
}

export async function fetchHistory(): Promise<FinishedMatch[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("partite")
    .select("*")
    .eq("status", "finished")
    .order("date_time", { ascending: false })
  if (error) throw error
  return ((data as PartitaRow[]) ?? []).map((row) => ({
    ...mapMatch(row),
    sets: row.sets ?? [],
    winner: (row.winner ?? "A") as "A" | "B",
  }))
}

export async function createMatch(match: Omit<Match, "id">): Promise<Match> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("partite")
    .insert({
      date_time: match.dateTime,
      player1: match.team[0],
      player2: match.team[1],
      player3: match.team[2],
      player4: match.team[3],
      status: "upcoming",
      best_of: match.bestOf,
    })
    .select("*")
    .single()
  if (error) throw error
  return mapMatch(data as PartitaRow)
}

export async function finishMatchInDb(
  match: Match,
  sets: Array<[number, number]>,
): Promise<{ finished: FinishedMatch; winnerIds: string[] }> {
  const supabase = createClient()
  const setsWonA = sets.filter(([a, b]) => a > b).length
  const setsWonB = sets.filter(([a, b]) => b > a).length
  const winner: "A" | "B" = setsWonA >= setsWonB ? "A" : "B"

  const { error: updateError } = await supabase
    .from("partite")
    .update({ sets, winner, status: "finished" })
    .eq("id", match.id)
  if (updateError) throw updateError

  const winnerIds =
    winner === "A"
      ? [match.team[0], match.team[1]]
      : [match.team[2], match.team[3]]

  const { data: currentPlayers, error: fetchErr } = await supabase
    .from("giocatori")
    .select("id, points, partite_giocate, set_vinti, set_persi, win_streak")
    .in("id", match.team)
  
  if (fetchErr) throw fetchErr

  const updatePromises = (currentPlayers || []).map((p: GiocatoreRow) => {
    const isTeamA = p.id === match.team[0] || p.id === match.team[1]
    const isWinner = winnerIds.includes(p.id)
    
    const setsV = isTeamA ? setsWonA : setsWonB
    const setsP = isTeamA ? setsWonB : setsWonA

    const newStreak = isWinner ? (p.win_streak || 0) + 1 : 0

    return supabase
      .from("giocatori")
      .update({
        points: p.points + (isWinner ? WIN_POINTS : 0),
        partite_giocate: (p.partite_giocate || 0) + 1,
        set_vinti: (p.set_vinti || 0) + setsV,
        set_persi: (p.set_persi || 0) + setsP,
        win_streak: newStreak,
      })
      .eq("id", p.id)
  })

  await Promise.all(updatePromises)

  return { finished: { ...match, sets, winner }, winnerIds }
}

// Cancella partita e ripristina i punti
export async function deleteFinishedMatch(matchId: string): Promise<string[]> {
  const supabase = createClient()
  
  const { data: matchData, error: matchError } = await supabase.from("partite").select("*").eq("id", matchId).single()
  if (matchError) throw new Error("Errore lettura database: " + matchError.message)
  if (!matchData || matchData.status !== "finished") throw new Error("La partita non è stata trovata o non è conclusa.")

  const row = matchData as PartitaRow
  const sets = row.sets || []
  const setsWonA = sets.filter(([a, b]) => a > b).length
  const setsWonB = sets.filter(([a, b]) => b > a).length
  const winner = row.winner
  const team = [row.player1, row.player2, row.player3, row.player4]
  const winnerIds = winner === "A" ? [team[0], team[1]] : [team[2], team[3]]

  const { data: currentPlayers, error: playersError } = await supabase.from("giocatori").select("*").in("id", team)
  if (playersError) throw new Error("Errore lettura giocatori: " + playersError.message)

  const players = (currentPlayers as GiocatoreRow[]) || []
  const updatePromises = players.map((p) => {
    const isTeamA = p.id === team[0] || p.id === team[1]
    const isWinner = winnerIds.includes(p.id)
    const setsV = isTeamA ? setsWonA : setsWonB
    const setsP = isTeamA ? setsWonB : setsWonA

    return supabase
      .from("giocatori")
      .update({
        points: Math.max(0, p.points - (isWinner ? WIN_POINTS : 0)),
        partite_giocate: Math.max(0, p.partite_giocate - 1),
        set_vinti: Math.max(0, p.set_vinti - setsV),
        set_persi: Math.max(0, p.set_persi - setsP),
        win_streak: isWinner ? Math.max(0, p.win_streak - 1) : p.win_streak
      })
      .eq("id", p.id)
  })

  const results = await Promise.all(updatePromises)
  results.forEach(res => {
    if (res.error) throw new Error("Impossibile aggiornare le statistiche: " + res.error.message)
  })

  const { error: deleteError } = await supabase.from("partite").delete().eq("id", matchId)
  if (deleteError) throw new Error("Impossibile cancellare dal database: " + deleteError.message)
  
  return team 
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString("it-IT", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
  const time = d.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  })
  return `${date} · ${time}`
}