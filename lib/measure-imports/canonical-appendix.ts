const DZO_SPLIT_RE = /ДКИТИ|ДЦОД|ДИТСБ|ДИТСУП|Обласов|копия/i

/** Canonical FSTEC appendix: «Приложение 240 93 1234.docx» */
export const CANONICAL_APPENDIX_RE = /^Приложение 240 93 \d+\.docx$/i

export function isCanonicalAppendixFile(originalName: string): boolean {
  return CANONICAL_APPENDIX_RE.test(originalName.trim())
}

export function isJunkAppendixFile(originalName: string): boolean {
  const name = originalName.trim()
  if (!/приложение/i.test(name) || !name.endsWith(".docx")) return false
  if (isCanonicalAppendixFile(name)) return false
  return true
}

export function folderToCorpusNumber(folder: string): string | null {
  const match = folder.match(/240 93 (\d+)/i)
  return match ? match[1]! : null
}

export function canonicalAppendixFileName(corpusNumber: string): string {
  return `Приложение 240 93 ${corpusNumber}.docx`
}

/**
 * Pick only the default FSTEC appendix for a corpus folder.
 * Skips DZO/employee splits (ДКИТИ, ДЦОД, ДИТСБ, …).
 */
export function pickCanonicalAppendixFile(
  files: string[],
  folder: string
): string | null {
  const corpusNumber = folderToCorpusNumber(folder)
  if (!corpusNumber) return null

  const canonical = canonicalAppendixFileName(corpusNumber)
  const hasCanonical = files.some(
    (f) => f.localeCompare(canonical, undefined, { sensitivity: "accent" }) === 0
  )
  if (hasCanonical) return canonical

  return null
}

export function filterCanonicalAppendixCandidates(files: string[]): string[] {
  return files.filter(
    (f) =>
      /приложение/i.test(f) &&
      f.endsWith(".docx") &&
      !/ответствен/i.test(f) &&
      !DZO_SPLIT_RE.test(f) &&
      isCanonicalAppendixFile(f)
  )
}
