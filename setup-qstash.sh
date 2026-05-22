#!/bin/bash
# Lee el token de .env.local
TOKEN=$(grep 'QSTASH_TOKEN=' .env.local | cut -d'=' -f2 | tr -d '"')
BASE="https://funhubceuta.vercel.app"

echo "Token: ${TOKEN:0:10}..."
echo "Creando schedules en QStash..."

# Noticias 3x/día (8h, 14h, 20h hora española)
echo -n "Noticias: "
curl -s -X POST "https://qstash.upstash.io/v2/schedules" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"destination\":\"$BASE/api/cron/news\",\"cron\":\"0 7,13,19 * * *\"}" | grep -o '"scheduleId":"[^"]*"'

# Partidos cada lunes
echo -n "Partidos: "
curl -s -X POST "https://qstash.upstash.io/v2/schedules" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"destination\":\"$BASE/api/cron/matches\",\"cron\":\"0 8 * * 1\"}" | grep -o '"scheduleId":"[^"]*"'

# Plantilla cada lunes
echo -n "Plantilla: "
curl -s -X POST "https://qstash.upstash.io/v2/schedules" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"destination\":\"$BASE/api/cron/squad\",\"cron\":\"30 8 * * 1\"}" | grep -o '"scheduleId":"[^"]*"'

# Live match cada minuto
echo -n "Live: "
curl -s -X POST "https://qstash.upstash.io/v2/schedules" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"destination\":\"$BASE/api/cron/live\",\"cron\":\"* * * * *\"}" | grep -o '"scheduleId":"[^"]*"'

echo ""
echo "Listo."
