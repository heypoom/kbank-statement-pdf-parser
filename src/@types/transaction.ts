export type TransactionType =
  | 'DIRECT_DEBIT'
  | 'DEBIT_CARD_SPENDING'
  | 'ERROR_CORRECTION'
  | 'TRANSFER_DEPOSIT'
  | 'PROMPTPAY_TRANSFER'
  | 'BANK_TRANSFER'
  | 'PAYROLL'
  | 'PAYMENT'
  | 'UNKNOWN'

export interface Transaction {
  type: TransactionType
  bank?: string
  payee?: string
  channel: string
  ref: string
  ref2?: string
  amount: number
  balance: number
  date: Date
}
