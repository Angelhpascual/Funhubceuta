import { NextResponse } from 'next/server'
import { setConfig, deleteConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import type { LiveMatch, LineupPlayer, MatchStat } from '@/domain/match/LiveMatch'

async function getNextMatch(): Promise<{ homeTeam: string; awayTeam: string; venue: string; startDate: string }> {
  const { data } = await supabaseAdmin
    .from('matches')
    .select('home_team, away_team, venue, date, time')
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true })
    .limit(1)
    .single()

  if (!data) return { homeTeam: 'FC Andorra', awayTeam: 'AD Ceuta FC', venue: 'Estadio de la FAF, Encamp', startDate: new Date().toISOString() }
  const dateStr = data.time ? `${data.date}T${data.time}:00` : `${data.date}T00:00:00`
  return {
    homeTeam: data.home_team,
    awayTeam: data.away_team,
    venue: data.venue ?? '',
    startDate: new Date(dateStr).toISOString(),
  }
}

const PHOTO_BASE = 'https://onguesyapdtatsadsxmc.supabase.co/storage/v1/object/public/player-photos/players'
const CEUTA_PHOTOS: Record<string, string> = {
  'Pedro López':   `${PHOTO_BASE}/13b9af2f-c17b-45c3-a5bb-3a27c0831944.webp`,
  'Capa':          `${PHOTO_BASE}/c48f3f13-e4b6-45ce-9814-7336a5f87059.webp`,
  'Yago':          `${PHOTO_BASE}/88a5f311-1846-4a4b-ad3d-fa6b2df2b4c6.webp`,
  'Matos':         `${PHOTO_BASE}/4d1021f3-93c7-4597-a74e-af17c066653f.webp`,
  'Manu Schez':    `${PHOTO_BASE}/f06ba38e-4e6d-4b1e-8152-c4dac8fe589e.webp`,
  'Josema':        `${PHOTO_BASE}/eca02ca5-c3e9-43ef-8191-2cf8842f8a1e.webp`,
  'Salvi Sánchez': `${PHOTO_BASE}/aac6c9c7-b40f-4f34-879f-a12c72136065.webp`,
  'Bodiger':       `${PHOTO_BASE}/449a4ff9-6cc7-408f-9c99-20281644d751.webp`,
  'Anuar':         `${PHOTO_BASE}/6e6c6903-f594-4a37-9767-51687c3846c5.webp`,
  'Marino':        `${PHOTO_BASE}/0d969b04-b3dd-40b1-ab45-7b2edeedefcb.webp`,
  'Zalazar':       `${PHOTO_BASE}/bf5eef63-efdb-4f77-b14b-65cd68b17e51.webp`,
  'Hassan':        `${PHOTO_BASE}/eca02ca5-c3e9-43ef-8191-2cf8842f8a1e.webp`,
  'Marín':         `${PHOTO_BASE}/aac6c9c7-b40f-4f34-879f-a12c72136065.webp`,
}

const ceuta = (name: string, type: 'goal' | 'yellowCard' | 'redCard', minute: string) => ({
  type, minute, team: 'away' as const, playerName: name, photoUrl: CEUTA_PHOTOS[name] ?? null,
})

