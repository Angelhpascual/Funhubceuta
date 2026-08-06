// Equipos La Liga Hypermotion 26/27 — nombres exactos de ESPN/standings + IDs verificados
const espn = (id: number) => `https://a.espncdn.com/i/teamlogos/soccer/500/${id}.png`

export const TEAMS_2627: { name: string; logo: string | null }[] = [
  { name: 'Albacete',        logo: espn(2737)  },
  { name: 'Almería',         logo: espn(6832)  },
  { name: 'Burgos',          logo: espn(12597) },
  { name: 'Cádiz',           logo: espn(3842)  },
  { name: 'Castellón',       logo: espn(4438)  },
  { name: 'RC Celta Fortuna',logo: '/logos/celtafortuna.webp' },
  { name: 'Córdoba',         logo: espn(8447)  },
  { name: 'Eibar',           logo: espn(3752)  },
  { name: 'Eldense',         logo: espn(7320)  },
  { name: 'FC Andorra',      logo: espn(20179) },
  { name: 'Girona',          logo: espn(9812)  },
  { name: 'Granada',         logo: espn(3747)  },
  { name: 'Las Palmas',      logo: espn(98)    },
  { name: 'Leganés',         logo: espn(17534) },
  { name: 'Mallorca',        logo: espn(84)    },
  { name: 'Real Oviedo',     logo: espn(92)    },
  { name: 'Real Sociedad II',logo: espn(20983) },
  { name: 'Real Valladolid', logo: espn(95)    },
  { name: 'CD Sabadell',     logo: espn(11487) },
  { name: 'Sporting Gijón',  logo: espn(3788)  },
  { name: 'Tenerife',        logo: espn(245)   },
]
