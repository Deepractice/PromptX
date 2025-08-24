#!/usr/bin/env node

import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const rootDir = path.join(__dirname, '..')
const svgPath = '/Users/sean/Management/ContradictionManagement/projects/PromptX/assets/logo/Creative PromptX Duck Logo 4.svg'
const iconsDir = path.join(rootDir, 'assets', 'icons')

async function generateIcons() {
  console.log('Generating app icons...')
  
  // Ensure icons directory exists
  await fs.mkdir(iconsDir, { recursive: true })
  
  // Copy SVG to our assets folder
  const localSvgPath = path.join(iconsDir, 'logo.svg')
  await fs.copyFile(svgPath, localSvgPath)
  console.log(`Copied SVG to ${localSvgPath}`)
  
  // Create a 1024x1024 PNG from SVG using sips (macOS built-in tool)
  const pngPath = path.join(iconsDir, 'icon.png')
  try {
    // First convert SVG to PNG using sips
    await execAsync(`sips -s format png "${localSvgPath}" --out "${pngPath}" -z 1024 1024`)
    console.log(`Created PNG: ${pngPath}`)
  } catch (error) {
    console.error('Failed to convert SVG to PNG. You may need to manually create a PNG version.')
    console.error(error)
    
    // Fallback: copy the nuwa logo if it exists
    const nuwaLogo = '/Users/sean/Management/ContradictionManagement/projects/PromptX/assets/logo/nuwa-logo.png'
    try {
      await fs.copyFile(nuwaLogo, pngPath)
      console.log(`Using nuwa-logo.png as fallback`)
    } catch {
      console.error('No fallback PNG available')
      return
    }
  }
  
  // Create different sizes for various platforms
  const sizes = [16, 32, 64, 128, 256, 512, 1024]
  
  for (const size of sizes) {
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`)
    try {
      await execAsync(`sips -z ${size} ${size} "${pngPath}" --out "${outputPath}"`)
      console.log(`Created ${size}x${size} icon`)
    } catch (error) {
      console.error(`Failed to create ${size}x${size} icon:`, error)
    }
  }
  
  // Create .icns for macOS (requires iconutil)
  try {
    const iconsetPath = path.join(iconsDir, 'icon.iconset')
    await fs.mkdir(iconsetPath, { recursive: true })
    
    // Copy icons with correct names for iconset
    const iconsetSizes = [
      { size: 16, name: 'icon_16x16.png' },
      { size: 32, name: 'icon_16x16@2x.png' },
      { size: 32, name: 'icon_32x32.png' },
      { size: 64, name: 'icon_32x32@2x.png' },
      { size: 128, name: 'icon_128x128.png' },
      { size: 256, name: 'icon_128x128@2x.png' },
      { size: 256, name: 'icon_256x256.png' },
      { size: 512, name: 'icon_256x256@2x.png' },
      { size: 512, name: 'icon_512x512.png' },
      { size: 1024, name: 'icon_512x512@2x.png' }
    ]
    
    for (const { size, name } of iconsetSizes) {
      const srcPath = path.join(iconsDir, `icon-${size}x${size}.png`)
      const destPath = path.join(iconsetPath, name)
      await fs.copyFile(srcPath, destPath)
    }
    
    // Generate .icns file
    const icnsPath = path.join(iconsDir, 'icon.icns')
    await execAsync(`iconutil -c icns "${iconsetPath}" -o "${icnsPath}"`)
    console.log('Created icon.icns for macOS')
    
    // Clean up iconset directory
    await fs.rm(iconsetPath, { recursive: true })
  } catch (error) {
    console.error('Failed to create .icns file:', error)
    console.log('You may need to install Xcode Command Line Tools')
  }
  
  // Note: Creating .ico for Windows requires additional tools
  console.log('\nNote: Windows .ico file needs to be created manually or with additional tools.')
  console.log('You can use online converters or tools like ImageMagick.')
  
  console.log('\nIcon generation complete!')
}

generateIcons().catch(console.error)