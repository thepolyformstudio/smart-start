/**
 * PWA Icon Generator Script
 * Generates all required icon sizes from a canvas-drawn logo.
 * Run this with: node scripts/generate-icons.mjs
 */
import { createCanvas } from 'canvas'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const iconsDir = path.join(__dirname, '..', 'public', 'icons')

// Create icons directory
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

function drawIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Background gradient (purple to teal)
  const gradient = ctx.createLinearGradient(0, 0, size, size)
  gradient.addColorStop(0, '#6C5CE7')
  gradient.addColorStop(1, '#00B894')

  // Rounded rectangle background
  const radius = size * 0.29
  ctx.beginPath()
  ctx.roundRect(0, 0, size, size, radius)
  ctx.fillStyle = gradient
  ctx.fill()

  // "S" letter
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = size * 0.073
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const cx = size * 0.5
  const cy = size * 0.5
  const s = size * 0.22

  ctx.beginPath()
  ctx.moveTo(cx + s * 0.6, cy - s * 0.75)
  ctx.quadraticCurveTo(cx + s * 0.3, cy - s * 1.1, cx - s * 0.1, cy - s * 0.85)
  ctx.quadraticCurveTo(cx - s * 0.7, cy - s * 0.55, cx - s * 0.6, cy - s * 0.1)
  ctx.quadraticCurveTo(cx - s * 0.4, cy + s * 0.4, cx + s * 0.1, cy + s * 0.3)
  ctx.quadraticCurveTo(cx + s * 0.7, cy + s * 0.2, cx + s * 0.6, cy + s * 0.7)
  ctx.quadraticCurveTo(cx + s * 0.5, cy + s * 1.1, cx - s * 0.1, cy + s * 1.0)
  ctx.quadraticCurveTo(cx - s * 0.5, cy + s * 0.95, cx - s * 0.6, cy + s * 0.75)
  ctx.stroke()

  // Star accent
  ctx.beginPath()
  const starX = size * 0.78
  const starY = size * 0.18
  const starR = size * 0.06
  ctx.arc(starX, starY, starR, 0, Math.PI * 2)
  ctx.fillStyle = '#FDCB6E'
  ctx.fill()

  return canvas
}

for (const size of sizes) {
  const canvas = drawIcon(size)
  const buffer = canvas.toBuffer('image/png')
  const filePath = path.join(iconsDir, `icon-${size}x${size}.png`)
  fs.writeFileSync(filePath, buffer)
  console.log(`Generated: icon-${size}x${size}.png`)
}

console.log('All icons generated!')
