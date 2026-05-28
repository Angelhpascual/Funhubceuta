#!/bin/bash
cd "$(dirname "$0")/.."

echo "🚀 Arrancando servidor..."
pnpm dev &> /tmp/funhub-sync.log &
SERVER_PID=$!

# Esperar hasta que el servidor responda
for i in $(seq 1 30); do
  sleep 1
  if curl -s http://localhost:3000/api/standings > /dev/null 2>&1; then
    echo "✅ Servidor listo"
    break
  fi
done

echo "🔄 Sincronizando datos..."
RESULT=$(curl -s http://localhost:3000/api/sync)
echo "$RESULT" | python3 -m json.tool 2>/dev/null || echo "$RESULT"

echo "🛑 Cerrando servidor..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

echo "✅ Sync completado"
