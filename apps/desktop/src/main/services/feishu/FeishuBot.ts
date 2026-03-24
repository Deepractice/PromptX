/**
 * 飞书 WebSocket Bot
 *
 * 使用飞书官方长连接模式，无需公网 IP。
 * 依赖 @larksuiteoapi/node-sdk 提供的 ws 客户端。
 */

import * as logger from '@promptx/logger'

let larkModule: any = null
async function getLark() {
  if (larkModule) return larkModule
  try {
    larkModule = await import('@larksuiteoapi/node-sdk')
  } catch {
    larkModule = null
  }
  return larkModule
}

export interface FeishuConfig {
  appId: string
  appSecret: string
  encryptKey?: string
}

export interface FeishuInboundMessage {
  messageId: string
  chatId: string
  senderId: string
  content: string | { type: 'image'; data: string; mediaType: string }
  chatType: string
}

export class FeishuBot {
  private config: FeishuConfig
  private client: any = null
  private wsClient: any = null
  private running = false
  private onMessage: ((msg: FeishuInboundMessage) => void) | null = null

  constructor(config: FeishuConfig) {
    this.config = config
  }

  async start(onMessage: (msg: FeishuInboundMessage) => void) {
    const lark = await getLark()
    if (!lark) {
      throw new Error('@larksuiteoapi/node-sdk 未安装')
    }
    logger.info('[FeishuBot] lark module keys:', Object.keys(lark))
    logger.info('[FeishuBot] lark.Client:', typeof lark.Client)
    logger.info('[FeishuBot] lark.default:', typeof lark.default)
    logger.info('[FeishuBot] lark.EventDispatcher:', typeof lark.EventDispatcher)
    logger.info('[FeishuBot] lark.WSClient:', typeof lark.WSClient)

    // Handle CJS/ESM interop — exports may be on .default
    const sdk = lark.Client ? lark : lark.default || lark

    if (!sdk.Client || !sdk.EventDispatcher || !sdk.WSClient) {
      throw new Error('@larksuiteoapi/node-sdk 模块结构异常，无法找到 Client/EventDispatcher/WSClient')
    }

    if (!this.config.appId || !this.config.appSecret) {
      throw new Error('飞书 appId 和 appSecret 不能为空')
    }

    this.onMessage = onMessage
    this.running = true

    this.client = new sdk.Client({
      appId: this.config.appId,
      appSecret: this.config.appSecret,
      loggerLevel: sdk.LoggerLevel?.error ?? 4,
    })

    const eventDispatcher = new sdk.EventDispatcher({
      encryptKey: this.config.encryptKey || '',
    }).register({
      'im.message.receive_v1': (data: any) => this.handleIncoming(data),
    })

    logger.info('[FeishuBot] EventDispatcher created and registered')

    this.wsClient = new sdk.WSClient({
      appId: this.config.appId,
      appSecret: this.config.appSecret,
      loggerLevel: sdk.LoggerLevel?.error ?? 4,
    })

    logger.info('[FeishuBot] WSClient created, starting...')
    this.wsClient.start({ eventDispatcher }).catch((err: any) => {
      if (this.running) {
        logger.error('[FeishuBot] WebSocket error:', err.message)
      }
    })

    logger.info('[FeishuBot] Started, appId:', this.config.appId)
  }

  async stop() {
    this.running = false
    try {
      this.wsClient?.close?.({ force: true })
    } catch { /* ignore */ }
    this.client = null
    this.wsClient = null
    logger.info('[FeishuBot] Stopped')
  }

  async sendText(chatId: string, text: string) {
    if (!this.client) return
    const receiveIdType = chatId.startsWith('oc_') ? 'chat_id' : 'open_id'
    try {
      const res = await this.client.im.message.create({
        params: { receive_id_type: receiveIdType },
        data: {
          receive_id: chatId,
          msg_type: 'text',
          content: JSON.stringify({ text }),
        },
      })
      if (res.code !== 0) {
        logger.warn('[FeishuBot] Send failed:', res.code, res.msg)
      }
    } catch (err: any) {
      logger.error('[FeishuBot] sendText error:', err.message)
    }
  }

  async addReaction(messageId: string, emojiType = 'THUMBSUP') {
    if (!this.client) return
    try {
      await this.client.im.messageReaction.create({
        path: { message_id: messageId },
        data: { reaction_type: { emoji_type: emojiType } },
      })
    } catch { /* ignore */ }
  }

  private async handleIncoming(data: any) {
    logger.info('[FeishuBot] handleIncoming called, raw data keys:', Object.keys(data || {}))
    logger.info('[FeishuBot] handleIncoming data:', JSON.stringify(data, null, 2).slice(0, 1000))

    if (!this.running || !this.onMessage) {
      logger.warn('[FeishuBot] handleIncoming skipped: running=', this.running, 'onMessage=', !!this.onMessage)
      return
    }

    const msg = data.message
    const sender = data.sender
    logger.info('[FeishuBot] sender:', JSON.stringify(sender))
    logger.info('[FeishuBot] message:', JSON.stringify(msg).slice(0, 500))

    if (sender?.sender_type === 'bot') {
      logger.info('[FeishuBot] Skipping bot message')
      return
    }

    const senderId = sender?.sender_id?.open_id ?? 'unknown'
    const chatId = msg.chat_id
    const msgType = msg.message_type
    logger.info(`[FeishuBot] chatId=${chatId}, msgType=${msgType}, senderId=${senderId}`)

    let content: string | { type: 'image'; data: string; mediaType: string }
    try {
      const parsed = JSON.parse(msg.content || '{}')
      logger.info('[FeishuBot] parsed content:', JSON.stringify(parsed))
      if (msgType === 'text') {
        const text = parsed.text || ''
        if (!text.trim()) {
          logger.info('[FeishuBot] Skipping empty text')
          return
        }
        content = text
      } else if (msgType === 'image') {
        const fileKey = parsed.image_key
        if (!fileKey || !this.client) return
        try {
          const res = await this.client.im.messageResource.get({
            params: { type: 'image' },
            path: { message_id: msg.message_id, file_key: fileKey },
          })
          const stream = res.getReadableStream()
          const chunks: Buffer[] = []
          await new Promise<void>((resolve, reject) => {
            stream.on('data', (chunk: Buffer) => chunks.push(chunk))
            stream.on('end', resolve)
            stream.on('error', reject)
          })
          const base64 = Buffer.concat(chunks).toString('base64')
          content = { type: 'image', data: base64, mediaType: 'image/jpeg' }
        } catch (err: any) {
          logger.warn(`[FeishuBot] Failed to download image ${fileKey}:`, err.message)
          return
        }
      } else {
        return
      }
    } catch (parseErr) {
      logger.error('[FeishuBot] Failed to parse message content:', String(parseErr))
      return
    }

    logger.info(`[FeishuBot] Dispatching to onMessage: chatId=${chatId}, contentType=${typeof content}`)
    this.onMessage({
      messageId: msg.message_id,
      chatId,
      senderId,
      content,
      chatType: msg.chat_type,
    })
  }
}
