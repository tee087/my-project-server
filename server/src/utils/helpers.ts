export const generateVerificationToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export const generateResetToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
}

export const generateInvestmentId = (): string => {
  return 'INV-' + Math.random().toString(36).substring(2, 10).toUpperCase()
}

export const generateDepositId = (): string => {
  return 'DEP-' + Math.random().toString(36).substring(2, 10).toUpperCase()
}

export const generateWithdrawalId = (): string => {
  return 'WTH-' + Math.random().toString(36).substring(2, 10).toUpperCase()
}

export const formatCurrency = (amount: number | string | bigint): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(amount))
}

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
