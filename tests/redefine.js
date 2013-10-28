/*
 * @venus-library mocha
 * @venus-include ../redefine.js
 */
describe('define', function() {
  beforeEach(function() {
    redefine.reset();
  });
  describe('amd compatibility', function() {
    it('should have define.amd', function() {
      expect(define).to.be.ok();
    });
    it('should be a function', function() {
      expect(define).to.be.a('function');
    })
  });
});

describe('redefine', function() {
  beforeEach(function() {
    redefine.reset();
  });
  describe('base properties', function() {
    it('should be a function', function() {
      expect(redefine).to.be.a('function');
    });
    it('should return an object (not a function)', function() {
      expect(redefine()).to.be.a('object');
      expect(redefine()).to.not.be.a('function');
    });
    it('should have the save.as interface', function() {
      expect(redefine().save.as).to.be.a('function');
    });
    it('should have let() after save.as', function() {
      define();
      expect(redefine().save.as('foo').let).to.be.a('function');
    });
    it('should only expose be() after a let() call', function() {
      define();
      define();
      expect(redefine().save.as('foo').let('bar').be).to.be.a('function');
      expect(redefine().save.as('foo').let('bar').let).to.be.an('undefined');
    });
    it('should expose let again after a be() call', function() {
      define();
      expect(redefine().save.as('foo').let('bar').be('baz').let).to.be.a('function');
    });
    it('should expose from.exports and from.redefine after a be() call', function() {
      define();
      define();
      expect(redefine().save.as('foo').let('bar').be('baz').from.exports).to.be.a('function');
      expect(redefine().save.as('foo').let('bar').be('baz').from.redefine).to.be.a('function');
    });
    it('should expose let again after from.* calls', function() {
      define();
      define();
      expect(redefine().save.as('foo').let('bar').be('baz').from.exports().let).to.be.a('function');
      expect(redefine().save.as('foo').let('bar').be('baz').from.redefine().let).to.be.a('function');
    });
  });
});

describe('end to end', function() {
  beforeEach(function() {
    redefine.reset();
  });
  describe('mocking a dependency with a concrete value', function() {
    it('should use a pre-defined value in let.be', function() {
      var myObj = {
        callMe: sinon.spy()
      };
      define(['one'], function(one) {
        one.callMe();
      });
      redefine().save.as('foo').let('one').be(myObj);
      redefine.exports('foo');
      expect(myObj.callMe.called).to.be.ok();
    });
  });
  describe('mocking a dependency with a redefine value', function() {
    it('should use a redefine result in let.be', function() {
      var myObj = {
        callMe: sinon.spy()
      };
      define(['one'], function(one) {
        return one;
      });
      define(['two'], function(two) {
        two.callMe();
      });
      redefine().save.as('foo').let('one').be(myObj);
      redefine().save.as('bar').let('two').be('foo');
      redefine.exports('bar');
      expect(myObj.callMe.called).to.be.ok();
    });
  });
  describe('can force-assign as either exports or an object', function() {
    it('should use a literal string for from.exports()', function() {
      var TEST_STRING = 'actualOne';
      define(['one'], function(one) {
        return {
          one: one
        }
      });
      redefine().save.as('foo').let('one').be(TEST_STRING).from.exports();
      var result = redefine.exports('foo');
      expect(result.one).to.equal(TEST_STRING);
    });
    it('should use toString() coercion for from.redefine()', function() {
      var myObj = {
        callMe: sinon.spy()
      };
      var myCoerced = {
        toString: function() {
          return 'foo';
        }
      };
      define(['one'], function(one) {
        return one;
      });
      define(['two'], function(two) {
        two.callMe();
      });
      redefine().save.as('foo').let('one').be(myObj);
      redefine().save.as('bar').let('two').be(myCoerced).from.redefine();
      redefine.exports('bar');
      expect(myObj.callMe.called).to.be.ok();
    })
  });
});
