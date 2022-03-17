const prefixPattern = /^(\d{2})-(\d{2})-(\d{2})/

export function preprocessInput(input: string): string[] {
  const entries: string[] = []
  const sources = input.split('\n')

  let prev = ''
  let buffer = ''

  for (const line of sources) {
    if (line.startsWith('KBPDF')) continue

    if (line.startsWith('Issued by K PLUS')) {
      buffer = ''
      prev = ''
      continue
    }

    const isValidLine = prefixPattern.test(line)

    // flush previous item in buffer
    if (isValidLine && buffer) {
      if (prefixPattern.test(buffer)) {
        console.log('>>> FLUSHING =', buffer)
        entries.push(buffer)
      }

      buffer = ''
    } else if (!isValidLine) {
      // Current line not valid, appending to buffer
      if (buffer) buffer += line
      else buffer = prev + line
    } else if (!buffer) {
      entries.push(prev)
    }

    prev = line
  }

  return entries
}
