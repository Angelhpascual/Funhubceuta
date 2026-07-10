export interface StaffMember {
  id: string
  name: string
  role: string
  photo: string
}

export const STAFF: StaffMember[] = [
  {
    id: 'staff-1',
    name: 'José Juan Romero',
    role: 'Entrenador',
    photo: 'https://assets.laliga.com/squad/2025/t14705/man53081/512x512/man53081_t14705_2025_1_003_000.png',
  },
  {
    id: 'staff-2',
    name: 'Antonio José Sánchez',
    role: 'Segundo entrenador',
    photo: 'https://assets.laliga.com/squad/2025/t14705/man67065/512x512/man67065_t14705_2025_1_003_000.png',
  },
]
