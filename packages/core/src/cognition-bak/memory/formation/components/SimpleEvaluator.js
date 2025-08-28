const Evaluator = require('../interfaces/Evaluator.js');

/**
 * Simple evaluator that checks if engram strength > 0.5
 * @implements {Evaluator}
 */
class SimpleEvaluator extends Evaluator {
  /**
   * Evaluate if an engram should be consolidated based on strength > 0.5
   * @param {import('../../engram/Engram.js').default} engram - The engram to evaluate
   * @returns {boolean} - True if strength > 0.5
   */
  evaluate(engram) {
    return engram.strength > 0.5;
  }
}

module.exports = SimpleEvaluator;