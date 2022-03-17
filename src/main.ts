import {readFile, writeFile} from 'fs/promises'
import pdf from 'pdf-parse'

import {parseStatement} from './parse'

async function main() {
  const file = await readFile('./sample/statement.pdf')
  const data = await pdf(file)

  const {transactions, errors} = parseStatement(data.text)
  console.log('Tx:', transactions.length)

  await writeFile('./logs/raw.txt', data.text)

  await writeFile(
    './logs/transactions.json',
    JSON.stringify(transactions, null, 2)
  )

  await writeFile('./logs/errors.json', JSON.stringify(errors, null, 2))
}

main()
