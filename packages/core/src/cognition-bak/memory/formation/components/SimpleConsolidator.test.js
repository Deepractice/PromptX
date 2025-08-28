const SimpleConsolidator = require('./SimpleConsolidator.js');
const { Engram } = require('../../../engram/Engram.js');
const Semantic = require('../../components/Semantic.js');

describe('SimpleConsolidator', () => {
  let consolidator;
  let semantic;
  let longTerm;

  beforeEach(() => {
    // Mock Semantic
    semantic = {
      remember: jest.fn()
    };
    // Mock LongTerm
    longTerm = {
      remember: jest.fn()
    };
    consolidator = new SimpleConsolidator(longTerm, semantic);
  });

  it('should consolidate engram with schema', () => {
    // 创建一个有 schema 的 engram (schema 是 Mermaid 字符串)
    const engram = new Engram('Test memory', 'mindmap\n  root)Test)\n    memory');
    
    // 执行巩固
    consolidator.consolidate(engram);
    
    // 验证 engram 被存入长期记忆
    expect(longTerm.remember).toHaveBeenCalledWith(engram);
    
    // 验证 semantic.remember 被调用
    expect(semantic.remember).toHaveBeenCalledWith(engram);
  });

  it('should consolidate multiple engrams', () => {
    // 创建多个 engram
    const engram1 = new Engram('Memory 1', 'mindmap\n  root)Memory1)');
    const engram2 = new Engram('Memory 2', 'mindmap\n  root)Memory2)');
    
    // 执行巩固
    consolidator.consolidate(engram1);
    consolidator.consolidate(engram2);
    
    // 验证所有 engram 都被处理
    expect(longTerm.remember).toHaveBeenCalledTimes(2);
    expect(semantic.remember).toHaveBeenCalledTimes(2);
  });
});