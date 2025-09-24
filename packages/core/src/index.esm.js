/**
 * ESM Wrapper for @promptx/core
 * This file provides proper ESM exports by wrapping the CommonJS module
 */

import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// Create require function for this ESM module
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const require = createRequire(import.meta.url)

// Import the CommonJS module
const core = require('./index.js')

// Re-export everything as named exports
export const cognition = core.cognition
export const resource = core.resource
export const toolx = core.toolx
export const pouch = core.pouch
export const utils = core.utils

// Also export individual utils for convenience
export const version = core.version
export const DirectoryService = core.DirectoryService
export const ProjectManager = core.ProjectManager
export const ProjectPathResolver = core.ProjectPathResolver
export const ProjectConfig = core.ProjectConfig

// Default export
export default core