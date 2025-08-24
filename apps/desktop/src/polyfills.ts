/**
 * Polyfills for Electron environment
 * Must be imported before any other modules
 */

// Override console methods to prevent EPIPE errors in Electron
// This must be done before any modules that use console are imported
const originalConsoleLog = console.log
const originalConsoleError = console.error
const originalConsoleWarn = console.warn
const originalConsoleInfo = console.info

const safeConsoleMethod = (original: typeof console.log) => {
  return (...args: any[]) => {
    try {
      original.apply(console, args)
    } catch (error: any) {
      // Ignore EPIPE errors silently
      if (error.code !== 'EPIPE' && error.message !== 'write EPIPE') {
        // For non-EPIPE errors, try to log to stderr if possible
        try {
          process.stderr.write(`Console error: ${error.message}\n`)
        } catch {
          // Ignore if stderr is also unavailable
        }
      }
    }
  }
}

console.log = safeConsoleMethod(originalConsoleLog)
console.error = safeConsoleMethod(originalConsoleError) 
console.warn = safeConsoleMethod(originalConsoleWarn)
console.info = safeConsoleMethod(originalConsoleInfo)

// Fix for undici requiring File API which doesn't exist in Node.js/Electron main process
// This is needed for FastMCP which uses undici for HTTP operations
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
        this._buffer = Buffer.concat(chunks)
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
      return new File([sliced], this.name, { type: contentType || this.type })
    }
  }
}

// Also ensure Blob is available (though it should be in Node.js 18+)
if (typeof globalThis.Blob === 'undefined') {
  // @ts-ignore
  globalThis.Blob = class Blob {
    private _buffer: Buffer
    type: string
    size: number
    
    constructor(chunks: any[], options?: any) {
      this.type = options?.type || ''
      
      if (chunks.length === 0) {
        this._buffer = Buffer.alloc(0)
      } else if (Buffer.isBuffer(chunks[0])) {
        this._buffer = Buffer.concat(chunks)
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
      return new Blob([sliced], { type: contentType || this.type })
    }
  }
}

export {}