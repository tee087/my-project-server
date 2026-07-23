import { Router } from 'express'
import { requestProfit, updateLatestProfit, getUnreadNotifications, getMarketNews, markNotificationsRead } from '../controllers/notificationController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticateToken, getUnreadNotifications)
router.get('/market-news', authenticateToken, getMarketNews)
router.post('/profit-request', authenticateToken, requestProfit)
router.post('/mark-read', authenticateToken, markNotificationsRead)

// Bot endpoint (no auth middleware - uses x-bot-secret header)
router.put('/update-latest-profit', updateLatestProfit)

export default router
