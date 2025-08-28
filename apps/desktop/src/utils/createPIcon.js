"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPIcon = createPIcon;
exports.savePIcon = savePIcon;
var electron_1 = require("electron");
var fs = require("fs");
var path = require("path");
/**
 * 创建一个简单的 "P" 字母图标
 * 用于 macOS 托盘的 template image
 */
function createPIcon() {
    var size = 22; // macOS 标准托盘图标大小
    var buffer = Buffer.alloc(size * size * 4);
    // 定义 "P" 字母的像素图案
    // 使用一个 22x22 的网格来绘制
    var pattern = [
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
    ];
    // 绘制图标
    for (var y = 0; y < size; y++) {
        for (var x = 0; x < size; x++) {
            var offset = (y * size + x) * 4;
            // 检查当前位置是否应该绘制
            var shouldDraw = pattern[y] && pattern[y][x] === '#';
            if (shouldDraw) {
                // 黑色像素（在暗色模式下会显示为白色）
                buffer[offset] = 0; // R
                buffer[offset + 1] = 0; // G
                buffer[offset + 2] = 0; // B
                buffer[offset + 3] = 255; // A (完全不透明)
            }
            else {
                // 透明背景
                buffer[offset] = 0;
                buffer[offset + 1] = 0;
                buffer[offset + 2] = 0;
                buffer[offset + 3] = 0;
            }
        }
    }
    var icon = electron_1.nativeImage.createFromBuffer(buffer, {
        width: size,
        height: size
    });
    // 标记为 template image
    icon.setTemplateImage(true);
    return icon;
}
/**
 * 保存 P 图标到文件
 */
function savePIcon(outputPath) {
    var icon = createPIcon();
    var dir = path.dirname(outputPath);
    // 确保目录存在
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    // 保存为 PNG 文件
    fs.writeFileSync(outputPath, icon.toPNG());
    console.log("P icon saved to: ".concat(outputPath));
}
