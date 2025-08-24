import * as fs from 'fs'
import * as path from 'path'
import { nativeImage } from 'electron'

// Create a template icon file for macOS
export function createTemplateIcon(): void {
  const size = 22 // Standard macOS menu bar size
  const buffer = Buffer.alloc(size * size * 4)
  
  // Draw a simple "P" letter
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const offset = (y * size + x) * 4
      
      let isBlack = false
      
      // Draw "P" shape with thicker lines
      // Vertical line (left side)
      if (x >= 5 && x <= 8 && y >= 4 && y <= 17) {
        isBlack = true
      }
      
      // Top curve
      if (y >= 4 && y <= 7) {
        if ((x >= 5 && x <= 15) || 
            (x >= 14 && x <= 16 && y <= 8)) {
          isBlack = true
        }
      }
      
      // Middle curve
      if (y >= 10 && y <= 13) {
        if ((x >= 5 && x <= 15) ||
            (x >= 14 && x <= 16 && y >= 8 && y <= 13)) {
          isBlack = true
        }
      }
      
      // Right vertical connector
      if (x >= 14 && x <= 16 && y >= 4 && y <= 13) {
        isBlack = true
      }
      
      if (isBlack) {
        // Black pixels (will be white in dark mode)
        buffer[offset] = 0
        buffer[offset + 1] = 0
        buffer[offset + 2] = 0
        buffer[offset + 3] = 255
      } else {
        // Transparent
        buffer[offset] = 0
        buffer[offset + 1] = 0
        buffer[offset + 2] = 0
        buffer[offset + 3] = 0
      }
    }
  }
  
  // Save as PNG with "Template" in filename
  const iconPath = path.join(__dirname, '..', 'assets', 'icons', 'trayTemplate.png')
  const icon = nativeImage.createFromBuffer(buffer, {
    width: size,
    height: size
  })
  
  fs.writeFileSync(iconPath, icon.toPNG())
  console.log(`Created template icon at: ${iconPath}`)
  
  // Also create @2x version for retina displays
  const size2x = 44
  const buffer2x = Buffer.alloc(size2x * size2x * 4)
  
  for (let y = 0; y < size2x; y++) {
    for (let x = 0; x < size2x; x++) {
      const offset = (y * size2x + x) * 4
      
      let isBlack = false
      
      // Scale up the P shape
      if (x >= 10 && x <= 16 && y >= 8 && y <= 34) {
        isBlack = true
      }
      
      if (y >= 8 && y <= 14) {
        if ((x >= 10 && x <= 30) || 
            (x >= 28 && x <= 32 && y <= 16)) {
          isBlack = true
        }
      }
      
      if (y >= 20 && y <= 26) {
        if ((x >= 10 && x <= 30) ||
            (x >= 28 && x <= 32 && y >= 16 && y <= 26)) {
          isBlack = true
        }
      }
      
      if (x >= 28 && x <= 32 && y >= 8 && y <= 26) {
        isBlack = true
      }
      
      if (isBlack) {
        buffer2x[offset] = 0
        buffer2x[offset + 1] = 0
        buffer2x[offset + 2] = 0
        buffer2x[offset + 3] = 255
      } else {
        buffer2x[offset] = 0
        buffer2x[offset + 1] = 0
        buffer2x[offset + 2] = 0
        buffer2x[offset + 3] = 0
      }
    }
  }
  
  const icon2xPath = path.join(__dirname, '..', 'assets', 'icons', 'trayTemplate@2x.png')
  const icon2x = nativeImage.createFromBuffer(buffer2x, {
    width: size2x,
    height: size2x
  })
  
  fs.writeFileSync(icon2xPath, icon2x.toPNG())
  console.log(`Created @2x template icon at: ${icon2xPath}`)
}

// Run if called directly
if (require.main === module) {
  createTemplateIcon()
}