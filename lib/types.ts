// Database types matching Supabase schema

export interface Profile {
  id: string
  name: string
  email: string | null
  avatar_url: string | null
  created_at: string
}

export interface Trip {
  id: string
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  created_by: string | null
  invite_code: string
  status: 'active' | 'settled'
  created_at: string
  updated_at: string
}

export interface TripMember {
  trip_id: string
  user_id: string
  role: 'admin' | 'member'
  joined_at: string
  profile?: Profile
}

export type ExpenseCategory = 'food' | 'transport' | 'accommodation' | 'activity' | 'shopping' | 'other'
export type SplitType = 'equal' | 'percentage' | 'exact'

export interface Expense {
  id: string
  trip_id: string
  description: string
  amount: number
  paid_by: string
  category: ExpenseCategory
  date: string
  notes: string | null
  created_at: string
  updated_at: string
  // Joined
  payer?: Profile
  splits?: ExpenseSplit[]
}

export interface ExpenseSplit {
  id: string
  expense_id: string
  user_id: string
  share_amount: number
  share_type: SplitType
  share_percentage: number | null
  // Joined
  profile?: Profile
}

export interface Settlement {
  id: string
  trip_id: string
  from_user: string
  to_user: string
  amount: number
  notes: string | null
  settled_at: string
  // Joined
  from_profile?: Profile
  to_profile?: Profile
}

// Computed types
export interface NetBalance {
  userId: string
  name: string
  avatarUrl: string | null
  balance: number // positive = owed money, negative = owes money
}

export interface DebtTransaction {
  from: string
  fromName: string
  to: string
  toName: string
  amount: number
}

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food: 'Makan & Minum',
  transport: 'Transportasi',
  accommodation: 'Akomodasi',
  activity: 'Aktivitas',
  shopping: 'Belanja',
  other: 'Lainnya',
}

export const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  food: '🍜',
  transport: '🚗',
  accommodation: '🏨',
  activity: '🎡',
  shopping: '🛒',
  other: '💳',
}
