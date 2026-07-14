import { NetBalance, DebtTransaction } from './types'

/**
 * Simplify debts using greedy algorithm (minimizes number of transactions)
 * Input: net balance per user (positive = owed money, negative = owes money)
 * Output: minimal list of transactions to settle all debts
 */
export function simplifyDebts(balances: NetBalance[]): DebtTransaction[] {
  const transactions: DebtTransaction[] = []

  // Separate creditors (balance > 0) and debtors (balance < 0)
  const creditors = balances
    .filter(b => b.balance > 0.01)
    .map(b => ({ ...b, remaining: b.balance }))
    .sort((a, b) => b.remaining - a.remaining)

  const debtors = balances
    .filter(b => b.balance < -0.01)
    .map(b => ({ ...b, remaining: Math.abs(b.balance) }))
    .sort((a, b) => b.remaining - a.remaining)

  let ci = 0
  let di = 0

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci]
    const debtor = debtors[di]

    const amount = Math.min(creditor.remaining, debtor.remaining)

    if (amount > 0.01) {
      transactions.push({
        from: debtor.userId,
        fromName: debtor.name,
        to: creditor.userId,
        toName: creditor.name,
        amount: Math.round(amount),
      })
    }

    creditor.remaining -= amount
    debtor.remaining -= amount

    if (creditor.remaining < 0.01) ci++
    if (debtor.remaining < 0.01) di++
  }

  return transactions
}

/**
 * Format Rupiah currency
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Parse rupiah string to number (removes "Rp", dots, spaces)
 */
export function parseRupiah(value: string): number {
  const cleaned = value.replace(/[^0-9]/g, '')
  return parseInt(cleaned, 10) || 0
}
