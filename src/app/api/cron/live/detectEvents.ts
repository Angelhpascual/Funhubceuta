import type { LiveMatch, LiveEvent } from '@/domain/match/LiveMatch'

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
    const newEvents = match.events.slice(prev.eventCount)

    // When two goals from the same team land in a single poll window, each
    // needs its OWN scorer — `.pop()` on the full match.events list (the old
    // approach) ignores which goals are actually new this poll, so every
    // notification in the batch got attributed to whichever goal happened to
    // be last overall. Indexing into this poll's new goal events (falling
    // back to the latest new one if ESPN's keyEvents lag behind the score)
    // keeps each notification's scorer correct. The tag also now encodes the
    // score *after* that specific goal instead of the final score, so two
    // goals in one batch get distinct tags instead of colliding and getting
    // silently deduped by platforms that dedupe push notifications by tag.
    const newHomeGoalEvents = newEvents.filter((e: LiveEvent) => e.type === 'goal' && e.team === 'home')
    const newAwayGoalEvents = newEvents.filter((e: LiveEvent) => e.type === 'goal' && e.team === 'away')

    for (let i = 0; i < homeGoals; i++) {
      const ceutaScored = ceutaIsHome
      const scorer = newHomeGoalEvents[i] ?? newHomeGoalEvents[newHomeGoalEvents.length - 1]
      const scoreAfterThisGoal = `${prev.homeScore + i + 1}-${match.awayScore}`
      if (ceutaScored) {
        notifications.push({
          title: '🚨 ¡¡GOOOOOL DE CEUTA!! 🔥',
          body: `¡${scorer?.playerName ?? 'GOOOL'}! ¡Qué locura! Marcador: ${scoreAfterThisGoal} (${scorer?.minute ?? ''}) ¡VAMOS CABALLAS! 🖤⚪`,
          tag: `goal-home-${prev.homeScore + i + 1}`,
        })
      } else {
        notifications.push({
          title: `😤 Gol en contra... (${scoreAfterThisGoal})`,
          body: `Nos han marcado${scorer ? ` ${scorer.playerName}` : ''}. Pero esto no ha terminado. ¡A por ellos! 💪`,
          tag: `goal-home-${prev.homeScore + i + 1}`,
        })
      }
    }

    for (let i = 0; i < awayGoals; i++) {
      const ceutaScored = !ceutaIsHome
      const scorer = newAwayGoalEvents[i] ?? newAwayGoalEvents[newAwayGoalEvents.length - 1]
      const scoreAfterThisGoal = `${match.homeScore}-${prev.awayScore + i + 1}`
      if (ceutaScored) {
        notifications.push({
          title: '🚨 ¡¡GOOOOOL DE CEUTA!! 🔥',
          body: `¡${scorer?.playerName ?? 'GOOOL'}! ¡Qué locura! Marcador: ${scoreAfterThisGoal} (${scorer?.minute ?? ''}) ¡VAMOS CABALLAS! 🖤⚪`,
          tag: `goal-away-${prev.awayScore + i + 1}`,
        })
      } else {
        notifications.push({
          title: `😤 Gol en contra... (${scoreAfterThisGoal})`,
          body: `Nos han marcado${scorer ? ` ${scorer.playerName}` : ''}. Pero esto no ha terminado. ¡A por ellos! 💪`,
          tag: `goal-away-${prev.awayScore + i + 1}`,
        })
      }
    }

    // Red cards
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
