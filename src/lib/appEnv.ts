// 'production' solo en el deploy de main (VERCEL_ENV=production)
// 'development' en preview, local, y develop
// Función (no constante) para que lea process.env en cada llamada — necesario
// porque los tests mutan VERCEL_ENV en tiempo de ejecución entre casos.
export function getAppEnv(): 'production' | 'development' {
  return process.env.VERCEL_ENV === 'production' ? 'production' : 'development'
}
