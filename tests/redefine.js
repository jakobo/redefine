/*
 * @venus-library mocha
 * @venus-include ../redefine.js
 */
describe('define', function() {
  describe('amd compatibility', function() {
    it('should have define.amd', function() {
      expect(define).to.be.ok();
    });
  });
});