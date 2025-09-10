#!/usr/bin/env node

/**
 * 测试 DiscoverCommand 的系统角色加载
 * 直接使用源代码，不需要重启 MCP Server
 */

const path = require('path')

// 设置模块别名
const Module = require('module')
const originalResolveFilename = Module._resolveFilename
Module._resolveFilename = function(request, parent, isMain) {
  if (request.startsWith('~/')) {
    return originalResolveFilename.call(this, request.replace('~/', path.join(__dirname, '../src/')), parent, isMain)
  }
  return originalResolveFilename.call(this, request, parent, isMain)
}

async function testDiscover() {
  console.log('🧪 测试 DiscoverCommand 系统角色加载...\n')
  
  try {
    // 直接加载源代码
    const DiscoverCommand = require('../src/pouch/commands/DiscoverCommand')
    
    console.log('1️⃣ 创建 DiscoverCommand 实例...')
    const command = new DiscoverCommand()
    
    console.log('2️⃣ 执行 execute() 方法...')
    const result = await command.execute({})
    
    // 解析输出
    const response = result.response
    
    // 调试：显示 result 结构
    console.log('\nResult 结构:', Object.keys(result))
    
    if (!response) {
      console.log('\n❌ 没有 response 属性')
      console.log('完整结果:', result)
      return
    }
    
    // 提取统计信息
    const statsMatch = response.match(/角色总数: (\d+)个.*系统(\d+)个.*项目(\d+)个.*用户(\d+)个/)
    
    if (statsMatch) {
      console.log('\n📊 资源统计:')
      console.log(`  - 角色总数: ${statsMatch[1]} 个`)
      console.log(`  - 系统角色: ${statsMatch[2]} 个`)
      console.log(`  - 项目角色: ${statsMatch[3]} 个`)  
      console.log(`  - 用户角色: ${statsMatch[4]} 个`)
      
      if (parseInt(statsMatch[2]) > 0) {
        console.log('\n✅ 系统角色加载成功！')
        
        // 提取系统角色列表
        const systemSection = response.match(/📦 \*\*系统角色\*\*.*?(?=📦|\n👤|\n---)/s)
        if (systemSection) {
          const roles = systemSection[0].match(/- `([^`]+)`/g)
          if (roles) {
            console.log(`\n系统角色 (${roles.length} 个):`)
            roles.slice(0, 5).forEach(role => {
              const name = role.match(/`([^`]+)`/)[1]
              console.log(`  - ${name}`)
            })
            if (roles.length > 5) {
              console.log(`  ... 还有 ${roles.length - 5} 个`)
            }
          }
        }
      } else {
        console.log('\n❌ 系统角色数量为 0')
        
        // 调试：直接测试 PackageDiscovery
        console.log('\n3️⃣ 调试：直接测试 PackageDiscovery...')
        const PackageDiscovery = require('../src/resource/discovery/PackageDiscovery')
        const discovery = new PackageDiscovery(null)
        
        // 测试 discover
        const resources = await discovery.discover()
        console.log(`  - discover() 返回: ${resources.length} 个资源`)
        
        // 测试 getRegistryData
        const registryData = await discovery.getRegistryData()
        console.log(`  - getRegistryData() 返回: ${registryData.resources ? registryData.resources.length : 0} 个资源`)
        console.log(`  - registryData.size: ${registryData.size}`)
        
        // 显示前3个资源
        if (registryData.resources && registryData.resources.length > 0) {
          console.log('\n  前3个资源:')
          registryData.resources.slice(0, 3).forEach(r => {
            console.log(`    - ${r.id}: source=${r.source}, reference=${r.reference}`)
          })
        }
      }
    } else {
      console.log('\n❌ 无法解析输出统计信息')
      console.log('\n输出前500字符:')
      console.log(response.substring(0, 500))
    }
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message)
    console.error(error.stack)
  }
}

// 运行测试
testDiscover()