// 'production' solo en el deploy de main (VERCEL_ENV=production)
// 'development' en preview, local, y develop
export const APP_ENV: 'production' | 'development' =
  process.env.VERCEL_ENV === 'production' ? 'production' : 'development'
