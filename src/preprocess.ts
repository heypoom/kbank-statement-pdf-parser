const prefixPattern = /^(\d{2})-(\d{2})-(\d{2})/

const isLineValid = (line: string) => prefixPattern.test(line)

export function preprocessInput(input: string): string[] {
  const entries: string[] = []
  const sources = input.split('\n')

  let prev = ''
  let buffer = ''
  let lastLine = ''

  for (const line of sources) {
    if (
      line.startsWith('Issued by K PLUS') ||
      line.startsWith('KBPDF') ||
      line.startsWith('For more information')
    ) {
      buffer = ''
      prev = ''

      continue
    }

    const isValidLine = isLineValid(line)

    // flush previous item in buffer
    if (isValidLine && buffer) {
      if (prefixPattern.test(buffer)) {
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
    lastLine = line
  }

  entries.push(lastLine)

  return entries
}
