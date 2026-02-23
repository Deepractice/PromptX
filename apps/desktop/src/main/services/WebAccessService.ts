import * as http from 'node:http'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import * as crypto from 'node:crypto'
import { execSync } from 'node:child_process'
import * as logger from '@promptx/logger'

export interface WebAccessStatus {
  enabled: boolean
  url: string
  qrCodeDataUrl: string
  port: number
  token: string
}

export class WebAccessService {
  private server: http.Server | null = null
  private port: number = 5201
  private token: string = ''
  private agentxPort: number = 5200
  private containerId: string = 'promptx-desktop'

  setPort(port: number): void {
    this.port = port
  }

  async enable(agentxPort: number, containerId: string): Promise<WebAccessStatus> {
    if (this.server) {
      await this.disable()
    }

    this.agentxPort = agentxPort
    this.containerId = containerId
    this.token = crypto.randomBytes(4).toString('hex')

    const localIp = this.getLocalIp()
    const wsUrl = `ws://${localIp}:${this.agentxPort}`
    const url = `http://${localIp}:${this.port}?token=${this.token}&ws=${encodeURIComponent(wsUrl)}&containerId=${this.containerId}`

    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res)
    })

    await new Promise<void>((resolve, reject) => {
      this.server!.listen(this.port, '0.0.0.0', () => resolve())
      this.server!.on('error', reject)
    })

    logger.info(`Web access enabled: ${url}`)

    const qrCodeDataUrl = await this.generateQRCode(url)
    return { enabled: true, url, qrCodeDataUrl, port: this.port, token: this.token }
  }

  async disable(): Promise<void> {
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server!.close(() => resolve())
      })
      this.server = null
      logger.info('Web access disabled')
    }
  }

  isEnabled(): boolean {
    return this.server !== null
  }

  private handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    const reqUrl = new URL(req.url || '/', `http://localhost`)

    // CORS headers for WebSocket upgrade compatibility
    res.setHeader('Access-Control-Allow-Origin', '*')

    // Serve agentxjs browser bundle (no token needed - it's a public asset)
    if (reqUrl.pathname === '/agentxjs.js') {
      const bundlePath = path.join(__dirname, 'web-ui/agentxjs.js')
      if (fs.existsSync(bundlePath)) {
        res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' })
        fs.createReadStream(bundlePath).pipe(res)
      } else {
        res.writeHead(404)
        res.end('agentxjs bundle not found')
      }
      return
    }

    // Validate token for all other requests
    const reqToken = reqUrl.searchParams.get('token')
    if (reqToken !== this.token) {
      res.writeHead(403, { 'Content-Type': 'text/html' })
      res.end('<h1>403 Forbidden</h1><p>Invalid or missing token.</p>')
      return
    }

    // Serve main web UI
    const htmlPath = path.join(__dirname, 'web-ui/index.html')
    if (fs.existsSync(htmlPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      fs.createReadStream(htmlPath).pipe(res)
    } else {
      res.writeHead(404)
      res.end('Web UI not found')
    }
  }

  private getLocalIp(): string {
    // First: use routing table to find the interface with the default gateway
    try {
      if (process.platform === 'win32') {
        const output = execSync('route print 0.0.0.0 mask 0.0.0.0', { encoding: 'utf8', timeout: 3000 })
        // Line format: "  0.0.0.0   0.0.0.0   <gateway>   <interface-ip>   <metric>"
        const match = output.match(/\s+0\.0\.0\.0\s+0\.0\.0\.0\s+[\d.]+\s+([\d.]+)\s+/)
        if (match) {
          const ip = match[1]
          if (!ip.startsWith('169.254.') && ip !== '127.0.0.1') return ip
        }
      }
    } catch { /* fall through to scoring */ }

    // Fallback: score-based selection
    const interfaces = os.networkInterfaces()
    const candidates: { address: string; score: number }[] = []
    for (const ifaces of Object.values(interfaces)) {
      for (const iface of (ifaces || [])) {
        if (iface.family !== 'IPv4' || iface.internal) continue
        const addr = iface.address
        if (addr.startsWith('169.254.')) continue
        let score = 0
        if (addr.startsWith('192.168.')) score = 30
        else if (addr.startsWith('10.')) score = 20
        else if (/^172\.(1[6-9]|2\d|3[01])\./.test(addr)) score = 10
        candidates.push({ address: addr, score })
      }
    }
    if (candidates.length === 0) return '127.0.0.1'
    candidates.sort((a, b) => b.score - a.score)
    return candidates[0].address
  }

  private async generateQRCode(url: string): Promise<string> {
    try {
      const QRCode = require('qrcode')
      return await QRCode.toDataURL(url, { width: 256, margin: 2 })
    } catch {
      logger.warn('qrcode package not available, QR code generation skipped')
      return ''
    }
  }
}

export const webAccessService = new WebAccessService()
