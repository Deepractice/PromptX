/**
 * Evaluator interface for evaluating engram strength
 * @interface Evaluator
 */
class Evaluator {
  /**
   * Evaluate if an engram should be consolidated
   * @param {import('../../engram/Engram.js').default} engram - The engram to evaluate
   * @returns {boolean} - True if the engram passes evaluation
   */
  evaluate(engram) {
    throw new Error('Evaluator.evaluate() must be implemented');
  }
}

module.exports = Evaluator;