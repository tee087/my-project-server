import { kvGet, kvSet, kvDel } from './telegramKv.js'

type ProfitPending = { userId: string; id: string; investmentId: string }
type TradeAfterDepositPending = { depositId: string; investmentId: string }

export const pendingProfitForAdmin = {
  async set(value: ProfitPending): Promise<void> {
    await kvSet('pending_profit_request', JSON.stringify(value))
  },
  async get(): Promise<ProfitPending | undefined> {
    const raw = await kvGet('pending_profit_request')
    return raw ? (JSON.parse(raw) as ProfitPending) : undefined
  },
  async delete(): Promise<void> {
    await kvDel('pending_profit_request')
  },
}

export const pendingTradeAfterDeposit = {
  async set(value: TradeAfterDepositPending): Promise<void> {
    await kvSet('pending_trade_after_deposit', JSON.stringify(value))
  },
  async get(): Promise<TradeAfterDepositPending | undefined> {
    const raw = await kvGet('pending_trade_after_deposit')
    return raw ? (JSON.parse(raw) as TradeAfterDepositPending) : undefined
  },
  async delete(): Promise<void> {
    await kvDel('pending_trade_after_deposit')
  },
}
