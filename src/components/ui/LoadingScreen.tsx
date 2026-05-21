export function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--white)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
    }}>
      <div style={{ position: 'relative', width: 120, height: 120 }}>

        {/* Circular spinner */}
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          style={{ position: 'absolute', inset: 0, animation: 'spin 1.4s linear infinite' }}
        >
          {/* Track */}
          <circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke="var(--bg-mid)"
            strokeWidth="4"
          />
          {/* Progress arc */}
          <circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke="var(--red)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="326"
            strokeDashoffset="245"
            style={{ transformOrigin: '60px 60px', animation: 'arc 1.4s ease-in-out infinite' }}
          />
        </svg>

        {/* Escudo centrado */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/escudo.png"
            alt="AD Ceuta"
            style={{ width: 68, height: 68, objectFit: 'contain' }}
          />
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(-90deg); }
          to   { transform: rotate(270deg); }
        }
        @keyframes arc {
          0%   { stroke-dashoffset: 310; }
          50%  { stroke-dashoffset: 80; }
          100% { stroke-dashoffset: 310; }
        }
      `}</style>
    </div>
  )
}
