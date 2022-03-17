export type ParseErrorType =
  | 'LINE'
  | 'REF_CODE'
  | 'TRANSFER'
  | 'DEPOSIT'
  | 'UNKNOWN'
  | 'PAYMENT'
  | 'PAYMENT_AMOUNT_MISSING'
  | 'PAYMENT_PAYEE_MISSING'
  | 'PAYROLL'

export interface ParseError {
  error: ParseErrorType
  line: string
}
