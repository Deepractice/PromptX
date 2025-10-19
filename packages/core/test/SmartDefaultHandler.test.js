/**
 * SmartDefaultHandler Test Suite
 * Test the isDefaultDuplicate() bug where partial duplicates cause all named exports to be lost
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const SmartDefaultHandler = require('../src/toolx/module/normalize/handlers/SmartDefaultHandler');

describe('SmartDefaultHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new SmartDefaultHandler();
  });

  describe('isDefaultDuplicate()', () => {
    it('should return false when only SOME exports are duplicates', () => {
      // This reproduces the @alicloud/openapi-client bug
      const MainClass = function Config() {};
      const Helper1 = function Params() {};
      const Helper2 = function OpenApiRequest() {};

      const module = {
        default: MainClass,
        Config: MainClass,        // Same as default - duplicate
        Params: Helper1,          // Different - NOT duplicate!
        OpenApiRequest: Helper2   // Different - NOT duplicate!
      };

      const realKeys = ['Config', 'Params', 'OpenApiRequest'];

      // EXPECTED: false (because not ALL exports are duplicates)
      // ACTUAL (buggy): true (because ONE export is duplicate)
      const result = handler.isDefaultDuplicate(module, realKeys);

      expect(result).toBe(false);
    });

    it('should return true when ALL exports are duplicates', () => {
      const OnlyClass = function OnlyClass() {};

      const module = {
        default: OnlyClass,
        OnlyClass: OnlyClass  // Same reference
      };

      const realKeys = ['OnlyClass'];

      const result = handler.isDefaultDuplicate(module, realKeys);

      expect(result).toBe(true);
    });

    it('should return false when no exports match default', () => {
      const MainClass = function MainClass() {};
      const Helper = function Helper() {};

      const module = {
        default: MainClass,
        Helper: Helper  // Different
      };

      const realKeys = ['Helper'];

      const result = handler.isDefaultDuplicate(module, realKeys);

      expect(result).toBe(false);
    });

    it('should handle object modules with partial duplicates', () => {
      const mainObj = { foo: 1, bar: 2 };
      const helper = { baz: 3 };

      const module = {
        default: mainObj,
        main: mainObj,  // Same reference
        helper: helper  // Different!
      };

      const realKeys = ['main', 'helper'];

      // Should return false because helper is different
      const result = handler.isDefaultDuplicate(module, realKeys);

      expect(result).toBe(false);
    });
  });

  describe('process() with partial duplicates', () => {
    it('should NOT return only default when module has non-duplicate exports', async () => {
      // Simulate @alicloud/openapi-client structure
      const Config = function Config() {};
      const Params = function Params() {};
      const OpenApiRequest = function OpenApiRequest() {};

      const module = {
        default: Config,
        Config: Config,              // Duplicate
        Params: Params,              // NOT duplicate
        OpenApiRequest: OpenApiRequest  // NOT duplicate
      };

      const result = await handler.process(module, '@alicloud/openapi-client');

      // Should NOT handle this module (let MultiExportHandler handle it)
      expect(result.handled).toBe(false);
    });

    it('should return default when all exports are duplicates', async () => {
      const OnlyClass = function OnlyClass() {};

      const module = {
        default: OnlyClass,
        OnlyClass: OnlyClass
      };

      const result = await handler.process(module, 'test-module');

      // Should handle and return default
      expect(result.handled).toBe(true);
      expect(result.result).toBe(OnlyClass);
    });
  });
});
