import { createClient } from "@/lib/supabase/client"

export const WIN_POINTS = 3

export type Player = {
  id: string
  name: string
  points: number
  partite_giocate?: number
  set_vinti?: number
  set_persi?: number
}

export type Match = {
  id: string
  dateTime: string // ISO string
  // team A = [player1, player2], team B = [player3, player4]
  team: [string, string, string, string]
}

// A finished match: sets are pairs [teamAGames, teamBGames]
export type FinishedMatch = Match & {
  sets: Array<[number, number]>
  winner: "A" | "B"
}

// --- DB row types ---
type GiocatoreRow = {
  id: string
  name: string
  points: number
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
}

function mapMatch(row: PartitaRow): Match {
  return {
    id: row.id,
    dateTime: row.date_time,
    team: [row.player1, row.player2, row.player3, row.player4],
  }
}

// --- Players ---
export async function fetchPlayers(): Promise<Player[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("giocatori")
    .select("id, name, points")
    .order("points", { ascending: false })
  if (error) throw error
  return (data as GiocatoreRow[]) ?? []
}

export async function createPlayer(name: string): Promise<Player> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("giocatori")
    .insert({ name, points: 0 })
    .select("id, name, points")
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

  const { error: pointsError } = await supabase.rpc("increment_points", {
    player_ids: winnerIds,
    amount: WIN_POINTS,
  })
  if (pointsError) throw pointsError

  return { finished: { ...match, sets, winner }, winnerIds }
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
