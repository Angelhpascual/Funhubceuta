// Shared accent-stripping helper. Several team/player name-matching utilities
// need this exact transform (compare "Cádiz" and "Cadiz" as equal); a previous
// bug had this same regex duplicated — and broken — in five different files.
export function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '')
}
