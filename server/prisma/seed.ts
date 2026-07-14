import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ecocashinvestment.com' },
    update: {},
    create: {
      email: 'admin@ecocashinvestment.com',
      password: '$2a$10$KIXxqweKXjWqJQXe7PqNiuD1y7zT8X4Q8N6Z9L3T3O1aO0A0A0A0A0A0Aa',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isVerified: true,
      isActive: true,
    },
  })

  const investor = await prisma.user.upsert({
    where: { email: 'investor@example.com' },
    update: {},
    create: {
      email: 'investor@example.com',
      password: '$2a$10$KIXxqweKXjWqJQXe7PqNiuD1y7zT8X4Q8N6Z9L3T3O1aO0A0A0A0A0A0Aa',
      firstName: 'John',
      lastName: 'Doe',
      phone: '0712345678',
      role: 'INVESTOR',
      isVerified: true,
      isActive: true,
    },
  })

  await prisma.investmentPlan.createMany({
    data: [
      { name: 'Starter', slug: 'starter', description: 'Perfect for first-time investors.', minAmount: 100, maxAmount: 199, returnMultiplier: 5, tradeDurationHours: 6, isActive: true, sortOrder: 1 },
      { name: 'Basic', slug: 'basic', description: 'Entry-level investment with solid returns.', minAmount: 200, maxAmount: 299, returnMultiplier: 5, tradeDurationHours: 6, isActive: true, sortOrder: 2 },
      { name: 'Silver', slug: 'silver', description: 'Accelerate your earnings.', minAmount: 300, maxAmount: 399, returnMultiplier: 5, tradeDurationHours: 6, isActive: true, sortOrder: 3 },
      { name: 'Gold', slug: 'gold', description: 'For serious investors.', minAmount: 400, maxAmount: 499, returnMultiplier: 5, tradeDurationHours: 6, isActive: true, sortOrder: 4 },
      { name: 'VIP', slug: 'vip', description: 'High-yield investment.', minAmount: 500, maxAmount: 1999, returnMultiplier: 5, tradeDurationHours: 6, isActive: true, sortOrder: 5 },
      { name: 'Platinum', slug: 'platinum', description: 'Maximum profit.', minAmount: 2000, maxAmount: null, returnMultiplier: 5, tradeDurationHours: 6, isActive: true, sortOrder: 6 },
    ],
    skipDuplicates: true,
  })

  console.log('Admin:', admin.email)
  console.log('Investor:', investor.email)
  console.log('Plans seeded successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