const CEUTA_LINEUP: LineupPlayer[] = [
  { name: 'Pedro López',   jersey: '1',  position: 'GK', starter: true, photoUrl: 'https://onguesyapdtatsadsxmc.supabase.co/storage/v1/object/public/player-photos/players/13b9af2f-c17b-45c3-a5bb-3a27c0831944.webp' },
  { name: 'Capa',          jersey: '2',  position: 'RB', starter: true, photoUrl: 'https://onguesyapdtatsadsxmc.supabase.co/storage/v1/object/public/player-photos/players/c48f3f13-e4b6-45ce-9814-7336a5f87059.webp' },
  { name: 'Yago',          jersey: '5',  position: 'CB', starter: true, photoUrl: 'https://onguesyapdtatsadsxmc.supabase.co/storage/v1/object/public/player-photos/players/88a5f311-1846-4a4b-ad3d-fa6b2df2b4c6.webp' },
  { name: 'Matos',         jersey: '4',  position: 'CB', starter: true, photoUrl: 'https://onguesyapdtatsadsxmc.supabase.co/storage/v1/object/public/player-photos/players/4d1021f3-93c7-4597-a74e-af17c066653f.webp' },
  { name: 'Manu Schez',    jersey: '3',  position: 'LB', starter: true, photoUrl: 'https://onguesyapdtatsadsxmc.supabase.co/storage/v1/object/public/player-photos/players/f06ba38e-4e6d-4b1e-8152-c4dac8fe589e.webp' },
  { name: 'Josema',        jersey: '6',  position: 'DM', starter: true, photoUrl: 'https://onguesyapdtatsadsxmc.supabase.co/storage/v1/object/public/player-photos/players/eca02ca5-c3e9-43ef-8191-2cf8842f8a1e.webp' },
  { name: 'Salvi Sánchez', jersey: '8',  position: 'CM', starter: true, photoUrl: 'https://onguesyapdtatsadsxmc.supabase.co/storage/v1/object/public/player-photos/players/aac6c9c7-b40f-4f34-879f-a12c72136065.webp' },
  { name: 'Bodiger',       jersey: '10', position: 'CM', starter: true, photoUrl: 'https://onguesyapdtatsadsxmc.supabase.co/storage/v1/object/public/player-photos/players/449a4ff9-6cc7-408f-9c99-20281644d751.webp' },
  { name: 'Anuar',         jersey: '7',  position: 'RW', starter: true, photoUrl: 'https://onguesyapdtatsadsxmc.supabase.co/storage/v1/object/public/player-photos/players/6e6c6903-f594-4a37-9767-51687c3846c5.webp' },
  { name: 'Marino',        jersey: '11', position: 'LW', starter: true, photoUrl: 'https://onguesyapdtatsadsxmc.supabase.co/storage/v1/object/public/player-photos/players/0d969b04-b3dd-40b1-ab45-7b2edeedefcb.webp' },
  { name: 'Zalazar',       jersey: '9',  position: 'ST', starter: true, photoUrl: 'https://onguesyapdtatsadsxmc.supabase.co/storage/v1/object/public/player-photos/players/bf5eef63-efdb-4f77-b14b-65cd68b17e51.webp' },
]

const RIVAL_LINEUP: LineupPlayer[] = [
  { name: 'Ratti',    jersey: '1',  position: 'GK', starter: true },
  { name: 'García',   jersey: '2',  position: 'RB', starter: true },
  { name: 'Molina',   jersey: '5',  position: 'CB', starter: true },
  { name: 'Torres',   jersey: '4',  position: 'CB', starter: true },
  { name: 'Ramos',    jersey: '3',  position: 'LB', starter: true },
  { name: 'Ruiz',     jersey: '8',  position: 'CM', starter: true },
  { name: 'López',    jersey: '6',  position: 'CM', starter: true },
  { name: 'Martín',   jersey: '10', position: 'AM', starter: true },
  { name: 'Díaz',     jersey: '7',  position: 'RW', starter: true },
  { name: 'Fernández',jersey: '11', position: 'LW', starter: true },
  { name: 'Pérez',    jersey: '9',  position: 'ST', starter: true },
]

function stats(homePoss: number, homeShots: number, awayShots: number, homeCorners: number, awayCorners: number, homePass: number, awayPass: number): MatchStat[] {
  return [
    { name: 'possessionPct', displayName: 'Posesión', home: String(homePoss), away: String(100 - homePoss) },
    { name: 'shotsOnTarget', displayName: 'Tiros a puerta', home: String(homeShots), away: String(awayShots) },
    { name: 'wonCorners',    displayName: 'Córners',        home: String(homeCorners), away: String(awayCorners) },
    { name: 'passPct',       displayName: 'Precisión pases', home: String(homePass), away: String(awayPass) },
  ]
}

