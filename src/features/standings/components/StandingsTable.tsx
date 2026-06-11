'use client'

import { StandingEntry } from '@/domain/standings/Standings'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { FormPill } from '@/components/ui/FormPill'

interface Props {
  entries: StandingEntry[]
}

const AD_CEUTA_NAME = 'AD Ceuta'

function getDescriptionVariant(description: string | null) {
  if (!description) return null
  if (
    description.toLowerCase().includes('promotion') &&
    !description.toLowerCase().includes('playoff')
  )
    return 'default'
  if (description.toLowerCase().includes('playoff')) return 'secondary'
  if (description.toLowerCase().includes('relegat')) return 'destructive'
  return null
}

export function StandingsTable({ entries }: Props) {
  return (
    <div className="rounded-lg border border-gray-800 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#003087] hover:bg-[#003087]">
            <TableHead className="text-white w-10 text-center">#</TableHead>
            <TableHead className="text-white">Equipo</TableHead>
            <TableHead className="text-white text-center">PJ</TableHead>
            <TableHead className="text-white text-center">G</TableHead>
            <TableHead className="text-white text-center">E</TableHead>
            <TableHead className="text-white text-center">P</TableHead>
            <TableHead className="text-white text-center">GF</TableHead>
            <TableHead className="text-white text-center">GC</TableHead>
            <TableHead className="text-white text-center">DG</TableHead>
            <TableHead className="text-white text-center">Pts</TableHead>
            <TableHead className="text-white text-center hidden md:table-cell">Forma</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const isCeuta =
              entry.teamName.includes(AD_CEUTA_NAME) || entry.teamName.includes('Ceuta')
            const variant = getDescriptionVariant(entry.description)

            return (
              <TableRow
                key={entry.id ?? entry.externalId}
                className={isCeuta ? 'bg-[#003087]/20 font-semibold' : 'hover:bg-gray-900'}
              >
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    {variant && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${variant === 'default' ? 'bg-green-500' : variant === 'secondary' ? 'bg-yellow-500' : 'bg-red-500'}`}
                      />
                    )}
                    {entry.position}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {entry.teamLogo && (
                      <Image
                        src={entry.teamLogo}
                        alt={entry.teamName}
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                    )}
                    <span className={isCeuta ? 'text-[#4a90d9]' : ''}>{entry.teamName}</span>
                    {isCeuta && (
                      <Badge variant="outline" className="text-xs border-[#4a90d9] text-[#4a90d9]">
                        Nosotros
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">{entry.played}</TableCell>
                <TableCell className="text-center">{entry.won}</TableCell>
                <TableCell className="text-center">{entry.drawn}</TableCell>
                <TableCell className="text-center">{entry.lost}</TableCell>
                <TableCell className="text-center">{entry.goalsFor}</TableCell>
                <TableCell className="text-center">{entry.goalsAgainst}</TableCell>
                <TableCell className="text-center">
                  {entry.goalDifference > 0 ? `+${entry.goalDifference}` : entry.goalDifference}
                </TableCell>
                <TableCell className="text-center font-bold">{entry.points}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex gap-0.5 justify-center">
                    {entry.form?.split('').map((r, i) => (
                      <FormPill key={i} result={r} />
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
