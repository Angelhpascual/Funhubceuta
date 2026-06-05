export function BarChart({ data, color = '#D62027' }: { data: { label: string; value: number }[]; color?: string }) {
  if (data.length === 0) return <p style={{ color: '#6E6E6E', fontSize: 12 }}>Sin datos aún</p>
  const max = Math.max(...data.map(d => d.value), 1)
  const W = 320, H = 80, barW = Math.floor((W - (data.length - 1) * 2) / data.length)

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 20}`} style={{ overflow: 'visible' }}>
      {data.map((d, i) => {
        const h = Math.max(2, Math.round((d.value / max) * H))
        const x = i * (barW + 2)
        return (
          <g key={i}>
            <rect x={x} y={H - h} width={barW} height={h} fill={color} rx={2} opacity={0.85} />
            <text x={x + barW / 2} y={H + 14} textAnchor="middle" fontSize={8} fill="#6E6E6E">{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

export function LineChart({ data, color = '#D62027' }: { data: number[]; color?: string }) {
  if (data.length < 2) return <p style={{ color: '#6E6E6E', fontSize: 12 }}>Sin datos suficientes aún</p>
  const W = 320, H = 60
  const max = Math.max(...data, 1)
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - (v / max) * H
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      {data.map((v, i) => (
        <circle key={i} cx={(i / (data.length - 1)) * W} cy={H - (v / max) * H} r={3} fill={color} />
      ))}
    </svg>
  )
}
