import { Response, Request } from 'express'
import { AuthRequest, authenticateToken } from '../middleware/auth.js'
import { sendTelegramMessage } from '../services/telegramService.js'
import { prisma } from '../config/db.js'
import { pendingProfitForAdmin } from '../utils/telegramState.js'

export const requestProfit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id
    const { investmentId } = req.body

    const investment = await prisma.investment.findFirst({
      where: {
        userId,
        ...(investmentId ? { investmentId } : {}),
        status: { in: ['PAYMENT_RECEIVED', 'ACTIVE_TRADE'] },
      },
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    })
    if (!investment) {
      res.status(404).json({ success: false, message: 'No active investment found for profit tracking' })
      return
    }

    const userName = `${investment.user.firstName} ${investment.user.lastName}`
    const message = `Profit Request\n\nUser: ${userName}\nEmail: ${investment.user.email}\nInvestment: ${investment.investmentId}\nAmount: $${investment.depositAmount}\n\nPlease reply with profit in format:\n$1200`

    await pendingProfitForAdmin.set({
      userId,
      id: investment.id,
      investmentId: investment.investmentId,
    })

    await prisma.investment.update({
      where: { id: investment.id },
      data: {
        profitTrackingRequestedAt: new Date(),
        profitActionRequiredAt: null,
      },
    })

    await sendTelegramMessage(message)
    res.json({ success: true, message: 'Profit request sent to admin' })
  } catch (error) {
    console.error('Profit request error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

export const updateLatestProfit = async (req: Request, res: Response): Promise<void> => {
  const { profitAmount } = req.body as { profitAmount: number }
  const botSecret = req.headers['x-bot-secret'] as string
  const expectedSecret = process.env.BOT_SECRET || 'ecocash_bot_secret_2024'

  if (botSecret !== expectedSecret) {
    res.status(401).json({ success: false, message: 'Unauthorized' })
    return
  }

  try {
    const latestInvestment = await prisma.investment.findFirst({
      where: { status: { in: ['PAYMENT_RECEIVED', 'ACTIVE_TRADE'] } },
      orderBy: { createdAt: 'desc' },
    })

    if (!latestInvestment) {
      res.status(404).json({ success: false, message: 'No active investments found' })
      return
    }

    const currentBalance = Number(latestInvestment.currentBalance || latestInvestment.depositAmount || 0)
    const depositAmount = Number(latestInvestment.depositAmount || currentBalance)
    const newBalance = currentBalance + profitAmount
    const calculatedPercentage = profitAmount / depositAmount * 100

    const updated = await prisma.investment.update({
      where: { id: latestInvestment.id },
      data: {
        currentBalance: newBalance,
        profitAmount: profitAmount,
        profitPercentage: calculatedPercentage,
      },
      include: { user: true },
    })

    res.status(200).json({ success: true, data: updated })
  } catch (error: any) {
    console.error('Update latest profit error:', error)
    res.status(500).json({ success: false, message: error.message || 'Server error' })
  }
}
