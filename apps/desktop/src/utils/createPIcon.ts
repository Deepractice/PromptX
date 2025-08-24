import { nativeImage } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

/**
 * 创建一个简单的 "P" 字母图标
 * 用于 macOS 托盘的 template image
 */
export function createPIcon(): Electron.NativeImage {
  const size = 22 // macOS 标准托盘图标大小
  const buffer = Buffer.alloc(size * size * 4)
  
  // 定义 "P" 字母的像素图案
  // 使用一个 22x22 的网格来绘制
  const pattern = [
    '                      ',
    '                      ',
    '   ############       ',
    '   ##############     ',
    '   ###        ####    ',
    '   ###         ###    ',
    '   ###         ###    ',
    '   ###        ####    ',
    '   ##############     ',
    '   #############      ',
    '   ###                ',
    '   ###                ',
    '   ###                ',
    '   ###                ',
    '   ###                ',
    '   ###                ',
    '   ###                ',
    '   ###                ',
    '                      ',
    '                      ',
    '                      ',
    '                      '
  ]
  
  // 绘制图标
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const offset = (y * size + x) * 4
      
      // 检查当前位置是否应该绘制
      const shouldDraw = pattern[y] && pattern[y]![x] === '#'
      
      if (shouldDraw) {
        // 黑色像素（在暗色模式下会显示为白色）
        buffer[offset] = 0       // R
        buffer[offset + 1] = 0   // G
        buffer[offset + 2] = 0   // B
        buffer[offset + 3] = 255 // A (完全不透明)
      } else {
        // 透明背景
        buffer[offset] = 0
        buffer[offset + 1] = 0
        buffer[offset + 2] = 0
        buffer[offset + 3] = 0
      }
    }
  }
  
  const icon = nativeImage.createFromBuffer(buffer, {
    width: size,
    height: size
  })
  
  // 标记为 template image
  icon.setTemplateImage(true)
  
  return icon
}

/**
 * 保存 P 图标到文件
 */
export function savePIcon(outputPath: string): void {
  const icon = createPIcon()
  const dir = path.dirname(outputPath)
  
  // 确保目录存在
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  
  // 保存为 PNG 文件
  fs.writeFileSync(outputPath, icon.toPNG())
  console.log(`P icon saved to: ${outputPath}`)
}