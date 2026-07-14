import { SplitType } from './types'

export interface SplitInput {
  userId: string
  percentage?: number  // for percentage type
  exactAmount?: number // for exact type
}

export interface SplitResult {
  userId: string
  shareAmount: number
  shareType: SplitType
  sharePercentage: number | null
}

/**
 * Calculate split amounts for an expense
 */
export function calculateSplits(
  totalAmount: number,
  splitType: SplitType,
  participants: SplitInput[]
): SplitResult[] {
  if (participants.length === 0) return []

  switch (splitType) {
    case 'equal': {
      const perPerson = Math.floor(totalAmount / participants.length)
      const remainder = totalAmount - perPerson * participants.length

      return participants.map((p, index) => ({
        userId: p.userId,
        shareAmount: index === 0 ? perPerson + remainder : perPerson, // first person gets remainder
        shareType: 'equal',
        sharePercentage: null,
      }))
    }

    case 'percentage': {
      const total = participants.reduce((sum, p) => sum + (p.percentage ?? 0), 0)
      if (Math.abs(total - 100) > 0.01) {
        throw new Error(`Persentase harus total 100%, saat ini: ${total}%`)
      }

      const amounts = participants.map(p => ({
        userId: p.userId,
        shareAmount: Math.floor(totalAmount * (p.percentage ?? 0) / 100),
        shareType: 'percentage' as SplitType,
        sharePercentage: p.percentage ?? 0,
      }))

      // Distribute rounding remainder to first participant
      const totalCalculated = amounts.reduce((sum, a) => sum + a.shareAmount, 0)
      const diff = totalAmount - totalCalculated
      if (amounts.length > 0) amounts[0].shareAmount += diff

      return amounts
    }

    case 'exact': {
      const totalExact = participants.reduce((sum, p) => sum + (p.exactAmount ?? 0), 0)
      if (Math.abs(totalExact - totalAmount) > 1) {
        throw new Error(
          `Total pembagian (${totalExact}) tidak sesuai dengan total pengeluaran (${totalAmount})`
        )
      }

      return participants.map(p => ({
        userId: p.userId,
        shareAmount: p.exactAmount ?? 0,
        shareType: 'exact',
        sharePercentage: null,
      }))
    }
  }
}

/**
 * Validate split inputs before submitting
 */
export function validateSplits(
  totalAmount: number,
  splitType: SplitType,
  participants: SplitInput[]
): string | null {
  if (participants.length === 0) return 'Pilih minimal 1 anggota untuk split'

  if (splitType === 'percentage') {
    const total = participants.reduce((sum, p) => sum + (p.percentage ?? 0), 0)
    if (Math.abs(total - 100) > 0.01) {
      return `Persentase harus total 100% (saat ini ${total.toFixed(1)}%)`
    }
  }

  if (splitType === 'exact') {
    const total = participants.reduce((sum, p) => sum + (p.exactAmount ?? 0), 0)
    if (Math.abs(total - totalAmount) > 1) {
      return `Total nominal (${total.toLocaleString('id-ID')}) harus sama dengan jumlah pengeluaran (${totalAmount.toLocaleString('id-ID')})`
    }
  }

  return null
}
