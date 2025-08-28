/**
 * Bootstrap file - Sets up polyfills before importing anything else
 * This is the actual entry point for the Electron main process
 */

// Polyfill File API for undici (used by FastMCP)
// This MUST be done before any imports that might load undici
if (typeof globalThis.File === 'undefined') {
  // @ts-ignore
  globalThis.File = class File {
    name: string
    size: number
    type: string
    lastModified: number
    private _buffer: Buffer
    
    constructor(chunks: any[], name: string, options?: any) {
      this.name = name
      this.type = options?.type || 'application/octet-stream'
      this.lastModified = options?.lastModified || Date.now()
      
      // Convert chunks to buffer
      if (chunks.length === 0) {
        this._buffer = Buffer.alloc(0)
      } else if (Buffer.isBuffer(chunks[0])) {
        this._buffer = Buffer.concat(chunks as Buffer[])
      } else if (typeof chunks[0] === 'string') {
        this._buffer = Buffer.from(chunks.join(''))
      } else {
        this._buffer = Buffer.from(chunks.toString())
      }
      
      this.size = this._buffer.length
    }
    
    async arrayBuffer() {
      return this._buffer.buffer.slice(
        this._buffer.byteOffset,
        this._buffer.byteOffset + this._buffer.byteLength
      )
    }
    
    async text() {
      return this._buffer.toString('utf-8')
    }
    
    stream() {
      const { Readable } = require('stream')
      return Readable.from(this._buffer)
    }
    
    slice(start?: number, end?: number, contentType?: string) {
      const sliced = this._buffer.slice(start, end)
      // @ts-ignore
      return new File([sliced], this.name, { type: contentType || this.type })
    }
  }
}

// Now import the actual app
import('./index.js')