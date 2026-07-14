import { Router } from 'express'
import { getWithdrawals, createWithdrawal, approveWithdrawal, rejectWithdrawal, submitOTP } from '../controllers/withdrawalController.js'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.use(authenticateToken)

router.get('/', getWithdrawals)
router.post('/', createWithdrawal)
router.put('/:id/otp', submitOTP)
router.put('/:id/approve', requireAdmin, approveWithdrawal)
router.put('/:id/reject', requireAdmin, rejectWithdrawal)

export default router
