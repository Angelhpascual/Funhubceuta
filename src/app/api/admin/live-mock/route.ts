import { NextResponse } from 'next/server'
import { setConfig, deleteConfig } from '@/infrastructure/supabase/AppConfigRepository'
import type { LiveMatch, LineupPlayer } from '@/domain/match/LiveMatch'

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

const BASE: LiveMatch = {
  espnId: 'mock-001',
  homeTeam: 'FC Andorra',
  awayTeam: 'AD Ceuta FC',
  homeScore: 0,
  awayScore: 0,
  events: [],
  venue: 'Estadio de la FAF, Encamp',
  startDate: new Date().toISOString(),
  clock: '',
  status: '',
  state: 'pre',
}

const SCENARIOS: Record<string, LiveMatch> = {
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

export async function POST(req: Request) {
  const { scenario } = await req.json()

  if (scenario === 'clear') {
    await deleteConfig('live_match_mock')
    return NextResponse.json({ ok: true, cleared: true })
  }

  const mock = SCENARIOS[scenario]
  if (!mock) return NextResponse.json({ error: 'Unknown scenario' }, { status: 400 })

  await setConfig('live_match_mock', JSON.stringify(mock))
  return NextResponse.json({ ok: true, scenario, match: mock })
}
