function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export const MSG = {
  kickoff: (rival: string) =>
    pick([
      {
        title: '⚽ ¡Arranca el partido, caballas!',
        body: `AD Ceuta vs ${rival}. 90 minutos de corazón blanquinegro. ¡Vamos! 🖤⚪`,
      },
      {
        title: '🔴 ¡Ya rueda el balón!',
        body: `Ceuta frente al ${rival}. El Murube late. ¡Esto empieza! 🖤⚪🔥`,
      },
      {
        title: '⚽ ¡En marcha, caballas!',
        body: `Hoy toca pelear contra el ${rival}. ¡La afición empuja desde casa! 🖤⚪`,
      },
      {
        title: '🏟️ ¡Comienza el partido!',
        body: `AD Ceuta sale al campo ante el ${rival}. ¡Dalo todo, Ceuta! 💪🖤⚪`,
      },
    ]),

  goalCeuta: (scorer: string, score: string, minute: string) =>
    pick([
      {
        title: '🚨 ¡¡GOOOOOL DE CEUTA!! 🔥',
        body: `¡${scorer}! ¡Qué locura! Marcador: ${score} (${minute}) ¡VAMOS CABALLAS! 🖤⚪`,
      },
      {
        title: '⚽🖤⚪ ¡GOL DEL CEUTA!',
        body: `¡Marca ${scorer}! ${score} — ¡La ciudad entera explota! 🔥🔥🔥`,
      },
      {
        title: '🔴 ¡¡GOOOL!! ¡El Ceuta marca!',
        body: `${scorer} no perdona. ${score} en el ${minute}. ¡Arriba los Caballas! 🖤⚪💥`,
      },
      {
        title: '💥 ¡GOLAZO BLANQUINEGRO!',
        body: `${scorer} mete el ${score} en el ${minute}. ¡El Murube revienta! 🖤⚪🔥`,
      },
    ]),

  goalRival: (scorer: string, score: string) =>
    pick([
      {
        title: `😤 Gol en contra... (${score})`,
        body: `Nos han marcado${scorer ? ` ${scorer}` : ''}. Pero esto no ha terminado. ¡A por ellos! 💪`,
      },
      {
        title: `😠 ${score} — Gol del rival`,
        body: `${scorer ? `${scorer} nos adelanta` : 'Gol en contra'}. ¡Queda partido, caballas! 🖤⚪`,
      },
      {
        title: `⚠️ Gol en contra (${score})`,
        body: `Golpe, pero no es el final. El Ceuta se crecerá. ¡Ánimo! 🖤⚪💪`,
      },
      {
        title: `😤 Nos marcan... (${score})`,
        body: `${scorer ? `${scorer} anota` : 'Gol rival'}. El Ceuta no se rinde nunca. ¡A remontarlo! 🔥`,
      },
    ]),

  redCeuta: (player: string, minute: string) =>
    pick([
      {
        title: '🟥 Nos quedamos con 10...',
        body: `Roja para ${player} en el ${minute}. Ahora más unidos que nunca. ¡El Ceuta no se rinde! 🖤⚪`,
      },
      {
        title: `🟥 Expulsado ${player} (${minute})`,
        body: `Con 10, pero con más corazón que nunca. ¡Vamos Ceuta! 🖤⚪💪`,
      },
      {
        title: '🟥 Roja en el Ceuta...',
        body: `${player} se va al vestuario en el ${minute}. 10 guerreros quedan en el campo. ¡A defenderlo! 🖤⚪`,
      },
    ]),

  redRival: (player: string, minute: string) =>
    pick([
      {
        title: '🟥 ¡Roja para el rival!',
        body: `Expulsado ${player} (${minute}). ¡Con uno más, a aprovechar! Vamos Ceuta 💪🔥`,
      },
      {
        title: `🟥 ¡Se queda con 10 el rival!`,
        body: `${player} ve la roja en el ${minute}. ¡Momento de atacar, caballas! 🖤⚪🔥`,
      },
      {
        title: '🟥 ¡Superioridad numérica!',
        body: `Fuera ${player} (${minute}). ¡Ahora hay que aprovechar! ¡Vamos Ceuta! 💥🖤⚪`,
      },
    ]),

  winCeuta: (score: string) =>
    pick([
      {
        title: `🏆 ¡¡VICTORIA CABALLAS!! (${score})`,
        body: `¡Lo hemos conseguido! Tres puntos de oro. ¡Gracias por estar siempre con nosotros! 🖤⚪🔥`,
      },
      {
        title: `🏆 ¡Tres puntos! (${score})`,
        body: `¡Partido fantástico! El Ceuta gana y sigue adelante. ¡Arriba los caballas! 🖤⚪💪`,
      },
      {
        title: `⚽ ¡Ganamoooos! (${score})`,
        body: `¡Qué tarde tan grande! Tres puntos que saben a gloria. ¡Hasta la siguiente, caballas! 🔥🖤⚪`,
      },
      {
        title: `🖤⚪ ¡Victoria del Ceuta! (${score})`,
        body: `¡Enorme trabajo del equipo! Puntos en el bolsillo. ¡La ciudad está de fiesta! 🎉`,
      },
    ]),

  lossCeuta: (score: string) =>
    pick([
      {
        title: `😔 Derrota... pero seguimos juntos (${score})`,
        body: `No era el día. Esto es el fútbol. El Ceuta siempre se levanta. ¡Gracias por el apoyo! 🖤⚪`,
      },
      {
        title: `😞 No pudo ser (${score})`,
        body: `Derrota dura, pero el equipo lo ha intentado. ¡Seguimos, caballas! 🖤⚪💪`,
      },
      {
        title: `⚫ Derrota (${score})`,
        body: `Un mal resultado que olvidar. El Ceuta se levantará. ¡La afición siempre está ahí! 🖤⚪`,
      },
    ]),

  drawCeuta: (score: string) =>
    pick([
      {
        title: `🤝 Empate final (${score})`,
        body: `Un punto que suma. El equipo lo ha dado todo. ¡Gracias caballas! 🖤⚪`,
      },
      {
        title: `➖ Tablas (${score})`,
        body: `Se reparte el botín. El Ceuta no se rindió. ¡Un punto es un punto! 🖤⚪`,
      },
      {
        title: `🤝 Empate justo (${score})`,
        body: `Ni para unos ni para otros. El Ceuta peleó hasta el final. ¡Gracias afición! 🖤⚪`,
      },
    ]),

  matchDay: (rival: string, time: string | null, isHome: boolean) =>
    pick([
      {
        title: '📅 ¡Hoy jugamos, caballas!',
        body: `AD Ceuta vs ${rival}${time ? ` a las ${time}` : ''}. ${isHome ? '🏠 En casa' : '✈️ Fuera'}. ¡A por los tres puntos! 🖤⚪`,
      },
      {
        title: '⚽ ¡Día de partido!',
        body: `Hoy frente al ${rival}${time ? ` (${time})` : ''}. ${isHome ? 'El Murube estará con vosotros' : 'Vamos a por ello fuera de casa'}. ¡Vamos Ceuta! 🖤⚪🔥`,
      },
      {
        title: `🖤⚪ Esta tarde, Ceuta vs ${rival}`,
        body: `${time ? `Arranca a las ${time}. ` : ''}${isHome ? '¡El Murube como fortín!' : '¡A ganar lejos de casa!'} ¡Ánimo caballas! 💪`,
      },
      {
        title: '🏟️ ¡Jornada de fútbol!',
        body: `AD Ceuta se mide al ${rival}${time ? ` a las ${time}` : ''}. ¡La ciudad entera apoya! 🖤⚪`,
      },
    ]),
}
