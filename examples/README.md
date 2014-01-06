# A __redefine__ example #
This example gives a thorough use case for define; one module has dependencies on other modules, which in turn have their own dependencies.

The basic premise is to include all your JS on the page, use redefine to override the define() method, and redirect the dependencies appropriately.

#### Overview ####
##### The HTML #####
Given the html in [index.html](./index.html), we can see that we include redefine first, followed by all the modules.

```HTML
<head>
	<script src="../redefine.js"></script>
	<script src="one/one.js"></script>
	<script src="two/two.js"></script>
	<script src="two/three/three.js"></script>
	<script src="four.js"></script>
</head>
```

Later in the document we include [sample.js](./sample.js), just before the closing body tag.  This is the file that acutally
uses redefine() to map the dependencies and outputs.

```html
	...
	<script src="sample.js"></script>
</body>
```

The most important thing to note in the html is the order of the files.  Redefine is included first so it can overwrite the
define() function.  The remaining files can be included in any order, but __ORDER MATTERS__, since each define() call is added to a
 queue in the redefine library.  The calls to redefine() in sample.js must match the order of the script tags in the head of index.html.


##### Sample.js #####
This is the file that leverages redefine.  The code we're interested in:

```js
redefine()
  .save.as('my_one');
redefine()
  .save.as('my_two')
  .let('two/three/three').be('my_three');
redefine().save.as('my_three');
redefine()
  .save.as('my_four')
  .let('one/one').be('my_one').from.redefine()
  .let('two/two').be('my_two')
  .let('not/used').be('not_used_exports').from.exports();

var four = redefine.exports('my_four');
```

As mentioned before, the order of the redfine() calls mirror the order of script tags in index.html.  Each call to redefine() essentially
maps that module to a namespace we create with '.save.as('{localName}')'.  

If there are dependencies for a given call, they are mapped by calling '.let('{dependencyId}').be({resolvedObj}), where {dependencyId} matches the parameter in the original define() call, and {resolvedObj} is whatever object we want to be passed in for that parameter.
If a string, will map to a {localName} from another call if an object, will be substituted directly.

#### Line - by - Line ####
Let's go line by line through the [index.html](./index.html) and [sample.js](./sample.js) code from above, and see how redefine handles it.

##### One.js #####
The first file included after redefine.js is [one.js](./one/one.js), which looks like this:

```js
define(function() {
  return {
    name: 'one'
  };
});
```

When this is run by the browser, redefine.js will have already been loaded and overwritten the define() function.  So this call to define() in one.js will add the function and its dependencies (which are undefined) to the queue of calls to define.

In sample.js we see:
```js
redefine()
  .save.as('my_one');
```

This maps the first item in the queue to the {localName} of 'my_one'.


##### Two.js #####
The next file included is [two.js](./two/two.js):

```js
define(['two/three/three'], function(three) {
  return {
    name: 'two',
    three: three
  };
});
```
This is also added to redefine's queue, with a list of dependencies that need to be met.

In samplejs we see:

```js
redefine()
  .save.as('my_two')
  .let('two/three/three').be('my_three');
```

This maps the next item in the queue to the {localName} of 'my_two' AND maps the requirement of '/two/three/three' (note the exact match) to another resolve object named 'my_three'.  

Calls to redfine configure the mappings between moduels, their requirements, and the supplied object mapping. The objects aren't resolved until a call to redefine.exports({localName}), we are just establishing the mapping.


##### Three.js #####
The next file is [three.js](./two/three/three.js):

```js
define([], function() {
  return {
    name: 'three'
  };
});
```

This is also added to the queue, with an empty list of dependencies.

In samplejs:

```js
redefine().save.as('my_three');
```

Simple maps the next define() call in the queue to the localName of 'my_three'.  When two js is resolved, this local object will be used to satisfy the requirement of 'two/three/three'.

##### Four.js #####
Finally we have [four.js](./four.js), which utilizes the all the other files:

```js
define(['one/one', 'two/two'], function(one, two) {
  return {
    name: 'four',
    one: one.name,
    two: two.name,
    three: two.three.name
  };
});
```

In sample.js we setup the localName for the define call, as well as redirect all the dependencies to our own objects.

```js
redefine()
  .save.as('my_four')
  .let('one/one').be('my_one').from.redefine()
  .let('two/two').be('my_two')
  .let('not/used').be('not_used_exports').from.exports();
```

Just like the other calls, this creates another localName for the next item in the define() queue; 'my_four'.  We also redirect the 'one/one' and 'two/two' dependencies to objects we have already defined.  

The call '.from.redefine()' for the 'one/one' dependecy shows how its possible to explicity set a dependency to be from another redefine call.

Once all the define() calls have been mapped, the modules can be exported and used:

```js
var four = redefine.exports('my_four');
```

This call will actually instaniate the module we've defined as 'my_four', looking up and instantiating the dependencies we have setup using calls to let().