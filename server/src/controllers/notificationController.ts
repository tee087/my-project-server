import { Response, Request } from 'express'
import { AuthRequest, authenticateToken } from '../middleware/auth.js'
import { sendTelegramMessage } from '../services/telegramService.js'
import { prisma } from '../config/db.js'
import { pendingProfitForAdmin } from '../utils/telegramState.js'

type MarketNews = { title: string; link: string; source: string; publishedAt: string }
let marketNewsCache: { expiresAt: number; items: MarketNews[] } | null = null

const decodeXml = (value: string) => value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")

const NEWS_FEEDS = [
  'https://www.coindesk.com/arc/outboundfeeds/rss/',
  'https://cointelegraph.com/feed',
]

export const getMarketNews = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (marketNewsCache && marketNewsCache.expiresAt > Date.now()) {
      res.json({ success: true, data: marketNewsCache.items })
      return
    }
    
    const allItems: MarketNews[] = []
    for (const feedUrl of NEWS_FEEDS) {
      try {
        const response = await fetch(feedUrl)
        if (!response.ok) continue
        const xml = await response.text()
        const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 6).flatMap((match) => {
          const item = match[1]
          const field = (name: string) => decodeXml(item.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`))?.[1] || '')
          const title = field('title')
          const link = field('link')
          return title && link ? [{ title, link, source: field('source') || 'Crypto News', publishedAt: field('pubDate') }] : []
        })
        allItems.push(...items)
      } catch (e) {
        console.error(`Failed to fetch ${feedUrl}:`, e)
      }
    }
    
    const uniqueItems = allItems.slice(0, 10)
    marketNewsCache = { items: uniqueItems, expiresAt: Date.now() + 12 * 60 * 60 * 1000 }
    res.json({ success: true, data: uniqueItems })
  } catch (error) {
    console.error('Market news error:', error)
    res.status(502).json({ success: false, message: 'Unable to load market news right now.' })
  }
}

export const getUnreadNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        isRead: false,
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: notifications })
  } catch (error) {
    console.error('Get unread notifications error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

export const markNotificationsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id
    const { ids } = req.body as { ids?: string[] }
    if (ids && ids.length) {
      await prisma.notification.updateMany({ where: { id: { in: ids }, userId }, data: { isRead: true } })
    } else {
      // mark all unread as read
      await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } })
    }
    res.json({ success: true })
  } catch (error) {
    console.error('Mark notifications read error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

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
