#!/usr/bin/env node

const UserDiscovery = require('../src/lib/core/resource/discovery/UserDiscovery')
const logger = require('../src/lib/utils/logger')

async function refreshUserRegistry() {
  try {
    logger.info('🔄 开始刷新用户注册表...')
    
    const userDiscovery = new UserDiscovery()
    const registryData = await userDiscovery.generateRegistry()
    
    logger.info(`✅ 用户注册表刷新完成，发现 ${registryData.size} 个资源`)
    
    // 显示所有角色资源
    const roleResources = []
    for (const resource of registryData.resources) {
      if (resource.protocol === 'role') {
        roleResources.push(resource.id)
      }
    }
    
    if (roleResources.length > 0) {
      logger.info(`📋 发现的角色资源: ${roleResources.join(', ')}`)
    }
    
  } catch (error) {
    logger.error(`❌ 刷新注册表失败: ${error.message}`)
    process.exit(1)
  }
}

refreshUserRegistry()