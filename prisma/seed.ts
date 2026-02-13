import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEFAULT_CATEGORIES = [
  { id: 'work', name: 'Trabalho', color: '#3b82f6', isDefault: true },
  { id: 'personal', name: 'Pessoal', color: '#10b981', isDefault: true },
  { id: 'study', name: 'Estudos', color: '#8b5cf6', isDefault: true },
  { id: 'meeting', name: 'Reuniao', color: '#f59e0b', isDefault: true },
]

async function main() {
  console.log('Seeding default categories...')

  for (const category of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: {},
      create: category,
    })
  }

  console.log(`Seed completed: ${DEFAULT_CATEGORIES.length} default categories created.`)
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
