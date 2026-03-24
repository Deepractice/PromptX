/**
 * 飞书会话管理
 *
 * 维护 飞书 chat_id ↔ agentx imageId 的双向映射。
 * 每个飞书群/私聊对应一个 agentx 对话（image）。
 */

import * as logger from '@promptx/logger'
import type { AgentX } from 'agentxjs'

export interface RoleConfig {
  name: string
  systemPrompt?: string
  mcpServers?: Record<string, unknown>
  disallowedTools?: string[]
  tools?: unknown[]
}

export class FeishuSessionManager {
  private chatToImage = new Map<string, string>()
  private imageToChat = new Map<string, string>()

  async getOrCreate(chatId: string, agentx: AgentX, roleConfig: RoleConfig): Promise<string> {
    const existing = this.chatToImage.get(chatId)
    if (existing) return existing

    logger.info(`[FeishuSession] Creating conversation for chatId=${chatId}, role=${roleConfig.name}`)

    const imageConfig: Record<string, unknown> = {
      name: `${roleConfig.name}_feishu_${Date.now()}`,
      description: `飞书接入 - ${roleConfig.name}`,
    }
    if (roleConfig.systemPrompt) imageConfig.systemPrompt = roleConfig.systemPrompt
    if (roleConfig.mcpServers) imageConfig.mcpServers = roleConfig.mcpServers
    if (roleConfig.disallowedTools?.length) imageConfig.disallowedTools = roleConfig.disallowedTools
    if (roleConfig.tools) imageConfig.tools = roleConfig.tools

    const containerId = `feishu_promptx`
    logger.info(`[FeishuSession] Calling image_create_request, containerId=${containerId}, config=`, JSON.stringify(imageConfig))
    const result = await agentx.request('image_create_request' as any, { containerId, config: imageConfig }) as any
    logger.info(`[FeishuSession] image_create_request result:`, JSON.stringify(result).slice(0, 500))
    const imageId = result?.data?.record?.imageId

    if (!imageId) {
      logger.error('[FeishuSession] No imageId in result:', JSON.stringify(result))
      throw new Error('创建 agentx 对话失败')
    }

    logger.info(`[FeishuSession] Calling image_run_request, imageId=${imageId}`)
    await agentx.request('image_run_request' as any, { imageId })

    this.chatToImage.set(chatId, imageId)
    this.imageToChat.set(imageId, chatId)

    logger.info(`[FeishuSession] Mapped chatId=${chatId} → imageId=${imageId}`)
    return imageId
  }

  getChatId(imageId: string): string | undefined {
    return this.imageToChat.get(imageId)
  }

  clear() {
    this.chatToImage.clear()
    this.imageToChat.clear()
    logger.info('[FeishuSession] All sessions cleared')
  }
}
