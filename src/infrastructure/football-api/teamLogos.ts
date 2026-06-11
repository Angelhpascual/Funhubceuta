export const TEAM_LOGOS: Record<string, string> = {
  'Albacete BP': 'https://r2.thesportsdb.com/images/media/team/badge/17oqja1616436316.png',
  'UD Almería': 'https://r2.thesportsdb.com/images/media/team/badge/yswsww1473503818.png',
  'Burgos CF': 'https://r2.thesportsdb.com/images/media/team/badge/79h3ul1708150894.png',
  'Cádiz CF': 'https://r2.thesportsdb.com/images/media/team/badge/e2phzp1639408503.png',
  'CD Castellón': 'https://r2.thesportsdb.com/images/media/team/badge/ywibjw1733456820.png',
  'AD Ceuta FC': 'https://r2.thesportsdb.com/images/media/team/badge/ja7sl51677475273.png',
  'Córdoba CF': 'https://r2.thesportsdb.com/images/media/team/badge/ttyyvy1473503827.png',
  'Cultural y Deportiva Leonesa':
    'https://r2.thesportsdb.com/images/media/team/badge/yk28a51677472494.png',
  'RC Deportivo': 'https://r2.thesportsdb.com/images/media/team/badge/wtssuy1473502941.png',
  'SD Eibar': 'https://r2.thesportsdb.com/images/media/team/badge/hccive1680933599.png',
  'FC Andorra': 'https://r2.thesportsdb.com/images/media/team/badge/eyaka21639481902.png',
  'Granada CF': 'https://r2.thesportsdb.com/images/media/team/badge/f9iss11677472689.png',
  'SD Huesca': 'https://r2.thesportsdb.com/images/media/team/badge/tuxusx1447590509.png',
  'UD Las Palmas': 'https://r2.thesportsdb.com/images/media/team/badge/mmhyb11616443601.png',
  'CD Leganés': 'https://r2.thesportsdb.com/images/media/team/badge/tm0adr1616443898.png',
  'Málaga CF': 'https://r2.thesportsdb.com/images/media/team/badge/upqyvr1473502952.png',
  'CD Mirandés': 'https://r2.thesportsdb.com/images/media/team/badge/xjeaa21625677345.png',
  'R. Racing Club': 'https://r2.thesportsdb.com/images/media/team/badge/97kkiq1536575158.png',
  'R. Sociedad B': 'https://r2.thesportsdb.com/images/media/team/badge/hliq4n1579632023.png',
  'Real Valladolid CF': 'https://r2.thesportsdb.com/images/media/team/badge/bnhu8b1719983736.png',
  'Real Zaragoza': 'https://r2.thesportsdb.com/images/media/team/badge/sxpwxs1473503702.png',
  'Real Sporting': 'https://r2.thesportsdb.com/images/media/team/badge/xxrtqx1473503054.png',
}

export function getTeamLogo(teamName: string): string | null {
  return TEAM_LOGOS[teamName] ?? null
}
