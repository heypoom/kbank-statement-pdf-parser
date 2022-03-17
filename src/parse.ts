import {DateTime} from 'luxon'

import {preprocessInput} from './preprocess'

import type {ParseError, ParseErrorType} from './@types/parse-error'
import type {Transaction, TransactionType} from './@types/transaction'

const dateFormat = 'yy-LL-dd hh:mm'

const parseDate = (
  YY: string,
  MM: string,
  DD: string,
  hh: string,
  mm: string
) => DateTime.fromFormat(`${YY}-${MM}-${DD} ${hh}:${mm}`, dateFormat).toJSDate()

const matcher =
  /(\d{2})-(\d{2})-(\d{2})(\d{2}):(\d{2})(\D+)(\d+,*\d+(?:\.\d+))(.*)/

const refcodeMatcher = /Ref Code ((?:ODD|EDC)\d{5})(\D+)(.*)/

const transferMatcher =
  /To (\w+\s)?(X\d{4})(?: PromptPay (X\d{4}))?(.*)Transfer Withdrawal(\d+,*\d+(?:\.\d+))/

const payrollMatcher =
  /KBANK PAYROLL Ref (\d{8})Transfer Deposit(\d+,*\d+(?:\.\d+))/

const depositMatcher =
  /From(\s\w+)? (X\d{4}) (.*)Transfer Deposit(\d+,*\d+(?:\.\d+))/

const paymentMatcher = /Paid for Ref (X[A-z\d]{4}) (.*)/
const paymentAmountMatcher = /(.*)Payment(\d+,*\d+(?:\.\d+))/

const parseCurrency = (input: string) => parseFloat(input.replace(/,/, ''))

const transactionMethodMap: Record<string, TransactionType> = {
  'Direct Debit': 'DIRECT_DEBIT',
  'Debit Card Spending': 'DEBIT_CARD_SPENDING',
  'Error Correction': 'ERROR_CORRECTION',
  'Transfer Deposit': 'TRANSFER_DEPOSIT',
}

export function parseStatement(input: string) {
  const lines = preprocessInput(input)

  const entries = lines
    .map((line): Transaction | ParseError | null => {
      const err = (error: ParseErrorType): ParseError => ({error, line})

      if (!/^\d/.test(line)) return null

      const lineMatches = line.match(matcher)
      if (!lineMatches) return err('LINE')

      const [_, DD, MM, YY, hh, mm, channel, balance, meta] = lineMatches

      const date = parseDate(YY, MM, DD, hh, mm)

      if (meta.startsWith('Ref Code')) {
        const refcodeMatches = refcodeMatcher.exec(meta)
        if (!refcodeMatches) return err('REF_CODE')

        const [_, ref, method, amount] = refcodeMatches
        const type = transactionMethodMap?.[method] ?? 'UNKNOWN'

        return {
          type,
          ref,
          date,
          channel,
          amount: parseCurrency(amount),
          balance: parseCurrency(balance),
        }
      }

      if (meta.startsWith('To')) {
        const transferMatches = transferMatcher.exec(meta)
        if (!transferMatches) return err('TRANSFER')

        let [_, method, ref, promptpayRef, payee, amount] = transferMatches

        payee = payee.replace(/\+\+/, '').trim()
        method = method?.trim()

        const isPromptPay = method === 'PromptPay' || promptpayRef

        return {
          type: isPromptPay ? 'PROMPTPAY_TRANSFER' : 'BANK_TRANSFER',
          ref,
          date,
          payee,
          channel,
          amount: parseCurrency(amount),
          balance: parseCurrency(balance),

          ...(method !== 'PromptPay' && {bank: method}),
          ...(promptpayRef && {ref2: promptpayRef}),
        }
      }

      if (meta.startsWith('From')) {
        const depositMatches = depositMatcher.exec(meta)
        if (!depositMatches) return err('DEPOSIT')

        let [_, bank, ref, payee, amount] = depositMatches

        payee = payee.replace(/\+\+/, '').trim()
        bank = bank?.trim()

        return {
          type: 'TRANSFER_DEPOSIT',
          ref,
          date,
          payee,
          channel,
          amount: parseCurrency(amount),
          balance: parseCurrency(balance),

          ...(bank && {bank}),
        }
      }

      if (meta.startsWith('Paid for')) {
        const paymentMatches = paymentMatcher.exec(meta)
        if (!paymentMatches) return err('PAYMENT')

        let [_, ref, paymentMeta] = paymentMatches
        paymentMeta = paymentMeta.trim()

        const paymentAmountMatches = paymentAmountMatcher.exec(paymentMeta)
        if (!paymentAmountMatches) return err('PAYMENT_AMOUNT_MISSING')

        const [__, payee, amount] = paymentAmountMatches
        if (!payee) return err('PAYMENT_PAYEE_MISSING')

        return {
          type: 'PAYMENT',
          ref,
          date,
          channel,
          payee,
          amount: parseCurrency(amount),
          balance: parseCurrency(balance),
        }
      }

      if (meta.startsWith('KBANK PAYROLL Ref')) {
        const payrollMatches = payrollMatcher.exec(meta)
        if (!payrollMatches) return err('PAYROLL')

        const [_, ref, amount] = payrollMatches

        return {
          type: 'PAYROLL',
          ref,
          date,
          channel,
          amount: parseCurrency(amount),
          balance: parseCurrency(balance),
        }
      }

      return err('UNKNOWN')
    })
    .filter((x) => x)

  let transactions: Transaction[] = entries
    .filter((e) => e && !('error' in e))
    .map((tx) => tx as Transaction)
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  const errors = entries.filter((e) => e && 'error' in e)

  return {transactions, errors, lines}
}
