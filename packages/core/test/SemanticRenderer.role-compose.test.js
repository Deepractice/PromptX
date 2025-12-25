/**
 * SemanticRenderer Role Composition Test Suite
 * Test the @!role:// protocol support for role composition
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const SemanticRenderer = require('../src/dpml/SemanticRenderer');
const DPMLContentParser = require('../src/dpml/DPMLContentParser');

describe('SemanticRenderer - Role Composition', () => {
  let renderer;
  let parser;
  let mockResourceManager;

  beforeEach(() => {
    renderer = new SemanticRenderer({ renderMode: 'semantic' });
    parser = new DPMLContentParser();

    // Mock resource manager
    mockResourceManager = {
      resolve: vi.fn()
    };
  });

  describe('Role Protocol Support', () => {
    it('should have role in semanticHeaders', () => {
      // Test that role protocol has a semantic header
      const content = renderer.wrapReferenceContent('role', 'test-role', 'test content');
      expect(content).toContain('🎭 组合角色：test-role');
    });

    it('should parse @!role:// references', () => {
      const content = `
@!role://liutianchi
@!role://venus
@!role://director
`;
      const references = parser.extractReferences(content);

      expect(references).toHaveLength(3);
      expect(references[0].protocol).toBe('role');
      expect(references[0].resource).toBe('liutianchi');
      expect(references[1].protocol).toBe('role');
      expect(references[1].resource).toBe('venus');
      expect(references[2].protocol).toBe('role');
      expect(references[2].resource).toBe('director');
    });
  });

  describe('Recursive Role Rendering', () => {
    it('should recursively render role content with nested references', async () => {
      // Mock a role that contains knowledge references
      const roleContent = `
<role>
# Test Role

<personality>
I am a test role.
@!knowledge://test-knowledge
</personality>

<principle>
Follow best practices.
</principle>

<knowledge>
Domain knowledge here.
</knowledge>

</role>
`;

      const knowledgeContent = `
<knowledge>
This is the test knowledge content.
</knowledge>
`;

      mockResourceManager.resolve.mockImplementation(async (ref) => {
        if (ref.includes('role://test-role')) {
          return { success: true, content: roleContent };
        }
        if (ref.includes('knowledge://test-knowledge')) {
          return { success: true, content: knowledgeContent };
        }
        return { success: false, error: { message: 'Not found' } };
      });

      const tagSemantics = parser.parseTagContent('@!role://test-role', 'test');
      const result = await renderer.renderSemanticContent(tagSemantics, mockResourceManager);

      expect(result).toContain('🎭 组合角色：test-role');
      expect(result).toContain('💭 思维模式');
      expect(result).toContain('This is the test knowledge content');
    });
  });

  describe('Circular Reference Detection', () => {
    it('should detect and handle circular role references', async () => {
      // Role A references Role B, Role B references Role A
      const roleAContent = `
<role>
<personality>
I am Role A.
@!role://role-b
</personality>
</role>
`;

      const roleBContent = `
<role>
<personality>
I am Role B.
@!role://role-a
</personality>
</role>
`;

      mockResourceManager.resolve.mockImplementation(async (ref) => {
        if (ref.includes('role://role-a')) {
          return { success: true, content: roleAContent };
        }
        if (ref.includes('role://role-b')) {
          return { success: true, content: roleBContent };
        }
        return { success: false, error: { message: 'Not found' } };
      });

      const tagSemantics = parser.parseTagContent('@!role://role-a', 'test');
      const result = await renderer.renderSemanticContent(tagSemantics, mockResourceManager);

      // Should contain cycle detection warning
      expect(result).toContain('循环引用');
    });

    it('should allow same role in different branches', async () => {
      // Role Composite references both Role A and Role B
      // Both Role A and Role B reference a shared knowledge
      const compositeContent = `
<role>
<personality>
@!role://role-a
@!role://role-b
</personality>
</role>
`;

      const roleAContent = `
<role>
<knowledge>
@!knowledge://shared
</knowledge>
</role>
`;

      const roleBContent = `
<role>
<knowledge>
@!knowledge://shared
</knowledge>
</role>
`;

      const sharedKnowledge = `
<knowledge>
Shared knowledge content.
</knowledge>
`;

      mockResourceManager.resolve.mockImplementation(async (ref) => {
        if (ref.includes('role://composite')) {
          return { success: true, content: compositeContent };
        }
        if (ref.includes('role://role-a')) {
          return { success: true, content: roleAContent };
        }
        if (ref.includes('role://role-b')) {
          return { success: true, content: roleBContent };
        }
        if (ref.includes('knowledge://shared')) {
          return { success: true, content: sharedKnowledge };
        }
        return { success: false, error: { message: 'Not found' } };
      });

      const tagSemantics = parser.parseTagContent('@!role://composite', 'test');
      const result = await renderer.renderSemanticContent(tagSemantics, mockResourceManager);

      // Should successfully render without circular reference errors
      // because each branch has its own visitedRoles set
      expect(result).not.toContain('循环引用');
      expect(result).toContain('Shared knowledge content');
    });
  });

  describe('Multi-Role Composition', () => {
    it('should compose multiple roles in a single personality tag', async () => {
      const role1Content = `
<role>
<personality>
I am Liu Tianchi, acting teacher.
</personality>
<principle>
Stanislavski method.
</principle>
</role>
`;

      const role2Content = `
<role>
<personality>
I am Venus, film theorist.
</personality>
<principle>
Structural analysis.
</principle>
</role>
`;

      const role3Content = `
<role>
<personality>
I am Director.
</personality>
<principle>
Visual storytelling.
</principle>
</role>
`;

      mockResourceManager.resolve.mockImplementation(async (ref) => {
        if (ref.includes('role://liutianchi')) {
          return { success: true, content: role1Content };
        }
        if (ref.includes('role://venus')) {
          return { success: true, content: role2Content };
        }
        if (ref.includes('role://director')) {
          return { success: true, content: role3Content };
        }
        return { success: false, error: { message: 'Not found' } };
      });

      const compositeSemantics = parser.parseTagContent(`
## 三位专家组成圆桌讨论

@!role://liutianchi
@!role://venus
@!role://director
`, 'personality');

      const result = await renderer.renderSemanticContent(compositeSemantics, mockResourceManager);

      expect(result).toContain('🎭 组合角色：liutianchi');
      expect(result).toContain('🎭 组合角色：venus');
      expect(result).toContain('🎭 组合角色：director');
      expect(result).toContain('Liu Tianchi');
      expect(result).toContain('Venus');
      expect(result).toContain('Director');
    });
  });

  describe('Error Handling', () => {
    it('should gracefully handle role resolution failure', async () => {
      mockResourceManager.resolve.mockResolvedValue({
        success: false,
        error: { message: 'Role not found in registry' }
      });

      const tagSemantics = parser.parseTagContent('@!role://nonexistent', 'test');
      const result = await renderer.renderSemanticContent(tagSemantics, mockResourceManager);

      expect(result).toContain('引用加载失败');
      expect(result).toContain('nonexistent');
    });

    it('should handle resolve exceptions gracefully', async () => {
      mockResourceManager.resolve.mockRejectedValue(new Error('Network error'));

      const tagSemantics = parser.parseTagContent('@!role://broken', 'test');
      const result = await renderer.renderSemanticContent(tagSemantics, mockResourceManager);

      expect(result).toContain('引用解析异常');
      expect(result).toContain('Network error');
    });
  });
});
