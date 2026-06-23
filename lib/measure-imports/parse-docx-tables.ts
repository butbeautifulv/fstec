const PARAGRAPH_TOKEN_RE =
  /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:br\b[^>]*\/?>|<w:cr\b[^>]*\/?>|<w:tab\b[^>]*\/?>/g

function extractCellText(cellXml: string): string {
  const parts: string[] = []
  for (const match of cellXml.matchAll(PARAGRAPH_TOKEN_RE)) {
    if (match[1] !== undefined) parts.push(match[1])
    else parts.push(" ")
  }
  return parts.join("").replace(/\s+/g, " ").trim()
}

export async function extractDocxTablesAsync(buffer: Buffer): Promise<string[][][]> {
  const JSZip = (await import("jszip")).default
  const zip = await JSZip.loadAsync(buffer)
  const docXml = await zip.file("word/document.xml")?.async("string")
  if (!docXml) return []

  const tables: string[][][] = []
  const tableRegex = /<w:tbl[\s>][\s\S]*?<\/w:tbl>/g
  const rowRegex = /<w:tr[\s>][\s\S]*?<\/w:tr>/g
  const cellRegex = /<w:tc[\s>][\s\S]*?<\/w:tc>/g

  for (const tableMatch of docXml.matchAll(tableRegex)) {
    const rows: string[][] = []
    for (const rowMatch of tableMatch[0].matchAll(rowRegex)) {
      const cells: string[] = []
      for (const cellMatch of rowMatch[0].matchAll(cellRegex)) {
        cells.push(extractCellText(cellMatch[0]))
      }
      if (cells.some((c) => c)) rows.push(cells)
    }
    if (rows.length > 0) tables.push(rows)
  }

  return tables
}

/** Flatten table rows into pseudo-paragraphs for numbered parsing. */
export function tableRowsToParagraphs(tables: string[][][]): string[] {
  const paragraphs: string[] = []
  for (const table of tables) {
    for (const row of table) {
      const line = row.filter(Boolean).join(" — ")
      if (line) paragraphs.push(line)
    }
  }
  return paragraphs
}
