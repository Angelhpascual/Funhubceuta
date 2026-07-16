import { NextResponse } from 'next/server'
import { setConfig, deleteConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import type { LiveMatch, LineupPlayer, MatchStat } from '@/domain/match/LiveMatch'

async function getNextMatch(): Promise<{ homeTeam: string; awayTeam: string; venue: string; startDate: string }> {
  const { data } = await supabaseAdmin
    .from('matches')
    .select('home_team, away_team, venue, date')
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true })
    .limit(1)
    .single()

  if (!data) return { homeTeam: 'FC Andorra', awayTeam: 'AD Ceuta FC', venue: 'Estadio de la FAF, Encamp', startDate: new Date().toISOString() }
  return {
    homeTeam: data.home_team,
    awayTeam: data.away_team,
    venue: data.venue ?? 'Por confirmar',
    startDate: new Date(data.date).toISOString(),
  }
}

const CEUTA_LINEUP: LineupPlayer[] = [
  { name: 'Bernabé Barragán', jersey: '1',  position: 'GK', starter: true },
  { name: 'Javi Lara',        jersey: '2',  position: 'RB', starter: true },
  { name: 'Rafa Gálvez',      jersey: '5',  position: 'CB', starter: true },
  { name: 'Álex Leal',        jersey: '4',  position: 'CB', starter: true },
  { name: 'Manu Sánchez',     jersey: '3',  position: 'LB', starter: true },
  { name: 'Zalazar',          jersey: '8',  position: 'CM', starter: true },
  { name: 'Hassan',           jersey: '6',  position: 'CM', starter: true },
  { name: 'Aarón Escandell',  jersey: '10', position: 'AM', starter: true },
  { name: 'Marín',            jersey: '7',  position: 'RW', starter: true },
  { name: 'Moussa',           jersey: '11', position: 'LW', starter: true },
  { name: 'Nené',             jersey: '9',  position: 'ST', starter: true },
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
    ...BASE,
    state: 'in',
    clock: "67'",
    awayScore: 1,
    events: [{ type: 'goal', minute: "67'", team: 'away', playerName: 'Zalazar' }],
  },
  live_goal_rival: {
    ...BASE,
    state: 'in',
    clock: "34'",
    homeScore: 1,
    events: [{ type: 'goal', minute: "34'", team: 'home', playerName: 'Molina' }],
  },
  live_events: {
    ...BASE,
    state: 'in',
    clock: "78'",
    homeScore: 1,
    awayScore: 2,
    events: [
      { type: 'goal', minute: "12'", team: 'away', playerName: 'Zalazar' },
      { type: 'yellowCard', minute: "28'", team: 'home', playerName: 'García' },
      { type: 'goal', minute: "45'", team: 'home', playerName: 'Molina' },
      { type: 'redCard', minute: "61'", team: 'home', playerName: 'Torres' },
      { type: 'goal', minute: "74'", team: 'away', playerName: 'Hassan' },
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
