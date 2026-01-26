function lightenHex(hex: string): string {
  hex = hex.replace('#', '')

  // expand shorthand (#abc)
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('')
  }

  const num = parseInt(hex, 16)

  let r = (num >> 16) & 255
  let g = (num >> 8) & 255
  let b = num & 255

  const LIGHTEN = 100

  r = Math.min(255, r + LIGHTEN)
  g = Math.min(255, g + LIGHTEN)
  b = Math.min(255, b + LIGHTEN)

  return `rgb(${r}, ${g}, ${b})`
}

export default lightenHex