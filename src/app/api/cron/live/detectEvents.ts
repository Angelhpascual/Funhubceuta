import type { LiveMatch, LiveEvent } from '@/app/api/live/route'

export interface MatchState {
  espnId: string
  homeScore: number
  awayScore: number
  state: string
  eventCount: number
  events?: import('@/app/api/live/route').LiveEvent[]
}

export interface PushNotification {
  title: string
  body: string
  tag: string
}

export function detectEvents(match: LiveMatch, prev: MatchState | null): PushNotification[] {
  const notifications: PushNotification[] = []
  const ceutaIsHome = match.homeTeam.toLowerCase().includes('ceuta')
  const rival = ceutaIsHome ? match.awayTeam : match.homeTeam
  const score = `${match.homeScore}-${match.awayScore}`

  // Match just started
  if ((!prev || prev.state === 'pre') && match.state === 'in') {
    notifications.push({
      title: '⚽ ¡Ya estamos en marcha, caballas!',
      body: `Hoy nos enfrentamos al ${rival}. 90 minutos de lucha. ¡Vamos Ceuta! 🖤⚪`,
      tag: 'kickoff',
    })
  }

  // Goals
  if (prev && match.state === 'in') {
    const homeGoals = match.homeScore - prev.homeScore
    const awayGoals = match.awayScore - prev.awayScore

    for (let i = 0; i < homeGoals; i++) {
      const ceutaScored = ceutaIsHome
      const scorer = match.events
        .filter((e: LiveEvent) => e.type === 'goal' && e.team === 'home')
        .pop()
      if (ceutaScored) {
        notifications.push({
          title: '🚨 ¡¡GOOOOOL DE CEUTA!! 🔥',
          body: `¡${scorer?.playerName ?? 'GOOOL'}! ¡Qué locura! Marcador: ${score} (${scorer?.minute ?? ''}) ¡VAMOS CABALLAS! 🖤⚪`,
          tag: `goal-home-${match.homeScore}`,
        })
      } else {
        notifications.push({
          title: `😤 Gol en contra... (${score})`,
          body: `Nos han marcado${scorer ? ` ${scorer.playerName}` : ''}. Pero esto no ha terminado. ¡A por ellos! 💪`,
          tag: `goal-home-${match.homeScore}`,
        })
      }
    }

    for (let i = 0; i < awayGoals; i++) {
      const ceutaScored = !ceutaIsHome
      const scorer = match.events
        .filter((e: LiveEvent) => e.type === 'goal' && e.team === 'away')
        .pop()
      if (ceutaScored) {
        notifications.push({
          title: '🚨 ¡¡GOOOOOL DE CEUTA!! 🔥',
          body: `¡${scorer?.playerName ?? 'GOOOL'}! ¡Qué locura! Marcador: ${score} (${scorer?.minute ?? ''}) ¡VAMOS CABALLAS! 🖤⚪`,
          tag: `goal-away-${match.awayScore}`,
        })
      } else {
        notifications.push({
          title: `😤 Gol en contra... (${score})`,
          body: `Nos han marcado${scorer ? ` ${scorer.playerName}` : ''}. Pero esto no ha terminado. ¡A por ellos! 💪`,
          tag: `goal-away-${match.awayScore}`,
        })
      }
    }

    // Red cards
    const newEvents = match.events.slice(prev.eventCount)
    const redCards = newEvents.filter((e: LiveEvent) => e.type === 'redCard')
    for (const card of redCards) {
      const isCeuta = card.team === (ceutaIsHome ? 'home' : 'away')
      if (isCeuta) {
        notifications.push({
          title: '🟥 Nos quedamos con 10...',
          body: `Roja para ${card.playerName} en el ${card.minute}. Ahora más unidos que nunca. ¡El Ceuta no se rinde! 🖤⚪`,
          tag: `red-${card.minute}`,
        })
      } else {
        notifications.push({
          title: '🟥 ¡Roja para el rival!',
          body: `Expulsado ${card.playerName} (${card.minute}). ¡Con uno más, a aprovechar! Vamos Ceuta 💪🔥`,
          tag: `red-${card.minute}`,
        })
      }
    }
  }

  // Match finished
  if (prev?.state === 'in' && match.state === 'post') {
    const ceutaScore = ceutaIsHome ? match.homeScore : match.awayScore
    const rivalScore = ceutaIsHome ? match.awayScore : match.homeScore

    if (ceutaScore > rivalScore) {
      notifications.push({
        title: `🏆 ¡¡VICTORIA CABALLAS!! (${score})`,
        body: '¡Lo hemos conseguido! Tres puntos de oro. Gracias por estar siempre con nosotros. ¡Hasta la siguiente! 🖤⚪🔥',
        tag: 'fulltime',
      })
    } else if (ceutaScore < rivalScore) {
      notifications.push({
        title: `😔 Derrota... pero seguimos juntos (${score})`,
        body: 'No era el día. Esto es el fútbol. Pero el Ceuta siempre se levanta. ¡Gracias por el apoyo! 🖤⚪',
        tag: 'fulltime',
      })
    } else {
      notifications.push({
        title: `🤝 Empate final (${score})`,
        body: 'Un punto que suma. El equipo lo ha dado todo. ¡Gracias caballas por el apoyo! 🖤⚪',
        tag: 'fulltime',
      })
    }
  }

  return notifications
}
