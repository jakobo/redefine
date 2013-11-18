/*!
Redefine
Copyright 2013 LinkedIn

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
/*
Redefine is a great utility for shimming AMD support in testing environments.
AMD offers a very effective way of managing dependency injection through
it's define(id, dependencies, factoryFunction) interface. However, your tests
should never be dependent on a module loader to function.

Enter Redefine. Redefine provides a define() method that caches AMD calls.
Simply include redefine.js before your module on the page, and it's definition
is held in a queue. You can then redirect the dependencies at-will:

```js
redefine()
  .save.as(localName)           // a local name in Redefine's cache
  .let(dependencyId)            // a dependency ID that was used in define()
  .be(resolvedObj)              // a resolved object. If a string, will map to a <localName> from another call
                                // if an object, will be substituted directly
  .let().be(X).from.exports()   // use X as module.exports, no matter if it's a module or string
  .let().be(X).from.redefine()  // use <localName> no matter what (will force a toString() on non string objects)
  .let().be()...                // etc
```

With the environment in place, you can then collect your exports:

var exports = redefine.exports(localName);

Some additional things you can do:

  * View debugging information with `console.log(redefine.debug());`
  * Reset the environment with `redefine.reset();`

When using this library, define() and require() have been overwritten. You can always restore them with

`redefine.restore()`

*/
var require, define, redefine;
(function() {
  // old require and define
  var oldRequire = require;
  var oldDefine = define;
  
  // a queue of all define() calls made
  var queue = [];
  
  // a map of redefine() calls and their
  // associated data objects
  var map = {};
  
  // a cache of exports so we don't re-run a factory
  // (which could screw up statically defined variables)
  var exportsCache = {};
  
  var count = 0;
  
  /**
   * Create a new redefine mapping. This allows define() to
   * stub dependencies
   * @function redefine
   * @param {String} as - the local variable to store exports in
   * @returns {redefiner}
   */
  redefine = function() {
    return new Redefiner();
  };
  
  /**
   * reset the redefine() environment
   * @function redefine.reset
   */
  redefine.reset = function() {
    count = 0;
    exportsCache = {};
    map = {};
    queue = [];
  };
  
  /**
   * Restore the original require / define to their former glory
   * @function redefine.restore
   */
  redefine.restore = function() {
    require = oldRequire;
    define = oldDefine;
  };
  
  /**
   * View debugging information about redefine
   * Very helpful when you're seeing bad dependencies
   * or mismatched counts
   * @function redefine.debug
   */
  redefine.debug = function() {
    return {
      queue: queue,
      map: map,
      exportsCache: exportsCache,
      count: count
    };
  };
  
  /**
   * Get the exports for an item declared with redefine()
   * @function redefine.exports
   * @returns {Object}
   */
  redefine.exports = function(ns) {
    if (count !== queue.length) {
      throw new Error('redefine() calls do not match define() calls. Not proceeding, as unexpected things could occur');
    }
    return map[ns]._.fn.getExports();
  };
  
  /**
   * Redefiner class. Data object representing a remapped define()
   * Takes a identifer (as) and will collect alternate dependencies,
   * a define() function associated with it, and can return the final
   * exports
   * @constructs Redefiner
   */
  function Redefiner() {
    var self = this;
    
    function genLet(also) {
      also = also || {};
      var ret = {
        /**
         * Resolve a dependency to an already existing object
         * must be followed by a call to be()
         * @method Redefiner.save.as.let
         * @param {String} lets - the requesting ID from define()
         * @returns {Object}
         */
        let: function(lets) {
          return {
            /**
             * Resolve a dependency to an already existing object
             * must be preceded by a call to let()
             * @method Redefiner.save.as.let.be
             * @param {Object} bes - the value to draw from (strings from redefiner, objects from literals)
             * @returns {Object}
             */
            be: function(bes) {
              // begin by assuming it is magic. It can be overridden
              // later
              if (typeof bes === 'string') {
                // must be from redefine
                self._.links[lets] = bes;
              }
              else {
                self._.depends[lets] = bes;
              }
              
              return genLet({
                from: {
                  /**
                   * Allows you to specify the origin for be() calls
                   * must be preceded by a call to let().be()
                   * this origin is a literal export. A string implies the module
                   * actually said module.exports = 'mystring'
                   * @method Redefiner.save.as.let.be.from.exports
                   * @returns {Object}
                   */
                  exports: function() {
                    delete self._.links[lets];
                    self._.depends[lets] = bes;
                    return genLet();
                  },
                  /**
                   * Allows you to specify the origin for be() calls
                   * must be preceded by a call to let().be()
                   * this origin is from another redefiner call, and is not a
                   * literal export
                   * @method Redefiner.save.as.let.be.from.redefine
                   * @returns {Object}
                   */
                  redefine: function() {
                    delete self._.depends[lets];
                    if (typeof bes.toString === 'function') {
                      self._.links[lets] = bes.toString();
                    }
                    else {
                      self._.links[lets] = bes + '';
                    }
                    return genLet();
                  }
                }
              });
            }
          };
        }
      };
      for (var item in also) {
        if (also.hasOwnProperty(item)) {
          ret[item] = also[item];
        }
      }
      return ret;
    }
    
    this.save = {
      /**
       * Saves this redefiner to a specific name
       * @method Redefiner.save.as
       * @param {String} as - the namespace for this redefine object
       */
      as: function(as) {
        if (!queue[count]) {
          throw new Error('too many redefine() calls reached when trying to save ' + as);
        }
        self._.meta = queue[count];
        self._.id = as;
        count++;
        map[as] = self;
        return genLet();
      }
    };
    
    this._ = {
      links: {},
      depends: {},
      meta: {},
      id: null,
      fn: {
        /**
         * Get the exports for an assigned define() call
         * @method Redefiner#_.fn.getExports
         * @returns {Object}
         */
        getExports: function() {
          if (exportsCache[self._.id]) {
            return exportsCache[self._.id];
          }

          var factory = self._.meta.factory;
      
          // a local require is used because a module in AMD
          // can only use it's locally defined depedencies
          // just because we resolved an ID for another module
          // doesn't mean we can assume it was assigned here
          // during testing.
          var require = function(ns) {
            if (self._.depends[ns]) {
              return self._.depends[ns];
            }
            else if (self._.links[ns]) {
              return map[self._.links[ns]]._.fn.getExports();
            }
            else {
              throw new Error('unresolved dependency: ' + ns);
            }
          };
      
          // a fake module object adhearing to AMD / CJS standard
          var module = {
            id: '#testmodule',
            uri: 'http://example.com',
            exports: {}
          };
      
          // collect all the dependencies
          var deps = [];
          var depends = self._.meta.depends;
          var result;
          for (var d = 0, dlen = depends.length; d < dlen; d++) {
            switch(depends[d]) {
            case 'require':
              deps.push(require);
              break;
            case 'module':
              deps.push(module);
              break;
            case 'exports':
              deps.push(module.exports);
              break;
            default:
              deps.push(require(depends[d]));
            }
          }
      
          // if factory is a function, run it
          // if it's an object, store it (AMD)
          if (typeof factory === 'function') {
            result = factory.apply(module, deps);
            if (result) {
              module.exports = result;
            }
          }
          else if (typeof factory === 'object') {
            module.exports = factory;
          }
      
          // update cache
          exportsCache[self._.id] = module.exports;
          return exportsCache[self._.id];
        }
      }
    };
  }

  /**
   * Replaces the AMD define with a generic define that caches all arguments
   * @function define
   */
  define = function() {
    // this is a serial define and is no longer functioning asynchronously',
    function isArray(a) {
      return (Object.prototype.toString.call(a) === '[object Array]');
    }
    var deps = [];
    var depends = ['require', 'exports', 'module'];
    var factory = {};
    var exports = null;
    for (var i = 0, len = arguments.length; i < len; i++) {
      if (isArray(arguments[i])) {
        depends = arguments[i];
        break;
      }
    }
    factory = arguments[arguments.length - 1];

    queue.push({
      depends: depends,
      factory: factory
    });
  };
  define.amd = {};
  
  /**
   * Removes the global require() function in testing
   * A local require() is used automatically during the getExports call
   * @function require
   */
  require = function(deps, cb) {
    throw new Error('global require should not be used. You should mock this using sinon or another mocking library');
  };
  
  redefine.version = '__REDEFINE__VERSION__';
}());