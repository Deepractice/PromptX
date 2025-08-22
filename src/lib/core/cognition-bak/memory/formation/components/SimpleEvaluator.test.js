const SimpleEvaluator = require('./SimpleEvaluator.js');
const { Engram } = require('../../../engram/Engram.js');

describe('SimpleEvaluator', () => {
  it('should evaluate engram with strength > 0.5 as true', () => {
    const evaluator = new SimpleEvaluator();
    const engram = new Engram('Test memory', 'mindmap\n  root)Test)');
    engram.strength = 0.6;
    
    expect(evaluator.evaluate(engram)).toBe(true);
  });

  it('should evaluate engram with strength = 0.5 as false', () => {
    const evaluator = new SimpleEvaluator();
    const engram = new Engram('Test memory', 'mindmap\n  root)Test)');
    engram.strength = 0.5;
    
    expect(evaluator.evaluate(engram)).toBe(false);
  });

  it('should evaluate engram with strength < 0.5 as false', () => {
    const evaluator = new SimpleEvaluator();
    const engram = new Engram('Test memory', 'mindmap\n  root)Test)');
    engram.strength = 0.3;
    
    expect(evaluator.evaluate(engram)).toBe(false);
  });

  it('should handle edge case of strength = 0', () => {
    const evaluator = new SimpleEvaluator();
    const engram = new Engram('Test memory', 'mindmap\n  root)Test)');
    engram.strength = 0;
    
    expect(evaluator.evaluate(engram)).toBe(false);
  });

  it('should handle edge case of strength = 1', () => {
    const evaluator = new SimpleEvaluator();
    const engram = new Engram('Test memory', 'mindmap\n  root)Test)');
    engram.strength = 1;
    
    expect(evaluator.evaluate(engram)).toBe(true);
  });

  it('should handle high strength values', () => {
    const evaluator = new SimpleEvaluator();
    const engram = new Engram('Test memory', 'mindmap\n  root)Test)');
    engram.strength = 0.9;
    
    expect(evaluator.evaluate(engram)).toBe(true);
  });

  it('should handle strength close to threshold from above', () => {
    const evaluator = new SimpleEvaluator();
    const engram = new Engram('Test memory', 'mindmap\n  root)Test)');
    engram.strength = 0.51;
    
    expect(evaluator.evaluate(engram)).toBe(true);
  });

  it('should handle strength close to threshold from below', () => {
    const evaluator = new SimpleEvaluator();
    const engram = new Engram('Test memory', 'mindmap\n  root)Test)');
    engram.strength = 0.49;
    
    expect(evaluator.evaluate(engram)).toBe(false);
  });
});