/**
 * Role Composition Integration Test
 *
 * This test verifies that @!role:// references work with real role files
 * in the user's ~/.promptx/resource/role directory.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createRequire } from 'module';
import * as fs from 'fs';
import * as path from 'path';

const require = createRequire(import.meta.url);
const SemanticRenderer = require('../../src/dpml/SemanticRenderer');
const DPMLContentParser = require('../../src/dpml/DPMLContentParser');

// Helper to read file content
const readFile = (filePath) => fs.readFileSync(filePath, 'utf-8');

// User resource directory
const USER_RESOURCE_DIR = path.join(process.env.HOME, '.promptx/resource/role');

describe('Role Composition Integration Test', () => {
  let renderer;
  let parser;
  let mockResourceManager;

  // Real role contents
  let liutianchiContent;
  let venusContent;
  let directorContent;
  let compositeContent;

  beforeAll(() => {
    renderer = new SemanticRenderer({ renderMode: 'semantic' });
    parser = new DPMLContentParser();

    // Load real role files
    const liutianchiPath = path.join(USER_RESOURCE_DIR, 'liutianchi/liutianchi.role.md');
    const venusPath = path.join(USER_RESOURCE_DIR, 'venus/venus.role.md');
    const directorPath = path.join(USER_RESOURCE_DIR, 'director/director.role.md');
    const compositePath = path.join(USER_RESOURCE_DIR, 'acting-roundtable-v2/acting-roundtable-v2.role.md');

    // Check if files exist
    if (!fs.existsSync(liutianchiPath)) {
      console.log('Skipping integration test: liutianchi role not found');
      return;
    }

    liutianchiContent = readFile(liutianchiPath);
    venusContent = readFile(venusPath);
    directorContent = readFile(directorPath);
    compositeContent = readFile(compositePath);

    // Create mock resource manager that returns real file contents
    mockResourceManager = {
      resolve: async (ref) => {
        console.log(`[Mock] Resolving: ${ref}`);

        if (ref.includes('role://liutianchi')) {
          return { success: true, content: liutianchiContent };
        }
        if (ref.includes('role://venus')) {
          return { success: true, content: venusContent };
        }
        if (ref.includes('role://director')) {
          return { success: true, content: directorContent };
        }

        // For other references (thought://, knowledge://, execution://),
        // return a placeholder to avoid failures
        if (ref.includes('thought://') || ref.includes('knowledge://') || ref.includes('execution://')) {
          const resourceName = ref.split('://')[1];
          return {
            success: true,
            content: `<${ref.split('://')[0]}>\n[${resourceName} content placeholder]\n</${ref.split('://')[0]}>`
          };
        }

        return { success: false, error: { message: `Resource not found: ${ref}` } };
      }
    };
  });

  it('should load composite role and detect @!role:// references', () => {
    // Skip if files not found
    if (!compositeContent) {
      console.log('Skipping: composite role not found');
      return;
    }

    const personalityContent = parser.extractTagContent(compositeContent, 'personality');
    const references = parser.extractReferences(personalityContent);

    // Should find 3 role references
    const roleRefs = references.filter(r => r.protocol === 'role');
    expect(roleRefs.length).toBe(3);
    expect(roleRefs.map(r => r.resource)).toContain('liutianchi');
    expect(roleRefs.map(r => r.resource)).toContain('venus');
    expect(roleRefs.map(r => r.resource)).toContain('director');
  });

  it('should recursively render role references with real content', async () => {
    // Skip if files not found
    if (!compositeContent) {
      console.log('Skipping: composite role not found');
      return;
    }

    const personalityContent = parser.extractTagContent(compositeContent, 'personality');
    const tagSemantics = parser.parseTagContent(personalityContent, 'personality');

    const result = await renderer.renderSemanticContent(tagSemantics, mockResourceManager);

    console.log('\n=== Rendered Content Preview ===');
    console.log(result.substring(0, 2000));
    console.log('...\n');

    // Should contain all three role headers
    expect(result).toContain('🎭 组合角色：liutianchi');
    expect(result).toContain('🎭 组合角色：venus');
    expect(result).toContain('🎭 组合角色：director');

    // Should contain actual content from each role
    expect(result).toContain('刘天池');
    expect(result).toContain('中央戏剧学院');
    expect(result).toContain('维纳斯');
    expect(result).toContain('结构主义电影学');
    expect(result).toContain('电影导演');
    expect(result).toContain('视觉叙事');
  });

  it('should render nested references within roles', async () => {
    // Skip if files not found
    if (!compositeContent) {
      console.log('Skipping: composite role not found');
      return;
    }

    const personalityContent = parser.extractTagContent(compositeContent, 'personality');
    const tagSemantics = parser.parseTagContent(personalityContent, 'personality');

    const result = await renderer.renderSemanticContent(tagSemantics, mockResourceManager);

    // Should attempt to render nested thought:// and knowledge:// references
    // (using our mock placeholders)
    expect(result).toContain('思维模式') // From role rendering
    expect(result).toContain('行为原则') // From role rendering
  });

  it('should output structured content suitable for AI consumption', async () => {
    // Skip if files not found
    if (!compositeContent) {
      console.log('Skipping: composite role not found');
      return;
    }

    const personalityContent = parser.extractTagContent(compositeContent, 'personality');
    const tagSemantics = parser.parseTagContent(personalityContent, 'personality');

    const result = await renderer.renderSemanticContent(tagSemantics, mockResourceManager);

    // Check structure markers exist
    expect(result).toMatch(/## 🎭 组合角色/);
    expect(result).toMatch(/### 💭 思维模式/);

    // Should be valid markdown
    expect(result).not.toContain('<role>');
    expect(result).not.toContain('</role>');
    expect(result).not.toContain('@!role://'); // All references should be resolved
  });
});
