/**
 * 飞书 ↔ agentx 消息桥接
 *
 * 收到飞书消息 → 调用 agentx message_send_request
 * 用 text_delta 累积回复文本
 * conversation_end 时把完整回复发回飞书
 */

import * as logger from '@promptx/logger'
import type { AgentX } from 'agentxjs'
import type { FeishuBot, FeishuInboundMessage } from './FeishuBot'
import type { FeishuSessionManager, RoleConfig } from './FeishuSessionManager'

export class FeishuBridge {
  private agentx: AgentX
  private bot: FeishuBot
  private sessionManager: FeishuSessionManager
  private roleConfig: RoleConfig
  private pendingReply = new Map<string, string>()
  private unsubscribes: Array<() => void> = []

  constructor(agentx: AgentX, bot: FeishuBot, sessionManager: FeishuSessionManager, roleConfig: RoleConfig) {
    this.agentx = agentx
    this.bot = bot
    this.sessionManager = sessionManager
    this.roleConfig = roleConfig
    this.setupListeners()
  }

  async handleFeishuMessage(msg: FeishuInboundMessage) {
    const preview = typeof msg.content === 'string' ? msg.content.slice(0, 50) : '[image]'
    logger.info(`[FeishuBridge] ← Feishu [${msg.chatId}]: ${preview}`)

    let agentxContent: any
    if (typeof msg.content === 'object' && msg.content.type === 'image') {
      agentxContent = [
        { type: 'image', data: msg.content.data, mediaType: msg.content.mediaType },
      ]
    } else {
      agentxContent = msg.content
    }

    try {
      logger.info(`[FeishuBridge] Getting/creating session for chatId=${msg.chatId}`)
      const imageId = await this.sessionManager.getOrCreate(
        msg.chatId,
        this.agentx,
        this.roleConfig,
      )
      logger.info(`[FeishuBridge] Session ready, imageId=${imageId}`)

      logger.info(`[FeishuBridge] Sending image_run_request, imageId=${imageId}`)
      await this.agentx.request('image_run_request' as any, { imageId }).catch((e: any) => {
        logger.warn(`[FeishuBridge] image_run_request failed (may be already running):`, e?.message)
      })

      logger.info(`[FeishuBridge] Sending message_send_request, imageId=${imageId}, contentType=${typeof agentxContent}`)
      await this.agentx.request('message_send_request' as any, {
        imageId,
        content: agentxContent,
      })
      logger.info(`[FeishuBridge] message_send_request completed`)

      await this.bot.addReaction(msg.messageId, 'THUMBSUP').catch(() => {})
    } catch (err: any) {
      logger.error('[FeishuBridge] Failed to forward message:', err.message, err.stack)
    }
  }

  destroy() {
    this.pendingReply.clear()
    for (const unsub of this.unsubscribes) {
      try { unsub() } catch { /* ignore */ }
    }
    this.unsubscribes = []
  }

  private setupListeners() {
    const unsubDelta = this.agentx.on('text_delta' as any, (e: any) => {
      const imageId = e.context?.imageId
      if (!imageId) return
      const text = e.data?.text
      if (!text) return
      const existing = this.pendingReply.get(imageId) ?? ''
      this.pendingReply.set(imageId, existing + text)
      if (!existing) {
        logger.info(`[FeishuBridge] First text_delta for imageId=${imageId}: "${text.slice(0, 50)}"`)
      }
    })
    if (unsubDelta) this.unsubscribes.push(unsubDelta as any)

    const unsubEnd = this.agentx.on('conversation_end' as any, async (e: any) => {
      const imageId = e.context?.imageId
      logger.info(`[FeishuBridge] conversation_end event, imageId=${imageId}, event keys=${Object.keys(e || {})}`)
      if (!imageId) return

      const chatId = this.sessionManager.getChatId(imageId)
      logger.info(`[FeishuBridge] conversation_end: chatId=${chatId} for imageId=${imageId}`)
      if (!chatId) return

      const text = this.pendingReply.get(imageId)
      this.pendingReply.delete(imageId)

      if (!text) {
        logger.warn(`[FeishuBridge] conversation_end but no reply for imageId=${imageId}`)
        return
      }

      logger.info(`[FeishuBridge] → Feishu [${chatId}]: (${text.length} chars) ${text.slice(0, 100)}...`)
      try {
        await this.bot.sendText(chatId, text)
        logger.info(`[FeishuBridge] sendText completed for chatId=${chatId}`)
      } catch (err: any) {
        logger.error(`[FeishuBridge] sendText failed:`, err.message)
      }
    })
    if (unsubEnd) this.unsubscribes.push(unsubEnd as any)

    logger.info('[FeishuBridge] Listeners registered')
  }
}
