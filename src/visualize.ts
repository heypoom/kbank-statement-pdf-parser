import {DateTime} from 'luxon'

import type {Transaction} from './@types/transaction'

const txs: Transaction[] = require('../logs/transactions.json').map(
  (tx: Transaction) => ({
    ...tx,
    date: new Date(tx.date),
  })
)

for (const tx of txs) {
  const date = DateTime.fromJSDate(tx.date).toLocaleString(
    DateTime.DATETIME_MED
  )

  console.log(`${tx.payee || tx.channel} - ${tx.amount} THB @ ${date}`)
}