function buildScenarios(homeTeam: string, awayTeam: string, venue: string, startDate: string): Record<string, LiveMatch> {
  const BASE: LiveMatch = {
    espnId: 'mock-001',
    homeTeam,
    awayTeam,
    homeScore: 0,
    awayScore: 0,
    events: [],
    venue,
    startDate,
    clock: '',
    status: '',
    state: 'pre',
  }

  return {
  pre: { ...BASE, state: 'pre', homeLineup: RIVAL_LINEUP, awayLineup: CEUTA_LINEUP },
  live_0_0: { ...BASE, state: 'in', clock: "23'", status: '1st Half', homeLineup: RIVAL_LINEUP, awayLineup: CEUTA_LINEUP },
  live_goal_ceuta: {
    ...BASE, state: 'in', clock: "67'", awayScore: 1,
    events: [ceuta('Zalazar', 'goal', "67'")],
  },
  live_goal_rival: {
    ...BASE, state: 'in', clock: "34'", homeScore: 1,
    events: [{ type: 'goal', minute: "34'", team: 'home', playerName: 'Molina' }],
  },
  live_events: {
    ...BASE, state: 'in', clock: "78'", homeScore: 1, awayScore: 2,
    events: [
      ceuta('Zalazar', 'goal', "12'"),
      { type: 'yellowCard', minute: "28'", team: 'home', playerName: 'García' },
      { type: 'goal', minute: "45'", team: 'home', playerName: 'Molina' },
      { type: 'redCard', minute: "61'", team: 'home', playerName: 'Torres' },
      ceuta('Hassan', 'goal', "74'"),
    ],
  },
  // ── Full simulation steps ──
  sim_pre: {
    ...BASE, state: 'pre',
    homeLineup: RIVAL_LINEUP, awayLineup: CEUTA_LINEUP,
    stats: stats(50, 0, 0, 0, 0, 0, 0),
  },
  sim_kickoff: {
    ...BASE, state: 'in', clock: "1'",
    homeLineup: RIVAL_LINEUP, awayLineup: CEUTA_LINEUP,
    stats: stats(52, 0, 1, 0, 0, 78, 74),
  },
  sim_amarilla: {
    ...BASE, state: 'in', clock: "15'",
    homeLineup: RIVAL_LINEUP, awayLineup: CEUTA_LINEUP,
    events: [{ type: 'yellowCard', minute: "15'", team: 'home', playerName: 'García' }],
    stats: stats(44, 1, 2, 1, 1, 76, 81),
  },
  sim_goal1: {
    ...BASE, state: 'in', clock: "23'", awayScore: 1,
    homeLineup: RIVAL_LINEUP, awayLineup: CEUTA_LINEUP,
    events: [
      { type: 'yellowCard', minute: "15'", team: 'home', playerName: 'García' },
      { type: 'goal',       minute: "23'", team: 'away', playerName: 'Zalazar' },
    ],
    stats: stats(41, 1, 4, 1, 2, 75, 83),
  },
  sim_mid1: {
    ...BASE, state: 'in', clock: "38'", awayScore: 1,
    homeLineup: RIVAL_LINEUP, awayLineup: CEUTA_LINEUP,
    events: [
      { type: 'yellowCard', minute: "15'", team: 'home', playerName: 'García' },
      { type: 'goal',       minute: "23'", team: 'away', playerName: 'Zalazar' },
    ],
    stats: stats(39, 2, 6, 2, 4, 74, 84),
  },
  sim_halftime: {
    ...BASE, state: 'in', clock: "45+2'", awayScore: 1,
    homeLineup: RIVAL_LINEUP, awayLineup: CEUTA_LINEUP,
    events: [
      { type: 'yellowCard', minute: "15'", team: 'home', playerName: 'García' },
      { type: 'goal',       minute: "23'", team: 'away', playerName: 'Zalazar' },
    ],
    stats: stats(38, 2, 7, 3, 4, 73, 85),
  },
  sim_2half: {
    ...BASE, state: 'in', clock: "50'", awayScore: 1,
    homeLineup: RIVAL_LINEUP, awayLineup: CEUTA_LINEUP,
    events: [
      { type: 'yellowCard', minute: "15'", team: 'home', playerName: 'García' },
      { type: 'goal',       minute: "23'", team: 'away', playerName: 'Zalazar' },
    ],
    stats: stats(41, 3, 7, 3, 5, 75, 84),
  },
  sim_goal_rival: {
    ...BASE, state: 'in', clock: "58'", homeScore: 1, awayScore: 1,
    homeLineup: RIVAL_LINEUP, awayLineup: CEUTA_LINEUP,
    events: [
      { type: 'yellowCard', minute: "15'", team: 'home', playerName: 'García' },
      { type: 'goal',       minute: "23'", team: 'away', playerName: 'Zalazar' },
      { type: 'goal',       minute: "58'", team: 'home', playerName: 'Molina' },
    ],
    stats: stats(43, 4, 8, 4, 6, 76, 83),
  },
  sim_roja: {
    ...BASE, state: 'in', clock: "65'", homeScore: 1, awayScore: 1,
    homeLineup: RIVAL_LINEUP, awayLineup: CEUTA_LINEUP,
    events: [
      { type: 'yellowCard', minute: "15'", team: 'home', playerName: 'García' },
      { type: 'goal',       minute: "23'", team: 'away', playerName: 'Zalazar' },
      { type: 'goal',       minute: "58'", team: 'home', playerName: 'Molina' },
      { type: 'redCard',    minute: "65'", team: 'home', playerName: 'Torres' },
    ],
    stats: stats(45, 5, 9, 5, 7, 78, 82),
  },
  sim_goal2: {
    ...BASE, state: 'in', clock: "74'", homeScore: 1, awayScore: 2,
    homeLineup: RIVAL_LINEUP, awayLineup: CEUTA_LINEUP,
    events: [
      { type: 'yellowCard', minute: "15'", team: 'home', playerName: 'García' },
      { type: 'goal',       minute: "23'", team: 'away', playerName: 'Zalazar' },
      { type: 'goal',       minute: "58'", team: 'home', playerName: 'Molina' },
      { type: 'redCard',    minute: "65'", team: 'home', playerName: 'Torres' },
      { type: 'goal',       minute: "74'", team: 'away', playerName: 'Hassan' },
    ],
    stats: stats(47, 6, 11, 6, 7, 80, 81),
  },
  sim_final: {
    ...BASE, state: 'post', homeScore: 1, awayScore: 2,
    homeLineup: RIVAL_LINEUP, awayLineup: CEUTA_LINEUP,
    events: [
      { type: 'yellowCard', minute: "15'", team: 'home', playerName: 'García' },
      { type: 'goal',       minute: "23'", team: 'away', playerName: 'Zalazar' },
      { type: 'goal',       minute: "58'", team: 'home', playerName: 'Molina' },
      { type: 'redCard',    minute: "65'", team: 'home', playerName: 'Torres' },
      { type: 'goal',       minute: "74'", team: 'away', playerName: 'Hassan' },
    ],
    stats: stats(47, 7, 13, 7, 8, 80, 80),
  },

  win: { ...BASE, state: 'post', homeScore: 0, awayScore: 2, homeLineup: RIVAL_LINEUP, awayLineup: CEUTA_LINEUP, events: [
    { type: 'goal', minute: "55'", team: 'away', playerName: 'Zalazar' },
    { type: 'goal', minute: "88'", team: 'away', playerName: 'Marín' },
  ]},
  draw: { ...BASE, state: 'post', homeScore: 1, awayScore: 1, events: [
    { type: 'goal', minute: "20'", team: 'home', playerName: 'Molina' },
    { type: 'goal', minute: "71'", team: 'away', playerName: 'Hassan' },
  ]},
  loss: { ...BASE, state: 'post', homeScore: 2, awayScore: 0, events: [
    { type: 'goal', minute: "10'", team: 'home', playerName: 'García' },
    { type: 'goal', minute: "82'", team: 'home', playerName: 'Ramos' },
  ]},
  }
}

export async function POST(req: Request) {
  const { scenario } = await req.json()

  if (scenario === 'clear') {
    await deleteConfig('live_match_mock')
    return NextResponse.json({ ok: true, cleared: true })
  }

  const { homeTeam, awayTeam, venue, startDate } = await getNextMatch()
  const SCENARIOS = buildScenarios(homeTeam, awayTeam, venue, startDate)

  const mock = SCENARIOS[scenario]
  if (!mock) return NextResponse.json({ error: 'Unknown scenario' }, { status: 400 })

  await setConfig('live_match_mock', JSON.stringify(mock))
  return NextResponse.json({ ok: true, scenario, match: mock })
}
