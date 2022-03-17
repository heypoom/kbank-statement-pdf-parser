import hash from 'object-hash'

import {Transaction} from '../@types/transaction'

export const id = (tx: Transaction) => {
  delete tx.id

  return hash(tx)
}
