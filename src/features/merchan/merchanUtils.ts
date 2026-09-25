// Los nombres de producto de la tienda vienen como "Camiseta primera
// equipación AD Ceuta FC 26/27" — se recorta el sufijo de club+temporada
// para la tarjeta, sea cual sea la temporada (26/27, 2026/27, 2026/2027…)
// para que no haya que tocar esto cada verano.
export function shortenProductName(name: string): string {
  return name.replace(/ AD Ceuta FC (20)?\d{2}\/\d{2,4}/g, '')
}
