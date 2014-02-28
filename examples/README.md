# How to use redefine #
This example gives a thorough use case for define; one module has dependencies on other modules, which in turn have their own dependencies.

The basic premise is to include all your JS on the page, use redefine to override the define() method, and redirect the dependencies appropriately.

#### Examples ####
A few different use cases are shown in the examples below.  The canonical example is the most thorough, and explains what's happening through out.  The other
examples show how redefine can be used in more advanced scenarios, or in testing frameworks.

* [Canonical Example](#canonical)
* [Advanced](#advanced)
* [Within a Test Framework](#testing)
    * [QUnit](#qunit)
    * [VenusJS](#venusjs)


<a name="canonical"></a>
## Canonical ##
Given some html and JS, this example will give a line by line explanation of how redefine works.

##### The HTML #####
Using the html in [index.html](./index.html), we can see that we include redefine first, followed by all the modules.

```HTML
<head>
  <script src="../redefine.js"></script>
  <script src="modules/four.js"></script>
</head>
```

Later in the document we include [mockfour.js](./mockfour.js), just before the closing body tag.  This is the file that acutally
uses redefine() to map the dependencies and outputs.

```html
  ...
  <script src="mockfour.js"></script>
</body>
```

The most important thing to note in the html is the order of the files.  Redefine is included first so it can overwrite the
define() function.  The remaining files can be included in any order, but __ORDER MATTERS__, since each define() call is added to a
 queue in the redefine library.  The call to redefine() in mockfour.js must match the order of the script tags in the head of index.html.

In this example there is only one call to define, so we only need one call to redefine.

##### mockfour.js #####
This is the file that leverages redefine.  The code we're interested in:

```js
redefine()
  .save.as('four')
  .let('one/one').be({
    name: 'one'
  })
  .let('two/two').be({
    name: 'two',
    three: {
      name: 'three'
    }
  });

var four = redefine.exports('four');
```

As mentioned before, the order of the redfine() calls mirror the order of script tags in index.html.  Each call to redefine() essentially
maps that module to a namespace we create with '.save.as('{localName}')'.

If there are dependencies for a given call, they are mapped by calling '.let('{dependencyId}').be({resolvedObj}), where {dependencyId} matches the parameter in the original define() call, and {resolvedObj} is whatever object we want to be passed in for that parameter.
If a string, will map to a {localName} from another call if an object, will be substituted directly.

#### Line - by - Line ####
Let's go line by line through the [index.html](./index.html) and [mockfour.js](./mockfour.js) code from above, and see how redefine handles it.

##### four.js #####
The first file included after redefine.js is [four.js](./modules/four.js), which looks like this:

```js
define(['one/one', 'two/two'], function(one, two) {
  return {
    name: 'four',
    one: one.name,
    two: two.name,
    three: two.three.name
  };
});
});
```

When this is run by the browser, redefine.js will have already been loaded and overwritten the define() function.  So this call to define() in four.js will add the function and its dependencies (one/one, and two/tow) to the queue of calls to define.

In mockfour.js we see:
```js
redefine()
  .save.as('four')
```

This maps the first item in the queue to the {localName} of 'four'.

Then we define the objects to satisfy the dependencies of four.js.

In samplejs we see:

```js
  let('one/one').be({
    name: 'one'
  })
  .let('two/two').be({
    name: 'two',
    three: {
      name: 'three'
    }
  });
```

This maps the requirement of 'one/one' (note the exact match to the dependencies in four.js) to the object literal with a name property of 'one'.  We do this again for the 'two/two' dependency.
[two.js](./modules/two/two.js) has its own dependency of 'three' (in [three.js](./modules/two/three/three.js)).  Although we're not including the file in our page, we should mock our objects accurately, so this call also sets the 'three' property of the 'two' object.

Calls to redfine configure the mappings between moduels, their requirements, and the supplied object mapping. The objects aren't resolved until a call to redefine.exports({localName}), we are just establishing the mapping.

Once all the define() calls have been mapped, the modules can be exported and used:

```js
var four = redefine.exports('four');
```

This call will actually instaniate the module we've defined as 'four', looking up and instantiating the dependencies we have setup using calls to let().  Now, the four module will work with zero dependencies.


<a name="advanced"></a>
## Advanced ##
The power of redefine doesn't really stop there though. If we have say module five which calls methods, we can partner with sinon to do more detailed testing and inspection.
```js
// five.js
define(['one/one', 'six/six'], function(one, six) {
  return {
    name: 'six',
    one: one.name,
    six: six.name()
  }
});
```

Your new HTML would be:
```html
<script src="redefine.js"></script>
<script src="modules/five.js"></script>
<script src="mockfive.js"></script>
```

With mockfive as:

```js
redefine()
  .save.as('six/six');

// make a local sinon version
var six = redefine.exports('six/six');
var mockSix = sinon.mock(six);

redefine()
  .save.as('five')
  .let('one/one').be({
    name: 'one'
  })
  .let('six/six').be(mockSix);

// later on, mock it by reference (sinon.js)
mockSix.expects('name').returns('six');
```

<a name="testing"></a>
## Testing ##
The obvious use of redefine is for testing.  Below are some simple examples of using redefine within a testing framework.

__Both use the canonical example from before.__

<a name="qunit"></a>
## Qunit ##

```js
module('four');
test('names set', function() {
  var four = redefine.exports('four'); // matches .save.as
  equal(four.name, 'four');
  equal(four.one, 'one');
  equal(four.two, 'two');
  equal(four.three, 'three');
});
```

<a name="venusjs"></a>
## Venus JS ##

Assuming a mochajs style test.

```js
/**
 *  @venus-library mocha
 *  @venus-include {path_to_redefine}/redefine.min.js
 *  @venus-include four.js
 *  @venus-include mockfour.js
*/

describe('Redefine Number Modules', function () {
  it('Names should be set', function() {
    var four = redefine.exports('four'); // matches .save.as
    equal(four.name, 'four');
    equal(four.one, 'one');
    equal(four.two, 'two');
    equal(four.three, 'three');
  });
});
```