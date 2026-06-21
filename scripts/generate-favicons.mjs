import sharp from "sharp"
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const svg = readFileSync(join(root, "app/icon.svg"))

async function png(size) {
  return sharp(svg).resize(size, size).png().toBuffer()
}

const icon32 = await png(32)
const icon180 = await png(180)

writeFileSync(join(root, "app/apple-icon.png"), icon180)

// Minimal ICO: single 32×32 PNG entry
function buildIco(pngBuffer) {
  const pngOffset = 6 + 16
  const size = pngBuffer.length
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(1, 4)

  const entry = Buffer.alloc(16)
  entry.writeUInt8(32, 0)
  entry.writeUInt8(32, 1)
  entry.writeUInt8(0, 2)
  entry.writeUInt8(0, 3)
  entry.writeUInt16LE(1, 4)
  entry.writeUInt16LE(32, 6)
  entry.writeUInt32LE(size, 8)
  entry.writeUInt32LE(pngOffset, 12)

  return Buffer.concat([header, entry, pngBuffer])
}

writeFileSync(join(root, "app/favicon.ico"), buildIco(icon32))

console.log("Generated app/favicon.ico and app/apple-icon.png")
