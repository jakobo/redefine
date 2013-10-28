Redefine is a great utility for shimming AMD support in testing environments. AMD offers a very effective way of managing dependency injection through it's define(id, dependencies, factoryFunction) interface. However, your tests should never be dependent on a module loader to function.

Enter Redefine. Redefine provides a define() method that caches AMD calls. Simply include redefine.js before your module on the page, and it's definition is held in a queue. You can then redirect the dependencies at-will:

```js
redefine()
  .save.as(localName) // a local name in Redefine's cache
  .let(dependencyId)  // a dependency ID that was used in define()
  .be(resolvedObj)    // a resolved object. If a string, will map to a <localName> from another call
                      // if an object, will be substituted directly
  .let()
    .be(X)
    .from.exports()   // use X as module.exports, no matter if it's a module or string
  .let()
    .be(X)
    .from.redefine()  // use <localName> no matter what
                      // (will force a toString() on non string objects)

  .let().be()...      // etc
```

With the environment in place, you can then collect your exports:

```js
var exports = redefine.exports(localName);
```

Some additional things you can do:

  * View debugging information with `console.log(redefine.debug());`
  * Reset the environment with `redefine.reset();`

When using this library, define() and require() have been overwritten. You can always restore them with

```js
redefine.restore();
```
