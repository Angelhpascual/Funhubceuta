export const SOURCES: Record<string, { label: string; domain: string }> = {
  oficial: { label: 'AD Ceuta FC', domain: 'adceutafc.com' },
  elpueblo: { label: 'El Pueblo de Ceuta', domain: 'elpueblodeceuta.es' },
  faro: { label: 'El Faro de Ceuta', domain: 'elfarodeceuta.es' },
  teleceuta: { label: 'Teleceuta', domain: 'teleceuta.com' },
  ceutatv: { label: 'Ceuta Televisión', domain: 'ceutatv.com' },
  rtvc: { label: 'RTV Ceuta', domain: 'rtvce.es' },
  laverdad: { label: 'La Verdad de Ceuta', domain: 'laverdaddeceuta.com' },
  ceutaactualidad: { label: 'Ceuta Actualidad', domain: 'ceutaactualidad.com' },
  ceutaaldia: { label: 'Ceuta al Día', domain: 'ceutaldia.com' },
  marca: { label: 'Marca', domain: 'marca.com' },
  mundodeportivo: { label: 'Mundo Deportivo', domain: 'mundodeportivo.com' },
  '20minutos': { label: '20 Minutos', domain: '20minutos.es' },
  sport: { label: 'Sport', domain: 'sport.es' },
  as: { label: 'AS', domain: 'as.com' },
  confidencial: { label: 'El Confidencial', domain: 'elconfidencial.com' },
  abc: { label: 'ABC', domain: 'abc.es' },
  lavanguardia: { label: 'La Vanguardia', domain: 'lavanguardia.com' },
  cope: { label: 'COPE', domain: 'cope.es' },
  ser: { label: 'Cadena SER', domain: 'cadenaser.com' },
  onefootball: { label: 'OneFootball', domain: 'onefootball.com' },
  elpais: { label: 'El País', domain: 'elpais.com' },
  rtve: { label: 'RTVE', domain: 'rtve.es' },
  goal: { label: 'Goal.com', domain: 'goal.com' },
  elgoldigital: { label: 'El Gol Digital', domain: 'elgoldigital.com' },
  fondosegunda: { label: 'Fondo Segunda', domain: 'fondosegunda.com' },
  transfermarkt: { label: 'Transfermarkt', domain: 'transfermarkt.es' },
  ceutadeportiva: { label: 'Ceuta Deportiva', domain: 'ceutadeportiva.com' },
  prensa: { label: 'Prensa', domain: 'google.com' },
}

export function SourceTag({ source }: { source: string }) {
  const s = SOURCES[source]
  if (!s) {
    return (
      <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-ceuta-red">
        {source}
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-ceuta-red">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/proxy/favicon?domain=${s.domain}`}
        alt=""
        width={12}
        height={12}
        loading="lazy"
        decoding="async"
        className="rounded-[2px]"
      />
      {s.label}
    </span>
  )
}
