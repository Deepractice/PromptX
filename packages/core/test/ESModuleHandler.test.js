/**
 * ESModuleHandler Test Suite
 * Test that ES modules with both default and named exports are preserved correctly
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const ESModuleHandler = require('../src/toolx/module/normalize/handlers/ESModuleHandler');

describe('ESModuleHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new ESModuleHandler();
  });

  describe('process() with ES Modules', () => {
    it('should preserve both default and named exports', async () => {
      // Simulate: export default Config; export { Params, OpenApiRequest };
      const Config = function Config() {};
      const Params = function Params() {};
      const OpenApiRequest = function OpenApiRequest() {};

      const module = {
        __esModule: true,
        default: Config,
        Config: Config,
        Params: Params,
        OpenApiRequest: OpenApiRequest
      };

      const result = await handler.process(module);

      expect(result.handled).toBe(true);
      expect(result.result).toBe(module); // Should return the WHOLE module
      expect('Config' in result.result).toBe(true);
      expect('Params' in result.result).toBe(true);
      expect('OpenApiRequest' in result.result).toBe(true);
    });

    it('should return default only when no named exports exist', async () => {
      const OnlyDefault = function OnlyDefault() {};

      const module = {
        __esModule: true,
        default: OnlyDefault
      };

      const result = await handler.process(module);

      expect(result.handled).toBe(true);
      expect(result.result).toBe(OnlyDefault); // Should return default only
    });

    it('should return whole module when no default but has named exports', async () => {
      const foo = function foo() {};
      const bar = function bar() {};

      const module = {
        __esModule: true,
        foo: foo,
        bar: bar
      };

      const result = await handler.process(module);

      expect(result.handled).toBe(true);
      expect(result.result).toBe(module);
    });

    it('should not handle non-ES modules', async () => {
      const module = {
        default: function() {},
        foo: 'bar'
        // No __esModule flag
      };

      const result = await handler.process(module);

      expect(result.handled).toBe(false);
    });
  });
});
